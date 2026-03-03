#app/schemas/product.py
from pydantic import BaseModel
from typing import List, Optional
from app.schemas.category import CategoryOut

class ProductBase(BaseModel):
    name: str
    description: str
    price: float
    quantity: int
    category_id: int

class ProductCreate(ProductBase):
    pass

class ProductOut(ProductBase):
    id: int
    owner_id: int
    category_id: Optional[int] = None
    category: Optional[CategoryOut] = None
    

    class Config:
        from_attributes = True


class ProductList(BaseModel):
    total: int
    skip: int
    limit: int
    items: List[ProductOut]

    class Config:
        from_attributes = True

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    quantity: Optional[int] = None

    class Config:
        from_attributes = True