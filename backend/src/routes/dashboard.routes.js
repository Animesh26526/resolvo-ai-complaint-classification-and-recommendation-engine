// Defines API endpoints for Operations Manager (OM) dashboard monitoring and workload tracking.

const express = require("express");
const {
    getDashboardStats,
    getCseWorkload,
} = require("../controllers/dashboard.controller");

const {
    authenticateUser,
    authorizeRoles,
} = require("../middlewares/auth.middleware");

const router = express.Router();

router.get(
    "/stats",
    authenticateUser,
    authorizeRoles("om"),
    getDashboardStats
);

router.get(
    "/workload",
    authenticateUser,
    authorizeRoles("om"),
    getCseWorkload
);

module.exports = router;
