const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => ({
    folder:          `quickkart/stores/categories`,
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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter,
});

// Matches a single "image" field from the Add/Edit Category form
const uploadCategoryImage = upload.single("image");

module.exports = { uploadCategoryImage };