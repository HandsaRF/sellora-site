from PySide6.QtWidgets import (
    QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, 
    QLabel, QPushButton, QStackedWidget, QFrame
)
from PySide6.QtCore import Qt
from app.core.config import APP_NAME, VERSION, MIN_WIDTH, MIN_HEIGHT

from app.ui.views.dashboard_view import DashboardView
from app.ui.views.stores_view import StoresView
from app.ui.views.store_detail_view import StoreDetailView
from app.ui.views.listings_view import ListingsView

from app.services.store_service import StoreService
from app.services.listing_service import ListingService
from app.services.dashboard_service import DashboardService


class MainWindow(QMainWindow):
    def __init__(self, store_service: StoreService, listing_service: ListingService, dashboard_service: DashboardService):
        super().__init__()
        self.setWindowTitle(f"{APP_NAME} v{VERSION}")
        self.setMinimumSize(MIN_WIDTH, MIN_HEIGHT)
        
        self.store_service = store_service
        self.listing_service = listing_service
        self.dashboard_service = dashboard_service
        
        # Main central widget
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        main_layout = QHBoxLayout(central_widget)
        main_layout.setContentsMargins(0, 0, 0, 0)
        main_layout.setSpacing(0)
        
        # Left Sidebar
        self.sidebar = QFrame()
        self.sidebar.setObjectName("SidebarFrame")
        self.sidebar.setFixedWidth(240)
        sidebar_layout = QVBoxLayout(self.sidebar)
        sidebar_layout.setContentsMargins(10, 20, 10, 20)
        sidebar_layout.setSpacing(10)
        
        logo_label = QLabel(APP_NAME)
        logo_label.setObjectName("SidebarLogo")
        sidebar_layout.addWidget(logo_label)
        
        self.btn_dashboard = self._create_nav_button("Dashboard")
        self.btn_stores = self._create_nav_button("Stores")
        self.btn_listings = self._create_nav_button("Listings Backup")
        
        sidebar_layout.addWidget(self.btn_dashboard)
        sidebar_layout.addWidget(self.btn_stores)
        sidebar_layout.addWidget(self.btn_listings)
        sidebar_layout.addStretch()
        
        # Main Content Area
        content_vlayout = QVBoxLayout()
        content_vlayout.setContentsMargins(20, 20, 20, 20)
        
        # Top Header (Context / Breadcrumbs)
        self.header_label = QLabel("Dashboard")
        self.header_label.setObjectName("MainHeader")
        content_vlayout.addWidget(self.header_label)
        
        # Stacked Widget to swap central views
        self.stacked_widget = QStackedWidget()
        
        self.dashboard_view = DashboardView(self.dashboard_service)
        self.stores_view = StoresView(self.store_service)
        self.store_detail_view = StoreDetailView(self.store_service, self.listing_service)
        self.listings_view = ListingsView(self.listing_service)
        
        self.stacked_widget.addWidget(self.dashboard_view) # 0
        self.stacked_widget.addWidget(self.stores_view)    # 1
        self.stacked_widget.addWidget(self.listings_view)  # 2
        self.stacked_widget.addWidget(self.store_detail_view) # 3
        
        content_vlayout.addWidget(self.stacked_widget)
        
        # Add to main layout
        main_layout.addWidget(self.sidebar)
        main_layout.addLayout(content_vlayout)
        
        # Connections
        self.btn_dashboard.clicked.connect(lambda: self._switch_view(0, "Dashboard"))
        self.btn_stores.clicked.connect(lambda: self._switch_view(1, "Stores Master"))
        self.btn_listings.clicked.connect(lambda: self._switch_view(2, "Listings Master"))
        
        # Detail Routing Wires
        self.stores_view.on_store_selected.connect(self._open_store_detail)
        self.store_detail_view.on_back_clicked.connect(lambda: self._switch_view(1, "Stores Master"))
        self.store_detail_view.on_store_deleted.connect(lambda _: self._switch_view(1, "Stores Master"))
        
        # Force initial data load for views that demand it
        self.dashboard_view.refresh()
        self.stores_view.load_data()
        self.listings_view.load_data()

    def _create_nav_button(self, text: str) -> QPushButton:
        btn = QPushButton(text)
        btn.setObjectName("NavButton")
        btn.setCursor(Qt.CursorShape.PointingHandCursor)
        return btn

    def _switch_view(self, index: int, title: str):
        self.stacked_widget.setCurrentIndex(index)
        self.header_label.setText(title)
        
        # Force reload upon tabs being organically visited
        if index == 0:
            self.dashboard_view.refresh()
        elif index == 1:
            self.stores_view.load_data()
        elif index == 2:
            self.listings_view.load_data()

    def _open_store_detail(self, store_id: int):
        self.store_detail_view.load_store(store_id)
        # Shift to the hidden detail layout context
        self.stacked_widget.setCurrentIndex(3)
        self.header_label.setText("Store Workspace")
