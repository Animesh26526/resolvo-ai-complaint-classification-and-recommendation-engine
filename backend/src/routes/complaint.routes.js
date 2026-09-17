const express = require("express");

const {
    createComplaint,
    getCustomerComplaints,
    getComplaintById,
    getComplaintsForCse,
    registerComplaintByCse,
    updateComplaintStatus,
    assignComplaint,
    analyzeComplaint,
    registerFormalComplaint,
    getComplaintResolution,
    updateComplaintResolution,
} = require("../controllers/complaint.controller");

const {
    authenticateUser,
    authorizeRoles,
} = require("../middlewares/auth.middleware");

const router = express.Router();


// Staff (CSE) management endpoints
router.get(
    "/staff",
    authenticateUser,
    authorizeRoles("cse"),
    getComplaintsForCse
);

router.post(
    "/staff",
    authenticateUser,
    authorizeRoles("cse"),
    registerComplaintByCse
);

router.patch(
    "/:id/status",
    authenticateUser,
    authorizeRoles("cse"),
    updateComplaintStatus
);

router.patch(
    "/:id/assign",
    authenticateUser,
    authorizeRoles("cse"),
    assignComplaint
);


// Resolution endpoints
router.get(
    "/:id/resolution",
    authenticateUser,
    authorizeRoles("customer", "cse", "qat", "om"),
    getComplaintResolution
);

router.post(
    "/:id/resolution",
    authenticateUser,
    authorizeRoles("cse"),
    updateComplaintResolution
);

router.put(
    "/:id/resolution",
    authenticateUser,
    authorizeRoles("cse"),
    updateComplaintResolution
);


// AI Analysis endpoint (Customer for own complaint, or CSE / QAT)
router.post(
    "/:id/analyze",
    authenticateUser,
    authorizeRoles("customer", "cse", "qat"),
    analyzeComplaint
);


// Formal registration endpoint for analyzed complaints
router.post(
    "/:id/register",
    authenticateUser,
    authorizeRoles("customer", "cse"),
    registerFormalComplaint
);


// Customer complaint endpoints
router.post(
    "/",
    authenticateUser,
    authorizeRoles("customer"),
    createComplaint
);

router.get(
    "/",
    authenticateUser,
    authorizeRoles("customer"),
    getCustomerComplaints
);


// Specific complaint details (Customer owns it OR Staff authorized)
router.get(
    "/:id",
    authenticateUser,
    authorizeRoles("customer", "cse", "qat", "om"),
    getComplaintById
);


module.exports = router;
