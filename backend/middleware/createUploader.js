const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const MIME_BY_FORMAT = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    pdf: "application/pdf",
};

function createUploader({ folder, allowedFormats, resourceType = "auto" }) {
    const storage = new CloudinaryStorage({
        cloudinary,
        params: (req, file) => ({
            folder: folder.includes("{fieldname}")
                ? folder.replace("{fieldname}", file.fieldname)
                : folder,
            resource_type: resourceType,
            allowed_formats: allowedFormats,
            transformation: [{ quality: "auto" }],
            public_id: `${Date.now()}_${file.originalname.split(".")[0]}`,
        }),
    });

    const allowedMimes = allowedFormats.map((f) => MIME_BY_FORMAT[f]).filter(Boolean);

    const fileFilter = (_req, file, cb) => {
        allowedMimes.includes(file.mimetype)
            ? cb(null, true)
            : cb(new Error(`Only ${allowedFormats.join(", ").toUpperCase()} files are allowed`), false);
    };

    return multer({
        storage,
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter,
    });
}

module.exports = createUploader;