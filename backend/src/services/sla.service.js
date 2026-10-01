// Handles SLA deadline calculation, compliance evaluation, and overdue complaint monitoring.

const DEFAULT_SLA_HOURS = {
    High: 24,
    Medium: 48,
    Low: 72,
};

function getSlaHours(priority) {
    if (!priority) {
        return null;
    }

    const normalizedPriority = priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase();

    const envHigh = process.env.SLA_HOURS_HIGH ? parseInt(process.env.SLA_HOURS_HIGH, 10) : DEFAULT_SLA_HOURS.High;
    const envMedium = process.env.SLA_HOURS_MEDIUM ? parseInt(process.env.SLA_HOURS_MEDIUM, 10) : DEFAULT_SLA_HOURS.Medium;
    const envLow = process.env.SLA_HOURS_LOW ? parseInt(process.env.SLA_HOURS_LOW, 10) : DEFAULT_SLA_HOURS.Low;

    const rules = {
        High: isNaN(envHigh) ? DEFAULT_SLA_HOURS.High : envHigh,
        Medium: isNaN(envMedium) ? DEFAULT_SLA_HOURS.Medium : envMedium,
        Low: isNaN(envLow) ? DEFAULT_SLA_HOURS.Low : envLow,
    };

    return rules[normalizedPriority] || null;
}

function calculateSlaDeadline(priority, startDate = new Date()) {
    const hours = getSlaHours(priority);
    if (hours === null) {
        return null;
    }

    const start = startDate ? new Date(startDate) : new Date();
    if (isNaN(start.getTime())) {
        return null;
    }

    return new Date(start.getTime() + hours * 60 * 60 * 1000);
}

function isComplaintOverdue(complaint, referenceTime = new Date()) {
    if (!complaint || !complaint.slaDeadline) {
        return false;
    }

    if (complaint.status === "Resolved") {
        return false;
    }

    const deadline = new Date(complaint.slaDeadline);
    const ref = new Date(referenceTime);

    if (isNaN(deadline.getTime()) || isNaN(ref.getTime())) {
        return false;
    }

    return ref > deadline;
}

function isResolvedWithinSla(complaint) {
    if (!complaint || complaint.status !== "Resolved" || !complaint.resolvedAt || !complaint.slaDeadline) {
        return null;
    }

    const resolved = new Date(complaint.resolvedAt);
    const deadline = new Date(complaint.slaDeadline);

    if (isNaN(resolved.getTime()) || isNaN(deadline.getTime())) {
        return null;
    }

    return resolved <= deadline;
}

function getSlaStatus(complaint, referenceTime = new Date()) {
    if (!complaint) {
        return "unknown";
    }

    const now = new Date(referenceTime);

    if (complaint.status === "Resolved") {
        if (!complaint.slaDeadline) {
            return "resolved_no_sla";
        }
        return isResolvedWithinSla(complaint) ? "resolved_within_sla" : "resolved_after_sla";
    }

    if (!complaint.slaDeadline) {
        return "active_no_sla";
    }

    const deadline = new Date(complaint.slaDeadline);
    if (now > deadline) {
        return "overdue";
    }

    const remainingMs = deadline.getTime() - now.getTime();
    const fourHoursMs = 4 * 60 * 60 * 1000;

    if (remainingMs <= fourHoursMs) {
        return "approaching_deadline";
    }

    return "active";
}

function getSlaDetails(complaint, referenceTime = new Date()) {
    if (!complaint) {
        return null;
    }

    const now = new Date(referenceTime);
    const received = complaint.receivedAt ? new Date(complaint.receivedAt) : (complaint.createdAt ? new Date(complaint.createdAt) : now);
    const resolved = complaint.resolvedAt ? new Date(complaint.resolvedAt) : null;
    const deadline = complaint.slaDeadline ? new Date(complaint.slaDeadline) : null;

    const endTime = resolved || now;
    const elapsedTimeMs = Math.max(0, endTime.getTime() - received.getTime());
    const elapsedTimeHours = Number((elapsedTimeMs / (1000 * 60 * 60)).toFixed(2));

    let remainingTimeMs = null;
    let remainingTimeHours = null;

    if (deadline && complaint.status !== "Resolved") {
        remainingTimeMs = deadline.getTime() - now.getTime();
        remainingTimeHours = Number((remainingTimeMs / (1000 * 60 * 60)).toFixed(2));
    }

    return {
        slaDeadline: deadline,
        elapsedTimeMs: elapsedTimeMs,
        elapsedTimeHours: elapsedTimeHours,
        remainingTimeMs: remainingTimeMs,
        remainingTimeHours: remainingTimeHours,
        isOverdue: isComplaintOverdue(complaint, now),
        slaStatus: getSlaStatus(complaint, now),
        resolvedWithinSla: isResolvedWithinSla(complaint),
    };
}

module.exports = {
    DEFAULT_SLA_HOURS,
    getSlaHours,
    calculateSlaDeadline,
    isComplaintOverdue,
    isResolvedWithinSla,
    getSlaStatus,
    getSlaDetails,
};
