// Handles QAT review creation, retrieval, pending complaint queue, and QA metrics.

const mongoose = require("mongoose");
const qaReviewModel = require("../models/qaReview.model");
const complaintModel = require("../models/complaint.model");
const slaService = require("../services/sla.service");

const VALID_CLASSIFICATION_RESULTS = ["Agreed", "Disagreed", "Corrected"];
const VALID_CATEGORIES = ["Product", "Packaging", "Trade"];
const VALID_PRIORITIES = ["High", "Medium", "Low"];

async function createQaReview(req, res) {
    const complaintId = req.params.id || req.body.complaintId;
    const {
        classificationResult,
        reviewRemarks,
        correctedCategory,
        correctedPriority,
    } = req.body;

    if (!complaintId) {
        return res.status(400).json({
            message: "complaintId is required for QA review",
        });
    }

    if (!classificationResult) {
        return res.status(400).json({
            message: "classificationResult is required",
        });
    }

    if (!VALID_CLASSIFICATION_RESULTS.includes(classificationResult)) {
        return res.status(400).json({
            message: `Invalid classificationResult. Allowed values: ${VALID_CLASSIFICATION_RESULTS.join(", ")}`,
        });
    }

    const isMongoId = mongoose.Types.ObjectId.isValid(complaintId);
    const query = isMongoId ? { _id: complaintId } : { complaintId: complaintId };

    const complaint = await complaintModel.findOne(query);
    if (!complaint) {
        return res.status(404).json({
            message: "Complaint not found",
        });
    }

    if (classificationResult === "Corrected") {
        if (!correctedCategory && !correctedPriority) {
            return res.status(400).json({
                message: "At least correctedCategory or correctedPriority is required when classificationResult is 'Corrected'",
            });
        }

        if (correctedCategory && !VALID_CATEGORIES.includes(correctedCategory)) {
            return res.status(400).json({
                message: `Invalid correctedCategory. Allowed values: ${VALID_CATEGORIES.join(", ")}`,
            });
        }

        if (correctedPriority && !VALID_PRIORITIES.includes(correctedPriority)) {
            return res.status(400).json({
                message: `Invalid correctedPriority. Allowed values: ${VALID_PRIORITIES.join(", ")}`,
            });
        }
    }

    const originalAiAnalysis = {
        category: complaint.category || null,
        sentiment: complaint.sentiment || null,
        priority: complaint.priority || null,
        recommendation: complaint.aiRecommendation || null,
    };

    const review = await qaReviewModel.create({
        complaint: complaint._id,
        reviewer: req.user.id,
        classificationResult,
        reviewRemarks: reviewRemarks ? reviewRemarks.trim() : "",
        correctedCategory: correctedCategory || null,
        correctedPriority: correctedPriority || null,
        originalAiAnalysis,
    });

    if (classificationResult === "Corrected") {
        let modified = false;

        if (correctedCategory) {
            complaint.category = correctedCategory;
            modified = true;
        }

        if (correctedPriority) {
            complaint.priority = correctedPriority;
            complaint.slaDeadline = slaService.calculateSlaDeadline(correctedPriority, complaint.receivedAt);
            modified = true;
        }

        if (modified) {
            await complaint.save();
        }
    }

    const populatedReview = await qaReviewModel
        .findById(review._id)
        .populate("reviewer", "name email role")
        .populate("complaint", "complaintId description category priority status");

    res.status(201).json({
        message: "QA review submitted successfully",
        review: populatedReview,
    });
}

async function getQaReviews(req, res) {
    const {
        classificationResult,
        complaintId,
        reviewer,
        page,
        limit,
    } = req.query;

    const filter = {};

    if (classificationResult) {
        if (!VALID_CLASSIFICATION_RESULTS.includes(classificationResult)) {
            return res.status(400).json({
                message: `Invalid classificationResult filter. Allowed values: ${VALID_CLASSIFICATION_RESULTS.join(", ")}`,
            });
        }
        filter.classificationResult = classificationResult;
    }

    if (complaintId) {
        if (mongoose.Types.ObjectId.isValid(complaintId)) {
            filter.complaint = complaintId;
        } else {
            const complaintDoc = await complaintModel.findOne({ complaintId });
            if (complaintDoc) {
                filter.complaint = complaintDoc._id;
            } else {
                return res.status(200).json({
                    message: "QA reviews fetched successfully",
                    count: 0,
                    reviews: [],
                });
            }
        }
    }

    if (reviewer) {
        if (mongoose.Types.ObjectId.isValid(reviewer)) {
            filter.reviewer = reviewer;
        }
    }

    const reviews = await qaReviewModel
        .find(filter)
        .populate("reviewer", "name email role")
        .populate("complaint", "complaintId description category priority status channel receivedAt")
        .sort({ createdAt: -1 });

    const total = reviews.length;
    let paginatedReviews = reviews;

    if (page !== undefined || limit !== undefined) {
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
        const startIndex = (pageNum - 1) * limitNum;
        paginatedReviews = reviews.slice(startIndex, startIndex + limitNum);

        return res.status(200).json({
            message: "QA reviews fetched successfully",
            count: paginatedReviews.length,
            reviews: paginatedReviews,
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum) || 1,
        });
    }

    res.status(200).json({
        message: "QA reviews fetched successfully",
        count: reviews.length,
        reviews: reviews,
    });
}

async function getQaReviewById(req, res) {
    const { id } = req.params;

    const isMongoId = mongoose.Types.ObjectId.isValid(id);
    let complaintId = id;
    
    // If it's a string like CMP-1234, find the complaint's ObjectId first
    if (!isMongoId) {
        const complaint = await complaintModel.findOne({ complaintId: id });
        if (!complaint) return res.status(404).json({ message: "Complaint not found" });
        complaintId = complaint._id;
    }

    const review = await qaReviewModel
        .findOne({ complaint: complaintId })
        .populate("reviewer", "name email role")
        .populate("complaint");

    if (!review) {
        return res.status(404).json({
            message: "QA review not found",
        });
    }

    res.status(200).json({
        message: "QA review fetched successfully",
        review,
    });
}

async function getPendingQaComplaints(req, res) {
    const reviewedComplaintIds = await qaReviewModel.distinct("complaint");

    const filter = {
        _id: { $nin: reviewedComplaintIds },
        status: { $ne: "Received" },
    };

    const pendingComplaints = await complaintModel
        .find(filter)
        .populate("customer", "name email role")
        .populate("assignedTo", "name email role")
        .populate("resolution")
        .sort({ receivedAt: -1 });

    res.status(200).json({
        message: "Pending QA complaints fetched successfully",
        count: pendingComplaints.length,
        complaints: pendingComplaints,
    });
}

async function getQaMetrics(req, res) {
    const reviews = await qaReviewModel.find({}).populate("complaint", "category priority");

    const totalReviews = reviews.length;
    let agreedCount = 0;
    let disagreedCount = 0;
    let correctedCount = 0;

    const categoryCorrectionsMap = {};
    const priorityCorrectionsMap = {};

    reviews.forEach(review => {
        if (review.classificationResult === "Agreed") {
            agreedCount += 1;
        } else if (review.classificationResult === "Disagreed") {
            disagreedCount += 1;
        } else if (review.classificationResult === "Corrected") {
            correctedCount += 1;

            if (review.correctedCategory && review.originalAiAnalysis && review.originalAiAnalysis.category) {
                const pair = `${review.originalAiAnalysis.category} -> ${review.correctedCategory}`;
                categoryCorrectionsMap[pair] = (categoryCorrectionsMap[pair] || 0) + 1;
            }

            if (review.correctedPriority && review.originalAiAnalysis && review.originalAiAnalysis.priority) {
                const pair = `${review.originalAiAnalysis.priority} -> ${review.correctedPriority}`;
                priorityCorrectionsMap[pair] = (priorityCorrectionsMap[pair] || 0) + 1;
            }
        }
    });

    const classificationAgreementRate = totalReviews > 0
        ? Number(((agreedCount / totalReviews) * 100).toFixed(1))
        : 0;

    res.status(200).json({
        message: "QA metrics retrieved successfully",
        metrics: {
            totalReviews,
            agreedCount,
            disagreedCount,
            correctedCount,
            classificationAgreementRate,
            commonCategoryCorrections: categoryCorrectionsMap,
            commonPriorityCorrections: priorityCorrectionsMap,
        },
    });
}

module.exports = {
    createQaReview,
    getQaReviews,
    getQaReviewById,
    getPendingQaComplaints,
    getQaMetrics,
};
