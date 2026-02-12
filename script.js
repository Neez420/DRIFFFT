/* DRIFFFT site scripts */
(() => {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const canUseGsap = Boolean(window.gsap);
  const canUseScrollTrigger = Boolean(window.gsap && window.ScrollTrigger && !prefersReduced);
  const navEntry = performance.getEntriesByType("navigation")[0];
  const isReload = navEntry?.type === "reload";
  const shouldForceTop = !window.location.hash || isReload;
  const getScrollY = () => Math.max(0, window.scrollY || window.pageYOffset || 0);
  const forceTop = () => window.scrollTo({ top: 0, left: 0, behavior: "auto" });

  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }

  if (shouldForceTop) {
    forceTop();
    requestAnimationFrame(forceTop);
    window.setTimeout(forceTop, 80);
    window.setTimeout(forceTop, 260);
    window.addEventListener("pageshow", forceTop, { once: true });
    window.addEventListener("load", forceTop, { once: true });
  }

  if (canUseScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
  }

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  const setCardHoverOrigin = (card, event) => {
    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    card.style.setProperty("--hover-x", `${x}px`);
    card.style.setProperty("--hover-y", `${y}px`);
  };

  if (!isCoarsePointer) {
    const workCards = document.querySelectorAll(".work-item");
    workCards.forEach((card) => {
      card.addEventListener("pointerenter", (event) => {
        setCardHoverOrigin(card, event);
        card.classList.add("is-hovered");
      });
      card.addEventListener("pointermove", (event) => {
        setCardHoverOrigin(card, event);
      });
      card.addEventListener("pointerleave", (event) => {
        setCardHoverOrigin(card, event);
        card.classList.remove("is-hovered");
      });
    });
  }

  const cursor = document.querySelector(".cursor");
  if (cursor && !isCoarsePointer) {
    let active = false;
    window.addEventListener("pointermove", (e) => {
      if (!active) {
        active = true;
        cursor.style.opacity = "1";
      }
      cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    });

    const linkCards = document.querySelectorAll(".work-item");
    linkCards.forEach((card) => {
      card.addEventListener("pointerenter", () => cursor.classList.add("is-link"));
      card.addEventListener("pointerleave", () => cursor.classList.remove("is-link"));
    });
  }

  const driftWord = document.querySelector(".drift-word");
  const heroEl = document.querySelector(".hero");
  const enjoyEl = document.querySelector(".hero-enjoy");
  const enjoyPrefixEl = enjoyEl?.querySelector(".hero-enjoy-prefix") ?? null;
  const enjoyAccentEl = enjoyEl?.querySelector(".hero-enjoy-accent") ?? null;
  const workSection = document.getElementById("work");

  const buildEnjoyLetters = () => {
    if (!enjoyPrefixEl) return [];
    const text = enjoyPrefixEl.textContent || "";
    enjoyPrefixEl.textContent = "";
    const frag = document.createDocumentFragment();
    const letters = [];
    for (const ch of text) {
      const span = document.createElement("span");
      span.className = "hero-enjoy-letter";
      span.textContent = ch === " " ? "\u00A0" : ch;
      frag.appendChild(span);
      letters.push(span);
    }
    enjoyPrefixEl.appendChild(frag);
    return letters;
  };

  const enjoyLetters = buildEnjoyLetters();

  const syncEnjoyAlignment = () => {
    if (!enjoyEl || !driftWord || !heroEl) return;
    const heroRect = heroEl.getBoundingClientRect();
    const wordRect = driftWord.getBoundingClientRect();
    const left = Math.max(12, wordRect.left - heroRect.left);
    enjoyEl.style.left = `${left}px`;
  };

  syncEnjoyAlignment();
  window.addEventListener("resize", syncEnjoyAlignment, { passive: true });
  window.addEventListener("load", syncEnjoyAlignment, { once: true });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(syncEnjoyAlignment).catch(() => {});
  }

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
      const isMobile = window.innerWidth < 768;
      workSection.scrollIntoView({ behavior: prefersReduced || isMobile ? "auto" : "smooth", block: "start" });
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

    document.body.appendChild(ctxCanvas);
    driftWord.classList.add("particle-mode");

    const letterSpans = Array.from(driftWord.querySelectorAll(":scope > span"));
    const state = {
      intro: canUseGsap && !prefersReduced ? 0 : 1,
      scatter: 0,
      ripple: 0,
      rippleOriginX: 0,
      rippleOriginY: 0
    };

    const palette = [
      [18, 18, 18],    // Graphite #121212
      [42, 42, 42],    // Dark Grey #2A2A2A
      [0, 229, 255],   // Neon Cyan #00E5FF
      [58, 134, 255],  // Muted Blue #3A86FF
      [241, 241, 241]  // Soft White #F1F1F1
    ];

    let particles = [];
    let viewportW = 0;
    let viewportH = 0;
    let dpr = window.devicePixelRatio || 1;
    let rafId = 0;
    let lastBuildW = 0;
    let lastBuildH = 0;
    let scatterVisual = 0;
    const pointer = {
      x: 0,
      y: 0,
      active: false,
      lastMove: 0
    };

    const onPointerMove = (e) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
      pointer.lastMove = performance.now();
    };

    const onPointerLeave = () => {
      pointer.active = false;
    };

    const onTouchStart = () => {
      pointer.active = false;
    };

    const rand = (min, max) => min + Math.random() * (max - min);

    const buildParticles = (force = false) => {
      viewportW = window.innerWidth;
      viewportH = window.innerHeight;
      if (!viewportW || !viewportH) return;
      const isMobile = viewportW < 768;
      if (
        !force &&
        isMobile &&
        lastBuildW &&
        Math.abs(viewportW - lastBuildW) < 2 &&
        Math.abs(viewportH - lastBuildH) < 120
      ) {
        return;
      }
      const wordRect = driftWord.getBoundingClientRect();
      const wordVisible = wordRect.bottom > 0 && wordRect.top < viewportH;
      state.rippleOriginX = wordRect.left + wordRect.width * 0.5;
      state.rippleOriginY = wordRect.top + wordRect.height * 0.5;
      if (!force && !wordVisible && particles.length) return;
      if (!pointer.lastMove) {
        pointer.x = viewportW * 0.5;
        pointer.y = viewportH * 0.5;
      }
      dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 2 : 3);

      ctxCanvas.width = Math.max(1, Math.round(viewportW * dpr));
      ctxCanvas.height = Math.max(1, Math.round(viewportH * dpr));
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
        const x = (spanRect.left + spanRect.width / 2) * dpr;
        const y = (spanRect.top + spanRect.height / 2) * dpr;
        const fontSize = Math.max(10, spanRect.height * 0.9) * dpr;

        offCtx.font = `800 ${fontSize}px Inter, system-ui, -apple-system, Segoe UI, sans-serif`;
        offCtx.fillText(char, x, y);
      });

      const { data, width, height } = offCtx.getImageData(0, 0, offscreen.width, offscreen.height);
      const step = Math.max(1, Math.floor((isMobile ? 2.2 : 4) * dpr));
      const built = [];
      const centerX = viewportW / 2;
      const centerY = viewportH / 2;

      for (let y = 0; y < height; y += step) {
        for (let x = 0; x < width; x += step) {
          const alpha = data[(y * width + x) * 4 + 3];
          if (alpha < 35) continue;

          const homeX = x / dpr;
          const homeY = y / dpr;
          const nx = (homeX - centerX) / Math.max(1, centerX);
          const ny = (homeY - centerY) / Math.max(1, centerY);

          const scatterX = homeX
            + nx * rand(viewportW * 0.2, viewportW * 0.72)
            + rand(-viewportW * 0.26, viewportW * 0.26);
          const scatterY = homeY
            + ny * rand(viewportH * 0.2, viewportH * 1.14)
            + rand(-viewportH * 0.95, viewportH * 0.95);

          const base = palette[(Math.random() * palette.length) | 0];

          built.push({
            homeX,
            homeY,
            startX: homeX + rand(-viewportW * 1.2, viewportW * 1.2),
            startY: homeY + rand(-viewportH * 1.4, viewportH * 1.4),
            startZ: rand(-760, 520),
            scatterX,
            scatterY,
            scatterZ: rand(-1200, 1200),
            alpha: rand(isMobile ? 0.72 : 0.45, 0.98),
            size: rand(isMobile ? 0.95 : 0.9, isMobile ? 2.05 : 2.2),
            r: base[0],
            g: base[1],
            b: base[2],
            driftAmpX: rand(1.2, isMobile ? 5.6 : 8.6),
            driftAmpY: rand(1.2, isMobile ? 5.6 : 8.6),
            driftAmpZ: rand(6, isMobile ? 18 : 28),
            driftFreqX: rand(0.14, 0.52),
            driftFreqY: rand(0.12, 0.46),
            driftFreqZ: rand(0.1, 0.32),
            driftPhaseX: rand(0, Math.PI * 2),
            driftPhaseY: rand(0, Math.PI * 2),
            driftPhaseZ: rand(0, Math.PI * 2)
          });
        }
      }

      const maxParticles = viewportW < 640 ? 2400 : 2800;
      if (built.length > maxParticles) {
        const stride = Math.ceil(built.length / maxParticles);
        particles = built.filter((_, i) => i % stride === 0);
      } else {
        particles = built;
      }
      if (!particles.length) {
        scatterVisual = state.scatter;
      }
      lastBuildW = viewportW;
      lastBuildH = viewportH;
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
      const isMobile = viewportW < 768;
      scatterVisual = isMobile
        ? lerp(scatterVisual, clamp01(state.scatter), 0.2)
        : clamp01(state.scatter);
      const scatter = clamp01(scatterVisual);
      const explode = Math.min(1, scatter * 1.55);
      const fade = lerp(1, 0.86, Math.pow(scatter, 1.2));
      const ambient = Math.pow(scatter, 1.2);
      const rippleProgress = clamp01(state.ripple);
      const maxRippleRadius = Math.hypot(
        Math.max(state.rippleOriginX, viewportW - state.rippleOriginX),
        Math.max(state.rippleOriginY, viewportH - state.rippleOriginY)
      );
      const rippleStartFade = clamp01(rippleProgress / 0.1);
      const rippleEndFade = 1 - clamp01((rippleProgress - 0.82) / 0.18);
      const rippleEnvelope = rippleStartFade * rippleEndFade;
      const t = performance.now() * 0.001;
      const pointerRadius = Math.max(120, Math.min(260, viewportW * 0.16));
      const pointerReady = !isMobile && pointer.active && scatter < 0.2;

      const cx = viewportW / 2;
      const cy = viewportH / 2;
      const perspective = 760;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        const formedX = lerp(p.startX, p.homeX, intro);
        const formedY = lerp(p.startY, p.homeY, intro);
        const formedZ = lerp(p.startZ, 0, intro);

        const explodedX = lerp(p.homeX, p.scatterX, explode);
        const explodedY = lerp(p.homeY, p.scatterY, explode);
        const explodedZ = lerp(0, p.scatterZ, explode);

        const ambientX = Math.sin(t * p.driftFreqX + p.driftPhaseX) * p.driftAmpX * ambient;
        const ambientY = Math.cos(t * p.driftFreqY + p.driftPhaseY) * p.driftAmpY * ambient;
        const ambientZ = Math.sin(t * p.driftFreqZ + p.driftPhaseZ) * p.driftAmpZ * ambient;

        const x = lerp(formedX, explodedX, scatter) + ambientX;
        const y = lerp(formedY, explodedY, scatter) + ambientY;
        const z = lerp(formedZ, explodedZ, scatter) + ambientZ;

        let drawWorldX = x;
        let drawWorldY = y;
        let drawWorldZ = z;
        let alphaBoost = 0;

        if (rippleProgress > 0 && rippleEnvelope > 0.001) {
          const dxRipple = p.homeX - state.rippleOriginX;
          const dyRipple = p.homeY - state.rippleOriginY;
          const distRipple = Math.hypot(dxRipple, dyRipple);
          const waveRadius = (1 - rippleProgress) * maxRippleRadius;
          const waveWidth = isMobile ? 54 : 76;
          const bandRaw = 1 - Math.min(1, Math.abs(distRipple - waveRadius) / waveWidth);
          if (bandRaw > 0) {
            const invDistRipple = 1 / Math.max(1, distRipple);
            const band = bandRaw * bandRaw * (3 - 2 * bandRaw);
            const wave = band * band;
            const decay = (0.45 + (1 - rippleProgress) * 0.55) * rippleEnvelope;
            const pushXY = wave * decay * (isMobile ? 30 : 44);
            const pushZ = wave * decay * (isMobile ? 140 : 210);
            drawWorldX += dxRipple * invDistRipple * pushXY;
            drawWorldY += dyRipple * invDistRipple * pushXY;
            drawWorldZ += pushZ;
            alphaBoost = wave * 0.46 * decay;
          }
        }

        if (pointerReady && intro > 0.72) {
          const dx = drawWorldX - pointer.x;
          const dy = drawWorldY - pointer.y;
          const dist = Math.hypot(dx, dy);
          if (dist < pointerRadius) {
            const n = 1 - dist / pointerRadius;
            const falloff = n * n;
            const invDist = 1 / Math.max(1, dist);
            const push = (24 + 30 * scatter) * falloff;
            drawWorldX += dx * invDist * push;
            drawWorldY += dy * invDist * push;
            drawWorldZ += (66 + 110 * scatter) * falloff;
          }
        }

        const depth = perspective / Math.max(120, perspective - drawWorldZ);
        const drawX = cx + (drawWorldX - cx) * depth;
        const drawY = cy + (drawWorldY - cy) * depth;

        const alpha = p.alpha * intro * fade + alphaBoost;
        if (alpha < 0.02) continue;

        const explodeSizeBoost = isMobile ? 0.36 : 0.6;
        const radius = p.size * (0.85 + explode * explodeSizeBoost) * Math.max(0.68, Math.min(1.8, depth));

        ctx.fillStyle = `rgba(${p.r}, ${p.g}, ${p.b}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(drawX * dpr, drawY * dpr, radius * dpr, 0, Math.PI * 2);
        ctx.fill();
      }

      rafId = requestAnimationFrame(render);
    };

    let resizeRaf = 0;
    const onResize = () => {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => buildParticles(false));
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("resize", onResize);
    buildParticles(true);
    render();

    return {
      state,
      rebuild: (force = false) => buildParticles(force),
      destroy: () => {
        cancelAnimationFrame(rafId);
        cancelAnimationFrame(resizeRaf);
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerleave", onPointerLeave);
        window.removeEventListener("touchstart", onTouchStart);
        window.removeEventListener("resize", onResize);
        ctxCanvas.remove();
      }
    };
  };

  const particleWord = setupParticleWord();
  const shouldPlayHeroIntro = () => {
    if (getScrollY() > 24) return false;
    if (!heroEl) return true;
    const rect = heroEl.getBoundingClientRect();
    return rect.bottom > Math.max(120, window.innerHeight * 0.35);
  };

  if (!driftWord || !particleWord) {
    if (shouldPlayHeroIntro()) autoScrollToWork(600);
  } else if (!canUseGsap || prefersReduced) {
    driftWord.style.opacity = "1";
    particleWord.state.intro = 1;
    if (shouldPlayHeroIntro()) autoScrollToWork(900);
  } else {
    gsap.set(driftWord, { opacity: 1 });
    if (enjoyEl) {
      gsap.set(enjoyEl, {
        autoAlpha: 0,
        y: 12,
        filter: "blur(10px)"
      });
      if (enjoyLetters.length) {
        gsap.set(enjoyLetters, {
          autoAlpha: 0
        });
      }
      if (enjoyAccentEl) {
        gsap.set(enjoyAccentEl, {
          autoAlpha: 0,
          scale: 0.64,
          y: 8,
          filter: "blur(8px)"
        });
      }
    }

    if (!shouldPlayHeroIntro()) {
      particleWord.state.intro = 1;
    } else {
      const letterStagger = 0.052;
      const letterDuration = 0.02;
      const lettersStart = 0.12;
      const lettersEnd = lettersStart + letterDuration + Math.max(0, enjoyLetters.length - 1) * letterStagger;
      const accentStart = lettersEnd + 0.06;
      const accentEnd = accentStart + 0.5;
      const particleStart = accentEnd + 0.08;
      const rippleStart = particleStart + 1.42;
      const introTl = gsap.timeline();
      if (enjoyEl) {
        introTl.to(enjoyEl, {
          autoAlpha: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.3,
          ease: "power3.out"
        }, 0);
      }
      if (enjoyLetters.length) {
        introTl.to(enjoyLetters, {
          autoAlpha: 1,
          duration: letterDuration,
          stagger: letterStagger,
          ease: "steps(1)"
        }, lettersStart);
      }
      if (enjoyAccentEl) {
        introTl.to(enjoyAccentEl, {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          duration: 0.5,
          ease: "back.out(1.5)"
        }, accentStart);
      }
      introTl.to(particleWord.state, {
        intro: 1,
        duration: 1.42,
        ease: "expo.out"
      }, particleStart);
      introTl.to(particleWord.state, {
        ripple: 1,
        duration: 1.02,
        ease: "power2.out"
      }, particleStart + 0.08);
      if (enjoyEl) {
        introTl.to(enjoyEl, {
          autoAlpha: 0,
          y: -8,
          filter: "blur(8px)",
          duration: 0.38,
          ease: "power2.in"
        }, accentEnd + 0.14);
      }
      introTl.call(() => autoScrollToWork(window.innerWidth < 768 ? 60 : 180), null, rippleStart + 0.52);
    }
  }

  if (particleWord && window.innerWidth < 768) {
    const hero = document.querySelector(".hero");
    let scrollRaf = 0;

    const syncMobileScatter = () => {
      if (!hero) return;
      const heroTravel = Math.max(1, hero.offsetHeight * 0.9);
      const y = Math.max(0, window.scrollY || window.pageYOffset || 0);
      particleWord.state.scatter = clamp01(y / heroTravel);
    };

    const onScroll = () => {
      cancelAnimationFrame(scrollRaf);
      scrollRaf = requestAnimationFrame(syncMobileScatter);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    syncMobileScatter();
  } else if (canUseScrollTrigger && particleWord) {
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

  const isMobile = window.innerWidth < 768;

  gsap.timeline({
    scrollTrigger: {
      trigger: "#work",
      start: "top 86%",
      end: "top 24%",
      scrub: isMobile ? 0.75 : 1
    }
  })
    .fromTo(".section-title",
      {
        yPercent: 38,
        scale: isMobile ? 0.96 : 0.9,
        opacity: 0.35,
        filter: "blur(10px)"
      },
      {
        yPercent: 0,
        scale: 1,
        opacity: 1,
        filter: "blur(0px)",
        ease: "none"
      },
      0
    )
    .fromTo(".section-sub",
      {
        yPercent: 72,
        xPercent: -34,
        opacity: 0.2,
        filter: "blur(6px)"
      },
      {
        yPercent: 0,
        xPercent: 0,
        opacity: 1,
        filter: "blur(0px)",
        ease: "none"
      },
      0.06
    );

  gsap.timeline({
    scrollTrigger: {
      trigger: "#work",
      start: "top 42%",
      end: "top 18%",
      scrub: isMobile ? 0.9 : 1
    }
  }).fromTo(".work-item",
    {
      x: isMobile ? 36 : 72,
      filter: "blur(10px)"
    },
    {
      x: 0,
      filter: "blur(0px)",
      stagger: 0.14,
      ease: "none"
    },
    0
  );

  gsap.timeline({
    scrollTrigger: {
      trigger: ".footer",
      start: "top bottom",
      end: "top 70%",
      scrub: isMobile ? 0.7 : 1
    }
  })
    .fromTo(".footer-inner",
      { y: 44 },
      { immediateRender: false, y: 0, ease: "none" },
      0
    );

  window.addEventListener("load", () => {
    if (shouldForceTop) {
      forceTop();
      if (particleWord) particleWord.state.scatter = 0;
    }
    particleWord?.rebuild(true);
    ScrollTrigger.refresh();
  });
})();
