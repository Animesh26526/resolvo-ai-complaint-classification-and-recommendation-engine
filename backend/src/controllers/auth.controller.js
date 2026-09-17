const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userModel = require("../models/user.model");
const otpModel = require("../models/otp.model");
const { sendVerificationEmail } = require("../services/email.service");


const VALID_ROLES = ["customer", "cse", "qat", "om"];


function generateOtpCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}


async function registerUser(req, res) {

    const {
        name,
        email,
        password,
        role,
    } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).json({
            message: "Full name is required",
        });
    }

    if (!email || !email.trim()) {
        return res.status(400).json({
            message: "Email address is required",
        });
    }

    if (!password || password.length < 6) {
        return res.status(400).json({
            message: "Password must be at least 6 characters long",
        });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const assignedRole = role ? role.toLowerCase() : "customer";

    if (role && !VALID_ROLES.includes(assignedRole)) {
        return res.status(400).json({
            message: `Invalid role specified. Allowed roles: ${VALID_ROLES.join(", ")}`,
        });
    }

    const isUserAlreadyExists = await userModel.findOne({
        email: normalizedEmail,
    });

    if (isUserAlreadyExists) {
        return res.status(409).json({
            message: "An account with this email already exists",
        });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await userModel.create({
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: assignedRole,
        isEmailVerified: false,
    });

    const otpCode = generateOtpCode();
    const otpSalt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(otpCode, otpSalt);
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await otpModel.deleteMany({
        email: normalizedEmail,
    });

    await otpModel.create({
        userId: user._id,
        email: normalizedEmail,
        otpHash: otpHash,
        purpose: "email_verification",
        expiresAt: otpExpiresAt,
    });

    await sendVerificationEmail(normalizedEmail, otpCode);

    res.status(201).json({
        message: "Registration successful. Please verify your email with the OTP sent to your inbox.",
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
        },
    });

}


async function verifyEmail(req, res) {

    const {
        email,
        otp,
    } = req.body;

    if (!email || !otp) {
        return res.status(400).json({
            message: "Email and OTP are required for verification",
        });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const providedOtp = otp.toString().trim();

    const user = await userModel.findOne({
        email: normalizedEmail,
    });

    if (!user) {
        return res.status(404).json({
            message: "User account not found",
        });
    }

    if (user.isEmailVerified) {
        return res.status(400).json({
            message: "Email address is already verified. Please log in.",
        });
    }

    const otpRecord = await otpModel
        .findOne({
            email: normalizedEmail,
            purpose: "email_verification",
        })
        .sort({ createdAt: -1 });

    if (!otpRecord) {
        return res.status(400).json({
            message: "No verification code found. Please request a new OTP.",
        });
    }

    const isExpired = new Date() > new Date(otpRecord.expiresAt);

    if (isExpired) {

        await otpModel.deleteMany({
            email: normalizedEmail,
        });

        return res.status(400).json({
            message: "Verification code has expired. Please request a new one.",
        });

    }

    const isOtpValid = await bcrypt.compare(providedOtp, otpRecord.otpHash);

    if (!isOtpValid) {
        return res.status(400).json({
            message: "Invalid verification code",
        });
    }

    user.isEmailVerified = true;
    await user.save();

    await otpModel.deleteMany({
        email: normalizedEmail,
    });

    res.status(200).json({
        message: "Email verified successfully. You can now log in to your account.",
    });

}


async function resendVerificationOtp(req, res) {

    const { email } = req.body;

    if (!email || !email.trim()) {
        return res.status(400).json({
            message: "Email address is required",
        });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await userModel.findOne({
        email: normalizedEmail,
    });

    if (!user) {
        return res.status(404).json({
            message: "User account not found",
        });
    }

    if (user.isEmailVerified) {
        return res.status(400).json({
            message: "Email is already verified. Please log in.",
        });
    }

    const otpCode = generateOtpCode();
    const otpSalt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(otpCode, otpSalt);
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await otpModel.deleteMany({
        email: normalizedEmail,
    });

    await otpModel.create({
        userId: user._id,
        email: normalizedEmail,
        otpHash: otpHash,
        purpose: "email_verification",
        expiresAt: otpExpiresAt,
    });

    await sendVerificationEmail(normalizedEmail, otpCode);

    res.status(200).json({
        message: "A new verification OTP has been sent to your email.",
    });

}


async function loginUser(req, res) {

    const {
        email,
        password,
    } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Email and password are required",
        });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await userModel.findOne({
        email: normalizedEmail,
    });

    if (!user) {
        return res.status(401).json({
            message: "Invalid email or password",
        });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        return res.status(401).json({
            message: "Invalid email or password",
        });
    }

    if (!user.isEmailVerified) {
        return res.status(403).json({
            message: "Email address is not verified. Please verify your email before logging in.",
        });
    }

    const jwtSecret = process.env.JWT_SECRET || "default_dev_secret";
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "7d";

    const token = jwt.sign(
        {
            id: user._id,
            role: user.role,
        },
        jwtSecret,
        {
            expiresIn: jwtExpiresIn,
        }
    );

    res.status(200).json({
        message: "Login successful",
        token: token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
        },
    });

}


async function logoutUser(req, res) {

    res.status(200).json({
        message: "Logged out successfully",
    });

}


async function getCurrentUser(req, res) {

    const user = await userModel
        .findById(req.user.id)
        .select("-password");

    if (!user) {
        return res.status(404).json({
            message: "User not found",
        });
    }

    res.status(200).json({
        message: "Current user profile fetched successfully",
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            createdAt: user.createdAt,
        },
    });

}


module.exports = {
    registerUser,
    verifyEmail,
    resendVerificationOtp,
    loginUser,
    logoutUser,
    getCurrentUser,
};
