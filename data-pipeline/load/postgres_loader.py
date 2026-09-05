import datetime
import uuid
from sqlalchemy.orm import Session
from models.database import SessionLocal
from models.schema_models import (
    Player, PlayerAlias, Organization, PlayerOrgHistory,
    Tournament, Team, TeamRoster, Match, PlayerMatchStats,
    PlayerTournamentStats, PlayerMapStats, MapEvent, DropLocation, Achievement
)
from transform.normalize_names import are_similar_players, normalize_organization_name

class PostgresLoader:
    def __init__(self):
        self.report = {
            "processed": 0,
            "inserted": 0,
            "updated": 0,
            "skipped": 0,
            "duplicates": [],
            "errors": [],
            "missing_fields": 0
        }

    def reset_report(self):
        self.report = {
            "processed": 0,
            "inserted": 0,
            "updated": 0,
            "skipped": 0,
            "duplicates": [],
            "errors": [],
            "missing_fields": 0
        }

    def load_player(self, db: Session, player_dict, history_list):
        """Loads player record and maps organization careers, resolving aliases and checking duplicates"""
        self.report["processed"] += 1
        try:
            ign = player_dict["ign"]
            real_name = player_dict.get("real_name") or ""
            
            # 1. Alias / Exact IGN Check
            existing_player = db.query(Player).filter(Player.ign.like(ign)).first()
            
            if not existing_player:
                # Check alias list
                alias_record = db.query(PlayerAlias).filter(PlayerAlias.alias.like(ign)).first()
                if alias_record:
                    existing_player = db.query(Player).filter(Player.player_id == alias_record.player_id).first()

            # 2. Levenshtein Duplicate Check (Flag only, do not merge automatically)
            if not existing_player:
                all_players = db.query(Player).all()
                for ap in all_players:
                    similar, reason = are_similar_players(ign, ap.ign, real_name, ap.real_name or "")
                    if similar:
                        self.report["duplicates"].append({
                            "type": "player",
                            "ign_1": ign,
                            "ign_2": ap.ign,
                            "reason": reason
                        })
            
            # 3. Insert or Update Player
            player_id = player_dict["player_id"]
            if existing_player:
                # Update (Incremental Update)
                existing_player.real_name = player_dict.get("real_name") or existing_player.real_name
                existing_player.country = player_dict.get("country") or existing_player.country
                existing_player.role = player_dict.get("role") or existing_player.role
                existing_player.status = player_dict.get("status") or existing_player.status
                existing_player.image_url = player_dict.get("image_url") or existing_player.image_url
                existing_player.updated_at = datetime.datetime.utcnow()
                player_id = existing_player.player_id
                self.report["updated"] += 1
            else:
                new_player = Player(**player_dict)
                db.add(new_player)
                db.flush() # Populate player_id
                # Add default alias for self
                self_alias = PlayerAlias(player_id=player_id, alias=ign, source=player_dict["source"])
                db.add(self_alias)
                self.report["inserted"] += 1

            # 4. Load Org Careers History
            for hist in history_list:
                # Resolve org record
                org_name = hist["org_name"]
                norm_org_name = hist["normalized_org"]
                
                # Check or Create Organization
                org = db.query(Organization).filter(Organization.organization_name.like(norm_org_name)).first()
                if not org:
                    org_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, norm_org_name.lower().strip()))
                    org = Organization(
                        organization_id=org_id,
                        organization_name=org_name,
                        source=hist["source"]
                    )
                    db.add(org)
                    db.flush()

                # Check if history record already exists
                existing_history = db.query(PlayerOrgHistory).filter(
                    PlayerOrgHistory.player_id == player_id,
                    PlayerOrgHistory.organization_id == org.organization_id,
                    PlayerOrgHistory.joined_date == hist["joined_date"]
                ).first()

                if not existing_history:
                    new_hist = PlayerOrgHistory(
                        player_id=player_id,
                        organization_id=org.organization_id,
                        role=hist["role"],
                        joined_date=hist["joined_date"],
                        left_date=hist["left_date"],
                        year_only=hist["year_only"],
                        unknown_start=hist["unknown_start"],
                        unknown_end=hist["unknown_end"],
                        source=hist["source"]
                    )
                    db.add(new_hist)
            
            db.commit()
        except Exception as e:
            db.rollback()
            self.report["errors"].append(f"Player Load Error for {ign}: {str(e)}")
            raise e

    def load_organization(self, db: Session, org_dict, team_dict):
        """Loads organization and maps team relationship"""
        self.report["processed"] += 1
        try:
            norm_name = normalize_organization_name(org_dict["organization_name"])
            
            # Check or Update Org
            org = db.query(Organization).filter(Organization.organization_name.like(norm_name)).first()
            if org:
                org.short_name = org_dict.get("short_name") or org.short_name
                org.logo_url = org_dict.get("logo_url") or org.logo_url
                org.country = org_dict.get("country") or org.country
                org.website = org_dict.get("website") or org.website
                org.social_links = org_dict.get("social_links") or org.social_links
                org.updated_at = datetime.datetime.utcnow()
                org_id = org.organization_id
                self.report["updated"] += 1
            else:
                org_dict["organization_name"] = norm_name
                new_org = Organization(**org_dict)
                db.add(new_org)
                db.flush()
                org_id = new_org.organization_id
                self.report["inserted"] += 1

            # Check Team mapping
            team_id = team_dict["team_id"]
            existing_team = db.query(Team).filter(Team.team_id == team_id).first()
            if not existing_team:
                team_dict["organization_id"] = org_id
                new_team = Team(**team_dict)
                db.add(new_team)
            else:
                existing_team.team_name = team_dict["team_name"]
                existing_team.organization_id = org_id

            db.commit()
        except Exception as e:
            db.rollback()
            self.report["errors"].append(f"Organization Load Error: {str(e)}")
            raise e

    def load_tournament(self, db: Session, tour_dict):
        """Loads tournament details"""
        self.report["processed"] += 1
        try:
            tour_id = tour_dict["tournament_id"]
            existing = db.query(Tournament).filter(Tournament.tournament_id == tour_id).first()
            
            if existing:
                existing.tournament_name = tour_dict["tournament_name"]
                existing.series = tour_dict.get("series") or existing.series
                existing.season = tour_dict.get("season") or existing.season
                existing.year = tour_dict.get("year") or existing.year
                existing.tier = tour_dict.get("tier") or existing.tier
                existing.start_date = tour_dict.get("start_date") or existing.start_date
                existing.end_date = tour_dict.get("end_date") or existing.end_date
                existing.region = tour_dict.get("region") or existing.region
                existing.prize_pool = tour_dict.get("prize_pool") or existing.prize_pool
                existing.number_of_teams = tour_dict.get("number_of_teams") or existing.number_of_teams
                existing.winner = tour_dict.get("winner") or existing.winner
                existing.updated_at = datetime.datetime.utcnow()
                self.report["updated"] += 1
            else:
                new_tour = Tournament(**tour_dict)
                db.add(new_tour)
                self.report["inserted"] += 1
            db.commit()
        except Exception as e:
            db.rollback()
            self.report["errors"].append(f"Tournament Load Error: {str(e)}")
            raise e

    def load_match(self, db: Session, match_dict):
        """Loads single match data"""
        self.report["processed"] += 1
        try:
            match_id = match_dict["match_id"]
            existing = db.query(Match).filter(Match.match_id == match_id).first()
            
            if existing:
                existing.tournament_id = match_dict["tournament_id"]
                existing.match_number = match_dict.get("match_number") or existing.match_number
                existing.map = match_dict["map"]
                existing.date = match_dict.get("date") or existing.date
                existing.stage = match_dict.get("stage") or existing.stage
                existing.group = match_dict.get("group") or existing.group
                existing.winner_team_id = match_dict.get("winner_team_id") or existing.winner_team_id
                self.report["updated"] += 1
            else:
                new_match = Match(**match_dict)
                db.add(new_match)
                self.report["inserted"] += 1
            db.commit()
        except Exception as e:
            db.rollback()
            self.report["errors"].append(f"Match Load Error: {str(e)}")
            raise e

    def load_statistics(self, db: Session, stat_dict):
        """Loads match or tournament stats, linking player & team IDs"""
        self.report["processed"] += 1
        try:
            player_ign = stat_dict["player_ign"]
            team_name = stat_dict["team_name"]
            
            # Resolve Player
            player = db.query(Player).filter(Player.ign.like(player_ign)).first()
            if not player:
                # Check aliases
                alias = db.query(PlayerAlias).filter(PlayerAlias.alias.like(player_ign)).first()
                if alias:
                    player = db.query(Player).filter(Player.player_id == alias.player_id).first()
            
            if not player:
                self.report["missing_fields"] += 1
                self.report["errors"].append(f"Skipping stats: Player IGN {player_ign} not found in database.")
                self.report["skipped"] += 1
                return
                
            # Resolve Team
            norm_team_name = normalize_organization_name(team_name)
            team_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, norm_team_name.lower().strip()))
            team = db.query(Team).filter(Team.team_id == team_id).first()
            if not team:
                # Fallback: create stub team
                team = Team(
                    team_id=team_id,
                    team_name=team_name,
                    source=stat_dict["source"]
                )
                db.add(team)
                db.flush()

            # Insert roster link if not active
            roster_link = db.query(TeamRoster).filter(
                TeamRoster.team_id == team.team_id,
                TeamRoster.player_id == player.player_id
            ).first()
            if not roster_link:
                new_link = TeamRoster(team_id=team.team_id, player_id=player.player_id)
                db.add(new_link)

            # Match Level Stats vs Tournament Level Stats
            if stat_dict["stat_level"] == "match":
                match_id = stat_dict["match_id"]
                # Check existing
                existing_stat = db.query(PlayerMatchStats).filter(
                    PlayerMatchStats.match_id == match_id,
                    PlayerMatchStats.player_id == player.player_id
                ).first()
                
                params = {
                    "match_id": match_id,
                    "player_id": player.player_id,
                    "team_id": team.team_id,
                    "finishes": stat_dict.get("finishes"),
                    "kills": stat_dict.get("kills"),
                    "knocks": stat_dict.get("knocks"),
                    "damage": stat_dict.get("damage"),
                    "headshots": stat_dict.get("headshots"),
                    "survival_time": stat_dict.get("survival_time"),
                    "placement": stat_dict.get("placement"),
                    "points": stat_dict.get("points"),
                    "grenade_finishes": stat_dict.get("grenade_finishes"),
                    "assists": stat_dict.get("assists")
                }
                
                if existing_stat:
                    for k, v in params.items():
                        setattr(existing_stat, k, v)
                    self.report["updated"] += 1
                else:
                    new_stat = PlayerMatchStats(**params)
                    db.add(new_stat)
                    self.report["inserted"] += 1
            else:
                # Tournament level
                tour_id = stat_dict["tournament_id"]
                existing_stat = db.query(PlayerTournamentStats).filter(
                    PlayerTournamentStats.tournament_id == tour_id,
                    PlayerTournamentStats.player_id == player.player_id
                ).first()
                
                params = {
                    "player_id": player.player_id,
                    "tournament_id": tour_id,
                    "team_id": team.team_id,
                    "matches": stat_dict.get("matches"),
                    "finishes": stat_dict.get("finishes"),
                    "kills": stat_dict.get("kills"),
                    "knocks": stat_dict.get("knocks"),
                    "damage": stat_dict.get("damage"),
                    "average_damage": stat_dict.get("average_damage"),
                    "average_survival": stat_dict.get("average_survival"),
                    "average_placement": stat_dict.get("average_placement"),
                    "headshots": stat_dict.get("headshots"),
                    "mvp_count": stat_dict.get("mvp_count"),
                    "fmvp_count": stat_dict.get("fmvp_count"),
                    "points": stat_dict.get("points"),
                    "stat_level": stat_dict["stat_level"]
                }
                
                if existing_stat:
                    for k, v in params.items():
                        setattr(existing_stat, k, v)
                    self.report["updated"] += 1
                else:
                    new_stat = PlayerTournamentStats(**params)
                    db.add(new_stat)
                    self.report["inserted"] += 1

            db.commit()
        except Exception as e:
            db.rollback()
            self.report["errors"].append(f"Statistics Load Error: {str(e)}")
            raise e

    def load_map_intel(self, db: Session, map_dict, source_name="OfficialPortal"):
        """Loads map drops and telemetry events"""
        self.report["processed"] += 1
        try:
            mtype = map_dict["type"]
            match_id = map_dict["match_id"]
            map_name = map_dict["map"]
            team_name = map_dict["team_name"]
            
            norm_team = normalize_organization_name(team_name)
            team_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, norm_team.lower().strip()))
            team = db.query(Team).filter(Team.team_id == team_id).first()
            if not team:
                team = Team(team_id=team_id, team_name=team_name, source=source_name)
                db.add(team)
                db.flush()

            if mtype == "drop":
                # Check existing drop
                existing = db.query(DropLocation).filter(
                    DropLocation.match_id == match_id,
                    DropLocation.team_id == team.team_id,
                    DropLocation.drop_location == map_dict["drop_location"]
                ).first()
                
                if not existing:
                    new_drop = DropLocation(
                        team_id=team.team_id,
                        match_id=match_id,
                        map=map_name,
                        drop_location=map_dict["drop_location"],
                        x=map_dict.get("x"),
                        y=map_dict.get("y"),
                        timestamp=map_dict.get("timestamp")
                    )
                    db.add(new_drop)
                    self.report["inserted"] += 1
                else:
                    self.report["skipped"] += 1
            else:
                # Event
                player_ign = map_dict["player_ign"]
                player = db.query(Player).filter(Player.ign.like(player_ign)).first()
                if not player:
                    self.report["skipped"] += 1
                    return

                existing = db.query(MapEvent).filter(MapEvent.event_id == map_dict["event_id"]).first()
                if not existing:
                    new_event = MapEvent(
                        event_id=map_dict["event_id"],
                        match_id=match_id,
                        map=map_name,
                        team_id=team.team_id,
                        player_id=player.player_id,
                        event_type=map_dict["event_type"],
                        x=map_dict.get("x"),
                        y=map_dict.get("y"),
                        timestamp=map_dict.get("timestamp"),
                        source=source_name
                    )
                    db.add(new_event)
                    self.report["inserted"] += 1
                else:
                    self.report["skipped"] += 1
            db.commit()
        except Exception as e:
            db.rollback()
            self.report["errors"].append(f"Map Intel Load Error: {str(e)}")
            raise e
