/* DRIFFFT site scripts */
(() => {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canUseGsap = Boolean(window.gsap);
  const canUseScrollTrigger = Boolean(window.gsap && window.ScrollTrigger && !prefersReduced);

  if (canUseScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
  }

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

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

  const driftWord = document.querySelector(".drift-word");
  const workSection = document.getElementById("work");

  let allowAutoScroll = true;
  const stopAutoScroll = () => {
    allowAutoScroll = false;
  };

  window.addEventListener("wheel", stopAutoScroll, { once: true, passive: true });
  window.addEventListener("touchstart", stopAutoScroll, { once: true, passive: true });
  window.addEventListener("keydown", stopAutoScroll, { once: true });

  const autoScrollToWork = (delay) => {
    if (!workSection) return;
    window.setTimeout(() => {
      if (!allowAutoScroll) return;
      workSection.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "start" });
    }, delay);
  };

  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp01 = (t) => Math.min(1, Math.max(0, t));
  const easeOutExpo = (t) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t));

  const setupParticleWord = () => {
    if (!driftWord) return null;

    const ctxCanvas = document.createElement("canvas");
    ctxCanvas.className = "drift-particle-canvas";
    ctxCanvas.setAttribute("aria-hidden", "true");

    const ctx = ctxCanvas.getContext("2d", { alpha: true });
    if (!ctx) return null;

    const offscreen = document.createElement("canvas");
    const offCtx = offscreen.getContext("2d", { alpha: true });
    if (!offCtx) return null;

    driftWord.appendChild(ctxCanvas);
    driftWord.classList.add("particle-mode");

    const letterSpans = Array.from(driftWord.querySelectorAll(":scope > span"));
    const state = {
      intro: canUseGsap && !prefersReduced ? 0 : 1,
      scatter: 0
    };

    const palette = [
      [214, 238, 255],
      [160, 214, 255],
      [118, 176, 255],
      [94, 152, 255],
      [255, 120, 140]
    ];

    let particles = [];
    let cssWidth = 0;
    let cssHeight = 0;
    let dpr = window.devicePixelRatio || 1;
    let rafId = 0;

    const rand = (min, max) => min + Math.random() * (max - min);

    const buildParticles = () => {
      const rect = driftWord.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      cssWidth = rect.width;
      cssHeight = rect.height;
      dpr = window.devicePixelRatio || 1;

      ctxCanvas.width = Math.max(1, Math.round(cssWidth * dpr));
      ctxCanvas.height = Math.max(1, Math.round(cssHeight * dpr));
      offscreen.width = ctxCanvas.width;
      offscreen.height = ctxCanvas.height;

      offCtx.clearRect(0, 0, offscreen.width, offscreen.height);
      offCtx.fillStyle = "#ffffff";
      offCtx.textAlign = "center";
      offCtx.textBaseline = "middle";

      letterSpans.forEach((span) => {
        const char = (span.textContent || "").trim();
        if (!char) return;

        const spanRect = span.getBoundingClientRect();
        const x = (spanRect.left - rect.left + spanRect.width / 2) * dpr;
        const y = (spanRect.top - rect.top + spanRect.height / 2) * dpr;
        const fontSize = Math.max(10, spanRect.height * 0.9) * dpr;

        offCtx.font = `800 ${fontSize}px Inter, system-ui, -apple-system, Segoe UI, sans-serif`;
        offCtx.fillText(char, x, y);
      });

      const { data, width, height } = offCtx.getImageData(0, 0, offscreen.width, offscreen.height);
      const step = Math.max(2, Math.floor((cssWidth < 520 ? 5 : 4) * dpr));
      const built = [];
      const centerX = cssWidth / 2;
      const centerY = cssHeight / 2;

      for (let y = 0; y < height; y += step) {
        for (let x = 0; x < width; x += step) {
          const alpha = data[(y * width + x) * 4 + 3];
          if (alpha < 35) continue;

          const homeX = x / dpr;
          const homeY = y / dpr;
          const nx = (homeX - centerX) / Math.max(1, centerX);
          const ny = (homeY - centerY) / Math.max(1, centerY);

          const scatterX = homeX
            + nx * rand(cssWidth * 0.2, cssWidth * 0.7)
            + rand(-cssWidth * 0.25, cssWidth * 0.25);
          const scatterY = homeY
            + ny * rand(cssHeight * 0.2, cssHeight * 1.1)
            + rand(-cssHeight * 0.9, cssHeight * 0.9);

          const base = palette[(Math.random() * palette.length) | 0];

          built.push({
            homeX,
            homeY,
            startX: homeX + rand(-cssWidth * 1.2, cssWidth * 1.2),
            startY: homeY + rand(-cssHeight * 1.4, cssHeight * 1.4),
            startZ: rand(-760, 520),
            scatterX,
            scatterY,
            scatterZ: rand(-1200, 1200),
            alpha: rand(0.45, 0.95),
            size: rand(0.9, 2.2),
            r: base[0],
            g: base[1],
            b: base[2]
          });
        }
      }

      const maxParticles = cssWidth < 640 ? 1800 : 2800;
      if (built.length > maxParticles) {
        const stride = Math.ceil(built.length / maxParticles);
        particles = built.filter((_, i) => i % stride === 0);
      } else {
        particles = built;
      }
    };

    const render = () => {
      const w = ctxCanvas.width;
      const h = ctxCanvas.height;
      if (!w || !h) {
        rafId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, w, h);

      const intro = easeOutExpo(clamp01(state.intro));
      const scatter = clamp01(state.scatter);
      const explode = Math.min(1, scatter * 1.55);
      const fade = Math.max(0, 1 - Math.pow(scatter, 1.65));

      const cx = cssWidth / 2;
      const cy = cssHeight / 2;
      const perspective = 760;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        const formedX = lerp(p.startX, p.homeX, intro);
        const formedY = lerp(p.startY, p.homeY, intro);
        const formedZ = lerp(p.startZ, 0, intro);

        const explodedX = lerp(p.homeX, p.scatterX, explode);
        const explodedY = lerp(p.homeY, p.scatterY, explode);
        const explodedZ = lerp(0, p.scatterZ, explode);

        const x = lerp(formedX, explodedX, scatter);
        const y = lerp(formedY, explodedY, scatter);
        const z = lerp(formedZ, explodedZ, scatter);

        const depth = perspective / Math.max(120, perspective - z);
        const drawX = cx + (x - cx) * depth;
        const drawY = cy + (y - cy) * depth;

        const alpha = p.alpha * intro * fade;
        if (alpha < 0.02) continue;

        const radius = p.size * (0.85 + explode * 0.6) * Math.max(0.68, Math.min(1.8, depth));

        ctx.fillStyle = `rgba(${p.r}, ${p.g}, ${p.b}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(drawX * dpr, drawY * dpr, radius * dpr, 0, Math.PI * 2);
        ctx.fill();
      }

      rafId = requestAnimationFrame(render);
    };

    const onResize = () => {
      buildParticles();
    };

    window.addEventListener("resize", onResize);
    buildParticles();
    render();

    return {
      state,
      rebuild: buildParticles,
      destroy: () => {
        cancelAnimationFrame(rafId);
        window.removeEventListener("resize", onResize);
      }
    };
  };

  const particleWord = setupParticleWord();

  if (!driftWord || !particleWord) {
    autoScrollToWork(600);
  } else if (!canUseGsap || prefersReduced) {
    driftWord.style.opacity = "1";
    particleWord.state.intro = 1;
    autoScrollToWork(900);
  } else {
    gsap.set(driftWord, { opacity: 1 });

    const introTl = gsap.timeline();
    introTl
      .to(particleWord.state, {
        intro: 1,
        duration: 2,
        ease: "expo.out"
      }, 0)
      .to(driftWord, {
        y: -10,
        duration: 0.6,
        repeat: 1,
        yoyo: true,
        ease: "sine.inOut"
      }, 1.36)
      .call(() => autoScrollToWork(180));
  }

  if (canUseScrollTrigger && particleWord) {
    gsap.timeline({
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: 0.8
      }
    }).to(particleWord.state, {
      scatter: 1,
      duration: 1,
      ease: "none"
    }, 0);
  }

  if (!canUseScrollTrigger) return;

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

  window.addEventListener("load", () => {
    particleWord?.rebuild();
    ScrollTrigger.refresh();
  });
})();
