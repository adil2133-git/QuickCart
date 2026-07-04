const createUploader = require("./createUploader");

const uploadStoreDocs = createUploader({
    folder: "quickkart/stores/{fieldname}",
    allowedFormats: ["jpg", "jpeg", "png", "pdf"],
}).fields([
    { name: "tradeLicense", maxCount: 1 },
    { name: "ownerId", maxCount: 1 },
    { name: "storeFront", maxCount: 1 },
]);

module.exports = { uploadStoreDocs };