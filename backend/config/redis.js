const { createClient } = require("redis");
require("dotenv").config();

const client = createClient({
    url: process.env.REDIS_URL,
});

client.on("error", (err) => {
    console.error("Redis Error:", err);
});

/**
 * Connects the Redis client instance to the Redis server.
 */
const connectRedis = async () => {
    try {
        await client.connect();
        console.log("Redis Connected");
    } catch (err) {
        console.error("Redis connection failed:", err.message);
    }
};

module.exports = { client, connectRedis };