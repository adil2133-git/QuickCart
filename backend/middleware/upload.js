const createUploader = require("./createUploader");

const uploadDriverDocs = createUploader({
  folder: "quickkart/drivers/{fieldname}",
  allowedFormats: ["jpg", "jpeg", "png", "pdf"],
}).fields([
  { name: "drivingLicense", maxCount: 1 },
  { name: "vehicleRC", maxCount: 1 },
  { name: "profilePhoto", maxCount: 1 },
]);

module.exports = { uploadDriverDocs };