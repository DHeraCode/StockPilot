# backend/app/main.py
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware 

from app.routes.product import router as product_router
from app.routes.category import router as category_router
from app.routes.stock_movement import router as stock_router
from app.routes import reports
from app.middleware.logging_middleware import LoggingMiddleware
from app.core.logger import get_logger
from app.database import engine, Base
from app import models

logger = get_logger("main")

# --- Configuración del Limiter ---
# Si estamos en modo TESTING, enabled será False y no contará peticiones.
limiter = Limiter(
    key_func=get_remote_address,
    enabled=os.getenv("TESTING") != "true"
)

from app.routes import auth

@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Startup ---
    logger.info("=" * 50)
    logger.info("StockPilot API iniciada correctamente")
    logger.info("=" * 50)

    yield  # La aplicación corre aquí

    # --- Shutdown ---
    logger.info("StockPilot API detenida")

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="StockPilot API",
    lifespan=lifespan
)

# Vincular limiter a la app
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
# Añadimos el middleware explícitamente para mejor control en tests
app.add_middleware(SlowAPIMiddleware)

# --- Middlewares ---
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:4200",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(LoggingMiddleware)

# --- Rutas ---
app.include_router(auth.router)
app.include_router(product_router)
app.include_router(category_router)
app.include_router(stock_router)
app.include_router(reports.router)

@app.get("/")
def root():
    logger.info("Health check - API running")  
    return {"message": "StockPilot API running"}

