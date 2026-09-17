require("dotenv").config();

process.env.JWT_SECRET = "test_jwt_secret_key_1234567890";
process.env.JWT_EXPIRES_IN = "1h";

const request = require("supertest");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const app = require("./src/app");
const userModel = require("./src/models/user.model");
const complaintModel = require("./src/models/complaint.model");
const resolutionModel = require("./src/models/resolution.model");
const aiService = require("./src/services/ai.service");


// In-memory data store
const usersDB = [];
const complaintsDB = [];
const resolutionsDB = [];

// Helper to create test JWT tokens
function generateToken(user) {
    return jwt.sign(
        { id: user._id.toString(), role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );
}

// Populate helper
function populateDoc(doc) {
    if (!doc) return null;
    const populated = { ...doc };

    if (populated.customer) {
        const custId = populated.customer._id || populated.customer;
        const custUser = usersDB.find(u => u._id.toString() === custId.toString());
        if (custUser) {
            populated.customer = {
                _id: custUser._id,
                name: custUser.name,
                email: custUser.email,
                role: custUser.role,
            };
        }
    }

    if (populated.assignedTo) {
        const staffId = populated.assignedTo._id || populated.assignedTo;
        const staffUser = usersDB.find(u => u._id.toString() === staffId.toString());
        if (staffUser) {
            populated.assignedTo = {
                _id: staffUser._id,
                name: staffUser.name,
                email: staffUser.email,
                role: staffUser.role,
            };
        }
    }

    if (populated.resolution) {
        const resId = populated.resolution._id || populated.resolution;
        const resDoc = resolutionsDB.find(r => r._id.toString() === resId.toString());
        if (resDoc) {
            populated.resolution = { ...resDoc };
        }
    }

    if (populated.resolvedBy) {
        const staffId = populated.resolvedBy._id || populated.resolvedBy;
        const staffUser = usersDB.find(u => u._id.toString() === staffId.toString());
        if (staffUser) {
            populated.resolvedBy = {
                _id: staffUser._id,
                name: staffUser.name,
                email: staffUser.email,
                role: staffUser.role,
            };
        }
    }

    return populated;
}

function createQueryChain(getResults) {
    let sortFn = (a, b) => b.createdAt - a.createdAt;

    const chain = {
        sort: function () {
            return chain;
        },
        populate: function () {
            return chain;
        },
        then: function (resolve) {
            const raw = getResults();
            if (Array.isArray(raw)) {
                const sorted = [...raw].sort(sortFn);
                const populated = sorted.map(populateDoc);
                resolve(populated);
            } else if (raw) {
                resolve(populateDoc(raw));
            } else {
                resolve(null);
            }
        }
    };

    return chain;
}

// Monkey-patch userModel for testing
userModel.findById = function (id) {
    const user = usersDB.find(u => u._id.toString() === id.toString()) || null;
    return {
        select: function (fields) {
            if (!user) return Promise.resolve(null);
            const copy = { ...user };
            if (fields && fields.includes("-password")) {
                delete copy.password;
            }
            return Promise.resolve(copy);
        },
        then: function (resolve) {
            resolve(user);
        }
    };
};

userModel.findOne = function (query) {
    let result = null;
    if (query.email) {
        result = usersDB.find(u => u.email.toLowerCase() === query.email.toLowerCase()) || null;
    }
    return Promise.resolve(result);
};

// Monkey-patch complaintModel for testing
complaintModel.create = function (doc) {
    const newId = new mongoose.Types.ObjectId();
    const complaintDoc = {
        _id: newId,
        complaintId: doc.complaintId || `CMP-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
        description: doc.description,
        channel: doc.channel || "text",
        category: doc.category || null,
        priority: doc.priority || null,
        status: doc.status || "Received",
        customer: doc.customer,
        assignedTo: doc.assignedTo || null,
        sentiment: doc.sentiment || null,
        aiRecommendation: doc.aiRecommendation || null,
        resolution: doc.resolution || null,
        receivedAt: doc.receivedAt || new Date(),
        slaDeadline: doc.slaDeadline || null,
        resolvedAt: doc.resolvedAt || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        save: function () {
            this.updatedAt = new Date();
            const index = complaintsDB.findIndex(c => c._id.toString() === this._id.toString());
            if (index !== -1) {
                complaintsDB[index] = { ...this };
            }
            return Promise.resolve(this);
        }
    };
    complaintsDB.push(complaintDoc);
    return Promise.resolve(complaintDoc);
};

complaintModel.find = function (filter = {}) {
    return createQueryChain(() => {
        return complaintsDB.filter(c => {
            if (filter.customer && c.customer.toString() !== filter.customer.toString()) {
                return false;
            }
            if (filter.status && c.status !== filter.status) {
                return false;
            }
            if (filter.category && c.category !== filter.category) {
                return false;
            }
            if (filter.channel && c.channel !== filter.channel) {
                return false;
            }
            if (filter.priority && c.priority !== filter.priority) {
                return false;
            }
            if (filter.assignedTo && (!c.assignedTo || c.assignedTo.toString() !== filter.assignedTo.toString())) {
                return false;
            }
            return true;
        });
    });
};

complaintModel.findOne = function (query) {
    return createQueryChain(() => {
        let match = null;
        if (query._id) {
            match = complaintsDB.find(c => c._id.toString() === query._id.toString());
        } else if (query.complaintId) {
            match = complaintsDB.find(c => c.complaintId === query.complaintId);
        }
        return match || null;
    });
};

complaintModel.findById = function (id) {
    return createQueryChain(() => {
        return complaintsDB.find(c => c._id.toString() === id.toString()) || null;
    });
};

// Monkey-patch resolutionModel for testing
resolutionModel.create = function (doc) {
    const newId = new mongoose.Types.ObjectId();
    const resDoc = {
        _id: newId,
        resolutionId: doc.resolutionId || `RES-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
        complaint: doc.complaint,
        recommendation: doc.recommendation || null,
        remarks: doc.remarks || null,
        actionTaken: doc.actionTaken || null,
        resolvedBy: doc.resolvedBy || null,
        resolvedAt: doc.resolvedAt || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        save: function () {
            this.updatedAt = new Date();
            const index = resolutionsDB.findIndex(r => r._id.toString() === this._id.toString());
            if (index !== -1) {
                resolutionsDB[index] = { ...this };
            }
            return Promise.resolve(this);
        }
    };
    resolutionsDB.push(resDoc);
    return Promise.resolve(resDoc);
};

resolutionModel.findOne = function (query) {
    return createQueryChain(() => {
        let match = null;
        if (query._id) {
            match = resolutionsDB.find(r => r._id.toString() === query._id.toString());
        } else if (query.complaint) {
            match = resolutionsDB.find(r => r.complaint.toString() === query.complaint.toString());
        } else if (query.resolutionId) {
            match = resolutionsDB.find(r => r.resolutionId === query.resolutionId);
        }
        return match || null;
    });
};

resolutionModel.findById = function (id) {
    return createQueryChain(() => {
        return resolutionsDB.find(r => r._id.toString() === id.toString()) || null;
    });
};


async function runAiIntegrationTests() {

    console.log("==================================================");
    console.log("RUNNING AI ANALYSIS & RESOLUTION LAYER INTEGRATION TESTS");
    console.log("==================================================");

    let passedCount = 0;
    let failedCount = 0;

    function assert(condition, message) {
        if (!condition) {
            console.error(`❌ FAIL: ${message}`);
            failedCount++;
            throw new Error(message);
        } else {
            console.log(`✓ PASS: ${message}`);
            passedCount++;
        }
    }

    try {

        // Setup test users
        const customerAlice = {
            _id: new mongoose.Types.ObjectId(),
            name: "Alice Customer",
            email: "alice.ai@example.com",
            role: "customer",
            isEmailVerified: true,
        };

        const customerBob = {
            _id: new mongoose.Types.ObjectId(),
            name: "Bob Customer",
            email: "bob.ai@example.com",
            role: "customer",
            isEmailVerified: true,
        };

        const cseCharlie = {
            _id: new mongoose.Types.ObjectId(),
            name: "Charlie CSE",
            email: "charlie.cse@resolvo.com",
            role: "cse",
            isEmailVerified: true,
        };

        const qatDan = {
            _id: new mongoose.Types.ObjectId(),
            name: "Dan QAT",
            email: "dan.qat@resolvo.com",
            role: "qat",
            isEmailVerified: true,
        };

        const omEmma = {
            _id: new mongoose.Types.ObjectId(),
            name: "Emma OM",
            email: "emma.om@resolvo.com",
            role: "om",
            isEmailVerified: true,
        };

        usersDB.push(customerAlice, customerBob, cseCharlie, qatDan, omEmma);

        const aliceToken = generateToken(customerAlice);
        const bobToken = generateToken(customerBob);
        const cseToken = generateToken(cseCharlie);
        const qatToken = generateToken(qatDan);
        const omToken = generateToken(omEmma);

        // Store original aiService.analyzeComplaint for controlled mocking
        const originalAnalyzeComplaint = aiService.analyzeComplaint;

        // Create a test complaint for Alice
        const aliceComplaint = await complaintModel.create({
            description: "The herbal face cream bottle arrived broken with glass shards all inside the package.",
            channel: "text",
            status: "Received",
            customer: customerAlice._id,
            receivedAt: new Date(),
        });

        // 1. Unauthenticated analysis request is rejected
        console.log("\n[TEST 1] Unauthenticated AI analysis request");
        const unauthRes = await request(app)
            .post(`/api/complaints/${aliceComplaint._id}/analyze`)
            .send();
        assert(unauthRes.status === 401, "Unauthenticated user rejected with 401 Unauthorized");

        // 2. Unauthorized role is rejected (e.g. OM is not authorized to trigger analysis directly)
        console.log("\n[TEST 2] Unauthorized role rejection for AI analysis");
        const unauthorizedRoleRes = await request(app)
            .post(`/api/complaints/${aliceComplaint._id}/analyze`)
            .set("Authorization", `Bearer ${omToken}`)
            .send();
        assert(unauthorizedRoleRes.status === 403, "Role 'om' rejected with 403 Forbidden");

        // 3. Customer cannot analyze another customer's complaint
        console.log("\n[TEST 3] Customer blocked from analyzing another user's complaint");
        const bobAnalyzeAliceRes = await request(app)
            .post(`/api/complaints/${aliceComplaint._id}/analyze`)
            .set("Authorization", `Bearer ${bobToken}`)
            .send();
        assert(bobAnalyzeAliceRes.status === 403, "Customer Bob denied access to Alice's complaint (403 Forbidden)");

        // 4. AI Service failure handling: complaint remains unchanged
        console.log("\n[TEST 4] AI Service Failure / Unavailable handling");
        aiService.analyzeComplaint = async () => {
            const err = new Error("AI service is currently unreachable");
            err.statusCode = 503;
            throw err;
        };

        const failedAiRes = await request(app)
            .post(`/api/complaints/${aliceComplaint._id}/analyze`)
            .set("Authorization", `Bearer ${aliceToken}`)
            .send();

        assert(failedAiRes.status === 503, "AI service error returned with 503 status");
        assert(failedAiRes.body.message.includes("unreachable"), "Error message informs client of service unavailability");

        // Verify complaint status was NOT modified
        const complaintAfterFailure = complaintsDB.find(c => c._id.toString() === aliceComplaint._id.toString());
        assert(complaintAfterFailure.status === "Received", "Complaint status remained 'Received' after failed analysis");
        assert(complaintAfterFailure.category === null, "Category remained unpopulated");
        assert(complaintAfterFailure.priority === null, "Priority remained unpopulated");

        // 5. Successful AI analysis (Non-resolvable formal flow: Packaging defect)
        console.log("\n[TEST 5] Successful AI Analysis (Formal Complaint flow)");
        aiService.analyzeComplaint = async ({ description, channel }) => {
            return {
                category: "Packaging",
                sentiment: "Negative",
                priority: "High",
                recommendation: "Packaging hazard alert: broken glass hazard. Dispatch immediate replacement unit.",
                is_resolvable_by_ai: false,
            };
        };

        const successAiRes = await request(app)
            .post(`/api/complaints/${aliceComplaint._id}/analyze`)
            .set("Authorization", `Bearer ${aliceToken}`)
            .send();

        assert(successAiRes.status === 200, "AI analysis succeeded with 200 OK");
        assert(successAiRes.body.analysis.category === "Packaging", "FastAPI Category 'Packaging' returned");
        assert(successAiRes.body.analysis.sentiment === "Negative", "FastAPI Sentiment 'Negative' returned");
        assert(successAiRes.body.analysis.priority === "High", "FastAPI Priority 'High' returned");
        assert(successAiRes.body.analysis.isResolvableByAi === false, "AI resolvability is false (requires CSE)");
        assert(successAiRes.body.analysis.recommendation.includes("Packaging hazard"), "AI recommendation returned");

        // 6. Verification of MongoDB fields populated by AI
        console.log("\n[TEST 6] Database persistence of AI analysis fields");
        const updatedComplaintInDb = complaintsDB.find(c => c._id.toString() === aliceComplaint._id.toString());
        assert(updatedComplaintInDb.category === "Packaging", "Category correctly saved in Complaint document");
        assert(updatedComplaintInDb.sentiment === "Negative", "Sentiment correctly saved in Complaint document");
        assert(updatedComplaintInDb.priority === "High", "Priority correctly saved in Complaint document");
        assert(updatedComplaintInDb.aiRecommendation.includes("Packaging hazard"), "aiRecommendation correctly saved in Complaint document");
        assert(updatedComplaintInDb.status === "Analyzed", "Complaint status transitioned from 'Received' to 'Analyzed'");
        assert(updatedComplaintInDb.resolution !== null, "Complaint linked to Resolution document");

        // 7. Verification of Resolution document created during analysis
        console.log("\n[TEST 7] Resolution document creation and linkage");
        const resolutionInDb = resolutionsDB.find(r => r.complaint.toString() === aliceComplaint._id.toString());
        assert(resolutionInDb !== undefined, "Resolution document created");
        assert(resolutionInDb.resolutionId.startsWith("RES-"), "Resolution ID generated with RES- prefix");
        assert(resolutionInDb.recommendation.includes("Packaging hazard"), "AI recommendation preserved in Resolution");
        assert(resolutionInDb.resolvedAt === null, "resolvedAt is null since ticket is not yet resolved");

        // 8. Fetching resolution details via GET /api/complaints/:id/resolution
        console.log("\n[TEST 8] Fetch resolution endpoint (/api/complaints/:id/resolution)");
        const getResRes = await request(app)
            .get(`/api/complaints/${aliceComplaint._id}/resolution`)
            .set("Authorization", `Bearer ${aliceToken}`);
        assert(getResRes.status === 200, "Resolution fetched successfully (200 OK)");
        assert(getResRes.body.resolution.recommendation.includes("Packaging hazard"), "Returned resolution contains AI recommendation");

        // Customer Bob cannot fetch Alice's resolution
        const bobGetRes = await request(app)
            .get(`/api/complaints/${aliceComplaint._id}/resolution`)
            .set("Authorization", `Bearer ${bobToken}`);
        assert(bobGetRes.status === 403, "Bob cannot view Alice's resolution (403 Forbidden)");

        // 9. Customer registers formal complaint (Analyzed -> Registered)
        console.log("\n[TEST 9] Customer registers formal complaint for CSE support");
        const registerRes = await request(app)
            .post(`/api/complaints/${aliceComplaint._id}/register`)
            .set("Authorization", `Bearer ${aliceToken}`);
        assert(registerRes.status === 200, "Formal registration succeeded (200 OK)");
        assert(registerRes.body.complaint.status === "Registered", "Complaint status transitioned to 'Registered'");

        // 10. CSE takes recommended action and updates resolution
        console.log("\n[TEST 10] CSE takes recommended action and completes resolution");
        const cseResolutionRes = await request(app)
            .post(`/api/complaints/${aliceComplaint._id}/resolution`)
            .set("Authorization", `Bearer ${cseToken}`)
            .send({
                actionTaken: "Dispatched replacement face cream batch #FC-902 via priority courier",
                remarks: "Customer notified with express tracking number TRK-88392",
                status: "Resolved"
            });

        assert(cseResolutionRes.status === 200, "Resolution updated successfully by CSE (200 OK)");
        assert(cseResolutionRes.body.complaint.status === "Resolved", "Complaint status updated to 'Resolved'");
        assert(cseResolutionRes.body.complaint.resolvedAt !== null, "Complaint resolvedAt timestamp recorded");
        assert(cseResolutionRes.body.resolution.actionTaken.includes("Dispatched replacement"), "actionTaken stored in Resolution");
        assert(cseResolutionRes.body.resolution.remarks.includes("express tracking"), "remarks stored in Resolution");
        const resolvedById = cseResolutionRes.body.resolution.resolvedBy._id || cseResolutionRes.body.resolution.resolvedBy;
        assert(resolvedById.toString() === cseCharlie._id.toString(), "resolvedBy recorded as Charlie CSE");

        // 11. Customer AI workflow: Immediate AI Resolution flow
        console.log("\n[TEST 11] Customer AI workflow: Immediate AI-resolvable inquiry");
        const bobInquiryComplaint = await complaintModel.create({
            description: "How many hours after opening should the vitamin elixir be refrigerated?",
            channel: "chatbot",
            status: "Received",
            customer: customerBob._id,
            receivedAt: new Date(),
        });

        aiService.analyzeComplaint = async ({ description, channel }) => {
            return {
                category: "Product",
                sentiment: "Neutral",
                priority: "Low",
                recommendation: "Product guidance: Refrigerate within 2 hours of opening. Keep stored below 8°C.",
                is_resolvable_by_ai: true,
            };
        };

        const bobAiRes = await request(app)
            .post(`/api/complaints/${bobInquiryComplaint._id}/analyze`)
            .set("Authorization", `Bearer ${bobToken}`)
            .send();

        assert(bobAiRes.status === 200, "AI analysis succeeded (200 OK)");
        assert(bobAiRes.body.analysis.isResolvableByAi === true, "AI identified issue as resolvable immediately");
        assert(bobAiRes.body.complaint.status === "Resolved", "Status transitioned directly to 'Resolved'");
        assert(bobAiRes.body.complaint.resolvedAt !== null, "resolvedAt timestamp set for AI resolution");
        assert(bobAiRes.body.resolution.actionTaken === "AI Resolution Provided", "actionTaken reflects AI Resolution");

        // 12. CSE triggers AI analysis on a direct intake complaint
        console.log("\n[TEST 12] CSE triggers AI analysis on a complaint");
        const directComplaint = await complaintModel.create({
            description: "Customer phoned in stating order delivery has been delayed for over two weeks.",
            channel: "call",
            status: "Registered",
            customer: customerAlice._id,
            assignedTo: cseCharlie._id,
            receivedAt: new Date(),
        });

        aiService.analyzeComplaint = async ({ description, channel }) => {
            return {
                category: "Trade",
                sentiment: "Negative",
                priority: "Medium",
                recommendation: "Logistics trace: Contact shipping provider and update customer tracking timeline within 24 hours.",
                is_resolvable_by_ai: false,
            };
        };

        const cseAnalyzeRes = await request(app)
            .post(`/api/complaints/${directComplaint._id}/analyze`)
            .set("Authorization", `Bearer ${cseToken}`)
            .send();

        assert(cseAnalyzeRes.status === 200, "CSE analyzed complaint successfully (200 OK)");
        assert(cseAnalyzeRes.body.analysis.category === "Trade", "Category identified as Trade");
        assert(cseAnalyzeRes.body.complaint.status === "Registered", "Pre-registered complaint retains Registered status");
        assert(cseAnalyzeRes.body.complaint.aiRecommendation.includes("Logistics trace"), "Recommendation saved");

        // 13. QAT triggers analysis
        console.log("\n[TEST 13] QAT reviews and triggers AI analysis");
        const qatAnalyzeRes = await request(app)
            .post(`/api/complaints/${directComplaint._id}/analyze`)
            .set("Authorization", `Bearer ${qatToken}`)
            .send();
        assert(qatAnalyzeRes.status === 200, "QAT authorized to trigger AI analysis (200 OK)");

        // Restore original service function
        aiService.analyzeComplaint = originalAnalyzeComplaint;

        console.log("\n==================================================");
        console.log(`SUMMARY: ${passedCount} tests passed, ${failedCount} tests failed.`);
        console.log("ALL AI ANALYSIS & RESOLUTION LAYER INTEGRATION TESTS PASSED!");
        console.log("==================================================");

    } catch (err) {
        console.error("\nTEST SUITE TERMINATED WITH ERROR:", err.message);
        process.exit(1);
    }

}


runAiIntegrationTests();
