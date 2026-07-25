import logging
import secrets
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.user_repository import UserRepository
from app.core.security import verify_password, get_password_hash
from app.core.exceptions import UnauthorizedException, NotFoundException

logger = logging.getLogger("ai_news.password_service")

class PasswordService:
    def __init__(self, db: AsyncSession):
        self.user_repo = UserRepository(db)

    async def change_password(self, user_id: str, current_password: str, new_password: str):
        user = await self.user_repo.get(user_id)
        if not user:
            raise NotFoundException("User not found")
        if not verify_password(current_password, user.hashed_password):
            raise UnauthorizedException("Current password is incorrect")
        await self.user_repo.update(user_id, hashed_password=get_password_hash(new_password))
        return {"message": "Password changed successfully"}

    async def forgot_password(self, email: str):
        user = await self.user_repo.get_by_email(email)
        if not user:
            return {"message": "If the email exists, a reset link has been sent"}
        reset_token = secrets.token_urlsafe(32)
        await self.user_repo.update(user.id, reset_token=reset_token, reset_token_expires=datetime.now(timezone.utc) + timedelta(hours=1))
        logger.info(f"Password reset token for {email}: {reset_token}")
        return {"message": "If the email exists, a reset link has been sent"}

    async def reset_password(self, token: str, new_password: str):
        from sqlalchemy import select
        from app.models.user import User
        query = select(User).where(User.reset_token == token, User.reset_token_expires > datetime.now(timezone.utc))
        result = await self.user_repo.session.execute(query)
        user = result.scalar_one_or_none()
        if not user:
            raise UnauthorizedException("Invalid or expired reset token")
        await self.user_repo.update(user.id, hashed_password=get_password_hash(new_password), reset_token=None, reset_token_expires=None)
        return {"message": "Password reset successfully"}
