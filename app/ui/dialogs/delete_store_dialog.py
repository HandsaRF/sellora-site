from PySide6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QLabel, 
    QLineEdit, QPushButton, QMessageBox
)
from app.models.store import Store
from app.services.store_service import StoreService

class DeleteStoreDialog(QDialog):
    def __init__(self, store: Store, store_service: StoreService, parent=None):
        super().__init__(parent)
        self.setWindowTitle(f"Delete Store: {store.store_name}")
        self.setFixedWidth(400)
        
        self.store = store
        self.store_service = store_service
        
        layout = QVBoxLayout(self)
        
        self.error_label = QLabel("")
        self.error_label.setStyleSheet("color: #ff6b6b; font-weight: bold; padding: 5px;")
        self.error_label.hide()
        layout.addWidget(self.error_label)
        
        warning_header = QLabel("WARNING: DESTRUCTIVE ACTION")
        warning_header.setStyleSheet("color: #ff4757; font-weight: bold; font-size: 14px;")
        layout.addWidget(warning_header)
        
        warning_msg = QLabel(
            "Deleting this store will permanently cascade and erase ALL associated listings "
            "and historical data inside this workspace.\n\n"
            f"To confirm, type the store name exactly:\n'{self.store.store_name}'"
        )
        warning_msg.setWordWrap(True)
        layout.addWidget(warning_msg)
        
        self.confirm_input = QLineEdit()
        self.confirm_input.setPlaceholderText(self.store.store_name)
        layout.addWidget(self.confirm_input)
        
        # Buttons
        btn_layout = QHBoxLayout()
        self.btn_delete = QPushButton("Delete Store permanently")
        self.btn_delete.setStyleSheet("background-color: #ff4757; color: white; font-weight: bold;")
        self.btn_cancel = QPushButton("Cancel")
        
        btn_layout.addStretch()
        btn_layout.addWidget(self.btn_cancel)
        btn_layout.addWidget(self.btn_delete)
        
        layout.addLayout(btn_layout)
        
        self.btn_delete.clicked.connect(self._on_delete)
        self.btn_cancel.clicked.connect(self.reject)

    def _on_delete(self):
        try:
            input_name = self.confirm_input.text().strip()
            # Pass only the raw input string exactly as directed by M7 boundaries
            self.store_service.delete_store(self.store.id, input_name)
            self.accept()
        except ValueError as e:
            self.error_label.setText(str(e))
            self.error_label.show()
        except Exception as e:
            QMessageBox.critical(self, "System Error", f"Unexpected error: {str(e)}")
