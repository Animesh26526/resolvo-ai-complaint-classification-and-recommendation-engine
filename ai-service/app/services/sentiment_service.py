"""
Hugging Face Sentiment Analysis Service
Uses: cardiffnlp/twitter-roberta-base-sentiment-latest
Outputs: Positive, Neutral, Negative with confidence score.

Architecture:
- Singleton model instance loaded once on startup / first request.
- Runs inference on CPU (device=-1).
- Includes graceful fallback if offline or during initial download.
"""

import logging
from typing import Dict, Any, Optional
from app.config import HF_SENTIMENT_MODEL
from app.schemas.analysis_schema import SentimentResult

logger = logging.getLogger(__name__)


class SentimentService:
    _instance: Optional["SentimentService"] = None
    _pipeline = None
    _model_loaded: bool = False
    _load_error: Optional[str] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SentimentService, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        self.model_name = HF_SENTIMENT_MODEL or "cardiffnlp/twitter-roberta-base-sentiment-latest"

    def load_model(self):
        """Load transformer pipeline once."""
        if self._model_loaded and self._pipeline is not None:
            return

        try:
            logger.info(f"Loading Hugging Face sentiment model: {self.model_name}...")
            from transformers import pipeline
            self._pipeline = pipeline(
                task="sentiment-analysis",
                model=self.model_name,
                device=-1,  # CPU
                top_k=None,  # Return all scores
            )
            self._model_loaded = True
            self._load_error = None
            logger.info(f"Successfully loaded sentiment model: {self.model_name}")
        except Exception as e:
            self._model_loaded = False
            self._load_error = str(e)
            logger.warning(
                f"Could not load Hugging Face sentiment model '{self.model_name}' ({e}). "
                "Will use heuristic sentiment fallback until model is ready."
            )

    @property
    def is_model_ready(self) -> bool:
        return self._model_loaded and self._pipeline is not None

    def analyze_sentiment(self, text: str) -> SentimentResult:
        """
        Analyze text sentiment.
        Returns: SentimentResult with sentiment in {'Positive', 'Neutral', 'Negative'}
        """
        if not text or not text.strip():
            raise ValueError("Input text cannot be empty")

        clean_text = text.strip()

        # Try to load if not yet attempted
        if not self._model_loaded and self._load_error is None:
            self.load_model()

        if self.is_model_ready:
            try:
                # HF pipeline returns list of dictionaries [{'label': 'positive', 'score': 0.98}, ...]
                raw_outputs = self._pipeline(clean_text[:512])  # Truncate to RoBERTa context window
                if raw_outputs and isinstance(raw_outputs, list):
                    scores_list = raw_outputs[0] if isinstance(raw_outputs[0], list) else raw_outputs
                    best_item = max(scores_list, key=lambda x: x.get("score", 0.0))
                    raw_label = best_item.get("label", "").lower()
                    score = float(best_item.get("score", 0.0))

                    if "pos" in raw_label:
                        normalized = "Positive"
                    elif "neg" in raw_label:
                        normalized = "Negative"
                    else:
                        normalized = "Neutral"

                    return SentimentResult(
                        sentiment=normalized,
                        confidence=round(score, 4),
                        model=self.model_name,
                    )
            except Exception as inf_err:
                logger.warning(f"Inference error with HF sentiment model: {inf_err}. Using fallback.")

        # Heuristic fallback if model not loaded or error occurred
        return self._fallback_sentiment(clean_text)

    def _fallback_sentiment(self, text: str) -> SentimentResult:
        """Transparent heuristic fallback when HuggingFace model is not yet loaded."""
        lower = text.lower()
        negative_signals = [
            "terrible", "awful", "horrible", "furious", "angry", "disgusted",
            "disappointed", "bad", "poor", "broken", "delayed", "missing",
            "leaked", "damaged", "wrong", "defective", "waste", "unhappy",
            "problem", "issue", "fail", "failed", "hate", "worst", "ridiculous",
            "frustrated", "frustrating", "allergic", "reaction", "rash", "sick",
            "spoiled", "rancid", "tampered", "unacceptable", "poison", "hospital"
        ]
        positive_signals = [
            "good", "great", "nice", "love", "like", "helpful", "appreciate",
            "thanks", "thank you", "excellent", "pleased", "satisfied", "wonderful"
        ]

        neg_count = sum(1 for w in negative_signals if w in lower)
        pos_count = sum(1 for w in positive_signals if w in lower)

        if neg_count > pos_count:
            sentiment = "Negative"
            confidence = min(0.95, 0.60 + neg_count * 0.1)
        elif pos_count > neg_count:
            sentiment = "Positive"
            confidence = min(0.95, 0.60 + pos_count * 0.1)
        else:
            sentiment = "Neutral"
            confidence = 0.50

        return SentimentResult(
            sentiment=sentiment,
            confidence=round(confidence, 4),
            model="heuristic-fallback-until-hf-loaded",
        )
