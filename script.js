/* DRIFFFT site scripts (GSAP) */
(() => {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Footer year
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

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

  if (!window.gsap || prefersReduced) return;
  gsap.registerPlugin(ScrollTrigger);

  // Scroll hint: center on load, fade after 1s or on scroll
  const scrollHint = document.querySelector(".scroll-hint");
  if (scrollHint) {
    gsap.set(scrollHint, { opacity: 1, scale: 1 });
    gsap.to(scrollHint, { opacity: 0, scale: 0.92, duration: 0.35, delay: 1, ease: "power2.out" });
    window.addEventListener("scroll", () => {
      scrollHint.style.opacity = "0";
      scrollHint.style.transform = "scale(0.92)";
    }, { once: true, passive: true });
  }

  // Hero art + text reveal on scroll (pinned, sequential)
  const heroArt = document.querySelector(".hero-art");
  const heroInner = document.querySelector(".hero-inner");
  const title = document.querySelector(".hero-title");
  const sub = document.querySelector(".hero-sub");

  if (heroArt) gsap.set(heroArt, { left: "50%", right: "auto", xPercent: -50, scale: 1.28, y: -30 });
  if (title) gsap.set(title, { opacity: 0, yPercent: 80 });
  if (sub) gsap.set(sub, { opacity: 0, yPercent: 100 });

  if (heroArt || title || sub) {
    const heroScrollTl = gsap.timeline({
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "+=95%",
        scrub: 0.45,
        pin: true,
        pinSpacing: true,
        anticipatePin: 0.8
      }
    });

    heroScrollTl
      .to(heroArt || {}, { scale: 1, y: 0, ease: "power2.out" }, 0)
      .to(title || {}, { opacity: 1, yPercent: 0, ease: "power2.out" }, 0.18)
      .to(sub || {}, { opacity: 1, yPercent: 0, ease: "power2.out" }, 0.38);
  }

  // Orbs
  gsap.to(".orb-a", { x: 40, y: -20, duration: 10, repeat: -1, yoyo: true, ease: "sine.inOut" });
  gsap.to(".orb-b", { x: -30, y: 30, duration: 12, repeat: -1, yoyo: true, ease: "sine.inOut" });
  gsap.to(".orb-c", { x: 20, y: 30, duration: 14, repeat: -1, yoyo: true, ease: "sine.inOut" });

  // Hero art scroll flip
  // Particles
  const canvas = document.getElementById("hero-particles");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    let particles = [];
    let width, height;

    const resize = () => {
      width = canvas.width = canvas.parentElement.offsetWidth;
      height = canvas.height = canvas.parentElement.offsetHeight;
    };
    window.addEventListener("resize", resize);
    resize();

    const createParticles = () => {
      particles = [];
      const count = width < 600 ? 40 : 80;
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          s: Math.random() * 2 + 1, // size
          v: Math.random() * 0.4 + 0.1, // velocity
          a: Math.random() * 0.5 + 0.2 // alpha
        });
      }
    };
    createParticles();

    const animateParticles = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#0047FF";

      particles.forEach(p => {
        p.y -= p.v;
        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        ctx.globalAlpha = p.a;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
        ctx.fill();
      });
      requestAnimationFrame(animateParticles);
    };
    animateParticles();
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

  // Section reveals
  gsap.from(".section-head", {
    y: 18,
    opacity: 0,
    duration: 0.8,
    ease: "power3.out",
    scrollTrigger: { trigger: ".section-head", start: "top 80%" }
  });
  gsap.from(".work-item", {
    y: 18,
    opacity: 0,
    stagger: 0.12,
    duration: 0.85,
    ease: "power3.out",
    scrollTrigger: { trigger: ".work-list", start: "top 80%" }
  });

  window.addEventListener("load", () => ScrollTrigger.refresh());
})();
