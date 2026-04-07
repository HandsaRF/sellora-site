from PySide6.QtCore import Qt, QSortFilterProxyModel, Signal
from PySide6.QtWidgets import QWidget, QVBoxLayout, QHBoxLayout, QLabel, QTableView, QLineEdit, QPushButton, QHeaderView, QMessageBox
from app.services.store_service import StoreService
from app.ui.table_models.store_table_model import StoreTableModel
from app.ui.dialogs.add_store_dialog import AddStoreDialog

class StoresView(QWidget):
    on_store_selected = Signal(int)

    def __init__(self, store_service: StoreService, parent=None):
        super().__init__(parent)
        self.store_service = store_service
        
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        
        # Action Bar
        action_bar = QHBoxLayout()
        
        title = QLabel("Stores Master Data")
        title.setObjectName("ViewTitle")
        
        self.search_input = QLineEdit()
        self.search_input.setPlaceholderText("Search Stores...")
        self.search_input.setFixedWidth(250)
        
        btn_add = QPushButton("Add Store")
        btn_add.clicked.connect(self._handle_add_store)
        
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
        self.model = StoreTableModel()
        
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
        
        # Wire double-click
        self.table_view.doubleClicked.connect(self._on_table_double_clicked)

    def _on_table_double_clicked(self, index):
        # Index is from proxy_model, map to source
        source_index = self.proxy_model.mapToSource(index)
        store = self.model._data[source_index.row()]
        self.on_store_selected.emit(store.id)

    def _handle_add_store(self):
        dialog = AddStoreDialog(self.store_service, self)
        if dialog.exec():
            # If accepted, the store was successfully saved and validated via the Dialog natively.
            self.load_data()

    def load_data(self):
        """Called by the main window or logic runner to refresh data."""
        stores = self.store_service.get_stores_overview()
        self.model.update_data(stores)
