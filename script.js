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

  // Marquee
  const marqueeTrack = document.querySelector(".marquee-track");
  if (marqueeTrack) {
    // Store the original content so we can rebuild on resize
    const baseContent = marqueeTrack.innerHTML;
    let baseWidth = 0;
    let marqueeTween;
    let wrapX;

    const buildMarquee = () => {
      marqueeTrack.innerHTML = baseContent;
      marqueeTrack.style.transform = "translateX(0)";
      // Measure width of a single cycle
      baseWidth = marqueeTrack.scrollWidth;
      // Duplicate until we have at least 2x viewport width to avoid visible gaps
      while (marqueeTrack.scrollWidth < window.innerWidth * 2) {
        marqueeTrack.innerHTML += baseContent;
      }
      wrapX = gsap.utils.wrap(-baseWidth, 0);
    };

    const playMarquee = () => {
      if (marqueeTween) marqueeTween.kill();
      marqueeTween = gsap.to(marqueeTrack, {
        x: -baseWidth,
        duration: 18,
        ease: "none",
        repeat: -1,
        modifiers: {
          x: (x) => `${wrapX(parseFloat(x))}px`
        }
      });
    };

    buildMarquee();
    playMarquee();
    window.addEventListener("resize", () => {
      buildMarquee();
      playMarquee();
    });
  }

  // Scroll hint: center on load, fade after 1s or on scroll
  const scrollHint = document.querySelector(".scroll-hint");
  if (scrollHint) {
    gsap.set(scrollHint, { opacity: 1, scale: 1 });
    gsap.to(scrollHint, { opacity: 0, scale: 0.92, duration: 0.35, delay: 1, ease: "power2.out" });
    ScrollTrigger.create({
      trigger: ".hero",
      start: "top top",
      end: "bottom top",
      onEnter: () => gsap.to(scrollHint, { opacity: 0, scale: 0.92, duration: 0.2, ease: "power2.out" }),
      onUpdate: () => gsap.to(scrollHint, { opacity: 0, scale: 0.92, duration: 0.2, ease: "power2.out" })
    });
  }

  // Hero art + text reveal on scroll (pinned, sequential)
  const heroArt = document.querySelector(".hero-art");
  const heroInner = document.querySelector(".hero-inner");
  const title = document.querySelector(".hero-title");
  const sub = document.querySelector(".hero-sub");

  if (heroArt) gsap.set(heroArt, { left: "50%", right: "auto", xPercent: -50, scale: 1.45, y: -60 });
  if (title) gsap.set(title, { opacity: 0, yPercent: 60 });
  if (sub) gsap.set(sub, { opacity: 0, yPercent: 80 });

  if (heroArt || title || sub) {
    const heroScrollTl = gsap.timeline({
      scrollTrigger: {
        trigger: ".hero",
        start: "top center",
        end: "bottom top",
        scrub: true
      }
    });

    heroScrollTl
      .to(heroArt || {}, { scale: 1, y: 0, ease: "power2.out" }, 0)
      .to(title || {}, { opacity: 1, yPercent: 0, ease: "power2.out" }, 0.1)
      .to(sub || {}, { opacity: 1, yPercent: 0, ease: "power2.out" }, 0.25);
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
