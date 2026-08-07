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
    const filename    = item.filename || item;
    const description = item.description || "";

    const frame = document.createElement("div");
    frame.className = "frame";

    // Wrapper so caption width tracks image width
    const wrap = document.createElement("div");
    wrap.className = "img-wrap";

    const img = document.createElement("img");
    img.src     = `Image/${filename}`;
    img.loading = "lazy";
    img.alt     = description;
    wrap.appendChild(img);

    if (description) {
      const cap = document.createElement("p");
      cap.className   = "caption";
      cap.textContent = description;
      wrap.appendChild(cap);
    }

    frame.appendChild(wrap);
    feed.appendChild(frame);
  }

  // Vertical wheel → horizontal scroll
  feed.addEventListener("wheel", e => {
    e.preventDefault();
    feed.scrollLeft += e.deltaY !== 0 ? e.deltaY : e.deltaX;
  }, { passive: false });
}

buildFeed();
