from fastapi import APIRouter, Depends, UploadFile, File
import os
import uuid
import aiofiles
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.services.auth_service import AuthService
from app.core.dependencies import get_current_active_user
from app.core.security import get_password_hash, create_access_token, create_refresh_token
from app.schemas.user import UserCreate, UserLogin, UserResponse, UserUpdate, TokenResponse, TokenRefresh
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.repositories.preference_repository import UserPreferenceRepository
from app.core.exceptions import ConflictException, AppException
import logging

logger = logging.getLogger("ai_news.auth")

router = APIRouter(prefix="/api/v1/auth", tags=["authentication"])


@router.post("/register", response_model=UserResponse, status_code=201)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    user = await service.register(user_data)
    return UserResponse(
        id=user.id,
        email=user.email,
        username=user.username,
        full_name=user.full_name,
        is_active=user.is_active,
        is_superuser=user.is_superuser,
        created_at=user.created_at,
        profile_image_url=user.profile_image_url,
    )


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    return await service.login(credentials.email, credentials.password)


@router.post("/test-login", response_model=TokenResponse)
async def test_login(db: AsyncSession = Depends(get_db)):
    test_email = "test@brieflyai.com"
    test_password = "testpassword123"

    user_repo = UserRepository(db)
    existing = await user_repo.get_by_email(test_email)

    if not existing:
        try:
            user = await user_repo.create(
                email=test_email,
                username="testuser_auto",
                hashed_password=get_password_hash(test_password),
                full_name="Test User",
            )
            pref_repo = UserPreferenceRepository(db)
            await pref_repo.create(user_id=user.id)
            access_token = create_access_token({"sub": user.id})
            refresh_token = create_refresh_token({"sub": user.id})
            return TokenResponse(access_token=access_token, refresh_token=refresh_token, token_type="bearer")
        except AppException:
            raise
        except Exception as e:
            logger.error(f"Test user creation failed: {e}")
            existing = await user_repo.get_by_email(test_email)
            if existing:
                access_token = create_access_token({"sub": existing.id})
                refresh_token = create_refresh_token({"sub": existing.id})
                return TokenResponse(access_token=access_token, refresh_token=refresh_token, token_type="bearer")
            raise AppException("Failed to create test user. Please try again.")

    access_token = create_access_token({"sub": existing.id})
    refresh_token = create_refresh_token({"sub": existing.id})
    return TokenResponse(access_token=access_token, refresh_token=refresh_token, token_type="bearer")


@router.post("/refresh", response_model=TokenResponse)
async def refresh(token_data: TokenRefresh, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    return await service.refresh_token(token_data.refresh_token)


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_active_user)):
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_active_user)):
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
        full_name=current_user.full_name,
        is_active=current_user.is_active,
        is_superuser=current_user.is_superuser,
        created_at=current_user.created_at,
        profile_image_url=current_user.profile_image_url,
    )


@router.put("/me", response_model=UserResponse)
async def update_me(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    updated = await service.update_user(current_user.id, user_data)
    return UserResponse(
        id=updated.id,
        email=updated.email,
        username=updated.username,
        full_name=updated.full_name,
        is_active=updated.is_active,
        is_superuser=updated.is_superuser,
        created_at=updated.created_at,
        profile_image_url=updated.profile_image_url,
    )


@router.post("/me/profile-image", response_model=UserResponse)
async def upload_profile_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    if not file.content_type.startswith("image/"):
        raise AppException("File must be an image", status_code=400)
        
    ext = file.filename.split(".")[-1] if "." in file.filename else "png"
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = os.path.join("app", "static", "profiles", filename)
    
    async with aiofiles.open(filepath, 'wb') as out_file:
        content = await file.read()
        await out_file.write(content)
        
    file_url = f"/static/profiles/{filename}"
    
    user_update = UserUpdate(profile_image_url=file_url)
    service = AuthService(db)
    updated = await service.update_user(current_user.id, user_update)
    
    return UserResponse(
        id=updated.id,
        email=updated.email,
        username=updated.username,
        full_name=updated.full_name,
        is_active=updated.is_active,
        is_superuser=updated.is_superuser,
        created_at=updated.created_at,
        profile_image_url=updated.profile_image_url,
    )
