const mongoose = require("mongoose");


async function connectDatabase() {

    try {

        const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ComplaintDB";

        await mongoose.connect(mongoUri);

        console.log(`MongoDB connected successfully to ${mongoose.connection.name}`);

    } catch (error) {

        console.error("MongoDB connection error:", error.message);
        process.exit(1);

    }

}


module.exports = connectDatabase;
