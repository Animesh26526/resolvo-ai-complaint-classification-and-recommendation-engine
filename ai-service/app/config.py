import os
from dotenv import load_dotenv

load_dotenv()

# Server configuration
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
CORS_ORIGINS = [
    origin.strip() 
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:5000,http://localhost:5173").split(",") 
    if origin.strip()
]

# Hugging Face Models
HF_SENTIMENT_MODEL = os.getenv(
    "HF_SENTIMENT_MODEL", 
    "cardiffnlp/twitter-roberta-base-sentiment-latest"
)
HF_CLASSIFICATION_MODEL = os.getenv(
    "HF_CLASSIFICATION_MODEL", 
    "typeform/distilbert-base-uncased-mnli"
)

# GPT-OSS-20B Configuration
GPT_OSS_BASE_URL = os.getenv("GPT_OSS_BASE_URL", "")  # e.g., http://localhost:11434/v1 or remote LLM endpoint
GPT_OSS_MODEL = os.getenv("GPT_OSS_MODEL", "gpt-oss-20b")
GPT_OSS_API_KEY = os.getenv("GPT_OSS_API_KEY", "")

# Gemini Audio/Voice Configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")

# Gather fallback Gemini API keys
GEMINI_API_KEYS = []
if GEMINI_API_KEY:
    GEMINI_API_KEYS.append(GEMINI_API_KEY)
for i in range(1, 10):
    k = os.getenv(f"GEMINI_API_KEY_{i}")
    if k and k not in GEMINI_API_KEYS:
        GEMINI_API_KEYS.append(k)
