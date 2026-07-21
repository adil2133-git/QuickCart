const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const cookie = require("cookie");
const User = require("../models/shared/user");
const StoreProfile = require("../models/store/storeProfile");
const DriverProfile = require("../models/driver/driverProfile");
const CustomerProfile = require("../models/customer/customerProfile");

let io = null;

// driverId -> pending setTimeout. A clean disconnect could just be a page
// refresh or a brief network blip, so we don't flip the driver offline right
// away — we wait out a grace period, and cancel it if they reconnect first.
const driverOfflineTimers = new Map();
const DRIVER_DISCONNECT_GRACE_MS = 75 * 1000; // 75 seconds

// figures out which rooms a connected socket should join, based on role —
// mirrors the same role -> profile lookup the REST controllers already do
async function resolveRoomsForUser(userId, role) {
  const rooms = [`user:${userId}`]; // everyone gets a personal room too

  if (role === "STORE") {
    const store = await StoreProfile.findOne({ userId }).select("_id");
    if (store) rooms.push(`store:${store._id}`);
  } else if (role === "DRIVER") {
    const driver = await DriverProfile.findOne({ userId }).select("_id");
    if (driver) rooms.push(`driver:${driver._id}`);
  } else if (role === "CUSTOMER") {
    const customer = await CustomerProfile.findOne({ userId }).select("_id");
    if (customer) rooms.push(`customer:${customer._id}`);
  }

  return rooms;
}

// Comma-separated list in .env, e.g. FRONTEND_URL=http://localhost:5173,https://quickcart.vercel.app
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim());

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  });

  // same JWT verification as protectRoute.js, just adapted for the
  // handshake's raw cookie header instead of Express's parsed req.cookies
  io.use(async (socket, next) => {
    try {
      const rawCookie = socket.handshake.headers.cookie;
      if (!rawCookie) return next(new Error("Unauthorized"));

      const parsed = cookie.parse(rawCookie);
      const token = parsed.Access_Token;
      if (!token) return next(new Error("Unauthorized"));

      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN);
      const user = await User.findById(decoded.id);
      if (!user || user.blocked) return next(new Error("Unauthorized"));

      socket.user = { userID: decoded.id, role: decoded.role };
      next();
    } catch (err) {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", async (socket) => {
    const { userID, role } = socket.user;
    let driverId = null;

    try {
      const rooms = await resolveRoomsForUser(userID, role);
      rooms.forEach((room) => socket.join(room));
      console.log(`[socket] ${role} ${userID} connected, joined: ${rooms.join(", ")}`);

      if (role === "DRIVER") {
        const driverRoom = rooms.find((r) => r.startsWith("driver:"));
        driverId = driverRoom ? driverRoom.split(":")[1] : null;

        // reconnected before the grace timer fired — cancel the pending offline flip
        if (driverId && driverOfflineTimers.has(driverId)) {
          clearTimeout(driverOfflineTimers.get(driverId));
          driverOfflineTimers.delete(driverId);
        }
      }
    } catch (err) {
      console.error("[socket] room resolution failed:", err);
    }

    socket.on("disconnect", () => {
      console.log(`[socket] ${role} ${userID} disconnected`);

      if (role === "DRIVER" && driverId) {
        // another tab for the same driver might still be connected —
        // only start the grace timer if this was the last one
        const stillConnected = io.sockets.adapter.rooms.get(`driver:${driverId}`);
        if (stillConnected && stillConnected.size > 0) return;

        const timer = setTimeout(async () => {
          driverOfflineTimers.delete(driverId);
          try {
            const DriverProfile = require("../models/driver/driverProfile");
            const driver = await DriverProfile.findById(driverId);
            if (driver && driver.availabilityStatus === "ONLINE") {
              driver.availabilityStatus = "OFFLINE";
              await driver.save();
              console.log(`[socket] Driver ${driverId} auto-flipped OFFLINE after disconnect grace period`);
            }
          } catch (err) {
            console.error("[socket] Disconnect offline flip failed:", err.message);
          }
        }, DRIVER_DISCONNECT_GRACE_MS);

        driverOfflineTimers.set(driverId, timer);
      }
    });
  });

  return io;
}

// controllers call these — nothing else should touch `io` directly
function emitToStore(storeId, event, payload) {
  if (!io) return;
  io.to(`store:${storeId}`).emit(event, payload);
}

function emitToDriver(driverId, event, payload) {
  if (!io) return;
  io.to(`driver:${driverId}`).emit(event, payload);
}

function emitToCustomer(customerId, event, payload) {
  if (!io) return;
  io.to(`customer:${customerId}`).emit(event, payload);
}

module.exports = { initSocket, emitToStore, emitToDriver, emitToCustomer };