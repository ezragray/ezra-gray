(function () {
  // Folder the images live in (relative to index.html). Change if yours differs.
  var IMAGE_DIR = 'Image/';

  var feed = document.getElementById('feed');
  var empty = document.getElementById('empty-state');
  var box = document.getElementById('lightbox');
  var boxImg = document.getElementById('lightbox-img');
  var boxCap = document.getElementById('lightbox-caption');
  var closeBtn = document.getElementById('lightbox-close');

  /* ---------- Load the feed ---------- */
  fetch('manifest.json', { cache: 'no-cache' })
    .then(function (r) { return r.json(); })
    .then(function (items) {
      if (!items || !items.length) { empty.hidden = false; return; }
      items.forEach(function (it) {
        var src = IMAGE_DIR + it.filename;
        var fig = document.createElement('div');
        fig.className = 'item';

        var img = document.createElement('img');
        img.src = src;
        img.alt = it.description || '';
        img.loading = 'lazy';
        img.decoding = 'async';
        fig.appendChild(img);

        if (it.description) {
          var cap = document.createElement('p');
          cap.className = 'caption';
          cap.textContent = it.description.replace(/,\s*$/, '');
          fig.appendChild(cap);
        }

        fig.addEventListener('click', function () { openBox(src, it.description || ''); });
        feed.appendChild(fig);
      });
    })
    .catch(function () { empty.hidden = false; });

  /* ---------- Lightbox with pinch / pan / wheel zoom ---------- */
  var MAX_SCALE = 6;
  var scale = 1, tx = 0, ty = 0;
  var pointers = new Map();
  var gesture = null;
  var lastTap = { t: 0, x: 0, y: 0 };

  function apply() {
    boxImg.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + scale + ')';
    box.classList.toggle('zoomed', scale > 1.01);
  }

  function clampPan() {
    var w = boxImg.offsetWidth * scale;
    var h = boxImg.offsetHeight * scale;
    var mx = Math.max(0, (w - window.innerWidth) / 2);
    var my = Math.max(0, (h - window.innerHeight) / 2);
    tx = Math.min(mx, Math.max(-mx, tx));
    ty = Math.min(my, Math.max(-my, ty));
  }

  function reset() { scale = 1; tx = 0; ty = 0; apply(); }

  function openBox(src, desc) {
    boxImg.src = src;
    boxImg.alt = desc;
    boxCap.textContent = desc.replace(/,\s*$/, '');
    reset();
    box.hidden = false;
    document.body.classList.add('lightbox-open');
  }

  function closeBox() {
    box.hidden = true;
    document.body.classList.remove('lightbox-open');
    pointers.clear();
    gesture = null;
    boxImg.removeAttribute('src');
  }

  // Zoom to newScale keeping the screen point (px, py) fixed.
  function zoomAt(px, py, newScale) {
    var cx = window.innerWidth / 2, cy = window.innerHeight / 2;
    newScale = Math.min(MAX_SCALE, Math.max(1, newScale));
    var ix = (px - cx - tx) / scale;
    var iy = (py - cy - ty) / scale;
    scale = newScale;
    tx = px - cx - ix * scale;
    ty = py - cy - iy * scale;
    clampPan();
    apply();
  }

  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
  function mid(a, b) { return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; }

  function startGesture() {
    var pts = Array.from(pointers.values());
    if (pts.length >= 2) {
      var m = mid(pts[0], pts[1]);
      gesture = { type: 'pinch', d: dist(pts[0], pts[1]), mid: m, scale: scale, tx: tx, ty: ty };
    } else if (pts.length === 1) {
      gesture = { type: 'pan', x: pts[0].x, y: pts[0].y, tx: tx, ty: ty,
                  startX: pts[0].x, startY: pts[0].y, t: Date.now(), moved: false };
    } else {
      gesture = null;
    }
  }

  box.addEventListener('pointerdown', function (e) {
    if (e.target === closeBtn || closeBtn.contains(e.target)) return;
    box.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    startGesture();
  });

  box.addEventListener('pointermove', function (e) {
    if (!pointers.has(e.pointerId) || !gesture) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    var pts = Array.from(pointers.values());

    if (gesture.type === 'pinch' && pts.length >= 2) {
      var m = mid(pts[0], pts[1]);
      var ns = Math.min(MAX_SCALE, Math.max(1, gesture.scale * dist(pts[0], pts[1]) / gesture.d));
      var cx = window.innerWidth / 2, cy = window.innerHeight / 2;
      var ix = (gesture.mid.x - cx - gesture.tx) / gesture.scale;
      var iy = (gesture.mid.y - cy - gesture.ty) / gesture.scale;
      scale = ns;
      tx = m.x - cx - ix * ns;
      ty = m.y - cy - iy * ns;
      clampPan();
      apply();
    } else if (gesture.type === 'pan') {
      var dx = e.clientX - gesture.x, dy = e.clientY - gesture.y;
      if (Math.hypot(e.clientX - gesture.startX, e.clientY - gesture.startY) > 8) gesture.moved = true;
      if (scale > 1) {
        tx = gesture.tx + dx;
        ty = gesture.ty + dy;
        clampPan();
        apply();
      }
    }
  });

  function endPointer(e) {
    if (!pointers.has(e.pointerId)) return;
    var g = gesture;
    pointers.delete(e.pointerId);

    // A quick, still, single-finger release counts as a tap.
    if (g && g.type === 'pan' && !g.moved && Date.now() - g.t < 350 && e.type === 'pointerup') {
      handleTap(e);
    }
    startGesture();
  }
  box.addEventListener('pointerup', endPointer);
  box.addEventListener('pointercancel', endPointer);

  function handleTap(e) {
    var now = Date.now();
    var isDouble = now - lastTap.t < 320 && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 30;
    lastTap = { t: now, x: e.clientX, y: e.clientY };

    if (isDouble) {
      lastTap.t = 0;
      if (scale > 1.01) { reset(); } else { zoomAt(e.clientX, e.clientY, 2.5); }
      return;
    }
    // Single tap on the black background (not the picture) while not zoomed closes.
    if (scale <= 1.01 && e.target === box) {
      var t = lastTap.t;
      setTimeout(function () {
        if (lastTap.t === t && !box.hidden) closeBox();
      }, 330);
    }
  }

  // Mouse wheel / trackpad pinch
  box.addEventListener('wheel', function (e) {
    e.preventDefault();
    var f = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015));
    zoomAt(e.clientX, e.clientY, scale * f);
  }, { passive: false });

  // Safari trackpad pinch gestures, and stop iOS page zoom behind the viewer
  box.addEventListener('gesturestart', function (e) { e.preventDefault(); });

  closeBtn.addEventListener('click', closeBox);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !box.hidden) closeBox();
  });
  window.addEventListener('resize', function () { if (!box.hidden) { clampPan(); apply(); } });
})();
