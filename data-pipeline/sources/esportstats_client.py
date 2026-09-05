"""
eSportStats.in Supabase API Client.

esportstats.in uses Supabase as its backend and exposes a public anon key
directly in its HTML. This client uses the Supabase REST API to fetch:

  - players     → IGN, role, photo, team affiliation
  - teams       → name, short name, logo, established year
  - tournaments → name, status, start/end dates, thumbnail

The anon key has read-only access restricted by Supabase Row-Level Security.
No authentication beyond the public key is required.

Usage:
    from sources.esportstats_client import EsportStatsClient
    client = EsportStatsClient()
    players = client.fetch_all_players()
    teams   = client.fetch_all_teams()
    tours   = client.fetch_all_tournaments()
"""

import time
import requests

SUPABASE_URL = "https://tgizxbpxtvoejlcygboy.supabase.co"
SUPABASE_ANON_KEY = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
    ".eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnaXp4YnB4dHZvZWpsY3lnYm95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3MTY4MjEsImV4cCI6MjEwMTI5MjgyMX0"
    ".5kYnGMljtJCr_E2HP4_bkq6UTl10jjEaSPDE7B2gmvc"
)

# Verified accessible tables (all others return 404 — protected by RLS)
ACCESSIBLE_TABLES = ["players", "teams", "tournaments"]


class EsportStatsClient:
    """
    Thin client for the esportstats.in Supabase REST API.

    Rate-limits requests to 1 per second (well within Supabase free-tier limits).
    All reads use the public anon key — no login required.
    """

    def __init__(self, rate_limit_seconds: float = 1.0):
        self.base_url = f"{SUPABASE_URL}/rest/v1"
        self.rate_limit = rate_limit_seconds
        self._last_req = 0.0
        self.headers = {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    def _get(self, table: str, params: dict | None = None) -> list[dict]:
        """Rate-limited GET for a single page of results."""
        elapsed = time.time() - self._last_req
        if elapsed < self.rate_limit:
            time.sleep(self.rate_limit - elapsed)
        self._last_req = time.time()

        url = f"{self.base_url}/{table}"
        resp = requests.get(url, headers=self.headers, params=params, timeout=15)
        resp.raise_for_status()
        return resp.json()

    def _get_all(self, table: str, page_size: int = 1000) -> list[dict]:
        """
        Fetches ALL rows from a table using Supabase's Range-based pagination.
        Supabase defaults to max 1000 rows per request.
        """
        results = []
        offset = 0
        while True:
            params = {
                "limit": page_size,
                "offset": offset,
                "order": "id.asc",
            }
            page = self._get(table, params=params)
            if not page:
                break
            results.extend(page)
            if len(page) < page_size:
                break  # Last page
            offset += page_size
        return results

    # ── Public fetch methods ─────────────────────────────────────────────────

    def fetch_all_players(self) -> list[dict]:
        """
        Fetches all players from the eSportStats Supabase DB.

        Returns list of dicts with keys:
            id, team_id, player_name, player_role, photo_url
        """
        print("[EsportStatsClient] Fetching players...")
        rows = self._get_all("players")
        print(f"[EsportStatsClient] Got {len(rows)} players")
        return rows

    def fetch_all_teams(self) -> list[dict]:
        """
        Fetches all teams from the eSportStats Supabase DB.

        Returns list of dicts with keys:
            id, team_name, logo_url, est, team_shortName, flag_url
        """
        print("[EsportStatsClient] Fetching teams...")
        rows = self._get_all("teams")
        print(f"[EsportStatsClient] Got {len(rows)} teams")
        return rows

    def fetch_all_tournaments(self, exclude_html: bool = True) -> list[dict]:
        """
        Fetches all tournaments from the eSportStats Supabase DB.

        Args:
            exclude_html: Strip the large `detailed_html` field to save space.

        Returns list of dicts with keys:
            id, name, short_name, status, thumbnail_url, start_date, end_date
            (+ detailed_html if exclude_html=False)
        """
        print("[EsportStatsClient] Fetching tournaments...")
        params = {"limit": 1000, "order": "id.asc"}
        if exclude_html:
            # Only select the columns we need — avoids pulling megabytes of HTML
            params["select"] = "id,name,short_name,status,thumbnail_url,start_date,end_date"
        rows = self._get("tournaments", params=params)
        print(f"[EsportStatsClient] Got {len(rows)} tournaments")
        return rows

    def fetch_team_roster(self, team_id: int) -> list[dict]:
        """Fetches all players belonging to a specific team_id."""
        rows = self._get("players", params={"team_id": f"eq.{team_id}", "limit": 100})
        return rows

    def build_team_player_map(self) -> dict[int, list[dict]]:
        """
        Returns a dict mapping team_id → list of player dicts.
        Useful for building full roster snapshots.
        """
        players = self.fetch_all_players()
        mapping: dict[int, list[dict]] = {}
        for p in players:
            tid = p.get("team_id")
            if tid is not None:
                mapping.setdefault(tid, []).append(p)
        return mapping

    def fetch_tournament_stats(self, prefix: str) -> dict:
        """
        Fetches player and team standings for a given tournament prefix
        (e.g., 'bgis26', 'bmps26').
        Returns a dict with 'players' and 'teams' lists.
        """
        stats = {"players": [], "teams": []}
        
        # Try fetching player standings
        try:
            player_table = f"{prefix}_player_standings"
            print(f"[EsportStatsClient] Fetching stats from {player_table}...")
            stats["players"] = self._get_all(player_table)
        except Exception as e:
            print(f"[EsportStatsClient] Error fetching {player_table}: {e}")
            
        # Try fetching team standings
        try:
            team_table = f"{prefix}_team_standings"
            print(f"[EsportStatsClient] Fetching stats from {team_table}...")
            stats["teams"] = self._get_all(team_table)
        except Exception as e:
            print(f"[EsportStatsClient] Error fetching {team_table}: {e}")
            
        return stats
