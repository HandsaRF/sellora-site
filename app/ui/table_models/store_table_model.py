from PySide6.QtCore import QAbstractTableModel, Qt, QModelIndex
from typing import List
from app.models.store import Store

class StoreTableModel(QAbstractTableModel):
    def __init__(self, stores: List[Store] = None):
        super().__init__()
        self._data = stores or []
        self._headers = ["Store Name", "Owner", "Status", "Total Listings", "Live Listings"]

    def update_data(self, new_data: List[Store]):
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
            
        store = self._data[index.row()]
        col = index.column()

        if role == Qt.ItemDataRole.DisplayRole:
            if col == 0:
                return store.store_name
            elif col == 1:
                return store.owner_name
            elif col == 2:
                return store.status
            elif col == 3:
                return str(store.total_listings)
            elif col == 4:
                return str(store.live_listings)

        return None

    def headerData(self, section: int, orientation: Qt.Orientation, role: int = Qt.ItemDataRole.DisplayRole):
        if role == Qt.ItemDataRole.DisplayRole:
            if orientation == Qt.Orientation.Horizontal:
                if 0 <= section < len(self._headers):
                    return self._headers[section]
        return None
