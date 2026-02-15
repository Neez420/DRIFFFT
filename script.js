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

  const metaGlowState = new WeakMap();
  const getMetaGlowTarget = (card, event) => {
    const metaEl = card.querySelector(".work-meta");
    if (!metaEl) return 0;
    const rect = metaEl.getBoundingClientRect();
    const cx = rect.left + rect.width * 0.5;
    const cy = rect.top + rect.height * 0.5;
    const dx = event.clientX - cx;
    const dy = event.clientY - cy;
    const distance = Math.hypot(dx, dy);
    const influenceRadius = Math.max(220, Math.max(rect.width, rect.height) * 3.6);
    const linearProximity = Math.max(0, Math.min(1, 1 - distance / influenceRadius));
    return linearProximity * linearProximity * (3 - 2 * linearProximity);
  };

  const ensureMetaGlowAnimation = (card) => {
    const state = metaGlowState.get(card);
    if (!state || state.rafId) return;
    const tick = () => {
      state.current += (state.target - state.current) * 0.24;
      if (Math.abs(state.target - state.current) < 0.0015) {
        state.current = state.target;
      }
      card.style.setProperty("--meta-glow", String(state.current));
      if (!state.active && state.current === 0) {
        state.rafId = 0;
        return;
      }
      state.rafId = requestAnimationFrame(tick);
    };
    state.rafId = requestAnimationFrame(tick);
  };

  if (!isCoarsePointer) {
    const workCards = document.querySelectorAll(".work-item");
    workCards.forEach((card) => {
      metaGlowState.set(card, { current: 0, target: 0, active: false, rafId: 0 });
      card.addEventListener("pointerenter", (event) => {
        setCardHoverOrigin(card, event);
        const state = metaGlowState.get(card);
        if (state) {
          state.active = true;
          state.target = getMetaGlowTarget(card, event);
          ensureMetaGlowAnimation(card);
        }
        card.classList.add("is-hovered");
      });
      card.addEventListener("pointermove", (event) => {
        setCardHoverOrigin(card, event);
        const state = metaGlowState.get(card);
        if (state) {
          state.target = getMetaGlowTarget(card, event);
          ensureMetaGlowAnimation(card);
        }
      });
      card.addEventListener("pointerleave", (event) => {
        setCardHoverOrigin(card, event);
        const state = metaGlowState.get(card);
        if (state) {
          state.active = false;
          state.target = 0;
          ensureMetaGlowAnimation(card);
        } else {
          card.style.setProperty("--meta-glow", "0");
        }
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
  const sectionTitlePeriodAnchor = document.querySelector(".section-title-dot-anchor");
  const sectionTitleIDotAnchor = document.querySelector(".section-title-i-dot-anchor");
  const sectionTitleBaselineProbe = document.querySelector(".section-title-baseline-probe");
  const sectionTitleDotProbe = document.querySelector(".section-title-dot-probe");
  const workCards = Array.from(document.querySelectorAll(".work-item"));
  const footerEl = document.querySelector(".footer");
  const footerLogoChars = Array.from(document.querySelectorAll(".brand-logo-char"));
  const footerTextEls = Array.from(document.querySelectorAll(".footer-note, .footer-right .mono"));
  const footerAnimTargets = [...footerLogoChars, ...footerTextEls];

  const buildEnjoyLetters = () => {
    if (!enjoyPrefixEl) return [];
    const text = enjoyPrefixEl.textContent || "";
    enjoyPrefixEl.textContent = "";
    const frag = document.createDocumentFragment();
    const letters = [];
    for (const ch of text) {
      const span = document.createElement("span");
      span.className = "hero-enjoy-letter";
      span.dataset.target = ch;
      span.textContent = ch === " " ? "\u00A0" : ch;
      frag.appendChild(span);
      letters.push(span);
    }
    enjoyPrefixEl.appendChild(frag);
    return letters;
  };

  const enjoyLetters = buildEnjoyLetters();
  const scrambleChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+-?";
  const randomScrambleChar = () => scrambleChars[(Math.random() * scrambleChars.length) | 0];
  const applyEnjoyScramble = (progress) => {
    if (!enjoyLetters.length) return;
    const lockCount = Math.floor(clamp01(progress) * enjoyLetters.length);
    for (let i = 0; i < enjoyLetters.length; i++) {
      const letter = enjoyLetters[i];
      const target = letter.dataset.target || "";
      if (target === " ") {
        letter.textContent = "\u00A0";
        continue;
      }
      letter.textContent = i < lockCount ? target : randomScrambleChar();
    }
  };

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

  let scrollLockActive = false;
  let autoScrollInProgress = false;
  let lockedScrollY = 0;
  let mobileAutoScatterSlowUntil = 0;
  let scriptedScrollRaf = 0;
  let wheelSmoothRaf = 0;
  let wheelSmoothTargetY = getScrollY();
  const scrollKeys = new Set([
    "ArrowUp",
    "ArrowDown",
    "PageUp",
    "PageDown",
    "Home",
    "End",
    " ",
    "Spacebar"
  ]);

  const isDesktopViewport = () => !isCoarsePointer && window.innerWidth >= 768;
  const getMaxScrollY = () => {
    const doc = document.documentElement;
    if (!doc) return 0;
    return Math.max(0, doc.scrollHeight - window.innerHeight);
  };
  const clampScrollY = (value) => Math.max(0, Math.min(getMaxScrollY(), value));
  const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2);

  const cancelScriptedScroll = () => {
    if (!scriptedScrollRaf) return;
    cancelAnimationFrame(scriptedScrollRaf);
    scriptedScrollRaf = 0;
  };

  const stopWheelSmoothing = () => {
    if (!wheelSmoothRaf) return;
    cancelAnimationFrame(wheelSmoothRaf);
    wheelSmoothRaf = 0;
  };

  const smoothScrollToY = (targetY, opts = {}) =>
    new Promise((resolve) => {
      const clampedTarget = clampScrollY(targetY);
      const duration = typeof opts.duration === "number" ? opts.duration : 1120;

      if (prefersReduced || !isDesktopViewport()) {
        window.scrollTo({ top: clampedTarget, left: 0, behavior: "auto" });
        resolve();
        return;
      }

      cancelScriptedScroll();
      const startY = getScrollY();
      const distance = clampedTarget - startY;
      if (Math.abs(distance) < 1) {
        window.scrollTo({ top: clampedTarget, left: 0, behavior: "auto" });
        resolve();
        return;
      }

      const startTime = performance.now();
      const tick = (now) => {
        const raw = (now - startTime) / duration;
        const progress = Math.min(1, Math.max(0, raw));
        const eased = easeInOutCubic(progress);
        const nextY = startY + distance * eased;
        window.scrollTo({ top: nextY, left: 0, behavior: "auto" });

        if (progress >= 1) {
          scriptedScrollRaf = 0;
          window.scrollTo({ top: clampedTarget, left: 0, behavior: "auto" });
          resolve();
          return;
        }
        scriptedScrollRaf = requestAnimationFrame(tick);
      };

      scriptedScrollRaf = requestAnimationFrame(tick);
    });

  const lockScrollInput = (event) => {
    if (!scrollLockActive) return;
    if (event.type === "keydown" && !scrollKeys.has(event.key)) return;
    event.preventDefault();
  };

  const setScrollLock = (active) => {
    scrollLockActive = active;
    if (active) {
      lockedScrollY = getScrollY();
      cancelScriptedScroll();
      stopWheelSmoothing();
      wheelSmoothTargetY = lockedScrollY;
    } else {
      wheelSmoothTargetY = getScrollY();
    }
  };

  const enforceScrollLock = () => {
    if (!scrollLockActive || autoScrollInProgress) return;
    const y = getScrollY();
    if (Math.abs(y - lockedScrollY) < 1) return;
    window.scrollTo({ top: lockedScrollY, left: 0, behavior: "auto" });
  };

  const runWheelSmoothing = () => {
    const targetY = clampScrollY(wheelSmoothTargetY);
    const currentY = getScrollY();
    const nextY = currentY + (targetY - currentY) * 0.18;

    if (Math.abs(targetY - nextY) < 0.5) {
      wheelSmoothRaf = 0;
      window.scrollTo({ top: targetY, left: 0, behavior: "auto" });
      return;
    }

    window.scrollTo({ top: nextY, left: 0, behavior: "auto" });
    wheelSmoothRaf = requestAnimationFrame(runWheelSmoothing);
  };

  const smoothDesktopWheel = (event) => {
    if (!isDesktopViewport() || prefersReduced) return;
    if (scrollLockActive || autoScrollInProgress) return;
    if (event.defaultPrevented || event.ctrlKey || event.metaKey) return;
    if (!Number.isFinite(event.deltaY) || event.deltaY === 0) return;

    event.preventDefault();
    const normalizedDelta = event.deltaMode === 1
      ? event.deltaY * 16
      : event.deltaMode === 2
        ? event.deltaY * window.innerHeight
        : event.deltaY;
    const maxStep = window.innerHeight * 0.85;
    const step = Math.max(-maxStep, Math.min(maxStep, normalizedDelta * 0.92));

    if (!wheelSmoothRaf) {
      wheelSmoothTargetY = getScrollY();
    }
    wheelSmoothTargetY = clampScrollY(wheelSmoothTargetY + step);

    if (!wheelSmoothRaf) {
      wheelSmoothRaf = requestAnimationFrame(runWheelSmoothing);
    }
  };

  const syncWheelTargetToNativeScroll = () => {
    if (scrollLockActive || autoScrollInProgress || wheelSmoothRaf) return;
    wheelSmoothTargetY = getScrollY();
  };

  window.addEventListener("wheel", lockScrollInput, { passive: false, capture: true });
  window.addEventListener("wheel", smoothDesktopWheel, { passive: false });
  window.addEventListener("touchmove", lockScrollInput, { passive: false, capture: true });
  window.addEventListener("keydown", lockScrollInput, { capture: true });
  window.addEventListener("scroll", enforceScrollLock, { passive: true });
  window.addEventListener("scroll", syncWheelTargetToNativeScroll, { passive: true });
  window.addEventListener("resize", () => {
    wheelSmoothTargetY = clampScrollY(wheelSmoothTargetY);
  }, { passive: true });

  const waitForScrollSettle = (targetY, timeoutMs = 2200) =>
    new Promise((resolve) => {
      const start = performance.now();
      let stableFrames = 0;

      const tick = () => {
        const y = getScrollY();
        const dist = Math.abs(y - targetY);
        stableFrames = dist < 2 ? stableFrames + 1 : 0;
        if (stableFrames >= 4 || performance.now() - start >= timeoutMs) {
          resolve();
          return;
        }
        requestAnimationFrame(tick);
      };

      requestAnimationFrame(tick);
    });

  const waitForDistanceToTarget = (targetY, maxDistance, timeoutMs = 1400) =>
    new Promise((resolve) => {
      const start = performance.now();

      const tick = () => {
        const y = getScrollY();
        if (Math.abs(y - targetY) <= maxDistance || performance.now() - start >= timeoutMs) {
          resolve();
          return;
        }
        requestAnimationFrame(tick);
      };

      requestAnimationFrame(tick);
    });

  const sleep = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));
  let footerLogoAnimated = false;
  let footerLogoVisible = false;
  let footerIntroPrepared = false;
  let footerVisibilityTimeline = null;
  let footerHasPlayedIntro = false;

  const prepareFooterIntro = () => {
    if (footerIntroPrepared || !footerEl) return;
    footerIntroPrepared = true;
    footerEl.classList.add("is-preintro-hidden");
    if (canUseGsap && footerAnimTargets.length) {
      gsap.set(footerLogoChars, {
        x: -28,
        y: 0,
        opacity: 0,
        filter: "blur(10px)"
      });
      gsap.set(footerTextEls, {
        x: -16,
        y: 0,
        opacity: 0,
        filter: "blur(8px)"
      });
    }
    footerLogoVisible = false;
    footerHasPlayedIntro = false;
  };

  const revealFooterShell = () => {
    if (!footerEl) return;
    footerEl.classList.remove("is-preintro-hidden");
  };

  const setFooterLogoVisibility = (visible, opts = {}) => {
    if (prefersReduced || !canUseGsap || !footerAnimTargets.length) {
      footerLogoVisible = visible;
      return Promise.resolve();
    }
    if (!opts.force && footerLogoVisible === visible) return Promise.resolve();

    const {
      duration = visible ? 0.5 : 0.34,
      stagger = visible ? 0.085 : 0.04
    } = opts;

    footerLogoVisible = visible;
    if (footerVisibilityTimeline) {
      footerVisibilityTimeline.kill();
      footerVisibilityTimeline = null;
    }
    gsap.killTweensOf(footerAnimTargets);

    if (visible) {
      const shouldResetStart = opts.force || !footerHasPlayedIntro;
      if (shouldResetStart) {
        if (footerLogoChars.length) {
          gsap.set(footerLogoChars, {
            x: -28,
            y: 0,
            opacity: 0.2,
            filter: "blur(10px)"
          });
        }
        if (footerTextEls.length) {
          gsap.set(footerTextEls, {
            x: -16,
            y: 0,
            opacity: 0.16,
            filter: "blur(8px)"
          });
        }
      }

      return new Promise((resolve) => {
        const tl = gsap.timeline({
          onComplete: () => {
            footerHasPlayedIntro = true;
            if (footerVisibilityTimeline === tl) footerVisibilityTimeline = null;
            resolve();
          }
        });
        footerVisibilityTimeline = tl;
        const logoRevealSpan = footerLogoChars.length
          ? duration + Math.max(0, footerLogoChars.length - 1) * stagger
          : 0;
        const textRevealStart = footerLogoChars.length ? logoRevealSpan + 0.01 : 0;

        if (footerLogoChars.length) {
          tl.to(footerLogoChars, {
            x: 0,
            y: 0,
            opacity: 1,
            filter: "blur(0px)",
            duration,
            stagger,
            ease: "power3.out"
          }, 0);
        }
        if (footerTextEls.length) {
          tl.to(footerTextEls, {
            x: 0,
            y: 0,
            opacity: 1,
            filter: "blur(0px)",
            duration: Math.max(0.28, duration - 0.08),
            stagger: 0.05,
            ease: "power3.out"
          }, textRevealStart);
        }
      });
    }

    return new Promise((resolve) => {
      const tl = gsap.timeline({
        onComplete: () => {
          if (footerVisibilityTimeline === tl) footerVisibilityTimeline = null;
          resolve();
        }
      });
      footerVisibilityTimeline = tl;
      const textMainDuration = Math.max(0.16, duration * 0.68);
      const textFadeDuration = Math.max(0.08, duration * 0.24);
      const textFadeStart = textMainDuration;
      const textExitSpan = footerTextEls.length
        ? textFadeStart + textFadeDuration + Math.max(0, footerTextEls.length - 1) * 0.02
        : 0;
      const logoStart = footerTextEls.length ? textExitSpan + 0.02 : 0;

      if (footerTextEls.length) {
        tl.to(footerTextEls, {
          x: -12,
          y: -2,
          opacity: 0.14,
          filter: "blur(7px)",
          duration: textMainDuration,
          stagger: { each: 0.03, from: "end" },
          ease: "power2.out"
        }, 0);
        tl.to(footerTextEls, {
          opacity: 0,
          duration: textFadeDuration,
          stagger: { each: 0.02, from: "end" },
          ease: "power1.out"
        }, textFadeStart);
      }
      if (footerLogoChars.length) {
        tl.to(footerLogoChars, {
          x: -20,
          y: -3,
          opacity: 0.18,
          filter: "blur(9px)",
          duration: duration * 0.72,
          stagger: { each: stagger, from: "end" },
          ease: "power2.out"
        }, logoStart);
        tl.to(footerLogoChars, {
          opacity: 0,
          duration: Math.max(0.1, duration * 0.28),
          stagger: { each: stagger * 0.7, from: "end" },
          ease: "power1.out"
        }, logoStart + duration * 0.72);
      }
    });
  };

  const animateFooterLogo = () => {
    if (footerLogoAnimated || prefersReduced || !canUseGsap || !footerAnimTargets.length) return Promise.resolve();
    footerLogoAnimated = true;
    return setFooterLogoVisibility(true, { force: true, duration: 0.52, stagger: 0.085 });
  };

  let mobileCardFlashPlayed = false;
  const flashMobileWorkCards = async () => {
    if (mobileCardFlashPlayed || prefersReduced || window.innerWidth >= 768 || !workCards.length) return;
    mobileCardFlashPlayed = true;
    await sleep(500);

    const sweepTotalMs = 680;
    const edgeReachMs = 490;

    for (let i = 0; i < workCards.length; i++) {
      const card = workCards[i];
      card.classList.remove("is-mobile-sweep");
      void card.offsetWidth;
      card.classList.add("is-mobile-sweep");

      window.setTimeout(() => {
        card.classList.remove("is-mobile-sweep");
      }, sweepTotalMs + 40);

      const waitMs = i < workCards.length - 1 ? edgeReachMs : sweepTotalMs + 40;
      await sleep(waitMs);
    }
  };

  const autoScrollToWork = (delay) => {
    if (!workSection) return;
    prepareFooterIntro();
    setScrollLock(true);
    window.setTimeout(async () => {
      try {
        autoScrollInProgress = true;
        const isMobile = window.innerWidth < 768;
        if (isMobile) {
          mobileAutoScatterSlowUntil = performance.now() + 1100;
        }
        const targetY = clampScrollY(workSection.getBoundingClientRect().top + getScrollY());

        let footerIntroPromise;
        if (!prefersReduced && !isMobile) {
          footerIntroPromise = (async () => {
            await waitForDistanceToTarget(targetY, window.innerHeight * 0.28);
            revealFooterShell();
            return animateFooterLogo();
          })();
          await smoothScrollToY(targetY, { duration: 1120 });
          await waitForScrollSettle(targetY, 900);
        } else {
          window.scrollTo({ top: targetY, left: 0, behavior: "auto" });
          await new Promise((resolve) => requestAnimationFrame(resolve));
        }

        if (!footerIntroPromise) {
          revealFooterShell();
          footerIntroPromise = animateFooterLogo();
        }
        const mobileSweepPromise = flashMobileWorkCards();
        await Promise.all([footerIntroPromise, mobileSweepPromise]);
      } finally {
        autoScrollInProgress = false;
        setScrollLock(false);
      }
    }, delay);
  };

  if (!prefersReduced && canUseGsap && footerLogoChars.length) {
    let logoScrollRaf = 0;
    let lastLogoScrollY = getScrollY();
    let lastDirection = 0;
    let lastDirectionFlipAt = 0;
    const directionFlipHoldMs = 120;

    const syncFooterLogoByScroll = () => {
      logoScrollRaf = 0;
      if (scrollLockActive || autoScrollInProgress || !footerLogoAnimated) {
        lastLogoScrollY = getScrollY();
        return;
      }

      const y = getScrollY();
      const delta = y - lastLogoScrollY;
      lastLogoScrollY = y;
      if (Math.abs(delta) < 0.8) return;

      const direction = delta > 0 ? 1 : -1;
      if (direction === lastDirection) return;
      const now = performance.now();
      if (now - lastDirectionFlipAt < directionFlipHoldMs) return;
      lastDirection = direction;
      lastDirectionFlipAt = now;

      if (direction < 0) {
        setFooterLogoVisibility(false, { duration: 0.28, stagger: 0.03 });
      } else {
        setFooterLogoVisibility(true, { duration: 0.42, stagger: 0.06 });
      }
    };

    window.addEventListener("scroll", () => {
      if (logoScrollRaf) return;
      logoScrollRaf = requestAnimationFrame(syncFooterLogoByScroll);
    }, { passive: true });
  }

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
    let lastResizeW = window.innerWidth || 0;
    let lastResizeH = window.innerHeight || 0;
    let scatterVisual = 0;
    let sectionTitlePeriodParticle = null;
    let sectionTitleIDotParticle = null;
    let cachedSectionTitlePeriodTarget = null;
    let cachedSectionTitleIDotTarget = null;
    let sectionDotLayoutRaf = 0;
    const pointer = {
      x: 0,
      y: 0,
      active: false,
      lastMove: 0
    };

    const onPointerMove = (e) => {
      const now = performance.now();
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
      pointer.lastMove = now;
    };

    const onPointerLeave = () => {
      pointer.active = false;
    };

    const onTouchStart = () => {
      pointer.active = false;
    };

    const rand = (min, max) => min + Math.random() * (max - min);
    const parseCssRgb = (cssColor) => {
      if (!cssColor) return null;
      const m = cssColor.match(/rgba?\(([^)]+)\)/i);
      if (!m) return null;
      const parts = m[1].split(",").map((v) => Number.parseFloat(v.trim()));
      if (parts.length < 3 || parts.some((v, i) => i < 3 && !Number.isFinite(v))) return null;
      return {
        r: Math.max(0, Math.min(255, Math.round(parts[0]))),
        g: Math.max(0, Math.min(255, Math.round(parts[1]))),
        b: Math.max(0, Math.min(255, Math.round(parts[2])))
      };
    };

    const getSectionTitleDotColor = () => {
      const colorSource = sectionTitlePeriodAnchor?.closest(".section-title")
        || sectionTitleIDotAnchor?.closest(".section-title")
        || sectionTitlePeriodAnchor
        || sectionTitleIDotAnchor;
      const parsed = parseCssRgb(colorSource ? window.getComputedStyle(colorSource).color : "");
      return parsed || { r: 245, g: 245, b: 245 };
    };

    const getTextRangeRect = (textNode, start, end) => {
      if (!textNode || textNode.nodeType !== Node.TEXT_NODE) return null;
      const text = textNode.textContent || "";
      if (start < 0 || end <= start || end > text.length) return null;
      const range = document.createRange();
      range.setStart(textNode, start);
      range.setEnd(textNode, end);
      const rect = range.getBoundingClientRect();
      range.detach?.();
      if (!rect || (!rect.width && !rect.height)) return null;
      return rect;
    };

    const isRectValid = (rect) => Boolean(rect && (rect.width || rect.height));

    const getSectionTitlePeriodRect = () => {
      if (sectionTitlePeriodAnchor) {
        const anchorTextNode = sectionTitlePeriodAnchor.firstChild;
        const anchorRect = getTextRangeRect(anchorTextNode, 0, 1);
        if (anchorRect) return anchorRect;
        const fallbackRect = sectionTitlePeriodAnchor.getBoundingClientRect();
        if (isRectValid(fallbackRect)) return fallbackRect;
      }

      if (sectionTitleDotProbe) {
        const probeTextNode = sectionTitleDotProbe.firstChild;
        const probeText = probeTextNode?.nodeType === Node.TEXT_NODE ? probeTextNode.textContent || "" : "";
        const dotIndex = probeText.lastIndexOf(".");
        if (dotIndex >= 0) {
          const probeRect = getTextRangeRect(probeTextNode, dotIndex, dotIndex + 1);
          if (probeRect) return probeRect;
        }
      }

      return null;
    };

    const getSectionTitleIDotRect = () => {
      if (sectionTitleIDotAnchor) {
        const anchorRect = sectionTitleIDotAnchor.getBoundingClientRect();
        if (isRectValid(anchorRect)) return anchorRect;
      }

      if (sectionTitleDotProbe) {
        const probeTextNode = sectionTitleDotProbe.firstChild;
        const probeText = probeTextNode?.nodeType === Node.TEXT_NODE ? probeTextNode.textContent || "" : "";
        const iIndex = probeText.toLowerCase().indexOf("i");
        if (iIndex >= 0) {
          const probeRect = getTextRangeRect(probeTextNode, iIndex, iIndex + 1);
          if (probeRect) return probeRect;
        }
      }

      return null;
    };

    const getSectionTitlePeriodTarget = () => {
      const layoutWidth = viewportW || window.innerWidth || 0;
      const isMobile = layoutWidth < 768;
      if (isMobile) return null;

      const rect = getSectionTitlePeriodRect();
      if (!isRectValid(rect)) return null;
      const referenceEl = sectionTitlePeriodAnchor || sectionTitleDotProbe;
      const fontSize = parseFloat(window.getComputedStyle(referenceEl).fontSize) || rect.height;
      const maxDotDiameter = 30;
      const minDotDiameter = 11;
      const measuredDotDiameter = Math.max(rect.width, rect.height);
      const dotDiameter = Math.max(
        minDotDiameter,
        Math.min(maxDotDiameter, Math.max(
          measuredDotDiameter * 1.08,
          fontSize * 0.14
        ))
      );
      const dotRadius = dotDiameter * 0.5;
      const baselineY = sectionTitleBaselineProbe
        ? sectionTitleBaselineProbe.getBoundingClientRect().top
        : null;
      const measuredDotCenterY = rect.top + rect.height * 0.5;
      const target = {
        x: rect.left + rect.width * 0.5,
        y: Number.isFinite(baselineY) ? baselineY - dotRadius * 0.88 : measuredDotCenterY + 3,
        radius: dotRadius
      };
      return target;
    };

    const getSectionTitleIDotTarget = () => {
      const layoutWidth = viewportW || window.innerWidth || 0;
      const isMobile = layoutWidth < 768;
      if (isMobile) return null;

      const rect = getSectionTitleIDotRect();
      if (!isRectValid(rect)) return null;
      const referenceEl = sectionTitleIDotAnchor || sectionTitlePeriodAnchor || sectionTitleDotProbe;
      const fontSize = parseFloat(window.getComputedStyle(referenceEl).fontSize) || rect.height;
      const maxDotDiameter = 26;
      const minDotDiameter = 10;
      const measuredDotDiameter = Math.max(rect.width, rect.height);
      const dotDiameter = Math.max(
        minDotDiameter,
        Math.min(maxDotDiameter, Math.max(
          measuredDotDiameter * 0.95,
          fontSize * 0.09
        ))
      );
      return {
        x: rect.left + rect.width * 0.5,
        y: rect.top + rect.height * 0.5,
        radius: dotDiameter * 0.5
      };
    };

    const applySectionTitleDotParticleStyle = (particle, minDesktopSize) => {
      if (!particle) return;
      const sectionDotColor = getSectionTitleDotColor();
      particle.r = sectionDotColor.r;
      particle.g = sectionDotColor.g;
      particle.b = sectionDotColor.b;
      particle.alpha = Math.max(particle.alpha, 0.95);
      const maxSize = viewportW < 768 ? 1.2 : minDesktopSize;
      particle.size = Math.min(maxSize, Math.max(particle.size, 0.9));
      particle.scatterZ = 0;
    };

    const bindSectionTitleDotParticles = () => {
      sectionTitlePeriodParticle = null;
      sectionTitleIDotParticle = null;
      if (!particles.length) return;
      const isMobile = (viewportW || window.innerWidth) < 768;
      if (isMobile) return;

      let periodCandidate = null;
      let periodBestScore = -Infinity;
      let iCandidate = null;
      let iBestScore = -Infinity;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const periodScore = p.homeX * 1.6 + p.homeY;
        if (periodScore > periodBestScore) {
          periodBestScore = periodScore;
          periodCandidate = p;
        }

        const iScore = p.homeX * 1.2 - p.homeY;
        if (iScore > iBestScore) {
          iBestScore = iScore;
          iCandidate = p;
        }
      }

      if (periodCandidate) {
        applySectionTitleDotParticleStyle(periodCandidate, 1.35);
        sectionTitlePeriodParticle = periodCandidate;
        const periodTarget = cachedSectionTitlePeriodTarget || getSectionTitlePeriodTarget();
        if (periodTarget) {
          sectionTitlePeriodParticle.scatterX = periodTarget.x;
          sectionTitlePeriodParticle.scatterY = periodTarget.y;
          sectionTitlePeriodParticle.sectionDotRadius = periodTarget.radius;
        }
      }

      if (iCandidate === periodCandidate) {
        iCandidate = null;
        iBestScore = -Infinity;
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          if (p === periodCandidate) continue;
          const iScore = p.homeX * 1.2 - p.homeY;
          if (iScore > iBestScore) {
            iBestScore = iScore;
            iCandidate = p;
          }
        }
      }

      if (iCandidate) {
        applySectionTitleDotParticleStyle(iCandidate, 1.18);
        sectionTitleIDotParticle = iCandidate;
        const iTarget = cachedSectionTitleIDotTarget || getSectionTitleIDotTarget();
        if (iTarget) {
          sectionTitleIDotParticle.scatterX = iTarget.x;
          sectionTitleIDotParticle.scatterY = iTarget.y;
          sectionTitleIDotParticle.sectionDotRadius = iTarget.radius;
        }
      }
    };

    const refreshSectionTitleDotLayout = () => {
      cachedSectionTitlePeriodTarget = getSectionTitlePeriodTarget();
      cachedSectionTitleIDotTarget = getSectionTitleIDotTarget();

      if (sectionTitlePeriodParticle && cachedSectionTitlePeriodTarget) {
        sectionTitlePeriodParticle.scatterX = cachedSectionTitlePeriodTarget.x;
        sectionTitlePeriodParticle.scatterY = cachedSectionTitlePeriodTarget.y;
        sectionTitlePeriodParticle.sectionDotRadius = cachedSectionTitlePeriodTarget.radius;
      }

      if (sectionTitleIDotParticle && cachedSectionTitleIDotTarget) {
        sectionTitleIDotParticle.scatterX = cachedSectionTitleIDotTarget.x;
        sectionTitleIDotParticle.scatterY = cachedSectionTitleIDotTarget.y;
        sectionTitleIDotParticle.sectionDotRadius = cachedSectionTitleIDotTarget.radius;
      }
    };

    const scheduleSectionTitleDotLayoutRefresh = () => {
      if (sectionDotLayoutRaf) return;
      sectionDotLayoutRaf = requestAnimationFrame(() => {
        sectionDotLayoutRaf = 0;
        refreshSectionTitleDotLayout();
      });
    };

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
          const size = rand(isMobile ? 0.82 : 0.9, isMobile ? 1.78 : 2.2);
          const layerRoll = Math.random();
          const precessionLayerSpeed = layerRoll < 0.33 ? 0.74 : layerRoll < 0.66 ? 1 : 1.26;
          const precessionLayerInfluence = layerRoll < 0.33 ? 0.82 : layerRoll < 0.66 ? 1 : 1.2;

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
            size,
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
            driftPhaseZ: rand(0, Math.PI * 2),
            swirlPhase: rand(0, Math.PI * 2),
            swirlOffsetX: 0,
            swirlOffsetY: 0,
            precessionLayerSpeed,
            precessionLayerInfluence
          });
        }
      }

      const maxParticles = isMobile ? 1800 : 2100;
      if (built.length > maxParticles) {
        const stride = Math.ceil(built.length / maxParticles);
        particles = built.filter((_, i) => i % stride === 0);
      } else {
        particles = built;
      }
      if (particles.length) {
        bindSectionTitleDotParticles();
      } else {
        sectionTitlePeriodParticle = null;
        sectionTitleIDotParticle = null;
      }
      if (!particles.length) {
        scatterVisual = state.scatter;
      }
      refreshSectionTitleDotLayout();
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
      const mobileScatterLerp = performance.now() < mobileAutoScatterSlowUntil ? 0.14 : 0.2;
      scatterVisual = isMobile
        ? lerp(scatterVisual, clamp01(state.scatter), mobileScatterLerp)
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
      const nowMs = performance.now();
      const t = nowMs * 0.001;
      const pointerRadius = Math.max(96, Math.min(220, viewportW * 0.15));
      const pointerSwirlRadiusMax = isMobile ? 0 : 3.4;
      const pointerSwirlSpeed = 4.4;
      const pointerSwirlEase = 0.18;
      const pointerReady = !isMobile && pointer.active && scatter < 0.2;
      const precessionMix = clamp01((scatter - 0.08) / 0.6) * intro;
      const precessionAngularSpeed = isMobile ? 0.012 : 0.016;
      const barycenterX = viewportW * 0.53
        + Math.sin(t * 0.056) * viewportW * 0.16
        + Math.cos(t * 0.031) * viewportW * 0.07;
      const barycenterY = viewportH * 0.47
        + Math.cos(t * 0.051) * viewportH * 0.14
        + Math.sin(t * 0.028) * viewportH * 0.06;

      const cx = viewportW / 2;
      const cy = viewportH / 2;
      const perspective = 760;
      const sectionPeriodTarget = cachedSectionTitlePeriodTarget;
      const sectionIDotTarget = cachedSectionTitleIDotTarget;
      if (sectionTitlePeriodParticle && sectionPeriodTarget) {
        sectionTitlePeriodParticle.scatterX = sectionPeriodTarget.x;
        sectionTitlePeriodParticle.scatterY = sectionPeriodTarget.y;
        sectionTitlePeriodParticle.sectionDotRadius = sectionPeriodTarget.radius;
      }
      if (sectionTitleIDotParticle && sectionIDotTarget) {
        sectionTitleIDotParticle.scatterX = sectionIDotTarget.x;
        sectionTitleIDotParticle.scatterY = sectionIDotTarget.y;
        sectionTitleIDotParticle.sectionDotRadius = sectionIDotTarget.radius;
      }

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const isPeriodDotParticle = !isMobile && p === sectionTitlePeriodParticle && Boolean(sectionPeriodTarget);
        const isIDotParticle = !isMobile && p === sectionTitleIDotParticle && Boolean(sectionIDotTarget);
        const isSectionDotParticle = isPeriodDotParticle || isIDotParticle;
        const periodDotStart = 0.64;
        const periodDotSpan = 0.3;
        const periodDotLockRaw = clamp01((scatter - periodDotStart) / periodDotSpan);
        const periodDotLockMix = periodDotLockRaw * periodDotLockRaw * (3 - 2 * periodDotLockRaw);
        const periodDotMix = isPeriodDotParticle
          ? periodDotLockMix
          : 0;

        const iDotStart = 0.46;
        const iDotSpan = 0.28;
        const iDotLockRaw = clamp01((scatter - iDotStart) / iDotSpan);
        const iDotLockMix = iDotLockRaw * iDotLockRaw * (3 - 2 * iDotLockRaw);
        const iDotMix = isIDotParticle
          ? iDotLockMix
          : 0;
        const sectionDotAmbientScale = 1 - Math.max(periodDotMix, iDotMix);

        const formedX = lerp(p.startX, p.homeX, intro);
        const formedY = lerp(p.startY, p.homeY, intro);
        const formedZ = lerp(p.startZ, 0, intro);

        const explodedX = lerp(p.homeX, p.scatterX, explode);
        const explodedY = lerp(p.homeY, p.scatterY, explode);
        const explodedZ = lerp(0, p.scatterZ, explode);

        const ambientX = isSectionDotParticle
          ? 0
          : Math.sin(t * p.driftFreqX + p.driftPhaseX) * p.driftAmpX * ambient * sectionDotAmbientScale;
        const ambientY = isSectionDotParticle
          ? 0
          : Math.cos(t * p.driftFreqY + p.driftPhaseY) * p.driftAmpY * ambient * sectionDotAmbientScale;
        const ambientZ = isSectionDotParticle
          ? 0
          : Math.sin(t * p.driftFreqZ + p.driftPhaseZ) * p.driftAmpZ * ambient * sectionDotAmbientScale;

        const x = lerp(formedX, explodedX, scatter) + ambientX;
        const y = lerp(formedY, explodedY, scatter) + ambientY;
        const z = lerp(formedZ, explodedZ, scatter) + ambientZ;

        let drawWorldX = x;
        let drawWorldY = y;
        let drawWorldZ = z;
        let alphaBoost = 0;

        if (!isSectionDotParticle && rippleProgress > 0 && rippleEnvelope > 0.001) {
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

        if (!isSectionDotParticle && pointerReady && intro > 0.72) {
          const dxPointer = p.homeX - pointer.x;
          const dyPointer = p.homeY - pointer.y;
          const distPointer = Math.hypot(dxPointer, dyPointer);
          let swirlTargetX = 0;
          let swirlTargetY = 0;
          if (distPointer < pointerRadius) {
            const n = 1 - distPointer / pointerRadius;
            const falloff = n * n;
            const swirlRadius = pointerSwirlRadiusMax * falloff;
            const swirlAngle = t * pointerSwirlSpeed + p.swirlPhase;
            swirlTargetX = Math.cos(swirlAngle) * swirlRadius;
            swirlTargetY = Math.sin(swirlAngle) * swirlRadius;
          }
          p.swirlOffsetX = lerp(p.swirlOffsetX || 0, swirlTargetX, pointerSwirlEase);
          p.swirlOffsetY = lerp(p.swirlOffsetY || 0, swirlTargetY, pointerSwirlEase);
        } else {
          p.swirlOffsetX = lerp(p.swirlOffsetX || 0, 0, pointerSwirlEase);
          p.swirlOffsetY = lerp(p.swirlOffsetY || 0, 0, pointerSwirlEase);
        }
        drawWorldX += p.swirlOffsetX || 0;
        drawWorldY += p.swirlOffsetY || 0;

        if (p === sectionTitlePeriodParticle && sectionPeriodTarget) {
          drawWorldX = lerp(drawWorldX, sectionPeriodTarget.x, periodDotMix);
          drawWorldY = lerp(drawWorldY, sectionPeriodTarget.y, periodDotMix);
          drawWorldZ = lerp(drawWorldZ, 0, periodDotMix);
        }

        if (p === sectionTitleIDotParticle && sectionIDotTarget) {
          drawWorldX = lerp(drawWorldX, sectionIDotTarget.x, iDotMix);
          drawWorldY = lerp(drawWorldY, sectionIDotTarget.y, iDotMix);
          drawWorldZ = lerp(drawWorldZ, 0, iDotMix);
        }
        if (!isSectionDotParticle && precessionMix > 0.001) {
          const precessionAngle = t * precessionAngularSpeed * p.precessionLayerSpeed;
          const precessionSin = Math.sin(precessionAngle);
          const precessionCos = Math.cos(precessionAngle);
          const toParticleX = drawWorldX - barycenterX;
          const toParticleY = drawWorldY - barycenterY;
          const orbitX = barycenterX + toParticleX * precessionCos - toParticleY * precessionSin;
          const orbitY = barycenterY + toParticleX * precessionSin + toParticleY * precessionCos;
          const localPrecessionMix = Math.min(1, precessionMix * p.precessionLayerInfluence);
          drawWorldX = lerp(drawWorldX, orbitX, localPrecessionMix);
          drawWorldY = lerp(drawWorldY, orbitY, localPrecessionMix);
        }

        const depth = perspective / Math.max(120, perspective - drawWorldZ);
        const drawX = cx + (drawWorldX - cx) * depth;
        const drawY = cy + (drawWorldY - cy) * depth;

        let alpha = p.alpha * intro * fade + alphaBoost;
        if (p === sectionTitlePeriodParticle) {
          alpha = lerp(alpha, intro, periodDotMix);
        } else if (p === sectionTitleIDotParticle) {
          alpha = lerp(alpha, intro, iDotMix);
        }
        if (alpha < 0.02) continue;

        const explodeSizeBoost = isMobile ? 0.36 : 0.6;
        let radius = p.size * (0.85 + explode * explodeSizeBoost) * Math.max(0.68, Math.min(1.8, depth));
        if (p === sectionTitlePeriodParticle && p.sectionDotRadius) {
          const anchoredRadius = p.sectionDotRadius * (isMobile ? 1 : Math.max(0.72, Math.min(1.34, depth)));
          radius = lerp(radius, anchoredRadius, periodDotMix);
        } else if (p === sectionTitleIDotParticle && p.sectionDotRadius) {
          const anchoredRadius = p.sectionDotRadius * (isMobile ? 1 : Math.max(0.78, Math.min(1.2, depth)));
          radius = lerp(radius, anchoredRadius, iDotMix);
        }

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
      resizeRaf = requestAnimationFrame(() => {
        const nextW = window.innerWidth || 0;
        const nextH = window.innerHeight || 0;
        const isMobileResizeNoise = nextW < 768
          && Math.abs(nextW - lastResizeW) < 24;
        lastResizeW = nextW;
        lastResizeH = nextH;
        if (isMobileResizeNoise) return;
        buildParticles(false);
        refreshSectionTitleDotLayout();
      });
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("scroll", scheduleSectionTitleDotLayoutRefresh, { passive: true });
    window.addEventListener("resize", onResize);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(scheduleSectionTitleDotLayoutRefresh).catch(() => {});
    }
    buildParticles(true);
    render();

    return {
      state,
      rebuild: (force = false) => buildParticles(force),
      destroy: () => {
        cancelAnimationFrame(rafId);
        cancelAnimationFrame(resizeRaf);
        cancelAnimationFrame(sectionDotLayoutRaf);
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerleave", onPointerLeave);
        window.removeEventListener("touchstart", onTouchStart);
        window.removeEventListener("scroll", scheduleSectionTitleDotLayoutRefresh);
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
          autoAlpha: 1
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
      setScrollLock(true);
      const scrambleStart = 0.12;
      const scrambleDuration = Math.max(0.88, enjoyLetters.length * 0.048);
      const scrambleEnd = scrambleStart + scrambleDuration;
      const accentStart = scrambleEnd + 0.06;
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
        const scrambleState = { progress: 0 };
        applyEnjoyScramble(0);
        introTl.to(scrambleState, {
          progress: 1,
          duration: scrambleDuration,
          ease: "none",
          onUpdate: () => applyEnjoyScramble(scrambleState.progress),
          onComplete: () => applyEnjoyScramble(1)
        }, scrambleStart);
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
    let resizeRaf = 0;
    let mobileHeroTravel = 1;
    let lastMobileWidth = window.innerWidth || 0;

    const computeMobileHeroTravel = () => {
      if (!hero) return;
      const heroHeight = Math.max(
        hero.getBoundingClientRect().height || 0,
        hero.offsetHeight || 0,
        window.innerHeight || 0
      );
      mobileHeroTravel = Math.max(1, heroHeight * 0.9);
    };

    const syncMobileScatter = () => {
      if (!hero) return;
      const y = Math.max(0, window.scrollY || window.pageYOffset || 0);
      particleWord.state.scatter = clamp01(y / mobileHeroTravel);
    };

    const onScroll = () => {
      cancelAnimationFrame(scrollRaf);
      scrollRaf = requestAnimationFrame(syncMobileScatter);
    };

    const onMobileResize = () => {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        const width = window.innerWidth || 0;
        // Ignore browser UI bar show/hide height changes, update only on real layout width changes.
        if (Math.abs(width - lastMobileWidth) < 24) return;
        lastMobileWidth = width;
        computeMobileHeroTravel();
        syncMobileScatter();
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onMobileResize, { passive: true });
    computeMobileHeroTravel();
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
