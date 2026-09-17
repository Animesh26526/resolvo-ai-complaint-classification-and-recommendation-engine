"""
Priority Engine Service
Deterministic and explainable priority scoring.
Evaluates:
- Sentiment (Negative, Neutral, Positive)
- Safety, hazard, and health risks (Hospital, allergic, poisoning, toxic, injury)
- Severity of defect or disruption (Rancid, mold, contaminated, broken glass)
- Urgency signals (Emergency, legal, lawsuit, immediate recall)
- Business & financial impact (Overcharge, bulk order loss, regulatory report)
"""

import re
from typing import Dict, Any, List, Tuple
from app.schemas.analysis_schema import PriorityResult


class PriorityEngineService:
    def __init__(self):
        # Critical safety, health, and hazard keywords -> Immediate High Priority
        self.critical_hazard_signals = [
            "allergic", "allergy", "anaphylaxis", "rash", "hives",
            "hospital", "doctor", "emergency room", "emergency", "clinic",
            "vomit", "vomiting", "nausea", "poison", "poisoning", "toxic",
            "choking", "hazard", "dangerous", "severe illness", "sick",
            "bleeding", "wound", "glass in", "broken glass", "foreign object",
            "shattered glass", "shattered", "shards", "shard", "metal fragment",
            "chemical", "burn", "burning", "mold", "fungus", "contaminated", "contamination"
        ]

        # Legal, regulatory, or severe business impact -> High Priority
        self.legal_urgency_signals = [
            "sue", "lawsuit", "lawyer", "attorney", "legal action",
            "police", "fda", "consumer forum", "fraud", "scam",
            "immediate recall", "recall product", "unacceptable"
        ]

        # Moderate severity issues -> Medium Priority
        self.moderate_severity_signals = [
            "leak", "leaking", "leaked", "broken container", "damaged",
            "dented", "torn seal", "tampered", "tamper", "seal broken",
            "spoiled", "bad smell", "foul", "rancid",
            "clumpy", "discolored", "ineffective", "missing item",
            "delayed delivery", "overcharged", "billing error", "wrong item",
            "undelivered", "lost package", "refund requested"
        ]

        # Urgency markers
        self.urgency_markers = [
            "urgent", "urgently", "immediately", "asap", "critical",
            "emergency", "need response now", "right away"
        ]

        # Informational / minor feedback markers -> Low Priority signals
        self.informational_markers = [
            "how to", "inquiry", "question", "usage instructions", "storage",
            "expiration date query", "feedback", "suggestion", "clarification",
            "curious", "recommendation", "just asking", "courtesy"
        ]

    def _clean_text(self, text: str) -> str:
        return re.sub(r"[^\w\s]", " ", text.lower())

    def _match_signal(self, sig: str, cleaned: str, words: set) -> bool:
        if " " in sig:
            return sig in cleaned
        return sig in words

    def calculate_priority(self, text: str, sentiment: str) -> PriorityResult:
        cleaned = self._clean_text(text)
        words = set(cleaned.split())

        reasons: List[str] = []
        signals: List[str] = []

        # 1. Check for Critical Hazards
        hazard_hits = [sig for sig in self.critical_hazard_signals if self._match_signal(sig, cleaned, words)]
        if hazard_hits:
            reasons.append(f"Critical health/safety hazard detected: {', '.join(hazard_hits[:3])}")
            signals.extend(hazard_hits)

        # 2. Check for Legal / Severe Regulatory Escalations
        legal_hits = [sig for sig in self.legal_urgency_signals if self._match_signal(sig, cleaned, words)]
        if legal_hits:
            reasons.append(f"High legal/business impact risk detected: {', '.join(legal_hits[:3])}")
            signals.extend(legal_hits)

        # 3. Check for Urgency Markers
        urgency_hits = [sig for sig in self.urgency_markers if self._match_signal(sig, cleaned, words)]
        if urgency_hits:
            signals.extend(urgency_hits)

        # 4. Check for Moderate Severity Signals
        moderate_hits = [sig for sig in self.moderate_severity_signals if self._match_signal(sig, cleaned, words)]
        if moderate_hits:
            signals.extend(moderate_hits)

        # 5. Check for Informational Markers
        info_hits = [sig for sig in self.informational_markers if self._match_signal(sig, cleaned, words)]

        # Evaluate final priority deterministically:
        # Rule A: Any critical hazard or legal escalation -> HIGH
        if hazard_hits or legal_hits:
            priority = "High"
            if sentiment == "Negative":
                reasons.append("Combined with Negative sentiment")

        # Rule B: Urgency markers + Negative sentiment -> HIGH
        elif urgency_hits and sentiment == "Negative":
            priority = "High"
            reasons.append(f"Urgent customer distress: {', '.join(urgency_hits[:2])} with Negative sentiment")

        # Rule C: Moderate severity issues + Negative/Neutral sentiment -> MEDIUM
        elif moderate_hits:
            if sentiment == "Negative":
                priority = "Medium"
                reasons.append(f"Operational defect ({', '.join(moderate_hits[:2])}) with Negative sentiment")
            else:
                priority = "Medium"
                reasons.append(f"Operational defect ({', '.join(moderate_hits[:2])})")

        # Rule D: Negative sentiment without specific hazard -> MEDIUM
        elif sentiment == "Negative":
            priority = "Medium"
            reasons.append("Customer expresses dissatisfaction without specific high-hazard triggers")

        # Rule E: Positive or Neutral with informational inquiries -> LOW
        else:
            priority = "Low"
            if info_hits:
                reasons.append(f"Informational/usage inquiry: {', '.join(info_hits[:2])}")
            else:
                reasons.append(f"Standard priority inquiry with {sentiment} sentiment")

        return PriorityResult(
            priority=priority,
            reasons=reasons,
            signals=list(set(signals)),
        )
