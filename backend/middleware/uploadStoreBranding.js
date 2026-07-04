const createUploader = require("./createUploader");

const uploadStoreBranding = createUploader({
    folder: "quickkart/stores/branding",
    allowedFormats: ["jpg", "jpeg", "png", "webp"],
    resourceType: "image",
}).fields([
    { name: "logo", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
]);

module.exports = { uploadStoreBranding };