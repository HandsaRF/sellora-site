from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import sys
from pathlib import Path

from database import ensure_web_tables

# Add project root to sys.path to reuse app database code later
project_root = Path(__file__).resolve().parent.parent
sys.path.append(str(project_root))

# Absolute imports based on being run from the Sellora root or inside web-api
from routers import stores, dashboard

app = FastAPI(title="Sellora Web API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For local testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(stores.router)
app.include_router(dashboard.router)

uploads_dir = project_root / "data" / "uploads"
uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=str(uploads_dir)), name="static")


@app.on_event("startup")
def startup():
    ensure_web_tables()

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Sellora Web API Foundation started."}
