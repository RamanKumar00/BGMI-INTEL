# BGMI Intel - Data Extraction & ETL Pipeline

This directory contains the database design, data extraction scripts, and FastAPI web backend that collects, normalizes, and serves real historical BGMI Esports telemetry and statistics to the React frontend.

---

## 1. Directory Structure

```
/data-pipeline
    /config
        sources.yaml           # Enable/disable extractors, set API URLs and rate limits
    /extractors
        player_extractor.py    # Fetches player details from Liquipedia wikitext
        team_extractor.py      # Fetches organization listings & logs
        tournament_extractor.py# Fetches BGIS, BMPS, BGMS details
        match_extractor.py     # Parses match listings & winner data
        statistics_extractor.py# Pulls match-level & tournament stats
        map_extractor.py       # Pulls spatial coordinates & landing/circle events
    /sources
        liquipedia_client.py   # Rate-limiting API client with compliant User-Agent headers
    /transform
        clean_players.py       # Normalizes players, parses wikitext history timelines
        clean_teams.py         # Normalizes organizations and team records
        clean_tournaments.py   # Processes prize pools, tier codes, start/end dates
        clean_matches.py       # Normalizes stages, maps (Erangel, Miramar, Rondo)
        clean_statistics.py    # Sanitizes stats preserving NULL values for missing data
        normalize_names.py     # String matching (Levenshtein) and organization aliases
    /load
        postgres_loader.py     # Inserts/updates data with index links and duplicate audits
    /models
        database.py            # SQLAlchemy engine setup with SQLite fallback options
        schema_models.py       # SQLAlchemy structural tables & index declarations
    main.py                    # Pipeline CLI executable entrypoint
    server.py                  # FastAPI server endpoints
    requirements.txt           # Python package dependencies
    schema.sql                 # Pure SQL DDL schema script
```

---

## 2. Environment Variables

Create a `.env` file in the `/data-pipeline` directory (see [.env.example](.env.example) for reference):

```bash
# PostgreSQL Connection URL
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/bgmi_intel

# Web API Settings
API_HOST=127.0.0.1
API_PORT=8000
DEBUG_MODE=True

# Apify Scraper Integration
APIFY_TOKEN=your_token

# User-Agent details to comply with Liquipedia API rules
LIQUIPEDIA_USER_AGENT=BGMIIntelETL/1.0 (contact@bgmi-intel.com)
```

---

## 3. Database Schema

The database is normalized to prevent duplication and preserve data lineage. Major tables include:

- **`raw_source_data`**: Audits raw JSON outputs before cleaning.
- **`players` & `player_aliases`**: Maps aliases (e.g., `"Jonathan"`, `"JONATHAN"`) back to a unique player.
- **`organizations` & `player_org_history`**: Tracks player career histories with start/end dates.
- **`tournaments` & `teams`**: Logs tournament series and team participations.
- **`matches`**: Maps tournament matches by maps (Erangel, Miramar, Rondo, Sanhok, etc.).
- **`player_match_stats` & `player_tournament_stats`**: Matches finishes, knocks, assists, and damage metrics.
- **`map_events` & `drop_locations`**: Telemetry log containing drop coordinates `(x, y)` and landing time details.

Indexes are created on:
- Player IGN (`players.ign`)
- Organization Name (`organizations.organization_name`)
- Tournament Year (`tournaments.year`)
- Matches Map (`matches.map`)
- Match ID and Player ID foreign keys

---

## 4. How to Run the Pipeline

### Install Dependencies
Ensure you have python 3.9+ and run:
```bash
pip install -r requirements.txt
```

### Full Import
Runs extraction, transformation, name cleaning, database load, validation checks, and compiles the summary report:
```bash
python main.py --full
```

### Incremental Updates
Extracts and updates only records modified since the last import:
```bash
python main.py --update
```

### Validate Data Quality
Runs verification checks against negative stats, duplicate players, or unsupported map listings:
```bash
python main.py --validate
```

### Export Data Quality Report
Outputs a summary of processed records, inserts, updates, and duplicates flagged:
```bash
python main.py --report
```

---

## 5. Web API endpoints

Run the FastAPI web backend:
```bash
python server.py
```
This serves endpoints on `http://127.0.0.1:8000/docs`, including:
- `GET /api/players/trending`
- `GET /api/players/search?q=jon`
- `GET /api/players/{id}/career`
- `GET /api/dashboard/stats`
- `GET /api/maps/{map_name}/drops`

---

## 6. Pipeline Design Rules

1. **NO FAKE DATA**: Missing stats (e.g. survival times, grenade finishes) are saved as `NULL` (never `0` unless explicitly reported).
2. **RATE LIMITS**: Enforces a strict 2.0-second delay between queries to Liquipedia to respect term conditions.
3. **DEDUPLICATION**: Does not merge players based on name similarity alone. Strings with Levenshtein edit distance similarity of >80% are flagged as duplicates in the report for manual resolution.
