from fastapi import FastAPI
from app.database import engine, Base
from app.models import user
from app.routes import auth

app = FastAPI()

# Crear tablas
Base.metadata.create_all(bind=engine)

# Registrar rutas
app.include_router(auth.router)

@app.get("/")
def root():
    return {"message": "StockPilot API running "}