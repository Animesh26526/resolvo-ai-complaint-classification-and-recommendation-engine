// Integration Test for Resolvo Backend
// Exactly 1 test verifying the interaction between:
// 1. Express complaint-creation API (POST /api/complaints route and createComplaint controller)
// 2. MongoDB persistence (Mongoose complaintModel and userModel database interaction)

const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");

require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const mongoose = require("mongoose");
const request = require("supertest");
const jwt = require("jsonwebtoken");

const app = require("./src/app");
const userModel = require("./src/models/user.model");
const complaintModel = require("./src/models/complaint.model");
const aiService = require("./src/services/ai.service");

// ---------------------------------------------------------------------------
// 1. MongoDB Safety & Pre-Connection Validation
// ---------------------------------------------------------------------------
function resolveAndValidateTestMongoUri() {
    let uri;
    if (process.env.TEST_MONGODB_URI) {
        uri = process.env.TEST_MONGODB_URI.trim();
    } else if (process.env.MONGODB_URI) {
        const base = process.env.MONGODB_URI.trim();
        if (base.includes("/ComplaintDB")) {
            uri = base.replace("/ComplaintDB", "/ComplaintDB_test_integration");
        } else {
            uri = base.replace(/\/[^/?]+(\?|$)/, "/ComplaintDB_test_integration$1");
        }
    } else {
        throw new Error(
            "MongoDB safety error: Neither TEST_MONGODB_URI nor MONGODB_URI is configured. Cannot safely determine test database URI."
        );
    }

    // Extract database name from URI before connecting
    let dbName = null;
    try {
        const normalized = uri.replace(/^mongodb(\+srv)?:\/\//, "http://");
        const parsed = new URL(normalized);
        dbName = parsed.pathname.replace(/^\//, "").split("/")[0];
    } catch {
        const match = uri.match(/^mongodb(?:\+srv)?:\/\/[^/]+\/([^?]+)/);
        if (match) {
            dbName = match[1];
        }
    }

    if (!dbName) {
        throw new Error(
            `MongoDB safety error: Could not extract database name from URI: "${uri}". Cannot validate test database isolation.`
        );
    }

    if (dbName === "ComplaintDB") {
        throw new Error(
            `MongoDB safety error: Intended database is '${dbName}', which is the development/production database. Connecting to 'ComplaintDB' during tests is strictly forbidden.`
        );
    }

    if (!dbName.toLowerCase().includes("test")) {
        throw new Error(
            `MongoDB safety error: Intended database name '${dbName}' does not contain 'test'. A dedicated, isolated test database is required.`
        );
    }

    return { uri, dbName };
}

// ---------------------------------------------------------------------------
// 2. JWT Configuration Validation
// ---------------------------------------------------------------------------
if (!process.env.JWT_SECRET) {
    throw new Error(
        "JWT configuration error: JWT_SECRET environment variable is missing. It must match the secret expected by the application authentication middleware."
    );
}
const jwtSecret = process.env.JWT_SECRET;

let testCustomer = null;
let createdComplaintId = null;
let origAnalyzeComplaint = null;

// ---------------------------------------------------------------------------
// 3. Deterministic Background Completion Helper
// ---------------------------------------------------------------------------
async function waitForComplaintStatus(complaintId, targetStatus, timeoutMs = 5000) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
        const doc = await complaintModel.findById(complaintId);
        if (doc && doc.status === targetStatus) {
            return doc;
        }
        await new Promise((resolve) => setTimeout(resolve, 25));
    }
    return await complaintModel.findById(complaintId);
}

before(async () => {
    // 1. Validate URI and database name before connecting
    const { uri: testDbUri, dbName: expectedDbName } = resolveAndValidateTestMongoUri();

    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    await mongoose.connect(testDbUri, { serverSelectionTimeoutMS: 5000 });

    // Secondary post-connect safety verification
    assert.equal(
        mongoose.connection.name,
        expectedDbName,
        `Connected database name '${mongoose.connection.name}' must match validated test database '${expectedDbName}'`
    );
    assert.notEqual(
        mongoose.connection.name,
        "ComplaintDB",
        "Safety assertion failed: Connected to production/development database 'ComplaintDB'"
    );

    // 2. Stub external AI service boundary (do not call external AI provider)
    origAnalyzeComplaint = aiService.analyzeComplaint;
    aiService.analyzeComplaint = async () => ({
        category: "Packaging",
        sentiment: "Neutral",
        priority: "Medium",
        recommendation: "Inspect shipment packaging and issue replacement",
        is_resolvable_by_ai: true,
    });

    // 3. Set up test customer in the isolated test database
    testCustomer = await userModel.create({
        name: "Integration Test Customer",
        email: `integration_test_${Date.now()}_${Math.floor(Math.random() * 10000)}@example.com`,
        password: "IntegrationHashedPassword123!",
        role: "customer",
        isEmailVerified: true,
    });
});

after(async () => {
    // Reliable cleanup: ensure created records are deleted without arbitrary delays
    try {
        if (createdComplaintId) {
            await complaintModel.findByIdAndDelete(createdComplaintId);
        } else if (testCustomer && testCustomer._id) {
            await complaintModel.deleteMany({ customer: testCustomer._id });
        }
        if (testCustomer && testCustomer._id) {
            await userModel.findByIdAndDelete(testCustomer._id);
        }
    } catch (cleanupErr) {
        console.error("Cleanup error in integration test:", cleanupErr.message);
    } finally {
        if (origAnalyzeComplaint) {
            aiService.analyzeComplaint = origAnalyzeComplaint;
        }
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
    }
});

test("Integration: Express complaint-creation API persists complaint correctly in MongoDB", async () => {
    // 1. Generate valid JWT using the application's configured secret
    const token = jwt.sign(
        { id: testCustomer._id.toString(), role: testCustomer.role },
        jwtSecret,
        { expiresIn: "1h" }
    );

    // Customer complaint creation payload: description is required, channel is text.
    // In accordance with the application contract, category and priority are derived
    // from AI analysis rather than user intake.
    const complaintPayload = {
        description: "Integration test complaint: Defective packaging arrived damaged.",
        channel: "text",
    };

    // 2. Submit complaint through the real Express route and controller
    const res = await request(app)
        .post("/api/complaints")
        .set("Authorization", `Bearer ${token}`)
        .send(complaintPayload);

    // Track created ID as early as possible for reliable cleanup even if later assertions fail
    if (res.body?.complaint?._id) {
        createdComplaintId = res.body.complaint._id;
    }

    // 3. Verify HTTP 201 response and intake contract
    assert.equal(res.status, 201, "API endpoint must respond with HTTP 201 Created");
    assert.ok(res.body.complaint, "Response must include complaint object");
    assert.ok(res.body.complaint._id, "Response complaint must contain database _id");
    assert.equal(
        res.body.complaint.description,
        complaintPayload.description,
        "Response description must match submitted description"
    );
    assert.equal(
        res.body.complaint.channel,
        "text",
        "Response channel must be 'text'"
    );
    assert.equal(
        res.body.complaint.status,
        "Received",
        "Initial complaint status in creation response must be 'Received'"
    );
    assert.equal(
        res.body.complaint.customer.toString(),
        testCustomer._id.toString(),
        "Complaint must be associated with the authenticated customer"
    );

    // 4. Verify MongoDB persistence directly via Mongoose model
    const persisted = await complaintModel.findById(createdComplaintId);
    assert.ok(persisted !== null, "Complaint must be found in MongoDB");
    assert.equal(
        persisted.description,
        complaintPayload.description,
        "Persisted description must match submitted data"
    );
    assert.equal(
        persisted.channel,
        "text",
        "Persisted channel must match submitted channel"
    );
    assert.equal(
        persisted.customer.toString(),
        testCustomer._id.toString(),
        "Persisted customer association must match authenticated user ID"
    );
    assert.ok(
        persisted.complaintId && persisted.complaintId.startsWith("CMP-"),
        "Persisted complaint must have a generated complaintId with 'CMP-' prefix"
    );

    // 5. Deterministic verification of background AI analysis completion
    // The background task analyzes the complaint and updates category, priority, and status.
    const analyzedDoc = await waitForComplaintStatus(createdComplaintId, "Analyzed");
    assert.equal(
        analyzedDoc.status,
        "Analyzed",
        "Complaint status must transition to 'Analyzed' upon AI analysis completion"
    );
    assert.equal(
        analyzedDoc.category,
        "Packaging",
        "Persisted category must be derived from AI analysis"
    );
    assert.equal(
        analyzedDoc.priority,
        "Medium",
        "Persisted priority must be derived from AI analysis"
    );
    assert.equal(
        analyzedDoc.aiRecommendation,
        "Inspect shipment packaging and issue replacement",
        "Persisted AI recommendation must be populated from analysis"
    );
});
