from fastapi import FastAPI
from app.database import engine, Base
from app.routes import auth
from app.routes.product import router as product_router
from app.models import user, product as product_model

app = FastAPI()

# Crear tablas
Base.metadata.create_all(bind=engine)

# Registrar rutas
app.include_router(auth.router)
app.include_router(product_router)

@app.get("/")
def root():
    return {"message": "StockPilot API running "}