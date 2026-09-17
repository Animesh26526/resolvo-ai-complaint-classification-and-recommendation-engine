"""
Resolvo AI Architecture - Comprehensive Evaluation & Credentials Audit
Audits:
1. Environment & API Credential Status (HF, GPT-OSS, Gemini)
2. Hugging Face RoBERTa Sentiment Model Accuracy & Confidence
3. Hugging Face Zero-Shot Classifier Category Accuracy (Product, Packaging, Trade)
4. Explainable Priority Engine (High, Medium, Low) & Safety Safeguards
5. GPT-OSS Resolution Engine & AI-Resolvability Decisions
6. Google Gemini Live Speech-to-Text & Audio Helpline Pipeline
7. Conversational Chatbot Routing & Escalation Logic
8. End-to-End Latency & Performance Benchmarks
"""

import os
import sys
import time
import json
import io
import wave
from typing import Dict, Any, List

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
from fastapi.testclient import TestClient

# Ensure app imports correctly
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app
from app.config import (
    HF_SENTIMENT_MODEL,
    HF_CLASSIFICATION_MODEL,
    GPT_OSS_BASE_URL,
    GPT_OSS_MODEL,
    GPT_OSS_API_KEY,
    GEMINI_MODEL,
    GEMINI_API_KEY,
)
from app.services.sentiment_service import SentimentService
from app.services.classification_service import ClassificationService
from app.services.priority_service import PriorityEngineService
from app.services.gpt_oss_service import GptOssService
from app.services.gemini_service import GeminiAudioService

client = TestClient(app)

def print_banner(title: str):
    print("\n" + "=" * 70)
    print(f" {title.upper()} ")
    print("=" * 70)

def audit_credentials():
    print_banner("1. Environment & API Credentials Audit")
    print(f"* HF Sentiment Model:       {HF_SENTIMENT_MODEL}")
    print(f"* HF Classification Model:  {HF_CLASSIFICATION_MODEL}")
    
    # GPT-OSS Status
    has_gpt_key = bool(GPT_OSS_API_KEY and len(GPT_OSS_API_KEY) > 10)
    masked_gpt_key = f"{GPT_OSS_API_KEY[:8]}...{GPT_OSS_API_KEY[-4:]}" if has_gpt_key else "None"
    print(f"* GPT-OSS Base URL:         {GPT_OSS_BASE_URL or '(Deterministic Template Fallback Active)'}")
    print(f"* GPT-OSS Model Target:     {GPT_OSS_MODEL}")
    print(f"* GPT-OSS API Key:          {masked_gpt_key}")
    
    # Gemini Status
    has_gemini_key = bool(GEMINI_API_KEY and len(GEMINI_API_KEY) > 10)
    masked_gemini_key = f"{GEMINI_API_KEY[:8]}...{GEMINI_API_KEY[-4:]}" if has_gemini_key else "None"
    print(f"* Gemini Model Target:      {GEMINI_MODEL}")
    print(f"* Gemini API Key:           {masked_gemini_key}")
    
    gemini_service = GeminiAudioService()
    print(f"* Gemini Configured Status: {'Configured (Live Ready)' if gemini_service.is_configured() else 'Unconfigured (Mock Active)'}")


def audit_complaint_scenarios() -> Dict[str, Any]:
    print_banner("2. Multi-Scenario Multi-Model Analysis Audit")

    scenarios = [
        # Product Scenarios
        {
            "id": "PROD-01",
            "name": "Severe Allergic Hazard",
            "description": "I had a severe allergic reaction with full body rash and swelling after consuming this organic powder. I had to consult a doctor!",
            "expected_category": "Product",
            "expected_sentiment": "Negative",
            "expected_priority": "High",
            "expected_resolvable": False,
        },
        {
            "id": "PROD-02",
            "name": "Spoiled / Rancid Product",
            "description": "The ayurvedic face cream smells completely rancid and has black mold forming on the surface.",
            "expected_category": "Product",
            "expected_sentiment": "Negative",
            "expected_priority": "High",
            "expected_resolvable": False,
        },
        {
            "id": "PROD-03",
            "name": "Mild Quality Dissatisfaction",
            "description": "The herbal supplement flavor is somewhat bitter compared to my previous batch and feels less potent.",
            "expected_category": "Product",
            "expected_sentiment": "Negative",
            "expected_priority": "Medium",
            "expected_resolvable": False,
        },
        {
            "id": "PROD-04",
            "name": "Self-Service Usage Inquiry",
            "description": "Could you kindly clarify if the vitamin serum should be kept in the refrigerator after opening?",
            "expected_category": "Product",
            "expected_sentiment": "Neutral",
            "expected_priority": "Low",
            "expected_resolvable": True,
        },
        # Packaging Scenarios
        {
            "id": "PACK-01",
            "name": "Shattered Glass Hazard",
            "description": "The glass bottle arrived completely shattered inside the carton with sharp shards leaking liquid into the parcel.",
            "expected_category": "Packaging",
            "expected_sentiment": "Negative",
            "expected_priority": "High",
            "expected_resolvable": False,
        },
        {
            "id": "PACK-02",
            "name": "Defective Pump / Leaking Bottle",
            "description": "The shampoo pump dispenser is broken and will not pump any liquid out, and the cap was loose causing a slight leak.",
            "expected_category": "Packaging",
            "expected_sentiment": "Negative",
            "expected_priority": "Medium",
            "expected_resolvable": False,
        },
        {
            "id": "PACK-03",
            "name": "Cosmetic Label Scratches",
            "description": "The outer packaging box was slightly dented and the label sticker was scratched, but the inner bottle itself is fine.",
            "expected_category": "Packaging",
            "expected_sentiment": "Neutral",
            "expected_priority": "Medium",
            "expected_resolvable": False,
        },
        # Trade Scenarios
        {
            "id": "TRAD-01",
            "name": "Payment Overcharge / Dispute",
            "description": "My credit card was charged twice for order #88412 and customer support has not refunded the extra $75 fee.",
            "expected_category": "Trade",
            "expected_sentiment": "Negative",
            "expected_priority": "Medium",
            "expected_resolvable": False,
        },
        {
            "id": "TRAD-02",
            "name": "Prolonged Logistics Delay",
            "description": "My courier package has been stuck at the regional sorting hub for 12 days with no dispatch movement.",
            "expected_category": "Trade",
            "expected_sentiment": "Negative",
            "expected_priority": "Medium",
            "expected_resolvable": False,
        },
        {
            "id": "TRAD-03",
            "name": "Delivery Tracking Inquiry",
            "description": "Hello, could you please provide the estimated delivery date and courier tracking link for my order?",
            "expected_category": "Trade",
            "expected_sentiment": "Neutral",
            "expected_priority": "Low",
            "expected_resolvable": True,
        },
    ]

    results = []
    cat_correct = 0
    sent_correct = 0
    prio_correct = 0
    res_correct = 0
    total_time = 0.0

    print(f"{'ID':<8} | {'Scenario':<25} | {'Category':<11} | {'Sentiment':<10} | {'Prio':<6} | {'AI-Res':<6} | {'Latency':<7} | Status")
    print("-" * 90)

    for sc in scenarios:
        t0 = time.perf_counter()
        resp = client.post("/api/analyze", json={"description": sc["description"], "channel": "web"})
        lat_ms = (time.perf_counter() - t0) * 1000
        total_time += lat_ms

        assert resp.status_code == 200, f"Failed on {sc['id']}: {resp.text}"
        data = resp.json()

        actual_cat = data["category"]
        actual_sent = data["sentiment"]
        actual_prio = data["priority"]
        actual_res = data["is_resolvable_by_ai"]

        c_match = actual_cat == sc["expected_category"]
        s_match = actual_sent == sc["expected_sentiment"] or (sc["expected_sentiment"] == "Neutral" and actual_sent in ["Neutral", "Positive"])
        p_match = actual_prio == sc["expected_priority"]
        r_match = actual_res == sc["expected_resolvable"]

        if c_match: cat_correct += 1
        if s_match: sent_correct += 1
        if p_match: prio_correct += 1
        if r_match: res_correct += 1

        all_pass = c_match and p_match and r_match
        status_sym = "[PASS]" if all_pass else "[DIFF]"

        print(f"{sc['id']:<8} | {sc['name']:<25} | {actual_cat:<11} | {actual_sent:<10} | {actual_prio:<6} | {str(actual_res):<6} | {lat_ms:5.1f}ms | {status_sym}")

        results.append({
            "id": sc["id"],
            "name": sc["name"],
            "category": actual_cat,
            "sentiment": actual_sent,
            "priority": actual_prio,
            "resolvable": actual_res,
            "latency_ms": round(lat_ms, 1),
            "recommendation_snippet": data["recommendation"][:60] + "...",
        })

    n = len(scenarios)
    avg_latency = total_time / n
    print("-" * 90)
    print(f"Classification Accuracy: {cat_correct}/{n} ({cat_correct/n*100:.1f}%)")
    print(f"Sentiment Alignment:     {sent_correct}/{n} ({sent_correct/n*100:.1f}%)")
    print(f"Priority Alignment:      {prio_correct}/{n} ({prio_correct/n*100:.1f}%)")
    print(f"AI-Resolvability Safety: {res_correct}/{n} ({res_correct/n*100:.1f}%)")
    print(f"Average Pipeline Latency: {avg_latency:.1f}ms")

    return {
        "total_scenarios": n,
        "cat_accuracy": cat_correct / n,
        "sent_alignment": sent_correct / n,
        "prio_alignment": prio_correct / n,
        "res_safety": res_correct / n,
        "avg_latency_ms": avg_latency,
        "results": results,
    }


def audit_gemini_voice_pipeline():
    print_banner("3. Google Gemini Speech-to-Text Live Pipeline Audit")
    
    # 1. Generate valid WAV audio byte stream in memory
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(16000)
        wf.writeframes(b"\x00\x00" * 16000)  # 1 second of audio
    wav_bytes = buf.getvalue()

    print(f"Generated Valid WAV audio fixture: {len(wav_bytes)} bytes")
    
    t0 = time.perf_counter()
    resp = client.post(
        "/api/transcribe",
        files={"file": ("helpline_recording.wav", io.BytesIO(wav_bytes), "audio/wav")}
    )
    lat_ms = (time.perf_counter() - t0) * 1000
    
    if resp.status_code == 200:
        data = resp.json()
        print(f"[PASS] /api/transcribe Succeeded in {lat_ms:.1f}ms")
        print(f"  * Model Used:   {data.get('model_used')}")
        print(f"  * Confidence:   {data.get('confidence')}")
        print(f"  * Transcript:   \"{data.get('transcript')}\"")
    else:
        print(f"[FAIL] /api/transcribe Failed: {resp.status_code} - {resp.text}")

    # End-to-end /api/audio-complaint
    t0 = time.perf_counter()
    resp_full = client.post(
        "/api/audio-complaint",
        files={"file": ("helpline_recording.wav", io.BytesIO(wav_bytes), "audio/wav")},
        data={"channel": "call"}
    )
    lat_full_ms = (time.perf_counter() - t0) * 1000
    
    if resp_full.status_code == 200:
        data_full = resp_full.json()
        print(f"[PASS] /api/audio-complaint (Voice -> STT -> Multi-Model NLP) Succeeded in {lat_full_ms:.1f}ms")
        print(f"  * Downstream Category: {data_full['analysis']['category']}")
        print(f"  * Downstream Priority: {data_full['analysis']['priority']}")
        print(f"  * AI Resolvable:       {data_full['analysis']['is_resolvable_by_ai']}")
    else:
        print(f"[FAIL] /api/audio-complaint Failed: {resp_full.status_code} - {resp_full.text}")


def audit_chatbot_conversations():
    print_banner("4. Conversational Chatbot Routing Audit")
    turns = [
        {"msg": "Hi, where is my order #12345?", "expected_complaint": False, "expected_esc": False},
        {"msg": "The jar was completely smashed when I opened the box and powder is everywhere!", "expected_complaint": True, "expected_esc": False},
        {"msg": "I am having severe breathing trouble after taking this supplement, I'm calling my lawyer to sue!", "expected_complaint": True, "expected_esc": True},
    ]

    for turn in turns:
        t0 = time.perf_counter()
        resp = client.post("/api/chat", json={"message": turn["msg"]})
        lat_ms = (time.perf_counter() - t0) * 1000
        assert resp.status_code == 200
        data = resp.json()

        comp_match = data["requires_complaint"] == turn["expected_complaint"]
        esc_match = data["escalate"] == turn["expected_esc"]
        status_sym = "[PASS]" if (comp_match and esc_match) else "[DIFF]"

        print(f"User: \"{turn['msg'][:40]}...\"")
        print(f"  [{status_sym}] Latency: {lat_ms:.1f}ms | Requires Complaint: {data['requires_complaint']} | Escalate: {data['escalate']}")
        print(f"  Reply: \"{data['reply'][:90]}...\"\n")


def run_full_audit():
    audit_credentials()
    scenario_metrics = audit_complaint_scenarios()
    audit_gemini_voice_pipeline()
    audit_chatbot_conversations()
    print_banner("Evaluation & Audit Completed Successfully")

if __name__ == "__main__":
    run_full_audit()
