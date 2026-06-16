const multer  = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => ({
    folder:         `quickkart/drivers/${file.fieldname}`,
    resource_type:  "auto",
    allowed_formats: ["jpg", "jpeg", "png", "pdf"],
    transformation: [{ quality: "auto" }],
    public_id:      `${Date.now()}_${file.originalname.split(".")[0]}`,
  }),
});

const fileFilter = (_req, file, cb) => {
  const allowed = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
  allowed.includes(file.mimetype)
    ? cb(null, true)
    : cb(new Error("Only JPG, PNG, or PDF files are allowed"), false);
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter,
});

// Matches the 3 DocumentCard field names from the frontend
const uploadDriverDocs = upload.fields([
  { name: "drivingLicense", maxCount: 1 },
  { name: "vehicleRC",      maxCount: 1 },
  { name: "profilePhoto",   maxCount: 1 },
]);

module.exports = { uploadDriverDocs };