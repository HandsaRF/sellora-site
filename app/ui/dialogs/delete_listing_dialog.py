from PySide6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QLabel, 
    QPushButton, QMessageBox
)
from app.models.listing import Listing
from app.services.listing_service import ListingService

class DeleteListingDialog(QDialog):
    def __init__(self, listing: Listing, listing_service: ListingService, parent=None):
        super().__init__(parent)
        self.setWindowTitle("Delete Listing")
        self.setFixedWidth(350)
        
        self.listing = listing
        self.listing_service = listing_service
        
        layout = QVBoxLayout(self)
        
        self.error_label = QLabel("")
        self.error_label.setStyleSheet("color: #ff6b6b; font-weight: bold; padding: 5px;")
        self.error_label.hide()
        layout.addWidget(self.error_label)
        
        warning_msg = QLabel(f"Are you sure you want to permanently delete:\n\n{self.listing.product_name}?")
        warning_msg.setWordWrap(True)
        layout.addWidget(warning_msg)
        
        # Buttons
        btn_layout = QHBoxLayout()
        self.btn_delete = QPushButton("Delete Listing")
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
            self.listing_service.delete_listing(self.listing.id)
            self.accept()
        except Exception as e:
            QMessageBox.critical(self, "System Error", f"Unexpected error: {str(e)}")
