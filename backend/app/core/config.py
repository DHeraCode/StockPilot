# app/core/config.py
from datetime import timedelta

SECRET_KEY = "TU_SECRETO_SUPER_SEGURO_AQUI"  # Cambia por algo largo y random
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60  # 1 hora