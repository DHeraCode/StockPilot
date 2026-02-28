from pydantic import BaseModel
from typing import List, Optional

class ProductBase(BaseModel):
    name: str
    description: str
    price: float
    quantity: int

class ProductCreate(ProductBase):
    pass

class ProductOut(ProductBase):
    id: int
    owner_id: int

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
    stock: Optional[int] = None

    class Config:
        from_attributes = True