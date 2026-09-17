import sys
import io
import asyncio
from typing import Dict, Any

if sys.platform == "win32":
    try:
        if isinstance(sys.stdout, io.TextIOWrapper):
            sys.stdout.reconfigure(encoding="utf-8")
        if isinstance(sys.stderr, io.TextIOWrapper):
            sys.stderr.reconfigure(encoding="utf-8")
    except AttributeError:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

from fastapi.testclient import TestClient
from app.main import app
from app.services.sentiment_service import SentimentService
from app.services.classification_service import ClassificationService
from app.services.priority_service import PriorityEngineService
from app.services.gpt_oss_service import GptOssService
from app.services.gemini_service import GeminiAudioService

client = TestClient(app)

ALLOWED_CATEGORIES = ["Product", "Packaging", "Trade"]
ALLOWED_SENTIMENTS = ["Negative", "Neutral", "Positive"]
ALLOWED_PRIORITIES = ["High", "Medium", "Low"]


# ==================================================
# 1. HEALTH & METADATA TESTS
# ==================================================

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "models" in data
    assert "sentiment" in data["models"]
    assert "classification" in data["models"]
    assert "gpt_oss_20b" in data["models"]
    assert "gemini_voice" in data["models"]
    print("✓ PASS: Health check endpoint returns operational model statuses")


def test_api_prefix_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    print("✓ PASS: /api/health prefix route works")


# ==================================================
# 2. SENTIMENT SERVICE UNIT TESTS
# ==================================================

def test_sentiment_service():
    service = SentimentService()

    # Positive text
    res_pos = service.analyze_sentiment("Thank you so much! This organic moisturizer is wonderful and I love it.")
    assert res_pos.sentiment == "Positive"
    assert res_pos.confidence > 0

    # Negative text
    res_neg = service.analyze_sentiment("This product is terrible, leaked everywhere and gave me a severe allergic reaction!")
    assert res_neg.sentiment == "Negative"
    assert res_neg.confidence > 0

    # Neutral / Informational text
    res_neu = service.analyze_sentiment("Could you please tell me the expiration date format used on the bottle label?")
    assert res_neu.sentiment in ["Neutral", "Positive"]
    print("✓ PASS: Sentiment unit tests (Positive, Negative, Neutral)")


# ==================================================
# 3. CLASSIFICATION SERVICE UNIT TESTS
# ==================================================

def test_classification_service():
    service = ClassificationService()

    # Product category
    res_prod = service.analyze_category("The wellness capsules had an unusual rancid smell and bitter sour taste.")
    assert res_prod.category == "Product"
    assert res_prod.confidence > 0

    # Packaging category
    res_pack = service.analyze_category("The bottle cap was broken, the safety seal was torn and oil spilled inside the box.")
    assert res_pack.category == "Packaging"
    assert res_pack.confidence > 0

    # Trade category
    res_trade = service.analyze_category("My courier shipment is delayed for 10 days and the invoice charged me twice.")
    assert res_trade.category == "Trade"
    assert res_trade.confidence > 0
    print("✓ PASS: Classification unit tests (Product, Packaging, Trade)")


# ==================================================
# 4. PRIORITY ENGINE UNIT TESTS
# ==================================================

def test_priority_engine():
    service = PriorityEngineService()

    # High severity (hazard / hospital)
    res_high = service.calculate_priority(
        "I had a severe allergic reaction with full body rash and had to visit the emergency hospital!",
        "Negative"
    )
    assert res_high.priority == "High"
    assert len(res_high.reasons) > 0

    # Medium severity (defect / leakage)
    res_med = service.calculate_priority(
        "The shampoo container leaked inside the delivery box.",
        "Negative"
    )
    assert res_med.priority == "Medium"

    # Low severity (general inquiry)
    res_low = service.calculate_priority(
        "Can you clarify the recommended daily usage for the capsules?",
        "Neutral"
    )
    assert res_low.priority == "Low"

    # Negative but low-severity complaint (dissatisfaction without hazards)
    res_neg_low = service.calculate_priority(
        "I am unhappy because the lotion scent was slightly different than my previous bottle.",
        "Negative"
    )
    assert res_neg_low.priority in ["Medium", "Low"]
    print("✓ PASS: Priority engine tests (High hazard, Medium defect, Low inquiry, Negative non-hazard)")


# ==================================================
# 5. GPT-OSS-20B SERVICE UNIT TESTS
# ==================================================

def test_gpt_oss_service():
    service = GptOssService()

    # Test deterministic resolution recommendation and AI resolvability
    rec, resolvable = asyncio.run(service.generate_resolution_and_decision(
        complaint="Severe allergic reaction with hospital visit",
        category="Product",
        sentiment="Negative",
        priority="High",
    ))
    assert isinstance(rec, str) and len(rec) > 20
    assert resolvable is False  # High priority must NEVER be resolvable by AI

    # Informational query can be resolvable
    rec_info, resolvable_info = asyncio.run(service.generate_resolution_and_decision(
        complaint="What are the storage guidelines for unopened jars?",
        category="Product",
        sentiment="Neutral",
        priority="Low",
    ))
    assert isinstance(rec_info, str) and len(rec_info) > 20
    assert resolvable_info is True

    # Test robust JSON extraction helper
    valid_json = service._extract_json('```json\n{"recommendation": "Check batch", "is_resolvable_by_ai": false}\n```')
    assert valid_json["is_resolvable_by_ai"] is False

    malformed_json = service._extract_json('Some text before {"recommendation": "Replace", "is_resolvable_by_ai": true} and text after')
    assert malformed_json["recommendation"] == "Replace"
    print("✓ PASS: GPT-OSS service tests (Actionable recommendations, AI decision, JSON parser)")


# ==================================================
# 6. CONVERSATIONAL CHATBOT API TESTS
# ==================================================

def test_chatbot_endpoint():
    # General greeting
    payload_general = {"message": "Hello, can you help me with my order?"}
    res_gen = client.post("/api/chat", json=payload_general)
    assert res_gen.status_code == 200
    data_gen = res_gen.json()
    assert "reply" in data_gen
    assert data_gen["requires_complaint"] is False

    # Defect report -> requires complaint
    payload_defect = {"message": "My herbal tea box arrived soaked and damaged with broken seal."}
    res_def = client.post("/api/chat", json=payload_defect)
    assert res_def.status_code == 200
    data_def = res_def.json()
    assert data_def["requires_complaint"] is True

    # Urgent hazard -> escalation
    payload_esc = {"message": "The product caused severe poisoning and my lawyer is going to sue!"}
    res_esc = client.post("/api/chat", json=payload_esc)
    assert res_esc.status_code == 200
    data_esc = res_esc.json()
    assert data_esc["escalate"] is True
    print("✓ PASS: Chatbot API tests (General inquiry, Defect guidance, Escalation scenario)")


# ==================================================
# 7. AUDIO TRANSCRIPTION PIPELINE TESTS
# ==================================================

def make_test_wav():
    import wave
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(16000)
        wf.writeframes(b"\x00\x00" * 8000)
    buf.seek(0)
    return buf


def test_audio_endpoints():
    # Test audio file too small rejection (< 30 bytes)
    tiny_audio = io.BytesIO(b"RIFFtiny")
    res_tiny = client.post("/api/transcribe", files={"file": ("audio.wav", tiny_audio, "audio/wav")})
    assert res_tiny.status_code == 400

    # Test valid audio transcription call with Gemini 3.6 Flash
    valid_wav = make_test_wav()
    res_audio = client.post("/api/transcribe", files={"file": ("call.wav", valid_wav, "audio/wav")})
    assert res_audio.status_code == 200
    data_audio = res_audio.json()
    assert "transcript" in data_audio
    assert len(data_audio["transcript"]) > 0

    # Test end-to-end audio complaint pipeline (/api/audio-complaint)
    valid_wav2 = make_test_wav()
    res_pipe = client.post("/api/audio-complaint", files={"file": ("call.wav", valid_wav2, "audio/wav")}, data={"channel": "call"})
    assert res_pipe.status_code == 200
    data_pipe = res_pipe.json()
    assert "transcript" in data_pipe
    assert "analysis" in data_pipe
    assert data_pipe["analysis"]["category"] in ALLOWED_CATEGORIES
    print("✓ PASS: Audio transcription & end-to-end voice pipeline tests")


# ==================================================
# 8. CORE /api/analyze CONTRACT TESTS
# ==================================================

def test_valid_packaging_complaint():
    payload = {
        "description": "The packaging box was torn and the seal was tampered with upon delivery.",
        "channel": "text"
    }
    response = client.post("/api/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["category"] in ALLOWED_CATEGORIES
    assert data["category"] == "Packaging"
    assert data["sentiment"] in ALLOWED_SENTIMENTS
    assert data["priority"] in ALLOWED_PRIORITIES
    assert isinstance(data["recommendation"], str) and len(data["recommendation"]) > 10
    assert "is_resolvable_by_ai" in data
    print("✓ PASS: /api/analyze valid packaging complaint")


def test_valid_product_hazard_complaint():
    payload = {
        "description": "I had a severe allergic reaction with full body rash after consuming this herbal powder.",
        "channel": "call"
    }
    response = client.post("/api/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["category"] == "Product"
    assert data["priority"] == "High"
    assert data["sentiment"] == "Negative"
    assert data["is_resolvable_by_ai"] is False
    assert "safety escalation" in data["recommendation"].lower()
    print("✓ PASS: /api/analyze valid product hazard analysis (High priority, Negative, human required)")


def test_valid_trade_complaint():
    payload = {
        "description": "The shipment tracking indicates delayed courier delivery for more than a week.",
        "channel": "email"
    }
    response = client.post("/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["category"] == "Trade"
    assert data["priority"] in ALLOWED_PRIORITIES
    assert data["sentiment"] in ALLOWED_SENTIMENTS
    print("✓ PASS: /analyze valid trade complaint")


def test_ai_resolvable_query():
    payload = {
        "description": "Just wanted to ask what is the best way to store the organic capsules after opening?",
        "channel": "chatbot"
    }
    response = client.post("/api/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["category"] == "Product"
    assert data["priority"] == "Low"
    assert data["sentiment"] != "Negative"
    assert data["is_resolvable_by_ai"] is True
    print("✓ PASS: /api/analyze AI-resolvable inquiry")


def test_validation_errors():
    # Missing description
    assert client.post("/api/analyze", json={"channel": "text"}).status_code == 422
    # Empty description
    assert client.post("/api/analyze", json={"description": "   "}).status_code in [400, 422]
    # Too short description
    assert client.post("/api/analyze", json={"description": "a"}).status_code == 422
    print("✓ PASS: Request payload validation tests")


def run_all_tests():
    print("==================================================")
    print("RUNNING MULTI-MODEL AI SERVICE COMPREHENSIVE TESTS")
    print("==================================================")
    try:
        test_health_check()
        test_api_prefix_health_check()
        test_sentiment_service()
        test_classification_service()
        test_priority_engine()
        test_gpt_oss_service()
        test_chatbot_endpoint()
        test_audio_endpoints()
        test_valid_packaging_complaint()
        test_valid_product_hazard_complaint()
        test_valid_trade_complaint()
        test_ai_resolvable_query()
        test_validation_errors()
        print("==================================================")
        print("ALL MULTI-MODEL AI SERVICE TESTS PASSED SUCCESSFULLY!")
        print("==================================================")
    except AssertionError as err:
        print(f"❌ TEST FAILED: {err}")
        sys.exit(1)


if __name__ == "__main__":
    run_all_tests()
