import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from app.config import (
    HOST,
    PORT,
    CORS_ORIGINS,
    HF_SENTIMENT_MODEL,
    HF_CLASSIFICATION_MODEL,
    GPT_OSS_MODEL,
    GEMINI_MODEL,
)
from app.routes.health import router as health_router
from app.routes.analyzer import router as analyzer_router
from app.routes.chat import router as chat_router
from app.routes.audio import router as audio_router
from app.services.sentiment_service import SentimentService
from app.services.classification_service import ClassificationService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("resolvo-ai-service")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context for warming up AI services."""
    logger.info("Initializing Resolvo Multi-Model AI Service...")
    # Trigger lazy load references in background without blocking immediate API responsiveness
    try:
        sentiment_service = SentimentService()
        classification_service = ClassificationService()
        logger.info(f"AI Service initialized. Models configured: Sentiment={HF_SENTIMENT_MODEL}, Classifier={HF_CLASSIFICATION_MODEL}, LLM={GPT_OSS_MODEL}, Voice={GEMINI_MODEL}")
    except Exception as init_err:
        logger.warning(f"Background AI model initialization notice: {init_err}")
    yield
    logger.info("Resolvo AI Service shutting down.")


app = FastAPI(
    title="Resolvo AI Complaint Classification & Recommendation Engine",
    version="2.0.0",
    description="Multi-Model AI service featuring Hugging Face Sentiment, Hugging Face Classifier, Explainable Priority Engine, GPT-OSS-20B Recommendation/Chatbot, and Gemini Voice Pipeline.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS if CORS_ORIGINS else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health routes
app.include_router(health_router)
app.include_router(health_router, prefix="/api")

# Core AI analysis routes
app.include_router(analyzer_router)

# Conversational Chatbot routes (GPT-OSS-20B)
app.include_router(chat_router)

# Gemini Speech & Audio Transcription routes
app.include_router(audio_router)


@app.get("/")
def root():
    return {
        "service": "Resolvo Multi-Model AI Engine",
        "version": "2.0.0",
        "architecture": {
            "sentiment": "Hugging Face (cardiffnlp/twitter-roberta-base-sentiment-latest)",
            "classification": "Hugging Face Zero-Shot / Domain Classifier",
            "priority": "Deterministic Multi-Signal Priority Engine",
            "reasoning_and_chatbot": "GPT-OSS-20B",
            "voice_and_audio": "Gemini Speech-to-Text Pipeline"
        },
        "docs": "/docs",
        "health": "/health"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=HOST, port=PORT, reload=True)
