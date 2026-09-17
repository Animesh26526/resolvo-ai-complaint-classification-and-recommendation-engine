from fastapi import APIRouter, HTTPException, status
from app.schemas.analysis_schema import (
    AnalyzeComplaintRequest,
    AnalyzeComplaintResponse,
)
from app.services.complaint_analyzer import ComplaintAnalyzerService

router = APIRouter(tags=["AI Complaint Analysis"])

analyzer_service = ComplaintAnalyzerService()


@router.post(
    "/analyze", 
    response_model=AnalyzeComplaintResponse, 
    status_code=status.HTTP_200_OK
)
@router.post(
    "/api/analyze", 
    response_model=AnalyzeComplaintResponse, 
    status_code=status.HTTP_200_OK
)
async def analyze_complaint(payload: AnalyzeComplaintRequest):
    try:
        result = await analyzer_service.analyze(
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
            detail=f"An error occurred while analyzing the complaint: {str(err)}"
        )
