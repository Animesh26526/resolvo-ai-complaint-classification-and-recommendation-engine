const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";


async function checkAiServiceHealth() {

    try {

        const response = await fetch(`${AI_SERVICE_URL}/health`);

        if (!response.ok) {
            return {
                isAvailable: false,
                status: response.status,
                message: "AI service returned non-200 status",
            };
        }

        const data = await response.json();

        return {
            isAvailable: true,
            status: response.status,
            data: data,
        };

    } catch (error) {

        return {
            isAvailable: false,
            message: error.message,
        };

    }

}


async function analyzeComplaint(complaintData) {

    if (!complaintData) {
        const error = new Error("Complaint data is required for analysis");
        error.statusCode = 400;
        throw error;
    }

    const description = typeof complaintData === "string"
        ? complaintData
        : complaintData.description;

    const channel = (typeof complaintData === "object" && complaintData.channel)
        ? complaintData.channel
        : "text";

    if (!description || !description.trim()) {
        const error = new Error("Complaint description is required for AI analysis");
        error.statusCode = 400;
        throw error;
    }

    let response;

    try {

        response = await fetch(`${AI_SERVICE_URL}/api/analyze`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                description: description.trim(),
                channel: channel,
            }),
        });

    } catch (networkError) {

        const error = new Error("AI analysis service is currently unreachable");
        error.isAiServiceError = true;
        error.statusCode = 503;
        throw error;

    }

    if (!response.ok) {

        let errorMessage = "AI analysis failed";

        try {
            const errorJson = await response.json();
            if (errorJson && errorJson.detail) {
                errorMessage = typeof errorJson.detail === "string"
                    ? errorJson.detail
                    : "Invalid request payload sent to AI service";
            }
        } catch (_) {
            // Keep default errorMessage
        }

        const error = new Error(errorMessage);
        error.isAiServiceError = true;
        error.statusCode = response.status >= 500 ? 502 : 400;
        throw error;

    }

    const analysisData = await response.json();

    if (!analysisData.category || !analysisData.priority || !analysisData.recommendation) {
        const error = new Error("AI analysis service returned an incomplete response");
        error.isAiServiceError = true;
        error.statusCode = 502;
        throw error;
    }

    return {
        category: analysisData.category,
        sentiment: analysisData.sentiment || "Neutral",
        priority: analysisData.priority,
        recommendation: analysisData.recommendation,
        is_resolvable_by_ai: Boolean(analysisData.is_resolvable_by_ai),
    };

}


module.exports = {
    checkAiServiceHealth,
    analyzeComplaint,
};
