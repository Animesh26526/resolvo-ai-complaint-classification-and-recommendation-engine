// Defines API endpoints for exporting operational complaint reports in CSV and PDF formats.

const express = require("express");
const {
    exportComplaintsCsv,
    exportOperationalReportPdf,
} = require("../controllers/report.controller");

const {
    authenticateUser,
    authorizeRoles,
} = require("../middlewares/auth.middleware");

const router = express.Router();

router.get(
    "/csv",
    authenticateUser,
    authorizeRoles("om"),
    exportComplaintsCsv
);

router.get(
    "/pdf",
    authenticateUser,
    authorizeRoles("om"),
    exportOperationalReportPdf
);

module.exports = router;
