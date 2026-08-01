async function buildFeed() {
  const feed       = document.getElementById("feed");
  const emptyState = document.getElementById("empty-state");

  let files = [];
  try {
    const res = await fetch("manifest.json", { cache: "no-store" });
    if (!res.ok) throw new Error("manifest missing");
    files = await res.json();
  } catch (err) {
    console.error("Could not load manifest.json", err);
  }

  if (!files || files.length === 0) {
    emptyState.hidden = false;
    return;
  }

  for (const file of files) {
    const frame = document.createElement("div");
    frame.className = "frame";

    const img = document.createElement("img");
    img.src     = `Image/${file}`;
    img.loading = "lazy";
    img.alt     = "";

    frame.appendChild(img);
    feed.appendChild(frame);
  }

  // Vertical wheel → horizontal scroll
  feed.addEventListener("wheel", e => {
    e.preventDefault();
    feed.scrollLeft += e.deltaY !== 0 ? e.deltaY : e.deltaX;
  }, { passive: false });
}

buildFeed();
