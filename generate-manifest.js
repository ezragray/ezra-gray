// generate-manifest.js
// Scans ./Image and writes manifest.json — a numerically ordered list of filenames.
// Run automatically by your host's build step (see netlify.toml / vercel.json / .github/workflows).
// You never need to run this by hand or edit it: just add or swap files in Image/.

const fs = require("fs");
const path = require("path");

const IMAGE_DIR = path.join(__dirname, "Image");
const OUT_FILE = path.join(__dirname, "manifest.json");
const VALID_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

function leadingNumber(filename) {
  const match = filename.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function naturalCompare(a, b) {
  const numA = leadingNumber(a);
  const numB = leadingNumber(b);

  if (numA !== null && numB !== null && numA !== numB) {
    return numA - numB;
  }
  if (numA !== null && numB === null) return -1;
  if (numA === null && numB !== null) return 1;

  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

function main() {
  let files = [];

  if (fs.existsSync(IMAGE_DIR)) {
    files = fs
      .readdirSync(IMAGE_DIR)
      .filter((f) => !f.startsWith("."))
      .filter((f) => VALID_EXT.has(path.extname(f).toLowerCase()));
  } else {
    console.warn(`No Image/ folder found at ${IMAGE_DIR} — manifest will be empty.`);
  }

  files.sort(naturalCompare);

  fs.writeFileSync(OUT_FILE, JSON.stringify(files, null, 2));
  console.log(`manifest.json written with ${files.length} file(s).`);
}

main();
