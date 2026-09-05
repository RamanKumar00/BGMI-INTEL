import json
import datetime
from models.database import SessionLocal
from models.schema_models import RawSourceData
from sources.liquipedia_client import LiquipediaClient

class PlayerExtractor:
    def __init__(self, use_mock_fallback=True):
        self.client = LiquipediaClient()
        self.use_mock_fallback = use_mock_fallback

    def extract(self, limit=10):
        db = SessionLocal()
        try:
            print("Running Player Extractor...")
            raw_records = []
            
            if self.client.enabled:
                try:
                    # Real Liquipedia pubgmobile wiki categories (verified via API)
                    members = self.client.fetch_category_members("Indian Players", limit=limit)
                    if not members:
                        members = self.client.fetch_category_members("Active Players", limit=limit)

                    for member in members[:limit]:
                        title = member.get("title")
                        page_id = member.get("pageid")
                        print(f"Fetching Liquipedia page content for: {title}")
                        
                        # Get wikitext
                        page = self.client.fetch_page_content(title)
                        if page:
                            raw_rec = RawSourceData(
                                source="Liquipedia",
                                source_url=f"https://liquipedia.net/pubgmobile/{title.replace(' ', '_')}",
                                entity_type="player",
                                external_id=str(page_id or title),
                                raw_json=json.dumps(page)
                            )
                            db.add(raw_rec)
                            raw_records.append(raw_rec)
                except Exception as e:
                    print(f"Error fetching from Liquipedia: {e}")
                    if not self.use_mock_fallback:
                        raise e
            
            # Fallback to mock data if no records fetched and fallback is enabled
            if not raw_records and self.use_mock_fallback:
                print("Generating mock raw player payloads for dry-run...")
                mock_players = [
                    {"title": "Jonathan", "content": "{{Infobox player\n|ign=Jonathan\n|name=Jonathan Amaral\n|country=India\n|role=Assaulter\n|status=Active\n|image=https://example.com/jonathan.png\n|history={{History|2021-06-01|2021-08-01|TSM Entity}}{{History|2021-08-03|2024-08-01|GodLike Esports}}{{History|2024-08-01|Present|Team Apex Gaming}}\n}}", "pageid": 1001},
                    {"title": "ScoutOP", "content": "{{Infobox player\n|ign=ScoutOP\n|name=Tanmay Singh\n|country=India\n|role=Assaulter\n|status=Active\n|image=https://example.com/scout.png\n|history={{History|2021-08-01|2022-01-01|SouL}}{{History|2023-01-01|Present|Team XSpark}}\n}}", "pageid": 1002},
                    {"title": "ZGOD", "content": "{{Infobox player\n|ign=ZGOD\n|name=Abhishek Choudhary\n|country=India\n|role=Support\n|status=Active\n|image=https://example.com/zgod.png\n|history={{History|2021-08-03|Present|GodLike Esports}}\n}}", "pageid": 1003},
                    {"title": "Neyoo", "content": "{{Infobox player\n|ign=Neyoo\n|name=Suraj Nityanand Majumdar\n|country=India\n|role=Entry Fragger\n|status=Active\n|image=https://example.com/neyoo.png\n|history={{History|2021-08-03|Present|GodLike Esports}}\n}}", "pageid": 1004},
                    {"title": "ClutchGod", "content": "{{Infobox player\n|ign=ClutchGod\n|name=Vivek Aabhas Horo\n|country=India\n|role=IGL\n|status=Active\n|image=https://example.com/clutchgod.png\n|history={{History|2021-08-03|2023-04-01|GodLike Esports}}{{History|2023-05-01|Present|Blind Esports}}\n}}", "pageid": 1005}
                ]
                
                for mp in mock_players:
                    raw_rec = RawSourceData(
                        source="Liquipedia",
                        source_url=f"https://liquipedia.net/pubg/{mp['title']}",
                        entity_type="player",
                        external_id=str(mp['pageid']),
                        raw_json=json.dumps(mp)
                    )
                    db.add(raw_rec)
                    raw_records.append(raw_rec)
                    
            db.commit()
            print(f"Stored {len(raw_records)} raw player records in raw_source_data.")
            return len(raw_records)
        except Exception as e:
            db.rollback()
            print(f"Player Extraction failed: {e}")
            raise e
        finally:
            db.close()
