const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => ({
    folder:          `quickkart/stores/products`,
    resource_type:   "image",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation:  [{ quality: "auto" }],
    public_id:       `${Date.now()}_${file.originalname.split(".")[0]}`,
  }),
});

const fileFilter = (_req, file, cb) => {
  const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  allowed.includes(file.mimetype)
    ? cb(null, true)
    : cb(new Error("Only JPG, PNG, or WEBP images are allowed"), false);
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per image
  fileFilter,
});

// Matches a single "images" field from the Add/Edit Product form, up to 5 files
const uploadProductImages = upload.array("images", 5);

module.exports = { uploadProductImages };