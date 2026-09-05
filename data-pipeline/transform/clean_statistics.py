import json
import re


def _strip_wikitext(value: str) -> str:
    """
    Strips common wikitext markup from a string so we don't store
    raw templates like '{{Placement|1}}' or '[[Team|Name]]' as IGNs.
    """
    if not value:
        return value
    # Remove {{...}} template calls entirely
    value = re.sub(r'\{\{[^}]*\}\}', '', value)
    # Unwrap [[Link|Display]] → Display
    value = re.sub(r'\[\[[^\]]*\|([^\]]+)\]\]', r'\1', value)
    # Unwrap [[Link]] → Link
    value = re.sub(r'\[\[([^\]]+)\]\]', r'\1', value)
    # Remove HTML attribute prefixes like 'align="left"|'
    value = re.sub(r'^[^|]*\|', '', value)
    # Strip leftover pipes and whitespace
    value = value.strip().strip('|').strip()
    return value


def _parse_survival_time(val):
    if val is None:
        return None
    if isinstance(val, (int, float)):
        return float(val)
    if isinstance(val, str):
        val = val.strip()
        if ":" in val:
            parts = val.split(":")
            if len(parts) == 2:
                try:
                    return float(parts[0]) + float(parts[1]) / 60.0
                except ValueError:
                    pass
        try:
            return float(val)
        except ValueError:
            return None
    return None


def clean_stat_record(raw_record):
    """
    Cleans raw statistics payload.
    Supports either match-level or tournament-level records.
    Fields not provided are stored as None (NULL in DB) to protect data integrity.
    """
    try:
        raw_data = json.loads(raw_record.raw_json)
        
        is_esportstats = raw_data.get("source_site") == "esportstats.in"
        if is_esportstats:
            data_dict = raw_data.get("data", {})
            stat_type = raw_data.get("stat_type") # "player_tournament" or "team_tournament"
            prefix = raw_data.get("prefix")
            
            # Map esportstats to our format
            # Currently esportstats data from discover_stats_tables:
            # player_standings: ['id', 'team_id', 'player_name', 'finishes', 'matches', 'max_finishes', 'team_contri']
            # pmwc26: ['id', 'player_name', 'team_id', 'stage_round', 'matches_played', 'finishes', 'deaths', 'knocks', 'assists', 'damage', 'damage_taken', 'survival_time', 'contribution', 'grenades_used', 'smokes_used', 'grenade_elims', 'heals', 'headshots', 'max_distance_elim', 'mvp_points']
            
            if stat_type == "player_tournament":
                player_ign = data_dict.get("player_name", "")
                team_name = "" # team_id is numeric, postgres_loader handles resolution if possible, or we just leave empty
                match_id = None
                tournament_id = prefix # using prefix as a fallback mock ID for now
                
                # We need to restructure raw_data so the rest of the function works
                raw_data["player_ign"] = player_ign
                raw_data["team_name"] = team_name
                raw_data["tournament_id"] = tournament_id
                
                raw_data["finishes"] = data_dict.get("finishes")
                raw_data["matches"] = data_dict.get("matches") or data_dict.get("matches_played")
                raw_data["damage"] = data_dict.get("damage")
                raw_data["knocks"] = data_dict.get("knocks")
                raw_data["assists"] = data_dict.get("assists")
                raw_data["survival_time"] = data_dict.get("survival_time")
                raw_data["headshots"] = data_dict.get("headshots")
            
            elif stat_type == "team_tournament":
                # We do not have a TeamTournamentStats table in schema_models explicitly except through matches,
                # but let's parse it and let loader decide
                player_ign = "TEAM_STAT"
                team_name = str(data_dict.get("team_id", ""))
                match_id = None
                tournament_id = prefix
                
                raw_data["player_ign"] = player_ign
                raw_data["team_name"] = team_name
                raw_data["tournament_id"] = tournament_id
                
                raw_data["finishes"] = data_dict.get("finishes")
                raw_data["matches"] = data_dict.get("matches_played")
                raw_data["points"] = data_dict.get("total_pts")
                raw_data["placement"] = data_dict.get("rank")
        
        player_ign = _strip_wikitext(raw_data.get("player_ign", "") or "")
        team_name  = _strip_wikitext(raw_data.get("team_name",  "") or "")

        # Guard: skip records where wikitext stripping left nothing useful
        if not player_ign or player_ign.startswith("{") or len(player_ign) < 2:
            return None
        
        match_id = raw_data.get("match_id")
        tournament_id = raw_data.get("tournament_id")
        
        # Helper list of fields to extract
        common_fields = [
            "finishes", "kills", "knocks", "damage", "headshots",
            "survival_time", "placement", "points", "grenade_finishes", "assists"
        ]
        
        cleaned_stats = {
            "player_ign": player_ign,
            "team_name": team_name,
            "match_id": match_id,
            "tournament_id": tournament_id,
            "source": raw_record.source
        }
        
        for field in common_fields:
            val = raw_data.get(field)
            if field == "survival_time":
                cleaned_stats[field] = _parse_survival_time(val)
            else:
                cleaned_stats[field] = int(val) if val is not None and field != "damage" else float(val) if val is not None else None

        # If it's a tournament-level aggregate record
        if tournament_id and not match_id:
            cleaned_stats["matches"] = int(raw_data.get("matches")) if raw_data.get("matches") is not None else None
            cleaned_stats["average_damage"] = float(raw_data.get("average_damage")) if raw_data.get("average_damage") is not None else None
            cleaned_stats["average_survival"] = float(raw_data.get("average_survival")) if raw_data.get("average_survival") is not None else None
            cleaned_stats["average_placement"] = float(raw_data.get("average_placement")) if raw_data.get("average_placement") is not None else None
            cleaned_stats["mvp_count"] = int(raw_data.get("mvp_count")) if raw_data.get("mvp_count") is not None else None
            cleaned_stats["fmvp_count"] = int(raw_data.get("fmvp_count")) if raw_data.get("fmvp_count") is not None else None
            cleaned_stats["stat_level"] = raw_data.get("stat_level", "tournament")
        else:
            cleaned_stats["stat_level"] = "match"

        return cleaned_stats
    except Exception as e:
        print(f"Error cleaning statistics raw record {raw_record.id}: {e}")
        return None
