from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.routes import auth
from app.routes.product import router as product_router
from app.routes.category import router as category_router
from app.models import user, product as product_model
from app.routes.stock_movement import router as stock_router
from app.middleware.logging_middleware import LoggingMiddleware
from app.core.logger import get_logger
from contextlib import asynccontextmanager


logger = get_logger("main")
limiter = Limiter(key_func=get_remote_address)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Startup ---
    logger.info("=" * 50)
    logger.info("StockPilot API iniciada correctamente")
    logger.info("=" * 50)

    yield  # La aplicación corre aquí

    # --- Shutdown ---
    logger.info("StockPilot API detenida")


app = FastAPI(lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

origins = [
    "http://localhost:3000",  # React
    "http://localhost:5173",  # Vite
    "http://localhost:4200",  # Angular
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(LoggingMiddleware)


# Registrar rutas
app.include_router(auth.router)
app.include_router(product_router)
app.include_router(category_router)
app.include_router(stock_router)

@app.get("/")
def root():
    logger.info("Health check - API running")  
    return {"message": "StockPilot API running "}


@app.on_event("startup")
async def startup_event():
    logger.info("=" * 50)
    logger.info("StockPilot API iniciada correctamente")
    logger.info("=" * 50)

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("StockPilot API detenida")