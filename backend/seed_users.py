import asyncio
import logging
from app.database.session import async_session_factory, init_db
from app.repositories.user_repository import UserRepository
from app.repositories.preference_repository import UserPreferenceRepository
from app.core.security import get_password_hash

logger = logging.getLogger("ai_news.seed_users")

SEED_USERS = [
    {
        "email": "test@brieflyai.com",
        "username": "testuser",
        "password": "testpassword123",
        "full_name": "Test User",
        "is_superuser": False,
    },
    {
        "email": "admin@brieflyai.com",
        "username": "admin",
        "password": "adminpassword123",
        "full_name": "Admin User",
        "is_superuser": True,
    },
]


async def seed_users():
    await init_db()
    async with async_session_factory() as session:
        user_repo = UserRepository(session)
        pref_repo = UserPreferenceRepository(session)
        created = 0
        from app.core.security import verify_password

        for user_data in SEED_USERS:
            existing = await user_repo.get_by_email(user_data["email"])
            if existing:
                if not verify_password(user_data["password"], existing.hashed_password):
                    existing.hashed_password = get_password_hash(user_data["password"])
                    logger.info(f"Updated password for existing user: {user_data['email']}")
                    created += 1
                else:
                    logger.info(f"User {user_data['email']} already exists, skipping")
                continue
            user = await user_repo.create(
                email=user_data["email"],
                username=user_data["username"],
                hashed_password=get_password_hash(user_data["password"]),
                full_name=user_data["full_name"],
                is_superuser=user_data["is_superuser"],
            )
            await pref_repo.create(user_id=user.id)
            logger.info(f"Created seed user: {user_data['email']}")
            created += 1
        await session.commit()
        if created == 0:
            logger.info("No new users created (all already exist)")
        else:
            logger.info(f"Successfully seeded {created} user(s)")
        return created


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(seed_users())
