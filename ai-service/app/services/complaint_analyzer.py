"""
AI Complaint Analysis Service
Provides:
- Category Classification: Product, Packaging, Trade
- Sentiment Analysis: Negative, Neutral, Positive
- Priority Assignment: High, Medium, Low
- Actionable Resolution Recommendation Generation
- AI-Resolvability Decision
"""

import re
from typing import Dict, Any


class ComplaintAnalyzerService:
    def __init__(self):
        self.categories = ["Product", "Packaging", "Trade"]
        self.priorities = ["High", "Medium", "Low"]
        self.sentiments = ["Negative", "Neutral", "Positive"]

        # Keyword dictionaries for domain classification
        self.category_keywords = {
            "Packaging": [
                "package", "packaging", "box", "bottle", "container", "seal",
                "cap", "lid", "dropper", "dispenser", "broken glass", "glass",
                "leak", "leaking", "leaked", "torn", "tamper", "tampered",
                "label", "dented", "dent", "wrap", "shrink wrap", "pump",
                "crack", "cracked", "spill", "spilled"
            ],
            "Trade": [
                "delivery", "deliver", "delivered", "shipping", "shipment",
                "courier", "dispatch", "dispatched", "order", "tracking",
                "late", "delayed", "delay", "invoice", "refund", "billing",
                "bill", "charged", "overcharged", "retailer", "distributor",
                "address", "transit", "lost", "missing item", "missing",
                "payment", "charge", "fee", "cost", "price", "receipt"
            ],
            "Product": [
                "taste", "smell", "scent", "flavor", "sour", "bitter",
                "rancid", "expired", "expiration", "date", "ingredient",
                "ingredients", "formula", "effective", "ineffective",
                "allergy", "allergic", "reaction", "rash", "stomach",
                "nausea", "vomit", "powder", "capsule", "tablet",
                "supplement", "oil", "serum", "lotion", "texture", "color",
                "clumpy", "mold", "fungus", "contaminant", "contaminated",
                "quality", "potency", "side effect", "sick", "illness"
            ]
        }

        # High priority urgency and hazard triggers
        self.hazard_keywords = [
            "allergic", "allergy", "reaction", "rash", "hospital",
            "doctor", "vomit", "vomiting", "nausea", "poison", "toxic",
            "contaminant", "contaminated", "foreign object", "broken glass",
            "shattered glass", "bleeding", "choking", "hazard", "dangerous",
            "severe illness", "sue", "lawsuit", "legal", "police", "fraud",
            "emergency", "unacceptable", "urgent"
        ]

        # Medium priority signals
        self.medium_keywords = [
            "leak", "leaking", "broken", "damaged", "dented", "torn",
            "spoiled", "bad smell", "rancid", "ineffective", "clumpy",
            "missing", "delayed", "overcharged", "refund", "wrong item",
            "failed", "tampered"
        ]

        # Sentiment indicators
        self.negative_keywords = [
            "terrible", "awful", "horrible", "furious", "angry", "disgusted",
            "disappointed", "bad", "poor", "broken", "delayed", "missing",
            "leaked", "damaged", "wrong", "defective", "waste", "unhappy",
            "problem", "issue", "fail", "failed", "hate", "worst", "ridiculous",
            "frustrated", "frustrating"
        ]

        self.positive_keywords = [
            "good", "great", "nice", "love", "like", "helpful", "appreciate",
            "thanks", "thank you", "excellent", "pleased", "satisfied"
        ]

    def _clean_text(self, text: str) -> str:
        return re.sub(r"[^\w\s]", " ", text.lower())

    def classify_category(self, text: str) -> str:
        cleaned = self._clean_text(text)
        words = set(cleaned.split())

        scores = {cat: 0 for cat in self.categories}

        for category, kws in self.category_keywords.items():
            for kw in kws:
                if " " in kw:
                    if kw in cleaned:
                        scores[category] += 2
                else:
                    if kw in words:
                        scores[category] += 1

        best_category = max(scores, key=scores.get)
        if scores[best_category] == 0:
            return "Product"  # Default domain category
        return best_category

    def analyze_sentiment(self, text: str) -> str:
        cleaned = self._clean_text(text)
        words = set(cleaned.split())

        neg_score = sum(1 for kw in self.negative_keywords if kw in words or kw in cleaned)
        pos_score = sum(1 for kw in self.positive_keywords if kw in words or kw in cleaned)

        # Check hazard words as heavy negative weights
        hazard_hits = sum(1 for hw in self.hazard_keywords if hw in cleaned)
        neg_score += hazard_hits * 2

        if neg_score > pos_score and neg_score > 0:
            return "Negative"
        elif pos_score > neg_score and pos_score > 0:
            return "Positive"
        else:
            return "Neutral"

    def assign_priority(self, text: str, sentiment: str) -> str:
        cleaned = self._clean_text(text)

        for hw in self.hazard_keywords:
            if hw in cleaned:
                return "High"

        if sentiment == "Negative":
            for mw in self.medium_keywords:
                if mw in cleaned:
                    return "Medium"
            return "Medium"

        for mw in self.medium_keywords:
            if mw in cleaned:
                return "Medium"

        return "Low"

    def generate_recommendation(self, category: str, priority: str, sentiment: str) -> str:
        recommendations = {
            "Product": {
                "High": (
                    "Immediate safety escalation: Advise customer to discontinue product use immediately. "
                    "Log batch and lot numbers for quality assurance quarantine. Issue an immediate full refund "
                    "and schedule a follow-up consultation with wellness support."
                ),
                "Medium": (
                    "Product quality resolution: Offer a complimentary replacement from an independently tested batch "
                    "or issue store credit. Request batch details and photo documentation for internal quality log."
                ),
                "Low": (
                    "Product guidance: Provide clear instructions on recommended usage and storage guidelines. "
                    "Offer a courtesy 10% satisfaction discount on the customer's next order."
                )
            },
            "Packaging": {
                "High": (
                    "Packaging hazard alert: Check for risk of product contamination or user injury due to broken glass/tampered seal. "
                    "Arrange urgent priority courier dispatch of replacement unit with heavy-duty protective packaging."
                ),
                "Medium": (
                    "Packaging defect resolution: Ship a replacement product immediately with reinforced packaging. "
                    "Report damaged packaging container issue to manufacturing and logistics QA teams."
                ),
                "Low": (
                    "Packaging feedback: Acknowledge cosmetic packaging feedback for packaging design team. "
                    "Provide a courtesy discount voucher for customer goodwill."
                )
            },
            "Trade": {
                "High": (
                    "Urgent trade escalation: Initiate priority trace with logistics partner. Issue an immediate reshipment "
                    "or complete order refund, waive shipping charges, and assign ticket directly to Senior Support Executive."
                ),
                "Medium": (
                    "Logistics and billing support: Request courier delivery confirmation or adjust billing discrepancy within 24 hours. "
                    "Send updated tracking link directly to the customer."
                ),
                "Low": (
                    "Standard order clarification: Provide verified shipment tracking details and expected delivery window. "
                    "Confirm current order details and dispatch timeline."
                )
            }
        }

        cat_dict = recommendations.get(category, recommendations["Product"])
        return cat_dict.get(priority, cat_dict["Medium"])

    def evaluate_ai_resolvability(self, priority: str, sentiment: str, text: str) -> bool:
        cleaned = self._clean_text(text)

        # High priority tickets always require human CSE review
        if priority == "High":
            return False

        # Physical damages, refunds, or harsh negatives require formal CSE handling
        action_required_terms = ["refund", "replacement", "broken", "allergic", "lawsuit", "doctor", "stolen", "lost"]
        for term in action_required_terms:
            if term in cleaned:
                return False

        # Low priority non-negative inquiries can be resolved directly by AI recommendation
        if priority == "Low" and sentiment != "Negative":
            return True

        return False

    def analyze(self, description: str, channel: str = "text") -> Dict[str, Any]:
        if not description or not description.strip():
            raise ValueError("Complaint description cannot be empty")

        category = self.classify_category(description)
        sentiment = self.analyze_sentiment(description)
        priority = self.assign_priority(description, sentiment)
        recommendation = self.generate_recommendation(category, priority, sentiment)
        is_resolvable = self.evaluate_ai_resolvability(priority, sentiment, description)

        return {
            "category": category,
            "sentiment": sentiment,
            "priority": priority,
            "recommendation": recommendation,
            "is_resolvable_by_ai": is_resolvable,
        }
