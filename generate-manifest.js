const fs   = require("fs");
const path = require("path");

const IMAGE_DIR = "Image";
const MANIFEST  = "manifest.json";

// Preserve any descriptions already in the manifest
let existing = [];
try { existing = JSON.parse(fs.readFileSync(MANIFEST, "utf8")); } catch {}
const saved = {};
for (const item of existing) {
  if (item && item.filename) saved[item.filename] = item.description || "";
}

// Extract the first number from a filename for sorting
function leadingNum(f) {
  const m = f.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : Infinity;
}

const exts = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);
const files = fs.readdirSync(IMAGE_DIR)
  .filter(f => exts.has(path.extname(f).toLowerCase()))
  .sort((a, b) => leadingNum(a) - leadingNum(b));

const manifest = files.map(filename => ({
  filename,
  description: saved[filename] || ""
}));

fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
console.log(`manifest.json written — ${manifest.length} images`);
