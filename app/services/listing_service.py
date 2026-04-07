from typing import List, Optional
import os
from app.models.listing import Listing
from app.repositories.listing_repository import ListingRepository
from app.models.listing_media import ListingMedia
from app.repositories.listing_media_repository import ListingMediaRepository
from app.services.storage_service import StorageService

class ListingService:
    def __init__(self, listing_repo: ListingRepository, media_repo: ListingMediaRepository):
        self.listing_repo = listing_repo
        self.media_repo = media_repo

    def create_listing(self, listing: Listing) -> Listing:
        """Adds a new listing tied to a store context."""
        if listing.status == "Uploaded" and not listing.upload_date:
            from datetime import datetime
            listing.upload_date = datetime.now().strftime('%Y-%m-%d')
            
        created = self.listing_repo.create(listing)
        
        needs_update = False
        if listing.files_path and os.path.exists(listing.files_path):
            created.files_path = StorageService.import_listing_assets(created.id, listing.files_path)
            needs_update = True
            
        if needs_update:
            return self.listing_repo.update(created)
            
        return created

    def update_listing(self, listing: Listing) -> Listing:
        """Updates an existing listing context natively mapping to its ID."""
        if listing.status == "Uploaded" and not listing.upload_date:
            from datetime import datetime
            listing.upload_date = datetime.now().strftime('%Y-%m-%d')
            
        if listing.files_path and os.path.exists(listing.files_path):
            listing.files_path = StorageService.import_listing_assets(listing.id, listing.files_path)
            
        return self.listing_repo.update(listing)

    def get_listing(self, listing_id: int) -> Optional[Listing]:
        """Fetches a single Listing strictly bounded by ID."""
        return self.listing_repo.get_by_id(listing_id)

    def delete_listing(self, listing_id: int):
        """Removes a listing via hard deletion and cleans explicitly mapped folders."""
        self.listing_repo.delete(listing_id)
        StorageService.cleanup_listing_media(listing_id)

    def get_all_for_store(self, store_id: int) -> List[Listing]:
        """Returns all listings for a specific store."""
        return self.listing_repo.get_by_store(store_id)
        
    def get_all_listings(self) -> List[Listing]:
        """Returns all listings globally for the backup master view."""
        return self.listing_repo.get_all()
        
    def get_media_for_listing(self, listing_id: int) -> List[ListingMedia]:
        return self.media_repo.get_by_listing(listing_id)
        
    def add_media_to_listing(self, listing_id: int, image_paths: List[str] = None, video_path: str = None):
        existing = self.media_repo.get_by_listing(listing_id)
        img_count = sum(1 for m in existing if m.media_type == 'image')
        vid_count = sum(1 for m in existing if m.media_type == 'video')
        
        image_paths = image_paths or []
        if image_paths and len(image_paths) + img_count > 20:
            raise ValueError(f"Listings support a maximum of 20 photos. Tried to add {len(image_paths)}, but already have {img_count}.")
            
        if video_path and vid_count >= 1:
            raise ValueError("Listings support a maximum of 1 video. A video is already attached.")
            
        if image_paths:
            internal_paths = StorageService.import_listing_photos(listing_id, image_paths)
            medias = []
            for intern in internal_paths:
                orig = os.path.basename(intern)
                # Ensure they simply append sorting defaults correctly
                medias.append(ListingMedia(listing_id=listing_id, media_type='image', internal_path=intern, original_name=orig))
            if medias:
                self.media_repo.bulk_create(medias)
                
        if video_path:
            intern = StorageService.import_listing_video(listing_id, video_path)
            if intern:
                self.media_repo.create(ListingMedia(listing_id=listing_id, media_type='video', internal_path=intern, original_name=os.path.basename(intern)))
