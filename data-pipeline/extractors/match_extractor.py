import json
import re
from models.database import SessionLocal
from models.schema_models import RawSourceData
from sources.liquipedia_client import LiquipediaClient

class MatchExtractor:
    def __init__(self, use_mock_fallback=False):
        self.client = LiquipediaClient()
        self.use_mock_fallback = use_mock_fallback

    def _parse_matches_from_wikitext(self, content, title, tournament_pageid):
        """
        Parses {{Match|...}} and {{MatchMaps|...}} wikitext blocks from a tournament page.
        Returns a list of match dicts ready to store as RawSourceData.
        """
        matches = []

        # Pattern: {{Match2|... or {{Match|... wikitext blocks.
        # We extract the inner content of each Match template.
        # Handles both single-line and multi-line match definitions.
        raw_blocks = re.findall(
            r'\{\{(?:Match2?|MatchMaps)\b([\s\S]*?)\}\}(?=\s*(?:\{\{|$|\n\s*\n))',
            content
        )

        for idx, block in enumerate(raw_blocks):
            def field(key):
                m = re.search(rf'\|\s*{key}\s*=\s*([^\|\n}}]+)', block)
                return m.group(1).strip() if m else None

            map_name = field("map") or field("map1") or "Erangel"
            date_str  = field("date") or field("matchdate") or None
            stage     = field("bestof") or field("round") or None

            # team names / results
            opponent1 = field("opponent1") or field("team1") or None
            opponent2 = field("opponent2") or field("team2") or None
            winner_num = field("winner")  # "1" or "2"

            winner_team = None
            if winner_num == "1":
                winner_team = opponent1
            elif winner_num == "2":
                winner_team = opponent2

            match_dict = {
                "match_id": f"{tournament_pageid}_m{idx + 1}",
                "tournament_id": str(tournament_pageid),
                "tournament_title": title,
                "match_number": idx + 1,
                "map": map_name,
                "date": date_str,
                "stage": stage or "Unknown",
                "group": None,
                "winner_team_name": winner_team,
                "winner_team_id": None,  # resolved in loader
                "source": "Liquipedia",
            }
            matches.append(match_dict)

        return matches

    def extract(self, limit=20):
        db = SessionLocal()
        try:
            print("Running Match Extractor...")
            raw_records = []

            if self.client.enabled:
                try:
                    # Pull tournament raw records already in the DB to avoid re-fetching
                    existing_tournaments = (
                        db.query(RawSourceData)
                        .filter(RawSourceData.entity_type == "tournament")
                        .all()
                    )

                    if existing_tournaments:
                        print(f"Parsing match blocks from {len(existing_tournaments)} tournament pages in DB...")
                        for t_raw in existing_tournaments:
                            t_data = json.loads(t_raw.raw_json)
                            content = t_data.get("content", "")
                            title   = t_data.get("title", "")
                            pageid  = t_data.get("pageid") or t_raw.external_id

                            matches = self._parse_matches_from_wikitext(content, title, pageid)
                            print(f"  Found {len(matches)} match blocks in: {title}")

                            for match_dict in matches[:limit]:
                                # Deduplicate by external_id
                                ext_id = match_dict["match_id"]
                                existing = (
                                    db.query(RawSourceData)
                                    .filter(
                                        RawSourceData.entity_type == "match",
                                        RawSourceData.external_id == ext_id,
                                    )
                                    .first()
                                )
                                if existing:
                                    continue
                                raw_rec = RawSourceData(
                                    source="Liquipedia",
                                    source_url=t_raw.source_url,
                                    entity_type="match",
                                    external_id=ext_id,
                                    raw_json=json.dumps(match_dict),
                                )
                                db.add(raw_rec)
                                raw_records.append(raw_rec)
                    else:
                        print("No tournament pages in DB yet. Run tournament extractor first.")
                except Exception as e:
                    print(f"Error parsing matches from tournament pages: {e}")
                    if not self.use_mock_fallback:
                        raise e

            # Fallback mock data only when Liquipedia is disabled
            if not raw_records and self.use_mock_fallback:
                print("Generating mock match payloads (fallback)...")
                mock_matches = [
                    {
                        "match_id": "89890_m1",
                        "tournament_id": "89890",
                        "tournament_title": "Battlegrounds Mobile India Series/2024",
                        "match_number": 1,
                        "map": "Erangel",
                        "date": "2024-06-14",
                        "stage": "Grand Finals",
                        "group": None,
                        "winner_team_name": "Revenant XSpark",
                        "winner_team_id": None,
                        "source": "Liquipedia",
                    },
                    {
                        "match_id": "89890_m2",
                        "tournament_id": "89890",
                        "tournament_title": "Battlegrounds Mobile India Series/2024",
                        "match_number": 2,
                        "map": "Miramar",
                        "date": "2024-06-14",
                        "stage": "Grand Finals",
                        "group": None,
                        "winner_team_name": "GodLike Esports",
                        "winner_team_id": None,
                        "source": "Liquipedia",
                    },
                    {
                        "match_id": "89890_m3",
                        "tournament_id": "89890",
                        "tournament_title": "Battlegrounds Mobile India Series/2024",
                        "match_number": 3,
                        "map": "Rondo",
                        "date": "2024-06-15",
                        "stage": "Grand Finals",
                        "group": None,
                        "winner_team_name": "Blind Esports",
                        "winner_team_id": None,
                        "source": "Liquipedia",
                    },
                ]
                for mm in mock_matches:
                    raw_rec = RawSourceData(
                        source="Liquipedia",
                        source_url=f"https://liquipedia.net/pubgmobile/{mm['tournament_title'].replace(' ', '_')}",
                        entity_type="match",
                        external_id=mm["match_id"],
                        raw_json=json.dumps(mm),
                    )
                    db.add(raw_rec)
                    raw_records.append(raw_rec)

            db.commit()
            print(f"Stored {len(raw_records)} raw match records in raw_source_data.")
            return len(raw_records)
        except Exception as e:
            db.rollback()
            print(f"Match Extraction failed: {e}")
            raise e
        finally:
            db.close()
