import logging
from contextlib import asynccontextmanager

from routers import payments
app.include_router(payments.router)

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import settings
from routers import agents, chat

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
)
log = logging.getLogger("easybuilda")


@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("EasyBuilda API awake.")
    yield
    log.info("EasyBuilda API shutting down.")


app = FastAPI(title="EasyBuilda API", version="0.2.0", lifespan=lifespan)

# CORS: allow everything in dev (tighten in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,      # must be False when allow_origins=["*"]
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


app.include_router(agents.router)
app.include_router(chat.router)