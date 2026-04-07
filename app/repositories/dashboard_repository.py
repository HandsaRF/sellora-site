from typing import Dict, List, Any
from app.database.connection import db_session
from app.core.config import ListingStatus, StoreStatus

class DashboardRepository:
    def get_store_counts(self) -> Dict[str, int]:
        query = """
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as running,
                SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as blocked
            FROM stores
        """
        counts = {"total": 0, "running": 0, "blocked": 0}
        with db_session() as conn:
            cursor = conn.execute(query, (StoreStatus.RUNNING, StoreStatus.BLOCKED))
            row = cursor.fetchone()
            if row:
                counts["total"] = row["total"] or 0
                counts["running"] = row["running"] or 0
                counts["blocked"] = row["blocked"] or 0
        return counts

    def get_listing_counts(self) -> Dict[str, int]:
        query = """
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as live
            FROM listings
        """
        counts = {"total": 0, "live": 0}
        with db_session() as conn:
            cursor = conn.execute(query, (ListingStatus.LIVE,))
            row = cursor.fetchone()
            if row:
                counts["total"] = row["total"] or 0
                counts["live"] = row["live"] or 0
        return counts

    def get_store_overviews(self) -> List[Dict]:
        query = """
            SELECT s.store_name, s.status,
                   (SELECT COUNT(*) FROM listings l WHERE l.store_id = s.id) as total_listings,
                   (SELECT COUNT(*) FROM listings l WHERE l.store_id = s.id AND l.status = ?) as live_listings
            FROM stores s
            ORDER BY s.store_name ASC
        """
        overviews = []
        with db_session() as conn:
            cursor = conn.execute(query, (ListingStatus.LIVE,))
            for row in cursor.fetchall():
                overviews.append({
                    "store_name": row["store_name"],
                    "status": row["status"],
                    "total_listings": row["total_listings"],
                    "live_listings": row["live_listings"]
                })
        return overviews

    def get_recent_activity(self, limit: int = 10) -> List[Dict]:
        query = """
            SELECT 'Store' as type, store_name as name, status, updated_at as timestamp
            FROM stores
            
            UNION ALL
            
            SELECT 'Listing' as type, product_name as name, status, last_updated as timestamp
            FROM listings
            
            ORDER BY timestamp DESC
            LIMIT ?
        """
        activity = []
        with db_session() as conn:
            cursor = conn.execute(query, (limit,))
            for row in cursor.fetchall():
                activity.append({
                    "type": row["type"],
                    "name": row["name"],
                    "status": row["status"],
                    "timestamp": row["timestamp"]
                })
        return activity
