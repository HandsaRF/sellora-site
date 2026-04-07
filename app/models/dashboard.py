from dataclasses import dataclass, field
from typing import List, Dict

@dataclass
class DashboardSummary:
    total_stores: int = 0
    running_stores: int = 0
    blocked_stores: int = 0
    total_listings: int = 0
    live_listings: int = 0
    # Store overview contains dicts like: {"store_name": "x", "status": "y", "total_listings": 10, "live_listings": 5}
    store_overviews: List[Dict] = field(default_factory=list)
    # Recent updates contains dicts like: {"type": "store" | "listing", "name": "x", "status": "y", "updated_at": "date"}
    recent_updates: List[Dict] = field(default_factory=list)
