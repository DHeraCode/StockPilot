# app/routes/stock_movement.py
from fastapi import APIRouter, Depends, HTTPException, status
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
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    # Validar cantidad positiva
    if movement.quantity <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quantity must be greater than 0"
        )

    # Actualizar stock según tipo de movimiento
    if movement.movement_type == MovementType.salida:
        if product.quantity < movement.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock. Available: {product.quantity}"
            )
        product.quantity -= movement.quantity
    else:
        product.quantity += movement.quantity

    # Persistir movimiento y producto de forma atómica
    try:
        db_movement = StockMovement(**movement.model_dump())
        db.add(db_movement)
        db.add(product)        # Garantiza tracking del producto modificado
        db.commit()
        db.refresh(db_movement)
        db.refresh(product)    # Sincroniza estado real desde la BD
        return db_movement
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error saving stock movement"
        )

@router.get("/{product_id}", response_model=List[StockMovementOut])
def get_movements(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(is_admin)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Product not found"
        )

    movements = db.query(StockMovement).filter(
        StockMovement.product_id == product_id
    ).all()

    return movements