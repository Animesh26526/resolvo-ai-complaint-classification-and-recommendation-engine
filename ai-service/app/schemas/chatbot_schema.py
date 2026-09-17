from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, Field, field_validator


class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"] = Field(
        ..., 
        description="Role of the conversational speaker"
    )
    content: str = Field(..., description="Message text content")


class ChatRequest(BaseModel):
    message: str = Field(
        ..., 
        min_length=1, 
        description="User's query or conversational statement",
        example="My product arrived damaged. What should I do?"
    )
    history: Optional[List[ChatMessage]] = Field(
        default_factory=list,
        description="Prior conversational turns for dialogue context"
    )
    complaint_context: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Optional active complaint metadata (category, status, etc.)"
    )

    @field_validator("message")
    @classmethod
    def validate_message(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Chat message cannot be empty")
        return v.strip()


class ChatResponse(BaseModel):
    reply: str = Field(..., description="Helpful, non-hallucinatory AI conversational response")
    requires_complaint: bool = Field(
        default=False, 
        description="Indicates whether the inquiry should be formally submitted as a complaint"
    )
    suggested_action: Optional[str] = Field(
        default=None, 
        description="Recommended next step for the customer"
    )
    escalate: bool = Field(
        default=False, 
        description="Whether this conversation indicates an urgent need for human CSE escalation"
    )
