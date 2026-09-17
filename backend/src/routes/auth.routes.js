const express = require("express");

const {
    registerUser,
    verifyEmail,
    resendVerificationOtp,
    loginUser,
    logoutUser,
    getCurrentUser,
} = require("../controllers/auth.controller");

const {
    authenticateUser,
    authorizeRoles,
} = require("../middlewares/auth.middleware");

const router = express.Router();


router.post(
    "/register",
    registerUser
);

router.post(
    "/verify-email",
    verifyEmail
);

router.post(
    "/resend-otp",
    resendVerificationOtp
);

router.post(
    "/login",
    loginUser
);

router.post(
    "/logout",
    logoutUser
);

router.get(
    "/me",
    authenticateUser,
    getCurrentUser
);

router.get(
    "/staff-check",
    authenticateUser,
    authorizeRoles("cse", "qat", "om"),
    (req, res) => {
        res.status(200).json({
            message: "Authorized staff access granted",
            role: req.user.role,
        });
    }
);



module.exports = router;
