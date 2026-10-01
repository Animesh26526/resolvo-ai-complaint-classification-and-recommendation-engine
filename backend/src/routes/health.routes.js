// Defines API endpoints for service health monitoring and diagnostic checks.

const express = require("express");

const { getHealthStatus } = require("../controllers/health.controller");

const router = express.Router();


router.get(
    "/",
    getHealthStatus
);


module.exports = router;
