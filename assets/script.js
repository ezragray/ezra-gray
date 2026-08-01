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

  initSlideshow(feed);
}

function initSlideshow(feed) {
  const frames = Array.from(feed.querySelectorAll(".frame"));
  if (!frames.length) return;

  let current   = 0;
  let animating = false;

  frames[0].classList.add("active");

  function go(delta) {
    if (animating) return;
    const next = current + delta;
    if (next < 0 || next >= frames.length) return;

    animating = true;
    const forward  = delta > 0;
    const outFrame = frames[current];
    const inFrame  = frames[next];

    // ── Incoming image ─────────────────────────────────────────
    // Starts slightly behind and dim, eases forward
    inFrame.style.transition = "none";
    inFrame.style.transform  = "scale(0.97)";
    inFrame.style.opacity    = "0.6";
    inFrame.classList.add("active");
    inFrame.offsetHeight; // force reflow

    inFrame.style.transition = "transform 500ms cubic-bezier(0.25,0.46,0.45,0.94), opacity 500ms ease";
    inFrame.style.transform  = "scale(1)";
    inFrame.style.opacity    = "1";

    // ── Outgoing image: paper peel ─────────────────────────────
    // Organic variation each time
    const rot    = (7 + Math.random() * 7) * (forward ? 1 : -1);   // 7–14°
    const xPct   = forward ? 115 : -115;
    const yPct   = (Math.random() * 12 - 4);                         // -4% to +8%
    const skewX  = forward ? -4 : 4;                                  // leading edge bends back

    const img = outFrame.querySelector("img");

    // Phase 1 — subtle lift off the wall (80ms)
    // Shadow deepens, tiny rotate, barely perceptible scale-up
    outFrame.style.transition    = "transform 80ms ease-out";
    img.style.transition         = "box-shadow 80ms ease-out";
    outFrame.style.transform     = `scale(1.015) rotate(${rot * 0.12}deg)`;
    img.style.boxShadow          = "0 12px 40px rgba(0,0,0,0.22)";
    outFrame.style.transformOrigin = forward ? "30% 65%" : "70% 35%";

    // Phase 2 — drift & tumble (540ms, ease-in so it accelerates away)
    setTimeout(() => {
      outFrame.style.transition = "transform 540ms cubic-bezier(0.4, 0, 0.9, 0.6), opacity 540ms ease-in";
      outFrame.style.transform  =
        `translateX(${xPct}%) translateY(${yPct}%) rotate(${rot}deg) skewX(${skewX}deg) scale(0.88)`;
      outFrame.style.opacity    = "0";
    }, 80);

    // ── Cleanup ────────────────────────────────────────────────
    setTimeout(() => {
      outFrame.classList.remove("active");
      outFrame.style.cssText        = "";
      img.style.cssText             = "";
      inFrame.style.transition      = "";
      inFrame.style.transform       = "";
      inFrame.style.opacity         = "";
      current   = next;
      animating = false;
    }, 640);
  }

  // ── Input: wheel / trackpad ────────────────────────────────────
  // Down or Right = forward (next image); Up or Left = back
  let cooldown = false;
  window.addEventListener("wheel", e => {
    e.preventDefault();
    if (cooldown) return;
    const d = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    if (Math.abs(d) < 2) return;
    go(d > 0 ? 1 : -1);
    cooldown = true;
    setTimeout(() => cooldown = false, 700);
  }, { passive: false });

  // ── Input: keyboard ────────────────────────────────────────────
  window.addEventListener("keydown", e => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") go(1);
    if (e.key === "ArrowLeft"  || e.key === "ArrowUp")   go(-1);
  });

  // ── Input: touch swipe ─────────────────────────────────────────
  let tx = null, ty = null;
  window.addEventListener("touchstart", e => {
    tx = e.touches[0].clientX;
    ty = e.touches[0].clientY;
  }, { passive: true });
  window.addEventListener("touchend", e => {
    if (tx === null) return;
    const dx   = e.changedTouches[0].clientX - tx;
    const dy   = e.changedTouches[0].clientY - ty;
    const axis = Math.abs(dx) >= Math.abs(dy) ? dx : dy;
    if (Math.abs(axis) > 40) go(axis < 0 ? 1 : -1);
    tx = ty = null;
  });
}

buildFeed();
