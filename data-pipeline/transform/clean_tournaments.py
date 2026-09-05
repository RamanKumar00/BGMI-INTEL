import json
import re
import uuid
import datetime
from transform.clean_players import parse_date


def clean_tournament_record(raw_record):
    """
    Cleans a raw tournament wikitext record into a structured tournament dict.

    Handles real Liquipedia pubgmobile wikitext infobox fields:
      - |sdate= / |edate=  (start/end date — real format)
      - |liquipediatier=   (tier — real format)
      - |prizepool=        (numeric prize pool amount)
      - |localcurrency=    (currency code, e.g. INR, USD)
      - |participants=     (team count — real format)
      - |winner=           (tournament winner)
      - |organizer=        (organizer name)

    Falls back to legacy mock field names (name=, start_date=, tier=, teams=)
    so existing mock records continue to work.
    """
    try:
        raw_data = json.loads(raw_record.raw_json)
        title    = raw_data.get("title", "")
        content  = raw_data.get("content", "")

        def get_infobox_val(field):
            m = re.search(rf'(?i)\|\s*{field}\s*=\s*([^|\n}}]+)', content)
            return m.group(1).strip() if m else None

        # ── Name ─────────────────────────────────────────────────────────
        # Real Liquipedia: |name= inside Infobox league
        name = get_infobox_val("name") or title

        # ── Series / season ──────────────────────────────────────────────
        series = get_infobox_val("series")
        season = get_infobox_val("season") or get_infobox_val("shortname")

        # ── Dates — real format uses |sdate= / |edate= ───────────────────
        start_str = get_infobox_val("sdate") or get_infobox_val("start_date")
        end_str   = get_infobox_val("edate") or get_infobox_val("end_date")
        start_date = parse_date(start_str)
        end_date   = parse_date(end_str)

        # ── Year ─────────────────────────────────────────────────────────
        year_val = get_infobox_val("year")
        year = None
        if year_val:
            try:
                year = int(year_val)
            except ValueError:
                pass
        if not year and start_date:
            year = start_date.year

        # ── Tier — real format uses |liquipediatier= ─────────────────────
        tier_raw = get_infobox_val("liquipediatier") or get_infobox_val("tier")
        tier = None
        if tier_raw:
            # Convert numeric tiers to descriptive labels
            tier_map = {"1": "S-Tier", "2": "A-Tier", "3": "B-Tier", "4": "C-Tier"}
            tier = tier_map.get(tier_raw.strip(), tier_raw.strip())

        # ── Prize pool ───────────────────────────────────────────────────
        prize_raw  = get_infobox_val("prizepool")
        currency   = get_infobox_val("localcurrency") or get_infobox_val("currency") or ""
        prize_pool = None
        if prize_raw:
            # Strip wiki markup, keep digits and decimal
            clean = re.sub(r'[^\d.]', '', prize_raw)
            if clean:
                try:
                    amount = float(clean)
                    # Format nicely
                    if currency.upper() == "INR":
                        prize_pool = f"₹{amount:,.0f}"
                    elif currency.upper() in ("USD", "US"):
                        prize_pool = f"${amount:,.0f}"
                    else:
                        prize_pool = f"{currency} {amount:,.0f}".strip()
                except ValueError:
                    prize_pool = prize_raw
            else:
                # Original string had no digits — might already be formatted (e.g. "₹2,00,00,000")
                prize_pool = prize_raw

        # ── Teams / participants ──────────────────────────────────────────
        teams_raw  = get_infobox_val("participants") or get_infobox_val("teams")
        num_teams  = None
        if teams_raw:
            try:
                num_teams = int(re.sub(r'\D', '', teams_raw))
            except ValueError:
                pass

        # ── Winner ───────────────────────────────────────────────────────
        # Real Liquipedia: |winner= or inside {{placement|1|TeamName}}
        winner = get_infobox_val("winner")
        if not winner:
            pm = re.search(r'\{\{placement\|1\|([^|}]+)', content, re.IGNORECASE)
            if pm:
                winner = pm.group(1).strip()

        # ── Region ───────────────────────────────────────────────────────
        region = get_infobox_val("country") or get_infobox_val("region") or "India"

        # ── Stable ID ─────────────────────────────────────────────────────
        tournament_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, title.lower().strip()))

        tournament_data = {
            "tournament_id":    tournament_id,
            "tournament_name":  name,
            "series":           series,
            "season":           season,
            "year":             year,
            "tier":             tier,
            "start_date":       start_date,
            "end_date":         end_date,
            "region":           region,
            "prize_pool":       prize_pool,
            "number_of_teams":  num_teams,
            "winner":           winner,
            "source":           raw_record.source,
        }

        return tournament_data
    except Exception as e:
        print(f"Error cleaning tournament raw record {raw_record.id}: {e}")
        return None
