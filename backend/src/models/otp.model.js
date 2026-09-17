const mongoose = require("mongoose");


const otpSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
    },

    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
    },

    otpHash: {
        type: String,
        required: true,
    },

    purpose: {
        type: String,
        enum: [
            "email_verification",
            "password_reset",
        ],
        default: "email_verification",
    },

    expiresAt: {
        type: Date,
        required: true,
        index: {
            expires: 0,
        },
    },

}, {
    timestamps: true,
});


const otpModel = mongoose.model(
    "otp",
    otpSchema
);


module.exports = otpModel;
