import json
import re
import uuid
from transform.normalize_names import normalize_organization_name

def clean_team_record(raw_record):
    """
    Cleans a raw team/organization wikitext record.
    """
    try:
        raw_data = json.loads(raw_record.raw_json)
        title = raw_data.get("title", "")
        content = raw_data.get("content", "")

        def get_infobox_val(field):
            match = re.search(rf'(?i)\|\s*{field}\s*=\s*([^|\n}}]+)', content)
            return match.group(1).strip() if match else None

        name = get_infobox_val("name") or title
        short_name = get_infobox_val("shortname")
        logo_url = get_infobox_val("image")
        country = get_infobox_val("country")
        website = get_infobox_val("website")
        twitter = get_infobox_val("twitter")

        # Normalize org name
        norm_org_name = normalize_organization_name(name)
        org_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, norm_org_name.lower().strip()))
        team_id = org_id # In simple models, we treat org_id and team_id as linked

        socials = {}
        if twitter:
            socials["twitter"] = twitter

        org_data = {
            "organization_id": org_id,
            "organization_name": name,
            "short_name": short_name,
            "logo_url": logo_url,
            "country": country,
            "website": website,
            "social_links": json.dumps(socials) if socials else None,
            "source": raw_record.source
        }

        team_data = {
            "team_id": team_id,
            "team_name": name,
            "organization_id": org_id,
            "source": raw_record.source
        }

        return {
            "organization": org_data,
            "team": team_data
        }
    except Exception as e:
        print(f"Error cleaning team raw record {raw_record.id}: {e}")
        return None
