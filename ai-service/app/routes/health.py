from datetime import datetime, timezone
from fastapi import APIRouter

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("")
@router.get("/")
def get_health_status():
    return {
        "status": "ok",
        "message": "Resolvo AI Service is running",
        "service": "ai-service",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
