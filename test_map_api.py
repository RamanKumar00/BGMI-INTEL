import sys
import os
import unittest
import json

# Add data-pipeline to sys.path
data_pipeline_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data-pipeline")
if data_pipeline_dir not in sys.path:
    sys.path.insert(0, data_pipeline_dir)

try:
    from fastapi.testclient import TestClient
    from server import app
except ImportError as e:
    print(f"Import error: {e}")
    sys.exit(1)

class TestMapAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.admin_headers = {"X-Admin-Role": "admin"}
        cls.user_headers = {}

    def test_01_get_maps(self):
        """Test GET /api/maps returns active maps with required fields"""
        response = self.client.get("/api/maps")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)
        self.assertGreaterEqual(len(data), 3)
        slugs = [m["slug"] for m in data]
        self.assertIn("erangel", slugs)
        self.assertIn("miramar", slugs)
        self.assertIn("rondo", slugs)
        
        # Verify fields
        erangel = next(m for m in data if m["slug"] == "erangel")
        self.assertIn("name", erangel)
        self.assertIn("image", erangel)
        self.assertIn("dimensions", erangel)
        self.assertIn("size", erangel)
        self.assertIn("version", erangel)
        self.assertIn("available_layers", erangel)

    def test_02_get_markers(self):
        """Test GET /api/maps/{map_id}/markers with and without layer filtering"""
        # All markers
        res_all = self.client.get("/api/maps/erangel/markers")
        self.assertEqual(res_all.status_code, 200)
        all_markers = res_all.json()
        self.assertGreater(len(all_markers), 50)
        
        # Layer filtering: vehicle only
        res_veh = self.client.get("/api/maps/erangel/markers?layers=vehicle")
        self.assertEqual(res_veh.status_code, 200)
        veh_markers = res_veh.json()
        self.assertTrue(all(m["type"] == "vehicle" for m in veh_markers))
        self.assertGreater(len(veh_markers), 0)

        # Layer filtering: boat only
        res_boat = self.client.get("/api/maps/erangel/markers?layers=boat")
        self.assertEqual(res_boat.status_code, 200)
        boat_markers = res_boat.json()
        self.assertTrue(all(m["type"] == "boat" for m in boat_markers))

        # Layer filtering: multiple (vehicle,location)
        res_multi = self.client.get("/api/maps/erangel/markers?layers=vehicle,location")
        self.assertEqual(res_multi.status_code, 200)
        multi_markers = res_multi.json()
        for m in multi_markers:
            self.assertIn(m["type"], ["vehicle", "location"])

    def test_03_invalid_map(self):
        """Test GET /api/maps/{map_id}/markers with non-existent map"""
        res = self.client.get("/api/maps/nonexistent_map/markers")
        self.assertEqual(res.status_code, 404)

    def test_04_create_marker_auth(self):
        """Test POST /api/maps/{map_id}/markers enforces admin authorization"""
        payload = {
            "type": "vehicle",
            "name": "Unauthorized Test Buggy",
            "x": 50.0,
            "y": 50.0,
            "category": "Land",
            "sub_type": "Buggy"
        }
        # Without admin header
        res = self.client.post("/api/maps/erangel/markers", json=payload, headers=self.user_headers)
        self.assertIn(res.status_code, [401, 403])

    def test_05_create_marker_invalid_coordinates(self):
        """Test POST /api/maps/{map_id}/markers rejects out-of-bound coordinates"""
        invalid_payloads = [
            {"type": "vehicle", "name": "Bad X", "x": -5.0, "y": 50.0},
            {"type": "vehicle", "name": "Bad X", "x": 105.0, "y": 50.0},
            {"type": "vehicle", "name": "Bad Y", "x": 50.0, "y": -1.0},
            {"type": "vehicle", "name": "Bad Y", "x": 50.0, "y": 101.0},
        ]
        for p in invalid_payloads:
            res = self.client.post("/api/maps/erangel/markers", json=p, headers=self.admin_headers)
            self.assertEqual(res.status_code, 400)

    def test_06_marker_crud_lifecycle(self):
        """Test Create, Update, and Delete marker lifecycle with Admin Auth"""
        # Create
        create_payload = {
            "type": "vehicle",
            "name": "Tactical Test UAZ",
            "x": 45.5,
            "y": 55.5,
            "category": "Hardtop",
            "sub_type": "UAZ",
            "description": "Spawned for automated test verification"
        }
        res_create = self.client.post("/api/maps/erangel/markers", json=create_payload, headers=self.admin_headers)
        self.assertEqual(res_create.status_code, 201)
        created = res_create.json()
        marker_id = created["id"]
        self.assertEqual(created["name"], "Tactical Test UAZ")
        self.assertEqual(created["x"], 45.5)
        self.assertEqual(created["y"], 55.5)

        # Update
        update_payload = {
            "name": "Tactical Test UAZ (Modified)",
            "x": 46.0,
            "y": 56.0,
            "description": "Updated coordinates"
        }
        res_update = self.client.put(f"/api/maps/markers/{marker_id}", json=update_payload, headers=self.admin_headers)
        self.assertEqual(res_update.status_code, 200)
        updated = res_update.json()
        self.assertEqual(updated["name"], "Tactical Test UAZ (Modified)")
        self.assertEqual(updated["x"], 46.0)

        # Delete
        res_delete = self.client.delete(f"/api/maps/markers/{marker_id}", headers=self.admin_headers)
        self.assertEqual(res_delete.status_code, 200)

        # Verify deletion
        res_check = self.client.get(f"/api/maps/erangel/markers")
        marker_ids = [m["id"] for m in res_check.json()]
        self.assertNotIn(marker_id, marker_ids)

    def test_07_bulk_import_json(self):
        """Test POST /api/maps/{map_id}/import with JSON payload and validation"""
        import_data = [
            {
                "type": "vehicle",
                "name": "Bulk Dacia 1",
                "x": 40.0,
                "y": 40.0,
                "sub_type": "Dacia"
            },
            {
                "type": "vehicle",
                "name": "Bulk Dacia 2",
                "x": 41.0,
                "y": 41.0,
                "sub_type": "Dacia"
            }
        ]
        res = self.client.post(
            "/api/maps/erangel/import",
            json={"format": "json", "data": json.dumps(import_data)},
            headers=self.admin_headers
        )
        self.assertEqual(res.status_code, 200)
        res_json = res.json()
        self.assertEqual(res_json["success_count"], 2)
        self.assertEqual(res_json["failure_count"], 0)

        # Clean up imported test markers
        res_markers = self.client.get("/api/maps/erangel/markers")
        for m in res_markers.json():
            if m["name"].startswith("Bulk Dacia"):
                self.client.delete(f"/api/maps/markers/{m['id']}", headers=self.admin_headers)

    def test_08_bulk_import_validation_error(self):
        """Test POST /api/maps/{map_id}/import reports validation errors on bad input"""
        bad_import = [
            {"type": "vehicle", "name": "Invalid Coord", "x": 150.0, "y": 40.0},
            {"name": "Missing Type", "x": 40.0, "y": 40.0}
        ]
        res = self.client.post(
            "/api/maps/erangel/import",
            json={"format": "json", "data": json.dumps(bad_import)},
            headers=self.admin_headers
        )
        self.assertEqual(res.status_code, 200)
        res_json = res.json()
        self.assertEqual(res_json["success_count"], 0)
        self.assertEqual(res_json["failure_count"], 2)
        self.assertGreaterEqual(len(res_json["errors"]), 2)

if __name__ == "__main__":
    unittest.main()
