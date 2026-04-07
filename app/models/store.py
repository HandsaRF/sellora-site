from dataclasses import dataclass
from typing import Optional

@dataclass
class Store:
    store_name: str
    owner_name: str
    status: str
    store_code: str
    id: Optional[int] = None
    open_date: Optional[str] = None
    niche: Optional[str] = None
    media_path: Optional[str] = None
    logo_path: Optional[str] = None
    banner_path: Optional[str] = None
    url: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    # Derived UI fields not persisted directly
    total_listings: int = 0
    live_listings: int = 0
