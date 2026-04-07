from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QToolButton, QScrollArea,
    QTableView, QPushButton, QHeaderView, QMessageBox, QFrame, QFileDialog, QStyle
)
from PySide6.QtGui import QPixmap, QIcon
import os
from PySide6.QtCore import Qt, QSortFilterProxyModel, Signal
from app.services.store_service import StoreService
from app.services.listing_service import ListingService
from app.services.storage_service import StorageService
from app.ui.table_models.listing_table_model import ListingTableModel
from app.ui.dialogs.add_listing_dialog import AddListingDialog
from app.ui.dialogs.edit_listing_dialog import EditListingDialog
from app.ui.dialogs.edit_store_dialog import EditStoreDialog
from app.ui.dialogs.delete_listing_dialog import DeleteListingDialog
from app.ui.dialogs.delete_store_dialog import DeleteStoreDialog

class ResizeImageLabel(QLabel):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.pix = None
        
    def setPixmap(self, pixmap):
        self.pix = pixmap
        super().setPixmap(self._scaled_pixmap())
        
    def set_empty_text(self, text):
        self.pix = None
        self.setText(text)
        
    def resizeEvent(self, event):
        if self.pix and not self.pix.isNull():
            super().setPixmap(self._scaled_pixmap())
        super().resizeEvent(event)
        
    def _scaled_pixmap(self):
        if not self.pix or self.pix.isNull():
            return QPixmap()
        return self.pix.scaled(
            self.size(), 
            Qt.AspectRatioMode.KeepAspectRatioByExpanding, 
            Qt.TransformationMode.SmoothTransformation
        )

class StoreDetailView(QWidget):
    # Signals for navigating backwards and deleting current silo
    on_back_clicked = Signal()
    on_store_deleted = Signal(int)

    def __init__(self, store_service: StoreService, listing_service: ListingService, parent=None):
        super().__init__(parent)
        self.store_service = store_service
        self.listing_service = listing_service
        self.active_store_id = None
        self.active_store = None
        
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        
        # Top Full-Width Banner
        self.banner_label = ResizeImageLabel()
        self.banner_label.set_empty_text("No Banner")
        self.banner_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.banner_label.setFixedHeight(140)
        self.banner_label.setStyleSheet("background-color: #11111b; color: #a6adc8;")
        layout.addWidget(self.banner_label)
        
        # Details & Logo Row
        details_layout = QHBoxLayout()
        details_layout.setContentsMargins(15, 10, 15, 10)
        self.logo_label = QLabel("No Logo")
        self.logo_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.logo_label.setFixedSize(80, 80)
        self.logo_label.setStyleSheet("background-color: #181825; border: 1px solid #313244; color: #a6adc8;")
        
        self.title_label = QLabel("Store Detail: Loading...")
        self.title_label.setObjectName("ViewTitle")
        
        details_layout.addWidget(self.logo_label)
        details_layout.addSpacing(15)
        
        # Subtle Logo Export Icon
        self.btn_export_logo = QToolButton()
        self.btn_export_logo.setIcon(self.style().standardIcon(QStyle.StandardPixmap.SP_DialogSaveButton))
        self.btn_export_logo.setToolTip("Export Store Logo")
        self.btn_export_logo.setStyleSheet("border: none; background: transparent;")
        self.btn_export_logo.clicked.connect(self._handle_export_logo)
        self.btn_export_logo.setEnabled(False)
        details_layout.addWidget(self.btn_export_logo)
        
        details_layout.addSpacing(15)
        details_layout.addWidget(self.title_label)
        details_layout.addStretch()
        layout.addLayout(details_layout)
        
        # Store Action Bar
        store_action_bar = QHBoxLayout()
        store_action_bar.setContentsMargins(15, 0, 15, 5)
        self.btn_back = QPushButton("<- Back to Stores")
        self.btn_back.clicked.connect(self.on_back_clicked.emit)
        
        self.btn_edit_store = QPushButton("Edit Store Settings")
        self.btn_edit_store.clicked.connect(self._handle_edit_store)
        self.btn_edit_store.setEnabled(False)
        
        self.btn_delete_store = QPushButton("Delete Store")
        self.btn_delete_store.setStyleSheet("color: #ff4757;")
        self.btn_delete_store.clicked.connect(self._handle_delete_store)
        self.btn_delete_store.setEnabled(False)
        
        store_action_bar.addWidget(self.btn_back)
        store_action_bar.addSpacing(20)
        store_action_bar.addWidget(self.btn_edit_store)
        store_action_bar.addWidget(self.btn_delete_store)
        store_action_bar.addStretch()
        layout.addLayout(store_action_bar)
        
        # Separator to split store and listing
        separator = QFrame()
        separator.setFrameShape(QFrame.Shape.HLine)
        separator.setStyleSheet("color: #313244; margin-top: 10px; margin-bottom: 10px;")
        layout.addWidget(separator)
        
        # Listing Action Bar
        listing_action_bar = QHBoxLayout()
        listing_action_bar.setContentsMargins(15, 0, 15, 5)
        self.btn_add_listing = QPushButton("Add Listing")
        self.btn_add_listing.clicked.connect(self._handle_add_listing)
        
        self.btn_edit_listing = QToolButton()
        self.btn_edit_listing.setIcon(self.style().standardIcon(QStyle.StandardPixmap.SP_FileIcon))
        self.btn_edit_listing.setToolTip("Edit Selected")
        self.btn_edit_listing.clicked.connect(self._handle_edit_listing)
        
        self.btn_delete_listing = QToolButton()
        self.btn_delete_listing.setIcon(self.style().standardIcon(QStyle.StandardPixmap.SP_TrashIcon))
        self.btn_delete_listing.setToolTip("Delete Selected")
        self.btn_delete_listing.clicked.connect(self._handle_delete_listing)
        
        self.btn_export_assets = QToolButton()
        self.btn_export_assets.setIcon(self.style().standardIcon(QStyle.StandardPixmap.SP_DialogSaveButton))
        self.btn_export_assets.setToolTip("Export Listing Assets")
        self.btn_export_assets.clicked.connect(self._handle_export_assets)
        
        self.btn_edit_listing.setEnabled(False)
        self.btn_delete_listing.setEnabled(False)
        self.btn_export_assets.setEnabled(False)
        
        listing_action_bar.addWidget(self.btn_add_listing)
        listing_action_bar.addStretch()
        listing_action_bar.addWidget(self.btn_edit_listing)
        listing_action_bar.addWidget(self.btn_delete_listing)
        listing_action_bar.addSpacing(15)
        listing_action_bar.addWidget(self.btn_export_assets)
        layout.addLayout(listing_action_bar)
        
        # Table Setup (Reuse ListingTableModel)
        self.table_view = QTableView()
        self.table_view.setSelectionBehavior(QTableView.SelectionBehavior.SelectRows)
        self.table_view.setSelectionMode(QTableView.SelectionMode.SingleSelection)
        self.table_view.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Stretch)
        self.table_view.verticalHeader().setVisible(False)
        self.table_view.setAlternatingRowColors(True)
        self.model = ListingTableModel()
        self.proxy_model = QSortFilterProxyModel()
        self.proxy_model.setSourceModel(self.model)
        self.table_view.setModel(self.proxy_model)
        
        # Selection wires
        self.table_view.selectionModel().selectionChanged.connect(self._on_selection_changed)
        self.table_view.doubleClicked.connect(self._handle_edit_listing)
        layout.addWidget(self.table_view)
        
        # Gallery Sub-area mapping visual elements passively to the active selection
        self.gallery_area = QScrollArea()
        self.gallery_area.setWidgetResizable(True)
        self.gallery_area.setFixedHeight(120)
        self.gallery_area.setStyleSheet("border: 1px solid #313244; background: #1e1e2e;")
        self.gallery_area.hide() # Hidden until selection natively
        
        self.gallery_content = QWidget()
        self.gallery_layout = QHBoxLayout(self.gallery_content)
        self.gallery_layout.setAlignment(Qt.AlignmentFlag.AlignLeft)
        self.gallery_layout.setContentsMargins(5, 5, 5, 5)
        self.gallery_area.setWidget(self.gallery_content)
        
        layout.addWidget(self.gallery_area)

    def load_store(self, store_id: int):
        """Loads contextual header data and listings for a single store."""
        self.active_store_id = store_id
        store = self.store_service.get_store(store_id)
        self.active_store = store
        
        if store:
            self.title_label.setText(f"{store.store_name} ({store.live_listings} Live / {store.total_listings} Total)")
            self.btn_edit_store.setEnabled(True)
            self.btn_delete_store.setEnabled(True)
            self.btn_export_logo.setEnabled(bool(store.logo_path and os.path.exists(store.logo_path)))
            
            # Branding hydration
            if store.logo_path and os.path.exists(store.logo_path):
                self.logo_label.setPixmap(QPixmap(store.logo_path).scaled(self.logo_label.size(), Qt.AspectRatioMode.KeepAspectRatio, Qt.TransformationMode.SmoothTransformation))
            else:
                self.logo_label.setPixmap(QPixmap())
                self.logo_label.setText("No Logo")
                
            if store.banner_path and os.path.exists(store.banner_path):
                self.banner_label.setPixmap(QPixmap(store.banner_path))
            else:
                self.banner_label.set_empty_text("No Banner")
        else:
            self.title_label.setText(f"Store {store_id}")
            self.btn_edit_store.setEnabled(False)
            self.btn_delete_store.setEnabled(False)
            self.btn_export_logo.setEnabled(False)
            self.logo_label.setPixmap(QPixmap())
            self.logo_label.setText("No Logo")
            self.banner_label.set_empty_text("No Banner")
            
        self.load_data()
        
    def load_data(self):
        """Refreshes the siloed listings table."""
        if self.active_store_id:
            listings = self.listing_service.get_all_for_store(self.active_store_id)
            self.model.update_data(listings)

    def _handle_add_listing(self):
        if not self.active_store_id:
            return
            
        dialog = AddListingDialog(self.active_store_id, self.listing_service, self)
        if dialog.exec():
            # If accepted, listing was safely mapped + saved entirely by bounded Dialog.
            self.load_store(self.active_store_id)

    def _on_selection_changed(self):
        has_selection = self.table_view.selectionModel().hasSelection()
        self.btn_edit_listing.setEnabled(has_selection)
        self.btn_delete_listing.setEnabled(has_selection)
        
        # Clear existing gallery widgets
        while self.gallery_layout.count():
            child = self.gallery_layout.takeAt(0)
            if child.widget():
                child.widget().deleteLater()
                
        if has_selection:
            selection = self.table_view.selectionModel().selectedRows()
            source_index = self.proxy_model.mapToSource(selection[0])
            listing_obj = self.model._data[source_index.row()]
            full_listing = self.listing_service.get_listing(listing_obj.id)
            
            self.btn_export_assets.setEnabled(bool(full_listing and full_listing.files_path and os.path.exists(full_listing.files_path)))
            
            # Repopulate Active Gallery Track
            medias = self.listing_service.get_media_for_listing(listing_obj.id)
            if medias:
                self.gallery_area.show()
                for m in medias:
                    container = QWidget()
                    vbox = QVBoxLayout(container)
                    vbox.setContentsMargins(5, 5, 5, 5)
                    
                    if m.media_type == 'image' and os.path.exists(m.internal_path):
                        img_lbl = QLabel()
                        img_lbl.setFixedSize(80, 80)
                        img_lbl.setPixmap(QPixmap(m.internal_path).scaled(80, 80, Qt.AspectRatioMode.KeepAspectRatioByExpanding, Qt.TransformationMode.SmoothTransformation))
                        vbox.addWidget(img_lbl)
                    elif m.media_type == 'video':
                        vid_lbl = QLabel("🎥 Video")
                        vid_lbl.setAlignment(Qt.AlignmentFlag.AlignCenter)
                        vid_lbl.setFixedSize(80, 80)
                        vid_lbl.setStyleSheet("background: #313244; color: white;")
                        vbox.addWidget(vid_lbl)
                        
                    # Add subtle reveal icon
                    btn_reveal = QToolButton()
                    btn_reveal.setIcon(self.style().standardIcon(QStyle.StandardPixmap.SP_DirOpenIcon))
                    btn_reveal.setToolTip("Reveal File")
                    btn_reveal.clicked.connect(lambda _, path=m.internal_path: self._reveal_file(path))
                    vbox.addWidget(btn_reveal, alignment=Qt.AlignmentFlag.AlignCenter)
                    
                    self.gallery_layout.addWidget(container)
                self.gallery_layout.addStretch()
            else:
                self.gallery_area.hide()
        else:
            self.btn_export_assets.setEnabled(False)
            self.gallery_area.hide()
            
    def _reveal_file(self, path: str):
        # Native OS reveal
        import subprocess, platform
        system = platform.system()
        if system == "Windows":
            subprocess.run(["explorer", "/select,", os.path.normpath(path)])
        elif system == "Darwin":
            subprocess.run(["open", "-R", path])
        else:
            subprocess.run(["xdg-open", os.path.dirname(path)])

    def _handle_edit_listing(self):
        selection = self.table_view.selectionModel().selectedRows()
        if not selection:
            return
            
        # Extract row from proxy model to source model
        source_index = self.proxy_model.mapToSource(selection[0])
        listing_obj = self.model._data[source_index.row()]
        
        # Hydrate the full contextual dataclass
        full_listing = self.listing_service.get_listing(listing_obj.id)
        if not full_listing:
            return
            
        dialog = EditListingDialog(full_listing, self.listing_service, self)
        if dialog.exec():
            # Dialog securely handles updates and database limits embedded
            self.load_store(self.active_store_id)

    def _handle_edit_store(self):
        if not self.active_store:
            return
            
        dialog = EditStoreDialog(self.active_store, self.store_service, self)
        if dialog.exec():
            # Dialog successfully validated + applied DB updates natively.
            self.load_store(self.active_store_id)

    def _handle_delete_listing(self):
        selection = self.table_view.selectionModel().selectedRows()
        if not selection:
            return
            
        source_index = self.proxy_model.mapToSource(selection[0])
        listing_obj = self.model._data[source_index.row()]
        
        dialog = DeleteListingDialog(listing_obj, self.listing_service, self)
        if dialog.exec():
            # Refresh silo counts bounding the destructive execution.
            self.load_store(self.active_store_id)

    def _handle_delete_store(self):
        if not self.active_store:
            return
            
        dialog = DeleteStoreDialog(self.active_store, self.store_service, self)
        if dialog.exec():
            # Nuke successful. Signal eject sequence to MainWindow.
            self.on_store_deleted.emit(self.active_store_id)
            
    def _handle_export_logo(self):
        if self.active_store and self.active_store.logo_path:
            save_path, _ = QFileDialog.getSaveFileName(self, "Export Store Logo", os.path.basename(self.active_store.logo_path))
            if save_path:
                StorageService.export_file(self.active_store.logo_path, save_path)

    def _handle_export_assets(self):
        selection = self.table_view.selectionModel().selectedRows()
        if not selection: return
        source_index = self.proxy_model.mapToSource(selection[0])
        listing_obj = self.model._data[source_index.row()]
        full = self.listing_service.get_listing(listing_obj.id)
        if full and full.files_path:
            save_path, _ = QFileDialog.getSaveFileName(self, "Export Listing Assets", os.path.basename(full.files_path))
            if save_path:
                StorageService.export_file(full.files_path, save_path)
