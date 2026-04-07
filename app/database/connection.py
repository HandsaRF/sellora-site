import sqlite3
from pathlib import Path
from contextlib import contextmanager

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
DB_PATH = PROJECT_ROOT / "sellora.sqlite"

def get_connection():
    # Enforces foreign keys automatically
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

@contextmanager
def db_session():
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

from app.core.config import StoreStatus, ListingStatus

def bootstrap_db():
    store_statuses = f"'{StoreStatus.NOT_STARTED}', '{StoreStatus.IN_PROGRESS}', '{StoreStatus.RUNNING}', '{StoreStatus.BLOCKED}', '{StoreStatus.PAUSED}'"
    listing_statuses = f"'{ListingStatus.DRAFT}', '{ListingStatus.READY_TO_UPLOAD}', '{ListingStatus.UPLOADED}', '{ListingStatus.LIVE}', '{ListingStatus.REMOVED}', '{ListingStatus.BLOCKED}'"

    schema = f"""
    CREATE TABLE IF NOT EXISTS stores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        store_name TEXT NOT NULL,
        owner_name TEXT NOT NULL,
        open_date TEXT,
        status TEXT NOT NULL,
        niche TEXT,
        store_code TEXT UNIQUE NOT NULL,
        media_path TEXT,
        url TEXT,
        notes TEXT,
        created_at DATETIME,
        updated_at DATETIME,
        CHECK(status IN ({store_statuses}))
    );

    CREATE TABLE IF NOT EXISTS listings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        store_id INTEGER NOT NULL,
        product_name TEXT NOT NULL,
        upload_date TEXT,
        etsy_title TEXT,
        description TEXT,
        tags TEXT,
        files_path TEXT,
        status TEXT NOT NULL,
        details TEXT,
        remove_date TEXT,
        removal_reason TEXT,
        url TEXT,
        supplier_link TEXT,
        main_image_path TEXT,
        sku TEXT,
        last_updated DATETIME,
        created_at DATETIME,
        FOREIGN KEY(store_id) REFERENCES stores(id) ON DELETE CASCADE,
        CHECK(status IN ({listing_statuses}))
    );
    """
    with db_session() as conn:
        # Check if we need to rebuild listings for M11 status migration
        cursor = conn.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='listings'")
        row = cursor.fetchone()
        if row and ('Researching' in row['sql'] or 'Preparing' in row['sql']):
            # Execute physical migration swapping CHECK constraints
            conn.executescript(f"""
                PRAGMA foreign_keys=off;
                DROP TABLE IF EXISTS listings_new;
                CREATE TABLE listings_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    store_id INTEGER NOT NULL,
                    product_name TEXT NOT NULL,
                    upload_date TEXT,
                    etsy_title TEXT,
                    description TEXT,
                    tags TEXT,
                    files_path TEXT,
                    status TEXT NOT NULL,
                    details TEXT,
                    remove_date TEXT,
                    removal_reason TEXT,
                    url TEXT,
                    supplier_link TEXT,
                    main_image_path TEXT,
                    sku TEXT,
                    last_updated DATETIME,
                    created_at DATETIME,
                    FOREIGN KEY(store_id) REFERENCES stores(id) ON DELETE CASCADE,
                    CHECK(status IN ({listing_statuses}))
                );
                
                INSERT INTO listings_new 
                SELECT id, store_id, product_name, upload_date, etsy_title, description, tags, files_path,
                       CASE WHEN status IN ('Researching', 'Preparing') THEN 'Draft' ELSE status END as status,
                       details, remove_date, removal_reason, url, supplier_link, main_image_path, sku, last_updated, created_at
                FROM listings;
                
                DROP TABLE listings;
                ALTER TABLE listings_new RENAME TO listings;
                PRAGMA foreign_keys=on;
            """)
            
        conn.executescript(schema)
        
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS listing_media (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                listing_id INTEGER NOT NULL,
                media_type TEXT NOT NULL CHECK(media_type IN ('image', 'video')),
                internal_path TEXT NOT NULL,
                original_name TEXT,
                sort_order INTEGER DEFAULT 0,
                created_at DATETIME,
                FOREIGN KEY(listing_id) REFERENCES listings(id) ON DELETE CASCADE
            );
        """)
        
        # M12 legacy main_image_path migration
        cursor = conn.execute("SELECT count(*) as count FROM listing_media")
        row = cursor.fetchone()
        if row and row["count"] == 0:
            col_cursor = conn.execute("PRAGMA table_info('listings')")
            cols = [col['name'] for col in col_cursor.fetchall()]
            if 'main_image_path' in cols:
                conn.executescript("""
                    INSERT INTO listing_media (listing_id, media_type, internal_path, original_name, sort_order, created_at)
                    SELECT id, 'image', main_image_path, main_image_path, 0, CURRENT_TIMESTAMP
                    FROM listings 
                    WHERE main_image_path IS NOT NULL AND main_image_path != '';
                """)
        
        # Migration for Store Media Fields (Preserving legacy instances)
        cursor = conn.execute("PRAGMA table_info('stores')")
        columns = [row['name'] for row in cursor.fetchall()]
        if 'logo_path' not in columns:
            conn.execute("ALTER TABLE stores ADD COLUMN logo_path TEXT")
        if 'banner_path' not in columns:
            conn.execute("ALTER TABLE stores ADD COLUMN banner_path TEXT")
