const transporter = require("../config/mail");
const { buildEmailHTML } = require("../utils/emailTemplate");
require("dotenv").config();

const FROM = process.env.EMAIL_USER;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

// ─── generic sender ────────────────────────────────────────────────────────
// Every specific email below calls this. It never throws — email delivery
// should never break the actual business flow (registration, order placement,
// etc). Failures are logged so they show up in server logs / can be alerted on.
const sendMail = async ({ to, subject, html }) => {
    if (!to) {
        console.log("[mailService] Skipped send — no recipient email for:", subject);
        return { success: false, message: "No recipient" };
    }
    try {
        await transporter.sendMail({ from: FROM, to, subject, html });
        return { success: true };
    } catch (err) {
        console.log(`[mailService] Failed to send "${subject}" to ${to}:`, err.message);
        return { success: false, message: err.message };
    }
};

const money = (n) => `₹${Number(n).toFixed(2)}`;

// ── Store registration ──────────────────────────────────────────────────────

const sendStoreApplicationReceivedEmail = (user) =>
    sendMail({
        to: user.email,
        subject: "We've received your store application - QuickKart",
        html: buildEmailHTML({
            heading: "Application Received",
            greeting: `Hi ${user.name},`,
            paragraphs: [
                "We've received your application. Our team will review it shortly.",
                "We'll email you as soon as a decision has been made.",
            ],
        }),
    });

const sendStoreApprovedEmail = (user) =>
    sendMail({
        to: user.email,
        subject: "Your store has been approved - QuickKart",
        html: buildEmailHTML({
            heading: "Congratulations!",
            greeting: `Hi ${user.name},`,
            paragraphs: [
                "Congratulations! Your store has been approved. You can now log in and start listing products.",
            ],
        }),
    });

const sendStoreRejectedEmail = (user, reason) =>
    sendMail({
        to: user.email,
        subject: "Update on your store application - QuickKart",
        html: buildEmailHTML({
            heading: "Application Update",
            greeting: `Hi ${user.name},`,
            paragraphs: [
                "Thanks for applying to sell on QuickKart. Unfortunately, we're unable to approve your store application at this time.",
            ],
            details: [{ label: "Reason", value: reason }],
        }),
    });

// ── Driver registration ─────────────────────────────────────────────────────

const sendDriverApplicationReceivedEmail = (user) =>
    sendMail({
        to: user.email,
        subject: "Your application has been received - QuickKart",
        html: buildEmailHTML({
            heading: "Application Received",
            greeting: `Hi ${user.name},`,
            paragraphs: ["Your application has been received. Our team will review it shortly."],
        }),
    });

const sendDriverApprovedEmail = (user) =>
    sendMail({
        to: user.email,
        subject: "Your driver account is now active - QuickKart",
        html: buildEmailHTML({
            heading: "You're Approved!",
            greeting: `Hi ${user.name},`,
            paragraphs: ["Your account is now active. You can log in and start accepting deliveries."],
        }),
    });

const sendDriverRejectedEmail = (user, reason) =>
    sendMail({
        to: user.email,
        subject: "Update on your driver application - QuickKart",
        html: buildEmailHTML({
            heading: "Application Update",
            greeting: `Hi ${user.name},`,
            paragraphs: [
                "Thanks for applying to drive with QuickKart. Unfortunately, we're unable to approve your application at this time.",
            ],
            details: [{ label: "Reason", value: reason }],
        }),
    });

// ── Admin notifications ─────────────────────────────────────────────────────

const sendAdminNewStoreApplicationEmail = ({ storeName, ownerName, email }) =>
    sendMail({
        to: ADMIN_EMAIL,
        subject: `New store application: ${storeName}`,
        html: buildEmailHTML({
            heading: "New Store Application",
            paragraphs: ["A new store has applied and is waiting for review."],
            details: [
                { label: "Store", value: storeName },
                { label: "Owner", value: ownerName },
                { label: "Email", value: email },
            ],
        }),
    });

const sendAdminNewDriverApplicationEmail = ({ name, email, vehicleType }) =>
    sendMail({
        to: ADMIN_EMAIL,
        subject: `New driver application: ${name}`,
        html: buildEmailHTML({
            heading: "New Driver Application",
            paragraphs: ["A new driver has applied and is waiting for review."],
            details: [
                { label: "Name", value: name },
                { label: "Email", value: email },
                { label: "Vehicle Type", value: vehicleType },
            ],
        }),
    });

// ── Customer orders ─────────────────────────────────────────────────────────

const sendOrderPlacedEmail = ({ toEmail, customerName, order, storeName }) =>
    sendMail({
        to: toEmail,
        subject: `Order Confirmed - ${order.orderNumber}`,
        html: buildEmailHTML({
            heading: "Order Confirmed",
            greeting: `Hi ${customerName},`,
            paragraphs: ["Thanks for your order! Here are the details:"],
            details: [
                { label: "Order ID", value: order.orderNumber },
                { label: "Store", value: storeName },
                { label: "Total", value: money(order.totalAmount) },
                { label: "Delivery Address", value: order.deliveryAddress },
                { label: "Estimated Delivery", value: "30–45 minutes" },
            ],
        }),
    });

const sendNewOrderStoreEmail = ({ toEmail, storeName, order }) =>
    sendMail({
        to: toEmail,
        subject: `New Order Received - ${order.orderNumber}`,
        html: buildEmailHTML({
            heading: "New Order Received",
            greeting: `Hi ${storeName},`,
            paragraphs: ["You have received a new order."],
            details: [
                { label: "Order ID", value: order.orderNumber },
                { label: "Total", value: money(order.totalAmount) },
                { label: "Delivery Address", value: order.deliveryAddress },
            ],
        }),
    });

const sendOrderCancelledEmail = ({ toEmail, name, order }) =>
    sendMail({
        to: toEmail,
        subject: `Order Cancelled - ${order.orderNumber}`,
        html: buildEmailHTML({
            heading: "Order Cancelled",
            greeting: `Hi ${name},`,
            paragraphs: [`Order ${order.orderNumber} has been cancelled.`],
            details: [
                { label: "Order ID", value: order.orderNumber },
                { label: "Total", value: money(order.totalAmount) },
            ],
        }),
    });

const sendOrderDeliveredEmail = ({ toEmail, customerName, order }) =>
    sendMail({
        to: toEmail,
        subject: `Delivered - ${order.orderNumber}`,
        html: buildEmailHTML({
            heading: "Order Delivered — Thank You!",
            greeting: `Hi ${customerName},`,
            paragraphs: ["Your order has been delivered. Thanks for shopping with QuickKart!"],
            details: [
                { label: "Order ID", value: order.orderNumber },
                ...order.products.map((p) => ({
                    label: `${p.productName} × ${p.quantity}`,
                    value: money(p.price * p.quantity),
                })),
                { label: "Total Paid", value: money(order.totalAmount) },
            ],
        }),
    });

// ── Password / security ─────────────────────────────────────────────────────

const sendPasswordChangedEmail = (user) =>
    sendMail({
        to: user.email,
        subject: "Your password was changed - QuickKart",
        html: buildEmailHTML({
            heading: "Password Changed",
            greeting: `Hi ${user.name},`,
            paragraphs: [
                "Your QuickKart account password was just changed.",
                "If this wasn't you, please contact support immediately.",
            ],
        }),
    });

module.exports = {
    sendMail,
    sendStoreApplicationReceivedEmail,
    sendStoreApprovedEmail,
    sendStoreRejectedEmail,
    sendDriverApplicationReceivedEmail,
    sendDriverApprovedEmail,
    sendDriverRejectedEmail,
    sendAdminNewStoreApplicationEmail,
    sendAdminNewDriverApplicationEmail,
    sendOrderPlacedEmail,
    sendNewOrderStoreEmail,
    sendOrderCancelledEmail,
    sendOrderDeliveredEmail,
    sendPasswordChangedEmail,
};