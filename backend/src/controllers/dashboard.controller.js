// Handles Operations Manager (OM) dashboard statistics, workload distribution, and SLA analytics.

const mongoose = require("mongoose");
const complaintModel = require("../models/complaint.model");
const userModel = require("../models/user.model");
const slaService = require("../services/sla.service");

function parseDateFilters(startDate, endDate) {
    const filter = {};
    if (startDate) {
        const start = new Date(startDate);
        if (isNaN(start.getTime())) {
            const error = new Error("Invalid startDate format. Use ISO-8601 (YYYY-MM-DD)");
            error.statusCode = 400;
            throw error;
        }
        filter.$gte = start;
    }

    if (endDate) {
        const end = new Date(endDate);
        if (isNaN(end.getTime())) {
            const error = new Error("Invalid endDate format. Use ISO-8601 (YYYY-MM-DD)");
            error.statusCode = 400;
            throw error;
        }
        // If only date string like YYYY-MM-DD is passed, extend to end of day if no time
        if (endDate.length <= 10) {
            end.setUTCHours(23, 59, 59, 999);
        }
        filter.$lte = end;
    }

    return Object.keys(filter).length > 0 ? filter : null;
}

async function getDashboardStats(req, res) {
    try {
        const { startDate, endDate } = req.query;
        const now = new Date();
        const matchStage = {};

        const dateRange = parseDateFilters(startDate, endDate);
        if (dateRange) {
            matchStage.receivedAt = dateRange;
        }

        // Initialize default structures
        const overall = {
            totalComplaints: 0,
            pendingComplaints: 0,
            resolvedComplaints: 0,
            escalatedComplaints: 0,
            overdueComplaints: 0,
        };

        const categoryStats = {
            Product: 0,
            Packaging: 0,
            Trade: 0,
            Uncategorized: 0,
        };

        const priorityStats = {
            High: 0,
            Medium: 0,
            Low: 0,
            Unassigned: 0,
        };

        const channelStats = {
            text: 0,
            email: 0,
            call: 0,
            chatbot: 0,
            direct: 0,
        };

        const statusStats = {
            Received: 0,
            Analyzed: 0,
            Registered: 0,
            Assigned: 0,
            "In Progress": 0,
            Resolved: 0,
            Escalated: 0,
        };

        const slaStats = {
            slaCompliancePercentage: 0,
            overdueCount: 0,
            resolvedWithinSla: 0,
            resolvedAfterSla: 0,
            averageResolutionTimeHours: 0,
        };

        // Query complaints matching date filters
        const complaints = await complaintModel.find(matchStage);

        let totalResolutionDurationHours = 0;
        let resolvedWithTimesCount = 0;

        complaints.forEach(complaint => {
            overall.totalComplaints += 1;

            // Status counts
            if (statusStats[complaint.status] !== undefined) {
                statusStats[complaint.status] += 1;
            }

            if (["Received", "Analyzed", "Registered", "Assigned", "In Progress"].includes(complaint.status)) {
                overall.pendingComplaints += 1;
            } else if (complaint.status === "Resolved") {
                overall.resolvedComplaints += 1;
            } else if (complaint.status === "Escalated") {
                overall.escalatedComplaints += 1;
            }

            // Category counts
            if (complaint.category && categoryStats[complaint.category] !== undefined) {
                categoryStats[complaint.category] += 1;
            } else {
                categoryStats.Uncategorized += 1;
            }

            // Priority counts
            if (complaint.priority && priorityStats[complaint.priority] !== undefined) {
                priorityStats[complaint.priority] += 1;
            } else {
                priorityStats.Unassigned += 1;
            }

            // Channel counts
            if (complaint.channel && channelStats[complaint.channel] !== undefined) {
                channelStats[complaint.channel] += 1;
            }

            // Overdue check
            if (slaService.isComplaintOverdue(complaint, now)) {
                overall.overdueComplaints += 1;
                slaStats.overdueCount += 1;
            }

            // SLA resolved check
            if (complaint.status === "Resolved" && complaint.resolvedAt) {
                const received = complaint.receivedAt ? new Date(complaint.receivedAt) : (complaint.createdAt ? new Date(complaint.createdAt) : null);
                const resolved = new Date(complaint.resolvedAt);

                if (received && !isNaN(received.getTime()) && !isNaN(resolved.getTime())) {
                    const durationHours = Math.max(0, (resolved.getTime() - received.getTime()) / (1000 * 60 * 60));
                    totalResolutionDurationHours += durationHours;
                    resolvedWithTimesCount += 1;
                }

                if (complaint.slaDeadline) {
                    if (slaService.isResolvedWithinSla(complaint)) {
                        slaStats.resolvedWithinSla += 1;
                    } else {
                        slaStats.resolvedAfterSla += 1;
                    }
                }
            }
        });

        const totalEvaluatedResolvedSla = slaStats.resolvedWithinSla + slaStats.resolvedAfterSla;
        slaStats.slaCompliancePercentage = totalEvaluatedResolvedSla > 0
            ? Number(((slaStats.resolvedWithinSla / totalEvaluatedResolvedSla) * 100).toFixed(1))
            : (overall.resolvedComplaints > 0 ? 100 : 0);

        slaStats.averageResolutionTimeHours = resolvedWithTimesCount > 0
            ? Number((totalResolutionDurationHours / resolvedWithTimesCount).toFixed(2))
            : 0;

        res.status(200).json({
            message: "Dashboard statistics retrieved successfully",
            dateRange: {
                startDate: startDate || null,
                endDate: endDate || null,
            },
            overall,
            categories: categoryStats,
            priorities: priorityStats,
            channels: channelStats,
            statuses: statusStats,
            sla: slaStats,
        });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({
            message: error.message || "Failed to retrieve dashboard statistics",
        });
    }
}

async function getCseWorkload(req, res) {
    try {
        const { startDate, endDate } = req.query;
        const now = new Date();
        const matchStage = {};

        const dateRange = parseDateFilters(startDate, endDate);
        if (dateRange) {
            matchStage.receivedAt = dateRange;
        }

        const cseUsers = await userModel.find({ role: "cse" }).select("name email role");
        const complaints = await complaintModel.find(matchStage);

        const workloadMap = {};
        cseUsers.forEach(cse => {
            workloadMap[cse._id.toString()] = {
                cseId: cse._id,
                name: cse.name,
                email: cse.email,
                assignedCount: 0,
                pendingCount: 0,
                resolvedCount: 0,
                escalatedCount: 0,
                overdueCount: 0,
            };
        });

        let unassignedCount = 0;

        complaints.forEach(complaint => {
            if (!complaint.assignedTo) {
                unassignedCount += 1;
                return;
            }

            const cseIdStr = complaint.assignedTo._id
                ? complaint.assignedTo._id.toString()
                : complaint.assignedTo.toString();
            if (!workloadMap[cseIdStr]) {
                return;
            }

            const cseWorkload = workloadMap[cseIdStr];
            cseWorkload.assignedCount += 1;

            if (["Assigned", "In Progress"].includes(complaint.status)) {
                cseWorkload.pendingCount += 1;
            } else if (complaint.status === "Resolved") {
                cseWorkload.resolvedCount += 1;
            } else if (complaint.status === "Escalated") {
                cseWorkload.escalatedCount += 1;
            }

            if (slaService.isComplaintOverdue(complaint, now)) {
                cseWorkload.overdueCount += 1;
            }
        });

        const workloadList = Object.values(workloadMap);

        res.status(200).json({
            message: "CSE workload retrieved successfully",
            totalCseStaff: cseUsers.length,
            unassignedComplaints: unassignedCount,
            workload: workloadList,
        });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({
            message: error.message || "Failed to retrieve CSE workload",
        });
    }
}

module.exports = {
    getDashboardStats,
    getCseWorkload,
};
