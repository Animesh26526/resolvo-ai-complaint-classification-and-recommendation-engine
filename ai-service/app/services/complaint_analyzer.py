"""
Multi-Model Complaint Analysis Orchestrator
Orchestrates:
1. Hugging Face Sentiment Model (cardiffnlp/twitter-roberta-base-sentiment-latest)
2. Hugging Face Classification Model (Product, Packaging, Trade)
3. Priority Engine (Deterministic, explainable High/Medium/Low based on sentiment + urgency + hazard)
4. GPT-OSS-20B (Actionable resolution recommendation + AI-resolvability decision)
"""

import logging
from typing import Dict, Any, Optional
from app.schemas.analysis_schema import (
    AnalyzeComplaintResponse,
    SentimentResult,
    CategoryResult,
    PriorityResult,
)
from app.services.sentiment_service import SentimentService
from app.services.classification_service import ClassificationService
from app.services.priority_service import PriorityEngineService
from app.services.gpt_oss_service import GptOssService

logger = logging.getLogger(__name__)


class ComplaintAnalyzerService:
    def __init__(self):
        self.sentiment_service = SentimentService()
        self.classification_service = ClassificationService()
        self.priority_service = PriorityEngineService()
        self.gpt_oss_service = GptOssService()

    async def analyze(self, description: str, channel: str = "text") -> Dict[str, Any]:
        """
        Orchestrate multi-model complaint analysis.
        Returns dictionary matching AnalyzeComplaintResponse schema:
        {
            "category": "Product" | "Packaging" | "Trade",
            "sentiment": "Negative" | "Neutral" | "Positive",
            "priority": "High" | "Medium" | "Low",
            "recommendation": "...",
            "is_resolvable_by_ai": bool
        }
        """
        if not description or not description.strip():
            raise ValueError("Complaint description cannot be empty")

        clean_text = description.strip()
        if len(clean_text) < 3:
            raise ValueError("Complaint description must contain at least 3 non-whitespace characters")

        # Step 1: Hugging Face Sentiment Analysis
        sentiment_res: SentimentResult = self.sentiment_service.analyze_sentiment(clean_text)

        # Step 2: Hugging Face Category Classification
        category_res: CategoryResult = self.classification_service.analyze_category(clean_text)

        # Step 3: Transparent Priority Engine
        priority_res: PriorityResult = self.priority_service.calculate_priority(
            clean_text, 
            sentiment_res.sentiment
        )

        # Step 4: GPT-OSS-20B Resolution Recommendation & AI-Resolvability Decision
        recommendation, is_resolvable = await self.gpt_oss_service.generate_resolution_and_decision(
            complaint=clean_text,
            category=category_res.category,
            sentiment=sentiment_res.sentiment,
            priority=priority_res.priority,
        )

        # Safety Guard: High priority tickets can NEVER be resolved purely by AI
        if priority_res.priority == "High":
            is_resolvable = False

        # Return strictly matching contract
        return {
            "category": category_res.category,
            "sentiment": sentiment_res.sentiment,
            "priority": priority_res.priority,
            "recommendation": recommendation,
            "is_resolvable_by_ai": is_resolvable,
        }
