import datetime
from sqlalchemy import Column, String, Integer, Float, Date, DateTime, Boolean, ForeignKey, Index, Text, JSON
from sqlalchemy.orm import relationship
from .database import Base

class RawSourceData(Base):
    __tablename__ = "raw_source_data"

    id = Column(Integer, primary_key=True, autoincrement=True)
    source = Column(String(50), nullable=False, index=True)
    source_url = Column(String(512), nullable=True)
    retrieved_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    entity_type = Column(String(50), nullable=False, index=True) # player, team, tournament, etc.
    external_id = Column(String(100), nullable=True, index=True)
    raw_json = Column(Text, nullable=False) # Store JSON string

class Player(Base):
    __tablename__ = "players"

    player_id = Column(String(50), primary_key=True) # Unique internal ID
    ign = Column(String(100), nullable=False, unique=True, index=True) # In-Game Name
    real_name = Column(String(100), nullable=True)
    country = Column(String(100), nullable=True)
    role = Column(String(50), nullable=True)
    status = Column(String(50), nullable=True) # Active, Retired
    image_url = Column(String(512), nullable=True)
    profile_url = Column(String(512), nullable=True)
    source = Column(String(50), nullable=False)
    source_player_id = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    aliases = relationship("PlayerAlias", back_populates="player", cascade="all, delete-orphan")
    rosters = relationship("TeamRoster", back_populates="player")
    org_history = relationship("PlayerOrgHistory", back_populates="player")
    match_stats = relationship("PlayerMatchStats", back_populates="player")
    tournament_stats = relationship("PlayerTournamentStats", back_populates="player")
    map_stats = relationship("PlayerMapStats", back_populates="player")
    achievements = relationship("Achievement", back_populates="player")

class PlayerAlias(Base):
    __tablename__ = "player_aliases"

    alias_id = Column(Integer, primary_key=True, autoincrement=True)
    player_id = Column(String(50), ForeignKey("players.player_id", ondelete="CASCADE"), nullable=False, index=True)
    alias = Column(String(100), nullable=False, index=True)
    source = Column(String(50), nullable=False)

    player = relationship("Player", back_populates="aliases")

class Organization(Base):
    __tablename__ = "organizations"

    organization_id = Column(String(50), primary_key=True)
    organization_name = Column(String(100), nullable=False, unique=True, index=True)
    short_name = Column(String(50), nullable=True)
    logo_url = Column(String(512), nullable=True)
    logo_source = Column(String(50), nullable=True)
    logo_source_url = Column(String(512), nullable=True)
    country = Column(String(100), nullable=True)
    website = Column(String(256), nullable=True)
    social_links = Column(Text, nullable=True) # Stored as JSON string
    founded_date = Column(Date, nullable=True)
    status = Column(String(50), nullable=True)
    source = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    teams = relationship("Team", back_populates="organization")
    org_history = relationship("PlayerOrgHistory", back_populates="organization")
    aliases = relationship("OrganizationAlias", back_populates="organization", cascade="all, delete-orphan")

class OrganizationAlias(Base):
    __tablename__ = "organization_aliases"

    alias_id = Column(Integer, primary_key=True, autoincrement=True)
    organization_id = Column(String(50), ForeignKey("organizations.organization_id", ondelete="CASCADE"), nullable=False, index=True)
    alias = Column(String(100), nullable=False, index=True)
    valid_from = Column(Date, nullable=True)
    valid_until = Column(Date, nullable=True)
    source = Column(String(50), nullable=True)

    organization = relationship("Organization", back_populates="aliases")

class PlayerOrgHistory(Base):
    __tablename__ = "player_org_history"

    history_id = Column(Integer, primary_key=True, autoincrement=True)
    player_id = Column(String(50), ForeignKey("players.player_id", ondelete="CASCADE"), nullable=False, index=True)
    organization_id = Column(String(50), ForeignKey("organizations.organization_id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(50), nullable=True)
    joined_date = Column(Date, nullable=True)
    left_date = Column(Date, nullable=True)
    year_only = Column(Integer, nullable=True, index=True)
    unknown_start = Column(Boolean, default=False)
    unknown_end = Column(Boolean, default=False)
    source = Column(String(50), nullable=False)

    player = relationship("Player", back_populates="org_history")
    organization = relationship("Organization", back_populates="org_history")

class Tournament(Base):
    __tablename__ = "tournaments"

    tournament_id = Column(String(50), primary_key=True)
    tournament_name = Column(String(150), nullable=False, index=True)
    series = Column(String(100), nullable=True)
    season = Column(String(50), nullable=True)
    year = Column(Integer, nullable=True, index=True)
    tier = Column(String(50), nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    region = Column(String(50), nullable=True)
    prize_pool = Column(String(100), nullable=True)
    number_of_teams = Column(Integer, nullable=True)
    winner = Column(String(100), nullable=True)
    source = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    teams = relationship("Team", back_populates="tournament")
    matches = relationship("Match", back_populates="tournament")
    player_tournament_stats = relationship("PlayerTournamentStats", back_populates="tournament")
    player_map_stats = relationship("PlayerMapStats", back_populates="tournament")
    achievements = relationship("Achievement", back_populates="tournament")

class Team(Base):
    __tablename__ = "teams"

    team_id = Column(String(50), primary_key=True)
    team_name = Column(String(100), nullable=False, index=True)
    organization_id = Column(String(50), ForeignKey("organizations.organization_id", ondelete="SET NULL"), nullable=True, index=True)
    tournament_id = Column(String(50), ForeignKey("tournaments.tournament_id", ondelete="CASCADE"), nullable=True, index=True)
    placement = Column(Integer, nullable=True)
    points = Column(Integer, nullable=True)
    rank = Column(Integer, nullable=True)
    tournaments_played = Column(Integer, nullable=True)
    status = Column(String(50), nullable=True)
    last_updated = Column(DateTime, default=datetime.datetime.utcnow)
    source = Column(String(50), nullable=False)

    organization = relationship("Organization", back_populates="teams")
    tournament = relationship("Tournament", back_populates="teams")
    rosters = relationship("TeamRoster", back_populates="team", cascade="all, delete-orphan")
    assets = relationship("TeamAsset", back_populates="team", cascade="all, delete-orphan")
    matches_won = relationship("Match", back_populates="winner_team")
    match_stats = relationship("PlayerMatchStats", back_populates="team")
    tournament_stats = relationship("PlayerTournamentStats", back_populates="team")
    map_events = relationship("MapEvent", back_populates="team")
    drop_locations = relationship("DropLocation", back_populates="team")
    achievements = relationship("Achievement", back_populates="team")

class TeamAsset(Base):
    __tablename__ = "team_assets"

    id = Column(Integer, primary_key=True, autoincrement=True)
    team_id = Column(String(50), ForeignKey("teams.team_id", ondelete="CASCADE"), nullable=False, index=True)
    asset_type = Column(String(50), nullable=False)
    asset_url = Column(String(512), nullable=False)
    source = Column(String(50), nullable=True)
    source_url = Column(String(512), nullable=True)
    license = Column(String(100), nullable=True)
    is_primary = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    team = relationship("Team", back_populates="assets")

class TeamRoster(Base):
    __tablename__ = "team_rosters"

    roster_id = Column(Integer, primary_key=True, autoincrement=True)
    team_id = Column(String(50), ForeignKey("teams.team_id", ondelete="CASCADE"), nullable=False, index=True)
    player_id = Column(String(50), ForeignKey("players.player_id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(50), nullable=True)

    team = relationship("Team", back_populates="rosters")
    player = relationship("Player", back_populates="rosters")

class Match(Base):
    __tablename__ = "matches"

    match_id = Column(String(50), primary_key=True)
    tournament_id = Column(String(50), ForeignKey("tournaments.tournament_id", ondelete="CASCADE"), nullable=False, index=True)
    match_number = Column(Integer, nullable=True)
    map = Column(String(50), nullable=False, index=True) # Erangel, Miramar, Rondo, Sanhok, etc.
    date = Column(Date, nullable=True, index=True)
    stage = Column(String(50), nullable=True)
    group = Column(String(50), nullable=True)
    winner_team_id = Column(String(50), ForeignKey("teams.team_id", ondelete="SET NULL"), nullable=True, index=True)
    source = Column(String(50), nullable=False)

    tournament = relationship("Tournament", back_populates="matches")
    winner_team = relationship("Team", back_populates="matches_won")
    player_match_stats = relationship("PlayerMatchStats", back_populates="match", cascade="all, delete-orphan")
    map_events = relationship("MapEvent", back_populates="match", cascade="all, delete-orphan")
    drop_locations = relationship("DropLocation", back_populates="match", cascade="all, delete-orphan")

class PlayerMatchStats(Base):
    __tablename__ = "player_match_stats"

    stat_id = Column(Integer, primary_key=True, autoincrement=True)
    match_id = Column(String(50), ForeignKey("matches.match_id", ondelete="CASCADE"), nullable=False, index=True)
    player_id = Column(String(50), ForeignKey("players.player_id", ondelete="CASCADE"), nullable=False, index=True)
    team_id = Column(String(50), ForeignKey("teams.team_id", ondelete="CASCADE"), nullable=False, index=True)
    
    finishes = Column(Integer, nullable=True)
    kills = Column(Integer, nullable=True)
    knocks = Column(Integer, nullable=True)
    damage = Column(Float, nullable=True)
    headshots = Column(Integer, nullable=True)
    survival_time = Column(Float, nullable=True)
    placement = Column(Integer, nullable=True)
    points = Column(Integer, nullable=True)
    grenade_finishes = Column(Integer, nullable=True)
    assists = Column(Integer, nullable=True)

    match = relationship("Match", back_populates="player_match_stats")
    player = relationship("Player", back_populates="match_stats")
    team = relationship("Team", back_populates="match_stats")

class PlayerTournamentStats(Base):
    __tablename__ = "player_tournament_stats"

    stat_id = Column(Integer, primary_key=True, autoincrement=True)
    player_id = Column(String(50), ForeignKey("players.player_id", ondelete="CASCADE"), nullable=False, index=True)
    tournament_id = Column(String(50), ForeignKey("tournaments.tournament_id", ondelete="CASCADE"), nullable=False, index=True)
    team_id = Column(String(50), ForeignKey("teams.team_id", ondelete="CASCADE"), nullable=False, index=True)

    matches = Column(Integer, nullable=True)
    finishes = Column(Integer, nullable=True)
    kills = Column(Integer, nullable=True)
    knocks = Column(Integer, nullable=True)
    damage = Column(Float, nullable=True)
    average_damage = Column(Float, nullable=True)
    average_survival = Column(Float, nullable=True)
    average_placement = Column(Float, nullable=True)
    headshots = Column(Integer, nullable=True)
    mvp_count = Column(Integer, nullable=True)
    fmvp_count = Column(Integer, nullable=True)
    points = Column(Integer, nullable=True)
    stat_level = Column(String(20), nullable=False) # tournament, calculated

    player = relationship("Player", back_populates="tournament_stats")
    tournament = relationship("Tournament", back_populates="player_tournament_stats")
    team = relationship("Team", back_populates="tournament_stats")

class PlayerMapStats(Base):
    __tablename__ = "player_map_stats"

    stat_id = Column(Integer, primary_key=True, autoincrement=True)
    player_id = Column(String(50), ForeignKey("players.player_id", ondelete="CASCADE"), nullable=False, index=True)
    tournament_id = Column(String(50), ForeignKey("tournaments.tournament_id", ondelete="CASCADE"), nullable=False, index=True)
    map = Column(String(50), nullable=False, index=True)

    matches = Column(Integer, nullable=True)
    finishes = Column(Integer, nullable=True)
    kills = Column(Integer, nullable=True)
    damage = Column(Float, nullable=True)
    survival_time = Column(Float, nullable=True)
    average_placement = Column(Float, nullable=True)
    points = Column(Integer, nullable=True)

    player = relationship("Player", back_populates="map_stats")
    tournament = relationship("Tournament", back_populates="player_map_stats")

class MapEvent(Base):
    __tablename__ = "map_events"

    event_id = Column(String(50), primary_key=True)
    match_id = Column(String(50), ForeignKey("matches.match_id", ondelete="CASCADE"), nullable=False, index=True)
    map = Column(String(50), nullable=False, index=True)
    team_id = Column(String(50), ForeignKey("teams.team_id", ondelete="CASCADE"), nullable=False, index=True)
    player_id = Column(String(50), ForeignKey("players.player_id", ondelete="CASCADE"), nullable=False, index=True)
    event_type = Column(String(50), nullable=False, index=True) # DROP, KILL, DEATH, REVIVE, ROTATION, ZONE, etc.
    x = Column(Float, nullable=True)
    y = Column(Float, nullable=True)
    timestamp = Column(Float, nullable=True)
    source = Column(String(50), nullable=False)

    match = relationship("Match", back_populates="map_events")
    team = relationship("Team", back_populates="map_events")

class DropLocation(Base):
    __tablename__ = "drop_locations"

    drop_id = Column(Integer, primary_key=True, autoincrement=True)
    team_id = Column(String(50), ForeignKey("teams.team_id", ondelete="CASCADE"), nullable=False, index=True)
    match_id = Column(String(50), ForeignKey("matches.match_id", ondelete="CASCADE"), nullable=False, index=True)
    map = Column(String(50), nullable=False, index=True)
    drop_location = Column(String(100), nullable=False, index=True)
    x = Column(Float, nullable=True)
    y = Column(Float, nullable=True)
    timestamp = Column(Float, nullable=True)

    team = relationship("Team", back_populates="drop_locations")
    match = relationship("Match", back_populates="drop_locations")

class Achievement(Base):
    __tablename__ = "achievements"

    achievement_id = Column(String(50), primary_key=True)
    player_id = Column(String(50), ForeignKey("players.player_id", ondelete="CASCADE"), nullable=True, index=True)
    team_id = Column(String(50), ForeignKey("teams.team_id", ondelete="CASCADE"), nullable=True, index=True)
    tournament_id = Column(String(50), ForeignKey("tournaments.tournament_id", ondelete="CASCADE"), nullable=True, index=True)
    title = Column(String(200), nullable=False)
    date = Column(Date, nullable=True, index=True)
    source = Column(String(50), nullable=False)

    player = relationship("Player", back_populates="achievements")
    team = relationship("Team", back_populates="achievements")
    tournament = relationship("Tournament", back_populates="achievements")

class MediaAsset(Base):
    __tablename__ = "media_assets"

    media_id = Column(String(50), primary_key=True)
    title = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=True)
    image_url = Column(String(512), nullable=False)
    thumbnail_url = Column(String(512), nullable=True)
    category = Column(String(50), nullable=False, index=True) # Esports, Teams, Players, BGMI, Events, Wallpapers
    tags = Column(String(256), nullable=True, index=True) # Comma-separated or search tags
    resolution = Column(String(50), nullable=True, index=True) # 4K, 2K, Full HD, HD
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    orientation = Column(String(20), nullable=True, index=True) # Landscape, Portrait, Square
    file_size = Column(String(50), nullable=True)
    file_format = Column(String(20), nullable=True)
    view_count = Column(Integer, default=0, index=True)
    download_count = Column(Integer, default=0, index=True)
    featured = Column(Boolean, default=False, index=True)
    status = Column(String(50), default="active", index=True)
    tournament_id = Column(String(50), ForeignKey("tournaments.tournament_id", ondelete="SET NULL"), nullable=True, index=True)
    team_id = Column(String(50), ForeignKey("teams.team_id", ondelete="SET NULL"), nullable=True, index=True)
    player_id = Column(String(50), ForeignKey("players.player_id", ondelete="SET NULL"), nullable=True, index=True)
    source = Column(String(50), nullable=True)
    license = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    tournament = relationship("Tournament")
    team = relationship("Team")
    player = relationship("Player")

