from dataclasses import dataclass
from typing import Optional

@dataclass
class ListingMedia:
    listing_id: int
    media_type: str  # 'image' or 'video'
    internal_path: str
    original_name: Optional[str] = None
    sort_order: int = 0
    id: Optional[int] = None
    created_at: Optional[str] = None
