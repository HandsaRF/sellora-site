from dataclasses import dataclass
from typing import Optional

@dataclass
class Listing:
    store_id: int
    product_name: str
    status: str
    store_name: Optional[str] = None  # Joined field for UX
    id: Optional[int] = None
    upload_date: Optional[str] = None
    etsy_title: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[str] = None
    files_path: Optional[str] = None
    details: Optional[str] = None
    remove_date: Optional[str] = None
    removal_reason: Optional[str] = None
    url: Optional[str] = None
    supplier_link: Optional[str] = None
    main_image_path: Optional[str] = None
    sku: Optional[str] = None
    last_updated: Optional[str] = None
    created_at: Optional[str] = None
