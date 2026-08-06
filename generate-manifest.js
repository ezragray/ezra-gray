const fs   = require("fs");
const path = require("path");

const IMAGE_DIR = "Image";
const MANIFEST  = "manifest.json";

// Load existing manifest so we can preserve any descriptions already written
let existing = [];
try {
  existing = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
} catch {}

// Build a lookup: filename → description
const saved = {};
for (const item of existing) {
  if (item && item.filename) saved[item.filename] = item.description || "";
}

// Scan the Image folder, sort numerically by leading number
const exts = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);
const files = fs.readdirSync(IMAGE_DIR)
  .filter(f => exts.has(path.extname(f).toLowerCase()))
  .sort((a, b) => {
    const na = parseFloat(a);
    const nb = parseFloat(b);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    return a.localeCompare(b);
  });

// Build new manifest, carrying over any description that was already there
const manifest = files.map(filename => ({
  filename,
  description: saved[filename] || ""
}));

fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
console.log(`manifest.json written — ${manifest.length} images`);
