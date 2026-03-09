import time
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from app.core.logger import get_logger

logger = get_logger("middleware")


class LoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware que loggea automáticamente cada request y response:
    - Método HTTP, ruta, IP
    - Código de estado, tiempo de respuesta
    - Errores 4xx y 5xx con detalle
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        start_time = time.time()

        client_ip = request.client.host if request.client else "unknown"
        method = request.method
        url = request.url.path
        query = str(request.query_params) if request.query_params else ""

        # Log del request entrante
        logger.info(f"REQUEST  → {method} {url} | IP: {client_ip} | Params: {query or 'none'}")

        try:
            response = await call_next(request)
        except Exception as exc:
            elapsed = (time.time() - start_time) * 1000
            logger.error(
                f"RESPONSE ← {method} {url} | STATUS: 500 | {elapsed:.1f}ms | "
                f"Unhandled exception: {exc}"
            )
            raise exc

        elapsed = (time.time() - start_time) * 1000
        status = response.status_code

        # Nivel del log según el código de estado
        if status >= 500:
            logger.error(f"RESPONSE ← {method} {url} | STATUS: {status} | {elapsed:.1f}ms")
        elif status >= 400:
            logger.warning(f"RESPONSE ← {method} {url} | STATUS: {status} | {elapsed:.1f}ms")
        else:
            logger.info(f"RESPONSE ← {method} {url} | STATUS: {status} | {elapsed:.1f}ms")

        return response