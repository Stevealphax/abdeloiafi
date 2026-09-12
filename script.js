document.getElementById("year").textContent = new Date().getFullYear();

// Mobile menu
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

// Rotating hero title
const rots = Array.from(document.querySelectorAll("#rotator .rot"));
if (rots.length > 1 && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  let i = 0;
  setInterval(() => {
    const cur = rots[i];
    i = (i + 1) % rots.length;
    const next = rots[i];
    cur.classList.remove("is-active");
    cur.classList.add("is-leaving");
    next.classList.add("is-active");
    setTimeout(() => cur.classList.remove("is-leaving"), 600);
  }, 2800);
}

// Reveal on scroll
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        en.target.classList.add("in");
        io.unobserve(en.target);
      }
    });
  },
  { threshold: 0.1 }
);
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
