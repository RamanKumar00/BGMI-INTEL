"""
Nodwin Gaming HTML scraper.

Scrapes publicly accessible BGMI tournament leaderboard/statistics pages from
nodwingaming.com and returns structured player stat dictionaries.

Usage:
    from sources.nodwin_scraper import NodwinScraper
    scraper = NodwinScraper()
    stats = scraper.fetch_tournament_stats("bmps-2024")
"""

import re
import time
import requests
from bs4 import BeautifulSoup


# Known Nodwin tournament slug → Liquipedia external_id mapping
# Expand this list as new tournaments are published
NODWIN_TOURNAMENT_SLUGS = {
    "bmps-2024": "91047",   # BMPS 2024
    "bgms-s2":   "87263",   # BGMI Masters Series S2
    "bmps-2025": "92500",   # BMPS 2025 (estimated pageid)
}

NODWIN_BASE = "https://nodwingaming.com"
NODWIN_HEADERS = {
    "User-Agent": "BGMIIntelETL/1.0 (contact@bgmi-intel.com)",
    "Accept": "text/html,application/xhtml+xml",
}


class NodwinScraper:
    def __init__(self, rate_limit_seconds: float = 3.0):
        self.rate_limit_seconds = rate_limit_seconds
        self._last_request = 0.0

    def _get(self, url: str) -> requests.Response | None:
        """Rate-limited GET with error handling."""
        elapsed = time.time() - self._last_request
        if elapsed < self.rate_limit_seconds:
            time.sleep(self.rate_limit_seconds - elapsed)
        self._last_request = time.time()
        try:
            resp = requests.get(url, headers=NODWIN_HEADERS, timeout=15)
            resp.raise_for_status()
            return resp
        except requests.RequestException as e:
            print(f"[NodwinScraper] Request failed for {url}: {e}")
            return None

    def _parse_stat_table(self, soup: BeautifulSoup, tournament_id: str) -> list[dict]:
        """
        Parses an HTML table containing player stats into a list of dicts.
        Attempts to handle common Nodwin table layouts.
        """
        stats = []
        tables = soup.find_all("table")
        for table in tables:
            headers = [th.get_text(strip=True).lower() for th in table.find_all("th")]
            if not headers:
                continue

            # Map header names to standard keys
            col_map = {}
            for i, h in enumerate(headers):
                if any(k in h for k in ["player", "ign", "name"]):
                    col_map["player_ign"] = i
                elif "team" in h:
                    col_map["team_name"] = i
                elif "kill" in h and "damage" not in h:
                    col_map["kills"] = i
                elif "finish" in h or "elim" in h:
                    col_map["finishes"] = i
                elif "damage" in h or "dmg" in h:
                    col_map["damage"] = i
                elif "knock" in h:
                    col_map["knocks"] = i
                elif "survival" in h or "time" in h:
                    col_map["survival_time"] = i
                elif "place" in h or "rank" in h or "pos" in h:
                    col_map["placement"] = i
                elif "point" in h or "pts" in h:
                    col_map["points"] = i
                elif "assist" in h:
                    col_map["assists"] = i

            if "player_ign" not in col_map:
                continue  # Not a player stat table

            for row in table.find_all("tr")[1:]:  # Skip header row
                cells = row.find_all(["td", "th"])
                if not cells:
                    continue

                def cell_val(key):
                    idx = col_map.get(key)
                    if idx is not None and idx < len(cells):
                        return cells[idx].get_text(strip=True)
                    return None

                def safe_float(v):
                    try:
                        return float(re.sub(r"[^\d.]", "", v)) if v else None
                    except ValueError:
                        return None

                def safe_int(v):
                    try:
                        return int(re.sub(r"[^\d]", "", v)) if v else None
                    except ValueError:
                        return None

                ign = cell_val("player_ign")
                if not ign:
                    continue

                stats.append({
                    "tournament_id": tournament_id,
                    "player_ign": ign,
                    "team_name": cell_val("team_name") or "Unknown",
                    "kills": safe_int(cell_val("kills")),
                    "finishes": safe_int(cell_val("finishes")),
                    "knocks": safe_int(cell_val("knocks")),
                    "damage": safe_float(cell_val("damage")),
                    "survival_time": safe_float(cell_val("survival_time")),
                    "placement": safe_int(cell_val("placement")),
                    "points": safe_int(cell_val("points")),
                    "assists": safe_int(cell_val("assists")),
                    "stat_level": "tournament",
                    "source": "Nodwin",
                })

        return stats

    def fetch_tournament_stats(self, slug: str) -> list[dict]:
        """
        Fetches player stats for a given Nodwin tournament slug.
        Tries common URL patterns for Nodwin's tournament results pages.

        Args:
            slug: Tournament slug, e.g. "bmps-2024"

        Returns:
            List of player stat dicts, or empty list on failure.
        """
        tournament_id = NODWIN_TOURNAMENT_SLUGS.get(slug, slug)
        candidate_urls = [
            f"{NODWIN_BASE}/bgmi/tournament/{slug}/stats",
            f"{NODWIN_BASE}/bgmi/tournament/{slug}/leaderboard",
            f"{NODWIN_BASE}/tournament/{slug}/statistics",
            f"{NODWIN_BASE}/bgmi/{slug}/stats",
        ]

        for url in candidate_urls:
            print(f"[NodwinScraper] Trying: {url}")
            resp = self._get(url)
            if resp is None:
                continue
            soup = BeautifulSoup(resp.text, "html.parser")
            stats = self._parse_stat_table(soup, tournament_id)
            if stats:
                print(f"[NodwinScraper] Scraped {len(stats)} stat rows from {url}")
                return stats
            else:
                print(f"[NodwinScraper] No stat table found at {url}")

        print(f"[NodwinScraper] Could not find stats for slug '{slug}' — all URLs failed.")
        return []

    def list_known_tournaments(self) -> list[str]:
        """Returns list of known Nodwin tournament slugs."""
        return list(NODWIN_TOURNAMENT_SLUGS.keys())
