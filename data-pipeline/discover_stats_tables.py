import requests

URL = "https://tgizxbpxtvoejlcygboy.supabase.co/rest/v1"
KEY = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnaXp4YnB4dHZvZWpsY3lnYm95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3MTY4MjEsImV4cCI6MjEwMTI5MjgyMX0."
    "5kYnGMljtJCr_E2HP4_bkq6UTl10jjEaSPDE7B2gmvc"
)
H = {"apikey": KEY, "Authorization": f"Bearer {KEY}"}

# List of prefixes to test
prefixes = []
for year in ["2026", "26", "2025", "25", "2024", "24", "2023", "23", "2022", "22", "2021", "21"]:
    for t in ["bgis", "bmps", "bgms", "bmsd", "bmic", "pmwc", "pmgc", "pmpl"]:
        prefixes.append(f"{t}{year}")
        prefixes.append(f"{t}_{year}")
        prefixes.append(f"{t}_s1_{year}")
        prefixes.append(f"{t}_s2_{year}")
prefixes.extend([
    "bgms_s2", "bgms_s1", "bmps_s1", "bgis_s1", "pmgc_s1"
])

found_tables = []

print("=== DISCOVERING ESPORTSTATS STANDINGS & MATCH STAT TABLES ===")
for p in prefixes:
    for suffix in ["_player_standings", "_team_standings", "_match_stats", "_standings", "_player_stats", "_results"]:
        tname = f"{p}{suffix}"
        r = requests.get(f"{URL}/{tname}?limit=1", headers=H)
        if r.ok:
            data = r.json()
            cnt = len(data)
            keys = list(data[0].keys()) if data else []
            print(f"  [FOUND TABLE] {tname:<25} | Columns: {keys}")
            found_tables.append(tname)
        else:
            if r.status_code != 404:
                print(f"  ⚠️ {tname}: HTTP {r.status_code}")

print(f"\nTotal active match/stats tables found: {len(found_tables)}")
