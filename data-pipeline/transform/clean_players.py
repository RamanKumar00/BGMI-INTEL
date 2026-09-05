import json
import re
import uuid
import datetime
from transform.normalize_names import normalize_organization_name

def parse_date(date_str):
    """Safely parses dates in YYYY-MM-DD format. Returns None if invalid or placeholder."""
    if not date_str or date_str.lower() in ["present", "unknown", ""]:
        return None
    try:
        # Match YYYY-MM-DD
        match = re.match(r'^(\d{4})-(\d{2})-(\d{2})$', date_str.strip())
        if match:
            return datetime.date(int(match.group(1)), int(match.group(2)), int(match.group(3)))
        # Match YYYY
        match_y = re.match(r'^(\d{4})$', date_str.strip())
        if match_y:
            return datetime.date(int(match_y.group(1)), 1, 1)
    except Exception:
        pass
    return None

def clean_player_record(raw_record):
    """
    Cleans a raw player JSON record into structured player & career history dicts.
    """
    try:
        raw_data = json.loads(raw_record.raw_json)
        title = raw_data.get("title", "")
        content = raw_data.get("content", "")
        
        # Regex parsing of real Liquipedia pubgmobile wikitext infobox values
        def get_infobox_val(field):
            match = re.search(rf'(?i)\|\s*{field}\s*=\s*([^|\n}}]+)', content)
            return match.group(1).strip() if match else None

        # Real Liquipedia field: |id= is the IGN, not |ign=
        ign = get_infobox_val("id") or get_infobox_val("ign") or title
        # Real Liquipedia field: |romanized_name= for English name, or |name= fallback
        real_name = get_infobox_val("romanized_name") or get_infobox_val("name")
        country = get_infobox_val("country")
        # Real Liquipedia field: |roles= (plural) or |role=
        role = get_infobox_val("roles") or get_infobox_val("role")
        status = get_infobox_val("status") or "Active"
        image_url = get_infobox_val("image")

        # Generate stable ID based on IGN
        player_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, ign.lower().strip()))

        player_data = {
            "player_id": player_id,
            "ign": ign,
            "real_name": real_name,
            "country": country,
            "role": role,
            "status": status,
            "image_url": image_url,
            "profile_url": raw_record.source_url,
            "source": raw_record.source,
            "source_player_id": raw_record.external_id
        }

        # Parse Organization History
        # Real Liquipedia format: {{TH|2019 — 2019-06-??|Team SkuLL}}
        # Legacy fallback:        {{History|2021-06-01|2021-08-01|TSM Entity}}
        history_records = []
        
        # Try real {{TH|...}} format first (two-arg: date_range|team or three-arg: start|end|team)
        th_matches = re.finditer(
            r'\{\{TH\s*\|\s*([^|\}]+)\|\s*([^|\}]+)(?:\|\s*([^\}]*))?\}\}',
            content
        )
        found_th = False
        for hm in th_matches:
            found_th = True
            g1 = hm.group(1).strip()  # date range OR start date
            g2 = hm.group(2).strip()  # team name OR end date
            g3 = hm.group(3).strip() if hm.group(3) else None  # team name (3-arg form)

            if g3:
                # 3-arg form: {{TH|start|end|team}}
                join_str, left_str, org_raw = g1, g2, g3
            else:
                # 2-arg form: {{TH|date_range|team}}, e.g. "2019 — 2019-06-??|Team SkuLL"
                # Split the date range on em-dash or hyphen to get start
                date_parts = re.split(r'\s*[—–-]\s*', g1, maxsplit=1)
                join_str = date_parts[0].strip()
                left_str = date_parts[1].strip() if len(date_parts) > 1 else "Present"
                org_raw = g2

            joined_date = parse_date(join_str)
            left_date = parse_date(left_str)

            unknown_start = joined_date is None
            unknown_end = left_date is None and left_str.lower() not in ["present", "'''present'''"]

            year_only = None
            if joined_date:
                year_only = joined_date.year
            elif re.match(r'^\d{4}$', join_str):
                year_only = int(join_str)

            history_records.append({
                "player_id": player_id,
                "org_name": org_raw,
                "normalized_org": normalize_organization_name(org_raw),
                "role": role,
                "joined_date": joined_date,
                "left_date": left_date,
                "year_only": year_only,
                "unknown_start": unknown_start,
                "unknown_end": unknown_end,
                "source": raw_record.source
            })

        if not found_th:
            # Legacy fallback: {{History|start|end|team}}
            history_matches = re.finditer(r'(?i)\{\{History\|([^|]+)\|([^|]+)\|([^}]+)\}\}', content)
            for hm in history_matches:
                join_str = hm.group(1).strip()
                left_str = hm.group(2).strip()
                org_raw = hm.group(3).strip()
                
                joined_date = parse_date(join_str)
                left_date = parse_date(left_str)
                
                unknown_start = joined_date is None
                unknown_end = left_date is None and left_str.lower() != "present"
                
                year_only = None
                if joined_date:
                    year_only = joined_date.year
                elif re.match(r'^\d{4}$', join_str):
                    year_only = int(join_str)

                history_records.append({
                    "player_id": player_id,
                    "org_name": org_raw,
                    "normalized_org": normalize_organization_name(org_raw),
                    "role": role,
                    "joined_date": joined_date,
                    "left_date": left_date,
                    "year_only": year_only,
                    "unknown_start": unknown_start,
                    "unknown_end": unknown_end,
                    "source": raw_record.source
                })

        return {
            "player": player_data,
            "history": history_records
        }
    except Exception as e:
        print(f"Error cleaning player raw record {raw_record.id}: {e}")
        return None
