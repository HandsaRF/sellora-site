from datetime import datetime
from typing import List, Optional
from app.database.connection import db_session
from app.models.store import Store
from app.core.config import ListingStatus

class StoreRepository:
    def create(self, store: Store) -> Store:
        now = datetime.now().isoformat()
        query = """
            INSERT INTO stores (store_name, owner_name, open_date, status, niche, store_code, media_path, logo_path, banner_path, url, notes, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        with db_session() as conn:
            cursor = conn.execute(query, (
                store.store_name, store.owner_name, store.open_date, store.status,
                store.niche, store.store_code, store.media_path, store.logo_path, store.banner_path, store.url, store.notes,
                now, now
            ))
            store.id = cursor.lastrowid
            store.created_at = now
            store.updated_at = now
        return store

    def get_all_with_counts(self) -> List[Store]:
        query = """
            SELECT s.*, 
                   (SELECT COUNT(*) FROM listings l WHERE l.store_id = s.id) as total_listings,
                   (SELECT COUNT(*) FROM listings l WHERE l.store_id = s.id AND l.status = ?) as live_listings
            FROM stores s
        """
        stores = []
        with db_session() as conn:
            cursor = conn.execute(query, (ListingStatus.LIVE,))
            for row in cursor.fetchall():
                stores.append(self._row_to_store(row))
        return stores

    def get_by_id(self, store_id: int) -> Optional[Store]:
        query = """
            SELECT s.*, 
                   (SELECT COUNT(*) FROM listings l WHERE l.store_id = s.id) as total_listings,
                   (SELECT COUNT(*) FROM listings l WHERE l.store_id = s.id AND l.status = ?) as live_listings
            FROM stores s
            WHERE s.id = ?
        """
        with db_session() as conn:
            cursor = conn.execute(query, (ListingStatus.LIVE, store_id))
            row = cursor.fetchone()
            if row:
                return self._row_to_store(row)
        return None

    def update(self, store: Store) -> Store:
        now = datetime.now().isoformat()
        query = """
            UPDATE stores
            SET store_name = ?, owner_name = ?, status = ?, niche = ?, store_code = ?, logo_path = ?, banner_path = ?, updated_at = ?
            WHERE id = ?
        """
        with db_session() as conn:
            conn.execute(query, (
                store.store_name, store.owner_name, store.status, store.niche, store.store_code, store.logo_path, store.banner_path, now, store.id
            ))
            store.updated_at = now
        return store

    def delete(self, store_id: int):
        query = "DELETE FROM stores WHERE id = ?"
        with db_session() as conn:
            conn.execute(query, (store_id,))

    def _row_to_store(self, row: dict) -> Store:
        return Store(
            id=row['id'],
            store_name=row['store_name'],
            owner_name=row['owner_name'],
            status=row['status'],
            store_code=row['store_code'],
            open_date=row['open_date'],
            niche=row['niche'],
            media_path=row['media_path'],
            logo_path=row['logo_path'] if 'logo_path' in row.keys() else None,
            banner_path=row['banner_path'] if 'banner_path' in row.keys() else None,
            url=row['url'],
            notes=row['notes'],
            created_at=row['created_at'],
            updated_at=row['updated_at'],
            total_listings=row['total_listings'] if 'total_listings' in row.keys() else 0,
            live_listings=row['live_listings'] if 'live_listings' in row.keys() else 0
        )
