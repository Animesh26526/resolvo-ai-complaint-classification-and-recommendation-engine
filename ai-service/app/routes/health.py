from datetime import datetime, timezone
from fastapi import APIRouter
from app.config import (
    HF_SENTIMENT_MODEL,
    HF_CLASSIFICATION_MODEL,
    GPT_OSS_BASE_URL,
    GPT_OSS_MODEL,
    GEMINI_MODEL,
)
from app.services.sentiment_service import SentimentService
from app.services.classification_service import ClassificationService
from app.services.gpt_oss_service import GptOssService
from app.services.gemini_service import GeminiAudioService

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("")
@router.get("/")
def get_health_status():
    sentiment_service = SentimentService()
    classification_service = ClassificationService()
    gpt_oss_service = GptOssService()
    gemini_service = GeminiAudioService()

    return {
        "status": "ok",
        "message": "Resolvo Multi-Model AI Service is operational",
        "service": "ai-service",
        "version": "2.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "models": {
            "sentiment": {
                "name": HF_SENTIMENT_MODEL,
                "is_loaded": sentiment_service.is_model_ready,
            },
            "classification": {
                "name": HF_CLASSIFICATION_MODEL,
                "is_loaded": classification_service.is_model_ready,
            },
            "gpt_oss_20b": {
                "model": GPT_OSS_MODEL,
                "endpoint_configured": gpt_oss_service.is_available(),
                "base_url": GPT_OSS_BASE_URL or "unconfigured (using deterministic fallback)",
            },
            "gemini_voice": {
                "model": GEMINI_MODEL,
                "api_key_configured": gemini_service.is_configured(),
            },
        },
    }
