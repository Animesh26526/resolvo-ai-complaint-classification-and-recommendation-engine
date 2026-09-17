function notFoundHandler(req, res, next) {

    res.status(404).json({
        message: `Route not found: ${req.method} ${req.originalUrl}`
    });

}


function errorHandler(err, req, res, next) {

    console.error("Internal Server Error:", err.message);

    const statusCode = err.statusCode || 500;
    const responseMessage = statusCode === 500 
        ? "Internal server error" 
        : err.message;

    res.status(statusCode).json({
        message: responseMessage
    });

}


module.exports = {
    notFoundHandler,
    errorHandler
};
