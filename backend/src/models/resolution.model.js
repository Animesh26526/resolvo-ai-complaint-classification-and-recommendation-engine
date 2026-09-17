const mongoose = require("mongoose");


const resolutionSchema = new mongoose.Schema({

    resolutionId: {
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

    recommendation: {
        type: String,
        default: null,
    },

    remarks: {
        type: String,
        default: null,
    },

    actionTaken: {
        type: String,
        default: null,
    },

    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        default: null,
    },

    resolvedAt: {
        type: Date,
        default: null,
    },

}, {
    timestamps: true,
});


resolutionSchema.pre("validate", function (next) {

    if (!this.resolutionId) {
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        this.resolutionId = `RES-${Date.now()}-${randomSuffix}`;
    }

    next();

});


const resolutionModel = mongoose.model(
    "resolution",
    resolutionSchema
);


module.exports = resolutionModel;
