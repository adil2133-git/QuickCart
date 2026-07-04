const createUploader = require("./createUploader");

const uploadCategoryImage = createUploader({
    folder: "quickkart/stores/categories",
    allowedFormats: ["jpg", "jpeg", "png", "webp"],
    resourceType: "image",
}).single("image");

module.exports = { uploadCategoryImage };