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
from app.core.logger import get_logger


logger = get_logger(__name__)
router = APIRouter(prefix="/stock", tags=["stock"])


@router.post("/", response_model=StockMovementOut)
def register_movement(
    movement: StockMovementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(is_admin) # Mantengo is_admin como tenías arriba
):
    # 1. Buscar el producto
    product = db.query(Product).filter(Product.id == movement.product_id).first()
    
    if not product:
        logger.warning(f"Movimiento fallido - producto no encontrado | ID: {movement.product_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    # 2. Validar cantidad positiva
    if movement.quantity <= 0:
        logger.warning(f"Movimiento fallido - cantidad inválida: {movement.quantity}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quantity must be greater than 0"
        )

    # 3. Actualizar stock según tipo de movimiento y validar disponibilidad
    if movement.movement_type == MovementType.salida:
        if product.quantity < movement.quantity:
            logger.warning(f"Stock insuficiente | Producto: {product.name} | Disponible: {product.quantity}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock. Available: {product.quantity}"
            )
        product.quantity -= movement.quantity
    else:
        product.quantity += movement.quantity

    # 4. Persistencia Atómica con unit_price automático
    try:
        # Aquí capturamos el precio actual del producto automáticamente
        db_movement = StockMovement(
            **movement.model_dump(),
            unit_price=product.price  # <--- ESTA ES LA MAGIA
        )
        
        db.add(db_movement)
        db.add(product) 
        db.commit()
        db.refresh(db_movement)
        
        logger.info(f"Movimiento registrado | Producto: {product.name} | Tipo: {movement.movement_type.value} | Precio Unit: {db_movement.unit_price} | Usuario: {current_user.username}")
        
        return db_movement
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error crítico al guardar movimiento: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error saving stock movement"
        )


@router.get("/", response_model=List[StockMovementOut])
def get_all_movements(
    db: Session = Depends(get_db),
    current_user: User = Depends(is_admin)
):
    movements = db.query(StockMovement).order_by(
        StockMovement.created_at.desc()
    ).all()
    logger.info(f"Consulta global de movimientos | Registros: {len(movements)} | Usuario: {current_user.username}")
    return movements

@router.get("/{product_id}", response_model=List[StockMovementOut])
def get_movements(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(is_admin)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        logger.warning(f"Consulta de movimientos fallida - producto no encontrado | ID: {product_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Product not found"
        )

    movements = db.query(StockMovement).filter(
        StockMovement.product_id == product_id
    ).all()
    logger.info(f"Consulta de movimientos | Producto ID: {product_id} | Registros: {len(movements)} | Usuario: {current_user.username}")
    return movements

