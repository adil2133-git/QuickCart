const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const assetsDir = path.join(__dirname, "../src/assets");

const imagesToCompress = [
  "hero-bg1.png",
  "login-bg.png",
  "quality-control-bg.png",
  "customer1.png",
  "driver1.png",
  "store1.png",
];

async function compress() {
  console.log("Starting image compression...");
  for (const filename of imagesToCompress) {
    const inputPath = path.join(assetsDir, filename);
    if (!fs.existsSync(inputPath)) continue;

    const webpFilename = filename.replace(/\.png$/, ".webp");
    const outputPath = path.join(assetsDir, webpFilename);

    const initialSize = fs.statSync(inputPath).size;

    await sharp(inputPath)
      .webp({ quality: 82, effort: 5 })
      .toFile(outputPath);

    const finalSize = fs.statSync(outputPath).size;
    const savings = (((initialSize - finalSize) / initialSize) * 100).toFixed(1);

    console.log(
      `Converted ${filename} -> ${webpFilename} (${(initialSize / 1024 / 1024).toFixed(2)} MB -> ${(finalSize / 1024 / 1024).toFixed(2)} MB, saved ${savings}%)`
    );
  }
  console.log("Image compression complete!");
}

compress().catch((err) => {
  console.error("Compression error:", err);
  process.exit(1);
});
