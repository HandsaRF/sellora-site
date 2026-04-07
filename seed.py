import os
from pathlib import Path
from app.database.connection import bootstrap_db
from app.models.store import Store
from app.models.listing import Listing
from app.repositories.store_repository import StoreRepository
from app.repositories.listing_repository import ListingRepository
from app.core.config import StoreStatus, ListingStatus

def seed_database():
    print("Bootstrapping database schema...")
    bootstrap_db()

    store_repo = StoreRepository()
    listing_repo = ListingRepository()

    print("Inserting seed stores...")
    store1 = store_repo.create(Store(
        store_name="Building Blocks Store", 
        owner_name="Liam", 
        status=StoreStatus.RUNNING, 
        store_code="BBS", 
        niche="Building Blocks"
    ))
    
    store2 = store_repo.create(Store(
        store_name="Matcha Kits Store", 
        owner_name="Liam", 
        status=StoreStatus.IN_PROGRESS, 
        store_code="MKS", 
        niche="Matcha Kits"
    ))
    
    store3 = store_repo.create(Store(
        store_name="Wooden Botanical Decor Store", 
        owner_name="Liam", 
        status=StoreStatus.NOT_STARTED, 
        store_code="WBD", 
        niche="Wooden Botanical Decor"
    ))

    print("Inserting seed listings...")
    listing_repo.create(Listing(
        store_id=store1.id, 
        product_name="Castle Block Set", 
        status=ListingStatus.LIVE,
        etsy_title="Giant Castle Block Set for Kids",
        sku="BBS-CST-001"
    ))
    listing_repo.create(Listing(
        store_id=store1.id, 
        product_name="Pirate Ship Block Kit", 
        status=ListingStatus.READY_TO_UPLOAD,
        sku="BBS-PIR-001"
    ))
    
    listing_repo.create(Listing(
        store_id=store2.id, 
        product_name="Ceramic Matcha Bowl Kit", 
        status=ListingStatus.LIVE,
        sku="MKS-BOWL-001"
    ))

    print("Seed data inserted successfully!")

if __name__ == "__main__":
    db_file = Path("sellora.sqlite")
    if db_file.exists():
        os.remove(db_file)
        print("Removed old database.")
    
    seed_database()
