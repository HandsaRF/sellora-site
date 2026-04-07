from fastapi import APIRouter
from typing import Dict, Any
from database import db_session

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/")
def get_dashboard_stats():
    with db_session() as conn:
        counts = conn.execute("""
            SELECT 
                (SELECT COUNT(*) FROM stores) as total_stores,
                (SELECT COUNT(*) FROM stores WHERE status = 'Running') as running_stores,
                (SELECT COUNT(*) FROM listings) as total_listings,
                (SELECT COUNT(*) FROM listings WHERE status = 'Live') as live_listings
        """).fetchone()

        attention = conn.execute("""
            SELECT 
                (SELECT COUNT(*) FROM stores WHERE status = 'Blocked') as blocked_stores,
                (SELECT COUNT(*) FROM listings WHERE status = 'Ready to Upload') as ready_listings,
                (SELECT COUNT(*) FROM listings WHERE main_image_path IS NULL OR main_image_path = '') as missing_main_image
        """).fetchone()

        # Basic activity log mock/query (can be enhanced later based on updated_at)
        activity = [
            {"message": "Dashboard data connected!"}
        ]
        
        return {
            "kpi": dict(counts),
            "attention": dict(attention),
            "activity": activity
        }
