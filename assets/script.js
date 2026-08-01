const GROUP = 5; // direction flips every this many images

async function buildFeed() {
  const feed = document.getElementById("feed");
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
    img.src = `Image/${file}`;
    img.loading = "lazy";
    img.alt = "";

    frame.appendChild(img);
    feed.appendChild(frame);
  }

  initSlideshow(feed);
}

function initSlideshow(feed) {
  const frames = Array.from(feed.querySelectorAll(".frame"));
  if (!frames.length) return;

  let current = 0;
  let animating = false;

  frames[0].classList.add("active");

  // "h" = slides left/right, "v" = slides up/down
  // determined by which group of 5 the destination image is in
  function axis(index) {
    return Math.floor(index / GROUP) % 2 === 0 ? "h" : "v";
  }

  function go(delta) {
    if (animating) return;
    const next = current + delta;
    if (next < 0 || next >= frames.length) return;

    animating = true;
    const forward = delta > 0;
    const ax = axis(next);

    const outFrame = frames[current];
    const inFrame  = frames[next];

    // Place incoming frame just off-screen (no transition yet)
    inFrame.style.transition = "none";
    inFrame.style.transform  = forward
      ? (ax === "h" ? "translateX(100%)" : "translateY(100%)")
      : (ax === "h" ? "translateX(-100%)" : "translateY(-100%)");
    inFrame.classList.add("active");

    inFrame.offsetHeight; // force reflow

    const ease = "transform 0.52s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
    inFrame.style.transition  = ease;
    outFrame.style.transition = ease;

    inFrame.style.transform  = "translate(0, 0)";
    outFrame.style.transform = forward
      ? (ax === "h" ? "translateX(-100%)" : "translateY(-100%)")
      : (ax === "h" ? "translateX(100%)" : "translateY(100%)");

    setTimeout(() => {
      outFrame.classList.remove("active");
      outFrame.style.transform  = "";
      outFrame.style.transition = "";
      inFrame.style.transition  = "";
      current    = next;
      animating  = false;
    }, 540);
  }

  // ── Wheel / trackpad ────────────────────────────────────────────
  // Down or Right = forward; Up or Left = back.
  // Cooldown prevents one swipe gesture triggering multiple slides.
  let wheelCooldown = false;
  window.addEventListener("wheel", e => {
    e.preventDefault();
    if (wheelCooldown) return;
    // Use whichever axis has more movement
    const d = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    if (Math.abs(d) < 2) return;
    go(d > 0 ? 1 : -1);
    wheelCooldown = true;
    setTimeout(() => wheelCooldown = false, 600);
  }, { passive: false });

  // ── Keyboard ────────────────────────────────────────────────────
  window.addEventListener("keydown", e => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown")  go(1);
    if (e.key === "ArrowLeft"  || e.key === "ArrowUp")    go(-1);
  });

  // ── Touch swipe ─────────────────────────────────────────────────
  let tx = null, ty = null;
  window.addEventListener("touchstart", e => {
    tx = e.touches[0].clientX;
    ty = e.touches[0].clientY;
  }, { passive: true });
  window.addEventListener("touchend", e => {
    if (tx === null) return;
    const dx = e.changedTouches[0].clientX - tx;
    const dy = e.changedTouches[0].clientY - ty;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    } else {
      if (Math.abs(dy) > 40) go(dy < 0 ? 1 : -1);
    }
    tx = ty = null;
  });
}

buildFeed();
