"""FastAPI application factory."""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import init_db
from app.routes import auth, vehicles


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Create tables on startup."""
    init_db()
    yield


def create_app() -> FastAPI:
    """Build the FastAPI application."""
    app = FastAPI(title="Car Dealership Inventory", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=get_settings().cors_origin_list,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(auth.router)
    app.include_router(vehicles.router)
    return app


app = create_app()
