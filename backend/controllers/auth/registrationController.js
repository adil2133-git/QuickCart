const bcrypt = require("bcryptjs");
const { client } = require("../../config/redis");
const { sendOtp } = require("../../services/otpService");
const User = require("../../models/shared/user");

const CustomerRegister = async (req, res) => {
    try {
        const { name, phone, email, password } = req.body;

        if (!name || !phone || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (name.trim().length < 3) {
            return res.status(400).json({ message: "Name must be at least 3 characters" });
        }

        const lowerEmail = email.toLowerCase();

        const userExists = await User.findOne({ email: lowerEmail });
        if (userExists) {
            return res.status(409).json({ message: "Email is already registered" });
        }

        const phoneExists = await User.findOne({ phone });
        if (phoneExists) {
            return res.status(409).json({ message: "Phone number is already registered" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await client.setEx(
            `register:${lowerEmail}`,
            120,
            JSON.stringify({
                name,
                phone,
                email: lowerEmail,
                password: hashedPassword,
                role: "CUSTOMER"
            })
        );

        const result = await sendOtp(lowerEmail);

        if (!result.success) {
            return res.status(429).json({ message: result.message || "Failed to send OTP" });
        }

        return res.status(200).json({ message: "OTP sent. Please verify to complete registration", email: lowerEmail });

    } catch (err) {
        console.log("REGISTER ERROR:", err);
        return res.status(500).json({ message: "Internal server error", Error: err.message });
    }
};


const mongoose   = require("mongoose");
const bcrypt     = require("bcryptjs");
const jwt        = require("jsonwebtoken");
const User          = require("../models/User");
const DriverProfile = require("../models/DriverProfile");
const cloudinary = require("../config/cloudinary");

// ─── Helpers ──────────────────────────────────────────────────────────────────

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

/**
 * Upload a buffer to Cloudinary using your existing cloudinary instance.
 * @returns {Promise<string>} secure_url
 */
const uploadBuffer = (buffer, folder, publicId) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: "auto",
        allowed_formats: ["jpg", "jpeg", "png", "pdf"],
        transformation: [{ quality: "auto" }],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });

/**
 * Upload one multer file field to Cloudinary and return its secure URL.
 * Returns null if the field was not submitted.
 */
const uploadField = async (files, fieldName, folder, userId) => {
  const arr = files?.[fieldName];
  if (!arr || arr.length === 0) return null;
  const publicId = `${userId}_${fieldName}_${Date.now()}`;
  return uploadBuffer(arr[0].buffer, folder, publicId);
};

/**
 * Extract Cloudinary public_id from a secure_url and delete the asset.
 * URL format: .../upload/v<version>/<folder/public_id>.<ext>
 */
const deleteByUrl = (url) => {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
  const publicId = match?.[1];
  if (!publicId) return Promise.resolve();
  return cloudinary.uploader.destroy(publicId, { resource_type: "auto" });
};

// ─── Register ─────────────────────────────────────────────────────────────────

/**
 * POST /api/delivery-partners/register
 *
 * Multipart form-data body fields:
 *   name, phone, email, password, confirmPassword,
 *   vehicleType, vehicleNumber, licenseNumber
 *
 * File fields (all optional but recommended):
 *   drivingLicense, vehicleRC, profilePhoto
 *
 * Flow:
 *   1. Validate input
 *   2. Create User  (role: DRIVER, status: PENDING_APPROVAL) inside a session
 *   3. Upload docs to Cloudinary (outside transaction — Cloudinary is external)
 *   4. Create DriverProfile with documentUrls[]
 *   5. Commit
 */
exports.register = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      name,
      phone,
      email,
      password,
      confirmPassword,
      vehicleType,
      vehicleNumber,
      licenseNumber,
    } = req.body;

    // ── Field validation ────────────────────────────────────────────────────
    const missing = [];
    if (!name)            missing.push("name");
    if (!phone)           missing.push("phone");
    if (!email)           missing.push("email");
    if (!password)        missing.push("password");
    if (!confirmPassword) missing.push("confirmPassword");
    if (!vehicleType)     missing.push("vehicleType");
    if (!vehicleNumber)   missing.push("vehicleNumber");
    if (!licenseNumber)   missing.push("licenseNumber");

    if (missing.length) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missing.join(", ")}`,
      });
    }

    if (password !== confirmPassword) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Passwords do not match." });
    }

    if (password.length < 6) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters." });
    }

    const validVehicles = ["Bike", "Scooter", "Cycle"];
    if (!validVehicles.includes(vehicleType)) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `vehicleType must be one of: ${validVehicles.join(", ")}`,
      });
    }

    // ── Duplicate check ─────────────────────────────────────────────────────
    const duplicate = await User.findOne({ $or: [{ phone }, { email }] }).session(session);
    if (duplicate) {
      await session.abortTransaction();
      const field = duplicate.phone === phone ? "phone number" : "email";
      return res.status(409).json({
        success: false,
        message: `An account with this ${field} already exists.`,
      });
    }

    // ── Create User (DRIVER + PENDING_APPROVAL) ─────────────────────────────
    const hashedPassword = await bcrypt.hash(password, 12);

    const [user] = await User.create(
      [
        {
          name,
          phone,
          email,
          password: hashedPassword,
          role: "DRIVER",
          status: "PENDING_APPROVAL",
        },
      ],
      { session }
    );

    // ── Upload documents to Cloudinary (parallel) ───────────────────────────
    // Done outside the transaction since Cloudinary is an external service.
    // If uploads fail, we abort and the User doc is rolled back cleanly.
    const folder = `quickkart/drivers/${user._id}`;
    const files  = req.files || {};

    let documentUrls = [];
    try {
      const results = await Promise.all([
        uploadField(files, "drivingLicense", folder, user._id),
        uploadField(files, "vehicleRC",      folder, user._id),
        uploadField(files, "profilePhoto",   folder, user._id),
      ]);
      // Filter out nulls (fields not submitted) and store as flat URL array
      documentUrls = results.filter(Boolean);
    } catch (uploadErr) {
      await session.abortTransaction();
      return res.status(502).json({
        success: false,
        message: "Document upload failed. Please try again.",
        error: uploadErr.message,
      });
    }

    // ── Create DriverProfile ────────────────────────────────────────────────
    await DriverProfile.create(
      [
        {
          userId: user._id,
          vehicleType,
          vehicleNumber,
          licenseNumber,
          documentUrls,
        },
      ],
      { session }
    );

    await session.commitTransaction();

    // ── Respond (no JWT — account is pending) ──────────────────────────────
    res.status(201).json({
      success: true,
      message:
        "Application submitted successfully. Our admin team will review your application and contact you via phone once approved.",
      data: {
        userId:      user._id,
        name:        user.name,
        phone:       user.phone,
        email:       user.email,
        status:      user.status,       // "PENDING_APPROVAL"
        documentUrls,
      },
    });
  } catch (err) {
    await session.abortTransaction();
    console.error("[register]", err);

    // Mongoose duplicate key (race condition)
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || "field";
      return res.status(409).json({
        success: false,
        message: `An account with this ${field} already exists.`,
      });
    }

    res.status(500).json({ success: false, message: "Server error during registration.", error: err.message });
  } finally {
    session.endSession();
  }
};

// ─── Login ────────────────────────────────────────────────────────────────────

/**
 * POST /api/delivery-partners/login
 * Body: { phone, password }
 *
 * JWT is issued ONLY when User.status === "ACTIVE".
 */
exports.login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ success: false, message: "Phone and password are required." });
    }

    // Select password explicitly (not returned by default in queries)
    const user = await User.findOne({ phone, role: "DRIVER" }).select("+password");

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid phone number or password." });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: "Invalid phone number or password." });
    }

    // ── Status gate ─────────────────────────────────────────────────────────
    const statusMessages = {
      PENDING_APPROVAL: "Your application is under review. You will be notified once approved.",
      SUSPENDED:        "Your account has been suspended. Please contact support.",
      REJECTED:         "Your application was not approved. Please contact support for details.",
    };

    if (user.status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        status: user.status,
        message: statusMessages[user.status] || "Account access denied.",
      });
    }

    // ── Fetch driver profile ────────────────────────────────────────────────
    const profile = await DriverProfile.findOne({ userId: user._id });

    const token = signToken(user._id);

    res.status(200).json({
      success: true,
      token,
      data: {
        userId:             user._id,
        name:               user.name,
        phone:              user.phone,
        email:              user.email,
        status:             user.status,
        vehicleType:        profile?.vehicleType,
        availabilityStatus: profile?.availabilityStatus,
        currentLevel:       profile?.currentLevel,
        averageRating:      profile?.averageRating,
        walletBalance:      profile?.walletBalance,
      },
    });
  } catch (err) {
    console.error("[login]", err);
    res.status(500).json({ success: false, message: "Server error during login.", error: err.message });
  }
};

// ─── Admin: Update application status ────────────────────────────────────────

/**
 * PATCH /api/delivery-partners/:userId/status
 * Body: { status: "ACTIVE" | "REJECTED" | "SUSPENDED" }
 *
 * Admins approve (ACTIVE), reject (REJECTED), or suspend (SUSPENDED) drivers.
 */
exports.updateStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status }  = req.body;

    const allowed = ["ACTIVE", "REJECTED", "SUSPENDED"];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `status must be one of: ${allowed.join(", ")}`,
      });
    }

    const user = await User.findOneAndUpdate(
      { _id: userId, role: "DRIVER" },
      { status },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "Driver not found." });
    }

    res.status(200).json({
      success: true,
      message: `Driver status updated to "${status}".`,
      data: { userId: user._id, name: user.name, phone: user.phone, status: user.status },
    });
  } catch (err) {
    console.error("[updateStatus]", err);
    res.status(500).json({ success: false, message: "Server error.", error: err.message });
  }
};

// ─── Admin: List all drivers ──────────────────────────────────────────────────

/**
 * GET /api/delivery-partners
 * Query: status=PENDING_APPROVAL|ACTIVE|REJECTED|SUSPENDED, page, limit
 */
exports.getAllDrivers = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const userFilter = { role: "DRIVER" };
    if (status) userFilter.status = status;

    const [users, total] = await Promise.all([
      User.find(userFilter)
        .select("-password -__v")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      User.countDocuments(userFilter),
    ]);

    // Attach driver profile data
    const userIds  = users.map((u) => u._id);
    const profiles = await DriverProfile.find({ userId: { $in: userIds } }).select("-__v");
    const profileMap = Object.fromEntries(profiles.map((p) => [p.userId.toString(), p]));

    const data = users.map((u) => ({
      ...u.toObject(),
      profile: profileMap[u._id.toString()] || null,
    }));

    res.status(200).json({
      success: true,
      total,
      page:  Number(page),
      pages: Math.ceil(total / limit),
      data,
    });
  } catch (err) {
    console.error("[getAllDrivers]", err);
    res.status(500).json({ success: false, message: "Server error.", error: err.message });
  }
};

// ─── Admin/Self: Get single driver ────────────────────────────────────────────

/**
 * GET /api/delivery-partners/:userId
 */
exports.getDriverById = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.userId, role: "DRIVER" }).select("-password -__v");
    if (!user) {
      return res.status(404).json({ success: false, message: "Driver not found." });
    }

    const profile = await DriverProfile.findOne({ userId: user._id }).select("-__v");

    res.status(200).json({ success: true, data: { ...user.toObject(), profile } });
  } catch (err) {
    console.error("[getDriverById]", err);
    res.status(500).json({ success: false, message: "Server error.", error: err.message });
  }
};

// ─── Admin: Delete driver ─────────────────────────────────────────────────────

/**
 * DELETE /api/delivery-partners/:userId
 * Removes both User + DriverProfile and cleans up Cloudinary docs.
 */
exports.deleteDriver = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findOne({ _id: req.params.userId, role: "DRIVER" }).session(session);
    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Driver not found." });
    }

    const profile = await DriverProfile.findOne({ userId: user._id }).session(session);

    // Delete Cloudinary assets — uses your existing cloudinary instance
    if (profile?.documentUrls?.length) {
      await Promise.allSettled(profile.documentUrls.map(deleteByUrl));
    }

    await DriverProfile.deleteOne({ userId: user._id }).session(session);
    await User.deleteOne({ _id: user._id }).session(session);

    await session.commitTransaction();
    res.status(200).json({ success: true, message: "Driver and all associated data deleted successfully." });
  } catch (err) {
    await session.abortTransaction();
    console.error("[deleteDriver]", err);
    res.status(500).json({ success: false, message: "Server error.", error: err.message });
  } finally {
    session.endSession();
  }
};


module.exports = { CustomerRegister};