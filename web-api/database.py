import sqlite3
from pathlib import Path
from contextlib import contextmanager

# Rely on the primary database initialization in `app`
PROJECT_ROOT = Path(__file__).resolve().parent.parent
DB_PATH = PROJECT_ROOT / "sellora.sqlite"

def get_connection():
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


def ensure_web_tables():
    with db_session() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS purchase_transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                store_id INTEGER NOT NULL,
                matched_listing_id INTEGER,
                source_type TEXT NOT NULL CHECK(source_type IN ('dummy', 'gmail')),
                transaction_id TEXT NOT NULL,
                listing_title TEXT NOT NULL,
                style TEXT,
                quantity INTEGER NOT NULL DEFAULT 1,
                subtotal_usd REAL NOT NULL,
                product_cost_snapshot_usd REAL,
                supplier_shipping_cost_usd REAL,
                estimated_fees_usd REAL,
                extra_cost_usd REAL,
                estimated_profit_usd REAL,
                confidence_state TEXT NOT NULL,
                event_date TEXT,
                review_notes TEXT,
                created_at DATETIME,
                updated_at DATETIME,
                FOREIGN KEY(store_id) REFERENCES stores(id) ON DELETE CASCADE,
                FOREIGN KEY(matched_listing_id) REFERENCES listings(id) ON DELETE SET NULL,
                UNIQUE(store_id, transaction_id)
            );

            CREATE INDEX IF NOT EXISTS idx_purchase_transactions_store
            ON purchase_transactions(store_id);

            CREATE INDEX IF NOT EXISTS idx_purchase_transactions_listing
            ON purchase_transactions(matched_listing_id);
            """
        )
