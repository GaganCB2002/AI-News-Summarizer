from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.core.dependencies import get_current_active_user
from app.models.user import User
from app.services.password_service import PasswordService
from app.schemas.user import ChangePasswordRequest, ForgotPasswordRequest, ResetPasswordRequest

router = APIRouter(prefix="/api/v1/auth", tags=["authentication"])

@router.post("/change-password")
async def change_password(
    data: ChangePasswordRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    service = PasswordService(db)
    return await service.change_password(current_user.id, data.current_password, data.new_password)

@router.post("/forgot-password")
async def forgot_password(
    data: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    service = PasswordService(db)
    return await service.forgot_password(data.email)

@router.post("/reset-password")
async def reset_password(
    data: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    service = PasswordService(db)
    return await service.reset_password(data.token, data.new_password)
