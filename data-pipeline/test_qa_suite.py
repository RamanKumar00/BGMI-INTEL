"""
BGMI Intel Automated QA & Testing Suite
Tests Database Integrity, API Endpoints, Edge Cases, Business Logic, and Statistics Calculations.
"""

import sys
import unittest
import json
import os
from fastapi.testclient import TestClient

# Ensure data-pipeline directory is in Python path
sys.path.insert(0, os.path.dirname(__file__))

from server import app
from models.database import SessionLocal
from models.schema_models import (
    Player, PlayerAlias, Organization, OrganizationAlias, PlayerOrgHistory,
    Tournament, Team, TeamRoster, Match, PlayerMatchStats,
    PlayerTournamentStats, PlayerMapStats, MapEvent, DropLocation, Achievement, TeamAsset
)

class TestDatabaseIntegrity(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.db = SessionLocal()

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    def test_database_connection(self):
        """Test database connection is alive"""
        self.assertIsNotNone(self.db)

    def test_player_count_and_fields(self):
        """Verify player table records and non-null required fields"""
        players = self.db.query(Player).all()
        self.assertGreater(len(players), 0, "Player table should not be empty")
        for p in players[:20]:
            self.assertIsNotNone(p.player_id, "player_id must not be null")
            self.assertIsNotNone(p.ign, "ign must not be null")
            self.assertIsNotNone(p.source, "source must not be null")

    def test_team_count_and_fields(self):
        """Verify teams table records and references"""
        teams = self.db.query(Team).all()
        self.assertGreater(len(teams), 0, "Teams table should not be empty")
        for t in teams[:20]:
            self.assertIsNotNone(t.team_id, "team_id must not be null")
            self.assertIsNotNone(t.team_name, "team_name must not be null")

    def test_tournament_records(self):
        """Verify tournaments table data"""
        tourneys = self.db.query(Tournament).all()
        self.assertGreater(len(tourneys), 0, "Tournaments table should not be empty")
        for tr in tourneys:
            self.assertIsNotNone(tr.tournament_id)
            self.assertIsNotNone(tr.tournament_name)

    def test_referential_integrity(self):
        """Verify no orphaned TeamRoster records without valid Player or Team"""
        rosters = self.db.query(TeamRoster).all()
        for r in rosters[:50]:
            player = self.db.query(Player).filter(Player.player_id == r.player_id).first()
            team = self.db.query(Team).filter(Team.team_id == r.team_id).first()
            self.assertIsNotNone(player, f"Orphaned roster player_id: {r.player_id}")
            self.assertIsNotNone(team, f"Orphaned roster team_id: {r.team_id}")


class TestAPIEndpoints(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_root_endpoint(self):
        """Test root / status"""
        res = self.client.get("/")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data.get("status"), "online")

    def test_get_players(self):
        """Test GET /api/players"""
        res = self.client.get("/api/players")
        self.assertEqual(res.status_code, 200)
        players = res.json()
        self.assertIsInstance(players, list)
        self.assertGreater(len(players), 0)

    def test_get_trending_players(self):
        """Test GET /api/players/trending"""
        res = self.client.get("/api/players/trending")
        self.assertEqual(res.status_code, 200)
        trending = res.json()
        self.assertIsInstance(trending, list)
        self.assertLessEqual(len(trending), 5)
        for p in trending:
            self.assertIn("player_id", p)
            self.assertIn("ign", p)
            self.assertIn("team", p)
            self.assertIn("rating", p)

    def test_search_players_valid(self):
        """Test GET /api/players/search with query"""
        res = self.client.get("/api/players/search?q=jonathan")
        self.assertEqual(res.status_code, 200)
        results = res.json()
        self.assertIsInstance(results, list)

    def test_search_players_validation_error(self):
        """Test GET /api/players/search with empty query triggers validation error (422)"""
        res = self.client.get("/api/players/search?q=")
        self.assertEqual(res.status_code, 422)

    def test_get_single_player_valid_and_invalid(self):
        """Test GET /api/players/{player_id}"""
        # Get first player ID from DB
        players_res = self.client.get("/api/players")
        p_id = players_res.json()[0]["player_id"]
        
        # Valid ID
        res = self.client.get(f"/api/players/{p_id}")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["player_id"], p_id)

        # Non-existent ID
        res_404 = self.client.get("/api/players/non_existent_player_xyz_123")
        self.assertEqual(res_404.status_code, 404)
        self.assertEqual(res_404.json()["detail"], "Player not found")

    def test_get_teams(self):
        """Test GET /api/teams"""
        res = self.client.get("/api/teams")
        self.assertEqual(res.status_code, 200)
        teams = res.json()
        self.assertIsInstance(teams, list)
        self.assertGreater(len(teams), 0)
        for t in teams[:10]:
            self.assertIn("team_id", t)
            self.assertIn("team_name", t)

    def test_get_single_team_valid_and_invalid(self):
        """Test GET /api/teams/{team_id}"""
        teams_res = self.client.get("/api/teams")
        t_id = teams_res.json()[0]["team_id"]

        res = self.client.get(f"/api/teams/{t_id}")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["team_id"], t_id)

        res_404 = self.client.get("/api/teams/invalid_team_99999")
        self.assertEqual(res_404.status_code, 404)

    def test_get_tournaments(self):
        """Test GET /api/tournaments"""
        res = self.client.get("/api/tournaments")
        self.assertEqual(res.status_code, 200)
        tourneys = res.json()
        self.assertIsInstance(tourneys, list)
        self.assertGreater(len(tourneys), 0)

    def test_get_matches(self):
        """Test GET /api/matches"""
        res = self.client.get("/api/matches")
        self.assertEqual(res.status_code, 200)
        matches = res.json()
        self.assertIsInstance(matches, list)

    def test_get_dashboard_stats(self):
        """Test GET /api/dashboard/stats"""
        res = self.client.get("/api/dashboard/stats")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("active_players", data)
        self.assertIn("teams_tracked", data)
        self.assertIn("tournaments", data)
        self.assertIn("matches_analyzed", data)

    def test_get_dashboard_master(self):
        """Test GET /api/dashboard/master"""
        res = self.client.get("/api/dashboard/master")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("active_tournament", data)
        self.assertIn("stages", data)
        self.assertIn("standings", data)
        self.assertIn("eliminated_teams", data)
        self.assertIn("upcoming_tournaments", data)
        self.assertIn("history", data)

    def test_compare_teams_valid_and_invalid(self):
        """Test GET /api/analytics/compare"""
        teams_res = self.client.get("/api/teams")
        teams = teams_res.json()
        if len(teams) >= 2:
            t1 = teams[0]["team_id"]
            t2 = teams[1]["team_id"]
            res = self.client.get(f"/api/analytics/compare?teamA={t1}&teamB={t2}")
            self.assertEqual(res.status_code, 200)
            data = res.json()
            self.assertIn("teamA", data)
            self.assertIn("teamB", data)
            self.assertIn("encounters", data)

        res_404 = self.client.get("/api/analytics/compare?teamA=invalid1&teamB=invalid2")
        self.assertEqual(res_404.status_code, 404)

    def test_achievements_endpoint(self):
        """Test GET /api/achievements"""
        res = self.client.get("/api/achievements")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIsInstance(data, list)

    def test_media_assets_endpoints(self):
        """Test GET /api/media, /api/media/featured, and /api/media/categories"""
        res = self.client.get("/api/media")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("total", data)
        self.assertIn("data", data)
        self.assertGreater(data["total"], 0)

        # Test filtering by category
        res_cat = self.client.get("/api/media?category=Esports")
        self.assertEqual(res_cat.status_code, 200)

        # Test featured media
        res_feat = self.client.get("/api/media/featured")
        self.assertEqual(res_feat.status_code, 200)
        self.assertIsInstance(res_feat.json(), list)

        # Test categories
        res_cats = self.client.get("/api/media/categories")
        self.assertEqual(res_cats.status_code, 200)
        self.assertIsInstance(res_cats.json(), list)

    def test_media_view_and_download_counts(self):
        """Test incrementing view and download counts"""
        res = self.client.get("/api/media")
        media_items = res.json()["data"]
        self.assertGreater(len(media_items), 0)
        m_id = media_items[0]["media_id"]

        # View increment
        v_res = self.client.post(f"/api/media/{m_id}/view")
        self.assertEqual(v_res.status_code, 200)

        # Download increment
        d_res = self.client.post(f"/api/media/{m_id}/download")
        self.assertEqual(d_res.status_code, 200)
        self.assertIn("download_url", d_res.json())



class TestBusinessLogicAndCalculations(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.db = SessionLocal()

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    def test_master_dashboard_standings_calculation(self):
        """Verify master dashboard standings data consistency"""
        res = self.client.get("/api/dashboard/master")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        standings = data.get("standings", [])
        self.assertIsInstance(standings, list)
        
        for item in standings:
            mp = item["matches_played"]
            wins = item["wins"]
            losses = item["losses"]
            self.assertEqual(wins + losses, mp, "Wins + Losses must equal matches played")
            
            # Check win_rate format
            wr_str = item["win_rate"]
            self.assertTrue(wr_str.endswith("%"), "Win rate must end with %")
            wr_val = int(wr_str.rstrip("%"))
            expected_wr = int((wins / mp) * 100) if mp > 0 else 0
            self.assertEqual(wr_val, expected_wr, "Win rate calculation mismatch")

    def test_team_statistics_aggregation(self):
        """Test GET /api/teams/{id}/statistics aggregation"""
        teams = self.db.query(Team).all()
        for t in teams[:5]:
            res = self.client.get(f"/api/teams/{t.team_id}/statistics")
            self.assertEqual(res.status_code, 200)
            stats = res.json()
            self.assertIn("total_points", stats)
            self.assertIn("total_finishes", stats)
            self.assertIn("matches_played", stats)
            self.assertGreaterEqual(stats["total_points"], 0)
            self.assertGreaterEqual(stats["total_finishes"], 0)
            self.assertGreaterEqual(stats["matches_played"], 0)


if __name__ == "__main__":
    unittest.main()
