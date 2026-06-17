const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => ({
    folder:          `quickkart/stores/${file.fieldname}`,
    resource_type:   "auto",
    allowed_formats: ["jpg", "jpeg", "png", "pdf"],
    transformation:  [{ quality: "auto" }],
    public_id:       `${Date.now()}_${file.originalname.split(".")[0]}`,
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

// Matches the 3 UploadCard field names from the frontend
const uploadStoreDocs = upload.fields([
  { name: "tradeLicense", maxCount: 1 },
  { name: "ownerId",      maxCount: 1 },
  { name: "storeFront",   maxCount: 1 },
]);

module.exports = { uploadStoreDocs };