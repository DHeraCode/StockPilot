# app/routes/stock_movement.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.stock_movement import StockMovement, MovementType
from app.models.product import Product
from app.schemas.stock_movement import StockMovementCreate, StockMovementOut
from app.core.security import is_admin
from app.models.user import User
from typing import List

router = APIRouter(prefix="/stock", tags=["stock"])



@router.post("/", response_model=StockMovementOut)
def register_movement(
    movement: StockMovementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(is_admin)
):
    product = db.query(Product).filter(Product.id == movement.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if movement.movement_type == MovementType.salida:
        if product.quantity < movement.quantity:
            raise HTTPException(status_code=400, detail="Insufficient stock")
        product.quantity -= movement.quantity
    else:
        product.quantity += movement.quantity

    db_movement = StockMovement(**movement.dict())
    db.add(db_movement)
    db.commit()
    db.refresh(db_movement)
    return db_movement

@router.get("/{product_id}", response_model=List[StockMovementOut])
def get_movements(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(is_admin)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    movements = db.query(StockMovement).filter(
        StockMovement.product_id == product_id
    ).all()

    return movements