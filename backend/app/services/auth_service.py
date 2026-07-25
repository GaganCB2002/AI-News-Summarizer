from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.user_repository import UserRepository
from app.repositories.preference_repository import UserPreferenceRepository
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    verify_password,
    get_password_hash,
)
from app.core.exceptions import (
    UnauthorizedException,
    ConflictException,
    NotFoundException,
)
from app.schemas.user import UserCreate, TokenResponse, UserUpdate
from app.models.user import User


class AuthService:
    def __init__(self, db: AsyncSession):
        self.user_repo = UserRepository(db)
        self.preference_repo = UserPreferenceRepository(db)

    async def register(self, user_data: UserCreate) -> User:
        existing_email = await self.user_repo.get_by_email(user_data.email)
        if existing_email:
            raise ConflictException("Email already registered")
        existing_username = await self.user_repo.get_by_username(user_data.username)
        if existing_username:
            raise ConflictException("Username already taken")

        user = await self.user_repo.create(
            email=user_data.email,
            username=user_data.username,
            hashed_password=get_password_hash(user_data.password),
            full_name=user_data.full_name,
        )

        await self.preference_repo.create(user_id=user.id)
        return user

    async def authenticate(self, email: str, password: str) -> User:
        user = await self.user_repo.get_by_email(email)
        if not user:
            raise UnauthorizedException("Invalid email or password")
        if not verify_password(password, user.hashed_password):
            raise UnauthorizedException("Invalid email or password")
        if not user.is_active:
            raise UnauthorizedException("Account is deactivated")
        return user

    async def login(self, email: str, password: str) -> TokenResponse:
        user = await self.authenticate(email, password)
        from datetime import datetime, timezone
        await self.user_repo.update(user.id, last_login_at=datetime.now(timezone.utc))
        access_token = create_access_token({"sub": user.id})
        refresh_token = create_refresh_token({"sub": user.id})
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
        )

    async def refresh_token(self, refresh_token_str: str) -> TokenResponse:
        payload = decode_token(refresh_token_str)
        if not payload or "sub" not in payload or payload.get("type") != "refresh":
            raise UnauthorizedException("Invalid or expired refresh token")
        user = await self.user_repo.get(payload["sub"])
        if not user or not user.is_active:
            raise UnauthorizedException("User not found or inactive")
        access_token = create_access_token({"sub": user.id})
        new_refresh_token = create_refresh_token({"sub": user.id})
        return TokenResponse(
            access_token=access_token,
            refresh_token=new_refresh_token,
            token_type="bearer",
        )

    async def update_user(self, user_id: str, user_data: UserUpdate) -> User:
        user = await self.user_repo.update(user_id, **user_data.model_dump(exclude_none=True))
        if not user:
            raise NotFoundException("User not found")
        return user

    async def get_user_by_id(self, user_id: str) -> User:
        user = await self.user_repo.get(user_id)
        if not user:
            raise NotFoundException("User not found")
        return user
