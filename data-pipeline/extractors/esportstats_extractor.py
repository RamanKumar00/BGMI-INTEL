"""
EsportStats Extractor — pulls players, teams, and tournaments
from esportstats.in via their public Supabase API.

Run standalone:
    python -m extractors.esportstats_extractor
"""

import json
from models.database import SessionLocal
from models.schema_models import RawSourceData
from sources.esportstats_client import EsportStatsClient

ESPORTSTATS_BASE = "https://esportstats.in"


class EsportStatsExtractor:
    """
    Extracts real BGMI player, team, and tournament data from esportstats.in
    via the site's public Supabase REST API.

    Data quality vs Liquipedia:
      - Players: IGN + role + photo URL + current team linkage  ← real, current
      - Teams:   name + short name + logo + established year    ← real, current
      - Tournaments: name + status + dates                      ← real, current
    """

    def __init__(self):
        self.client = EsportStatsClient()

    # ── Internal helpers ────────────────────────────────────────────────────

    def _already_stored(self, db, external_id: str, entity_type: str) -> bool:
        return (
            db.query(RawSourceData)
            .filter(
                RawSourceData.source == "EsportStats",
                RawSourceData.entity_type == entity_type,
                RawSourceData.external_id == external_id,
            )
            .first()
        ) is not None

    def _store(self, db, entity_type: str, external_id: str, payload: dict,
               source_url: str) -> RawSourceData:
        raw = RawSourceData(
            source="EsportStats",
            source_url=source_url,
            entity_type=entity_type,
            external_id=external_id,
            raw_json=json.dumps(payload),
        )
        db.add(raw)
        return raw

    # ── Public extract methods ───────────────────────────────────────────────

    def extract_players(self, db, team_map: dict) -> int:
        """
        Pulls all players from EsportStats and stores each as a RawSourceData
        record with entity_type='player'.

        Enriches each player dict with their team name (looked up from team_map).
        """
        players = self.client.fetch_all_players()
        stored = 0
        for p in players:
            ext_id = f"estats_player_{p['id']}"
            if self._already_stored(db, ext_id, "player"):
                continue
            team = team_map.get(p.get("team_id"), {})
            payload = {
                # Map to our standard field names so clean_players.py can parse
                "title": p["player_name"],
                # Embed as fake Liquipedia wikitext so the existing transformer
                # can consume it via get_infobox_val()
                "content": (
                    f"{{{{Infobox player\n"
                    f"|id={p['player_name']}\n"
                    f"|roles={p.get('player_role', '')}\n"
                    f"|status=Active\n"
                    f"|image={p.get('photo_url', '')}\n"
                    f"|country=India\n"
                    f"}}}}"
                ),
                # Extra raw fields for direct use
                "esports_id": p["id"],
                "team_id": p.get("team_id"),
                "team_name": team.get("team_name", ""),
                "team_short": team.get("team_shortName", ""),
                "team_logo": team.get("logo_url", ""),
                "photo_url": p.get("photo_url", ""),
                "player_role": p.get("player_role", ""),
                "source_site": "esportstats.in",
            }
            self._store(
                db,
                entity_type="player",
                external_id=ext_id,
                payload=payload,
                source_url=f"{ESPORTSTATS_BASE}/players/{p['player_name']}",
            )
            stored += 1
        return stored

    def extract_teams(self, db) -> tuple[int, dict]:
        """
        Pulls all teams from EsportStats, stores each as entity_type='team'.
        Returns (count_stored, team_map {id → team_dict}).
        """
        teams = self.client.fetch_all_teams()
        team_map = {t["id"]: t for t in teams}
        stored = 0
        for t in teams:
            ext_id = f"estats_team_{t['id']}"
            if self._already_stored(db, ext_id, "team"):
                continue
            payload = {
                "title": t["team_name"],
                # Fake Liquipedia wikitext so clean_teams.py transformer works
                "content": (
                    f"{{{{Infobox team\n"
                    f"|name={t['team_name']}\n"
                    f"|shortname={t.get('team_shortName', '')}\n"
                    f"|image={t.get('logo_url', '')}\n"
                    f"|country=India\n"
                    f"}}}}"
                ),
                "esports_id": t["id"],
                "team_name": t["team_name"],
                "short_name": t.get("team_shortName", ""),
                "logo_url": t.get("logo_url", ""),
                "established": t.get("est", ""),
                "source_site": "esportstats.in",
            }
            self._store(
                db,
                entity_type="team",
                external_id=ext_id,
                payload=payload,
                source_url=f"{ESPORTSTATS_BASE}/teams/{t['team_name'].replace(' ', '%20')}",
            )
            stored += 1
        return stored, team_map

    def extract_tournaments(self, db) -> int:
        """
        Pulls all tournaments from EsportStats (without detailed_html),
        stores each as entity_type='tournament'.
        """
        tournaments = self.client.fetch_all_tournaments(exclude_html=True)
        stored = 0
        for t in tournaments:
            ext_id = f"estats_tournament_{t['id']}"
            if self._already_stored(db, ext_id, "tournament"):
                continue
            payload = {
                "title": t["name"],
                # Minimal infobox so clean_tournaments.py can parse it
                "content": (
                    f"{{{{Infobox league\n"
                    f"|name={t['name']}\n"
                    f"|shortname={t.get('short_name', '')}\n"
                    f"|sdate={t.get('start_date', '')}\n"
                    f"|edate={t.get('end_date', '')}\n"
                    f"|country=India\n"
                    f"}}}}"
                ),
                "esports_id": t["id"],
                "tournament_name": t["name"],
                "short_name": t.get("short_name", ""),
                "status": t.get("status", ""),
                "start_date": t.get("start_date", ""),
                "end_date": t.get("end_date", ""),
                "thumbnail_url": t.get("thumbnail_url", ""),
                "source_site": "esportstats.in",
            }
            self._store(
                db,
                entity_type="tournament",
                external_id=ext_id,
                payload=payload,
                source_url=f"{ESPORTSTATS_BASE}/tournaments/{t.get('short_name', t['id'])}",
            )
            stored += 1
        return stored

    def extract_stats(self, db) -> int:
        """
        Pulls tournament stats for known 2026 active tables from EsportStats.
        Stores them as entity_type='statistics'.
        """
        prefixes = ["bgis26", "bmps26", "bgms26", "pmwc26"]
        stored = 0
        
        for prefix in prefixes:
            stats = self.client.fetch_tournament_stats(prefix)
            
            # Store player standings
            for p in stats.get("players", []):
                ext_id = f"estats_{prefix}_pstat_{p['id']}"
                if self._already_stored(db, ext_id, "statistics"):
                    continue
                    
                payload = {
                    "stat_type": "player_tournament",
                    "prefix": prefix,
                    "data": p,
                    "source_site": "esportstats.in"
                }
                self._store(
                    db,
                    entity_type="statistics",
                    external_id=ext_id,
                    payload=payload,
                    source_url=f"{ESPORTSTATS_BASE}/stats/{prefix}",
                )
                stored += 1
                
            # Store team standings
            for t in stats.get("teams", []):
                ext_id = f"estats_{prefix}_tstat_{t['id']}"
                if self._already_stored(db, ext_id, "statistics"):
                    continue
                    
                payload = {
                    "stat_type": "team_tournament",
                    "prefix": prefix,
                    "data": t,
                    "source_site": "esportstats.in"
                }
                self._store(
                    db,
                    entity_type="statistics",
                    external_id=ext_id,
                    payload=payload,
                    source_url=f"{ESPORTSTATS_BASE}/stats/{prefix}",
                )
                stored += 1
                
        return stored

    # ── Main entry point ─────────────────────────────────────────────────────

    def extract(self):
        """
        Runs the full EsportStats extraction: teams → players → tournaments.
        Teams must be fetched before players so we can enrich player records
        with team names.
        """
        db = SessionLocal()
        try:
            print("Running EsportStats Extractor...")

            # 1. Teams first (needed to enrich players)
            teams_stored, team_map = self.extract_teams(db)
            db.commit()
            print(f"  Teams stored: {teams_stored} (total in API: {len(team_map)})")

            # 2. Players (enriched with team name from team_map)
            players_stored = self.extract_players(db, team_map)
            db.commit()
            print(f"  Players stored: {players_stored}")

            # 3. Tournaments
            tours_stored = self.extract_tournaments(db)
            db.commit()
            print(f"  Tournaments stored: {tours_stored}")
            
            # 4. Tournament Stats
            stats_stored = self.extract_stats(db)
            db.commit()
            print(f"  Tournament stats stored: {stats_stored}")

            total = teams_stored + players_stored + tours_stored + stats_stored
            print(f"EsportStats Extraction complete. Total new records: {total}")
            return total

        except Exception as e:
            db.rollback()
            print(f"EsportStats Extraction failed: {e}")
            raise
        finally:
            db.close()


if __name__ == "__main__":
    EsportStatsExtractor().extract()
