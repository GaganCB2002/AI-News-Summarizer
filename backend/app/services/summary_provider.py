import logging
from app.config.settings import settings

logger = logging.getLogger("ai_news.summary_provider")


def get_summary_provider():
    provider = settings.SUMMARY_PROVIDER.lower()
    if provider == "ollama":
        from app.services.ollama_service import ollama_service
        logger.info(f"Using Ollama provider with model: {settings.OLLAMA_MODEL}")
        return ollama_service
    elif provider == "gemini":
        from app.services.gemini_service import gemini_service
        logger.info(f"Using Gemini provider with model: {settings.GEMINI_MODEL}")
        return gemini_service
    else:
        logger.warning(f"Unknown provider '{provider}', falling back to Ollama")
        from app.services.ollama_service import ollama_service
        return ollama_service
