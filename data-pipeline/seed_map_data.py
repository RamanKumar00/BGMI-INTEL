import json
import uuid
from models.database import engine, SessionLocal, Base
from models.map_models import MapModel, MapLayerModel, MapMarkerModel

def init_db():
    print("Creating map tables...")
    Base.metadata.create_all(bind=engine)

def seed_maps_and_spawns():
    db = SessionLocal()
    try:
        init_db()

        # Clear existing map tables for clean seed
        db.query(MapMarkerModel).delete()
        db.query(MapLayerModel).delete()
        db.query(MapModel).delete()
        db.commit()

        # -----------------------------------------------------------------
        # MAP 1: ERANGEL
        # -----------------------------------------------------------------
        erangel = MapModel(
            map_id="erangel",
            name="Erangel",
            slug="erangel",
            description="The original 8x8 km battleground. Balanced terrain of forests, farmlands, urban centers, and a southern military island separated by strategic river channels.",
            image_url="/map_erangel.png",
            width=2048,
            height=2048,
            size_km="8x8 km",
            version="v3.2 (Current BGMI)",
            game="BGMI",
            is_active=True
        )
        db.add(erangel)

        # Layers for Erangel
        erangel_layers = [
            MapLayerModel(layer_id="erangel_vehicle", map_id="erangel", name="Vehicle Spawns", layer_type="vehicle", icon="car", enabled=True, display_order=1, description="Garages & roadside vehicle spawns"),
            MapLayerModel(layer_id="erangel_boat", map_id="erangel", name="Boat Spawns", layer_type="boat", icon="ship", enabled=True, display_order=2, description="Coastal and river speedboat & aquarail spawns"),
            MapLayerModel(layer_id="erangel_location", map_id="erangel", name="Locations & Towns", layer_type="location", icon="map-pin", enabled=True, display_order=3, description="Named cities, compounds & tactical landmarks"),
            MapLayerModel(layer_id="erangel_drop", map_id="erangel", name="Esports Drop Zones", layer_type="drop", icon="shield", enabled=True, display_order=4, description="Dominant team drop telemetry and contest frequency")
        ]
        for l in erangel_layers:
            db.add(l)

        # 1. Locations for Erangel
        erangel_locations = [
            ("Pochinki", 44.5, 53.5, "Major City", "Central hot-drop city with dense residential buildings and church overlook", "Tier 3 (Ultra)"),
            ("Rozhok", 48.2, 33.5, "Major City", "Hillside town north of water channel with excellent rotation access", "Tier 2 (High)"),
            ("School", 51.5, 41.5, "Landmark", "Central competitive battleground featuring school complex and pool area", "Tier 3 (Ultra)"),
            ("School Apartments", 53.5, 42.0, "Compound", "Cluster of 6 puzzle buildings right next to School", "Tier 2 (High)"),
            ("Georgopol", 18.0, 30.0, "Major City", "Massive shipping container yard and northern city with heavy loot", "Tier 3 (Ultra)"),
            ("Hospital", 18.5, 40.0, "Landmark", "Multi-story medical complex west of Georgopol", "Tier 2 (Medium)"),
            ("Yasnaya Polyana", 66.5, 27.0, "Major City", "Largest metropolitan city with high-rise apartment complexes", "Tier 3 (Ultra)"),
            ("Sosnovka Military Base", 53.0, 85.0, "Military Base", "Southern fortress with C-Buildings, radar tower and police station", "Tier 3 (Ultra)"),
            ("Novorepnoye", 84.0, 74.5, "Major City", "Southern sea-port shipping container complex with radio tower", "Tier 3 (Ultra)"),
            ("Mylta", 74.0, 56.0, "Major City", "Coastal residential hub connected to military island bridges", "Tier 2 (Medium)"),
            ("Mylta Power", 93.0, 58.5, "Industrial", "Nuclear power plant on eastern coast with high-tier sniper vantage", "Tier 2 (High)"),
            ("Severny", 51.0, 14.0, "Major City", "Northern coastal settlement with church tower overlooking ocean", "Tier 2 (Medium)"),
            ("Stalber", 70.0, 11.5, "Landmark", "Highest mountain peak in northeastern Erangel with ruins & radio dishes", "Tier 1 (Medium)"),
            ("Kameshki", 88.0, 11.0, "Coastal Town", "Quiet northeast coastal cliff town overlooking sea", "Tier 1 (Medium)"),
            ("Gatka", 24.0, 51.0, "Town", "Western farm village surrounded by trenches and open wheat fields", "Tier 1 (Medium)"),
            ("Ruins", 35.0, 41.0, "Landmark", "Flooded ancient stone columns and sunken courtyard", "Tier 2 (Medium)"),
            ("Shelter", 73.0, 49.0, "Military Base", "Underground bunker bunker network with 4 discrete entrance tunnels", "Tier 2 (Medium)"),
            ("Prison", 81.5, 46.0, "Compound", "Quarry basin holding a maximum-security prison and five warehouses", "Tier 2 (Medium)"),
            ("Mansion", 76.5, 38.5, "Compound", "Walled luxury villa with internal maze and high loot concentration", "Tier 2 (High)"),
            ("Lipovka", 93.0, 41.0, "Major City", "Eastern sea-port town, frequent circle boundary rotation hub", "Tier 2 (Medium)"),
            ("Quarry", 21.0, 67.0, "Industrial", "Limestone excavation pit with tiered gravel ramps and containers", "Tier 1 (Medium)"),
            ("Ferry Pier", 34.0, 72.0, "Coastal Town", "Southern port facing Sosnovka Island with boat access", "Tier 1 (Medium)"),
            ("Primorsk", 25.0, 77.0, "Major City", "Southwestern seaside town with warehouse docks and cliffs", "Tier 2 (Medium)"),
            ("Zharki", 12.0, 11.0, "Coastal Town", "Isolated northwestern seaside village surrounded by autumn trees", "Tier 2 (Medium)"),
            ("Shooting Range", 35.0, 21.0, "Military Base", "Military firing range with target berms and bunker vaults", "Tier 1 (Medium)"),
            ("Farm", 63.0, 56.0, "Town", "Open pastoral farmhouses between Pochinki and Mylta", "Tier 1 (Medium)"),
            ("Water City", 43.0, 36.0, "Landmark", "Submerged residential buildings connected by wooden planks", "Tier 2 (Medium)"),
            ("Radio Tower", 51.5, 78.5, "Landmark", "Mountain radar dish overlooking Sosnovka and northern bridges", "Tier 1 (Low-Med)")
        ]
        for name, x, y, cat, desc, tier in erangel_locations:
            db.add(MapMarkerModel(
                marker_id=f"erangel_loc_{uuid.uuid4().hex[:8]}",
                map_id="erangel",
                layer_type="location",
                name=name,
                x=x,
                y=y,
                category=cat,
                sub_type=tier,
                description=desc,
                metadata_json=json.dumps({"loot_tier": tier, "grid": f"E{int(y/12.5)+1}"})
            ))

        # 2. Vehicle Spawns for Erangel (Garages 100% and Roadside Spawns)
        erangel_vehicles = [
            # Garages (Fixed / High Probability Spawns)
            ("Pochinki Garage East", 46.2, 53.0, "Garage (100%)", "Dacia / Sedan", "Covered garage spawn on eastern exit of Pochinki", 100),
            ("Pochinki West Roadside", 43.0, 54.2, "Roadside Spawn", "UAZ (Closed Top)", "Intersection roadside spawn near church hill", 80),
            ("Rozhok Garage Hill", 48.0, 34.2, "Garage (100%)", "Dacia / Sedan", "South hillside garage compound", 100),
            ("Rozhok Water Intersection", 46.5, 33.0, "Roadside Spawn", "Buggy", "Paved road near bridge crossing", 75),
            ("School Front Parking", 51.2, 42.5, "Parking Lot", "Buggy / Motorcycle", "Main front entrance parking lot", 85),
            ("School Apartments Garage", 54.0, 42.8, "Garage (100%)", "Dacia / Sedan", "East brick garage behind south apartment", 100),
            ("Yasnaya South Garage", 65.5, 29.0, "Garage (100%)", "Dacia / Sedan", "South entrance three-story garage house", 100),
            ("Yasnaya West Road", 63.0, 27.5, "Roadside Spawn", "UAZ (Open Top)", "Main highway into Yasnaya from Rozhok", 80),
            ("Yasnaya North Exit", 68.0, 25.0, "Roadside Spawn", "Motorcycle", "Road heading towards Severny coastline", 70),
            ("Georgopol Southern Garage", 18.0, 33.0, "Garage (100%)", "Dacia / Sedan", "South warehouse road garage", 100),
            ("Georgopol Bridge Intersection", 21.5, 30.5, "Roadside Spawn", "UAZ / Jeep", "Road leading directly to eastern bridge", 85),
            ("Hospital Front Driveway", 19.2, 41.5, "Roadside Spawn", "Coupe RB", "Emergency driveway roundabout", 80),
            ("Military Base West Garage", 50.0, 84.0, "Garage (100%)", "UAZ (Armored)", "Hangar lane garage", 100),
            ("Military Base East Gate", 56.5, 85.5, "Roadside Spawn", "Dacia / Sedan", "Checkpoint roadblock exit", 90),
            ("Novorepnoye West Garage", 81.0, 73.5, "Garage (100%)", "Dacia / Sedan", "Garage house near crane rows", 100),
            ("Novorepnoye Main Highway", 86.0, 75.5, "Roadside Spawn", "UAZ", "East coast perimeter road", 80),
            ("Mylta Garage Center", 73.5, 55.5, "Garage (100%)", "Dacia / Sedan", "Central junction garage", 100),
            ("Mylta Bridge North Checkpoint", 71.0, 62.0, "Roadside Spawn", "Buggy", "Northern abutment of military bridge", 85),
            ("Mylta Power Factory Gate", 92.5, 60.0, "Roadside Spawn", "UAZ", "Outer substation perimeter fence", 80),
            ("Severny Center Garage", 51.5, 15.0, "Garage (100%)", "Dacia / Sedan", "Town square garage building", 100),
            ("Severny East Coastal Curve", 56.0, 14.5, "Roadside Spawn", "Buggy", "Cliffside road to Stalber", 75),
            ("Primorsk Northeast Garage", 26.5, 75.0, "Garage (100%)", "Dacia / Sedan", "Hillside entrance garage", 100),
            ("Gatka South Farm Junction", 24.5, 53.5, "Roadside Spawn", "Motorcycle", "Dirt track crossing near haystack", 70),
            ("Ferry Pier Coastal Highway", 35.5, 73.0, "Roadside Spawn", "Coupe RB", "Shoreline road facing island", 80),
            ("Lipovka Port Garage", 92.0, 42.5, "Garage (100%)", "Dacia / Sedan", "Market square garage", 100),
            ("Mansion Main Gate", 77.5, 39.5, "Roadside Spawn", "UAZ", "Front wrought-iron gate driveway", 85),
            ("Prison Crater Entrance", 82.5, 45.0, "Roadside Spawn", "Buggy", "Switchback descent into prison crater", 80),
            ("Shelter Northwest Bunker", 72.0, 47.5, "Roadside Spawn", "UAZ", "Tunnel mouth dirt road", 80),
            ("Zharki Autumn Loop", 13.5, 12.0, "Roadside Spawn", "Dacia", "Scenic tree grove road", 75),
            ("Shooting Range T-Junction", 36.5, 23.0, "Roadside Spawn", "UAZ", "South intersection on main asphalt road", 80),
            ("Ruins Waterway Cross", 37.0, 39.0, "Roadside Spawn", "Buggy", "Gravel road above water marsh", 70),
            ("Sosnovka Island West Bridge", 38.0, 71.0, "Roadside Spawn", "UAZ", "Southern approach to west bridge", 85),
            ("Sosnovka Island East Bridge", 68.0, 73.0, "Roadside Spawn", "Dacia", "Southern approach to east bridge", 85),
            ("Farm Crossroads", 62.0, 58.0, "Roadside Spawn", "Buggy", "Farm intersection towards bridge", 75),
            ("Stalber Mountain Road", 68.0, 13.0, "Roadside Spawn", "Motorcycle", "Steep switchback turn to summit", 70),
            ("Kameshki Cliffside", 87.0, 13.5, "Roadside Spawn", "UAZ", "Coastal turn above sea", 75)
        ]
        for name, x, y, cat, vtype, desc, prob in erangel_vehicles:
            db.add(MapMarkerModel(
                marker_id=f"erangel_veh_{uuid.uuid4().hex[:8]}",
                map_id="erangel",
                layer_type="vehicle",
                name=name,
                x=x,
                y=y,
                category=cat,
                sub_type=vtype,
                description=desc,
                metadata_json=json.dumps({"probability": f"{prob}%", "vehicle_type": vtype, "spawn_rate": "Guaranteed" if prob==100 else "Common"})
            ))

        # 3. Boat Spawns for Erangel
        erangel_boats = [
            ("Georgopol Harbor Dock", 15.5, 31.0, "Dock Spawn", "PG-117 Speedboat", "Commercial wharf north of Georgopol containers", 95),
            ("Georgopol River Bend", 23.5, 32.0, "River Bank", "Aquarail (Jet Ski)", "River crossing bank south of city", 85),
            ("Rozhok Canal South", 47.0, 37.0, "River Bank", "PG-117 Speedboat", "River shoreline below water city", 90),
            ("Rozhok Bridges East", 53.0, 36.5, "River Bank", "Aquarail", "River bend near eastern road bridge", 80),
            ("Yasnaya Canal Docks", 62.5, 35.0, "River Bank", "PG-117 Speedboat", "River mouth leading to eastern sea", 90),
            ("Lipovka Seaside Wharf", 94.5, 42.0, "Coastline", "PG-117 Speedboat", "Concrete sea ramp east of Lipovka", 95),
            ("Mylta Power Pier", 95.0, 61.0, "Coastline", "PG-117 Speedboat", "Cooling intake jetty on far east coast", 90),
            ("Mylta Beach Launch", 75.0, 58.5, "Coastline", "Aquarail", "Sandy shoreline south of Mylta houses", 85),
            ("Novorepnoye Pier 1", 82.0, 77.0, "Dock Spawn", "PG-117 Speedboat", "Container dock quay", 95),
            ("Novorepnoye Pier 2", 87.0, 78.5, "Dock Spawn", "PG-117 Speedboat", "Eastern harbor breakwater", 90),
            ("Sosnovka South Cove", 53.0, 93.0, "Coastline", "Aquarail", "Hidden southern island beach cove", 80),
            ("Sosnovka West Pier", 44.0, 89.0, "Dock Spawn", "PG-117 Speedboat", "Southwest lighthouse shoreline", 85),
            ("Ferry Pier Harbor", 33.0, 74.0, "Dock Spawn", "PG-117 Speedboat", "Ferry terminal wooden slipway", 95),
            ("Primorsk Bay Docks", 23.5, 79.5, "Dock Spawn", "PG-117 Speedboat", "Fish market concrete boat launch", 95),
            ("Primorsk South Rock", 25.0, 83.0, "Coastline", "Aquarail", "Southern reef inlet", 80),
            ("West Bridge Canal Spawner", 38.0, 68.0, "River Bank", "PG-117 Speedboat", "Main island side of western channel", 90),
            ("East Bridge Canal Spawner", 67.0, 69.0, "River Bank", "Aquarail", "Main island side of eastern channel", 85),
            ("Zharki Cove Boat Launch", 10.5, 12.5, "Coastline", "PG-117 Speedboat", "Rocky inlet west of Zharki", 90),
            ("Severny Coast Jetty", 49.0, 11.5, "Coastline", "PG-117 Speedboat", "Northern sea dock behind Severny church", 85),
            ("Kameshki Sea Cave", 89.5, 10.5, "Coastline", "Aquarail", "High cliff sea access point", 80)
        ]
        for name, x, y, cat, btype, desc, prob in erangel_boats:
            db.add(MapMarkerModel(
                marker_id=f"erangel_boat_{uuid.uuid4().hex[:8]}",
                map_id="erangel",
                layer_type="boat",
                name=name,
                x=x,
                y=y,
                category=cat,
                sub_type=btype,
                description=desc,
                metadata_json=json.dumps({"probability": f"{prob}%", "boat_type": btype, "waterway": "Marine Channel"})
            ))

        # 4. Esports Drop Zones for Erangel
        erangel_drops = [
            ("Pochinki Drop Zone", 44.5, 53.5, "Esports Hot Drop", "GodLike Esports", "Dominant LAN hot-drop; priority compound holding with church roof reconnaissance", 48, "78.5%"),
            ("Rozhok Drop Zone", 48.2, 33.5, "Esports Hot Drop", "Team Soul", "Fast vehicle rotation drop with hillside ridge vision and warehouse control", 39, "72.0%"),
            ("School Drop Zone", 51.5, 41.5, "Esports Hot Drop", "Team XSpark", "High-aggression urban arena; immediate close-quarters clearing", 45, "69.4%"),
            ("Georgopol Drop Zone", 18.0, 30.0, "Esports Hot Drop", "Carnival Gaming", "Triple warehouse split with container park dominance", 42, "81.2%"),
            ("Sosnovka Military Base Drop", 53.0, 85.0, "Esports Hot Drop", "Entity Gaming", "C-building high-tier armor split with bridge camp setup", 47, "83.1%"),
            ("Yasnaya Polyana Drop", 66.5, 27.0, "Esports Hot Drop", "Blind Esports", "Urban multi-building lock with high vantage over southern fields", 41, "76.4%"),
            ("Novorepnoye Drop Zone", 84.0, 74.5, "Esports Hot Drop", "Global Esports", "Southern container spread with boat and vehicle rotation paths", 38, "74.5%")
        ]
        for name, x, y, cat, team, desc, freq, surv in erangel_drops:
            db.add(MapMarkerModel(
                marker_id=f"erangel_drop_{uuid.uuid4().hex[:8]}",
                map_id="erangel",
                layer_type="drop",
                name=name,
                x=x,
                y=y,
                category=cat,
                sub_type=team,
                description=desc,
                metadata_json=json.dumps({"dominant_team": team, "frequency": freq, "survival_rate": surv})
            ))

        # -----------------------------------------------------------------
        # MAP 2: MIRAMAR
        # -----------------------------------------------------------------
        miramar = MapModel(
            map_id="miramar",
            name="Miramar",
            slug="miramar",
            description="Massive 8x8 km desert terrain with vast canyons, high ridges, open sightlines, and dense industrial cities like Los Leones and Pecado.",
            image_url="/map_miramar.png",
            width=2048,
            height=2048,
            size_km="8x8 km",
            version="v3.2 (Current BGMI)",
            game="BGMI",
            is_active=True
        )
        db.add(miramar)

        miramar_layers = [
            MapLayerModel(layer_id="miramar_vehicle", map_id="miramar", name="Vehicle Spawns", layer_type="vehicle", icon="car", enabled=True, display_order=1, description="Desert pickup trucks, Mirados & buggies"),
            MapLayerModel(layer_id="miramar_boat", map_id="miramar", name="Boat Spawns", layer_type="boat", icon="ship", enabled=True, display_order=2, description="Southern coastal islands & bay launches"),
            MapLayerModel(layer_id="miramar_location", map_id="miramar", name="Locations & Towns", layer_type="location", icon="map-pin", enabled=True, display_order=3, description="Desert cities, haciendas, craters & water plants"),
            MapLayerModel(layer_id="miramar_drop", map_id="miramar", name="Esports Drop Zones", layer_type="drop", icon="shield", enabled=True, display_order=4, description="Competitive drop hotspots & dominant teams")
        ]
        for l in miramar_layers:
            db.add(l)

        miramar_locations = [
            ("Pecado", 46.0, 50.0, "Major City", "Central desert hot-drop featuring the Casino, Arena gym, and motel", "Tier 3 (Ultra)"),
            ("Los Leones", 58.0, 62.0, "Major City", "Largest metropolis in Miramar with unfinished brick towers and warehouse lanes", "Tier 3 (Ultra)"),
            ("San Martin", 47.0, 40.0, "Major City", "Sprawling hillside city with central market, overlook hills and estates", "Tier 3 (Ultra)"),
            ("Hacienda del Patrón", 51.0, 32.0, "Landmark", "Luxury villa with courtyard pool, balconies and high-density loot", "Tier 3 (Ultra)"),
            ("El Pozo", 19.0, 29.0, "Major City", "Northwestern boxing ring stadium, textile factory and residential blocks", "Tier 3 (Ultra)"),
            ("Water Treatment", 51.0, 25.0, "Industrial", "Circular water reservoirs and elevated catwalk pipes", "Tier 2 (Medium)"),
            ("Chumacera", 34.0, 69.0, "Town", "Terraced yellow cliff town overlooking southern highway", "Tier 2 (Medium)"),
            ("Monte Nuevo", 26.0, 47.0, "Town", "Western hillside town with stone church and market stalls", "Tier 2 (Medium)"),
            ("Impala", 79.0, 61.0, "Coastal Town", "Eastern industrial coastal settlement near rocky cliffs", "Tier 2 (High)"),
            ("Valle del Mar", 16.0, 77.0, "Coastal Town", "Southwestern split seaside town separated by a dual-span bridge", "Tier 2 (Medium)"),
            ("Puerto Paraíso", 88.0, 80.0, "Coastal Town", "Southeastern resort and marine harbor with palm shores", "Tier 2 (Medium)"),
            ("Campo Militar", 88.0, 10.0, "Military Base", "Far northeast military barracks complex with high-tier weapon caches", "Tier 3 (Ultra)"),
            ("Crater Fields", 28.0, 26.0, "Landmark", "Sunken crater basin containing flooded compound buildings", "Tier 2 (Medium)"),
            ("La Cobrería", 31.0, 13.0, "Major City", "Northern railway junction city with train maintenance sheds", "Tier 2 (Medium)"),
            ("Torre Ahumada", 66.0, 11.0, "Town", "Northern radar outpost and watchtower settlement", "Tier 1 (Medium)"),
            ("Cruz del Valle", 68.0, 21.0, "Town", "Northeastern valley crossroads with high church", "Tier 2 (Medium)"),
            ("El Azahar", 79.0, 28.0, "Town", "Eastern orange grove valley town with hospital building", "Tier 2 (High)"),
            ("Power Grid", 40.0, 46.0, "Industrial", "High-voltage electrical substation between Pecado and San Martin", "Tier 2 (Medium)"),
            ("Graveyard", 55.0, 46.0, "Landmark", "Historic desert cemetery with mausoleums and stone crosses", "Tier 1 (Low-Med)")
        ]
        for name, x, y, cat, desc, tier in miramar_locations:
            db.add(MapMarkerModel(
                marker_id=f"miramar_loc_{uuid.uuid4().hex[:8]}",
                map_id="miramar",
                layer_type="location",
                name=name,
                x=x,
                y=y,
                category=cat,
                sub_type=tier,
                description=desc,
                metadata_json=json.dumps({"loot_tier": tier, "elevation": "High Desert Plateau"})
            ))

        miramar_vehicles = [
            ("Pecado Casino Front", 46.5, 49.5, "Roadside Spawn", "Mirado (Muscle Car)", "Main road parked directly outside Casino entrance", 95),
            ("Pecado South Garage", 45.0, 52.0, "Garage (100%)", "Pickup Truck (4x4)", "South compound brick garage", 100),
            ("Hacienda Garage Courtyard", 50.5, 33.0, "Garage (100%)", "Golden Mirado / Mirado", "Inner garage courtyard of Hacienda estate", 100),
            ("San Martin North Overpass", 47.5, 38.5, "Roadside Spawn", "Pickup Truck", "Highway exit heading towards Water Treatment", 85),
            ("San Martin West Garage", 45.5, 41.0, "Garage (100%)", "Mirado", "Hillside garage next to warehouse", 100),
            ("Los Leones City Center", 57.5, 60.5, "Roadside Spawn", "Mirado", "Main boulevard intersection under construction crane", 90),
            ("Los Leones North Warehouse Garage", 59.0, 58.0, "Garage (100%)", "Pickup Truck", "North industrial zone warehouse garage", 100),
            ("Los Leones South Highway", 61.0, 65.0, "Roadside Spawn", "Buggy", "South perimeter road towards Puerto Paraíso", 80),
            ("El Pozo Arena Exit", 18.5, 27.5, "Roadside Spawn", "Pickup Truck", "Main gate of boxing arena", 85),
            ("El Pozo South Garage", 20.0, 31.0, "Garage (100%)", "Mirado", "South warehouse row garage", 100),
            ("Chumacera Hillside Road", 33.5, 67.5, "Roadside Spawn", "Buggy", "Ridge road overlooking canyon below", 80),
            ("Monte Nuevo Church Junction", 25.5, 48.0, "Roadside Spawn", "Pickup Truck", "Crossroads below the white stone church", 85),
            ("Impala Factory Entrance", 78.5, 62.0, "Roadside Spawn", "Mirado", "Coastal road intersection", 85),
            ("Valle del Mar Bridge Access", 16.5, 75.5, "Roadside Spawn", "Pickup Truck", "North ramp of western ocean bridge", 90),
            ("Puerto Paraíso Coastal Turn", 87.5, 82.0, "Roadside Spawn", "Buggy", "Seaside promenade curve", 80),
            ("Campo Militar Hangar Gate", 89.0, 11.5, "Roadside Spawn", "UAZ / Pickup", "Main military checkpoint guardhouse", 85),
            ("Water Treatment Pipe Bend", 52.0, 24.5, "Roadside Spawn", "Motorcycle", "Access road next to large cisterns", 75),
            ("Power Grid Substation Road", 41.0, 45.5, "Roadside Spawn", "Buggy", "High voltage pylon service road", 80)
        ]
        for name, x, y, cat, vtype, desc, prob in miramar_vehicles:
            db.add(MapMarkerModel(
                marker_id=f"miramar_veh_{uuid.uuid4().hex[:8]}",
                map_id="miramar",
                layer_type="vehicle",
                name=name,
                x=x,
                y=y,
                category=cat,
                sub_type=vtype,
                description=desc,
                metadata_json=json.dumps({"probability": f"{prob}%", "vehicle_type": vtype})
            ))

        miramar_boats = [
            ("Valle del Mar Bay Dock", 15.0, 78.5, "Dock Spawn", "PG-117 Speedboat", "Harbor wooden pier under bridge", 95),
            ("Puerto Paraíso Marina", 89.0, 81.5, "Marina Dock", "PG-117 Speedboat", "Marina concrete pontoon with resort beach", 95),
            ("Minas del Sur Cove", 17.5, 89.5, "Coastline", "Aquarail (Jet Ski)", "Island mining shore rocky cove", 85),
            ("Los Higos Pier", 39.5, 93.0, "Dock Spawn", "PG-117 Speedboat", "Southern island village pier", 90),
            ("Impala South Shore", 80.5, 64.0, "Coastline", "Aquarail", "Coastal beach below cliffs", 85)
        ]
        for name, x, y, cat, btype, desc, prob in miramar_boats:
            db.add(MapMarkerModel(
                marker_id=f"miramar_boat_{uuid.uuid4().hex[:8]}",
                map_id="miramar",
                layer_type="boat",
                name=name,
                x=x,
                y=y,
                category=cat,
                sub_type=btype,
                description=desc,
                metadata_json=json.dumps({"probability": f"{prob}%", "boat_type": btype})
            ))

        miramar_drops = [
            ("Pecado Drop Zone", 46.0, 50.0, "Esports Hot Drop", "GodLike Esports", "Iconic central arena & casino hold with early kill consolidation", 52, "82.0%"),
            ("Los Leones Drop Zone", 58.0, 62.0, "Esports Hot Drop", "Team Soul", "South-central high ground buildings with split vehicle looting", 49, "80.5%"),
            ("San Martin Drop Zone", 47.0, 40.0, "Esports Hot Drop", "Team XSpark", "High ridge containment with rapid vehicle rotation onto central highway", 44, "75.2%"),
            ("Hacienda Drop Zone", 51.0, 32.0, "Esports Hot Drop", "Carnival Gaming", "High risk villa drop with guaranteed vehicle spawn and DMR loot", 43, "74.8%"),
            ("El Pozo Drop Zone", 19.0, 29.0, "Esports Hot Drop", "Blind Esports", "Western boxing arena & industrial sector loot security", 38, "73.0%")
        ]
        for name, x, y, cat, team, desc, freq, surv in miramar_drops:
            db.add(MapMarkerModel(
                marker_id=f"miramar_drop_{uuid.uuid4().hex[:8]}",
                map_id="miramar",
                layer_type="drop",
                name=name,
                x=x,
                y=y,
                category=cat,
                sub_type=team,
                description=desc,
                metadata_json=json.dumps({"dominant_team": team, "frequency": freq, "survival_rate": surv})
            ))

        # -----------------------------------------------------------------
        # MAP 3: RONDO
        # -----------------------------------------------------------------
        rondo = MapModel(
            map_id="rondo",
            name="Rondo",
            slug="rondo",
            description="Vibrant East Asian 8x8 km metropolis featuring towering skyscrapers, neon commercial plazas, traditional bamboo temples, and the high-speed Test Track.",
            image_url="/map_rondo.png",
            width=2048,
            height=2048,
            size_km="8x8 km",
            version="v3.2 (Current BGMI)",
            game="BGMI",
            is_active=True
        )
        db.add(rondo)

        rondo_layers = [
            MapLayerModel(layer_id="rondo_vehicle", map_id="rondo", name="Vehicle Spawns", layer_type="vehicle", icon="car", enabled=True, display_order=1, description="Blanc SUV, sports coupes & electric vehicles"),
            MapLayerModel(layer_id="rondo_boat", map_id="rondo", name="Boat Spawns", layer_type="boat", icon="ship", enabled=True, display_order=2, description="River waterways & urban canal speedboats"),
            MapLayerModel(layer_id="rondo_location", map_id="rondo", name="Locations & Towns", layer_type="location", icon="map-pin", enabled=True, display_order=3, description="Jadena skyscrapers, factories, test tracks & gardens"),
            MapLayerModel(layer_id="rondo_drop", map_id="rondo", name="Esports Drop Zones", layer_type="drop", icon="shield", enabled=True, display_order=4, description="Competitive drop telemetry for Rondo meta")
        ]
        for l in rondo_layers:
            db.add(l)

        rondo_locations = [
            ("Jadena City", 87.0, 67.0, "Megacity", "Massive modern metropolis featuring skyscrapers, escalators, subways, and rooftop ziplines", "Tier 3 (Ultra)"),
            ("Jao Tin", 21.0, 38.0, "Major City", "Western historic urban district with ornate tiled roofs and courtyards", "Tier 3 (Ultra)"),
            ("NEOX Factory", 60.0, 47.0, "Industrial", "Advanced vehicle manufacturing plant with robotic assembly lines and test cars", "Tier 3 (Ultra)"),
            ("Test Track", 54.0, 40.0, "Landmark", "Paved racing test loop with banked curves, obstacles and spectator stands", "Tier 2 (High)"),
            ("Stadium", 36.0, 31.0, "Landmark", "Colossal circular sports stadium with multi-tiered bleachers and locker rooms", "Tier 3 (Ultra)"),
            ("Tin Long Garden", 61.0, 86.0, "Landmark", "Traditional stone pagodas, lotus ponds, and manicured waterfalls", "Tier 2 (High)"),
            ("Dan Ching", 60.0, 65.0, "Town", "Canal village built along serene riverbanks with arched footbridges", "Tier 2 (Medium)"),
            ("Rin Jiang", 34.0, 84.0, "Coastal Town", "Southwestern harbor town with maritime drydocks and restaurant boats", "Tier 2 (Medium)"),
            ("Mey Ran", 79.0, 40.0, "Town", "Eastern river delta settlement with bamboo stilts over water", "Tier 2 (Medium)"),
            ("Yu Lin", 38.0, 52.0, "Town", "Central dense woodland village surrounded by sheer limestone cliffs", "Tier 2 (Medium)"),
            ("Hung Shan", 45.0, 76.0, "Town", "Terraced farming village nestled inside a valley pass", "Tier 1 (Medium)"),
            ("Hemay Town", 85.0, 17.0, "Town", "Northeastern fortress village with watchtowers and river canals", "Tier 2 (Medium)"),
            ("Rai An", 47.0, 9.0, "Town", "Northern mountain monastery village with winding stone steps", "Tier 2 (Medium)"),
            ("Bei Li", 15.0, 23.0, "Town", "Quiet northwest farming compound with bamboo mills", "Tier 2 (Medium)"),
            ("Bamboo", 46.0, 31.0, "Landmark", "Enormous bamboo forest with destructible stalks and hidden stone shrines", "Tier 1 (Medium)")
        ]
        for name, x, y, cat, desc, tier in rondo_locations:
            db.add(MapMarkerModel(
                marker_id=f"rondo_loc_{uuid.uuid4().hex[:8]}",
                map_id="rondo",
                layer_type="location",
                name=name,
                x=x,
                y=y,
                category=cat,
                sub_type=tier,
                description=desc,
                metadata_json=json.dumps({"loot_tier": tier, "urban_density": "Very High"})
            ))

        rondo_vehicles = [
            ("Jadena Central Avenue", 86.5, 66.0, "Underground Garage", "Blanc (Electric SUV)", "City center underground parking entrance", 100),
            ("Jadena North Highway", 85.0, 63.5, "Roadside Spawn", "Coupe RB", "Six-lane expressway exit towards Test Track", 90),
            ("NEOX Factory Test Bay", 59.0, 46.5, "Showroom Garage", "Blanc / SUV", "Factory main loading bay ramp", 100),
            ("Test Track Pitlane", 53.5, 39.5, "Garage (100%)", "Coupe RB / Sports Car", "Racetrack pitlane garage booth", 100),
            ("Stadium VIP Gate", 35.0, 30.5, "Roadside Spawn", "Blanc", "Main gate vehicular roundabout", 90),
            ("Jao Tin Plaza Entrance", 22.0, 39.0, "Roadside Spawn", "Dacia / Sedan", "East stone archway roadway", 85),
            ("Dan Ching Bridge Road", 59.5, 66.5, "Roadside Spawn", "Buggy", "Paved road approaching canal bridge", 80),
            ("Tin Long Garden South Gate", 62.0, 87.5, "Roadside Spawn", "Motorcycle", "South pavilion parking lot", 75),
            ("Rin Jiang Harbor Road", 33.5, 83.0, "Roadside Spawn", "Blanc", "Waterfront boulevard", 85),
            ("Mey Ran River Ferry Road", 78.5, 41.5, "Roadside Spawn", "Buggy", "River crossing ferry ramp", 80)
        ]
        for name, x, y, cat, vtype, desc, prob in rondo_vehicles:
            db.add(MapMarkerModel(
                marker_id=f"rondo_veh_{uuid.uuid4().hex[:8]}",
                map_id="rondo",
                layer_type="vehicle",
                name=name,
                x=x,
                y=y,
                category=cat,
                sub_type=vtype,
                description=desc,
                metadata_json=json.dumps({"probability": f"{prob}%", "vehicle_type": vtype})
            ))

        rondo_boats = [
            ("Jadena Water Canal Pier", 88.0, 69.5, "Canal Dock", "PG-117 Speedboat", "Urban canal basin below glass suspension bridge", 95),
            ("Dan Ching River Slipway", 61.5, 64.0, "River Bank", "PG-117 Speedboat", "Central riverbank timber dock", 90),
            ("Rin Jiang Drydock Marina", 32.5, 85.5, "Marina Dock", "PG-117 Speedboat", "Deepwater sea slipway at Rin Jiang port", 95),
            ("Mey Ran Delta Moorings", 80.0, 39.0, "River Bank", "Aquarail (Jet Ski)", "Bamboo river mouth stilt moorings", 85),
            ("Kun Xia River Narrows", 66.0, 11.5, "River Bank", "Aquarail", "Northern mountain river gorge crossing", 80)
        ]
        for name, x, y, cat, btype, desc, prob in rondo_boats:
            db.add(MapMarkerModel(
                marker_id=f"rondo_boat_{uuid.uuid4().hex[:8]}",
                map_id="rondo",
                layer_type="boat",
                name=name,
                x=x,
                y=y,
                category=cat,
                sub_type=btype,
                description=desc,
                metadata_json=json.dumps({"probability": f"{prob}%", "boat_type": btype})
            ))

        rondo_drops = [
            ("Jadena City Drop Zone", 87.0, 67.0, "Esports Hot Drop", "GodLike Esports", "Skyscraper high-ground domination with interior zipline flanks", 50, "81.4%"),
            ("Jao Tin Drop Zone", 21.0, 38.0, "Esports Hot Drop", "Team Soul", "Western urban lockdown with balanced perimeter vehicle rotation", 46, "79.0%"),
            ("NEOX Factory Drop Zone", 60.0, 47.0, "Esports Hot Drop", "Team XSpark", "Industrial interior maze with immediate guaranteed vehicle access", 45, "77.2%"),
            ("Stadium Drop Zone", 36.0, 31.0, "Esports Hot Drop", "Carnival Gaming", "Open bleachers combat with swift clearing of circular locker areas", 40, "75.8%"),
            ("Tin Long Garden Drop", 61.0, 86.0, "Esports Hot Drop", "Blind Esports", "Scenic pagoda compound holding with southern waterway vision", 36, "72.4%")
        ]
        for name, x, y, cat, team, desc, freq, surv in rondo_drops:
            db.add(MapMarkerModel(
                marker_id=f"rondo_drop_{uuid.uuid4().hex[:8]}",
                map_id="rondo",
                layer_type="drop",
                name=name,
                x=x,
                y=y,
                category=cat,
                sub_type=team,
                description=desc,
                metadata_json=json.dumps({"dominant_team": team, "frequency": freq, "survival_rate": surv})
            ))

        db.commit()
        print(f"Successfully seeded: {db.query(MapModel).count()} maps, {db.query(MapLayerModel).count()} layers, {db.query(MapMarkerModel).count()} markers.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding map data: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_maps_and_spawns()
