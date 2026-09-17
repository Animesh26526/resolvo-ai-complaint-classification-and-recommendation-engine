const mongoose = require("mongoose");


const complaintSchema = new mongoose.Schema({

    complaintId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },

    description: {
        type: String,
        required: true,
        trim: true,
    },

    category: {
        type: String,
        enum: [
            "Product",
            "Packaging",
            "Trade",
        ],
        default: null,
    },

    priority: {
        type: String,
        enum: [
            "High",
            "Medium",
            "Low",
        ],
        default: null,
    },

    status: {
        type: String,
        enum: [
            "Received",
            "Analyzed",
            "Registered",
            "Assigned",
            "In Progress",
            "Resolved",
            "Escalated",
        ],
        default: "Received",
        required: true,
    },

    channel: {
        type: String,
        enum: [
            "text",
            "email",
            "call",
            "chatbot",
            "direct",
        ],
        default: "text",
        required: true,
    },

    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
    },

    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        default: null,
    },

    sentiment: {
        type: String,
        default: null,
    },

    aiRecommendation: {
        type: String,
        default: null,
    },

    receivedAt: {
        type: Date,
        default: Date.now,
    },

    slaDeadline: {
        type: Date,
        default: null,
    },

    resolvedAt: {
        type: Date,
        default: null,
    },

    resolution: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "resolution",
        default: null,
    },

}, {
    timestamps: true,
});


complaintSchema.pre("validate", function (next) {

    if (!this.complaintId) {
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        this.complaintId = `CMP-${Date.now()}-${randomSuffix}`;
    }

    next();

});


const complaintModel = mongoose.model(
    "complaint",
    complaintSchema
);


module.exports = complaintModel;
