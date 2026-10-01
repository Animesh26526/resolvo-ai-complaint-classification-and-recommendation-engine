// Handles CSV and PDF operational report generation for Operations Management (OM).

const mongoose = require("mongoose");
const PDFDocument = require("pdfkit");
const complaintModel = require("../models/complaint.model");
const slaService = require("../services/sla.service");

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

function escapeCsvField(val) {
    if (val === null || val === undefined) {
        return "";
    }
    const str = String(val).trim();
    if (str.includes(",") || str.includes("\"") || str.includes("\n") || str.includes("\r")) {
        return `"${str.replace(/"/g, "\"\"")}"`;
    }
    return str;
}

function buildReportFilter(queryParams) {
    const filter = {};
    const {
        category,
        priority,
        status,
        channel,
        assignedTo,
        startDate,
        endDate,
        isOverdue,
    } = queryParams;

    if (category) {
        if (!VALID_CATEGORIES.includes(category)) {
            const err = new Error(`Invalid category filter. Allowed: ${VALID_CATEGORIES.join(", ")}`);
            err.statusCode = 400;
            throw err;
        }
        filter.category = category;
    }

    if (priority) {
        if (!VALID_PRIORITIES.includes(priority)) {
            const err = new Error(`Invalid priority filter. Allowed: ${VALID_PRIORITIES.join(", ")}`);
            err.statusCode = 400;
            throw err;
        }
        filter.priority = priority;
    }

    if (status) {
        if (!VALID_STATUSES.includes(status)) {
            const err = new Error(`Invalid status filter. Allowed: ${VALID_STATUSES.join(", ")}`);
            err.statusCode = 400;
            throw err;
        }
        filter.status = status;
    }

    if (channel) {
        const normalized = channel.toLowerCase();
        if (!VALID_CHANNELS.includes(normalized)) {
            const err = new Error(`Invalid channel filter. Allowed: ${VALID_CHANNELS.join(", ")}`);
            err.statusCode = 400;
            throw err;
        }
        filter.channel = normalized;
    }

    if (assignedTo) {
        if (assignedTo === "unassigned") {
            filter.assignedTo = null;
        } else if (mongoose.Types.ObjectId.isValid(assignedTo)) {
            filter.assignedTo = assignedTo;
        } else {
            const err = new Error("Invalid assignedTo filter");
            err.statusCode = 400;
            throw err;
        }
    }

    if (startDate || endDate) {
        filter.receivedAt = {};
        if (startDate) {
            const start = new Date(startDate);
            if (isNaN(start.getTime())) {
                const err = new Error("Invalid startDate format. Use ISO-8601 (YYYY-MM-DD)");
                err.statusCode = 400;
                throw err;
            }
            filter.receivedAt.$gte = start;
        }
        if (endDate) {
            const end = new Date(endDate);
            if (isNaN(end.getTime())) {
                const err = new Error("Invalid endDate format. Use ISO-8601 (YYYY-MM-DD)");
                err.statusCode = 400;
                throw err;
            }
            if (endDate.length <= 10) {
                end.setUTCHours(23, 59, 59, 999);
            }
            filter.receivedAt.$lte = end;
        }
    }

    if (isOverdue === "true") {
        filter.status = { $ne: "Resolved" };
        filter.slaDeadline = { $ne: null, $lt: new Date() };
    }

    return filter;
}

async function exportComplaintsCsv(req, res) {
    try {
        const filter = buildReportFilter(req.query);

        const complaints = await complaintModel
            .find(filter)
            .populate("customer", "name email")
            .populate("assignedTo", "name email")
            .populate("resolution")
            .sort({ receivedAt: -1 });

        const filename = `complaints-report-${Date.now()}.csv`;

        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

        const headers = [
            "Complaint ID",
            "Description",
            "Customer Name",
            "Customer Email",
            "Channel",
            "Category",
            "Sentiment",
            "Priority",
            "Status",
            "Received At",
            "SLA Deadline",
            "Resolved At",
            "Assigned CSE",
            "Resolution Action Taken",
            "Resolution Remarks",
        ];

        res.write(`${headers.join(",")}\n`);

        complaints.forEach(c => {
            const custName = c.customer ? c.customer.name : "";
            const custEmail = c.customer ? c.customer.email : "";
            const cseName = c.assignedTo ? c.assignedTo.name : "Unassigned";
            const actionTaken = c.resolution ? c.resolution.actionTaken : "";
            const remarks = c.resolution ? c.resolution.remarks : "";

            const row = [
                escapeCsvField(c.complaintId),
                escapeCsvField(c.description),
                escapeCsvField(custName),
                escapeCsvField(custEmail),
                escapeCsvField(c.channel),
                escapeCsvField(c.category || "Unassigned"),
                escapeCsvField(c.sentiment || "Neutral"),
                escapeCsvField(c.priority || "Unassigned"),
                escapeCsvField(c.status),
                escapeCsvField(c.receivedAt ? new Date(c.receivedAt).toISOString() : ""),
                escapeCsvField(c.slaDeadline ? new Date(c.slaDeadline).toISOString() : ""),
                escapeCsvField(c.resolvedAt ? new Date(c.resolvedAt).toISOString() : ""),
                escapeCsvField(cseName),
                escapeCsvField(actionTaken),
                escapeCsvField(remarks),
            ];

            res.write(`${row.join(",")}\n`);
        });

        res.end();
    } catch (error) {
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({
            message: error.message || "Failed to generate CSV report",
        });
    }
}

async function exportOperationalReportPdf(req, res) {
    try {
        const filter = buildReportFilter(req.query);
        const { detailed } = req.query;

        const complaints = await complaintModel
            .find(filter)
            .populate("customer", "name email")
            .populate("assignedTo", "name email")
            .populate("resolution")
            .sort({ receivedAt: -1 });

        const now = new Date();
        let totalComplaints = complaints.length;
        let pendingCount = 0;
        let resolvedCount = 0;
        let escalatedCount = 0;
        let overdueCount = 0;
        let resolvedWithinSla = 0;
        let resolvedAfterSla = 0;
        let totalResolutionDurationHours = 0;
        let resolvedWithTimesCount = 0;

        const categories = { Product: 0, Packaging: 0, Trade: 0, Uncategorized: 0 };
        const priorities = { High: 0, Medium: 0, Low: 0, Unassigned: 0 };
        const channels = { text: 0, email: 0, call: 0, chatbot: 0, direct: 0 };

        complaints.forEach(c => {
            if (["Received", "Analyzed", "Registered", "Assigned", "In Progress"].includes(c.status)) {
                pendingCount += 1;
            } else if (c.status === "Resolved") {
                resolvedCount += 1;
            } else if (c.status === "Escalated") {
                escalatedCount += 1;
            }

            if (c.category && categories[c.category] !== undefined) {
                categories[c.category] += 1;
            } else {
                categories.Uncategorized += 1;
            }

            if (c.priority && priorities[c.priority] !== undefined) {
                priorities[c.priority] += 1;
            } else {
                priorities.Unassigned += 1;
            }

            if (c.channel && channels[c.channel] !== undefined) {
                channels[c.channel] += 1;
            }

            if (slaService.isComplaintOverdue(c, now)) {
                overdueCount += 1;
            }

            if (c.status === "Resolved" && c.resolvedAt) {
                const received = c.receivedAt ? new Date(c.receivedAt) : (c.createdAt ? new Date(c.createdAt) : null);
                const resolved = new Date(c.resolvedAt);
                if (received && !isNaN(received.getTime()) && !isNaN(resolved.getTime())) {
                    const hours = Math.max(0, (resolved.getTime() - received.getTime()) / (1000 * 60 * 60));
                    totalResolutionDurationHours += hours;
                    resolvedWithTimesCount += 1;
                }

                if (c.slaDeadline) {
                    if (slaService.isResolvedWithinSla(c)) {
                        resolvedWithinSla += 1;
                    } else {
                        resolvedAfterSla += 1;
                    }
                }
            }
        });

        const evaluatedSlaTotal = resolvedWithinSla + resolvedAfterSla;
        const complianceRate = evaluatedSlaTotal > 0
            ? Number(((resolvedWithinSla / evaluatedSlaTotal) * 100).toFixed(1))
            : (resolvedCount > 0 ? 100 : 0);

        const avgResolutionHours = resolvedWithTimesCount > 0
            ? Number((totalResolutionDurationHours / resolvedWithTimesCount).toFixed(2))
            : 0;

        const doc = new PDFDocument({ margin: 40, size: "A4" });
        const filename = `operational-report-${Date.now()}.pdf`;

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

        doc.pipe(res);

        // Header
        doc.fontSize(18).fillColor("#1e293b").text("RESOLVO - OPERATIONS MANAGEMENT REPORT", { align: "center" });
        doc.fontSize(10).fillColor("#64748b").text("AI-Powered Complaint Classification & Resolution Engine", { align: "center" });
        doc.moveDown(0.5);

        doc.strokeColor("#cbd5e1").lineWidth(1).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
        doc.moveDown(0.5);

        // Metadata
        const dateRangeStr = (req.query.startDate || req.query.endDate)
            ? `Filter Period: ${req.query.startDate || "Beginning"} to ${req.query.endDate || "Present"}`
            : "Filter Period: All Recorded History";
        doc.fontSize(9).fillColor("#475569")
            .text(`Generated At: ${new Date().toISOString()}`)
            .text(`Generated By: Operations Manager (${req.user.name || req.user.email})`)
            .text(dateRangeStr);
        doc.moveDown(1);

        // Section 1: Executive Summary
        doc.fontSize(13).fillColor("#0f172a").text("1. Executive Operational Summary");
        doc.moveDown(0.4);
        doc.fontSize(10).fillColor("#334155");
        doc.text(`• Total Complaints Logged: ${totalComplaints}`);
        doc.text(`• Currently Pending / Active: ${pendingCount}`);
        doc.text(`• Successfully Resolved: ${resolvedCount}`);
        doc.text(`• Escalated Complaints: ${escalatedCount}`);
        doc.text(`• Currently Overdue: ${overdueCount}`);
        doc.moveDown(1);

        // Section 2: SLA & Resolution Performance
        doc.fontSize(13).fillColor("#0f172a").text("2. SLA & Resolution Performance");
        doc.moveDown(0.4);
        doc.fontSize(10).fillColor("#334155");
        doc.text(`• Overall SLA Compliance Rate: ${complianceRate}%`);
        doc.text(`• Resolved Within SLA Deadline: ${resolvedWithinSla}`);
        doc.text(`• Resolved After SLA Deadline: ${resolvedAfterSla}`);
        doc.text(`• Average Resolution Duration: ${avgResolutionHours} hours`);
        doc.moveDown(1);

        // Section 3: Distributions
        doc.fontSize(13).fillColor("#0f172a").text("3. Complaint Distribution Breakdown");
        doc.moveDown(0.4);
        doc.fontSize(10).fillColor("#334155");
        doc.text(`Category Distribution: Product: ${categories.Product} | Packaging: ${categories.Packaging} | Trade: ${categories.Trade} | Uncategorized: ${categories.Uncategorized}`);
        doc.text(`Priority Distribution: High: ${priorities.High} | Medium: ${priorities.Medium} | Low: ${priorities.Low} | Unassigned: ${priorities.Unassigned}`);
        doc.text(`Channel Distribution: Text: ${channels.text} | Email: ${channels.email} | Call: ${channels.call} | Chatbot: ${channels.chatbot} | Direct: ${channels.direct}`);
        doc.moveDown(1);

        // Section 4: Detailed listing if requested
        if (detailed === "true" && complaints.length > 0) {
            doc.addPage();
            doc.fontSize(13).fillColor("#0f172a").text("4. Ticket-Level Records (Most Recent)");
            doc.moveDown(0.5);

            const displayComplaints = complaints.slice(0, 30);
            displayComplaints.forEach((c, idx) => {
                const cust = c.customer ? c.customer.name : "Unknown";
                const cse = c.assignedTo ? c.assignedTo.name : "Unassigned";
                const cat = c.category || "-";
                const prio = c.priority || "-";
                doc.fontSize(9).fillColor("#1e293b").text(
                    `${idx + 1}. [${c.complaintId}] - Status: ${c.status} | Cat: ${cat} | Prio: ${prio} | Cust: ${cust} | CSE: ${cse}`
                );
                doc.fontSize(8).fillColor("#64748b").text(
                    `   Desc: ${c.description ? c.description.substring(0, 80) : ""}...`
                );
                doc.moveDown(0.3);
            });
        }

        // Footer
        doc.moveDown(1);
        doc.fontSize(8).fillColor("#94a3b8").text(
            "--- End of Operations Report | Resolvo Complaint Management System | Confidential ---",
            { align: "center" }
        );

        doc.end();
    } catch (error) {
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({
            message: error.message || "Failed to generate PDF report",
        });
    }
}

module.exports = {
    exportComplaintsCsv,
    exportOperationalReportPdf,
};
