require("dotenv").config();

process.env.JWT_SECRET = "test_jwt_secret_key_1234567890";
process.env.JWT_EXPIRES_IN = "1h";

const request = require("supertest");
const bcrypt = require("bcryptjs");
const app = require("./src/app");
const userModel = require("./src/models/user.model");
const otpModel = require("./src/models/otp.model");


// In-memory simulated collections
const usersDB = [];
const otpsDB = [];

// Monkey-patch Mongoose models to run end-to-end tests in-memory
userModel.findOne = function (query) {
    let result = null;
    if (query.email) {
        result = usersDB.find(u => u.email.toLowerCase() === query.email.toLowerCase()) || null;
    }
    return Promise.resolve(result);
};

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
        }
    };
};

userModel.create = function (doc) {
    const userDoc = {
        _id: "user_" + Math.random().toString(36).substring(2, 9),
        name: doc.name,
        email: doc.email.toLowerCase(),
        password: doc.password,
        role: doc.role || "customer",
        isEmailVerified: doc.isEmailVerified || false,
        createdAt: new Date(),
        updatedAt: new Date(),
        save: function () {
            this.updatedAt = new Date();
            return Promise.resolve(this);
        }
    };
    usersDB.push(userDoc);
    return Promise.resolve(userDoc);
};

otpModel.findOne = function (query) {
    return {
        sort: function () {
            const matches = otpsDB
                .filter(o => o.email.toLowerCase() === query.email.toLowerCase())
                .sort((a, b) => b.createdAt - a.createdAt);
            return Promise.resolve(matches[0] || null);
        }
    };
};

otpModel.create = function (doc) {
    const otpDoc = {
        _id: "otp_" + Math.random().toString(36).substring(2, 9),
        userId: doc.userId,
        email: doc.email.toLowerCase(),
        otpHash: doc.otpHash,
        purpose: doc.purpose || "email_verification",
        expiresAt: doc.expiresAt,
        createdAt: new Date()
    };
    otpsDB.push(otpDoc);
    return Promise.resolve(otpDoc);
};

otpModel.deleteMany = function (query) {
    if (query.email) {
        const initialCount = otpsDB.length;
        for (let i = otpsDB.length - 1; i >= 0; i--) {
            if (otpsDB[i].email.toLowerCase() === query.email.toLowerCase()) {
                otpsDB.splice(i, 1);
            }
        }
    }
    return Promise.resolve({ acknowledged: true });
};


async function runTestSuite() {

    console.log("==================================================");
    console.log("RUNNING AUTHENTICATION & RBAC END-TO-END TESTS");
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

        // 1. Validation error on missing fields
        console.log("\n[TEST 1] Registration Validation (missing fields)");
        const invalidReg = await request(app)
            .post("/api/auth/register")
            .send({ name: "Incomplete" });
        assert(invalidReg.status === 400, "Rejects registration with missing email/password (400)");

        // 2. Successful registration
        console.log("\n[TEST 2] Successful User Registration");
        const regRes = await request(app)
            .post("/api/auth/register")
            .send({
                name: "John Doe",
                email: "john@example.com",
                password: "SecurePassword123!",
                role: "customer"
            });
        assert(regRes.status === 201, "Registers user with 201 Created");
        assert(regRes.body.user && regRes.body.user.email === "john@example.com", "Returns user info in response");
        assert(!regRes.body.user.password, "Password is not returned in response");
        assert(regRes.body.user.isEmailVerified === false, "User is registered as unverified (isEmailVerified=false)");

        // Verify password hashing
        const storedUser = usersDB.find(u => u.email === "john@example.com");
        assert(storedUser.password !== "SecurePassword123!", "Password is not plaintext");
        const passwordMatches = await bcrypt.compare("SecurePassword123!", storedUser.password);
        assert(passwordMatches, "Stored password is a valid bcrypt hash");

        // Verify OTP was hashed
        const storedOtp = otpsDB.find(o => o.email === "john@example.com");
        assert(storedOtp && storedOtp.otpHash, "OTP record created in database");
        assert(storedOtp.otpHash.startsWith("$2"), "OTP is hashed with bcrypt");

        // 3. Duplicate registration rejection
        console.log("\n[TEST 3] Duplicate Registration Handling");
        const dupRes = await request(app)
            .post("/api/auth/register")
            .send({
                name: "John Duplicate",
                email: "john@example.com",
                password: "AnotherPassword123!",
                role: "customer"
            });
        assert(dupRes.status === 409, "Duplicate registration rejected with 409 Conflict");

        // 4. Login blocked for unverified email
        console.log("\n[TEST 4] Unverified Email Login Attempt");
        const unverifiedLogin = await request(app)
            .post("/api/auth/login")
            .send({
                email: "john@example.com",
                password: "SecurePassword123!"
            });
        assert(unverifiedLogin.status === 403, "Unverified user login rejected with 403 Forbidden");

        // 5. Verify email with wrong OTP
        console.log("\n[TEST 5] Invalid OTP Verification");
        const wrongOtpRes = await request(app)
            .post("/api/auth/verify-email")
            .send({
                email: "john@example.com",
                otp: "000000"
            });
        assert(wrongOtpRes.status === 400, "Wrong OTP rejected with 400 Bad Request");

        // 6. Verify email with expired OTP
        console.log("\n[TEST 6] Expired OTP Handling");
        storedOtp.expiresAt = new Date(Date.now() - 5000); // Set to past
        const expiredOtpRes = await request(app)
            .post("/api/auth/verify-email")
            .send({
                email: "john@example.com",
                otp: "123456"
            });
        assert(expiredOtpRes.status === 400, "Expired OTP rejected with 400 Bad Request");
        assert(expiredOtpRes.body.message.includes("expired"), "Error message specifies OTP expiration");

        // 7. Resend OTP and verify successfully
        console.log("\n[TEST 7] Resend OTP & Successful Email Verification");
        const resendRes = await request(app)
            .post("/api/auth/resend-otp")
            .send({ email: "john@example.com" });
        assert(resendRes.status === 200, "Resend OTP returns 200 OK");

        // Plant known OTP for deterministic verification
        const validOtp = "789123";
        const validOtpHash = await bcrypt.hash(validOtp, 10);
        const activeOtp = otpsDB.find(o => o.email === "john@example.com");
        activeOtp.otpHash = validOtpHash;
        activeOtp.expiresAt = new Date(Date.now() + 600000);

        const verifyRes = await request(app)
            .post("/api/auth/verify-email")
            .send({
                email: "john@example.com",
                otp: validOtp
            });
        assert(verifyRes.status === 200, "Valid OTP verification returns 200 OK");
        assert(storedUser.isEmailVerified === true, "User email marked verified in DB");
        const remainingOtps = otpsDB.filter(o => o.email === "john@example.com");
        assert(remainingOtps.length === 0, "OTP record invalidated/deleted after verification");

        // 8. Successful Login with verified account
        console.log("\n[TEST 8] Successful Login & JWT Issuance");
        const loginRes = await request(app)
            .post("/api/auth/login")
            .send({
                email: "john@example.com",
                password: "SecurePassword123!"
            });
        assert(loginRes.status === 200, "Login returns 200 OK");
        assert(loginRes.body.token && typeof loginRes.body.token === "string", "JWT token received");
        assert(!loginRes.body.user.password, "Password not exposed in login response");
        assert(loginRes.body.user.role === "customer", "User role correctly returned");

        const customerToken = loginRes.body.token;

        // 9. Login with invalid password
        console.log("\n[TEST 9] Invalid Password Login Attempt");
        const badPasswordLogin = await request(app)
            .post("/api/auth/login")
            .send({
                email: "john@example.com",
                password: "WrongPassword999!"
            });
        assert(badPasswordLogin.status === 401, "Wrong password rejected with 401 Unauthorized");

        // 10. Authenticated /api/auth/me
        console.log("\n[TEST 10] Get Current User Profile (/api/auth/me)");
        const meRes = await request(app)
            .get("/api/auth/me")
            .set("Authorization", `Bearer ${customerToken}`);
        assert(meRes.status === 200, "Fetching profile with valid JWT returns 200 OK");
        assert(meRes.body.user.email === "john@example.com", "Correct user profile returned");
        assert(!meRes.body.user.password, "Password omitted from profile");

        // 11. Unauthenticated /api/auth/me rejection
        console.log("\n[TEST 11] Unauthenticated Access Rejection");
        const unauthMe = await request(app).get("/api/auth/me");
        assert(unauthMe.status === 401, "Access without token rejected with 401 Unauthorized");

        const badTokenMe = await request(app)
            .get("/api/auth/me")
            .set("Authorization", "Bearer invalid.jwt.token");
        assert(badTokenMe.status === 401, "Access with invalid token rejected with 401 Unauthorized");

        // 12. Logout
        console.log("\n[TEST 12] Logout Endpoint");
        const logoutRes = await request(app).post("/api/auth/logout");
        assert(logoutRes.status === 200, "Logout returns 200 OK");

        // 13. RBAC Testing: Customer rejected from staff-only route
        console.log("\n[TEST 13] Role-Based Access Control (RBAC) - Customer Rejection");
        const customerRbacRes = await request(app)
            .get("/api/auth/staff-check")
            .set("Authorization", `Bearer ${customerToken}`);
        assert(customerRbacRes.status === 403, "Customer rejected from staff-only endpoint with 403 Forbidden");

        // 14. RBAC Testing: CSE, QAT, OM Authorized
        console.log("\n[TEST 14] Role-Based Access Control (RBAC) - Staff Authorization (CSE, QAT, OM)");
        const rolesToTest = ["cse", "qat", "om"];

        for (const role of rolesToTest) {
            const staffEmail = `${role}@resolvo.com`;
            const staffPassHash = await bcrypt.hash("StaffSecret123!", 10);
            const staffUser = {
                _id: "user_" + role,
                name: `${role.toUpperCase()} User`,
                email: staffEmail,
                password: staffPassHash,
                role: role,
                isEmailVerified: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            usersDB.push(staffUser);

            const staffLogin = await request(app)
                .post("/api/auth/login")
                .send({
                    email: staffEmail,
                    password: "StaffSecret123!"
                });
            assert(staffLogin.status === 200, `Login succeeded for role [${role}]`);

            const staffToken = staffLogin.body.token;

            const staffCheck = await request(app)
                .get("/api/auth/staff-check")
                .set("Authorization", `Bearer ${staffToken}`);
            assert(staffCheck.status === 200, `Staff endpoint authorized for role [${role}] (200 OK)`);
            assert(staffCheck.body.role === role, `Role [${role}] confirmed in response`);
        }

        console.log("\n==================================================");
        console.log(`SUMMARY: ${passedCount} tests passed, ${failedCount} tests failed.`);
        console.log("ALL AUTHENTICATION & AUTHORIZATION TESTS PASSED SUCCESSFULLY!");
        console.log("==================================================");

    } catch (err) {
        console.error("\nTEST SUITE TERMINATED WITH ERROR:", err.message);
        process.exit(1);
    }

}


runTestSuite();
