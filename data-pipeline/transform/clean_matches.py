import json
import uuid
import datetime
from transform.clean_players import parse_date

def clean_match_record(raw_record):
    """
    Cleans raw match JSON data.
    """
    try:
        raw_data = json.loads(raw_record.raw_json)
        match_id = raw_record.external_id
        tournament_id = raw_data.get("tournament_id")
        match_number = raw_data.get("match_number")
        map_name = raw_data.get("map", "Erangel")
        date_str = raw_data.get("date")
        stage = raw_data.get("stage", "Grand Finals")
        group = raw_data.get("group", "Finals")
        winner_team_id = raw_data.get("winner_team_id")

        date = parse_date(date_str) if date_str else None

        # Stable tournament ID lookup helper
        # If the raw record has standard tournament_id, we map it. If it is empty, we set fallback
        if not tournament_id:
            tournament_id = "unknown_tournament"

        match_data = {
            "match_id": match_id,
            "tournament_id": tournament_id,
            "match_number": match_number,
            "map": map_name,
            "date": date,
            "stage": stage,
            "group": group,
            "winner_team_id": winner_team_id,
            "source": raw_record.source
        }

        return match_data
    except Exception as e:
        print(f"Error cleaning match raw record {raw_record.id}: {e}")
        return None
