# app/schemas/stock_movement.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.stock_movement import MovementType

class StockMovementCreate(BaseModel):
    product_id: int
    movement_type: MovementType
    quantity: int
    note: Optional[str] = None

class StockMovementOut(BaseModel):
    id: int
    product_id: int
    movement_type: MovementType
    quantity: int
    note: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True