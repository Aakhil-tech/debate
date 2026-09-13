
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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


@app.get("/", tags=["Health"])
async def root():
    return {"status": "operational", "product": "Debate & Win", "version": "3.0.0"}


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok"}
