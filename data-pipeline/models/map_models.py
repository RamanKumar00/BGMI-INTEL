import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from models.database import Base

class MapModel(Base):
    __tablename__ = "maps"

    map_id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False, unique=True)
    slug = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=True)
    image_url = Column(String(512), nullable=False)
    width = Column(Integer, default=2048)
    height = Column(Integer, default=2048)
    size_km = Column(String(20), default="8x8 km")
    version = Column(String(50), default="v3.2 (Current)")
    game = Column(String(50), default="BGMI")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    markers = relationship("MapMarkerModel", back_populates="map", cascade="all, delete-orphan")
    layers = relationship("MapLayerModel", back_populates="map", cascade="all, delete-orphan")


class MapLayerModel(Base):
    __tablename__ = "map_layers"

    layer_id = Column(String(50), primary_key=True)
    map_id = Column(String(50), ForeignKey("maps.map_id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    layer_type = Column(String(50), nullable=False, index=True) # vehicle, boat, location, drop, grid
    icon = Column(String(50), nullable=True)
    enabled = Column(Boolean, default=True)
    display_order = Column(Integer, default=1)
    description = Column(String(255), nullable=True)

    map = relationship("MapModel", back_populates="layers")


class MapMarkerModel(Base):
    __tablename__ = "map_markers"

    marker_id = Column(String(50), primary_key=True)
    map_id = Column(String(50), ForeignKey("maps.map_id", ondelete="CASCADE"), nullable=False, index=True)
    layer_type = Column(String(50), nullable=False, index=True) # vehicle, boat, location, drop
    name = Column(String(150), nullable=False)
    x = Column(Float, nullable=False) # 0 to 100 percentage or game coordinate
    y = Column(Float, nullable=False) # 0 to 100 percentage or game coordinate
    category = Column(String(100), nullable=True) # Major City, Compound, Garage, Roadside, Dock, Island
    sub_type = Column(String(100), nullable=True) # Dacia, UAZ, Buggy, Motorcycle, Speedboat, Aquarail, Tier 3 Loot
    description = Column(Text, nullable=True)
    metadata_json = Column(Text, nullable=True) # JSON string for extra fields: vehicle probability, dominant team, etc.
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    map = relationship("MapModel", back_populates="markers")
