/* DRIFFFT site scripts */
(() => {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
  const canUseGsap = Boolean(window.gsap);
  const canUseScrollTrigger = Boolean(window.gsap && window.ScrollTrigger && !prefersReduced);

  if (canUseScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
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
      workSection.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "start" });
    }, delay);
  };

  const shardPolygons = [
    "polygon(0% 0%, 58% 0%, 34% 46%, 0% 56%)",
    "polygon(58% 0%, 100% 0%, 100% 54%, 34% 46%)",
    "polygon(0% 56%, 34% 46%, 54% 100%, 0% 100%)",
    "polygon(34% 46%, 100% 54%, 100% 100%, 54% 100%)",
    "polygon(20% 18%, 70% 8%, 58% 58%, 14% 66%)",
    "polygon(44% 44%, 84% 30%, 92% 74%, 46% 86%, 20% 62%)"
  ];

  const setupCharacterShards = () => {
    if (!driftWord) return { letters: [], cores: [], shards: [] };
    const letters = Array.from(driftWord.querySelectorAll(":scope > span"));
    const cores = [];
    const shards = [];
    const shardsPerLetter = window.innerWidth < 860 ? 4 : 6;
    const rand = (min, max) => min + Math.random() * (max - min);

    letters.forEach((letterEl, letterIndex) => {
      const char = (letterEl.textContent || "").trim();
      if (!char) return;

      letterEl.classList.add("drift-letter");
      letterEl.textContent = "";

      const core = document.createElement("span");
      core.className = "letter-core";
      core.textContent = char;
      letterEl.appendChild(core);
      cores.push(core);

      for (let i = 0; i < shardsPerLetter; i++) {
        const shard = document.createElement("span");
        shard.className = "letter-shard";
        shard.textContent = char;
        shard.dataset.char = char;
        const poly = shardPolygons[(letterIndex + i) % shardPolygons.length];
        shard.style.clipPath = poly;
        shard.style.webkitClipPath = poly;
        shard.dataset.letterIndex = String(letterIndex);
        const edgeX = rand(-2.8, 2.8);
        const edgeY = rand(-2.8, 2.8);
        shard.style.setProperty("--edge-x", `${edgeX.toFixed(2)}px`);
        shard.style.setProperty("--edge-y", `${edgeY.toFixed(2)}px`);
        shard.style.setProperty("--edge-x-inv", `${(-edgeX * 0.56).toFixed(2)}px`);
        shard.style.setProperty("--edge-y-inv", `${(-edgeY * 0.56).toFixed(2)}px`);
        shard.style.setProperty("--facet-angle", `${rand(0, 360).toFixed(1)}deg`);
        shard.style.setProperty(
          "--facet-light",
          `hsla(${(208 + rand(-10, 12)).toFixed(1)}, 98%, ${(76 + rand(-6, 10)).toFixed(1)}%, 0.97)`
        );
        shard.style.setProperty(
          "--facet-mid",
          `hsla(${(214 + rand(-12, 12)).toFixed(1)}, 95%, ${(58 + rand(-8, 10)).toFixed(1)}%, 0.9)`
        );
        shard.style.setProperty(
          "--facet-dark",
          `hsla(${(224 + rand(-14, 12)).toFixed(1)}, 100%, ${(30 + rand(-8, 10)).toFixed(1)}%, 0.82)`
        );
        shard.style.transformOrigin = `${rand(18, 82).toFixed(1)}% ${rand(18, 82).toFixed(1)}%`;
        letterEl.appendChild(shard);
        shards.push(shard);
      }
    });

    return { letters, cores, shards };
  };

  const { letters: driftLetters, cores: letterCores, shards: letterShards } = setupCharacterShards();

  const createShatterScroll = () => {
    if (!canUseScrollTrigger || !letterShards.length || !driftWord) return;

    const half = Math.max(1, (driftLetters.length - 1) / 2);
    const shardTargets = letterShards.map((shard) => {
      const letterIndex = Number(shard.dataset.letterIndex || 0);
      const fromCenter = (letterIndex - half) / half;
      const driftX = fromCenter * window.innerWidth * 0.34;
      const fullX = driftX + gsap.utils.random(-window.innerWidth * 0.28, window.innerWidth * 0.28);
      const fullY = gsap.utils.random(-window.innerHeight * 0.64, window.innerHeight * 0.64);
      const fullZ = gsap.utils.random(-1200, 1200);
      const fullScale = gsap.utils.random(0.2, 1.85);
      const fullRotate = gsap.utils.random(-220, 220);
      const fullRotateX = gsap.utils.random(-150, 150);
      const fullRotateY = gsap.utils.random(-150, 150);

      return {
        midX: fullX * 0.48,
        midY: fullY * 0.48,
        midZ: fullZ * 0.52,
        midRotate: fullRotate * 0.45,
        midRotateX: fullRotateX * 0.45,
        midRotateY: fullRotateY * 0.45,
        midScale: 1 + (fullScale - 1) * 0.45,
        midOpacity: gsap.utils.random(0.65, 1),
        x: fullX,
        y: fullY,
        z: fullZ,
        rotate: fullRotate,
        rotateX: fullRotateX,
        rotateY: fullRotateY,
        scale: fullScale,
        opacity: gsap.utils.random(0.16, 0.72),
        blur: gsap.utils.random(5, 20)
      };
    });

    gsap.timeline({
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: 0.8
      }
    })
      .to(letterCores, {
        opacity: 0,
        filter: "blur(3px)",
        duration: 0.16,
        ease: "none",
        stagger: { amount: 0.12, from: "center" }
      }, 0)
      .to(letterShards, {
        x: (i) => shardTargets[i].midX,
        y: (i) => shardTargets[i].midY,
        z: (i) => shardTargets[i].midZ,
        rotate: (i) => shardTargets[i].midRotate,
        rotateX: (i) => shardTargets[i].midRotateX,
        rotateY: (i) => shardTargets[i].midRotateY,
        scale: (i) => shardTargets[i].midScale,
        opacity: (i) => shardTargets[i].midOpacity,
        filter: "blur(1px)",
        duration: 0.42,
        ease: "none",
        stagger: { amount: 0.18, from: "random" }
      }, 0)
      .to(letterShards, {
        x: (i) => shardTargets[i].x,
        y: (i) => shardTargets[i].y,
        z: (i) => shardTargets[i].z,
        rotate: (i) => shardTargets[i].rotate,
        rotateX: (i) => shardTargets[i].rotateX,
        rotateY: (i) => shardTargets[i].rotateY,
        scale: (i) => shardTargets[i].scale,
        opacity: (i) => shardTargets[i].opacity,
        filter: (i) => `blur(${shardTargets[i].blur}px)`,
        duration: 0.58,
        ease: "none",
        stagger: { amount: 0.26, from: "random" }
      }, 0.42)
      .to(driftWord, {
        opacity: 0.2,
        duration: 0.4,
        ease: "none"
      }, 0.1);
  };

  if (!driftWord || !driftLetters.length) {
    autoScrollToWork(600);
  } else if (!canUseGsap || prefersReduced) {
    driftWord.style.opacity = "1";
    driftLetters.forEach((letter) => {
      letter.style.transform = "none";
      letter.style.filter = "none";
      letter.style.opacity = "1";
    });
    autoScrollToWork(900);
  } else {
    gsap.set(driftWord, { opacity: 1 });

    driftLetters.forEach((letter) => {
      gsap.set(letter, {
        x: gsap.utils.random(-window.innerWidth * 0.55, window.innerWidth * 0.55),
        y: gsap.utils.random(-window.innerHeight * 0.55, window.innerHeight * 0.55),
        z: gsap.utils.random(-600, 400),
        rotate: gsap.utils.random(-42, 42),
        scale: gsap.utils.random(0.62, 1.45),
        opacity: 0,
        filter: "blur(14px)"
      });
    });

    letterShards.forEach((shard) => {
      shard.style.opacity = "0";
      shard.style.transform = "none";
      shard.style.filter = "none";
    });

    const driftIntro = gsap.timeline();
    driftIntro
      .to(driftLetters, {
        x: 0,
        y: 0,
        z: 0,
        rotate: 0,
        scale: 1,
        opacity: 1,
        filter: "blur(0px)",
        duration: 2,
        ease: "expo.out",
        stagger: { amount: 0.62, from: "random" }
      })
      .to(driftWord, {
        letterSpacing: "0.12em",
        duration: 0.8,
        ease: "power2.out"
      }, 0.26)
      .to(driftWord, {
        y: -10,
        duration: 0.65,
        repeat: 1,
        yoyo: true,
        ease: "sine.inOut"
      }, 1.4)
      .call(() => {
        createShatterScroll();
        autoScrollToWork(180);
      });
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

  window.addEventListener("load", () => ScrollTrigger.refresh());
})();
