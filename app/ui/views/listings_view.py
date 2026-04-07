from PySide6.QtWidgets import QWidget, QVBoxLayout, QHBoxLayout, QLabel, QTableView, QLineEdit, QPushButton, QHeaderView
from PySide6.QtCore import Qt, QSortFilterProxyModel
from app.services.listing_service import ListingService
from app.ui.table_models.listing_table_model import ListingTableModel

class ListingsView(QWidget):
    def __init__(self, listing_service: ListingService, parent=None):
        super().__init__(parent)
        self.listing_service = listing_service
        
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        
        # Action Bar
        action_bar = QHBoxLayout()
        
        title = QLabel("Listings Backup Root")
        title.setObjectName("ViewTitle")
        
        self.search_input = QLineEdit()
        self.search_input.setPlaceholderText("Search Listings...")
        self.search_input.setFixedWidth(250)
        
        btn_add = QPushButton("Add Listing")
        
        action_bar.addWidget(title)
        action_bar.addStretch()
        action_bar.addWidget(self.search_input)
        action_bar.addWidget(btn_add)
        
        # Table Setup
        self.table_view = QTableView()
        self.table_view.setSelectionBehavior(QTableView.SelectionBehavior.SelectRows)
        self.table_view.setSelectionMode(QTableView.SelectionMode.SingleSelection)
        self.table_view.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Stretch)
        self.table_view.verticalHeader().setVisible(False)
        self.table_view.setAlternatingRowColors(True)

        # Base Model
        self.model = ListingTableModel()
        
        # Proxy Model for filtering
        self.proxy_model = QSortFilterProxyModel()
        self.proxy_model.setSourceModel(self.model)
        self.proxy_model.setFilterCaseSensitivity(Qt.CaseSensitivity.CaseInsensitive)
        self.proxy_model.setFilterKeyColumn(-1) # Filter on all columns
        
        self.table_view.setModel(self.proxy_model)
        
        layout.addLayout(action_bar)
        layout.addWidget(self.table_view)

        # Wire search
        self.search_input.textChanged.connect(self.proxy_model.setFilterFixedString)

    def load_data(self):
        """Called by the main window or logic runner to refresh data."""
        listings = self.listing_service.get_all_listings()
        self.model.update_data(listings)
