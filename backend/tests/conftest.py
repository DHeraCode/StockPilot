# tests/conftest.py
import os
os.environ["TESTING"] = "true"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from unittest.mock import patch
from app.main import app
from app.database import Base, get_db
from app.core.security import hash_password
from app.models.user import User
from app.models.category import Category
from app.models.product import Product

# ─── Base de datos en memoria exclusiva para tests ───────────────────────────
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


# ─── Fixtures ─────────────────────────────────────────────────────────────────


@pytest.fixture(autouse=True)
def setup_test():
    """Aísla BD y anula completamente el limitador."""
    # 1. Forzar que el limitador esté desactivado en la instancia de la app
    from app.main import limiter
    limiter.enabled = False
    
    # 2. Asegurar que cada petición use la DB de test
    app.dependency_overrides[get_db] = override_get_db
    
    # 3. Recrear tablas
    Base.metadata.drop_all(bind=engine) # Limpieza total
    Base.metadata.create_all(bind=engine)
    
    yield
    
    app.dependency_overrides.clear()



@pytest.fixture()
def client():
    """TestClient de FastAPI con la DB de tests y estado de Limiter."""
    # Forzamos que el estado del limitador exista para evitar el AttributeError
    if not hasattr(app.state, "limiter"):
        from app.main import limiter
        app.state.limiter = limiter
        
    return TestClient(app)

@pytest.fixture()
def db():
    """Sesión de BD directa para preparar datos en tests."""
    database = TestingSessionLocal()
    try:
        yield database
    finally:
        database.close()



@pytest.fixture()
def admin_user(db):
    """Usuario administrador pre-creado en la BD."""
    user = User(
        username="admin",
        email="admin@test.com",
        hashed_password=hash_password("adminpass123"),
        is_admin=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture()
def regular_user(db):
    """Usuario normal (no admin) pre-creado en la BD."""
    user = User(
        username="regular",
        email="regular@test.com",
        hashed_password=hash_password("regularpass123"),
        is_admin=False
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture()
def admin_token(client, admin_user):
    """Token JWT del usuario admin."""
    response = client.post("/auth/login", data={
        "username": "admin",
        "password": "adminpass123"
    })
    return response.json()["access_token"]


@pytest.fixture()
def regular_token(client, regular_user):
    """Token JWT del usuario regular."""
    response = client.post("/auth/login", data={
        "username": "regular",
        "password": "regularpass123"
    })
    return response.json()["access_token"]


@pytest.fixture()
def auth_headers(admin_token):
    """Headers de autorización para admin."""
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture()
def regular_headers(regular_token):
    """Headers de autorización para usuario regular."""
    return {"Authorization": f"Bearer {regular_token}"}


@pytest.fixture()
def sample_category(db):
    """Categoría de prueba pre-creada en la BD."""
    category = Category(name="Electronics", description="Electronic devices")
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@pytest.fixture()
def sample_product(db, admin_user, sample_category):
    """Producto de prueba pre-creado en la BD."""
    product = Product(
        name="Test Product",
        description="A test product",
        price=99.99,
        quantity=50,
        owner_id=admin_user.id,
        category_id=sample_category.id
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product