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
