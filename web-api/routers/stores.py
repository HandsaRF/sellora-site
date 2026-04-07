from datetime import datetime
import re

from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel

from database import db_session
from storage.local_adapter import LocalStorageAdapter

storage_adapter = LocalStorageAdapter()

router = APIRouter(prefix="/stores", tags=["stores"])


class StorePayload(BaseModel):
    store_name: str
    owner_name: str
    status: str = "Not Started"
    niche: str | None = None
    url: str | None = None
    notes: str | None = None


class ListingPayload(BaseModel):
    product_name: str
    status: str = "Draft"
    upload_date: str | None = None
    sku: str | None = None


def _clean_optional(value: str | None) -> str | None:
    if value is None:
        return None
    trimmed = value.strip()
    return trimmed or None


def _serialize_store(row):
    store = dict(row)
    store.pop("store_code", None)
    return store


def _serialize_listing(row):
    return dict(row)


def _generate_hidden_store_code(conn, store_name: str) -> str:
    words = [re.sub(r"[^A-Za-z0-9]", "", word).upper() for word in store_name.split()]
    words = [word for word in words if word]

    if len(words) >= 2:
        base = "".join(word[0] for word in words[:3])
    elif words:
        base = words[0][:3]
    else:
        base = "STR"

    base = (base or "STR").upper()
    candidate = base
    suffix = 1

    while conn.execute("SELECT 1 FROM stores WHERE store_code = ?", (candidate,)).fetchone():
        candidate = f"{base[:6]}{suffix}"
        suffix += 1

    return candidate


def _validate_store_payload(payload: StorePayload):
    store_name = payload.store_name.strip()
    owner_name = payload.owner_name.strip()

    if not store_name:
        raise HTTPException(status_code=400, detail="Store name is required.")
    if not owner_name:
        raise HTTPException(status_code=400, detail="Owner name is required.")

    return {
        "store_name": store_name,
        "owner_name": owner_name,
        "status": payload.status,
        "niche": _clean_optional(payload.niche),
        "url": _clean_optional(payload.url),
        "notes": _clean_optional(payload.notes),
    }


def _validate_listing_payload(payload: ListingPayload):
    product_name = payload.product_name.strip()
    if not product_name:
        raise HTTPException(status_code=400, detail="Product name is required.")

    upload_date = _clean_optional(payload.upload_date)
    if payload.status == "Uploaded" and not upload_date:
        upload_date = datetime.now().strftime("%Y-%m-%d")

    return {
        "product_name": product_name,
        "status": payload.status,
        "upload_date": upload_date,
        "sku": _clean_optional(payload.sku),
    }


@router.get("/")
def get_stores():
    with db_session() as conn:
        query = """
            SELECT s.*, 
                   (SELECT COUNT(*) FROM listings l WHERE l.store_id = s.id) as total_listings,
                   (SELECT COUNT(*) FROM listings l WHERE l.store_id = s.id AND l.status = 'Live') as live_listings
            FROM stores s
            ORDER BY s.updated_at DESC, s.store_name ASC
        """
        cursor = conn.execute(query)
        return [_serialize_store(row) for row in cursor.fetchall()]


@router.post("/")
def create_store(payload: StorePayload):
    values = _validate_store_payload(payload)
    now = datetime.now().isoformat()

    with db_session() as conn:
        store_code = _generate_hidden_store_code(conn, values["store_name"])
        cursor = conn.execute(
            """
            INSERT INTO stores (
                store_name, owner_name, open_date, status, niche, store_code,
                media_path, logo_path, banner_path, url, notes, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                values["store_name"],
                values["owner_name"],
                None,
                values["status"],
                values["niche"],
                store_code,
                None,
                None,
                None,
                values["url"],
                values["notes"],
                now,
                now,
            ),
        )
        store_id = cursor.lastrowid

    return get_store(store_id)


@router.get("/{store_id}")
def get_store(store_id: int):
    with db_session() as conn:
        cursor = conn.execute(
            """
            SELECT s.*,
                   (SELECT COUNT(*) FROM listings l WHERE l.store_id = s.id) as total_listings,
                   (SELECT COUNT(*) FROM listings l WHERE l.store_id = s.id AND l.status = 'Live') as live_listings
            FROM stores s
            WHERE s.id = ?
            """,
            (store_id,),
        )
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Store not found")
        return _serialize_store(row)


@router.put("/{store_id}")
def update_store(store_id: int, payload: StorePayload):
    values = _validate_store_payload(payload)
    now = datetime.now().isoformat()

    with db_session() as conn:
        cursor = conn.execute("SELECT id FROM stores WHERE id = ?", (store_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Store not found")

        conn.execute(
            """
            UPDATE stores
            SET store_name = ?, owner_name = ?, status = ?, niche = ?, url = ?, notes = ?, updated_at = ?
            WHERE id = ?
            """,
            (
                values["store_name"],
                values["owner_name"],
                values["status"],
                values["niche"],
                values["url"],
                values["notes"],
                now,
                store_id,
            ),
        )

    return get_store(store_id)


@router.get("/{store_id}/listings")
def get_store_listings(store_id: int):
    with db_session() as conn:
        cursor = conn.execute(
            """
            SELECT *
            FROM listings
            WHERE store_id = ?
            ORDER BY
                CASE
                    WHEN status = 'Blocked' THEN 0
                    WHEN status = 'Ready to Upload' THEN 1
                    WHEN status = 'Uploaded' THEN 2
                    WHEN status = 'Live' THEN 3
                    ELSE 4
                END,
                COALESCE(last_updated, created_at, upload_date) DESC,
                product_name ASC
            """,
            (store_id,),
        )
        return [_serialize_listing(row) for row in cursor.fetchall()]


@router.post("/{store_id}/listings")
def create_listing(store_id: int, payload: ListingPayload):
    values = _validate_listing_payload(payload)
    now = datetime.now().isoformat()

    with db_session() as conn:
        store_cursor = conn.execute("SELECT id FROM stores WHERE id = ?", (store_id,))
        if not store_cursor.fetchone():
            raise HTTPException(status_code=404, detail="Store not found")

        cursor = conn.execute(
            """
            INSERT INTO listings (
                store_id, product_name, upload_date, etsy_title, description, tags,
                files_path, status, details, remove_date, removal_reason, url,
                supplier_link, main_image_path, sku, last_updated, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                store_id,
                values["product_name"],
                values["upload_date"],
                None,
                None,
                None,
                None,
                values["status"],
                None,
                None,
                None,
                None,
                None,
                None,
                values["sku"],
                now,
                now,
            ),
        )
        listing_id = cursor.lastrowid

        listing_row = conn.execute(
            "SELECT * FROM listings WHERE id = ? AND store_id = ?",
            (listing_id, store_id),
        ).fetchone()

    return _serialize_listing(listing_row)


@router.put("/{store_id}/listings/{listing_id}")
def update_listing(store_id: int, listing_id: int, payload: ListingPayload):
    values = _validate_listing_payload(payload)
    now = datetime.now().isoformat()

    with db_session() as conn:
        row = conn.execute(
            "SELECT id FROM listings WHERE id = ? AND store_id = ?",
            (listing_id, store_id),
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Listing not found")

        conn.execute(
            """
            UPDATE listings
            SET product_name = ?, status = ?, upload_date = ?, sku = ?, last_updated = ?
            WHERE id = ? AND store_id = ?
            """,
            (
                values["product_name"],
                values["status"],
                values["upload_date"],
                values["sku"],
                now,
                listing_id,
                store_id,
            ),
        )

        updated_row = conn.execute(
            "SELECT * FROM listings WHERE id = ? AND store_id = ?",
            (listing_id, store_id),
        ).fetchone()

    return _serialize_listing(updated_row)


@router.post("/{store_id}/upload-logo")
async def upload_store_logo(store_id: int, file: UploadFile = File(...)):
    with db_session() as conn:
        cursor = conn.execute("SELECT id FROM stores WHERE id = ?", (store_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Store not found")

    saved_path = storage_adapter.save_file(file.file, "branding", file.filename, store_id)

    with db_session() as conn:
        conn.execute("UPDATE stores SET logo_path = ?, updated_at = ? WHERE id = ?", (saved_path, datetime.now().isoformat(), store_id))

    return {"message": "success", "file_path": saved_path}
