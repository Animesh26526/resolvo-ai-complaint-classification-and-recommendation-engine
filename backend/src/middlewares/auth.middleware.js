const jwt = require("jsonwebtoken");

const userModel = require("../models/user.model");


async function authenticateUser(req, res, next) {

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Authentication token is required",
        });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            message: "Authentication token is missing",
        });
    }

    try {

        const jwtSecret = process.env.JWT_SECRET || "default_dev_secret";

        const decoded = jwt.verify(token, jwtSecret);

        const user = await userModel
            .findById(decoded.id)
            .select("-password");

        if (!user) {
            return res.status(401).json({
                message: "User not found or token is invalid",
            });
        }

        if (!user.isEmailVerified) {
            return res.status(403).json({
                message: "Email address must be verified before proceeding",
            });
        }

        req.user = {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
        };

        next();

    } catch (error) {

        return res.status(401).json({
            message: "Invalid or expired authentication token",
        });

    }

}


function authorizeRoles(...allowedRoles) {

    return function (req, res, next) {

        if (!req.user) {
            return res.status(401).json({
                message: "Authentication required",
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: "Forbidden: You do not have permission to access this resource",
            });
        }

        next();

    };

}


module.exports = {
    authenticateUser,
    authMiddleware: authenticateUser,
    authorizeRoles,
};
