import os
import shutil
from pathlib import Path
from typing import BinaryIO, Optional
from .provider import StorageProvider

class LocalStorageAdapter(StorageProvider):
    def __init__(self, upload_dir: str = "data/uploads"):
        # Resolve path relative to project root
        project_root = Path(__file__).resolve().parent.parent.parent
        self.base_dir = project_root / upload_dir
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def save_file(self, file_obj: BinaryIO, category: str, filename: str, entity_id: int) -> str:
        # e.g., data/uploads/stores/1/logo.png
        target_dir = self.base_dir / category / str(entity_id)
        target_dir.mkdir(parents=True, exist_ok=True)
        
        target_path = target_dir / filename
        
        # In a real environment, read chunks or accept FastApi UploadFile
        with open(target_path, 'wb') as f:
            shutil.copyfileobj(file_obj, f)
            
        return target_path.relative_to(self.base_dir).as_posix()

    def get_file_url(self, file_path_or_id: str) -> Optional[str]:
        # Would typically return a local dev server endpoint
        # e.g., return f"/api/media/{file_path_or_id}"
        return f"/api/media/{file_path_or_id}"

    def delete_file(self, file_path_or_id: str) -> bool:
        target_path = self.base_dir / file_path_or_id
        if target_path.exists():
            target_path.unlink()
            return True
        return False
