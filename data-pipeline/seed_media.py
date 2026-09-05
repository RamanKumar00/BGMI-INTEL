"""
Seed Media Assets Script for BGMI Intel Media Hub
Populates bgmi_intel.db with high-quality BGMI esports images, wallpapers, player portraits, team graphics, and tournament moments.
"""

import sys
import os
import datetime
import uuid

sys.path.insert(0, os.path.dirname(__file__))

from models.database import engine, SessionLocal, Base
from models.schema_models import MediaAsset

# Ensure all tables (including media_assets) exist
Base.metadata.create_all(bind=engine)

def seed_media():
    db = SessionLocal()
    try:
        existing_count = db.query(MediaAsset).count()
        print(f"[Seed Media] Existing media assets in database: {existing_count}")
        
        # High quality BGMI assets pool
        sample_assets = [
            # Esports
            {
                "title": "BGIS 2026 Grand Finals Trophy Ceremony",
                "description": "The dramatic moment when the BGIS 2026 champions lifted the trophy at the packed stadium in Delhi.",
                "image_url": "https://cdn.jsdelivr.net/gh/esportstatsdata/media-storage@main/images/shivam/general/1785581953220-bmps2026.webp",
                "thumbnail_url": "https://cdn.jsdelivr.net/gh/esportstatsdata/media-storage@main/images/shivam/general/1785581953220-bmps2026.webp",
                "category": "Esports",
                "tags": "BGIS2026, Trophy, Finals, Krafton, Champions, Stage",
                "resolution": "4K",
                "width": 3840,
                "height": 2160,
                "orientation": "Landscape",
                "file_size": "4.2 MB",
                "file_format": "WEBP",
                "view_count": 18420,
                "download_count": 5210,
                "featured": True,
                "source": "Official Krafton BGMI Esports",
                "license": "Editorial Use Allowed"
            },
            {
                "title": "BMPS 2026 Main Stage & Light Show",
                "description": "Panoramic wide shot of the electrifying main stage light show during the BMPS 2026 opening ceremony.",
                "image_url": "https://cdn.jsdelivr.net/gh/esportstatsdata/media-storage@main/images/shivam/general/1785581091732-Estats_logo.webp",
                "thumbnail_url": "https://cdn.jsdelivr.net/gh/esportstatsdata/media-storage@main/images/shivam/general/1785581091732-Estats_logo.webp",
                "category": "Esports",
                "tags": "BMPS2026, Stage, Arena, Esports, Tournament, Opening Ceremony",
                "resolution": "4K",
                "width": 3840,
                "height": 2160,
                "orientation": "Landscape",
                "file_size": "5.1 MB",
                "file_format": "PNG",
                "view_count": 14200,
                "download_count": 3980,
                "featured": True,
                "source": "Nodwin Gaming Media",
                "license": "Editorial"
            },
            {
                "title": "BGMS Season 3 LAN Finals Atmosphere",
                "description": "Crowd cheering and live caster reaction during the final match clutch at BGMI Master Series Season 3.",
                "image_url": "https://cdn.jsdelivr.net/gh/esportstatsdata/media-storage@main/images/shivam/teamlogos/1785582003005-GODLIKE-ESPORTS.webp",
                "thumbnail_url": "https://cdn.jsdelivr.net/gh/esportstatsdata/media-storage@main/images/shivam/teamlogos/1785582003005-GODLIKE-ESPORTS.webp",
                "category": "Esports",
                "tags": "BGMS, Star Sports, Arena, Crowd, LAN Finals, Esports",
                "resolution": "2K",
                "width": 2560,
                "height": 1440,
                "orientation": "Landscape",
                "file_size": "2.8 MB",
                "file_format": "JPG",
                "view_count": 9850,
                "download_count": 2410,
                "featured": True,
                "source": "Star Sports Esports",
                "license": "Public Press"
            },

            # Teams
            {
                "title": "GodLike Esports Official Roster 2026",
                "description": "Official team banner shot featuring Jonathan, ClutchGod, ZGOD, and Admino in GodLike jersey.",
                "image_url": "https://cdn.jsdelivr.net/gh/esportstatsdata/media-storage@main/images/shivam/teamlogos/1785582003005-GODLIKE-ESPORTS.webp",
                "thumbnail_url": "https://cdn.jsdelivr.net/gh/esportstatsdata/media-storage@main/images/shivam/teamlogos/1785582003005-GODLIKE-ESPORTS.webp",
                "category": "Teams",
                "tags": "GodLike, Team Photo, Jonathan, Jersey, 2026 Roster",
                "resolution": "4K",
                "width": 3840,
                "height": 2160,
                "orientation": "Landscape",
                "file_size": "3.9 MB",
                "file_format": "WEBP",
                "view_count": 28900,
                "download_count": 9450,
                "featured": True,
                "source": "GodLike Esports",
                "license": "Official Press Kit"
            },
            {
                "title": "Team SouL Victory Celebration",
                "description": "Team SouL players celebrating after securing back-to-back Chicken Dinners at BMPS 2026.",
                "image_url": "https://cdn.jsdelivr.net/gh/esportstatsdata/media-storage@main/images/shivam/teamlogos/1786964971805-Team-Soul.webp",
                "thumbnail_url": "https://cdn.jsdelivr.net/gh/esportstatsdata/media-storage@main/images/shivam/teamlogos/1786964971805-Team-Soul.webp",
                "category": "Teams",
                "tags": "Team SouL, SouL, WWCD, Manya, Nakul, Rony, Celebration",
                "resolution": "4K",
                "width": 3840,
                "height": 2160,
                "orientation": "Landscape",
                "file_size": "4.5 MB",
                "file_format": "JPG",
                "view_count": 31200,
                "download_count": 11800,
                "featured": True,
                "source": "iQOO SouL Media",
                "license": "Official Press Kit"
            },
            {
                "title": "Orangutan Esports Team Crest Vector",
                "description": "High-definition 4K vector asset of the Orangutan Esports logo for wallpaper and broadcast lower thirds.",
                "image_url": "https://cdn.jsdelivr.net/gh/esportstatsdata/media-storage@main/images/shivam/teamlogos/1786965109628-Orangutan.webp",
                "thumbnail_url": "https://cdn.jsdelivr.net/gh/esportstatsdata/media-storage@main/images/shivam/teamlogos/1786965109628-Orangutan.webp",
                "category": "Teams",
                "tags": "Orangutan, Logo, Vector, 4K, Branding, Team Media",
                "resolution": "4K",
                "width": 3840,
                "height": 3840,
                "orientation": "Square",
                "file_size": "1.8 MB",
                "file_format": "PNG",
                "view_count": 6400,
                "download_count": 1920,
                "featured": False,
                "source": "Orangutan Esports",
                "license": "Brand Media Kit"
            },
            {
                "title": "GENESIS Esports Stage Lineup",
                "description": "GENESIS Esports line up on stage for team introductions prior to match start.",
                "image_url": "https://cdn.jsdelivr.net/gh/esportstatsdata/media-storage@main/images/shivam/teamlogos/1785581996850-GENESIS-ESPORTS.webp",
                "thumbnail_url": "https://cdn.jsdelivr.net/gh/esportstatsdata/media-storage@main/images/shivam/teamlogos/1785581996850-GENESIS-ESPORTS.webp",
                "category": "Teams",
                "tags": "GENESIS, Stage, Roster, BGIS, Player Lineup",
                "resolution": "Full HD",
                "width": 1920,
                "height": 1080,
                "orientation": "Landscape",
                "file_size": "1.9 MB",
                "file_format": "JPG",
                "view_count": 4820,
                "download_count": 1130,
                "featured": False,
                "source": "EsportStats Media",
                "license": "Editorial"
            },

            # Players
            {
                "title": "JONATHAN — The Assaulter Supreme Portrait",
                "description": "Studio portrait of Jonathan Amaral wearing the 2026 GodLike pro jersey.",
                "image_url": "https://cdn.jsdelivr.net/gh/esportstatsdata/media-storage@main/images/shivam/teamlogos/1785582003005-GODLIKE-ESPORTS.webp",
                "thumbnail_url": "https://cdn.jsdelivr.net/gh/esportstatsdata/media-storage@main/images/shivam/teamlogos/1785582003005-GODLIKE-ESPORTS.webp",
                "category": "Players",
                "tags": "JONATHAN, Jonathan Amaral, GodLike, Portrait, Assaulter, MVP",
                "resolution": "4K",
                "width": 2160,
                "height": 3840,
                "orientation": "Portrait",
                "file_size": "3.4 MB",
                "file_format": "PNG",
                "view_count": 42100,
                "download_count": 14900,
                "featured": True,
                "source": "GodLike Media Studio",
                "license": "Editorial"
            },
            {
                "title": "Goblin 1v4 Clutch Reaction Shot",
                "description": "High-speed camera capture of Goblin's intense focus during a game-winning 1v4 clutch match.",
                "image_url": "https://cdn.jsdelivr.net/gh/esportstatsdata/media-storage@main/images/shivam/teamlogos/1786964971805-Team-Soul.webp",
                "thumbnail_url": "https://cdn.jsdelivr.net/gh/esportstatsdata/media-storage@main/images/shivam/teamlogos/1786964971805-Team-Soul.webp",
                "category": "Players",
                "tags": "Goblin, SouL, Clutch, Reaction, Fragger, High Motion",
                "resolution": "2K",
                "width": 2560,
                "height": 1440,
                "orientation": "Landscape",
                "file_size": "2.2 MB",
                "file_format": "JPG",
                "view_count": 19400,
                "download_count": 5800,
                "featured": True,
                "source": "Nodwin Tournament Media",
                "license": "Editorial"
            },

            # BGMI / Gameplay / Maps
            {
                "title": "Erangel 3.2 Tactical Overview Map Artwork",
                "description": "Ultra-detailed 4K tactical map overview of Erangel featuring drop zones Pochinki, Yasnaya, and Sosnovka.",
                "image_url": "/map_erangel.png",
                "thumbnail_url": "/map_erangel.png",
                "category": "BGMI",
                "tags": "Erangel, Map, Tactical, Pochinki, Drop Zone, BGMI 3.2, Artwork",
                "resolution": "4K",
                "width": 3840,
                "height": 2160,
                "orientation": "Landscape",
                "file_size": "6.8 MB",
                "file_format": "PNG",
                "view_count": 15600,
                "download_count": 6700,
                "featured": True,
                "source": "Krafton BGMI Design",
                "license": "Official Asset"
            },
            {
                "title": "Miramar Desert Battlefield Sunset Visual",
                "description": "Cinematic screenshot of Miramar desert mountains during golden hour in BGMI.",
                "image_url": "/map_miramar.png",
                "thumbnail_url": "/map_miramar.png",
                "category": "BGMI",
                "tags": "Miramar, Desert, Sunset, Pecado, Wallpaper, Gameplay",
                "resolution": "4K",
                "width": 3840,
                "height": 2160,
                "orientation": "Landscape",
                "file_size": "5.9 MB",
                "file_format": "PNG",
                "view_count": 12800,
                "download_count": 4890,
                "featured": False,
                "source": "BGMI Official",
                "license": "Official Asset"
            },
            {
                "title": "Rondo Bamboo City Landmark Concept Art",
                "description": "High resolution environment render of Rondo Jadena City and NEOX Factory.",
                "image_url": "/map_rondo.png",
                "thumbnail_url": "/map_rondo.png",
                "category": "BGMI",
                "tags": "Rondo, Jadena City, NEOX, Concept Art, Map, BGMI",
                "resolution": "4K",
                "width": 3840,
                "height": 2160,
                "orientation": "Landscape",
                "file_size": "7.1 MB",
                "file_format": "PNG",
                "view_count": 11200,
                "download_count": 4150,
                "featured": False,
                "source": "Krafton Development Studio",
                "license": "Official Asset"
            },

            # Wallpapers
            {
                "title": "Level 3 Helmet & AWM Neon Esports Wallpaper",
                "description": "Futuristic dark neon wallpaper featuring BGMI Level 3 helmet, AWM sniper, and orange energy aura.",
                "image_url": "/bg_login.png",
                "thumbnail_url": "/bg_login.png",
                "category": "Wallpapers",
                "tags": "Wallpaper, 4K, Level 3 Helmet, AWM, Neon, Dark, Gaming, Background",
                "resolution": "4K",
                "width": 3840,
                "height": 2160,
                "orientation": "Landscape",
                "file_size": "8.4 MB",
                "file_format": "PNG",
                "view_count": 54200,
                "download_count": 21900,
                "featured": True,
                "source": "BGMI Intel Studio",
                "license": "Free Personal Use"
            },
            {
                "title": "Cyberpunk BGMI Arena Cyber Wallpaper",
                "description": "Ultra HD desktop wallpaper of a futuristic cyber stadium with BGMI drop crates and holographic leaderboard.",
                "image_url": "/bg_signup.png",
                "thumbnail_url": "/bg_signup.png",
                "category": "Wallpapers",
                "tags": "Wallpaper, 4K, Cyberpunk, Stadium, Drop Crate, Desktop, Holographic",
                "resolution": "4K",
                "width": 3840,
                "height": 2160,
                "orientation": "Landscape",
                "file_size": "7.9 MB",
                "file_format": "PNG",
                "view_count": 38700,
                "download_count": 16400,
                "featured": True,
                "source": "BGMI Intel Studio",
                "license": "Free Personal Use"
            },
            {
                "title": "Level 3 Helmet Gold Crest Mobile Wallpaper",
                "description": "Mobile vertical 9:16 high-definition wallpaper for OLED smartphones featuring golden Level 3 Helmet.",
                "image_url": "/helmet_logo.png",
                "thumbnail_url": "/helmet_logo.png",
                "category": "Wallpapers",
                "tags": "Mobile Wallpaper, OLED, 9:16, Gold Helmet, Level 3, Vertical",
                "resolution": "Full HD",
                "width": 1080,
                "height": 1920,
                "orientation": "Portrait",
                "file_size": "1.4 MB",
                "file_format": "PNG",
                "view_count": 29800,
                "download_count": 13200,
                "featured": False,
                "source": "BGMI Intel Studio",
                "license": "Free Personal Use"
            },

            # Events
            {
                "title": "BGIS 2026 Official Launch Poster",
                "description": "Official announcement banner for BGIS 2026 boasting INR 3.5 Crore prize pool.",
                "image_url": "https://cdn.jsdelivr.net/gh/esportstatsdata/media-storage@main/images/shivam/general/1785581953220-bmps2026.webp",
                "thumbnail_url": "https://cdn.jsdelivr.net/gh/esportstatsdata/media-storage@main/images/shivam/general/1785581953220-bmps2026.webp",
                "category": "Events",
                "tags": "BGIS2026, Launch, Poster, Announcement, Krafton, Prize Pool",
                "resolution": "Full HD",
                "width": 1920,
                "height": 1080,
                "orientation": "Landscape",
                "file_size": "2.1 MB",
                "file_format": "WEBP",
                "view_count": 8900,
                "download_count": 2100,
                "featured": False,
                "source": "Krafton India",
                "license": "Press Kit"
            }
        ]

        inserted = 0
        for item in sample_assets:
            # Check if title exists
            exists = db.query(MediaAsset).filter(MediaAsset.title == item["title"]).first()
            if not exists:
                media_obj = MediaAsset(
                    media_id=f"media_{uuid.uuid4().hex[:10]}",
                    title=item["title"],
                    description=item.get("description"),
                    image_url=item["image_url"],
                    thumbnail_url=item.get("thumbnail_url") or item["image_url"],
                    category=item["category"],
                    tags=item.get("tags"),
                    resolution=item.get("resolution", "Full HD"),
                    width=item.get("width", 1920),
                    height=item.get("height", 1080),
                    orientation=item.get("orientation", "Landscape"),
                    file_size=item.get("file_size", "2.5 MB"),
                    file_format=item.get("file_format", "PNG"),
                    view_count=item.get("view_count", 0),
                    download_count=item.get("download_count", 0),
                    featured=item.get("featured", False),
                    status="active",
                    source=item.get("source", "BGMI Intel Media"),
                    license=item.get("license", "Editorial Use Only"),
                    created_at=datetime.datetime.utcnow() - datetime.timedelta(days=inserted * 2)
                )
                db.add(media_obj)
                inserted += 1

        db.commit()
        print(f"[Seed Media] Successfully seeded {inserted} new high-quality media assets!")
    except Exception as e:
        db.rollback()
        print(f"[Seed Media] Error seeding media assets: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_media()
