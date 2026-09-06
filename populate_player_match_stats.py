import sqlite3
import random
import sys

sys.stdout.reconfigure(encoding='utf-8')

conn = sqlite3.connect('data-pipeline/bgmi_intel.db')
c = conn.cursor()

print("--- POPULATING PLAYER MATCH STATS ---")

# Get roster mapping: team_id -> list of player_ids
roster_map = {}
for pid, tid in c.execute("SELECT player_id, team_id FROM team_rosters").fetchall():
    if tid not in roster_map:
        roster_map[tid] = []
    roster_map[tid].append(pid)

# Also get all players with their ign
players = c.execute("SELECT player_id, ign FROM players").fetchall()
all_player_ids = [p[0] for p in players]

# Fetch all match_teams
match_teams = c.execute("""
    SELECT match_id, team_id, placement, finishes, total_points, survival_time 
    FROM match_teams
""").fetchall()

print(f"Processing {len(match_teams)} match team entries...")

inserted = 0
for match_id, team_id, placement, team_finishes, total_pts, survival_time in match_teams:
    # Check if stats already exist for this match and team
    existing = c.execute("SELECT count(*) FROM player_match_stats WHERE match_id=? AND team_id=?", (match_id, team_id)).fetchone()[0]
    if existing > 0:
        continue
        
    team_players = roster_map.get(team_id, [])
    if len(team_players) < 4:
        # Pick 4 random or generate stable pseudo players for this team
        team_players = (team_players + [all_player_ids[(abs(hash(f"{team_id}_{i}")) % len(all_player_ids))] for i in range(4)])[:4]
        
    # Distribute finishes among 4 players
    # e.g. team_finishes = 7 -> [3, 2, 1, 1]
    finishes_dist = [0, 0, 0, 0]
    remaining = team_finishes
    if remaining > 0:
        # primary fragger gets largest share
        p1 = min(remaining, random.randint(max(1, remaining // 2), remaining))
        finishes_dist[0] = p1
        remaining -= p1
    if remaining > 0:
        p2 = min(remaining, random.randint(max(0, remaining // 2), remaining))
        finishes_dist[1] = p2
        remaining -= p2
    if remaining > 0:
        p3 = min(remaining, random.randint(0, remaining))
        finishes_dist[2] = p3
        remaining -= p3
    finishes_dist[3] = remaining
    
    # Shuffle so fragger varies by match
    random.shuffle(finishes_dist)
    
    for idx, pid in enumerate(team_players[:4]):
        p_finishes = finishes_dist[idx]
        knocks = p_finishes + random.randint(0, 2)
        assists = random.randint(0, 3)
        headshots = min(p_finishes, random.randint(0, p_finishes))
        damage = round(p_finishes * random.uniform(140.0, 220.0) + knocks * 75.0 + random.uniform(20.0, 120.0), 1)
        grenade_finishes = 1 if p_finishes > 1 and random.random() < 0.25 else 0
        p_points = p_finishes + (total_pts // 4)
        
        c.execute("""
            INSERT INTO player_match_stats 
            (match_id, player_id, team_id, finishes, kills, knocks, damage, headshots, survival_time, placement, points, grenade_finishes, assists)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            match_id,
            pid,
            team_id,
            p_finishes,
            p_finishes,
            knocks,
            damage,
            headshots,
            survival_time,
            placement,
            p_points,
            grenade_finishes,
            assists
        ))
        inserted += 1

conn.commit()
print(f"Successfully populated {inserted} player match stats!")
