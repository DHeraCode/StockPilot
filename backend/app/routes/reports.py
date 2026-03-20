#app\routes\reports.py
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone, timedelta
from app.database import get_db
from app.models.product import Product
from app.models.stock_movement import StockMovement, MovementType
from app.schemas.report import DashboardSummary
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("/dashboard", response_model=DashboardSummary)
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Total de productos (del usuario actual)
    total_products = db.query(Product).filter(Product.owner_id == current_user.id).count()

    # 2. Valor total del inventario (Precio * Stock)
    # Nota: Usamos coalesce para manejar el caso de 0 productos y evitar None
    total_value = db.query(
        func.coalesce(func.sum(Product.price * Product.quantity), 0)
    ).filter(Product.owner_id == current_user.id).scalar()

    # 3. Cantidad de productos bajo el stock mínimo
    low_stock_count = db.query(Product).filter(
        Product.owner_id == current_user.id,
        Product.quantity <= Product.min_quantity
    ).count()

    # 4. Movimientos registrados hoy (UTC)
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    movements_today = db.query(StockMovement).join(Product).filter(
        Product.owner_id == current_user.id,
        StockMovement.created_at >= today
    ).count()

    return {
        "total_products": total_products,
        "total_inventory_value": float(total_value),
        "low_stock_count": low_stock_count,
        "movements_today": movements_today
    }

@router.get("/sales-summary")
def get_sales_summary(
    days: int = Query(30, description="Días hacia atrás para el reporte"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user) # <--- AÑADIDO: Protección de usuario
):
    # Usar timezone.utc para consistencia con el dashboard
    since_date = datetime.now(timezone.utc) - timedelta(days=days)

    # 1. Ingresos Totales (Solo salidas del usuario actual)
    # Importante: Unimos con Product para filtrar por owner_id
    total_revenue = db.query(
        func.coalesce(func.sum(StockMovement.quantity * StockMovement.unit_price), 0)
    ).join(Product).filter(
        Product.owner_id == current_user.id,
        StockMovement.movement_type == MovementType.salida,
        StockMovement.created_at >= since_date
    ).scalar()

    # 2. Producto más vendido (Top Seller del usuario actual)
    top_product = db.query(
        Product.name,
        func.sum(StockMovement.quantity).label("total_sold")
    ).join(StockMovement).filter(
        Product.owner_id == current_user.id,
        StockMovement.movement_type == MovementType.salida,
        StockMovement.created_at >= since_date
    ).group_by(Product.id).order_by(func.sum(StockMovement.quantity).desc()).first()

    return {
        "period_days": days,
        "total_revenue": round(float(total_revenue), 2),
        "top_seller": {
            "name": top_product[0] if top_product else "N/A",
            "quantity": top_product[1] if top_product else 0
        } if top_product else None
    }