#app/models/product.py
from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String)
    price = Column(Float, default=0.0)
    quantity = Column(Integer, default=0)
    min_quantity = Column(Integer, default=5)
    owner_id = Column(Integer, ForeignKey("users.id"))
    category_id = Column(Integer, ForeignKey("categories.id"))

    owner = relationship("User")
    category = relationship("Category")

    