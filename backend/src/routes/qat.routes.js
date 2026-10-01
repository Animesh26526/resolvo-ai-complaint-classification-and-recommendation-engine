// Defines API endpoints for Quality Assurance Team (QAT) review and metrics operations.

const express = require("express");
const {
    createQaReview,
    getQaReviews,
    getQaReviewById,
    getPendingQaComplaints,
    getQaMetrics,
} = require("../controllers/qat.controller");

const {
    authenticateUser,
    authorizeRoles,
} = require("../middlewares/auth.middleware");

const router = express.Router();

router.post(
    "/reviews",
    authenticateUser,
    authorizeRoles("qat"),
    createQaReview
);

router.get(
    "/reviews",
    authenticateUser,
    authorizeRoles("qat", "om"),
    getQaReviews
);

router.get(
    "/pending",
    authenticateUser,
    authorizeRoles("qat"),
    getPendingQaComplaints
);

router.get(
    "/metrics",
    authenticateUser,
    authorizeRoles("qat", "om"),
    getQaMetrics
);

router.get(
    "/reviews/:id",
    authenticateUser,
    authorizeRoles("qat", "om"),
    getQaReviewById
);

module.exports = router;
