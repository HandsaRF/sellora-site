from abc import ABC, abstractmethod
from typing import BinaryIO, Optional

class StorageProvider(ABC):
    @abstractmethod
    def save_file(self, file_obj: BinaryIO, category: str, filename: str, entity_id: int) -> str:
        """Saves a file to storage and returns its string identifier/path"""
        pass

    @abstractmethod
    def get_file_url(self, file_path_or_id: str) -> Optional[str]:
        """Gets a public or signed URL to access the written file"""
        pass

    @abstractmethod
    def delete_file(self, file_path_or_id: str) -> bool:
        """Deletes a file from storage"""
        pass
