import sqlite3
from typing import List
from app.models.listing_media import ListingMedia

class ListingMediaRepository:
    def __init__(self, db_session_maker):
        self.db_session_maker = db_session_maker

    def _map_row(self, row: sqlite3.Row) -> ListingMedia:
        return ListingMedia(
            id=row["id"],
            listing_id=row["listing_id"],
            media_type=row["media_type"],
            internal_path=row["internal_path"],
            original_name=row["original_name"],
            sort_order=row["sort_order"],
            created_at=row["created_at"]
        )

    def get_by_listing(self, listing_id: int) -> List[ListingMedia]:
        query = "SELECT * FROM listing_media WHERE listing_id = ? ORDER BY sort_order ASC, id ASC"
        with self.db_session_maker() as conn:
            cursor = conn.execute(query, (listing_id,))
            return [self._map_row(r) for r in cursor.fetchall()]

    def create(self, media: ListingMedia) -> ListingMedia:
        query = """
            INSERT INTO listing_media (listing_id, media_type, internal_path, original_name, sort_order, created_at)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        """
        with self.db_session_maker() as conn:
            cursor = conn.execute(query, (
                media.listing_id,
                media.media_type,
                media.internal_path,
                media.original_name,
                media.sort_order
            ))
            media.id = cursor.lastrowid
            return media
            
    def delete(self, media_id: int):
        query = "DELETE FROM listing_media WHERE id = ?"
        with self.db_session_maker() as conn:
            conn.execute(query, (media_id,))
            
    def bulk_create(self, medias: List[ListingMedia]):
        query = """
            INSERT INTO listing_media (listing_id, media_type, internal_path, original_name, sort_order, created_at)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        """
        with self.db_session_maker() as conn:
            params = [(m.listing_id, m.media_type, m.internal_path, m.original_name, m.sort_order) for m in medias]
            conn.executemany(query, params)
