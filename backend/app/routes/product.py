# app/routes/product.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.exc import IntegrityError, OperationalError
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductOut, ProductList, ProductUpdate
from app.core.security import get_current_user
from app.models.user import User
from typing import Optional, List
from app.core.logger import get_logger


logger = get_logger(__name__)
router = APIRouter(prefix="/products", tags=["products"])




@router.post("/", response_model=ProductOut)
def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.models.category import Category
    category = db.query(Category).filter(Category.id == product.category_id).first()
    if not category:
        logger.warning(f"Producto no creado - categoría no encontrada | category_id: {product.category_id}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    
    try:
        db_product = Product(**product.model_dump(), owner_id=current_user.id)
        db.add(db_product)
        db.commit()
        db.refresh(db_product)
        logger.info(f"Producto creado | id: {db_product.id} | nombre: {db_product.name} | owner: {current_user.username}")
        return db_product
    
    except HTTPException:
        logger.error(f"Error inesperado al crear producto | nombre: {product.name}")
        raise
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Product already exists"
        )
    except OperationalError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection error"
        )
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )



@router.get("/", response_model=ProductList)
def get_products(
    skip: int = 0,
    limit: int = Query(default=10, le=100),
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Product).filter(Product.owner_id == current_user.id)

    if search:
        query = query.filter(Product.name.ilike(f"%{search}%"))

    total = query.count()

    products = query.offset(skip).limit(limit).all()

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "items": products
    }



@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_product = db.query(Product).filter(Product.id == product_id).first()

    if not db_product:
        logger.warning(f"Eliminación fallida - producto no encontrado | id: {product_id}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    if db_product.owner_id != current_user.id:
        logger.warning(f"Eliminación no autorizada | product_id: {product_id} | user: {current_user.username}")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
    try:
        db.delete(db_product)
        db.commit()
        logger.info(f"Producto eliminado | id: {product_id} | user: {current_user.username}")
        return {"detail": "Product deleted successfully"}
    
    except HTTPException:
        raise
    except OperationalError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection error"
        )
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )


@router.put("/{product_id}", response_model=ProductOut)
def update_product(
    product_id: int,
    product_data: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.owner_id == current_user.id
    ).first()

    if not product:
        logger.warning(f"Actualización fallida - producto no encontrado | id: {product_id}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    
    try:
        for key, value in product_data.model_dump(exclude_unset=True).items():
            setattr(product, key, value)

        db.commit()
        db.refresh(product)
        logger.info(f"Producto actualizado | id: {product_id} | user: {current_user.username}")
        return product
    
    except HTTPException:
        raise
    except OperationalError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection error"
        )
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )



@router.get("/alerts/low-stock", response_model=List[ProductOut])
def get_low_stock(
    threshold: int = Query(default=10, description="Minimum stock threshold"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    products = db.query(Product).filter(
        Product.owner_id == current_user.id,
        Product.quantity <= threshold
    ).all()

    if not products:
        return []
    logger.info(f"Alerta stock bajo | {len(products)} productos bajo umbral {threshold} | user: {current_user.username}")
    return products