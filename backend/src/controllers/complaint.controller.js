const mongoose = require("mongoose");

const complaintModel = require("../models/complaint.model");
const resolutionModel = require("../models/resolution.model");
const userModel = require("../models/user.model");
const aiService = require("../services/ai.service");


const VALID_CATEGORIES = ["Product", "Packaging", "Trade"];
const VALID_PRIORITIES = ["High", "Medium", "Low"];
const VALID_CHANNELS = ["text", "email", "call", "chatbot", "direct"];

const VALID_STATUSES = [
    "Received",
    "Analyzed",
    "Registered",
    "Assigned",
    "In Progress",
    "Resolved",
    "Escalated",
];

const VALID_STATUS_TRANSITIONS = {
    "Received": [
        "Analyzed",
        "Registered",
        "Assigned",
        "In Progress",
        "Resolved",
    ],
    "Analyzed": [
        "Registered",
        "Assigned",
        "In Progress",
        "Resolved",
    ],
    "Registered": [
        "Analyzed",
        "Assigned",
        "In Progress",
        "Resolved",
    ],
    "Assigned": [
        "Analyzed",
        "In Progress",
        "Resolved",
        "Escalated",
    ],
    "In Progress": [
        "Analyzed",
        "Resolved",
        "Escalated",
    ],
    "Escalated": [
        "In Progress",
        "Resolved",
    ],
    "Resolved": [
        "In Progress",
        "Escalated",
    ],
};


async function createComplaint(req, res) {

    const {
        description,
        channel,
        category,
        priority,
    } = req.body;

    if (!description || !description.trim()) {
        return res.status(400).json({
            message: "Complaint description is required",
        });
    }

    const selectedChannel = channel ? channel.toLowerCase() : "text";

    if (!VALID_CHANNELS.includes(selectedChannel)) {
        return res.status(400).json({
            message: `Invalid channel. Supported channels: ${VALID_CHANNELS.join(", ")}`,
        });
    }

    if (category && !VALID_CATEGORIES.includes(category)) {
        return res.status(400).json({
            message: `Invalid category. Allowed categories: ${VALID_CATEGORIES.join(", ")}`,
        });
    }

    if (priority && !VALID_PRIORITIES.includes(priority)) {
        return res.status(400).json({
            message: `Invalid priority. Allowed priorities: ${VALID_PRIORITIES.join(", ")}`,
        });
    }

    const complaint = await complaintModel.create({
        description: description.trim(),
        channel: selectedChannel,
        category: category || null,
        priority: priority || null,
        status: "Received",
        customer: req.user.id,
        receivedAt: new Date(),
    });

    res.status(201).json({
        message: "Complaint created successfully",
        complaint: complaint,
    });

}


async function getCustomerComplaints(req, res) {

    const complaints = await complaintModel
        .find({ customer: req.user.id })
        .populate("resolution")
        .sort({ createdAt: -1 });

    res.status(200).json({
        message: "Complaints fetched successfully",
        count: complaints.length,
        complaints: complaints,
    });

}


async function getComplaintById(req, res) {

    const { id } = req.params;

    const isMongoId = mongoose.Types.ObjectId.isValid(id);

    const query = isMongoId
        ? { _id: id }
        : { complaintId: id };

    const complaint = await complaintModel
        .findOne(query)
        .populate("customer", "name email role")
        .populate("assignedTo", "name email role")
        .populate("resolution");

    if (!complaint) {
        return res.status(404).json({
            message: "Complaint not found",
        });
    }

    const isCustomer = req.user.role === "customer";
    const customerId = complaint.customer._id
        ? complaint.customer._id.toString()
        : complaint.customer.toString();

    if (isCustomer && customerId !== req.user.id) {
        return res.status(403).json({
            message: "Access denied: You do not have permission to view this complaint",
        });
    }

    res.status(200).json({
        message: "Complaint fetched successfully",
        complaint: complaint,
    });

}


async function getComplaintsForCse(req, res) {

    const {
        status,
        category,
        channel,
        priority,
        assignedTo,
    } = req.query;

    const filter = {};

    if (status) {
        if (!VALID_STATUSES.includes(status)) {
            return res.status(400).json({
                message: `Invalid status filter. Allowed values: ${VALID_STATUSES.join(", ")}`,
            });
        }
        filter.status = status;
    }

    if (category) {
        if (!VALID_CATEGORIES.includes(category)) {
            return res.status(400).json({
                message: `Invalid category filter. Allowed values: ${VALID_CATEGORIES.join(", ")}`,
            });
        }
        filter.category = category;
    }

    if (channel) {
        const normalizedChannel = channel.toLowerCase();
        if (!VALID_CHANNELS.includes(normalizedChannel)) {
            return res.status(400).json({
                message: `Invalid channel filter. Allowed values: ${VALID_CHANNELS.join(", ")}`,
            });
        }
        filter.channel = normalizedChannel;
    }

    if (priority) {
        if (!VALID_PRIORITIES.includes(priority)) {
            return res.status(400).json({
                message: `Invalid priority filter. Allowed values: ${VALID_PRIORITIES.join(", ")}`,
            });
        }
        filter.priority = priority;
    }

    if (assignedTo) {
        if (assignedTo === "me") {
            filter.assignedTo = req.user.id;
        } else if (mongoose.Types.ObjectId.isValid(assignedTo)) {
            filter.assignedTo = assignedTo;
        } else {
            return res.status(400).json({
                message: "Invalid assignedTo filter parameter",
            });
        }
    }

    const complaints = await complaintModel
        .find(filter)
        .populate("customer", "name email role")
        .populate("assignedTo", "name email role")
        .populate("resolution")
        .sort({ createdAt: -1 });

    res.status(200).json({
        message: "Complaints fetched successfully",
        count: complaints.length,
        complaints: complaints,
    });

}


async function registerComplaintByCse(req, res) {

    const {
        description,
        channel,
        customerId,
        customerEmail,
        category,
        priority,
    } = req.body;

    if (!description || !description.trim()) {
        return res.status(400).json({
            message: "Complaint description is required",
        });
    }

    const selectedChannel = channel ? channel.toLowerCase() : "direct";

    if (!VALID_CHANNELS.includes(selectedChannel)) {
        return res.status(400).json({
            message: `Invalid channel. Supported channels: ${VALID_CHANNELS.join(", ")}`,
        });
    }

    let targetCustomerId = null;

    if (customerId) {
        if (!mongoose.Types.ObjectId.isValid(customerId)) {
            return res.status(400).json({
                message: "Invalid customerId format",
            });
        }

        const customerUser = await userModel.findById(customerId);

        if (!customerUser) {
            return res.status(404).json({
                message: "Customer user not found",
            });
        }

        targetCustomerId = customerUser._id;
    } else if (customerEmail) {
        const customerUser = await userModel.findOne({
            email: customerEmail.trim().toLowerCase(),
        });

        if (!customerUser) {
            return res.status(404).json({
                message: "Customer with specified email not found",
            });
        }

        targetCustomerId = customerUser._id;
    } else {
        targetCustomerId = req.user.id;
    }

    if (category && !VALID_CATEGORIES.includes(category)) {
        return res.status(400).json({
            message: `Invalid category. Allowed categories: ${VALID_CATEGORIES.join(", ")}`,
        });
    }

    if (priority && !VALID_PRIORITIES.includes(priority)) {
        return res.status(400).json({
            message: `Invalid priority. Allowed priorities: ${VALID_PRIORITIES.join(", ")}`,
        });
    }

    const complaint = await complaintModel.create({
        description: description.trim(),
        channel: selectedChannel,
        category: category || null,
        priority: priority || null,
        status: "Registered",
        customer: targetCustomerId,
        assignedTo: req.user.id,
        receivedAt: new Date(),
    });

    const populatedComplaint = await complaintModel
        .findById(complaint._id)
        .populate("customer", "name email role")
        .populate("assignedTo", "name email role")
        .populate("resolution");

    res.status(201).json({
        message: "Complaint registered successfully by CSE",
        complaint: populatedComplaint,
    });

}


async function updateComplaintStatus(req, res) {

    const { id } = req.params;
    const { status, remarks, actionTaken } = req.body;

    if (!status) {
        return res.status(400).json({
            message: "New status is required",
        });
    }

    if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({
            message: `Invalid status. Allowed values: ${VALID_STATUSES.join(", ")}`,
        });
    }

    const isMongoId = mongoose.Types.ObjectId.isValid(id);

    const query = isMongoId
        ? { _id: id }
        : { complaintId: id };

    const complaint = await complaintModel.findOne(query);

    if (!complaint) {
        return res.status(404).json({
            message: "Complaint not found",
        });
    }

    const currentStatus = complaint.status;

    if (currentStatus === status && !actionTaken && !remarks) {
        return res.status(200).json({
            message: `Complaint is already in '${status}' status`,
            complaint: complaint,
        });
    }

    const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus] || [];

    if (currentStatus !== status && !allowedTransitions.includes(status)) {
        return res.status(400).json({
            message: `Invalid status transition from '${currentStatus}' to '${status}'. Allowed transitions: ${allowedTransitions.join(", ")}`,
        });
    }

    complaint.status = status;

    if (status === "Resolved") {
        complaint.resolvedAt = new Date();

        let resolution = await resolutionModel.findOne({ complaint: complaint._id });

        if (!resolution) {
            resolution = await resolutionModel.create({
                complaint: complaint._id,
                recommendation: complaint.aiRecommendation,
                actionTaken: actionTaken ? actionTaken.trim() : null,
                remarks: remarks ? remarks.trim() : null,
                resolvedBy: req.user.id,
                resolvedAt: new Date(),
            });
        } else {
            if (actionTaken) {
                resolution.actionTaken = actionTaken.trim();
            }
            if (remarks) {
                resolution.remarks = remarks.trim();
            }
            resolution.resolvedBy = req.user.id;
            resolution.resolvedAt = new Date();
            await resolution.save();
        }

        complaint.resolution = resolution._id;
    } else {
        complaint.resolvedAt = null;
    }

    await complaint.save();

    const updatedComplaint = await complaintModel
        .findById(complaint._id)
        .populate("customer", "name email role")
        .populate("assignedTo", "name email role")
        .populate("resolution");

    res.status(200).json({
        message: `Complaint status updated to '${status}' successfully`,
        complaint: updatedComplaint,
    });

}


async function assignComplaint(req, res) {

    const { id } = req.params;
    const { assignedTo } = req.body;

    const isMongoId = mongoose.Types.ObjectId.isValid(id);

    const query = isMongoId
        ? { _id: id }
        : { complaintId: id };

    const complaint = await complaintModel.findOne(query);

    if (!complaint) {
        return res.status(404).json({
            message: "Complaint not found",
        });
    }

    const targetCseId = assignedTo || req.user.id;

    if (!mongoose.Types.ObjectId.isValid(targetCseId)) {
        return res.status(400).json({
            message: "Invalid assignedTo user ID format",
        });
    }

    const cseUser = await userModel.findById(targetCseId);

    if (!cseUser || cseUser.role !== "cse") {
        return res.status(400).json({
            message: "Assigned user must be a valid Customer Support Executive (CSE)",
        });
    }

    complaint.assignedTo = targetCseId;

    if (["Received", "Analyzed", "Registered"].includes(complaint.status)) {
        complaint.status = "Assigned";
    }

    await complaint.save();

    const updatedComplaint = await complaintModel
        .findById(complaint._id)
        .populate("customer", "name email role")
        .populate("assignedTo", "name email role")
        .populate("resolution");

    res.status(200).json({
        message: "Complaint assigned successfully",
        complaint: updatedComplaint,
    });

}


async function analyzeComplaint(req, res) {

    const { id } = req.params;

    const isMongoId = mongoose.Types.ObjectId.isValid(id);

    const query = isMongoId
        ? { _id: id }
        : { complaintId: id };

    const complaint = await complaintModel.findOne(query);

    if (!complaint) {
        return res.status(404).json({
            message: "Complaint not found",
        });
    }

    const isCustomer = req.user.role === "customer";
    const customerId = complaint.customer._id
        ? complaint.customer._id.toString()
        : complaint.customer.toString();

    if (isCustomer && customerId !== req.user.id) {
        return res.status(403).json({
            message: "Access denied: You do not have permission to analyze this complaint",
        });
    }

    let aiResult;

    try {

        aiResult = await aiService.analyzeComplaint({
            description: complaint.description,
            channel: complaint.channel,
        });

    } catch (aiError) {

        const statusCode = aiError.statusCode || 502;
        return res.status(statusCode).json({
            message: aiError.message || "AI analysis service is unavailable",
        });

    }

    complaint.category = aiResult.category;
    complaint.sentiment = aiResult.sentiment;
    complaint.priority = aiResult.priority;
    complaint.aiRecommendation = aiResult.recommendation;

    let resolution = await resolutionModel.findOne({ complaint: complaint._id });

    if (!resolution) {
        resolution = await resolutionModel.create({
            complaint: complaint._id,
            recommendation: aiResult.recommendation,
        });
    } else {
        resolution.recommendation = aiResult.recommendation;
    }

    if (aiResult.is_resolvable_by_ai) {
        complaint.status = "Resolved";
        complaint.resolvedAt = new Date();
        resolution.remarks = "Resolved automatically by AI recommendation.";
        resolution.actionTaken = "AI Resolution Provided";
        resolution.resolvedAt = new Date();
    } else {
        if (complaint.status === "Received") {
            complaint.status = "Analyzed";
        }
    }

    await resolution.save();

    complaint.resolution = resolution._id;
    await complaint.save();

    const updatedComplaint = await complaintModel
        .findById(complaint._id)
        .populate("customer", "name email role")
        .populate("assignedTo", "name email role")
        .populate("resolution");

    res.status(200).json({
        message: aiResult.is_resolvable_by_ai
            ? "Complaint analyzed and resolved automatically by AI"
            : "Complaint analyzed successfully",
        complaint: updatedComplaint,
        analysis: {
            category: aiResult.category,
            sentiment: aiResult.sentiment,
            priority: aiResult.priority,
            recommendation: aiResult.recommendation,
            isResolvableByAi: aiResult.is_resolvable_by_ai,
        },
        resolution: resolution,
    });

}


async function registerFormalComplaint(req, res) {

    const { id } = req.params;

    const isMongoId = mongoose.Types.ObjectId.isValid(id);

    const query = isMongoId
        ? { _id: id }
        : { complaintId: id };

    const complaint = await complaintModel.findOne(query);

    if (!complaint) {
        return res.status(404).json({
            message: "Complaint not found",
        });
    }

    const isCustomer = req.user.role === "customer";
    const customerId = complaint.customer._id
        ? complaint.customer._id.toString()
        : complaint.customer.toString();

    if (isCustomer && customerId !== req.user.id) {
        return res.status(403).json({
            message: "Access denied: You do not have permission to register this complaint",
        });
    }

    if (!["Received", "Analyzed"].includes(complaint.status)) {
        return res.status(400).json({
            message: `Cannot register complaint in '${complaint.status}' status. Must be in 'Received' or 'Analyzed' status.`,
        });
    }

    complaint.status = "Registered";
    await complaint.save();

    const updatedComplaint = await complaintModel
        .findById(complaint._id)
        .populate("customer", "name email role")
        .populate("assignedTo", "name email role")
        .populate("resolution");

    res.status(200).json({
        message: "Complaint registered formally for CSE support",
        complaint: updatedComplaint,
    });

}


async function getComplaintResolution(req, res) {

    const { id } = req.params;

    const isMongoId = mongoose.Types.ObjectId.isValid(id);

    const query = isMongoId
        ? { _id: id }
        : { complaintId: id };

    const complaint = await complaintModel.findOne(query);

    if (!complaint) {
        return res.status(404).json({
            message: "Complaint not found",
        });
    }

    const isCustomer = req.user.role === "customer";
    const customerId = complaint.customer._id
        ? complaint.customer._id.toString()
        : complaint.customer.toString();

    if (isCustomer && customerId !== req.user.id) {
        return res.status(403).json({
            message: "Access denied: You do not have permission to view resolution for this complaint",
        });
    }

    const resolution = await resolutionModel
        .findOne({ complaint: complaint._id })
        .populate("resolvedBy", "name email role");

    if (!resolution) {
        return res.status(404).json({
            message: "Resolution details not yet available for this complaint",
        });
    }

    res.status(200).json({
        message: "Resolution fetched successfully",
        resolution: resolution,
    });

}


async function updateComplaintResolution(req, res) {

    const { id } = req.params;
    const { actionTaken, remarks, status } = req.body;

    if (!actionTaken && !remarks) {
        return res.status(400).json({
            message: "At least actionTaken or remarks is required to update resolution",
        });
    }

    const isMongoId = mongoose.Types.ObjectId.isValid(id);

    const query = isMongoId
        ? { _id: id }
        : { complaintId: id };

    const complaint = await complaintModel.findOne(query);

    if (!complaint) {
        return res.status(404).json({
            message: "Complaint not found",
        });
    }

    let resolution = await resolutionModel.findOne({ complaint: complaint._id });

    if (!resolution) {
        resolution = await resolutionModel.create({
            complaint: complaint._id,
            recommendation: complaint.aiRecommendation,
        });
    }

    if (actionTaken) {
        resolution.actionTaken = actionTaken.trim();
    }

    if (remarks) {
        resolution.remarks = remarks.trim();
    }

    resolution.resolvedBy = req.user.id;

    const targetStatus = status || "Resolved";

    if (!VALID_STATUSES.includes(targetStatus)) {
        return res.status(400).json({
            message: `Invalid status. Allowed values: ${VALID_STATUSES.join(", ")}`,
        });
    }

    if (complaint.status !== targetStatus) {
        const allowedTransitions = VALID_STATUS_TRANSITIONS[complaint.status] || [];
        if (!allowedTransitions.includes(targetStatus)) {
            return res.status(400).json({
                message: `Invalid status transition from '${complaint.status}' to '${targetStatus}'. Allowed transitions: ${allowedTransitions.join(", ")}`,
            });
        }
        complaint.status = targetStatus;
    }

    if (complaint.status === "Resolved") {
        complaint.resolvedAt = new Date();
        resolution.resolvedAt = new Date();
    }

    await resolution.save();

    complaint.resolution = resolution._id;
    await complaint.save();

    const updatedComplaint = await complaintModel
        .findById(complaint._id)
        .populate("customer", "name email role")
        .populate("assignedTo", "name email role")
        .populate("resolution");

    res.status(200).json({
        message: "Resolution updated successfully",
        complaint: updatedComplaint,
        resolution: resolution,
    });

}


module.exports = {
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
};
