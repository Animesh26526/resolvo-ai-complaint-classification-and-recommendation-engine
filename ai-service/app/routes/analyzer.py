from typing import Optional, Literal
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field, field_validator

from app.services.complaint_analyzer import ComplaintAnalyzerService

router = APIRouter(tags=["AI Complaint Analysis"])

analyzer_service = ComplaintAnalyzerService()


class AnalyzeComplaintRequest(BaseModel):
    description: str = Field(..., min_length=3, description="Detailed complaint narrative", example="The herbal lotion bottle arrived cracked and leaked everywhere.")
    channel: Optional[str] = Field("text", description="Complaint channel e.g. text, call, chatbot, email, direct", example="text")

    @field_validator("description")
    @classmethod
    def validate_description(cls, v: str) -> str:
        if not v or not v.strip() or len(v.strip()) < 3:
            raise ValueError("Complaint description must contain at least 3 non-whitespace characters")
        return v.strip()


class AnalyzeComplaintResponse(BaseModel):
    category: Literal["Product", "Packaging", "Trade"]
    sentiment: Literal["Negative", "Neutral", "Positive"]
    priority: Literal["High", "Medium", "Low"]
    recommendation: str
    is_resolvable_by_ai: bool


@router.post("/analyze", response_model=AnalyzeComplaintResponse, status_code=status.HTTP_200_OK)
@router.post("/api/analyze", response_model=AnalyzeComplaintResponse, status_code=status.HTTP_200_OK)
def analyze_complaint(payload: AnalyzeComplaintRequest):
    try:
        result = analyzer_service.analyze(
            description=payload.description,
            channel=payload.channel or "text"
        )
        return result
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err)
        )
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while analyzing the complaint"
        )
