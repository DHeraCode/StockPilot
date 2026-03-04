from fastapi import FastAPI
from app.routes import auth
from app.routes.product import router as product_router
from app.routes.category import router as category_router
from app.models import user, product as product_model
from app.routes.stock_movement import router as stock_router

app = FastAPI()



# Registrar rutas
app.include_router(auth.router)
app.include_router(product_router)
app.include_router(category_router)
app.include_router(stock_router)

@app.get("/")
def root():
    return {"message": "StockPilot API running "}