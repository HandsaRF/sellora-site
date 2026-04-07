import sys
from PySide6.QtWidgets import QApplication

from app.ui.windows.main_window import MainWindow
from app.utils.theme import apply_theme

from app.repositories.store_repository import StoreRepository
from app.services.store_service import StoreService
from app.repositories.listing_repository import ListingRepository
from app.services.listing_service import ListingService
from app.repositories.listing_media_repository import ListingMediaRepository
from app.database.connection import db_session

from app.repositories.dashboard_repository import DashboardRepository
from app.services.dashboard_service import DashboardService

from app.database.connection import bootstrap_db

def main():
    # Enforce safe schema constraints and migrations on startup
    bootstrap_db()
    
    app = QApplication(sys.argv)
    app.setApplicationName("Sellora")
    
    # Load and apply dark theme constraints and global styles
    apply_theme(app)

    # Composition Root: Dependency Injection initialization
    store_repo = StoreRepository()
    store_service = StoreService(store_repo)
    
    listing_repo = ListingRepository()
    media_repo = ListingMediaRepository(db_session)
    listing_service = ListingService(listing_repo, media_repo)
    
    dashboard_repo = DashboardRepository()
    dashboard_service = DashboardService(dashboard_repo)

    # Initialize shell with injected services
    window = MainWindow(store_service, listing_service, dashboard_service)
    window.show()

    return app.exec()

if __name__ == "__main__":
    sys.exit(main())
