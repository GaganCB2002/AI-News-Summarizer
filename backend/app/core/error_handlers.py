from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from app.core.exceptions import (
    AppException,
    NotFoundException,
    UnauthorizedException,
    ForbiddenException,
    BadRequestException,
    ConflictException,
    RateLimitException,
    ExternalServiceException,
)


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error_code": exc.code,
                "message": exc.message,
                "details": exc.details,
            },
        )

    @app.exception_handler(NotFoundException)
    async def not_found_exception_handler(request: Request, exc: NotFoundException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error_code": exc.code,
                "message": exc.message,
                "details": exc.details,
            },
        )

    @app.exception_handler(UnauthorizedException)
    async def unauthorized_exception_handler(request: Request, exc: UnauthorizedException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error_code": exc.code,
                "message": exc.message,
                "details": exc.details,
            },
        )

    @app.exception_handler(ForbiddenException)
    async def forbidden_exception_handler(request: Request, exc: ForbiddenException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error_code": exc.code,
                "message": exc.message,
                "details": exc.details,
            },
        )

    @app.exception_handler(BadRequestException)
    async def bad_request_exception_handler(request: Request, exc: BadRequestException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error_code": exc.code,
                "message": exc.message,
                "details": exc.details,
            },
        )

    @app.exception_handler(ConflictException)
    async def conflict_exception_handler(request: Request, exc: ConflictException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error_code": exc.code,
                "message": exc.message,
                "details": exc.details,
            },
        )

    @app.exception_handler(RateLimitException)
    async def rate_limit_exception_handler(request: Request, exc: RateLimitException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error_code": exc.code,
                "message": exc.message,
                "details": exc.details,
            },
        )

    @app.exception_handler(ExternalServiceException)
    async def external_service_exception_handler(request: Request, exc: ExternalServiceException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error_code": exc.code,
                "message": exc.message,
                "details": exc.details,
            },
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        return JSONResponse(
            status_code=500,
            content={
                "error_code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred",
                "details": None,
            },
        )
