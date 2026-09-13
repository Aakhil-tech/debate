
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager

from app.routers import auth, credits, receipts, fumble, sparring, war_room
from app.middleware.rate_limit import RateLimitMiddleware
from app.config import settings
from app.db import repo


@asynccontextmanager
async def lifespan(app: FastAPI):
    await repo().connect()
    print(f"🚀 Debate & Win API starting — env={settings.ENV} db_backend={settings.DB_BACKEND}")
    yield
    await repo().disconnect()
    print("🛑 Debate & Win API shutting down")


app = FastAPI(
    title="Debate & Win API",
    description="Tactical AI co-pilot for text conversations — Forensic Receipt Analysis, Fumble Radar, Live Sparring",
    version="3.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(RateLimitMiddleware)

app.include_router(auth.router,      prefix="/auth",      tags=["Auth"])
app.include_router(credits.router,   prefix="/credits",   tags=["Credits"])
app.include_router(receipts.router,  prefix="/receipts",  tags=["Receipts"])
app.include_router(fumble.router,    prefix="/fumble",    tags=["Fumble Radar"])
app.include_router(sparring.router,  prefix="/sparring",  tags=["Sparring"])
app.include_router(war_room.router,  prefix="/war-room",  tags=["War Room"])


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok"}


FRONTEND_DIST = os.path.join(os.path.dirname(__file__), "static")

if os.path.isdir(FRONTEND_DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def spa(full_path: str):
        candidate = os.path.join(FRONTEND_DIST, full_path)
        if full_path and os.path.isfile(candidate):
            return FileResponse(candidate)
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))
