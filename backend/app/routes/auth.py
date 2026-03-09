# app/routes/auth.py
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, OperationalError
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.schemas.user import UserCreate, UserOut, Token
from app.models.user import User
from app.database import get_db                    
from app.core.security import hash_password, verify_password, create_access_token, get_current_user
from fastapi.security import OAuth2PasswordRequestForm
from app.core.logger import get_logger

logger = get_logger(__name__)
limiter = Limiter(key_func=get_remote_address)
router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserOut)
@limiter.limit("5/minute")                         #  Máximo 5 registros por minuto
def register(request: Request, user: UserCreate, db: Session = Depends(get_db)):
    try:
        existing = db.query(User).filter(User.username == user.username).first()
        if existing:
            logger.warning(f"Registro fallido - username ya existe: {user.username}")
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Username already exists"
            )

        existing_email = db.query(User).filter(User.email == user.email).first()
        if existing_email:
            logger.warning(f"Registro fallido - email ya existe: {user.email}")
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already exists"
            )

        is_first_user = db.query(User).count() == 0

        db_user = User(
            username=user.username,
            email=user.email,
            hashed_password=hash_password(user.password),
            is_admin=is_first_user
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        logger.info(f"Usuario registrado | username: {db_user.username} | admin: {db_user.is_admin}")
        return db_user

    except HTTPException:
        logger.error(f"Error inesperado en registro | username: {user.username}")
        raise
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered or username taken"
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


@router.post("/login", response_model=Token)
@limiter.limit("10/minute")                        #  Máximo 10 intentos por minuto
def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    db_user = db.query(User).filter(User.username == form_data.username).first()

    if not db_user:
        logger.warning(f"Login fallido - usuario no existe: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,  #  Usando constante
            detail="Incorrect username or password"
        )

    if not verify_password(form_data.password, db_user.hashed_password):
        logger.warning(f"Login fallido - contraseña incorrecta | username: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,  #  Usando constante
            detail="Incorrect username or password"
        )

    token = create_access_token({"sub": db_user.username})
    logger.info(f"Login exitoso | username: {db_user.username}")
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", response_model=UserOut)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user