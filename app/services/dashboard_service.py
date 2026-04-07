from app.models.dashboard import DashboardSummary
from app.repositories.dashboard_repository import DashboardRepository

class DashboardService:
    def __init__(self, repository: DashboardRepository):
        self.repository = repository

    def get_summary(self) -> DashboardSummary:
        store_counts = self.repository.get_store_counts()
        listing_counts = self.repository.get_listing_counts()
        overviews = self.repository.get_store_overviews()
        activity = self.repository.get_recent_activity(limit=10)

        return DashboardSummary(
            total_stores=store_counts["total"],
            running_stores=store_counts["running"],
            blocked_stores=store_counts["blocked"],
            total_listings=listing_counts["total"],
            live_listings=listing_counts["live"],
            store_overviews=overviews,
            recent_updates=activity
        )
