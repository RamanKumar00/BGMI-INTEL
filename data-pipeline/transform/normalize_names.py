import re

def levenshtein_distance(s1, s2):
    """Calculates Levenshtein distance in pure Python for robust offline runs"""
    s1 = s1.lower().strip()
    s2 = s2.lower().strip()
    if len(s1) < len(s2):
        return levenshtein_distance(s2, s1)
    if len(s2) == 0:
        return len(s1)
    
    previous_row = list(range(len(s2) + 1))
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row
    return previous_row[-1]

def clean_ign(ign):
    """Cleans in-game-names, stripping clan tags or gaming additions"""
    if not ign:
        return ""
    # Strip common gaming prefixes/suffixes like Esports, Gaming, OP, YT
    cleaned = ign.strip()
    # Remove things like "Gaming" or "Esports" from player names if isolated
    cleaned = re.sub(r'(?i)\b(gaming|esports|yt|op|official)\b', '', cleaned)
    return cleaned.strip()

def are_similar_players(p1_ign, p2_ign, p1_real="", p2_real=""):
    """
    Checks if two players are potentially duplicates.
    Combines IGN Levenshtein check and real names comparison.
    """
    c1 = clean_ign(p1_ign)
    c2 = clean_ign(p2_ign)
    
    # Exact cleaned match
    if c1.lower() == c2.lower() and len(c1) > 2:
        return True, "Cleaned IGN match"
        
    # Levenshtein distance match
    dist = levenshtein_distance(c1, c2)
    max_len = max(len(c1), len(c2))
    if max_len > 0 and (dist / max_len) < 0.25: # Less than 25% edit difference
        return True, f"Levenshtein similarity (distance {dist})"
        
    # Real name check
    if p1_real and p2_real:
        p1_r = p1_real.lower().strip()
        p2_r = p2_real.lower().strip()
        if p1_r == p2_r and len(p1_r) > 4:
            return True, "Real name match"
            
    return False, ""

def normalize_organization_name(org_name):
    """Normalizes organization names to resolve spelling variations"""
    if not org_name:
        return ""
    org = org_name.strip().upper()
    # Common mappings
    mappings = {
        "GODLIKE ESPORTS": "GODLIKE",
        "GODLIKE": "GODLIKE",
        "TEAM XSPARK": "XSPARK",
        "TEAM X SPARK": "XSPARK",
        "XSPARK": "XSPARK",
        "BLIND ESPORTS": "BLIND",
        "BLIND": "BLIND",
        "OR ESPORTS": "OR",
        "ORESPORTS": "OR",
        "ENTITY GAMING": "ENTITY",
        "ENTITY": "ENTITY",
        "SOUL": "SOUL",
        "TEAM SOUL": "SOUL",
        "TEAM APEX GAMING": "APEX GAMING",
        "APEX GAMING": "APEX GAMING",
        "APEX": "APEX GAMING"
    }
    return mappings.get(org, org_name.strip())

