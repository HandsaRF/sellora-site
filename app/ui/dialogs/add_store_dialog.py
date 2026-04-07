from PySide6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QLabel, 
    QLineEdit, QPushButton, QFormLayout, QComboBox, QFileDialog
)
from app.models.store import Store
from app.core.config import StoreStatus
from app.services.store_service import StoreService

class AddStoreDialog(QDialog):
    def __init__(self, store_service: StoreService, parent=None):
        super().__init__(parent)
        self.setWindowTitle("Add New Store")
        self.setFixedWidth(400)
        self.store_service = store_service
        
        layout = QVBoxLayout(self)
        
        self.error_label = QLabel("")
        self.error_label.setStyleSheet("color: #ff6b6b; font-weight: bold; padding: 5px;")
        self.error_label.hide()
        layout.addWidget(self.error_label)
        
        form_layout = QFormLayout()
        
        self.name_input = QLineEdit()
        self.owner_input = QLineEdit()
        self.niche_input = QLineEdit()
        
        self.status_input = QComboBox()
        self.status_input.addItems([
            StoreStatus.NOT_STARTED,
            StoreStatus.IN_PROGRESS,
            StoreStatus.RUNNING,
            StoreStatus.BLOCKED,
            StoreStatus.PAUSED
        ])
        
        # Secondary identifier (UX rule: not primary focus)
        self.code_input = QLineEdit()
        self.code_input.setPlaceholderText("Optional (Auto-generated if empty)")
        
        # Media paths
        self.logo_input = QLineEdit()
        self.logo_input.setReadOnly(True)
        self.logo_input.setPlaceholderText("No file selected")
        
        self.banner_input = QLineEdit()
        self.banner_input.setReadOnly(True)
        self.banner_input.setPlaceholderText("No file selected")

        def create_file_row(title, line_edit):
            row_layout = QHBoxLayout()
            row_layout.addWidget(line_edit)
            btn_browse = QPushButton("Browse...")
            btn_clear = QPushButton("Clear")
            row_layout.addWidget(btn_browse)
            row_layout.addWidget(btn_clear)
            # Connect
            btn_browse.clicked.connect(lambda: line_edit.setText(QFileDialog.getOpenFileName(self, f"Select {title}")[0] or line_edit.text()))
            btn_clear.clicked.connect(line_edit.clear)
            return row_layout
        
        form_layout.addRow("Store Name *", self.name_input)
        form_layout.addRow("Owner Name *", self.owner_input)
        form_layout.addRow("Status", self.status_input)
        form_layout.addRow("Niche", self.niche_input)
        form_layout.addRow("Store Code", self.code_input)
        form_layout.addRow("Logo File", create_file_row("Logo", self.logo_input))
        form_layout.addRow("Banner File", create_file_row("Banner", self.banner_input))
        
        layout.addLayout(form_layout)
        
        # Buttons
        btn_layout = QHBoxLayout()
        self.btn_save = QPushButton("Save Store")
        self.btn_cancel = QPushButton("Cancel")
        
        btn_layout.addStretch()
        btn_layout.addWidget(self.btn_cancel)
        btn_layout.addWidget(self.btn_save)
        
        layout.addLayout(btn_layout)
        
        self.btn_save.clicked.connect(self._on_save)
        self.btn_cancel.clicked.connect(self.reject)

    def _on_save(self):
        try:
            raw_store = self.get_store_data()
            self.store_service.create_store(raw_store)
            self.accept()
        except ValueError as e:
            self.error_label.setText(str(e))
            self.error_label.show()
        except Exception as e:
            # System-level failure bubble up as unexpected
            from PySide6.QtWidgets import QMessageBox
            QMessageBox.critical(self, "System Error", f"Unexpected error: {str(e)}")

    def get_store_data(self) -> Store:
        """Returns the raw dataclass holding user inputs."""
        name = self.name_input.text().strip()
        owner = self.owner_input.text().strip()
        
        if not name or not owner:
            raise ValueError("Store Name and Owner Name are required.")
            
        return Store(
            store_name=name,
            owner_name=owner,
            status=self.status_input.currentText(),
            niche=self.niche_input.text().strip() or None,
            store_code=self.code_input.text().strip(),  # Handled by Service if empty
            logo_path=self.logo_input.text().strip() or None,
            banner_path=self.banner_input.text().strip() or None
        )
