document.getElementById("year").textContent = new Date().getFullYear();

const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------- Mobile menu ----------
const burger = document.getElementById("burger");
const navLinks = document.getElementById("navLinks");
burger.addEventListener("click", () => {
  const open = navLinks.classList.toggle("open");
  burger.classList.toggle("open", open);
  burger.setAttribute("aria-expanded", String(open));
  document.body.style.overflow = open ? "hidden" : "";
});
navLinks.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => {
    navLinks.classList.remove("open");
    burger.classList.remove("open");
    document.body.style.overflow = "";
  })
);

// ---------- Floating nav: hide on scroll down, show on scroll up ----------
const navWrap = document.querySelector(".nav-wrap");
let lastY = window.scrollY;
let ticking = false;
window.addEventListener(
  "scroll",
  () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      const goingDown = y > lastY + 4;
      const goingUp = y < lastY - 4;
      if (goingDown && y > 140 && !navLinks.classList.contains("open")) navWrap.classList.add("nav-hidden");
      else if (goingUp || y <= 140) navWrap.classList.remove("nav-hidden");
      lastY = y;
      ticking = false;
    });
  },
  { passive: true }
);

// ---------- Rotating hero title with decode / scramble effect ----------
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#%&*+=";
const rots = Array.from(document.querySelectorAll("#rotator .rot"));

// Wrap every character in a span (keeping <em> formatting intact)
function splitChars(el) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((node) => {
    const frag = document.createDocumentFragment();
    for (const ch of node.textContent) {
      const s = document.createElement("span");
      s.className = "ch";
      s.textContent = ch;
      s.dataset.ch = ch;
      frag.appendChild(s);
    }
    node.replaceWith(frag);
  });
}

function scrambleIn(el) {
  const chars = el.querySelectorAll(".ch");
  chars.forEach((c, idx) => {
    const final = c.dataset.ch;
    if (final === " " || final === "-") return;
    const frames = 4 + Math.floor(idx * 0.9);
    let n = 0;
    c.classList.add("scr");
    const tick = () => {
      if (n < frames) {
        c.textContent = GLYPHS[(Math.random() * GLYPHS.length) | 0];
        n++;
        setTimeout(tick, 40);
      } else {
        c.textContent = final;
        c.classList.remove("scr");
      }
    };
    tick();
  });
}

if (rots.length > 1 && !reduceMotion) {
  rots.forEach(splitChars);
  let i = 0;
  setInterval(() => {
    const cur = rots[i];
    i = (i + 1) % rots.length;
    const next = rots[i];
    cur.classList.remove("is-active");
    cur.classList.add("is-leaving");
    next.classList.add("is-active");
    scrambleIn(next);
    setTimeout(() => cur.classList.remove("is-leaving"), 400);
  }, 2400);
}

// ---------- Interactive hero: edge-shine flashlight + AI sparkles ----------
(() => {
  const hero = document.querySelector(".hero");
  const stage = document.getElementById("heroStage");
  const strokes = stage && stage.querySelector(".hero-strokes");
  const canvas = document.getElementById("sparkles");
  if (!hero || !stage || !strokes || !canvas || reduceMotion) return;

  const VB_W = 864, VB_H = 1152; // outline viewBox

  // --- flashlight radius scales with the stage size
  const setR = () => strokes.style.setProperty("--r", Math.min(stage.clientWidth, stage.clientHeight) * 0.26 + "px");
  setR();
  addEventListener("resize", setR);

  // --- smoothed cursor for the mask
  let tx = -200, ty = -200, cx = -200, cy = -200, rafS = null;
  const tickS = () => {
    cx += (tx - cx) * 0.25;
    cy += (ty - cy) * 0.25;
    strokes.style.setProperty("--mx", cx + "px");
    strokes.style.setProperty("--my", cy + "px");
    rafS = Math.abs(tx - cx) > 0.3 || Math.abs(ty - cy) > 0.3 ? requestAnimationFrame(tickS) : null;
  };

  // --- sparkles
  const ctx = canvas.getContext("2d");
  const dNums = document.getElementById("sil").getAttribute("d").match(/-?\d+(?:\.\d+)?/g).map(Number);
  const PATH = [];
  for (let i = 0; i + 1 < dNums.length; i += 2) PATH.push([dNums[i], dNums[i + 1]]);

  let width = 0, height = 0;
  let mouseX = -1000, mouseY = -1000, isHovering = false;
  let startTime = null, running = false;
  const initialDelay = 1500, animationDuration = 4000, revealDuration = 1500;
  const REVEAL = 200, EDGE = 58, EDGE_OUT = Math.round(EDGE * 1.2);

  const startLoop = () => { if (!running) { running = true; requestAnimationFrame(animate); } };

  hero.addEventListener("pointermove", (e) => {
    const hr = hero.getBoundingClientRect();
    mouseX = e.clientX - hr.left;
    mouseY = e.clientY - hr.top;
    isHovering = true;
    startLoop();
    // flashlight: active whenever the pointer is over the portrait area
    const sr = stage.getBoundingClientRect();
    const inside = e.clientX >= sr.left && e.clientX <= sr.right && e.clientY >= sr.top && e.clientY <= sr.bottom;
    stage.classList.toggle("is-active", inside);
    if (inside) {
      tx = e.clientX - sr.left;
      ty = e.clientY - sr.top;
      if (!rafS) rafS = requestAnimationFrame(tickS);
    }
  });
  hero.addEventListener("pointerleave", () => {
    isHovering = false;
    stage.classList.remove("is-active");
  });

  function drawSparkle(x, y, r) {
    ctx.beginPath();
    ctx.moveTo(x, y - r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.quadraticCurveTo(x, y, x, y + r);
    ctx.quadraticCurveTo(x, y, x - r, y);
    ctx.quadraticCurveTo(x, y, x, y - r);
    ctx.fill();
  }
  function inPoly(x, y, pts) {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }

  function animate() {
    const dpr = window.devicePixelRatio || 1;
    const w = hero.clientWidth, h = hero.clientHeight;
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      width = w; height = h;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = w + "px"; canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    const elapsed = startTime === null ? Infinity : Date.now() - startTime;
    const introActive = elapsed < animationDuration;
    ctx.clearRect(0, 0, width, height);
    if (!introActive && !isHovering) { running = false; return; }

    // map the outline into hero space (follows the portrait wherever it sits)
    const sr = stage.getBoundingClientRect(), hr = hero.getBoundingClientRect();
    const sx = sr.left - hr.left, sy = sr.top - hr.top, sc = sr.width / VB_W;
    const OL = PATH.map((p) => [sx + p[0] * sc, sy + p[1] * sc]);
    const bbL = sx - EDGE_OUT, bbR = sx + sr.width + EDGE_OUT, bbT = sy - EDGE_OUT, bbB = sy + VB_H * sc + EDGE_OUT;

    const fadeProgress = Math.max(0, 1 - elapsed / animationDuration);
    const globalFade = Math.pow(fadeProgress, 1.5);
    const revealProgress = Math.min(elapsed / revealDuration, 1);
    const easeReveal = 1 - Math.pow(1 - revealProgress, 3);
    const time = Date.now() * 0.0006;

    const spacingX = 14.4, spacingY = 8.4;
    let row = 0;
    for (let y = 0; y < height + 40; y += spacingY) {
      const offsetX = row % 2 === 0 ? 0 : spacingX / 2;
      for (let x = -20; x < width + 40; x += spacingX) {
        const px = x + offsetX;

        let targetHorizon = height * 0.45 + Math.sin(px * 0.003 + time) * 120;
        targetHorizon += Math.cos(px * 0.007 - time * 0.5) * 50;
        const waveHorizon = height - (height - targetHorizon) * easeReveal;
        const introPresence = y > waveHorizon ? Math.min((y - waveHorizon) / 80, 1) * globalFade : 0;

        let cursorRaw = 0, cursorPresence = 0;
        if (isHovering) {
          const dc = Math.hypot(px - mouseX, y - mouseY);
          if (dc < REVEAL) {
            const t = 1 - dc / REVEAL;
            cursorRaw = t * t * (3 - 2 * t);
            if (!(px < bbL || px > bbR || y < bbT || y > bbB)) {
              let md = 1e9;
              for (let k = 0; k < OL.length; k++) {
                const dx = px - OL[k][0], dy = y - OL[k][1];
                const dd = dx * dx + dy * dy;
                if (dd < md) md = dd;
              }
              md = Math.sqrt(md);
              const lim = inPoly(px, y, OL) ? EDGE : EDGE_OUT;
              if (md <= lim) {
                let ef = 1 - md / lim;
                ef = ef * ef * (3 - 2 * ef);
                cursorPresence = cursorRaw * ef;
              }
            }
          }
        }

        const presence = Math.max(introPresence, cursorPresence);
        if (presence <= 0.003) continue;

        const wave1 = Math.sin(px * 0.012 + time);
        const wave2 = Math.cos(y * 0.015 - time * 0.8);
        const wave3 = Math.sin((px - y) * 0.01 + time * 1.2);
        const intensity = Math.pow(((wave1 + wave2 + wave3) / 3 + 1) / 2, 4);
        const radius = (1.4 + intensity * 4.6 + cursorRaw * 3.5) * presence;
        if (radius > 0.4) {
          const op = Math.min(0.4 + intensity * 0.7 + cursorRaw * 0.7, 1) * presence;
          ctx.fillStyle = "rgba(255,255,255," + op + ")";
          drawSparkle(px, y, radius);
        }
      }
      row++;
    }
    requestAnimationFrame(animate);
  }

  setTimeout(() => { startTime = Date.now(); startLoop(); }, initialDelay);
})();

// ---------- Scroll reveals with per-group stagger ----------
document.querySelectorAll("[data-stagger]").forEach((group) => {
  group.querySelectorAll(":scope > .reveal").forEach((el, idx) => {
    el.style.transitionDelay = `${Math.min(idx * 90, 630)}ms`;
  });
});

const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target;
      el.classList.add("in");
      io.unobserve(el);
      // drop the stagger delay once revealed so hover transitions feel instant
      if (el.style.transitionDelay) setTimeout(() => (el.style.transitionDelay = ""), 1400);
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
);
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

// ---------- Copy email button ----------
const copyBtn = document.getElementById("copyEmail");
if (copyBtn) {
  const label = copyBtn.querySelector(".label");
  const email = copyBtn.dataset.email;
  let timer;
  const legacyCopy = (text) => {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;opacity:0;pointer-events:none";
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch { ok = false; }
    ta.remove();
    return ok;
  };
  copyBtn.addEventListener("click", async () => {
    let ok = false;
    try {
      await navigator.clipboard.writeText(email);
      ok = true;
    } catch {
      ok = legacyCopy(email);
    }
    if (!ok) {
      window.location.href = `mailto:${email}`;
      return;
    }
    copyBtn.classList.remove("copied");
    void copyBtn.offsetWidth; // restart the icon animation
    copyBtn.classList.add("copied");
    label.textContent = "Copied to clipboard";
    clearTimeout(timer);
    timer = setTimeout(() => {
      copyBtn.classList.remove("copied");
      label.textContent = email;
    }, 1800);
  });
}
