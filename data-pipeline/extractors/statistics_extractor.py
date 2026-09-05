import json
import re
from models.database import SessionLocal
from models.schema_models import RawSourceData
from sources.liquipedia_client import LiquipediaClient
from sources.nodwin_scraper import NodwinScraper, NODWIN_TOURNAMENT_SLUGS


class StatisticsExtractor:
    def __init__(self, use_mock_fallback=False):
        self.client = LiquipediaClient()
        self.nodwin = NodwinScraper()
        self.use_mock_fallback = use_mock_fallback

    def _parse_liquipedia_stats_page(self, content: str, tournament_id: str) -> list[dict]:
        """
        Parses wikitext from a Liquipedia /Statistics sub-page.

        Handles common patterns:
          {{PlayerStat|ign=ScoutOP|team=XSpark|kills=45|damage=8200|...}}
          Wikitable rows: |PlayerName||TeamName||Kills||Damage...
        """
        stats = []

        # --- Pattern 1: {{PlayerStat|...}} template ---
        ps_matches = re.finditer(
            r'\{\{PlayerStat\b([^}]*)\}\}',
            content, re.IGNORECASE
        )
        for m in ps_matches:
            inner = m.group(1)

            def field(key):
                fm = re.search(rf'\|\s*{key}\s*=\s*([^\|\n}}]+)', inner, re.IGNORECASE)
                return fm.group(1).strip() if fm else None

            def safe_int(v):
                try:
                    return int(re.sub(r'[^\d]', '', v)) if v else None
                except ValueError:
                    return None

            def safe_float(v):
                try:
                    return float(re.sub(r'[^\d.]', '', v)) if v else None
                except ValueError:
                    return None

            ign = field("ign") or field("id") or field("player")
            if not ign:
                continue
            stats.append({
                "tournament_id": tournament_id,
                "player_ign": ign,
                "team_name": field("team") or "Unknown",
                "kills": safe_int(field("kills")),
                "finishes": safe_int(field("finishes") or field("elims")),
                "knocks": safe_int(field("knocks")),
                "damage": safe_float(field("damage") or field("dmg")),
                "survival_time": safe_float(field("survival") or field("survival_time")),
                "placement": safe_int(field("placement") or field("place")),
                "points": safe_int(field("points") or field("pts")),
                "assists": safe_int(field("assists")),
                "mvp_count": safe_int(field("mvp")),
                "fmvp_count": safe_int(field("fmvp")),
                "matches": safe_int(field("matches") or field("games")),
                "average_damage": safe_float(field("avg_damage") or field("adpr")),
                "average_placement": safe_float(field("avg_place") or field("avgplace")),
                "stat_level": "tournament",
                "source": "Liquipedia",
            })

        if stats:
            return stats

        # --- Pattern 2: wikitable rows ---
        # Format: |-\n| PlayerName || TeamName || kills || damage ...
        rows = re.findall(r'\|-\s*\n\|(.*?)(?=\n\|-|\n\{\{|\Z)', content, re.DOTALL)
        for row in rows:
            cells = [c.strip() for c in re.split(r'\|\|', row.replace('\n|', '||'))]
            if len(cells) < 3:
                continue
            ign = re.sub(r'\[\[|\]\]', '', cells[0]).strip()
            team = re.sub(r'\[\[|\]\]', '', cells[1]).strip() if len(cells) > 1 else "Unknown"

            def safe_int(v):
                try:
                    return int(re.sub(r'[^\d]', '', v)) if v else None
                except ValueError:
                    return None

            if ign and any(c.isdigit() for c in row):
                stats.append({
                    "tournament_id": tournament_id,
                    "player_ign": ign,
                    "team_name": team,
                    "kills": safe_int(cells[2]) if len(cells) > 2 else None,
                    "damage": safe_int(cells[3]) if len(cells) > 3 else None,
                    "finishes": safe_int(cells[4]) if len(cells) > 4 else None,
                    "points": safe_int(cells[5]) if len(cells) > 5 else None,
                    "stat_level": "tournament",
                    "source": "Liquipedia",
                })

        return stats

    def extract(self, limit=10):
        db = SessionLocal()
        try:
            print("Running Statistics Extractor...")
            raw_records = []

            # ── Source 1: Liquipedia /Statistics sub-pages ──────────────────
            if self.client.enabled:
                try:
                    existing_tournaments = (
                        db.query(RawSourceData)
                        .filter(RawSourceData.entity_type == "tournament")
                        .all()
                    )

                    for t_raw in existing_tournaments:
                        t_data = json.loads(t_raw.raw_json)
                        base_title = t_data.get("title", "")
                        tournament_id = str(t_data.get("pageid") or t_raw.external_id)

                        stats_title = f"{base_title}/Statistics"
                        print(f"Trying Liquipedia stats page: {stats_title}")
                        page = self.client.fetch_page_content(stats_title)

                        if page and page.get("content"):
                            content = page["content"]
                            stat_dicts = self._parse_liquipedia_stats_page(content, tournament_id)
                            print(f"  Parsed {len(stat_dicts)} stat records from Liquipedia")

                            for sd in stat_dicts:
                                ext_id = f"{tournament_id}_{sd['player_ign']}"
                                existing = (
                                    db.query(RawSourceData)
                                    .filter(
                                        RawSourceData.entity_type == "statistics",
                                        RawSourceData.external_id == ext_id,
                                    )
                                    .first()
                                )
                                if existing:
                                    continue
                                raw_rec = RawSourceData(
                                    source="Liquipedia",
                                    source_url=f"https://liquipedia.net/pubgmobile/{stats_title.replace(' ', '_')}",
                                    entity_type="statistics",
                                    external_id=ext_id,
                                    raw_json=json.dumps(sd),
                                )
                                db.add(raw_rec)
                                raw_records.append(raw_rec)
                        else:
                            print(f"  No /Statistics sub-page found for: {base_title}")
                except Exception as e:
                    print(f"Liquipedia stats fetch error: {e}")

            # ── Source 2: Nodwin Gaming scraper ──────────────────────────────
            try:
                for slug in self.nodwin.list_known_tournaments():
                    print(f"Trying Nodwin scraper for: {slug}")
                    stat_dicts = self.nodwin.fetch_tournament_stats(slug)
                    for sd in stat_dicts:
                        ext_id = f"nodwin_{slug}_{sd['player_ign']}"
                        existing = (
                            db.query(RawSourceData)
                            .filter(
                                RawSourceData.entity_type == "statistics",
                                RawSourceData.external_id == ext_id,
                            )
                            .first()
                        )
                        if existing:
                            continue
                        raw_rec = RawSourceData(
                            source="Nodwin",
                            source_url=f"https://nodwingaming.com/bgmi/tournament/{slug}/stats",
                            entity_type="statistics",
                            external_id=ext_id,
                            raw_json=json.dumps(sd),
                        )
                        db.add(raw_rec)
                        raw_records.append(raw_rec)
            except Exception as e:
                print(f"Nodwin scraper error: {e}")

            # ── Fallback mock data ─────────────────────────────────────────
            if not raw_records and self.use_mock_fallback:
                print("Generating mock statistics payloads (fallback)...")
                mock_stats = [
                    {
                        "tournament_id": "89890",
                        "player_ign": "JONATHAN",
                        "team_name": "GodLike Esports",
                        "kills": 52, "finishes": 52, "knocks": 68,
                        "damage": 9804.5, "headshots": 14,
                        "survival_time": None, "placement": None,
                        "points": 148, "mvp_count": 3, "fmvp_count": 1,
                        "matches": 18, "average_damage": 544.7,
                        "average_placement": None, "assists": 8,
                        "stat_level": "tournament", "source": "Liquipedia",
                    },
                    {
                        "tournament_id": "89890",
                        "player_ign": "Sc0utOP",
                        "team_name": "Revenant XSpark",
                        "kills": 48, "finishes": 48, "knocks": 60,
                        "damage": 8950.0, "headshots": 11,
                        "survival_time": None, "placement": None,
                        "points": 162, "mvp_count": 2, "fmvp_count": 2,
                        "matches": 18, "average_damage": 497.2,
                        "average_placement": None, "assists": 12,
                        "stat_level": "tournament", "source": "Liquipedia",
                    },
                ]
                for ms in mock_stats:
                    ext_id = f"{ms['tournament_id']}_{ms['player_ign']}"
                    raw_rec = RawSourceData(
                        source=ms["source"],
                        source_url="https://liquipedia.net/pubgmobile/Battlegrounds_Mobile_India_Series/2024/Statistics",
                        entity_type="statistics",
                        external_id=ext_id,
                        raw_json=json.dumps(ms),
                    )
                    db.add(raw_rec)
                    raw_records.append(raw_rec)

            db.commit()
            print(f"Stored {len(raw_records)} raw statistics records in raw_source_data.")
            return len(raw_records)
        except Exception as e:
            db.rollback()
            print(f"Statistics Extraction failed: {e}")
            raise e
        finally:
            db.close()
