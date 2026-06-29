const createUploader = require("./createUploader");

const uploadProductImages = createUploader({
  folder: "quickkart/stores/products",
  allowedFormats: ["jpg", "jpeg", "png", "webp"],
  resourceType: "image",
}).array("images", 5);

module.exports = { uploadProductImages };