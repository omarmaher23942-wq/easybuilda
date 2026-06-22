import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import settings
from routers import agents, chat, wallet, interview, referral, support

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
)
log = logging.getLogger("easybuilda")


@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("EasyBuilda API awake — v%s", app.version)
    yield
    log.info("EasyBuilda API shutting down.")


app = FastAPI(title="EasyBuilda API", version="0.6.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def on_error(request: Request, exc: Exception):
    log.exception("Unhandled error on %s", request.url.path)
    return JSONResponse(
        status_code=500,
        content={"error": "Something went wrong on our side. Please try again."},
    )


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "service": "EasyBuilda API", "version": app.version}


# ── Routers ────────────────────────────────────────────────────────
# NOTE: billing.router and payments.router were removed — the platform
# now runs a single pricing model (pay $8 per confirmed hot lead only,
# no setup fee, no subscription). All billing logic lives in
# services/repo.py (upsert_lead / _charge_hot_lead) and is invoked
# directly from routers/chat.py.
app.include_router(agents.router)
app.include_router(chat.router)
app.include_router(wallet.router)
app.include_router(interview.router)
app.include_router(referral.router)
app.include_router(support.router)   # WebSocket real-time chat