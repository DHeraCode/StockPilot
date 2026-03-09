import logging
import os
from logging.handlers import RotatingFileHandler

# Directorio de logs
LOG_DIR = "logs"
LOG_FILE = os.path.join(LOG_DIR, "app.log")

# Crear directorio si no existe
os.makedirs(LOG_DIR, exist_ok=True)

# Formato de los logs
LOG_FORMAT = "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
DATE_FORMAT = "%Y-%m-%d %H:%M:%S"


def get_logger(name: str) -> logging.Logger:
    """
    Retorna un logger configurado con handlers de consola y archivo.
    Uso: logger = get_logger(__name__)
    """
    logger = logging.getLogger(name)

    # Evitar duplicar handlers si el logger ya fue configurado
    if logger.handlers:
        return logger

    logger.setLevel(logging.DEBUG)

    formatter = logging.Formatter(LOG_FORMAT, datefmt=DATE_FORMAT)

    # Handler: Consola
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(formatter)

    # Handler: Archivo con rotación (max 5MB, mantiene 3 archivos)
    file_handler = RotatingFileHandler(
        LOG_FILE,
        maxBytes=5 * 1024 * 1024,  # 5 MB
        backupCount=3,
        encoding="utf-8"
    )
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(formatter)

    logger.addHandler(console_handler)
    logger.addHandler(file_handler)

    return logger