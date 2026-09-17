from typing import Optional, Literal, List
from pydantic import BaseModel, Field, field_validator


class AnalyzeComplaintRequest(BaseModel):
    description: str = Field(
        ...,
        min_length=3,
        description="Detailed complaint narrative or customer statement",
        example="The organic wellness lotion container was cracked upon arrival and had leaked into the packaging.",
    )
    channel: Optional[str] = Field(
        "text",
        description="Intake channel: text, email, call, chatbot, or direct",
        example="text",
    )

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


class SentimentResult(BaseModel):
    sentiment: Literal["Negative", "Neutral", "Positive"]
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    model: str = "cardiffnlp/twitter-roberta-base-sentiment-latest"


class CategoryResult(BaseModel):
    category: Literal["Product", "Packaging", "Trade"]
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    model: str


class PriorityResult(BaseModel):
    priority: Literal["High", "Medium", "Low"]
    reasons: List[str] = Field(default_factory=list)
    signals: List[str] = Field(default_factory=list)
