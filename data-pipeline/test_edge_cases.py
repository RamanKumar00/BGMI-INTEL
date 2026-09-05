"""
Edge Case & Security Test Suite for BGMI Intel API
"""

import sys
import unittest
import os
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(__file__))

from server import app

class TestEdgeCasesAndSecurity(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_sql_injection_in_search(self):
        """Verify SQL injection payload in player search doesn't crash server or leak data"""
        payloads = [
            "' OR '1'='1",
            "'; DROP TABLE players; --",
            "\" OR \"1\"=\"1",
            "SELECT * FROM players"
        ]
        for p in payloads:
            res = self.client.get(f"/api/players/search?q={p}")
            self.assertEqual(res.status_code, 200, f"Failed for payload: {p}")
            self.assertIsInstance(res.json(), list)

    def test_same_team_comparison(self):
        """Test comparing a team with itself in GET /api/analytics/compare"""
        teams_res = self.client.get("/api/teams")
        teams = teams_res.json()
        if len(teams) > 0:
            t1 = teams[0]["team_id"]
            res = self.client.get(f"/api/analytics/compare?teamA={t1}&teamB={t1}")
            self.assertEqual(res.status_code, 200)
            data = res.json()
            self.assertEqual(data["teamA"]["id"], data["teamB"]["id"])

    def test_unknown_map_stats(self):
        """Test GET /api/maps/{map_name} for unknown map"""
        res = self.client.get("/api/maps/AtlantisUnknown")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json(), [])

    def test_special_characters_in_player_id(self):
        """Test GET /api/players/{player_id} with special characters"""
        res = self.client.get("/api/players/<script>alert(1)</script>")
        self.assertEqual(res.status_code, 404)
        self.assertEqual(res.json()["detail"], "Player not found")

    def test_search_images_query(self):
        """Test GET /api/images/search with query"""
        res = self.client.get("/api/images/search?q=SouL+Jonathan")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("results", data)


if __name__ == "__main__":
    unittest.main()
