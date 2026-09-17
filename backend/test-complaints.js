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

    return populated;
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


async function runComplaintTests() {

    console.log("==================================================");
    console.log("RUNNING COMPLAINT MANAGEMENT FOUNDATION TESTS");
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
        const customer1 = {
            _id: new mongoose.Types.ObjectId(),
            name: "Alice Customer",
            email: "alice@example.com",
            role: "customer",
            isEmailVerified: true,
        };
        const customer2 = {
            _id: new mongoose.Types.ObjectId(),
            name: "Bob Customer",
            email: "bob@example.com",
            role: "customer",
            isEmailVerified: true,
        };
        const cseUser = {
            _id: new mongoose.Types.ObjectId(),
            name: "Charlie CSE",
            email: "charlie@resolvo.com",
            role: "cse",
            isEmailVerified: true,
        };
        const omUser = {
            _id: new mongoose.Types.ObjectId(),
            name: "Diana OM",
            email: "diana@resolvo.com",
            role: "om",
            isEmailVerified: true,
        };

        usersDB.push(customer1, customer2, cseUser, omUser);

        const customer1Token = generateToken(customer1);
        const customer2Token = generateToken(customer2);
        const cseToken = generateToken(cseUser);
        const omToken = generateToken(omUser);

        // 1. Unauthenticated user cannot create complaint
        console.log("\n[TEST 1] Unauthenticated complaint creation");
        const unauthCreate = await request(app)
            .post("/api/complaints")
            .send({ description: "My order was broken." });
        assert(unauthCreate.status === 401, "Unauthenticated user rejected with 401 Unauthorized");

        // 2. Missing required description validation
        console.log("\n[TEST 2] Missing required description");
        const missingDesc = await request(app)
            .post("/api/complaints")
            .set("Authorization", `Bearer ${customer1Token}`)
            .send({ channel: "text" });
        assert(missingDesc.status === 400, "Missing description rejected with 400 Bad Request");
        assert(missingDesc.body.message.includes("description is required"), "Error mentions description requirement");

        // 3. Invalid channel rejected
        console.log("\n[TEST 3] Invalid channel rejection");
        const invalidChannel = await request(app)
            .post("/api/complaints")
            .set("Authorization", `Bearer ${customer1Token}`)
            .send({
                description: "Defective packaging seal.",
                channel: "carrier-pigeon"
            });
        assert(invalidChannel.status === 400, "Invalid channel rejected with 400 Bad Request");
        assert(invalidChannel.body.message.includes("Supported channels"), "Error message lists valid channels");

        // 4. Invalid category rejected
        console.log("\n[TEST 4] Invalid category rejection");
        const invalidCategory = await request(app)
            .post("/api/complaints")
            .set("Authorization", `Bearer ${customer1Token}`)
            .send({
                description: "Defective packaging seal.",
                category: "InvalidCategory"
            });
        assert(invalidCategory.status === 400, "Invalid category rejected with 400 Bad Request");

        // 5. Customer creates complaint successfully
        console.log("\n[TEST 5] Customer creates complaint successfully");
        const createRes = await request(app)
            .post("/api/complaints")
            .set("Authorization", `Bearer ${customer1Token}`)
            .send({
                description: "Wellness tea box arrived torn and contaminated.",
                channel: "text",
                category: "Packaging"
            });
        assert(createRes.status === 201, "Complaint created successfully with 201 Created");
        assert(createRes.body.complaint && createRes.body.complaint.complaintId, "Generated human-readable complaintId");
        assert(createRes.body.complaint.complaintId.startsWith("CMP-"), "complaintId has CMP- prefix");
        assert(createRes.body.complaint.status === "Received", "Initial status is 'Received'");
        assert(createRes.body.complaint.customer.toString() === customer1._id.toString(), "Complaint is associated with authenticated customer");

        const aliceComplaintId = createRes.body.complaint._id;

        // 6. Persistence in MongoDB check
        console.log("\n[TEST 6] Persistence verification");
        const storedInDb = complaintsDB.find(c => c._id.toString() === aliceComplaintId.toString());
        assert(storedInDb !== undefined, "Complaint persisted in database");
        assert(storedInDb.description === "Wellness tea box arrived torn and contaminated.", "Stored description matches");
        assert(storedInDb.channel === "text", "Stored channel matches");

        // 7. Customer retrieves their complaint history
        console.log("\n[TEST 7] Customer retrieves complaint history");
        const historyRes = await request(app)
            .get("/api/complaints")
            .set("Authorization", `Bearer ${customer1Token}`);
        assert(historyRes.status === 200, "Customer history fetched with 200 OK");
        assert(historyRes.body.complaints.length === 1, "Returns exactly customer1's complaints");
        assert(historyRes.body.complaints[0]._id.toString() === aliceComplaintId.toString(), "History contains created complaint");

        // Customer2 has empty history
        const bobHistoryRes = await request(app)
            .get("/api/complaints")
            .set("Authorization", `Bearer ${customer2Token}`);
        assert(bobHistoryRes.status === 200, "Customer2 history fetched with 200 OK");
        assert(bobHistoryRes.body.complaints.length === 0, "Customer2 does not see Customer1 complaints");

        // 8. Customer retrieves specific complaint by ID
        console.log("\n[TEST 8] Customer retrieves their specific complaint");
        const getSingleRes = await request(app)
            .get(`/api/complaints/${aliceComplaintId}`)
            .set("Authorization", `Bearer ${customer1Token}`);
        assert(getSingleRes.status === 200, "Customer retrieves own complaint (200 OK)");
        assert(getSingleRes.body.complaint.description === "Wellness tea box arrived torn and contaminated.", "Complaint details match");

        // 9. Customer cannot access another customer's complaint
        console.log("\n[TEST 9] Customer blocked from viewing another customer's complaint");
        const forbiddenRes = await request(app)
            .get(`/api/complaints/${aliceComplaintId}`)
            .set("Authorization", `Bearer ${customer2Token}`);
        assert(forbiddenRes.status === 403, "Customer2 denied access to Customer1 complaint with 403 Forbidden");

        // 10. Non-existent complaint returns 404
        console.log("\n[TEST 10] Non-existent complaint handling");
        const nonExistentId = new mongoose.Types.ObjectId();
        const notFoundRes = await request(app)
            .get(`/api/complaints/${nonExistentId}`)
            .set("Authorization", `Bearer ${customer1Token}`);
        assert(notFoundRes.status === 404, "Non-existent complaint returns 404 Not Found");

        // 11. Customer cannot access CSE-only operations
        console.log("\n[TEST 11] Customer blocked from CSE-only operations");
        const customerStaffList = await request(app)
            .get("/api/complaints/staff")
            .set("Authorization", `Bearer ${customer1Token}`);
        assert(customerStaffList.status === 403, "Customer blocked from /api/complaints/staff (403 Forbidden)");

        const customerStatusUpdate = await request(app)
            .patch(`/api/complaints/${aliceComplaintId}/status`)
            .set("Authorization", `Bearer ${customer1Token}`)
            .send({ status: "Resolved" });
        assert(customerStatusUpdate.status === 403, "Customer blocked from status update endpoint (403 Forbidden)");

        // 12. CSE can view complaints list and filter
        console.log("\n[TEST 12] CSE views and filters staff complaints");
        const cseListRes = await request(app)
            .get("/api/complaints/staff")
            .set("Authorization", `Bearer ${cseToken}`);
        assert(cseListRes.status === 200, "CSE retrieves complaints list (200 OK)");
        assert(cseListRes.body.complaints.length === 1, "CSE sees all complaints");

        const cseFilterRes = await request(app)
            .get("/api/complaints/staff?category=Packaging")
            .set("Authorization", `Bearer ${cseToken}`);
        assert(cseFilterRes.status === 200 && cseFilterRes.body.complaints.length === 1, "Category filter works");

        const cseFilterEmpty = await request(app)
            .get("/api/complaints/staff?category=Trade")
            .set("Authorization", `Bearer ${cseToken}`);
        assert(cseFilterEmpty.status === 200 && cseFilterEmpty.body.complaints.length === 0, "Filter returns empty when no match");

        // 13. CSE can view any complaint details
        console.log("\n[TEST 13] CSE views complaint details");
        const cseViewRes = await request(app)
            .get(`/api/complaints/${aliceComplaintId}`)
            .set("Authorization", `Bearer ${cseToken}`);
        assert(cseViewRes.status === 200, "CSE can view any complaint (200 OK)");
        assert(cseViewRes.body.complaint.customer.name === "Alice Customer", "Populated customer details included");

        // 14. CSE assigns complaint
        console.log("\n[TEST 14] CSE assigns complaint");
        const assignRes = await request(app)
            .patch(`/api/complaints/${aliceComplaintId}/assign`)
            .set("Authorization", `Bearer ${cseToken}`)
            .send({ assignedTo: cseUser._id.toString() });
        assert(assignRes.status === 200, "CSE assigns complaint successfully (200 OK)");
        assert(assignRes.body.complaint.assignedTo._id.toString() === cseUser._id.toString(), "assignedTo matches CSE user ID");
        assert(assignRes.body.complaint.status === "Assigned", "Status transitioned to 'Assigned'");

        // 15. Invalid status transition rejected
        console.log("\n[TEST 15] Invalid status transition rejected");
        const invalidTransition = await request(app)
            .patch(`/api/complaints/${aliceComplaintId}/status`)
            .set("Authorization", `Bearer ${cseToken}`)
            .send({ status: "Received" }); // Assigned -> Received is invalid
        assert(invalidTransition.status === 400, "Invalid status transition rejected with 400 Bad Request");
        assert(invalidTransition.body.message.includes("Invalid status transition"), "Clear error message describing invalid transition");

        // 16. CSE updates status to In Progress, then Resolved
        console.log("\n[TEST 16] CSE status updates progression");
        const inProgressRes = await request(app)
            .patch(`/api/complaints/${aliceComplaintId}/status`)
            .set("Authorization", `Bearer ${cseToken}`)
            .send({ status: "In Progress" });
        assert(inProgressRes.status === 200, "Status updated to 'In Progress'");
        assert(inProgressRes.body.complaint.status === "In Progress", "Complaint status is In Progress");

        const resolveRes = await request(app)
            .patch(`/api/complaints/${aliceComplaintId}/status`)
            .set("Authorization", `Bearer ${cseToken}`)
            .send({ status: "Resolved" });
        assert(resolveRes.status === 200, "Status updated to 'Resolved'");
        assert(resolveRes.body.complaint.status === "Resolved", "Complaint status is Resolved");
        assert(resolveRes.body.complaint.resolvedAt !== null, "resolvedAt timestamp is set upon resolution");

        // 17. Customer sees updated status
        console.log("\n[TEST 17] Customer sees updated status");
        const customerCheckRes = await request(app)
            .get(`/api/complaints/${aliceComplaintId}`)
            .set("Authorization", `Bearer ${customer1Token}`);
        assert(customerCheckRes.status === 200, "Customer can fetch complaint");
        assert(customerCheckRes.body.complaint.status === "Resolved", "Customer sees updated 'Resolved' status");

        // 18. CSE direct intake / register complaint
        console.log("\n[TEST 18] CSE direct complaint registration");
        const cseDirectRes = await request(app)
            .post("/api/complaints/staff")
            .set("Authorization", `Bearer ${cseToken}`)
            .send({
                description: "Customer phoned in reporting delayed delivery.",
                channel: "call",
                customerId: customer2._id.toString(),
                category: "Trade"
            });
        assert(cseDirectRes.status === 201, "CSE registered complaint with 201 Created");
        assert(cseDirectRes.body.complaint.channel === "call", "Channel recorded as 'call'");
        assert(cseDirectRes.body.complaint.status === "Registered", "Initial status for CSE direct intake is 'Registered'");
        assert(cseDirectRes.body.complaint.customer._id.toString() === customer2._id.toString(), "Associated with target customer");

        console.log("\n==================================================");
        console.log(`SUMMARY: ${passedCount} tests passed, ${failedCount} tests failed.`);
        console.log("ALL COMPLAINT MANAGEMENT FOUNDATION TESTS PASSED!");
        console.log("==================================================");

    } catch (err) {
        console.error("\nTEST SUITE TERMINATED WITH ERROR:", err.message);
        process.exit(1);
    }

}


runComplaintTests();
