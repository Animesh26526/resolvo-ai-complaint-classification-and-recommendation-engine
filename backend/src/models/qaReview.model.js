// Defines the MongoDB schema for Quality Assurance (QA) review records.

const mongoose = require("mongoose");

const qaReviewSchema = new mongoose.Schema({
    reviewId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    complaint: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "complaint",
        required: true,
        index: true,
    },
    reviewer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
        index: true,
    },
    classificationResult: {
        type: String,
        enum: ["Agreed", "Disagreed", "Corrected"],
        required: true,
    },
    reviewRemarks: {
        type: String,
        trim: true,
        default: "",
    },
    correctedCategory: {
        type: String,
        enum: ["Product", "Packaging", "Trade"],
        default: null,
    },
    correctedPriority: {
        type: String,
        enum: ["High", "Medium", "Low"],
        default: null,
    },
    originalAiAnalysis: {
        category: {
            type: String,
            default: null,
        },
        sentiment: {
            type: String,
            default: null,
        },
        priority: {
            type: String,
            default: null,
        },
        recommendation: {
            type: String,
            default: null,
        },
    },
}, {
    timestamps: true,
});

qaReviewSchema.pre("validate", function (next) {
    if (!this.reviewId) {
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        this.reviewId = `REV-${Date.now()}-${randomSuffix}`;
    }
    next();
});

const qaReviewModel = mongoose.model("qaReview", qaReviewSchema);

module.exports = qaReviewModel;
