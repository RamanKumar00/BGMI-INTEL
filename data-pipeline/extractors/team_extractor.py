import json
from models.database import SessionLocal
from models.schema_models import RawSourceData
from sources.liquipedia_client import LiquipediaClient

class TeamExtractor:
    def __init__(self, use_mock_fallback=True):
        self.client = LiquipediaClient()
        self.use_mock_fallback = use_mock_fallback

    def extract(self, limit=10):
        db = SessionLocal()
        try:
            print("Running Team Extractor...")
            raw_records = []
            
            if self.client.enabled:
                try:
                    # Real Liquipedia pubgmobile wiki categories (verified via API)
                    members = self.client.fetch_category_members("Indian Teams", limit=limit)
                    if not members:
                        members = self.client.fetch_category_members("Active Teams", limit=limit)

                    for member in members[:limit]:
                        title = member.get("title")
                        page_id = member.get("pageid")
                        print(f"Fetching Liquipedia team content for: {title}")
                        
                        page = self.client.fetch_page_content(title)
                        if page:
                            raw_rec = RawSourceData(
                                source="Liquipedia",
                                source_url=f"https://liquipedia.net/pubgmobile/{title.replace(' ', '_')}",
                                entity_type="team",
                                external_id=str(page_id or title),
                                raw_json=json.dumps(page)
                            )
                            db.add(raw_rec)
                            raw_records.append(raw_rec)
                except Exception as e:
                    print(f"Error fetching teams: {e}")
                    if not self.use_mock_fallback:
                        raise e
            
            if not raw_records and self.use_mock_fallback:
                print("Generating mock raw team/organization payloads...")
                mock_teams = [
                    {"title": "GodLike Esports", "content": "{{Infobox team\n|name=GodLike Esports\n|shortname=GodLike\n|image=https://example.com/godlike.png\n|country=India\n|website=https://godlikeesports.com\n|twitter=https://twitter.com/godlike\n}}", "pageid": 2001},
                    {"title": "Team XSpark", "content": "{{Infobox team\n|name=Team XSpark\n|shortname=XSpark\n|image=https://example.com/xspark.png\n|country=India\n|website=\n|twitter=\n}}", "pageid": 2002},
                    {"title": "Blind Esports", "content": "{{Infobox team\n|name=Blind Esports\n|shortname=Blind\n|image=https://example.com/blind.png\n|country=India\n|website=\n|twitter=\n}}", "pageid": 2003},
                    {"title": "OR Esports", "content": "{{Infobox team\n|name=OR Esports\n|shortname=OR\n|image=https://example.com/or.png\n|country=India\n|website=\n|twitter=\n}}", "pageid": 2004},
                    {"title": "Entity Gaming", "content": "{{Infobox team\n|name=Entity Gaming\n|shortname=Entity\n|image=https://example.com/entity.png\n|country=India\n|website=\n|twitter=\n}}", "pageid": 2005},
                    {"title": "Team Apex Gaming", "content": "{{Infobox team\n|name=Team Apex Gaming\n|shortname=Apex\n|image=https://example.com/apex.png\n|country=India\n|website=\n|twitter=\n}}", "pageid": 2006}
                ]
                
                for mt in mock_teams:
                    raw_rec = RawSourceData(
                        source="Liquipedia",
                        source_url=f"https://liquipedia.net/pubg/{mt['title']}",
                        entity_type="team",
                        external_id=str(mt['pageid']),
                        raw_json=json.dumps(mt)
                    )
                    db.add(raw_rec)
                    raw_records.append(raw_rec)
                    
            db.commit()
            print(f"Stored {len(raw_records)} raw team records in raw_source_data.")
            return len(raw_records)
        except Exception as e:
            db.rollback()
            print(f"Team Extraction failed: {e}")
            raise e
        finally:
            db.close()
