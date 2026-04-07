from typing import List, Optional
import os
from app.models.store import Store
import sqlite3
from app.repositories.store_repository import StoreRepository
from app.services.storage_service import StorageService

class StoreService:
    def __init__(self, store_repo: StoreRepository):
        self.store_repo = store_repo

    def get_stores_overview(self) -> List[Store]:
        """Returns all stores populated with their derived listing counts."""
        return self.store_repo.get_all_with_counts()
        
    def get_store(self, store_id: int) -> Optional[Store]:
        """Returns a single store by ID with loaded counts."""
        return self.store_repo.get_by_id(store_id)

    def create_store(self, store: Store) -> Store:
        """Validates and persists a new store, ensuring automation rules apply."""
        if not store.store_code or not store.store_code.strip():
            # Generate a simple 3 letter code from initials
            words = store.store_name.split()
            if len(words) >= 3:
                code = "".join(w[0] for w in words[:3]).upper()
            else:
                code = store.store_name[:3].upper()
            store.store_code = code

        try:
            # 1. Create the database record
            created = self.store_repo.create(store)
            
            # 2. Storage Mapping
            needs_update = False
            if store.logo_path and os.path.exists(store.logo_path):
                created.logo_path = StorageService.import_store_logo(created.id, store.logo_path)
                needs_update = True
            if store.banner_path and os.path.exists(store.banner_path):
                created.banner_path = StorageService.import_store_banner(created.id, store.banner_path)
                needs_update = True
                
            if needs_update:
                return self.store_repo.update(created)
                
            return created
        except sqlite3.IntegrityError as e:
            if "UNIQUE constraint failed" in str(e):
                raise ValueError("A store with this Code already exists. Please provide a unique Store Code.")
            raise e

    def update_store(self, store: Store) -> Store:
        """Validates and persists updates to an existing store."""
        if not store.store_code or not store.store_code.strip():
            words = store.store_name.split()
            if len(words) >= 3:
                code = "".join(w[0] for w in words[:3]).upper()
            else:
                code = store.store_name[:3].upper()
            store.store_code = code

        try:
            if store.logo_path and os.path.exists(store.logo_path):
                store.logo_path = StorageService.import_store_logo(store.id, store.logo_path)
            if store.banner_path and os.path.exists(store.banner_path):
                store.banner_path = StorageService.import_store_banner(store.id, store.banner_path)
                
            return self.store_repo.update(store)
        except sqlite3.IntegrityError as e:
            if "UNIQUE constraint failed" in str(e):
                raise ValueError("A store with this Code already exists. Please provide a unique Store Code.")
            raise e

    def delete_store(self, store_id: int, input_name: str):
        """Validates destructive rules before passing to repository."""
        store = self.store_repo.get_by_id(store_id)
        if not store:
            raise ValueError("Store context not found.")
        # Exact matching enforced in Service exclusively
        if store.store_name != input_name:
            raise ValueError("Store name does not match. Deletion aborted.")
            
        # Clean data schema
        self.store_repo.delete(store_id)
        # Clean local storage mapping
        StorageService.cleanup_store_media(store_id)
