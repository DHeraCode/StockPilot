# app/models/stock_movement.py
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum, Float
from sqlalchemy.orm import relationship
from app.database import Base
from sqlalchemy.sql import func
import enum

class MovementType(str, enum.Enum):
    entrada = "entrada"
    salida = "salida"

class StockMovement(Base):
    __tablename__ = "stock_movements"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    movement_type = Column(Enum(MovementType), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False, default=0.0)
    note = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    product = relationship("Product")