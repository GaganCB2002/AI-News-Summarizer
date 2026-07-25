from fastapi.middleware.cors import CORSMiddleware
from app.config.settings import settings


def setup_cors(app):
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
