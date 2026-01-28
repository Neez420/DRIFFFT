/* DRIFFFT site scripts (GSAP) */
(() => {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Footer year
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Mobile nav
  const toggle = document.querySelector(".nav-toggle");
  const panel = document.getElementById("navpanel");
  const nav = document.querySelector(".nav");

  const setNavOpen = (open) => {
    if (!toggle || !panel) return;
    toggle.setAttribute("aria-expanded", String(open));
    if (open) {
      panel.classList.add("open");
      document.documentElement.style.overflow = "hidden";
    } else {
      panel.classList.remove("open");
      document.documentElement.style.overflow = "";
    }
  };

  if (toggle && panel) {
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") === "true";
      setNavOpen(!open);
    });

    panel.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (!a) return;
      setNavOpen(false);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      setNavOpen(false);
    });
  }

  // Small-screen nav styling injected via CSS
  const style = document.createElement("style");
  style.textContent = `
    @media (max-width: 820px){
      .nav-toggle{ display:inline-flex; align-items:center; justify-content:center; }
      .nav-panel{
        position: fixed;
        left: 16px;
        right: 16px;
        top: 76px;
        display: grid;
        gap: 10px;
        padding: 14px;
        border-radius: 22px;
        border: 1px solid rgba(233,236,245,.14);
        background: rgba(10,12,22,.72);
        backdrop-filter: blur(14px);
        box-shadow: 0 18px 60px rgba(0,0,0,.55);
        transform: translateY(-16px);
        opacity: 0;
        pointer-events: none;
      }
      .nav-panel.open{
        opacity: 1;
        transform: translateY(0);
        pointer-events: auto;
      }
      .nav-cta{ margin-left: 0; text-align:center; }
      .nav-link{ padding: 12px 12px; }
    }
  `;
  document.head.appendChild(style);

  // Cursor
  const cursor = document.querySelector(".cursor");
  if (cursor) {
    let active = false;
    window.addEventListener("pointermove", (e) => {
      if (!active) {
        active = true;
        cursor.style.opacity = "1";
      }
      cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    });
  }

  // Tilt cards
  const tiltEls = document.querySelectorAll("[data-tilt]");
  tiltEls.forEach((el) => {
    const strength = 10;
    let raf = 0;

    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      const rotY = (px - 0.5) * strength;
      const rotX = -(py - 0.5) * strength;

      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-2px)`;
      });
    };

    const onLeave = () => {
      cancelAnimationFrame(raf);
      el.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg) translateY(0px)";
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
  });

  // Manual card flip button
  const cardInner = document.querySelector(".card-3d-inner");
  const flipBtn = document.getElementById("toggleCard");
  if (flipBtn) {
    flipBtn.addEventListener("click", () => {
      if (!window.gsap || prefersReduced || !cardInner) return;
      const isFlipped = cardInner.dataset.flipped === "true";
      cardInner.dataset.flipped = isFlipped ? "false" : "true";
      gsap.to(cardInner, { rotateY: isFlipped ? 0 : 180, duration: 0.8, ease: "power3.out" });
    });
  }

  if (!window.gsap || prefersReduced) return;
  gsap.registerPlugin(ScrollTrigger);

  // Marquee
  const marqueeTrack = document.querySelector(".marquee-track");
  if (marqueeTrack) {
    const distance = marqueeTrack.scrollWidth / 2;
    gsap.to(marqueeTrack, { x: -distance, duration: 18, ease: "none", repeat: -1 });
  }

  // Intro
  gsap.timeline({ defaults: { ease: "power3.out" } })
    .from(".nav", { y: -14, opacity: 0, duration: 0.7 }, 0)
    .from(".hero-kicker .pill", { y: 10, opacity: 0, stagger: 0.08, duration: 0.6 }, 0.1)
    .from(".hero-title", { y: 22, opacity: 0, duration: 0.8 }, 0.15)
    .from(".hero-sub", { y: 16, opacity: 0, duration: 0.7 }, 0.25)
    .from(".hero-actions .btn", { y: 14, opacity: 0, stagger: 0.09, duration: 0.6 }, 0.32);

  // Orbs
  gsap.to(".orb-a", { x: 40, y: -20, duration: 10, repeat: -1, yoyo: true, ease: "sine.inOut" });
  gsap.to(".orb-b", { x: -30, y: 30, duration: 12, repeat: -1, yoyo: true, ease: "sine.inOut" });
  gsap.to(".orb-c", { x: 20, y: 30, duration: 14, repeat: -1, yoyo: true, ease: "sine.inOut" });

  // Hero art scroll flip
  if (cardInner) {
    gsap.set(cardInner, { rotateY: -8, rotateX: 8 });
    gsap.to(cardInner, {
      rotateY: 180,
      rotateX: 0,
      scrollTrigger: {
        trigger: "#products",
        start: "top 80%",
        end: "top 20%",
        scrub: true
      }
    });
  }

  // Rings pulse
  gsap.to(".ring", {
    scale: 1.06,
    opacity: 0.15,
    duration: 3.6,
    yoyo: true,
    repeat: -1,
    ease: "sine.inOut",
    stagger: 0.2
  });

  // Products reveal
  gsap.from(".section-head", {
    y: 18,
    opacity: 0,
    duration: 0.8,
    ease: "power3.out",
    scrollTrigger: { trigger: ".section-head", start: "top 80%" }
  });
  gsap.from(".product-card", {
    y: 18,
    opacity: 0,
    stagger: 0.12,
    duration: 0.85,
    ease: "power3.out",
    scrollTrigger: { trigger: ".grid-2", start: "top 80%" }
  });

  // Nav background on scroll
  ScrollTrigger.create({
    start: 10,
    onUpdate: (self) => {
      const s = self.scroll();
      if (!nav) return;
      nav.style.background = s > 24 ? "rgba(10,12,22,.62)" : "rgba(10,12,22,.45)";
    }
  });

  window.addEventListener("load", () => ScrollTrigger.refresh());
})();
