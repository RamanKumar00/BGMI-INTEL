import sqlite3

conn = sqlite3.connect('bgmi_intel.db')
cursor = conn.cursor()

# Get Jonathan's ID
cursor.execute("SELECT player_id FROM players WHERE ign='Jonathan'")
jonathan_id = cursor.fetchone()[0]
print("Jonathan ID:", jonathan_id)

# Find if Apex Gaming exists
cursor.execute("SELECT team_id FROM teams WHERE team_name LIKE '%Apex%'")
apex_row = cursor.fetchone()

if not apex_row:
    import uuid
    apex_id = str(uuid.uuid4())
    cursor.execute("INSERT INTO teams (team_id, team_name, source) VALUES (?, ?, ?)", (apex_id, "Apex Gaming", "Manual Fix"))
else:
    apex_id = apex_row[0]

print("Apex Gaming ID:", apex_id)

# Update or insert into team_rosters
cursor.execute("SELECT roster_id FROM team_rosters WHERE player_id=?", (jonathan_id,))
roster_row = cursor.fetchone()

if roster_row:
    cursor.execute("UPDATE team_rosters SET team_id=? WHERE player_id=?", (apex_id, jonathan_id))
else:
    cursor.execute("INSERT INTO team_rosters (team_id, player_id, role) VALUES (?, ?, ?)", (apex_id, jonathan_id, "Assaulter"))

conn.commit()
conn.close()
print("Successfully moved Jonathan to Apex Gaming!")
