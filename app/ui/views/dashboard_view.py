from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, 
    QFrame, QTableWidget, QTableWidgetItem, QHeaderView, QListWidget, QListWidgetItem
)
from PySide6.QtCore import Qt
from app.services.dashboard_service import DashboardService

class DashboardCard(QFrame):
    def __init__(self, title: str, parent=None):
        super().__init__(parent)
        self.setObjectName("DashboardCard")
        layout = QVBoxLayout(self)
        
        self.title_label = QLabel(title)
        self.title_label.setObjectName("CardTitle")
        self.title_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        
        self.value_label = QLabel("0")
        self.value_label.setObjectName("CardValue")
        self.value_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        
        layout.addWidget(self.title_label)
        layout.addWidget(self.value_label)
        
    def set_value(self, val: int):
        self.value_label.setText(str(val))

class DashboardView(QWidget):
    def __init__(self, dashboard_service: DashboardService, parent=None):
        super().__init__(parent)
        self.dashboard_service = dashboard_service
        self.setup_ui()

    def setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        
        # Title
        title = QLabel("Dashboard")
        title.setObjectName("ViewTitle")
        layout.addWidget(title)
        
        # Summary Cards Layout
        cards_layout = QHBoxLayout()
        self.card_total_stores = DashboardCard("Total Stores")
        self.card_running_stores = DashboardCard("Running Stores")
        self.card_blocked_stores = DashboardCard("Blocked Stores")
        self.card_total_listings = DashboardCard("Total Listings")
        self.card_live_listings = DashboardCard("Live Listings")
        
        cards_layout.addWidget(self.card_total_stores)
        cards_layout.addWidget(self.card_running_stores)
        cards_layout.addWidget(self.card_blocked_stores)
        cards_layout.addWidget(self.card_total_listings)
        cards_layout.addWidget(self.card_live_listings)
        
        layout.addLayout(cards_layout)
        
        # Two pane layout for Overviews and Activity
        pane_layout = QHBoxLayout()
        
        # Left Pane: Store Overviews
        left_pane = QVBoxLayout()
        store_title = QLabel("Store Overview")
        store_title.setObjectName("SectionTitle")
        
        self.store_table = QTableWidget(0, 4)
        self.store_table.setHorizontalHeaderLabels(["Store Name", "Status", "Total Listings", "Live Listings"])
        self.store_table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Stretch)
        self.store_table.setEditTriggers(QTableWidget.EditTrigger.NoEditTriggers)
        self.store_table.setSelectionMode(QTableWidget.SelectionMode.NoSelection)
        self.store_table.setFocusPolicy(Qt.FocusPolicy.NoFocus)
        self.store_table.setAlternatingRowColors(True)
        self.store_table.verticalHeader().setVisible(False)
        self.store_table.setObjectName("DashboardTable")
        
        left_pane.addWidget(store_title)
        left_pane.addWidget(self.store_table)
        
        # Right Pane: Recent Activity
        right_pane = QVBoxLayout()
        activity_title = QLabel("Recent Activity")
        activity_title.setObjectName("SectionTitle")
        
        self.activity_list = QListWidget()
        self.activity_list.setSelectionMode(QListWidget.SelectionMode.NoSelection)
        self.activity_list.setFocusPolicy(Qt.FocusPolicy.NoFocus)
        self.activity_list.setObjectName("DashboardList")
        
        right_pane.addWidget(activity_title)
        right_pane.addWidget(self.activity_list)
        
        # Tweak proportions (2:1 ratio for tables)
        pane_layout.addLayout(left_pane, 2)
        pane_layout.addLayout(right_pane, 1)
        
        layout.addLayout(pane_layout)
    
    def refresh(self):
        summary = self.dashboard_service.get_summary()
        
        # Update cards
        self.card_total_stores.set_value(summary.total_stores)
        self.card_running_stores.set_value(summary.running_stores)
        self.card_blocked_stores.set_value(summary.blocked_stores)
        self.card_total_listings.set_value(summary.total_listings)
        self.card_live_listings.set_value(summary.live_listings)
        
        # Update Store Overviews
        self.store_table.setRowCount(0)
        for i, store in enumerate(summary.store_overviews):
            self.store_table.insertRow(i)
            self.store_table.setItem(i, 0, QTableWidgetItem(store["store_name"]))
            
            status_item = QTableWidgetItem(store["status"])
            status_item.setTextAlignment(Qt.AlignmentFlag.AlignCenter)
            self.store_table.setItem(i, 1, status_item)
            
            total_item = QTableWidgetItem(str(store["total_listings"]))
            total_item.setTextAlignment(Qt.AlignmentFlag.AlignCenter)
            self.store_table.setItem(i, 2, total_item)
            
            live_item = QTableWidgetItem(str(store["live_listings"]))
            live_item.setTextAlignment(Qt.AlignmentFlag.AlignCenter)
            self.store_table.setItem(i, 3, live_item)
            
        # Update Recent Activity
        self.activity_list.clear()
        for action in summary.recent_updates:
            # Simple format: [Store/Listing] Name: Status (Timestamp)
            # Make timestamp look a bit cleaner (just a date or simple string)
            raw_ts = action["timestamp"] or ""
            clean_ts = raw_ts.split("T")[0] if "T" in raw_ts else raw_ts
            text = f"[{action['type']}] {action['name']} -> {action['status']}  ({clean_ts})"
            item = QListWidgetItem(text)
            self.activity_list.addItem(item)
