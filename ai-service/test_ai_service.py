import sys
import io

if sys.platform == "win32":
    try:
        if isinstance(sys.stdout, io.TextIOWrapper):
            sys.stdout.reconfigure(encoding="utf-8")
        if isinstance(sys.stderr, io.TextIOWrapper):
            sys.stderr.reconfigure(encoding="utf-8")
    except AttributeError:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

from importlib import import_module

try:
    TestClient = import_module("fastapi.testclient").TestClient
except ModuleNotFoundError as exc:
    if exc.name == "fastapi":
        pytest = import_module("pytest")

        pytest.skip("FastAPI is required to run these tests", allow_module_level=True)
    raise

from app.main import app


client = TestClient(app)

ALLOWED_CATEGORIES = ["Product", "Packaging", "Trade"]
ALLOWED_SENTIMENTS = ["Negative", "Neutral", "Positive"]
ALLOWED_PRIORITIES = ["High", "Medium", "Low"]


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "ai-service" in data["service"]
    print("✓ PASS: Health check endpoint works")


def test_api_prefix_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    print("✓ PASS: /api/health prefix works")


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
    print("✓ PASS: Valid packaging complaint analysis")


def test_valid_product_hazard_complaint():
    payload = {
        "description": "I had a severe allergic reaction with full body rash after consuming this herbal powder.",
        "channel": "call"
    }
    response = client.post("/api/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["category"] in ALLOWED_CATEGORIES
    assert data["category"] == "Product"
    assert data["priority"] in ALLOWED_PRIORITIES
    assert data["priority"] == "High"
    assert data["sentiment"] in ALLOWED_SENTIMENTS
    assert data["sentiment"] == "Negative"
    assert data["is_resolvable_by_ai"] is False
    assert "safety escalation" in data["recommendation"].lower()
    print("✓ PASS: Valid product hazard analysis (High priority, Negative sentiment, CSE required)")


def test_valid_trade_complaint():
    payload = {
        "description": "The shipment tracking indicates delayed courier delivery for more than a week.",
        "channel": "email"
    }
    response = client.post("/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["category"] in ALLOWED_CATEGORIES
    assert data["category"] == "Trade"
    assert data["priority"] in ALLOWED_PRIORITIES
    assert data["sentiment"] in ALLOWED_SENTIMENTS
    assert isinstance(data["recommendation"], str) and len(data["recommendation"]) > 10
    print("✓ PASS: Valid trade complaint analysis (/analyze path)")


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
    print("✓ PASS: AI-resolvable complaint query")


def test_missing_description():
    payload = {"channel": "text"}
    response = client.post("/api/analyze", json=payload)
    assert response.status_code == 422
    data = response.json()
    assert "detail" in data
    print("✓ PASS: Missing description rejected (422 Unprocessable Entity)")


def test_empty_description():
    payload = {"description": "   "}
    response = client.post("/api/analyze", json=payload)
    assert response.status_code in [400, 422]
    print("✓ PASS: Empty / whitespace description rejected")


def test_short_description():
    payload = {"description": "a"}
    response = client.post("/api/analyze", json=payload)
    assert response.status_code == 422
    print("✓ PASS: Too-short description rejected (422)")


def test_invalid_request_structure():
    response = client.post("/api/analyze", json=["invalid", "list"])
    assert response.status_code == 422
    response2 = client.post("/api/analyze", json={"description": 12345})
    assert response2.status_code == 422
    print("✓ PASS: Invalid request structure rejected (422)")


def run_all_tests():
    print("==================================================")
    print("RUNNING FASTAPI AI SERVICE INDEPENDENT TESTS")
    print("==================================================")
    try:
        test_health_check()
        test_api_prefix_health_check()
        test_valid_packaging_complaint()
        test_valid_product_hazard_complaint()
        test_valid_trade_complaint()
        test_ai_resolvable_query()
        test_missing_description()
        test_empty_description()
        test_short_description()
        test_invalid_request_structure()
        print("==================================================")
        print("ALL FASTAPI AI SERVICE TESTS PASSED!")
        print("==================================================")
    except AssertionError as err:
        print(f"❌ TEST FAILED: {err}")
        sys.exit(1)


if __name__ == "__main__":
    run_all_tests()
