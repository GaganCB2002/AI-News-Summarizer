from typing import Optional


class AppException(Exception):
    def __init__(self, message: str, code: str = "APP_ERROR", status_code: int = 500, details: Optional[dict] = None):
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class NotFoundException(AppException):
    def __init__(self, message: str = "Resource not found", details: Optional[dict] = None):
        super().__init__(message=message, code="NOT_FOUND", status_code=404, details=details)


class UnauthorizedException(AppException):
    def __init__(self, message: str = "Unauthorized", details: Optional[dict] = None):
        super().__init__(message=message, code="UNAUTHORIZED", status_code=401, details=details)


class ForbiddenException(AppException):
    def __init__(self, message: str = "Forbidden", details: Optional[dict] = None):
        super().__init__(message=message, code="FORBIDDEN", status_code=403, details=details)


class BadRequestException(AppException):
    def __init__(self, message: str = "Bad request", details: Optional[dict] = None):
        super().__init__(message=message, code="BAD_REQUEST", status_code=400, details=details)


class ConflictException(AppException):
    def __init__(self, message: str = "Conflict", details: Optional[dict] = None):
        super().__init__(message=message, code="CONFLICT", status_code=409, details=details)


class RateLimitException(AppException):
    def __init__(self, message: str = "Rate limit exceeded", details: Optional[dict] = None):
        super().__init__(message=message, code="RATE_LIMIT", status_code=429, details=details)


class ExternalServiceException(AppException):
    def __init__(self, message: str = "External service error", details: Optional[dict] = None):
        super().__init__(message=message, code="EXTERNAL_SERVICE_ERROR", status_code=502, details=details)
