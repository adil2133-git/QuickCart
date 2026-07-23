const mongoose = require("mongoose");

/**
 * Establishes a connection to the MongoDB database.
 */
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.DATABASE_URL);
        console.log("Database Connected");
    } catch (err) {
        console.error("Database Connection Failed:", err.message);
        process.exit(1);
    }
};

module.exports = connectDB;