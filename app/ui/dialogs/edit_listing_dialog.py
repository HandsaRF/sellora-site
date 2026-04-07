from PySide6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QLabel, 
    QLineEdit, QPushButton, QFormLayout, QComboBox, QFileDialog
)
from PySide6.QtGui import QPixmap
from PySide6.QtCore import Qt
import os
import copy
from app.models.listing import Listing
from app.core.config import ListingStatus
from app.services.listing_service import ListingService

class EditListingDialog(QDialog):
    def __init__(self, listing: Listing, listing_service: ListingService, parent=None):
        super().__init__(parent)
        self.setWindowTitle(f"Edit Listing: {listing.product_name}")
        self.setFixedWidth(400)
        
        # Work on a detached copy so we don't pollute the live table on cancel/error
        self.listing = copy.deepcopy(listing)
        self.listing_service = listing_service
        
        layout = QVBoxLayout(self)
        
        self.error_label = QLabel("")
        self.error_label.setStyleSheet("color: #ff6b6b; font-weight: bold; padding: 5px;")
        self.error_label.setWordWrap(True)
        self.error_label.hide()
        layout.addWidget(self.error_label)
        
        self.selected_photos = []
        self.selected_video = None
        
        # Load Existing Media Counts
        existing_media = self.listing_service.get_media_for_listing(listing.id)
        existing_imgs = sum(1 for m in existing_media if m.media_type == 'image')
        existing_vid = sum(1 for m in existing_media if m.media_type == 'video')
        
        form_layout = QFormLayout()
        
        self.name_input = QLineEdit(listing.product_name)
        self.sku_input = QLineEdit(listing.sku or "")
        
        self.status_input = QComboBox()
        self.status_input.addItems([
            ListingStatus.DRAFT,
            ListingStatus.READY_TO_UPLOAD,
            ListingStatus.UPLOADED,
            ListingStatus.LIVE,
            ListingStatus.REMOVED,
            ListingStatus.BLOCKED
        ])
        
        # Pre-select active status natively
        idx = self.status_input.findText(listing.status)
        if idx >= 0:
            self.status_input.setCurrentIndex(idx)
            
        self.upload_date_input = QLineEdit(listing.upload_date or "")
        self.upload_date_input.setPlaceholderText("YYYY-MM-DD (Auto-filled on Uploaded)")
        
        self.status_input.currentTextChanged.connect(self._on_status_changed)
        
        # Media Section
        self.photos_label = QLineEdit(f"{existing_imgs} Existing Photos (0 New)")
        self.photos_label.setReadOnly(True)
        
        self.video_label = QLineEdit("1 Video Attached" if existing_vid else "No Video Selected")
        self.video_label.setReadOnly(True)
        
        self.files_input = QLineEdit(listing.files_path or "")
        self.files_input.setReadOnly(True)
        self.files_input.setPlaceholderText("No asset zip/folder selected")
        
        def pick_photos():
            paths, _ = QFileDialog.getOpenFileNames(self, "Append Photos (Max 20)", "", "Images (*.png *.jpg *.jpeg *.webp)")
            if paths:
                self.selected_photos.extend(paths)
                self.photos_label.setText(f"{existing_imgs} Existing, {len(self.selected_photos)} New")
                
        def clear_photos():
            self.selected_photos = []
            self.photos_label.setText(f"{existing_imgs} Existing Photos (0 New)")
            
        def pick_video():
            path, _ = QFileDialog.getOpenFileName(self, "Select Video", "", "Video Files (*.mp4 *.mov *.webm *.m4v)")
            if path:
                self.selected_video = path
                self.video_label.setText(os.path.basename(path))
                
        def clear_video():
            self.selected_video = None
            self.video_label.setText("1 Video Attached" if existing_vid else "No Video Selected")
            
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
        self.btn_save = QPushButton("Save Changes")
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
            self._apply_inputs()
            self.listing_service.update_listing(self.listing)
            
            if self.selected_photos or self.selected_video:
                self.listing_service.add_media_to_listing(
                    self.listing.id,
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

    def _apply_inputs(self):
        """Mutates the loaded tracking dataclass mapping active inputs."""
        name = self.name_input.text().strip()
        if not name:
            raise ValueError("Product Name is required.")
            
        self.listing.product_name = name
        self.listing.status = self.status_input.currentText()
        self.listing.sku = self.sku_input.text().strip() or None
        self.listing.upload_date = self.upload_date_input.text().strip() or None
        self.listing.main_image_path = None # Deprecated M12
        self.listing.files_path = self.files_input.text().strip() or None
