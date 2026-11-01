// Express application setup, global middleware, route registration, and centralized error handling.

const express = require("express");
const cors = require("cors");

const healthRoutes = require("./routes/health.routes");
const authRoutes = require("./routes/auth.routes");
const complaintRoutes = require("./routes/complaint.routes");
const qatRoutes = require("./routes/qat.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const reportRoutes = require("./routes/report.routes");
const { notFoundHandler, errorHandler } = require("./middlewares/error.middleware");

const app = express();

app.use(cors({
    origin: true,
    credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.status(200).json({
        message: "Resolvo AI Complaint Classification & Recommendation Engine API",
        version: "1.0.0",
        docs: "/api/health",
    });
});

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/qa", qatRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
