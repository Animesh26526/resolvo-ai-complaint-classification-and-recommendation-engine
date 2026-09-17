from typing import Optional
from pydantic import BaseModel, Field
from .analysis_schema import AnalyzeComplaintResponse


class TranscriptionResponse(BaseModel):
    transcript: str = Field(..., description="Clean text transcript extracted from audio")
    confidence: Optional[float] = Field(default=None, description="Transcription confidence score")
    language: Optional[str] = Field(default="en", description="Detected or specified spoken language")
    model_used: Optional[str] = Field(default=None, description="Gemini or speech model utilized")


class AudioComplaintResponse(BaseModel):
    transcript: str = Field(..., description="Clean audio transcription")
    analysis: AnalyzeComplaintResponse = Field(..., description="Full multi-model complaint analysis")
