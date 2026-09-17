const mongoose = require("mongoose");
const aiService = require("../services/ai.service");


async function getHealthStatus(req, res) {

    const dbState = mongoose.connection.readyState;

    const dbStatusMap = {
        0: "disconnected",
        1: "connected",
        2: "connecting",
        3: "disconnecting"
    };

    const isDatabaseReady = dbState === 1;
    const aiHealth = await aiService.checkAiServiceHealth();

    res.status(200).json({
        message: "Resolvo Backend is healthy",
        status: "ok",
        timestamp: new Date().toISOString(),
        database: {
            status: dbStatusMap[dbState] || "unknown",
            isConnected: isDatabaseReady
        },
        aiService: aiHealth
    });

}


module.exports = {
    getHealthStatus
};
