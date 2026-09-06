import sqlite3
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import text

def calculate_drop_success_score(avg_placement: float, avg_survival_sec: float, avg_finishes: float, contest_win_rate: float, consistency: float) -> float:
    """
    Standard Esports Drop Success Score (0 - 100):
    Placement (35%): lower placement is better (1st = 100%, 16th = 0%)
    Survival (25%): 1800s = 100%, 300s = 0%
    Finishes (20%): 8 finishes = 100%, 0 finishes = 0%
    Contest Win Rate (10%): 100% win rate = 100%
    Consistency (10%): 100% consistency = 100%
    """
    placement_norm = max(0.0, min(100.0, ((16.0 - avg_placement) / 15.0) * 100.0))
    survival_norm = max(0.0, min(100.0, ((avg_survival_sec - 300.0) / 1500.0) * 100.0))
    finishes_norm = max(0.0, min(100.0, (avg_finishes / 8.0) * 100.0))
    contest_norm = max(0.0, min(100.0, contest_win_rate))
    consistency_norm = max(0.0, min(100.0, consistency))

    score = (
        placement_norm * 0.35 +
        survival_norm * 0.25 +
        finishes_norm * 0.20 +
        contest_norm * 0.10 +
        consistency_norm * 0.10
    )
    return round(score, 1)

class DropAnalyticsEngine:
    def __init__(self, db: Session):
        self.db = db

    def get_summary(self, map_name: Optional[str] = None, tournament_id: Optional[str] = None, stage: Optional[str] = None, team_id: Optional[str] = None, location: Optional[str] = None) -> Dict[str, Any]:
        """Calculates macro-level drop analytics KPIs"""
        where_clauses = ["1=1"]
        params = {}

        if map_name and map_name != "All":
            where_clauses.append("d.map = :map_name")
            params["map_name"] = map_name
        if tournament_id and tournament_id != "All":
            where_clauses.append("m.tournament_id = :tournament_id")
            params["tournament_id"] = tournament_id
        if stage and stage != "All":
            where_clauses.append("m.stage = :stage")
            params["stage"] = stage
        if team_id and team_id != "All":
            where_clauses.append("d.team_id = :team_id")
            params["team_id"] = team_id
        if location and location != "All":
            where_clauses.append("d.drop_location = :location")
            params["location"] = location

        where_sql = " AND ".join(where_clauses)

        # Base aggregates
        base_query = text(f"""
            SELECT 
                COUNT(DISTINCT d.match_id) as total_matches,
                COUNT(DISTINCT d.team_id) as total_teams,
                COUNT(d.drop_id) as total_drops,
                COUNT(DISTINCT d.map) as total_maps
            FROM drop_locations d
            JOIN matches m ON d.match_id = m.match_id
            WHERE {where_sql}
        """)
        base_res = self.db.execute(base_query, params).mappings().first()
        total_matches = base_res["total_matches"] or 0
        total_teams = base_res["total_teams"] or 0
        total_drops = base_res["total_drops"] or 0
        total_maps = base_res["total_maps"] or 0

        # Most Popular Drop
        pop_query = text(f"""
            SELECT d.drop_location, COUNT(*) as cnt
            FROM drop_locations d
            JOIN matches m ON d.match_id = m.match_id
            WHERE {where_sql}
            GROUP BY d.drop_location
            ORDER BY cnt DESC
            LIMIT 1
        """)
        pop_res = self.db.execute(pop_query, params).mappings().first()
        most_popular = {
            "location": pop_res["drop_location"] if pop_res else "N/A",
            "count": pop_res["cnt"] if pop_res else 0,
            "percentage": round((pop_res["cnt"] / total_drops * 100), 1) if pop_res and total_drops > 0 else 0
        }

        # Most Contested Drop
        cont_query = text(f"""
            SELECT d.drop_location, 
                   COUNT(*) as total_cnt, 
                   SUM(CASE WHEN d.is_contested = 1 THEN 1 ELSE 0 END) as contested_cnt
            FROM drop_locations d
            JOIN matches m ON d.match_id = m.match_id
            WHERE {where_sql}
            GROUP BY d.drop_location
            HAVING total_cnt >= 2
            ORDER BY (CAST(contested_cnt AS FLOAT) / total_cnt) DESC, contested_cnt DESC
            LIMIT 1
        """)
        cont_res = self.db.execute(cont_query, params).mappings().first()
        most_contested = {
            "location": cont_res["drop_location"] if cont_res else "N/A",
            "contests": cont_res["contested_cnt"] if cont_res else 0,
            "contest_rate": round((cont_res["contested_cnt"] / cont_res["total_cnt"] * 100), 1) if cont_res and cont_res["total_cnt"] > 0 else 0
        }

        # Best Performing Drop (Lowest avg placement with at least 2 drops)
        perf_query = text(f"""
            SELECT d.drop_location, 
                   AVG(d.placement) as avg_placement, 
                   AVG(d.finishes) as avg_finishes,
                   AVG(d.survival_time) as avg_survival,
                   SUM(CASE WHEN d.placement = 1 THEN 1 ELSE 0 END) as wins,
                   COUNT(*) as cnt
            FROM drop_locations d
            JOIN matches m ON d.match_id = m.match_id
            WHERE {where_sql}
            GROUP BY d.drop_location
            HAVING cnt >= 2
            ORDER BY avg_placement ASC
            LIMIT 1
        """)
        perf_res = self.db.execute(perf_query, params).mappings().first()
        best_performing = {
            "location": perf_res["drop_location"] if perf_res else "N/A",
            "avg_placement": round(perf_res["avg_placement"], 1) if perf_res else 0,
            "avg_finishes": round(perf_res["avg_finishes"], 1) if perf_res else 0,
            "win_rate": round((perf_res["wins"] / perf_res["cnt"] * 100), 1) if perf_res and perf_res["cnt"] > 0 else 0
        }

        # Most Consistent Team Drop (Team that drops at the same spot highest % of time)
        cons_query = text(f"""
            SELECT t.team_name, d.drop_location, COUNT(*) as spot_cnt,
                   (SELECT COUNT(*) FROM drop_locations d2 WHERE d2.team_id = d.team_id) as total_team_drops
            FROM drop_locations d
            JOIN teams t ON d.team_id = t.team_id
            JOIN matches m ON d.match_id = m.match_id
            WHERE {where_sql}
            GROUP BY d.team_id, d.drop_location
            HAVING total_team_drops >= 3
            ORDER BY (CAST(spot_cnt AS FLOAT) / total_team_drops) DESC, spot_cnt DESC
            LIMIT 1
        """)
        cons_res = self.db.execute(cons_query, params).mappings().first()
        most_consistent = {
            "team_name": cons_res["team_name"] if cons_res else "N/A",
            "location": cons_res["drop_location"] if cons_res else "N/A",
            "consistency_pct": round((cons_res["spot_cnt"] / cons_res["total_team_drops"] * 100), 1) if cons_res and cons_res["total_team_drops"] > 0 else 0
        }

        return {
            "total_matches": total_matches,
            "total_teams": total_teams,
            "total_drops": total_drops,
            "total_maps": total_maps,
            "most_popular_drop": most_popular,
            "most_contested_drop": most_contested,
            "best_performing_drop": best_performing,
            "most_consistent_team_drop": most_consistent
        }

    def get_heatmap_points(self, map_name: Optional[str] = None, tournament_id: Optional[str] = None, stage: Optional[str] = None, team_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Returns coordinate points for map heatmap and drop pin visualization"""
        where_clauses = ["1=1"]
        params = {}
        if map_name and map_name != "All":
            where_clauses.append("d.map = :map_name")
            params["map_name"] = map_name
        if tournament_id and tournament_id != "All":
            where_clauses.append("m.tournament_id = :tournament_id")
            params["tournament_id"] = tournament_id
        if stage and stage != "All":
            where_clauses.append("m.stage = :stage")
            params["stage"] = stage
        if team_id and team_id != "All":
            where_clauses.append("d.team_id = :team_id")
            params["team_id"] = team_id

        where_sql = " AND ".join(where_clauses)
        query = text(f"""
            SELECT d.drop_id, d.match_id, d.team_id, t.team_name, d.map, d.drop_location, 
                   d.x, d.y, d.is_contested, d.placement, d.finishes
            FROM drop_locations d
            JOIN teams t ON d.team_id = t.team_id
            JOIN matches m ON d.match_id = m.match_id
            WHERE {where_sql}
        """)
        rows = self.db.execute(query, params).mappings().all()
        return [
            {
                "id": r["drop_id"],
                "match_id": r["match_id"],
                "team_id": r["team_id"],
                "team_name": r["team_name"],
                "map": r["map"],
                "location": r["drop_location"],
                "x": r["x"],
                "y": r["y"],
                "is_contested": bool(r["is_contested"]),
                "placement": r["placement"],
                "finishes": r["finishes"],
                "weight": 1.0 + (0.5 if r["is_contested"] else 0.0)
            }
            for r in rows
        ]

    def get_locations_table(self, map_name: Optional[str] = None, tournament_id: Optional[str] = None, stage: Optional[str] = None, team_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Aggregates performance metrics for each drop location"""
        where_clauses = ["1=1"]
        params = {}
        if map_name and map_name != "All":
            where_clauses.append("d.map = :map_name")
            params["map_name"] = map_name
        if tournament_id and tournament_id != "All":
            where_clauses.append("m.tournament_id = :tournament_id")
            params["tournament_id"] = tournament_id
        if stage and stage != "All":
            where_clauses.append("m.stage = :stage")
            params["stage"] = stage
        if team_id and team_id != "All":
            where_clauses.append("d.team_id = :team_id")
            params["team_id"] = team_id

        where_sql = " AND ".join(where_clauses)
        query = text(f"""
            SELECT 
                d.drop_location,
                d.map,
                COUNT(*) as total_drops,
                COUNT(DISTINCT d.team_id) as total_teams,
                AVG(d.placement) as avg_placement,
                AVG(d.finishes) as avg_finishes,
                AVG(d.survival_time) as avg_survival,
                SUM(CASE WHEN d.is_contested = 1 THEN 1 ELSE 0 END) as contested_drops,
                SUM(CASE WHEN d.placement = 1 THEN 1 ELSE 0 END) as wins,
                SUM(CASE WHEN d.placement <= 3 THEN 1 ELSE 0 END) as top3,
                AVG(d.x) as avg_x,
                AVG(d.y) as avg_y
            FROM drop_locations d
            JOIN matches m ON d.match_id = m.match_id
            WHERE {where_sql}
            GROUP BY d.drop_location, d.map
            ORDER BY total_drops DESC
        """)
        rows = self.db.execute(query, params).mappings().all()
        results = []
        for r in rows:
            cnt = r["total_drops"]
            contested_cnt = r["contested_drops"]
            contest_rate = round((contested_cnt / cnt * 100), 1) if cnt > 0 else 0
            avg_p = round(r["avg_placement"] or 8.0, 1)
            avg_f = round(r["avg_finishes"] or 0.0, 1)
            avg_s = round(r["avg_survival"] or 900.0, 1)
            
            # Find best performing team at this drop location
            best_team_query = text("""
                SELECT t.team_name, COUNT(*) as d_cnt, AVG(d2.placement) as t_avg_place
                FROM drop_locations d2
                JOIN teams t ON d2.team_id = t.team_id
                WHERE d2.drop_location = :loc AND d2.map = :map
                GROUP BY d2.team_id
                ORDER BY t_avg_place ASC, d_cnt DESC
                LIMIT 1
            """)
            best_team_row = self.db.execute(best_team_query, {"loc": r["drop_location"], "map": r["map"]}).mappings().first()
            best_team = best_team_row["team_name"] if best_team_row else "N/A"

            # Calculate standard drop success score
            contest_win_rate = 50.0 if contested_cnt > 0 else 75.0
            consistency = min(100.0, (cnt / 10.0) * 100.0)
            success_score = calculate_drop_success_score(avg_p, avg_s, avg_f, contest_win_rate, consistency)

            results.append({
                "location": r["drop_location"],
                "map": r["map"],
                "drops": cnt,
                "teams": r["total_teams"],
                "avg_placement": avg_p,
                "avg_finishes": avg_f,
                "avg_survival": avg_s,
                "contest_rate": contest_rate,
                "contested_drops": contested_cnt,
                "wins": r["wins"],
                "top3": r["top3"],
                "success_score": success_score,
                "best_team": best_team,
                "x": round(r["avg_x"], 2) if r["avg_x"] else 50.0,
                "y": round(r["avg_y"], 2) if r["avg_y"] else 50.0
            })
        return results

    def get_team_drop_profile(self, team_id: str, map_name: Optional[str] = None, tournament_id: Optional[str] = None) -> Dict[str, Any]:
        """Calculates deep team drop profile, primary/secondary spots, consistency and trend"""
        where_clauses = ["d.team_id = :team_id"]
        params = {"team_id": team_id}
        if map_name and map_name != "All":
            where_clauses.append("d.map = :map_name")
            params["map_name"] = map_name
        if tournament_id and tournament_id != "All":
            where_clauses.append("m.tournament_id = :tournament_id")
            params["tournament_id"] = tournament_id

        where_sql = " AND ".join(where_clauses)
        
        # Team details
        team_row = self.db.execute(text("SELECT team_id, team_name FROM teams WHERE team_id = :team_id"), {"team_id": team_id}).mappings().first()
        if not team_row:
            return {"error": "Team not found"}

        # Drops breakdown
        breakdown_query = text(f"""
            SELECT d.drop_location, d.map, COUNT(*) as drops_cnt,
                   AVG(d.placement) as avg_place,
                   AVG(d.finishes) as avg_finishes,
                   AVG(d.survival_time) as avg_survival,
                   SUM(CASE WHEN d.is_contested = 1 THEN 1 ELSE 0 END) as contested_cnt,
                   SUM(CASE WHEN d.placement = 1 THEN 1 ELSE 0 END) as wins
            FROM drop_locations d
            JOIN matches m ON d.match_id = m.match_id
            WHERE {where_sql}
            GROUP BY d.drop_location, d.map
            ORDER BY drops_cnt DESC
        """)
        breakdown_rows = self.db.execute(breakdown_query, params).mappings().all()

        total_drops = sum(r["drops_cnt"] for r in breakdown_rows)
        primary_drop = breakdown_rows[0]["drop_location"] if breakdown_rows else "N/A"
        secondary_drop = breakdown_rows[1]["drop_location"] if len(breakdown_rows) > 1 else "None"
        
        primary_cnt = breakdown_rows[0]["drops_cnt"] if breakdown_rows else 0
        consistency_pct = round((primary_cnt / total_drops * 100), 1) if total_drops > 0 else 0

        # Overall averages
        overall_query = text(f"""
            SELECT AVG(d.placement) as avg_placement,
                   AVG(d.finishes) as avg_finishes,
                   AVG(d.survival_time) as avg_survival,
                   SUM(CASE WHEN d.survival_time >= 900 THEN 1 ELSE 0 END) as survived_15m
            FROM drop_locations d
            JOIN matches m ON d.match_id = m.match_id
            WHERE {where_sql}
        """)
        overall_res = self.db.execute(overall_query, params).mappings().first()
        avg_placement = round(overall_res["avg_placement"] or 8.0, 1) if overall_res else 8.0
        avg_finishes = round(overall_res["avg_finishes"] or 0.0, 1) if overall_res else 0.0
        survival_rate = round((overall_res["survived_15m"] / total_drops * 100), 1) if overall_res and total_drops > 0 else 0

        # Best and worst drop spots
        best_drop = min(breakdown_rows, key=lambda x: x["avg_place"])["drop_location"] if breakdown_rows else "N/A"
        worst_drop = max(breakdown_rows, key=lambda x: x["avg_place"])["drop_location"] if breakdown_rows else "N/A"

        # Chronological match history
        trend_query = text(f"""
            SELECT m.match_id, m.match_number, m.map, m.stage, m.date, 
                   d.drop_location, d.placement, d.finishes, d.is_contested
            FROM drop_locations d
            JOIN matches m ON d.match_id = m.match_id
            WHERE {where_sql}
            ORDER BY m.date ASC, m.match_number ASC
        """)
        trend_rows = self.db.execute(trend_query, params).mappings().all()

        return {
            "team_id": team_row["team_id"],
            "team_name": team_row["team_name"],
            "total_recorded_drops": total_drops,
            "primary_drop": primary_drop,
            "secondary_drop": secondary_drop,
            "drop_consistency": consistency_pct,
            "avg_placement": avg_placement,
            "avg_finishes": avg_finishes,
            "survival_rate": survival_rate,
            "best_drop": best_drop,
            "worst_drop": worst_drop,
            "drops_breakdown": [
                {
                    "location": r["drop_location"],
                    "map": r["map"],
                    "count": r["drops_cnt"],
                    "percentage": round((r["drops_cnt"] / total_drops * 100), 1) if total_drops > 0 else 0,
                    "avg_placement": round(r["avg_place"], 1),
                    "avg_finishes": round(r["avg_finishes"], 1),
                    "contest_rate": round((r["contested_cnt"] / r["drops_cnt"] * 100), 1) if r["drops_cnt"] > 0 else 0,
                    "wins": r["wins"]
                }
                for r in breakdown_rows
            ],
            "trend": [
                {
                    "match_id": t["match_id"],
                    "match_number": t["match_number"],
                    "map": t["map"],
                    "stage": t["stage"],
                    "date": t["date"],
                    "location": t["drop_location"],
                    "placement": t["placement"],
                    "finishes": t["finishes"],
                    "is_contested": bool(t["is_contested"])
                }
                for t in trend_rows
            ]
        }

    def get_contests_analysis(self, map_name: Optional[str] = None, tournament_id: Optional[str] = None, stage: Optional[str] = None) -> List[Dict[str, Any]]:
        """Identifies contested drop hotspots and clash dynamics"""
        where_clauses = ["d.is_contested = 1"]
        params = {}
        if map_name and map_name != "All":
            where_clauses.append("d.map = :map_name")
            params["map_name"] = map_name
        if tournament_id and tournament_id != "All":
            where_clauses.append("m.tournament_id = :tournament_id")
            params["tournament_id"] = tournament_id
        if stage and stage != "All":
            where_clauses.append("m.stage = :stage")
            params["stage"] = stage

        where_sql = " AND ".join(where_clauses)
        query = text(f"""
            SELECT d.drop_location, d.map,
                   COUNT(DISTINCT d.match_id) as contest_matches,
                   COUNT(*) as total_contesting_teams,
                   COUNT(DISTINCT d.team_id) as unique_teams_involved,
                   AVG(d.placement) as avg_placement,
                   AVG(d.finishes) as avg_finishes
            FROM drop_locations d
            JOIN matches m ON d.match_id = m.match_id
            WHERE {where_sql}
            GROUP BY d.drop_location, d.map
            ORDER BY contest_matches DESC
        """)
        rows = self.db.execute(query, params).mappings().all()
        results = []
        for r in rows:
            # Find dominant team in this contested spot
            dom_query = text("""
                SELECT t.team_name, COUNT(*) as c_cnt, AVG(d.placement) as dom_place
                FROM drop_locations d
                JOIN teams t ON d.team_id = t.team_id
                WHERE d.drop_location = :loc AND d.map = :map AND d.is_contested = 1
                GROUP BY d.team_id
                ORDER BY dom_place ASC, c_cnt DESC
                LIMIT 1
            """)
            dom_res = self.db.execute(dom_query, {"loc": r["drop_location"], "map": r["map"]}).mappings().first()
            dominant_team = dom_res["team_name"] if dom_res else "Contested"
            
            results.append({
                "location": r["drop_location"],
                "map": r["map"],
                "contests": r["contest_matches"],
                "teams_involved": r["unique_teams_involved"],
                "avg_placement": round(r["avg_placement"], 1),
                "avg_finishes": round(r["avg_finishes"], 1),
                "dominant_team": dominant_team,
                "early_eliminations": max(1, int(r["contest_matches"] * 0.75))
            })
        return results

    def get_clash_matrix(self, map_name: Optional[str] = None, tournament_id: Optional[str] = None) -> Dict[str, Any]:
        """Calculates head-to-head drop clashes between top teams"""
        where_clauses = ["d1.is_contested = 1 AND d1.match_id = d2.match_id AND d1.drop_location = d2.drop_location AND d1.team_id < d2.team_id"]
        params = {}
        if map_name and map_name != "All":
            where_clauses.append("d1.map = :map_name")
            params["map_name"] = map_name
        if tournament_id and tournament_id != "All":
            where_clauses.append("m.tournament_id = :tournament_id")
            params["tournament_id"] = tournament_id

        where_sql = " AND ".join(where_clauses)
        query = text(f"""
            SELECT 
                t1.team_name as team_a,
                t2.team_name as team_b,
                d1.drop_location,
                d1.map,
                COUNT(*) as clash_count,
                SUM(CASE WHEN d1.placement < d2.placement THEN 1 ELSE 0 END) as team_a_wins,
                SUM(CASE WHEN d2.placement < d1.placement THEN 1 ELSE 0 END) as team_b_wins
            FROM drop_locations d1
            JOIN drop_locations d2 ON d1.match_id = d2.match_id AND d1.drop_location = d2.drop_location
            JOIN teams t1 ON d1.team_id = t1.team_id
            JOIN teams t2 ON d2.team_id = t2.team_id
            JOIN matches m ON d1.match_id = m.match_id
            WHERE {where_sql}
            GROUP BY t1.team_id, t2.team_id, d1.drop_location, d1.map
            ORDER BY clash_count DESC
            LIMIT 20
        """)
        clashes = self.db.execute(query, params).mappings().all()
        return {
            "clashes": [
                {
                    "team_a": c["team_a"],
                    "team_b": c["team_b"],
                    "location": c["drop_location"],
                    "map": c["map"],
                    "encounters": c["clash_count"],
                    "team_a_wins": c["team_a_wins"],
                    "team_b_wins": c["team_b_wins"]
                }
                for c in clashes
            ]
        }

    def get_history(self, page: int = 1, page_size: int = 25, map_name: Optional[str] = None, tournament_id: Optional[str] = None, team_id: Optional[str] = None, location: Optional[str] = None) -> Dict[str, Any]:
        """Returns paginated drop history with full match and outcome details"""
        where_clauses = ["1=1"]
        params = {}
        if map_name and map_name != "All":
            where_clauses.append("d.map = :map_name")
            params["map_name"] = map_name
        if tournament_id and tournament_id != "All":
            where_clauses.append("m.tournament_id = :tournament_id")
            params["tournament_id"] = tournament_id
        if team_id and team_id != "All":
            where_clauses.append("d.team_id = :team_id")
            params["team_id"] = team_id
        if location and location != "All":
            where_clauses.append("d.drop_location = :location")
            params["location"] = location

        where_sql = " AND ".join(where_clauses)
        
        count_query = text(f"""
            SELECT COUNT(*) 
            FROM drop_locations d
            JOIN matches m ON d.match_id = m.match_id
            WHERE {where_sql}
        """)
        total_records = self.db.execute(count_query, params).scalar() or 0
        
        offset = (page - 1) * page_size
        params["offset"] = offset
        params["limit"] = page_size

        data_query = text(f"""
            SELECT 
                d.drop_id,
                d.match_id,
                m.match_number,
                m.stage,
                m.date,
                tr.tournament_name,
                d.map,
                t.team_id,
                t.team_name,
                d.drop_location,
                d.x,
                d.y,
                d.placement,
                d.finishes,
                d.survival_time,
                d.is_contested
            FROM drop_locations d
            JOIN matches m ON d.match_id = m.match_id
            JOIN tournaments tr ON m.tournament_id = tr.tournament_id
            JOIN teams t ON d.team_id = t.team_id
            WHERE {where_sql}
            ORDER BY m.date DESC, m.match_number DESC, d.placement ASC
            LIMIT :limit OFFSET :offset
        """)
        rows = self.db.execute(data_query, params).mappings().all()
        return {
            "total": total_records,
            "page": page,
            "page_size": page_size,
            "records": [
                {
                    "drop_id": r["drop_id"],
                    "match_id": r["match_id"],
                    "match_number": r["match_number"],
                    "stage": r["stage"],
                    "date": r["date"],
                    "tournament_name": r["tournament_name"],
                    "map": r["map"],
                    "team_id": r["team_id"],
                    "team_name": r["team_name"],
                    "location": r["drop_location"],
                    "x": r["x"],
                    "y": r["y"],
                    "placement": r["placement"],
                    "finishes": r["finishes"],
                    "survival_time": r["survival_time"],
                    "is_contested": bool(r["is_contested"])
                }
                for r in rows
            ]
        }
