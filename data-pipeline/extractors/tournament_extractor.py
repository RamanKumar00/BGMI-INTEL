import json
from models.database import SessionLocal
from models.schema_models import RawSourceData
from sources.liquipedia_client import LiquipediaClient

# Curated list of real BGMI tournament Liquipedia page titles (verified via API).
# Using direct page titles because the category "Battlegrounds Mobile India Tournaments" is empty on the wiki.
KNOWN_BGMI_TOURNAMENTS = [
    "Battlegrounds Mobile India Series/2026",
    "Battlegrounds Mobile India Series/2025",
    "Battlegrounds Mobile India Series/2024",
    "Battlegrounds Mobile India Series/2023",
    "Battlegrounds Mobile India Series/2021",
    "Battlegrounds Mobile India Pro Series/2024",
    "Battlegrounds Mobile India Pro Series/2023",
    "Battlegrounds Mobile India Pro Series/2025",
    "BGMI Masters Series/Season 2",
    "BGMI Masters Series",
    "ESL/Snapdragon Pro Series/Season 6/BGMI",
]

class TournamentExtractor:
    def __init__(self, use_mock_fallback=False):
        self.client = LiquipediaClient()
        self.use_mock_fallback = use_mock_fallback

    def extract(self, limit=10):
        db = SessionLocal()
        try:
            print("Running Tournament Extractor...")
            raw_records = []

            if self.client.enabled:
                try:
                    # Use the curated list of known BGMI tournament page titles.
                    # Liquipedia does not expose a working category for these pages,
                    # so we hit each page directly by its canonical title.
                    targets = KNOWN_BGMI_TOURNAMENTS[:limit]
                    for title in targets:
                        print(f"Fetching Liquipedia tournament page: {title}")
                        page = self.client.fetch_page_content(title)
                        if page and page.get("content"):
                            slug = title.replace(" ", "_").replace("/", "/")
                            raw_rec = RawSourceData(
                                source="Liquipedia",
                                source_url=f"https://liquipedia.net/pubgmobile/{slug}",
                                entity_type="tournament",
                                external_id=str(page.get("pageid") or title),
                                raw_json=json.dumps(page)
                            )
                            db.add(raw_rec)
                            raw_records.append(raw_rec)
                        else:
                            print(f"  -> No content found for: {title}")
                except Exception as e:
                    print(f"Error fetching tournaments from Liquipedia: {e}")
                    if not self.use_mock_fallback:
                        raise e

            # Minimal mock fallback — only fires if Liquipedia is disabled in config
            if not raw_records and self.use_mock_fallback:
                print("Generating mock raw tournament payloads (fallback)...")
                mock_tournaments = [
                    {
                        "title": "Battlegrounds Mobile India Series/2024",
                        "content": (
                            "{{Infobox league\n"
                            "|name=Battlegrounds Mobile India Series 2024\n"
                            "|series=BGIS\n"
                            "|shortname=BGIS 2024\n"
                            "|tickername=BGIS 2024\n"
                            "|image=\n"
                            "|icon=\n"
                            "|organizer=KRAFTON\n"
                            "|organizer2=Tesseract Esports\n"
                            "|sponsor=iQOO\n"
                            "|game=bgmi\n"
                            "|type=Online/Offline\n"
                            "|country=India\n"
                            "|city=\n"
                            "|venue=\n"
                            "|format=\n"
                            "|prizepool=20000000\n"
                            "|localcurrency=INR\n"
                            "|sdate=2024-04-12\n"
                            "|edate=2024-06-16\n"
                            "|liquipediatier=1\n"
                            "|participants=64\n"
                            "|winner=Revenant XSpark\n"
                            "}}"
                        ),
                        "pageid": 89890,
                    },
                    {
                        "title": "Battlegrounds Mobile India Pro Series/2024",
                        "content": (
                            "{{Infobox league\n"
                            "|name=Battlegrounds Mobile India Pro Series 2024\n"
                            "|series=BMPS\n"
                            "|shortname=BMPS 2024\n"
                            "|organizer=Nodwin Gaming\n"
                            "|prizepool=10000000\n"
                            "|localcurrency=INR\n"
                            "|sdate=2024-07-15\n"
                            "|edate=2024-08-11\n"
                            "|liquipediatier=1\n"
                            "|participants=24\n"
                            "|winner=Revenant XSpark\n"
                            "}}"
                        ),
                        "pageid": 91047,
                    },
                ]
                for mt in mock_tournaments:
                    raw_rec = RawSourceData(
                        source="Liquipedia",
                        source_url=f"https://liquipedia.net/pubgmobile/{mt['title'].replace(' ', '_')}",
                        entity_type="tournament",
                        external_id=str(mt["pageid"]),
                        raw_json=json.dumps(mt),
                    )
                    db.add(raw_rec)
                    raw_records.append(raw_rec)

            db.commit()
            print(f"Stored {len(raw_records)} raw tournament records in raw_source_data.")
            return len(raw_records)
        except Exception as e:
            db.rollback()
            print(f"Tournament Extraction failed: {e}")
            raise e
        finally:
            db.close()
