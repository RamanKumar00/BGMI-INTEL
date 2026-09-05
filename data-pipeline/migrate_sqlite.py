import sqlite3
import os

db_path = "bgmi_intel.db"

if not os.path.exists(db_path):
    print(f"Database {db_path} not found.")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

def add_column(table, column_def):
    try:
        cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column_def}")
        print(f"Added {column_def} to {table}")
    except sqlite3.OperationalError as e:
        print(f"Skipped {column_def} on {table}: {e}")

# Organizations
add_column("organizations", "logo_source VARCHAR(50)")
add_column("organizations", "logo_source_url VARCHAR(512)")
add_column("organizations", "founded_date DATE")
add_column("organizations", "status VARCHAR(50)")

# Teams
add_column("teams", "rank INTEGER")
add_column("teams", "tournaments_played INTEGER")
add_column("teams", "status VARCHAR(50)")
add_column("teams", "last_updated TIMESTAMP")

# Create team_assets table
cursor.execute('''
CREATE TABLE IF NOT EXISTS team_assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id VARCHAR(50) REFERENCES teams (team_id) ON DELETE CASCADE,
    asset_type VARCHAR(50) NOT NULL,
    asset_url VARCHAR(512) NOT NULL,
    source VARCHAR(50),
    source_url VARCHAR(512),
    license VARCHAR(100),
    is_primary BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
''')

# Create organization_aliases table
cursor.execute('''
CREATE TABLE IF NOT EXISTS organization_aliases (
    alias_id INTEGER PRIMARY KEY AUTOINCREMENT,
    organization_id VARCHAR(50) REFERENCES organizations (organization_id) ON DELETE CASCADE,
    alias VARCHAR(100) NOT NULL,
    valid_from DATE,
    valid_until DATE,
    source VARCHAR(50)
)
''')

conn.commit()
conn.close()
print("Migration completed successfully.")
