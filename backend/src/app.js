const express = require("express");
const cors = require("cors");

const healthRoutes = require("./routes/health.routes");
const authRoutes = require("./routes/auth.routes");
const complaintRoutes = require("./routes/complaint.routes");
const { notFoundHandler, errorHandler } = require("./middlewares/error.middleware");

const app = express();


app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true
}));

app.use(express.json());

app.use(express.urlencoded({ extended: true }));


app.get("/", (req, res) => {
    res.status(200).json({
        message: "Resolvo AI Complaint Classification & Recommendation Engine API",
        version: "1.0.0",
        docs: "/api/health"
    });
});

app.use("/api/health", healthRoutes);

app.use("/api/auth", authRoutes);

app.use("/api/complaints", complaintRoutes);




app.use(notFoundHandler);

app.use(errorHandler);


module.exports = app;
