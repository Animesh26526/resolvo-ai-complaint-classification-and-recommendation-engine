// Unit tests for Resolvo Backend
// Exactly 5 diverse tests covering different types of logic:
// 1. Normal/valid input: authorizeRoles grants access when user role is in allowed roles
// 2. Invalid input / negative test: analyzeComplaint rejects complaint with missing/empty description
// 3. Boundary or edge case: errorHandler defaults missing statusCode to 500 and sanitizes error message
// 4. Business-rule logic: updateComplaintStatus rejects illegal status transition from Assigned to Received
// 5. Transformation or calculation: getQaMetrics computes agreement rate percentage and category corrections frequency map

const { test } = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");

require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const { authorizeRoles } = require("./src/middlewares/auth.middleware");
const { errorHandler } = require("./src/middlewares/error.middleware");
const { analyzeComplaint } = require("./src/services/ai.service");
const { updateComplaintStatus } = require("./src/controllers/complaint.controller");
const { getQaMetrics } = require("./src/controllers/qat.controller");
const complaintModel = require("./src/models/complaint.model");
const qaReviewModel = require("./src/models/qaReview.model");

// ---------------------------------------------------------------------------
// 1. Normal/valid input test
// ---------------------------------------------------------------------------
test("Unit 1 [Normal/valid input]: authorizeRoles grants access when user has an authorized role", () => {
    const middleware = authorizeRoles("cse", "om");
    let nextCalled = false;
    let statusCalled = false;

    const req = { user: { id: "user_cse_101", role: "cse" } };
    const res = {
        status: () => {
            statusCalled = true;
            return res;
        },
        json: () => res,
    };
    const next = () => {
        nextCalled = true;
    };

    middleware(req, res, next);

    assert.equal(nextCalled, true, "next() must be called when user role matches allowed roles");
    assert.equal(statusCalled, false, "res.status() must not be called when user is authorized");
});

// ---------------------------------------------------------------------------
// 2. Invalid input / negative test
// ---------------------------------------------------------------------------
test("Unit 2 [Invalid input / negative test]: analyzeComplaint rejects complaint with missing or whitespace-only description", async () => {
    await assert.rejects(
        async () => {
            await analyzeComplaint({ description: "   ", channel: "text" });
        },
        (err) => {
            assert.equal(err.statusCode, 400, "Error must have HTTP 400 statusCode");
            assert.equal(err.message, "Complaint description is required for AI analysis");
            return true;
        }
    );
});

// ---------------------------------------------------------------------------
// 3. Boundary or edge case test
// ---------------------------------------------------------------------------
test("Unit 3 [Boundary or edge case]: errorHandler defaults missing statusCode to 500 and sanitizes error message", () => {
    // When err.statusCode is undefined (missing optional field), the handler should
    // default to HTTP 500 and mask the internal error message to protect system details.
    const internalErr = new Error("Fatal: Internal database cluster pool exhausted");
    let capturedStatusCode = null;
    let capturedBody = null;

    const req = {};
    const res = {
        status(code) {
            capturedStatusCode = code;
            return this;
        },
        json(body) {
            capturedBody = body;
            return this;
        },
    };

    // Suppress console.error during edge-case test to keep output clean
    const originalConsoleError = console.error;
    console.error = () => {};
    try {
        errorHandler(internalErr, req, res, () => {});
    } finally {
        console.error = originalConsoleError;
    }

    assert.equal(capturedStatusCode, 500, "Missing statusCode must default to 500");
    assert.equal(
        capturedBody.message,
        "Internal server error",
        "Sensitive internal message must be sanitized to 'Internal server error' on 500 status"
    );
});

// ---------------------------------------------------------------------------
// 4. Business-rule logic test
// ---------------------------------------------------------------------------
test("Unit 4 [Business-rule logic]: updateComplaintStatus rejects illegal status transition from Assigned to Received", async () => {
    const origFindOne = complaintModel.findOne;
    complaintModel.findOne = async () => ({
        _id: "507f1f77bcf86cd799439011",
        complaintId: "CMP-2026-0001",
        status: "Assigned",
    });

    try {
        let capturedStatusCode = null;
        let capturedBody = null;

        const req = {
            params: { id: "CMP-2026-0001" },
            body: { status: "Received" }, // Backward transition 'Assigned' -> 'Received' is forbidden
            user: { id: "cse_user_1", role: "cse" },
        };
        const res = {
            status(code) {
                capturedStatusCode = code;
                return this;
            },
            json(body) {
                capturedBody = body;
                return this;
            },
        };

        await updateComplaintStatus(req, res);

        assert.equal(capturedStatusCode, 400, "Forbidden transition must return HTTP 400 Bad Request");
        assert.match(
            capturedBody.message,
            /Invalid status transition from 'Assigned' to 'Received'/,
            "Response message must explicitly state the invalid status transition rule violation"
        );
    } finally {
        complaintModel.findOne = origFindOne;
    }
});

// ---------------------------------------------------------------------------
// 5. Transformation or calculation test
// ---------------------------------------------------------------------------
test("Unit 5 [Transformation or calculation]: getQaMetrics calculates agreement rate percentage and category corrections frequency map", async () => {
    const origFind = qaReviewModel.find;
    qaReviewModel.find = () => ({
        populate: () =>
            Promise.resolve([
                { classificationResult: "Agreed" },
                { classificationResult: "Agreed" },
                { classificationResult: "Disagreed" },
                {
                    classificationResult: "Corrected",
                    correctedCategory: "Trade",
                    originalAiAnalysis: { category: "Product" },
                },
            ]),
    });

    try {
        let capturedStatusCode = null;
        let capturedBody = null;

        const req = {};
        const res = {
            status(code) {
                capturedStatusCode = code;
                return this;
            },
            json(body) {
                capturedBody = body;
                return this;
            },
        };

        await getQaMetrics(req, res);

        assert.equal(capturedStatusCode, 200, "getQaMetrics must return HTTP 200 OK");
        const { metrics } = capturedBody;
        assert.equal(metrics.totalReviews, 4, "Total reviews must equal count of populated records");
        assert.equal(metrics.agreedCount, 2, "Agreed count must equal 2");
        assert.equal(metrics.disagreedCount, 1, "Disagreed count must equal 1");
        assert.equal(metrics.correctedCount, 1, "Corrected count must equal 1");

        // Calculation assertion: (agreedCount / totalReviews) * 100 => (2 / 4) * 100 = 50.0
        assert.equal(
            metrics.classificationAgreementRate,
            50.0,
            "Classification agreement rate must be calculated as 50.0%"
        );

        // Transformation assertion: category correction pair frequency aggregated into dictionary
        assert.equal(
            metrics.commonCategoryCorrections["Product -> Trade"],
            1,
            "Common category corrections must map 'Product -> Trade' with count 1"
        );
    } finally {
        qaReviewModel.find = origFind;
    }
});
