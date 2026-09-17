"""
Hugging Face Complaint Classification Service
Categorizes complaints into:
- Product (formulation, taste, smell, side-effect, quality, potency, contamination)
- Packaging (bottle, seal, cap, box, dropper, leak, crack, dent, tamper)
- Trade (shipping, courier, delay, delivery, invoice, billing, payment, wholesale)

Architecture:
- Uses a Hugging Face Zero-Shot NLI classification transformer pipeline
  (e.g., valhalla/distilbart-mnli-12-3 or facebook/bart-large-mnli)
- Loaded once on startup / first request
- Pluggable: easily slots in a future fine-tuned complaint classifier
- Transparent fallback if model is downloading or offline
"""

import logging
from typing import Dict, Any, Optional, List
from app.config import HF_CLASSIFICATION_MODEL
from app.schemas.analysis_schema import CategoryResult

logger = logging.getLogger(__name__)


class ClassificationService:
    _instance: Optional["ClassificationService"] = None
    _pipeline = None
    _model_loaded: bool = False
    _load_error: Optional[str] = None

    CANDIDATE_LABELS = [
        "the product contents, taste, or formula",
        "the physical package, bottle, or box",
        "the delivery shipping, courier, or payment",
    ]

    LABEL_TO_CATEGORY = {
        "the product contents, taste, or formula": "Product",
        "the physical package, bottle, or box": "Packaging",
        "the delivery shipping, courier, or payment": "Trade",
    }

    HYPOTHESIS_TEMPLATE = "The problem is with {}."

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ClassificationService, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        self.model_name = HF_CLASSIFICATION_MODEL or "typeform/distilbert-base-uncased-mnli"

    def load_model(self):
        """Load zero-shot classification pipeline once."""
        if self._model_loaded and self._pipeline is not None:
            return

        try:
            logger.info(f"Loading Hugging Face classification model: {self.model_name}...")
            from transformers import pipeline
            self._pipeline = pipeline(
                task="zero-shot-classification",
                model=self.model_name,
                device=-1,  # CPU
            )
            self._model_loaded = True
            self._load_error = None
            logger.info(f"Successfully loaded classification model: {self.model_name}")
        except Exception as e:
            self._model_loaded = False
            self._load_error = str(e)
            logger.warning(
                f"Could not load Hugging Face zero-shot model '{self.model_name}' ({e}). "
                "Will use domain classification fallback until model is ready."
            )

    @property
    def is_model_ready(self) -> bool:
        return self._model_loaded and self._pipeline is not None

    def analyze_category(self, text: str) -> CategoryResult:
        """
        Classify complaint into 'Product', 'Packaging', or 'Trade'.
        """
        if not text or not text.strip():
            raise ValueError("Input text cannot be empty")

        clean_text = text.strip()

        if not self._model_loaded and self._load_error is None:
            self.load_model()

        if self.is_model_ready:
            try:
                # Run zero-shot classification
                result = self._pipeline(
                    clean_text[:512],
                    candidate_labels=self.CANDIDATE_LABELS,
                    hypothesis_template=self.HYPOTHESIS_TEMPLATE,
                )
                if result and "labels" in result and "scores" in result:
                    top_label = result["labels"][0]
                    top_score = float(result["scores"][0])
                    category = self.LABEL_TO_CATEGORY.get(top_label, "Product")
                    return CategoryResult(
                        category=category,
                        confidence=round(top_score, 4),
                        model=f"zero-shot/{self.model_name}",
                    )
            except Exception as inf_err:
                logger.warning(f"Inference error with HF classifier: {inf_err}. Using domain fallback.")

        return self._fallback_category(clean_text)

    def _fallback_category(self, text: str) -> CategoryResult:
        """Domain classification fallback when transformer model is not yet loaded."""
        lower = text.lower()

        packaging_signals = [
            "package", "packaging", "box", "bottle", "container", "seal",
            "cap", "lid", "dropper", "dispenser", "broken glass", "glass",
            "leak", "leaking", "leaked", "torn", "tamper", "tampered",
            "label", "dented", "dent", "wrap", "shrink wrap", "pump",
            "crack", "cracked", "spill", "spilled"
        ]

        trade_signals = [
            "delivery", "deliver", "delivered", "shipping", "shipment",
            "courier", "dispatch", "dispatched", "order", "tracking",
            "late", "delayed", "delay", "invoice", "refund", "billing",
            "bill", "charged", "overcharged", "retailer", "distributor",
            "address", "transit", "lost", "missing item", "missing",
            "payment", "charge", "fee", "cost", "price", "receipt"
        ]

        product_signals = [
            "taste", "smell", "scent", "flavor", "sour", "bitter",
            "rancid", "expired", "expiration", "date", "ingredient",
            "ingredients", "formula", "effective", "ineffective",
            "allergy", "allergic", "reaction", "rash", "stomach",
            "nausea", "vomit", "powder", "capsule", "tablet",
            "supplement", "oil", "serum", "lotion", "texture", "color",
            "clumpy", "mold", "fungus", "contaminant", "contaminated",
            "quality", "potency", "side effect", "sick", "illness"
        ]

        pack_score = sum(2 if " " in kw and kw in lower else 1 for kw in packaging_signals if kw in lower)
        trade_score = sum(2 if " " in kw and kw in lower else 1 for kw in trade_signals if kw in lower)
        prod_score = sum(2 if " " in kw and kw in lower else 1 for kw in product_signals if kw in lower)

        scores = {
            "Packaging": pack_score,
            "Trade": trade_score,
            "Product": prod_score,
        }

        best_category = max(scores, key=scores.get)
        max_score = scores[best_category]

        confidence = 0.50
        if max_score > 0:
            total = sum(scores.values())
            confidence = min(0.95, round(max_score / total, 4))
        else:
            best_category = "Product"

        return CategoryResult(
            category=best_category,
            confidence=confidence,
            model="domain-fallback-until-hf-loaded",
        )
