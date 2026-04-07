from PySide6.QtCore import QAbstractTableModel, Qt, QModelIndex
from typing import List
from app.models.listing import Listing

class ListingTableModel(QAbstractTableModel):
    def __init__(self, listings: List[Listing] = None):
        super().__init__()
        self._data = listings or []
        self._headers = ["Product Name", "Store", "Status", "SKU", "Upload Date"]

    def update_data(self, new_data: List[Listing]):
        self.beginResetModel()
        self._data = new_data
        self.endResetModel()

    def rowCount(self, parent=QModelIndex()) -> int:
        return len(self._data)

    def columnCount(self, parent=QModelIndex()) -> int:
        return len(self._headers)

    def data(self, index: QModelIndex, role: int = Qt.ItemDataRole.DisplayRole):
        if not index.isValid():
            return None
            
        listing = self._data[index.row()]
        col = index.column()

        if role == Qt.ItemDataRole.DisplayRole:
            if col == 0:
                return listing.product_name
            elif col == 1:
                return listing.store_name
            elif col == 2:
                return listing.status
            elif col == 3:
                return listing.sku or "N/A"
            elif col == 4:
                return listing.upload_date or "Not Uploaded"

        return None

    def headerData(self, section: int, orientation: Qt.Orientation, role: int = Qt.ItemDataRole.DisplayRole):
        if role == Qt.ItemDataRole.DisplayRole:
            if orientation == Qt.Orientation.Horizontal:
                if 0 <= section < len(self._headers):
                    return self._headers[section]
        return None
