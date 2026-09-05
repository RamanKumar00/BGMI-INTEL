import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

from models.database import SessionLocal
from models.schema_models import (
    Player, Team, Organization, Tournament, Match,
    PlayerOrgHistory, PlayerMatchStats, PlayerTournamentStats,
    RawSourceData, DropLocation, MapEvent
)
from sqlalchemy import func

db = SessionLocal()

players   = db.query(Player).count()
teams     = db.query(Team).count()
orgs      = db.query(Organization).count()
tourns    = db.query(Tournament).count()
matches   = db.query(Match).count()
p_history = db.query(PlayerOrgHistory).count()
p_stats   = db.query(PlayerMatchStats).count()
t_stats   = db.query(PlayerTournamentStats).count()
drops     = db.query(DropLocation).count()
events    = db.query(MapEvent).count()
raw_total = db.query(RawSourceData).count()

src_counts  = db.query(RawSourceData.source,      func.count()).group_by(RawSourceData.source).all()
type_counts = db.query(RawSourceData.entity_type, func.count()).group_by(RawSourceData.entity_type).all()

print("=== DATABASE CONTENTS ===")
print(f"  Players:               {players}")
print(f"  Organizations:         {orgs}")
print(f"  Teams:                 {teams}")
print(f"  Tournaments:           {tourns}")
print(f"  Matches:               {matches}")
print(f"  Career History rows:   {p_history}")
print(f"  Match Stat rows:       {p_stats}")
print(f"  Tournament Stat rows:  {t_stats}")
print(f"  Drop Locations:        {drops}")
print(f"  Map Events:            {events}")
print(f"  Raw Source Records:    {raw_total}")

print("\n=== BY DATA SOURCE ===")
for src, cnt in sorted(src_counts):
    print(f"  {src:<22} {cnt} records")

print("\n=== BY ENTITY TYPE ===")
for etype, cnt in sorted(type_counts):
    print(f"  {etype:<22} {cnt} records")

print("\n=== SAMPLE PLAYERS (first 15) ===")
sample_p = db.query(Player).limit(15).all()
for p in sample_p:
    ign    = (p.ign or "?")[:20].ljust(20)
    role   = (p.role or "?")[:14].ljust(14)
    status = p.status or "?"
    print(f"  {ign} role={role} status={status}")

print("\n=== ALL TOURNAMENTS ===")
tours = db.query(Tournament).order_by(Tournament.year.desc().nullslast()).all()
for t in tours:
    name   = (t.tournament_name or "?")[:54].ljust(54)
    yr     = str(t.year or "?")
    tier   = (t.tier or "?")[:8].ljust(8)
    winner = (t.winner or "?")[:20]
    print(f"  {name} {yr}  {tier}  winner={winner}")

print("\n=== SAMPLE ORGANIZATIONS (first 15) ===")
sample_o = db.query(Organization).limit(15).all()
for o in sample_o:
    print(f"  {o.organization_name}")

print("\n=== CAREER HISTORY SAMPLE (first 10) ===")
hist = db.query(PlayerOrgHistory).limit(10).all()
for h in hist:
    p = db.query(Player).filter_by(player_id=h.player_id).first()
    o = db.query(Organization).filter_by(organization_id=h.organization_id).first()
    pign = (p.ign if p else "?")[:15].ljust(15)
    oname = (o.organization_name if o else "?")[:25].ljust(25)
    print(f"  {pign} -> {oname} joined={h.joined_date}")

db.close()
