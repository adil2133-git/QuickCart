const nodemailer = require("nodemailer");
require("dotenv").config();

/**
 * Configure Nodemailer transport instance for email notifications.
 */
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

module.exports = transporter;