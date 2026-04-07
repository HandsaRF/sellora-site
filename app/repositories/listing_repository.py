from datetime import datetime
from typing import List, Optional
from app.database.connection import db_session
from app.models.listing import Listing

class ListingRepository:
    def create(self, listing: Listing) -> Listing:
        now = datetime.now().isoformat()
        query = """
            INSERT INTO listings (
                store_id, product_name, upload_date, etsy_title, description, tags, 
                files_path, status, details, remove_date, removal_reason, url, 
                supplier_link, main_image_path, sku, last_updated, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        with db_session() as conn:
            cursor = conn.execute(query, (
                listing.store_id, listing.product_name, listing.upload_date,
                listing.etsy_title, listing.description, listing.tags, listing.files_path,
                listing.status, listing.details, listing.remove_date, listing.removal_reason,
                listing.url, listing.supplier_link, listing.main_image_path, listing.sku,
                now, now
            ))
            listing.id = cursor.lastrowid
            listing.created_at = now
            listing.last_updated = now
        return listing

    def get_by_store(self, store_id: int) -> List[Listing]:
        query = """
            SELECT l.*, s.store_name 
            FROM listings l
            JOIN stores s ON l.store_id = s.id
            WHERE l.store_id = ?
        """
        listings = []
        with db_session() as conn:
            cursor = conn.execute(query, (store_id,))
            for row in cursor.fetchall():
                listings.append(self._row_to_listing(row))
        return listings

    def get_all(self) -> List[Listing]:
        query = """
            SELECT l.*, s.store_name 
            FROM listings l
            JOIN stores s ON l.store_id = s.id
        """
        listings = []
        with db_session() as conn:
            cursor = conn.execute(query)
            for row in cursor.fetchall():
                listings.append(self._row_to_listing(row))
        return listings

    def get_by_id(self, listing_id: int) -> Optional[Listing]:
        query = """
            SELECT l.*, s.store_name 
            FROM listings l
            JOIN stores s ON l.store_id = s.id
            WHERE l.id = ?
        """
        with db_session() as conn:
            cursor = conn.execute(query, (listing_id,))
            row = cursor.fetchone()
            if row:
                return self._row_to_listing(row)
        return None

    def update(self, listing: Listing) -> Listing:
        now = datetime.now().isoformat()
        query = """
            UPDATE listings
            SET product_name = ?, status = ?, sku = ?, upload_date = ?, main_image_path = ?, files_path = ?, last_updated = ?
            WHERE id = ?
        """
        with db_session() as conn:
            conn.execute(query, (
                listing.product_name, listing.status, listing.sku, listing.upload_date, 
                listing.main_image_path, listing.files_path, now, listing.id
            ))
            listing.last_updated = now
        return listing

    def delete(self, listing_id: int):
        query = "DELETE FROM listings WHERE id = ?"
        with db_session() as conn:
            conn.execute(query, (listing_id,))

    def _row_to_listing(self, row: dict) -> Listing:
        return Listing(
            id=row['id'],
            store_id=row['store_id'],
            store_name=row['store_name'] if 'store_name' in row.keys() else None,
            product_name=row['product_name'],
            status=row['status'],
            upload_date=row['upload_date'],
            etsy_title=row['etsy_title'],
            description=row['description'],
            tags=row['tags'],
            files_path=row['files_path'],
            details=row['details'],
            remove_date=row['remove_date'],
            removal_reason=row['removal_reason'],
            url=row['url'],
            supplier_link=row['supplier_link'],
            main_image_path=row['main_image_path'],
            sku=row['sku'],
            last_updated=row['last_updated'],
            created_at=row['created_at']
        )
