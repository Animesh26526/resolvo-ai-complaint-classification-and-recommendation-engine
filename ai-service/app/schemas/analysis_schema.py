from typing import Optional, Literal, List
from pydantic import BaseModel, Field, field_validator


class AnalyzeComplaintRequest(BaseModel):
    description: str = Field(
        ...,
        description="Detailed complaint narrative or customer statement",
        example="The organic wellness lotion container was cracked upon arrival and had leaked into the packaging.",
    )
    channel: Optional[str] = Field(
        "text",
        description="Intake channel: text, email, call, chatbot, or direct",
        example="text",
    )

class AnalyzeComplaintResponse(BaseModel):
    category: Literal["Product", "Packaging", "Trade"]
    sentiment: Literal["Negative", "Neutral", "Positive"]
    priority: Literal["High", "Medium", "Low"]
    recommendation: str
    is_resolvable_by_ai: bool
    reply: Optional[str] = None
    html_guide: Optional[str] = None


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
