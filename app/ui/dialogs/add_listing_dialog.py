from PySide6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QLabel, 
    QLineEdit, QPushButton, QFormLayout, QComboBox, QFileDialog
)
from PySide6.QtGui import QPixmap, QIcon
from PySide6.QtCore import Qt
import os
from app.models.listing import Listing
from app.core.config import ListingStatus
from app.services.listing_service import ListingService

class AddListingDialog(QDialog):
    def __init__(self, store_id: int, listing_service: ListingService, parent=None):
        super().__init__(parent)
        self.setWindowTitle("Add New Listing")
        self.setFixedWidth(400)
        self.store_id = store_id # Hidden context
        self.listing_service = listing_service
        
        layout = QVBoxLayout(self)
        
        self.error_label = QLabel("")
        self.error_label.setStyleSheet("color: #ff6b6b; font-weight: bold; padding: 5px;")
        self.error_label.setWordWrap(True)
        self.error_label.hide()
        layout.addWidget(self.error_label)
        
        self.selected_photos = []
        self.selected_video = None
        
        form_layout = QFormLayout()
        
        self.name_input = QLineEdit()
        self.sku_input = QLineEdit()
        
        self.status_input = QComboBox()
        self.status_input.addItems([
            ListingStatus.DRAFT,
            ListingStatus.READY_TO_UPLOAD,
            ListingStatus.UPLOADED,
            ListingStatus.LIVE,
            ListingStatus.REMOVED,
            ListingStatus.BLOCKED
        ])
        
        self.upload_date_input = QLineEdit()
        self.upload_date_input.setPlaceholderText("YYYY-MM-DD (Auto-filled on Uploaded)")
        
        self.status_input.currentTextChanged.connect(self._on_status_changed)
        
        # Media Section
        self.photos_label = QLineEdit("0 Photos Selected")
        self.photos_label.setReadOnly(True)
        
        self.video_label = QLineEdit("No Video Selected")
        self.video_label.setReadOnly(True)
        
        self.files_input = QLineEdit()
        self.files_input.setReadOnly(True)
        self.files_input.setPlaceholderText("No asset zip/folder selected")
        
        def pick_photos():
            paths, _ = QFileDialog.getOpenFileNames(self, "Select Photos (Max 20)", "", "Images (*.png *.jpg *.jpeg *.webp)")
            if paths:
                self.selected_photos = paths
                self.photos_label.setText(f"{len(paths)} Photos Selected")
                
        def clear_photos():
            self.selected_photos = []
            self.photos_label.setText("0 Photos Selected")
            
        def pick_video():
            path, _ = QFileDialog.getOpenFileName(self, "Select Video", "", "Video Files (*.mp4 *.mov *.webm *.m4v)")
            if path:
                self.selected_video = path
                self.video_label.setText(os.path.basename(path))
                
        def clear_video():
            self.selected_video = None
            self.video_label.setText("No Video Selected")
            
        def pick_assets():
            path, _ = QFileDialog.getOpenFileName(self, "Select Asset Zip")
            if path:
                self.files_input.setText(path)
                
        def create_media_row(line_edit, browse_fn, clear_fn):
            row = QHBoxLayout()
            row.addWidget(line_edit)
            btn_browse = QPushButton("Browse...")
            btn_browse.clicked.connect(browse_fn)
            btn_clear = QPushButton("Clear")
            btn_clear.clicked.connect(clear_fn)
            row.addWidget(btn_browse)
            row.addWidget(btn_clear)
            return row
            
        form_layout.addRow("Product Name *", self.name_input)
        form_layout.addRow("Status", self.status_input)
        form_layout.addRow("Upload Date", self.upload_date_input)
        form_layout.addRow("SKU", self.sku_input)
        
        form_layout.addRow("Gallery Photos", create_media_row(self.photos_label, pick_photos, clear_photos))
        form_layout.addRow("Listing Video", create_media_row(self.video_label, pick_video, clear_video))
        form_layout.addRow("Digital Assets", create_media_row(self.files_input, pick_assets, self.files_input.clear))
        
        layout.addLayout(form_layout)
        
        # Buttons
        btn_layout = QHBoxLayout()
        self.btn_save = QPushButton("Save Listing")
        self.btn_cancel = QPushButton("Cancel")
        
        btn_layout.addStretch()
        btn_layout.addWidget(self.btn_cancel)
        btn_layout.addWidget(self.btn_save)
        
        layout.addLayout(btn_layout)
        
        self.btn_save.clicked.connect(self._on_save)
        self.btn_cancel.clicked.connect(self.reject)

    def _on_status_changed(self, new_status: str):
        if new_status == "Uploaded" and not self.upload_date_input.text().strip():
            from datetime import datetime
            self.upload_date_input.setText(datetime.now().strftime('%Y-%m-%d'))

    def _on_save(self):
        try:
            raw_listing = self.get_listing_data()
            created = self.listing_service.create_listing(raw_listing)
            
            if self.selected_photos or self.selected_video:
                self.listing_service.add_media_to_listing(
                    created.id, 
                    image_paths=self.selected_photos, 
                    video_path=self.selected_video
                )
                
            self.accept()
        except ValueError as e:
            self.error_label.setText(str(e))
            self.error_label.show()
        except Exception as e:
            from PySide6.QtWidgets import QMessageBox
            import traceback
            traceback.print_exc()
            QMessageBox.critical(self, "System Error", f"Unexpected error: {str(e)}")

    def get_listing_data(self) -> Listing:
        """Returns the raw dataclass mapping inputs to the store."""
        name = self.name_input.text().strip()
        
        if not name:
            raise ValueError("Product Name is required.")
            
        return Listing(
            store_id=self.store_id,
            product_name=name,
            status=self.status_input.currentText(),
            sku=self.sku_input.text().strip() or None,
            upload_date=self.upload_date_input.text().strip() or None,
            main_image_path=None,  # Deprecated in M12
            files_path=self.files_input.text().strip() or None
        )
