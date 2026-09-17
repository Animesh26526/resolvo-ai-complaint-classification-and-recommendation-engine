import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from app.routes.health import router as health_router
from app.routes.analyzer import router as analyzer_router

app = FastAPI(
    title="Resolvo AI Complaint Classification & Recommendation Engine",
    version="1.0.0",
    description="FastAPI service for AI classification, sentiment analysis, priority assignment, and resolution recommendations."
)

cors_origins_env = os.getenv("CORS_ORIGINS", "http://localhost:5000,http://localhost:5173")
origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(health_router, prefix="/api")

app.include_router(analyzer_router)



@app.get("/")
def root():
    return {
        "message": "Resolvo AI/ML Engine Service is running",
        "docs": "/docs",
        "health": "/health"
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("app.main:app", host=host, port=port, reload=True)
