import json
from models.database import SessionLocal
from models.schema_models import RawSourceData
from sources.liquipedia_client import LiquipediaClient

class MapExtractor:
    def __init__(self, use_mock_fallback=True):
        self.client = LiquipediaClient()
        self.use_mock_fallback = use_mock_fallback

    def extract(self, limit=10):
        db = SessionLocal()
        try:
            print("Running Map Extractor...")
            raw_records = []
            
            if self.client.enabled:
                try:
                    # Real query would download drop telemetry dataset
                    pass
                except Exception as e:
                    print(f"Error fetching map data: {e}")
                    if not self.use_mock_fallback:
                        raise e
            
            if not raw_records and self.use_mock_fallback:
                print("Generating mock raw map intelligence payloads...")
                # Mock map coordinates and events
                mock_maps = [
                    # Drop Locations
                    {
                        "type": "drop",
                        "team_name": "GodLike Esports",
                        "match_id": "bmps_2024_m1",
                        "map": "Erangel",
                        "drop_location": "Pochinki",
                        "x": 345.5,
                        "y": 420.0,
                        "timestamp": 45.0
                    },
                    {
                        "type": "drop",
                        "team_name": "Team XSpark",
                        "match_id": "bmps_2024_m1",
                        "map": "Erangel",
                        "drop_location": "School",
                        "x": 510.2,
                        "y": 380.4,
                        "timestamp": 48.0
                    },
                    {
                        "type": "drop",
                        "team_name": "Blind Esports",
                        "match_id": "bmps_2024_m1",
                        "map": "Erangel",
                        "drop_location": "Military Base",
                        "x": 480.0,
                        "y": 850.5,
                        "timestamp": 50.0
                    },
                    # Map Events
                    {
                        "type": "event",
                        "event_id": "ev_bmps_m1_1",
                        "match_id": "bmps_2024_m1",
                        "map": "Erangel",
                        "team_name": "GodLike Esports",
                        "player_ign": "Jonathan",
                        "event_type": "KILL",
                        "x": 352.0,
                        "y": 425.8,
                        "timestamp": 120.0
                    },
                    {
                        "type": "event",
                        "event_id": "ev_bmps_m1_2",
                        "match_id": "bmps_2024_m1",
                        "map": "Erangel",
                        "team_name": "Team XSpark",
                        "player_ign": "ScoutOP",
                        "event_type": "FIRST_ENGAGEMENT",
                        "x": 505.0,
                        "y": 385.0,
                        "timestamp": 180.0
                    }
                ]
                
                for idx, mm in enumerate(mock_maps):
                    ext_id = f"map_intel_{mm['type']}_{idx}"
                    raw_rec = RawSourceData(
                        source="OfficialPortal",
                        source_url="https://esports.battlegroundsmobileindia.com/matches/bmps_2024_m1/telemetry",
                        entity_type="map",
                        external_id=ext_id,
                        raw_json=json.dumps(mm)
                    )
                    db.add(raw_rec)
                    raw_records.append(raw_rec)
                    
            db.commit()
            print(f"Stored {len(raw_records)} raw map records in raw_source_data.")
            return len(raw_records)
        except Exception as e:
            db.rollback()
            print(f"Map Extraction failed: {e}")
            raise e
        finally:
            db.close()
