import os
import shutil
from pathlib import Path
import subprocess

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
SELLORA_DATA_DIR = PROJECT_ROOT / "sellora_data"

class StorageService:
    """Manages explicit local directory paths avoiding global paths."""
    
    @staticmethod
    def _create_and_get_dir(subpath: str) -> Path:
        target = SELLORA_DATA_DIR / subpath
        target.mkdir(parents=True, exist_ok=True)
        return target

    @staticmethod
    def _import_file(source_path: str, destination_dir: Path) -> str:
        if not source_path or not os.path.exists(source_path):
            return None
            
        filename = os.path.basename(source_path)
        dest_path = destination_dir / filename
        
        # Guard against identical overwriting constraints throwing errors
        if Path(source_path).resolve() != dest_path.resolve():
            shutil.copy2(source_path, dest_path)
            
        return str(dest_path.resolve())

    @staticmethod
    def import_store_logo(store_id: int, source_path: str) -> str:
        if not source_path: return None
        dest_dir = StorageService._create_and_get_dir(f"stores/{store_id}/logo")
        return StorageService._import_file(source_path, dest_dir)
        
    @staticmethod
    def import_store_banner(store_id: int, source_path: str) -> str:
        if not source_path: return None
        dest_dir = StorageService._create_and_get_dir(f"stores/{store_id}/banner")
        return StorageService._import_file(source_path, dest_dir)
        
    @staticmethod
    def import_listing_photos(listing_id: int, source_paths: list[str]) -> list[str]:
        if not source_paths: return []
        dest_dir = StorageService._create_and_get_dir(f"listings/{listing_id}/images")
        results = []
        for path in source_paths:
            res = StorageService._import_file(path, dest_dir)
            if res:
                results.append(res)
        return results
        
    @staticmethod
    def import_listing_video(listing_id: int, source_path: str) -> str:
        if not source_path: return None
        dest_dir = StorageService._create_and_get_dir(f"listings/{listing_id}/video")
        return StorageService._import_file(source_path, dest_dir)
        
    @staticmethod
    def import_listing_assets(listing_id: int, source_path: str) -> str:
        if not source_path: return None
        dest_dir = StorageService._create_and_get_dir(f"listings/{listing_id}/assets")
        return StorageService._import_file(source_path, dest_dir)
        
    @staticmethod
    def cleanup_store_media(store_id: int):
        target = SELLORA_DATA_DIR / f"stores/{store_id}"
        if target.exists():
            shutil.rmtree(target, ignore_errors=True)

    @staticmethod
    def cleanup_listing_media(listing_id: int):
        target = SELLORA_DATA_DIR / f"listings/{listing_id}"
        if target.exists():
            shutil.rmtree(target, ignore_errors=True)
            
    @staticmethod
    def export_file(internal_path: str, external_path: str):
        if internal_path and os.path.exists(internal_path) and external_path:
            shutil.copy2(internal_path, external_path)
            
    @staticmethod
    def reveal_in_explorer(internal_path: str):
        if not internal_path or not os.path.exists(internal_path):
            return
            
        if os.name == 'nt':
            subprocess.Popen(f'explorer /select,"{os.path.normpath(internal_path)}"')
        else:
            try:
                subprocess.Popen(['open', '-R', internal_path])
            except Exception:
                pass
