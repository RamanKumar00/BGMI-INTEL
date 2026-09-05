import sqlite3

conn = sqlite3.connect('bgmi_intel.db')
cursor = conn.cursor()

# 1. Update Jonathan's team history to Apex Gaming, or update the mock string
cursor.execute("SELECT * FROM player_org_history WHERE player_id='jonathan'")
print("Jonathan History:", cursor.fetchall())

# Let's check team names
cursor.execute("SELECT team_id, team_name FROM teams")
teams = cursor.fetchall()
print("Teams:", teams)

# Let's check Jonathan
cursor.execute("SELECT * FROM players WHERE ign='Jonathan'")
jonathan = cursor.fetchall()
print("Jonathan:", jonathan)

# 2. Update Team XSpark to Revenant XSpark
cursor.execute("UPDATE teams SET team_name='Revenant XSpark' WHERE team_name='Team XSpark' OR team_name='XSpark'")
cursor.execute("UPDATE tournaments SET winner='Revenant XSpark' WHERE winner='Team XSpark'")
print("Updated XSpark rows:", cursor.rowcount)

# 3. Fix dummy image URLs so they don't break the UI
cursor.execute("UPDATE players SET image_url=NULL WHERE image_url LIKE '%example.com%'")
cursor.execute("UPDATE organizations SET logo_url=NULL WHERE logo_url LIKE '%example.com%'")
cursor.execute("UPDATE team_assets SET asset_url=NULL WHERE asset_url LIKE '%example.com%'")

conn.commit()
conn.close()
