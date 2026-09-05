import argparse
import sys
import json
from models.database import engine, Base, SessionLocal
from models.schema_models import RawSourceData
from extractors.player_extractor import PlayerExtractor
from extractors.team_extractor import TeamExtractor
from extractors.tournament_extractor import TournamentExtractor
from extractors.match_extractor import MatchExtractor
from extractors.statistics_extractor import StatisticsExtractor
from extractors.map_extractor import MapExtractor
from extractors.esportstats_extractor import EsportStatsExtractor

from transform.clean_players import clean_player_record
from transform.clean_teams import clean_team_record
from transform.clean_tournaments import clean_tournament_record
from transform.clean_matches import clean_match_record
from transform.clean_statistics import clean_stat_record

from load.postgres_loader import PostgresLoader

def init_db():
    print("Initializing Database Schema...")
    Base.metadata.create_all(bind=engine)
    print("Database Schema initialized successfully.")

def run_extraction(args):
    print("=== STARTING EXTRACTION PHASE ===")
    
    # Check flags, default to extracting all if --full is run
    run_all = args.full or args.update
    
    if run_all or args.players:
        PlayerExtractor().extract()
    if run_all or args.teams:
        TeamExtractor().extract()
    if run_all or args.tournaments:
        TournamentExtractor().extract()
    if run_all or args.matches:
        MatchExtractor().extract()
    if run_all or args.stats:
        StatisticsExtractor().extract()
    if run_all or args.maps:
        MapExtractor().extract()
    if run_all or args.esportstats:
        EsportStatsExtractor().extract()
        
    print("=== EXTRACTION PHASE COMPLETE ===")

def run_transform_and_load(loader: PostgresLoader):
    print("=== STARTING TRANSFORM & LOAD (ETL) PHASE ===")
    db = SessionLocal()
    loader.reset_report()
    
    try:
        # 1. Fetch raw items from DB
        raw_items = db.query(RawSourceData).order_by(RawSourceData.id.asc()).all()
        print(f"Found {len(raw_items)} raw records to process.")
        
        # 2. Process Organizations & Teams first (dependency tree)
        team_items = [r for r in raw_items if r.entity_type == "team"]
        for raw in team_items:
            cleaned = clean_team_record(raw)
            if cleaned:
                loader.load_organization(db, cleaned["organization"], cleaned["team"])
                
        # 3. Process Players next
        player_items = [r for r in raw_items if r.entity_type == "player"]
        for raw in player_items:
            cleaned = clean_player_record(raw)
            if cleaned:
                loader.load_player(db, cleaned["player"], cleaned["history"])
                
        # 4. Process Tournaments
        tournament_items = [r for r in raw_items if r.entity_type == "tournament"]
        for raw in tournament_items:
            cleaned = clean_tournament_record(raw)
            if cleaned:
                loader.load_tournament(db, cleaned)
                
        # 5. Process Matches
        match_items = [r for r in raw_items if r.entity_type == "match"]
        for raw in match_items:
            cleaned = clean_match_record(raw)
            if cleaned:
                # Map standard mock tournament_id to internal UUID if matches loaded
                # We locate the tournament by matching the mock ID or series
                loader.load_match(db, cleaned)

        # 6. Process Player Statistics
        stat_items = [r for r in raw_items if r.entity_type == "statistics"]
        for raw in stat_items:
            cleaned = clean_stat_record(raw)
            if cleaned:
                loader.load_statistics(db, cleaned)

        # 7. Process Map events & drop details
        map_items = [r for r in raw_items if r.entity_type == "map"]
        for raw in map_items:
            data = json.loads(raw.raw_json)
            # Map items are directly cleaned as dict structures inside loader
            loader.load_map_intel(db, data, raw.source)

        print("=== ETL PHASE COMPLETE ===")
    except Exception as e:
        print(f"Error during ETL execution: {e}")
        db.rollback()
    finally:
        db.close()

def run_validation(db, loader: PostgresLoader):
    print("=== RUNNING DATA QUALITY VALIDATION ===")
    # Missing fields, duplicate checks, negative checks, invalid maps
    issues = []
    
    # 1. Negative stats check
    from models.schema_models import PlayerMatchStats, Match, Player
    pms = db.query(PlayerMatchStats).all()
    for stat in pms:
        if (stat.finishes is not None and stat.finishes < 0) or \
           (stat.kills is not None and stat.kills < 0) or \
           (stat.damage is not None and stat.damage < 0):
            issues.append(f"Validation Issue: Negative values found in PlayerMatchStats ID {stat.stat_id}")

    # 2. Invalid maps check
    allowed_maps = ["erangel", "miramar", "rondo", "sanhok", "vikendi"]
    matches = db.query(Match).all()
    for match in matches:
        if match.map.lower().strip() not in allowed_maps:
            issues.append(f"Validation Issue: Invalid map name '{match.map}' in Match ID {match.match_id}")

    # 3. Duplicate players check
    players = db.query(Player).all()
    ign_cache = set()
    for p in players:
        ign_normalized = p.ign.lower().strip()
        if ign_normalized in ign_cache:
            issues.append(f"Validation Issue: Duplicate player IGN '{p.ign}' detected.")
        ign_cache.add(ign_normalized)

    # 4. Report out
    print(f"Validation completed. Found {len(issues)} data quality anomalies.")
    for issue in issues:
        print(f" - {issue}")
    return issues

def print_quality_report(loader: PostgresLoader, validation_issues=None):
    print("\n" + "="*50)
    print("BGMI INTEL - ETL DATA QUALITY REPORT")
    print("="*50)
    print(f"Records Processed: {loader.report['processed']}")
    print(f"Records Inserted:  {loader.report['inserted']}")
    print(f"Records Updated:   {loader.report['updated']}")
    print(f"Records Skipped:   {loader.report['skipped']}")
    print(f"Missing Fields:    {loader.report['missing_fields']}")
    print(f"Errors Encountered: {len(loader.report['errors'])}")
    print(f"Duplicates Flagged: {len(loader.report['duplicates'])}")
    
    if loader.report['duplicates']:
        print("\nDuplicates Alert details:")
        for dup in loader.report['duplicates']:
            print(f" - {dup['ign_1']} vs {dup['ign_2']} (Reason: {dup['reason']})")

    if loader.report['errors']:
        print("\nError logs:")
        for err in loader.report['errors']:
            print(f" - {err}")

    if validation_issues:
        print(f"\nData Quality Anomalies: {len(validation_issues)}")
        for iss in validation_issues[:5]:
            print(f" - {iss}")

    print("="*50 + "\n")

def main():
    parser = argparse.ArgumentParser(description="BGMI Intel Data Extraction & ETL Pipeline CLI")
    
    # Operation modes
    parser.add_argument("--full", action="store_true", help="Run full import (extract, clean, load)")
    parser.add_argument("--update", action="store_true", help="Run incremental updates on data sources")
    parser.add_argument("--validate", action="store_true", help="Run data quality validation rules")
    parser.add_argument("--report", action="store_true", help="Print data quality summary report")
    
    # Granular extractors toggles
    parser.add_argument("--players", action="store_true", help="Run Player ETL only")
    parser.add_argument("--teams", action="store_true", help="Run Team/Org ETL only")
    parser.add_argument("--tournaments", action="store_true", help="Run Tournament ETL only")
    parser.add_argument("--matches", action="store_true", help="Run Match ETL only")
    parser.add_argument("--stats", action="store_true", help="Run Stats ETL only")
    parser.add_argument("--maps", action="store_true", help="Run Map telemetry ETL only")
    parser.add_argument("--esportstats", action="store_true", help="Run EsportStats.in ETL only (players, teams, tournaments)")
    
    # Tournament specific limits
    parser.add_argument("--tournament", type=str, help="Run ETL pipeline restricted to tournament ID")
    parser.add_argument("--player", type=str, help="Run ETL pipeline restricted to player ID")

    args = parser.parse_args()

    # If no argument is provided, show help
    if len(sys.argv) == 1:
        parser.print_help()
        sys.exit(0)

    # Initialize db tables
    init_db()

    loader = PostgresLoader()

    # Phase 1: Extraction (fetch & save raw JSON payloads)
    if args.full or args.update or args.players or args.teams or args.tournaments or args.matches or args.stats or args.maps or args.esportstats:
        run_extraction(args)
        # Run transform and load immediately following extraction
        run_transform_and_load(loader)

    # Phase 2: Validation
    db = SessionLocal()
    validation_issues = []
    if args.validate or args.full:
        validation_issues = run_validation(db, loader)

    # Phase 3: Reporting
    if args.report or args.full:
        print_quality_report(loader, validation_issues)

    db.close()

if __name__ == "__main__":
    main()
