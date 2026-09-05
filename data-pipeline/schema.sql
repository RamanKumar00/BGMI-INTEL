-- BGMI INTEL POSTGRESQL SCHEMA DUMP

-- 1. Raw Source Data
CREATE TABLE raw_source_data (
    id SERIAL PRIMARY KEY,
    source VARCHAR(50) NOT NULL,
    source_url VARCHAR(512),
    retrieved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    entity_type VARCHAR(50) NOT NULL,
    external_id VARCHAR(100),
    raw_json TEXT NOT NULL
);
CREATE INDEX idx_raw_source ON raw_source_data (source);
CREATE INDEX idx_raw_entity ON raw_source_data (entity_type, external_id);

-- 2. Players
CREATE TABLE players (
    player_id VARCHAR(50) PRIMARY KEY,
    ign VARCHAR(100) NOT NULL UNIQUE,
    real_name VARCHAR(100),
    country VARCHAR(100),
    role VARCHAR(50),
    status VARCHAR(50),
    image_url VARCHAR(512),
    profile_url VARCHAR(512),
    source VARCHAR(50) NOT NULL,
    source_player_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_players_ign ON players (ign);

-- 3. Player Aliases
CREATE TABLE player_aliases (
    alias_id SERIAL PRIMARY KEY,
    player_id VARCHAR(50) REFERENCES players (player_id) ON DELETE CASCADE,
    alias VARCHAR(100) NOT NULL,
    source VARCHAR(50) NOT NULL
);
CREATE INDEX idx_aliases_name ON player_aliases (alias);
CREATE INDEX idx_aliases_player ON player_aliases (player_id);

-- 4. Organizations
CREATE TABLE organizations (
    organization_id VARCHAR(50) PRIMARY KEY,
    organization_name VARCHAR(100) NOT NULL UNIQUE,
    short_name VARCHAR(50),
    logo_url VARCHAR(512),
    logo_source VARCHAR(50),
    logo_source_url VARCHAR(512),
    country VARCHAR(100),
    website VARCHAR(256),
    social_links TEXT,
    founded_date DATE,
    status VARCHAR(50),
    source VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_org_name ON organizations (organization_name);

-- 4b. Organization Aliases
CREATE TABLE organization_aliases (
    alias_id SERIAL PRIMARY KEY,
    organization_id VARCHAR(50) REFERENCES organizations (organization_id) ON DELETE CASCADE,
    alias VARCHAR(100) NOT NULL,
    valid_from DATE,
    valid_until DATE,
    source VARCHAR(50)
);
CREATE INDEX idx_org_aliases_org ON organization_aliases (organization_id);
CREATE INDEX idx_org_aliases_name ON organization_aliases (alias);

-- 5. Player Organization History
CREATE TABLE player_org_history (
    history_id SERIAL PRIMARY KEY,
    player_id VARCHAR(50) NOT NULL REFERENCES players (player_id) ON DELETE CASCADE,
    organization_id VARCHAR(50) NOT NULL REFERENCES organizations (organization_id) ON DELETE CASCADE,
    role VARCHAR(50),
    joined_date DATE,
    left_date DATE,
    year_only INTEGER,
    unknown_start BOOLEAN DEFAULT FALSE,
    unknown_end BOOLEAN DEFAULT FALSE,
    source VARCHAR(50) NOT NULL
);
CREATE INDEX idx_poh_player ON player_org_history (player_id);
CREATE INDEX idx_poh_org ON player_org_history (organization_id);
CREATE INDEX idx_poh_year ON player_org_history (year_only);

-- 6. Tournaments
CREATE TABLE tournaments (
    tournament_id VARCHAR(50) PRIMARY KEY,
    tournament_name VARCHAR(150) NOT NULL,
    series VARCHAR(100),
    season VARCHAR(50),
    year INTEGER,
    tier VARCHAR(50),
    start_date DATE,
    end_date DATE,
    region VARCHAR(50),
    prize_pool VARCHAR(100),
    number_of_teams INTEGER,
    winner VARCHAR(100),
    source VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_tournaments_name ON tournaments (tournament_name);
CREATE INDEX idx_tournaments_year ON tournaments (year);

-- 7. Teams
CREATE TABLE teams (
    team_id VARCHAR(50) PRIMARY KEY,
    team_name VARCHAR(100) NOT NULL,
    organization_id VARCHAR(50) REFERENCES organizations (organization_id) ON DELETE SET NULL,
    tournament_id VARCHAR(50) REFERENCES tournaments (tournament_id) ON DELETE CASCADE,
    placement INTEGER,
    points INTEGER,
    rank INTEGER,
    tournaments_played INTEGER,
    status VARCHAR(50),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source VARCHAR(50) NOT NULL
);
CREATE INDEX idx_teams_name ON teams (team_name);
CREATE INDEX idx_teams_org ON teams (organization_id);
CREATE INDEX idx_teams_tournament ON teams (tournament_id);

-- 7b. Team Assets
CREATE TABLE team_assets (
    id SERIAL PRIMARY KEY,
    team_id VARCHAR(50) REFERENCES teams (team_id) ON DELETE CASCADE,
    asset_type VARCHAR(50) NOT NULL,
    asset_url VARCHAR(512) NOT NULL,
    source VARCHAR(50),
    source_url VARCHAR(512),
    license VARCHAR(100),
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_team_assets_team ON team_assets (team_id);

-- 8. Team Rosters
CREATE TABLE team_rosters (
    roster_id SERIAL PRIMARY KEY,
    team_id VARCHAR(50) NOT NULL REFERENCES teams (team_id) ON DELETE CASCADE,
    player_id VARCHAR(50) NOT NULL REFERENCES players (player_id) ON DELETE CASCADE,
    role VARCHAR(50)
);
CREATE INDEX idx_rosters_team ON team_rosters (team_id);
CREATE INDEX idx_rosters_player ON team_rosters (player_id);

-- 9. Matches
CREATE TABLE matches (
    match_id VARCHAR(50) PRIMARY KEY,
    tournament_id VARCHAR(50) NOT NULL REFERENCES tournaments (tournament_id) ON DELETE CASCADE,
    match_number INTEGER,
    map VARCHAR(50) NOT NULL,
    date DATE,
    stage VARCHAR(50),
    "group" VARCHAR(50),
    winner_team_id VARCHAR(50) REFERENCES teams (team_id) ON DELETE SET NULL,
    source VARCHAR(50) NOT NULL
);
CREATE INDEX idx_matches_tournament ON matches (tournament_id);
CREATE INDEX idx_matches_map ON matches (map);
CREATE INDEX idx_matches_date ON matches (date);

-- 10. Player Match Statistics
CREATE TABLE player_match_stats (
    stat_id SERIAL PRIMARY KEY,
    match_id VARCHAR(50) NOT NULL REFERENCES matches (match_id) ON DELETE CASCADE,
    player_id VARCHAR(50) NOT NULL REFERENCES players (player_id) ON DELETE CASCADE,
    team_id VARCHAR(50) NOT NULL REFERENCES teams (team_id) ON DELETE CASCADE,
    finishes INTEGER,
    kills INTEGER,
    knocks INTEGER,
    damage DOUBLE PRECISION,
    headshots INTEGER,
    survival_time DOUBLE PRECISION,
    placement INTEGER,
    points INTEGER,
    grenade_finishes INTEGER,
    assists INTEGER
);
CREATE INDEX idx_pms_match ON player_match_stats (match_id);
CREATE INDEX idx_pms_player ON player_match_stats (player_id);
CREATE INDEX idx_pms_team ON player_match_stats (team_id);

-- 11. Player Tournament Statistics
CREATE TABLE player_tournament_stats (
    stat_id SERIAL PRIMARY KEY,
    player_id VARCHAR(50) NOT NULL REFERENCES players (player_id) ON DELETE CASCADE,
    tournament_id VARCHAR(50) NOT NULL REFERENCES tournaments (tournament_id) ON DELETE CASCADE,
    team_id VARCHAR(50) NOT NULL REFERENCES teams (team_id) ON DELETE CASCADE,
    matches INTEGER,
    finishes INTEGER,
    kills INTEGER,
    knocks INTEGER,
    damage DOUBLE PRECISION,
    average_damage DOUBLE PRECISION,
    average_survival DOUBLE PRECISION,
    average_placement DOUBLE PRECISION,
    headshots INTEGER,
    mvp_count INTEGER,
    fmvp_count INTEGER,
    points INTEGER,
    stat_level VARCHAR(20) NOT NULL
);
CREATE INDEX idx_pts_player ON player_tournament_stats (player_id);
CREATE INDEX idx_pts_tournament ON player_tournament_stats (tournament_id);
CREATE INDEX idx_pts_team ON player_tournament_stats (team_id);

-- 12. Player Map Statistics
CREATE TABLE player_map_stats (
    stat_id SERIAL PRIMARY KEY,
    player_id VARCHAR(50) NOT NULL REFERENCES players (player_id) ON DELETE CASCADE,
    tournament_id VARCHAR(50) NOT NULL REFERENCES tournaments (tournament_id) ON DELETE CASCADE,
    map VARCHAR(50) NOT NULL,
    matches INTEGER,
    finishes INTEGER,
    kills INTEGER,
    damage DOUBLE PRECISION,
    survival_time DOUBLE PRECISION,
    average_placement DOUBLE PRECISION,
    points INTEGER
);
CREATE INDEX idx_pmas_player ON player_map_stats (player_id);
CREATE INDEX idx_pmas_tournament ON player_map_stats (tournament_id);
CREATE INDEX idx_pmas_map ON player_map_stats (map);

-- 13. Map Events (Map Intelligence)
CREATE TABLE map_events (
    event_id VARCHAR(50) PRIMARY KEY,
    match_id VARCHAR(50) NOT NULL REFERENCES matches (match_id) ON DELETE CASCADE,
    map VARCHAR(50) NOT NULL,
    team_id VARCHAR(50) NOT NULL REFERENCES teams (team_id) ON DELETE CASCADE,
    player_id VARCHAR(50) NOT NULL REFERENCES players (player_id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    x DOUBLE PRECISION,
    y DOUBLE PRECISION,
    timestamp DOUBLE PRECISION,
    source VARCHAR(50) NOT NULL
);
CREATE INDEX idx_me_match ON map_events (match_id);
CREATE INDEX idx_me_map ON map_events (map);
CREATE INDEX idx_me_player ON map_events (player_id);
CREATE INDEX idx_me_team ON map_events (team_id);

-- 14. Drop Locations
CREATE TABLE drop_locations (
    drop_id SERIAL PRIMARY KEY,
    team_id VARCHAR(50) NOT NULL REFERENCES teams (team_id) ON DELETE CASCADE,
    match_id VARCHAR(50) NOT NULL REFERENCES matches (match_id) ON DELETE CASCADE,
    map VARCHAR(50) NOT NULL,
    drop_location VARCHAR(100) NOT NULL,
    x DOUBLE PRECISION,
    y DOUBLE PRECISION,
    timestamp DOUBLE PRECISION
);
CREATE INDEX idx_dl_team ON drop_locations (team_id);
CREATE INDEX idx_dl_match ON drop_locations (match_id);
CREATE INDEX idx_dl_location ON drop_locations (drop_location);

-- 15. Achievements
CREATE TABLE achievements (
    achievement_id VARCHAR(50) PRIMARY KEY,
    player_id VARCHAR(50) REFERENCES players (player_id) ON DELETE CASCADE,
    team_id VARCHAR(50) REFERENCES teams (team_id) ON DELETE CASCADE,
    tournament_id VARCHAR(50) REFERENCES tournaments (tournament_id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    date DATE,
    source VARCHAR(50) NOT NULL
);
CREATE INDEX idx_ach_player ON achievements (player_id);
CREATE INDEX idx_ach_team ON achievements (team_id);
CREATE INDEX idx_ach_date ON achievements (date);
