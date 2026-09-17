"""
GPT-OSS-20B Service
Provides:
1. Actionable resolution recommendation generation
2. AI-resolvability decision (is_resolvable_by_ai: bool)
3. Conversational chatbot support (POST /api/chat)
4. Robust JSON extraction, Pydantic validation, and graceful fallback
"""

import os
import json
import logging
import httpx
from typing import Dict, Any, Optional, List, Tuple
from app.config import (
    GPT_OSS_BASE_URL,
    GPT_OSS_MODEL,
    GPT_OSS_API_KEY,
)
from app.schemas.chatbot_schema import ChatMessage, ChatResponse

logger = logging.getLogger(__name__)


class GptOssService:
    def __init__(self):
        self.base_url = GPT_OSS_BASE_URL.rstrip("/") if GPT_OSS_BASE_URL else None
        self.model = GPT_OSS_MODEL or "gpt-oss-20b"
        self.api_key = GPT_OSS_API_KEY or "not-needed"
        self.timeout = 15.0

    def is_available(self) -> bool:
        """Check if an external GPT-OSS inference endpoint is configured."""
        return bool(self.base_url)

    async def generate_resolution_and_decision(
        self,
        complaint: str,
        category: str,
        sentiment: str,
        priority: str,
    ) -> Tuple[str, bool]:
        """
        Generate actionable recommendation and AI-resolvability decision using LLM endpoint.
        Raises an error if the endpoint fails so the user can fix the issue.
        """
        if not self.is_available():
            raise RuntimeError(
                "GPT_OSS_BASE_URL is not configured in .env. "
                "Please configure GPT_OSS_BASE_URL (e.g. https://api.openai.com/v1) and GPT_OSS_API_KEY."
            )

        return await self._call_llm_resolution(
            complaint=complaint,
            category=category,
            sentiment=sentiment,
            priority=priority,
        )

    async def _call_llm_resolution(
        self,
        complaint: str,
        category: str,
        sentiment: str,
        priority: str,
    ) -> Tuple[Optional[str], bool]:
        prompt = (
            f"You are the senior resolution advisor for a wellness and consumer goods company.\n"
            f"Analyze the following complaint details:\n"
            f"- Complaint: {complaint}\n"
            f"- Category: {category}\n"
            f"- Sentiment: {sentiment}\n"
            f"- Priority: {priority}\n\n"
            f"Instructions:\n"
            f"1. Generate an actionable, specific operational resolution recommendation for Customer Support Executives and the customer.\n"
            f"   Avoid generic advice like 'contact support'. Do not make unsupported promises.\n"
            f"2. Determine 'is_resolvable_by_ai' (boolean):\n"
            f"   - Must be FALSE for any safety hazard, health reaction, damage, physical inspection, refund/charge dispute, legal concern, or High/Medium priority ticket requiring human review.\n"
            f"   - Can only be TRUE if it is a Low priority informational inquiry with clear, self-service advice.\n\n"
            f"Return strictly valid JSON only in this schema:\n"
            f'{{"recommendation": "...", "is_resolvable_by_ai": false}}'
        )

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
        }
        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": "system",
                    "content": "You are a customer complaint resolution engine. You must output only raw JSON.",
                },
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.2,
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            endpoint = f"{self.base_url}/chat/completions"
            try:
                response = await client.post(endpoint, headers=headers, json=payload)
            except Exception as conn_err:
                raise RuntimeError(f"Failed to connect to LLM endpoint ({endpoint}): {conn_err}")

            if response.status_code == 200:
                data = response.json()
                content = data["choices"][0]["message"]["content"]
                parsed = self._extract_json(content)
                if parsed and "recommendation" in parsed and "is_resolvable_by_ai" in parsed:
                    rec = str(parsed["recommendation"]).strip()
                    resolvable = bool(parsed["is_resolvable_by_ai"])
                    # Guard: High priority can never be resolved by AI
                    if priority == "High":
                        resolvable = False
                    return rec, resolvable
                raise ValueError(f"LLM returned response but schema could not be parsed: {content}")

            err_detail = response.text
            try:
                err_json = response.json()
                if "error" in err_json and "message" in err_json["error"]:
                    err_detail = err_json["error"]["message"]
            except Exception:
                pass

            raise RuntimeError(
                f"LLM Endpoint Error (HTTP {response.status_code}): {err_detail}"
            )

    def _extract_json(self, raw_text: str) -> Optional[Dict[str, Any]]:
        text = raw_text.strip()
        # Remove markdown codeblocks if present
        if text.startswith("```"):
            lines = text.splitlines()
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].startswith("```"):
                lines = lines[:-1]
            text = "\n".join(lines).strip()

        try:
            return json.loads(text)
        except Exception:
            # Try to find JSON substring
            start = text.find("{")
            end = text.rfind("}")
            if start != -1 and end != -1:
                try:
                    return json.loads(text[start : end + 1])
                except Exception:
                    pass
        return None

    def _deterministic_resolution_engine(
        self,
        complaint: str,
        category: str,
        sentiment: str,
        priority: str,
    ) -> Tuple[str, bool]:
        """High-quality deterministic resolution templates mapped by Category x Priority."""
        resolutions = {
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
                ),
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
                ),
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
                ),
            },
        }

        cat_dict = resolutions.get(category, resolutions["Product"])
        recommendation = cat_dict.get(priority, cat_dict["Medium"])

        # Determine AI-resolvability
        is_resolvable = False
        lower = complaint.lower()
        action_required = ["refund", "replacement", "broken", "allergic", "lawsuit", "doctor", "stolen", "lost", "leak", "damaged"]
        has_action_trigger = any(term in lower for term in action_required)

        if priority == "Low" and sentiment != "Negative" and not has_action_trigger:
            is_resolvable = True

        return recommendation, is_resolvable

    async def chat(
        self,
        message: str,
        history: Optional[List[ChatMessage]] = None,
        complaint_context: Optional[Dict[str, Any]] = None,
    ) -> ChatResponse:
        """Conversational chatbot driven by Groq / LLM endpoint."""
        if not self.is_available():
            raise RuntimeError(
                "GPT_OSS_BASE_URL is not configured in .env. "
                "Please configure GPT_OSS_BASE_URL (e.g. https://api.groq.com/openai/v1) and GPT_OSS_API_KEY."
            )
        return await self._call_llm_chat(message, history, complaint_context)

    async def _call_llm_chat(
        self,
        message: str,
        history: Optional[List[ChatMessage]] = None,
        complaint_context: Optional[Dict[str, Any]] = None,
    ) -> Optional[ChatResponse]:
        messages = [
            {
                "role": "system",
                "content": (
                    "You are Resolvo's AI Customer Support Assistant for an organic wellness products company.\n"
                    "Your duties:\n"
                    "- Help customers resolve inquiries or guide them through submitting a complaint.\n"
                    "- Explain resolution options clearly.\n"
                    "- Never pretend you have already refunded or dispatched physical items.\n"
                    "- If customer reports physical defects, contamination, billing errors, or illness, mark requires_complaint=true.\n"
                    "- If customer expresses extreme distress, safety risk, or threats of legal action, mark escalate=true.\n"
                    "Output strictly valid JSON:\n"
                    "{\n"
                    '  "reply": "Your conversational response",\n'
                    '  "requires_complaint": true/false,\n'
                    '  "suggested_action": "...",\n'
                    '  "escalate": true/false\n'
                    "}"
                ),
            }
        ]

        if complaint_context:
            messages.append({
                "role": "system",
                "content": f"Active Complaint Context: {json.dumps(complaint_context)}",
            })

        if history:
            for turn in history[-5:]:  # keep last 5 turns
                messages.append({"role": turn.role, "content": turn.content})

        messages.append({"role": "user", "content": message})

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
        }
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.3,
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            endpoint = f"{self.base_url}/chat/completions"
            try:
                response = await client.post(endpoint, headers=headers, json=payload)
            except Exception as conn_err:
                raise RuntimeError(f"Failed to connect to LLM chat endpoint ({endpoint}): {conn_err}")

            if response.status_code == 200:
                data = response.json()
                content = data["choices"][0]["message"]["content"]
                parsed = self._extract_json(content)
                if parsed and "reply" in parsed:
                    return ChatResponse(
                        reply=str(parsed["reply"]).strip(),
                        requires_complaint=bool(parsed.get("requires_complaint", False)),
                        suggested_action=parsed.get("suggested_action"),
                        escalate=bool(parsed.get("escalate", False)),
                    )
                raise ValueError(f"LLM chat response could not be parsed: {content}")

            err_detail = response.text
            try:
                err_json = response.json()
                if "error" in err_json and "message" in err_json["error"]:
                    err_detail = err_json["error"]["message"]
            except Exception:
                pass

            raise RuntimeError(
                f"LLM Chat Error (HTTP {response.status_code}): {err_detail}"
            )

    def _deterministic_chat_response(
        self,
        message: str,
        complaint_context: Optional[Dict[str, Any]] = None,
    ) -> ChatResponse:
        lower = message.lower()

        # Check for extreme escalation signals
        escalate_triggers = ["hospital", "lawyer", "sue", "police", "poison", "bleeding", "severe allergy"]
        if any(w in lower for w in escalate_triggers):
            return ChatResponse(
                reply=(
                    "I understand this is an urgent and critical matter. Your safety is our highest priority. "
                    "I am flagging your case for immediate priority escalation to a Senior Customer Support Executive. "
                    "If you are experiencing a medical emergency, please seek professional healthcare assistance right away."
                ),
                requires_complaint=True,
                suggested_action="Immediate Senior CSE Escalation",
                escalate=True,
            )

        # Check for damage / defect complaints
        complaint_triggers = ["broken", "damaged", "leak", "spoiled", "expired", "missing", "wrong item", "overcharged", "refund", "smashed", "shattered", "defect", "defective"]
        if any(w in lower for w in complaint_triggers):
            return ChatResponse(
                reply=(
                    "I am very sorry to hear about the issue with your order. We want to make this right for you. "
                    "Please submit this as a formal complaint so our Customer Support Executive team can verify your batch details "
                    "and initiate a replacement or full refund promptly."
                ),
                requires_complaint=True,
                suggested_action="Register Formal Complaint in Resolvo portal",
                escalate=False,
            )

        # Informational / standard response
        return ChatResponse(
            reply=(
                "Hello! I am your Resolvo Wellness Support Assistant. How can I help you today? "
                "You can ask questions regarding product usage, check the status of an existing complaint, "
                "or report any packaging, product, or delivery issues."
            ),
            requires_complaint=False,
            suggested_action="Inquire or register a complaint if needed",
            escalate=False,
        )
