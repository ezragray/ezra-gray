async function buildFeed() {
  const feed       = document.getElementById("feed");
  const emptyState = document.getElementById("empty-state");

  let items = [];
  try {
    const res = await fetch("manifest.json", { cache: "no-store" });
    if (!res.ok) throw new Error("manifest missing");
    items = await res.json();
  } catch (err) {
    console.error("Could not load manifest.json", err);
  }

  if (!items || items.length === 0) {
    emptyState.hidden = false;
    return;
  }

  for (const item of items) {
    // Support both {filename, description} (gallery manager) and plain strings (old format)
    const filename    = item.filename || item;
    const description = item.description || "";

    const frame = document.createElement("div");
    frame.className = "frame";

    const img = document.createElement("img");
    img.src     = `Image/${filename}`;
    img.loading = "lazy";
    img.alt     = description;
    frame.appendChild(img);

    if (description) {
      const cap = document.createElement("p");
      cap.className   = "caption";
      cap.textContent = description;
      frame.appendChild(cap);
    }

    feed.appendChild(frame);
  }

  // Vertical wheel → horizontal scroll
  feed.addEventListener("wheel", e => {
    e.preventDefault();
    feed.scrollLeft += e.deltaY !== 0 ? e.deltaY : e.deltaX;
  }, { passive: false });
}

buildFeed();
