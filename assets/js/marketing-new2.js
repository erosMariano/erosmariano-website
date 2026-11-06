(function ($) {

  "use strict";

  if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
  }

  if (typeof ScrollTrigger !== "undefined") {
    ScrollTrigger.config({ ignoreMobileResize: true });
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }


  /*==========================================================
      GLOBAL WIDTH-GATED RESIZE -> ScrollTrigger.refresh
  =========================================================== */
  let __lastWidth = window.innerWidth;
  let __resizeTimer = null;
  window.addEventListener('resize', () => {
    if (window.innerWidth === __lastWidth) return;
    __lastWidth = window.innerWidth;
    clearTimeout(__resizeTimer);
    __resizeTimer = setTimeout(() => {
      if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
    }, 200);
  });


  /*==========================================================
    Marketing banner video zoom
  =========================================================== */
  function initHeroScrollAnimation() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    const section = document.querySelector('.zoom-video-hero-marketing');
    const animationWrap = document.querySelector('.tl-zoom-video-animation');
    const videoWrap = document.querySelector('.zoom-video-marketing');
    const textAfter = document.querySelector('.zoom-video-content-after .tl-banner-description');
    const btnAfter = document.querySelector('.zoom-video-content-after .tl-section-btn');

    if (!section || !animationWrap || !videoWrap || !textAfter || !btnAfter) return;

    if (!textAfter.querySelector('.word')) {
      const textContent = textAfter.textContent.trim();
      const words = textContent.split(/\s+/);
      textAfter.innerHTML = words.map(word =>
        `<span class="word" style="display:inline-block; white-space:nowrap;">${word}</span>`
      ).join(" ");
    }

    const words = textAfter.querySelectorAll('.word');

    gsap.set(textAfter, { opacity: 0, scale: 1.08, filter: 'blur(5px)', willChange: 'opacity, transform, filter' });
    gsap.set(words, { opacity: 0, willChange: 'opacity' });
    gsap.set(btnAfter, { y: 25, opacity: 0 });

    const tl = gsap.timeline({
      scrollTrigger: {
        id: 'heroPin',
        trigger: section,
        start: 'top top',
        end: '+=150%',
        scrub: true,
        pin: true,
        pinSpacing: true,

        refreshPriority: 2,
        invalidateOnRefresh: true
      }
    });

    tl.fromTo(videoWrap, {
      clipPath: () => window.matchMedia('(max-width: 768px)').matches
        ? 'inset(40% 35%)'
        : 'inset(38% 42%)'
    }, {
      clipPath: 'inset(0% 0%)',
      duration: 2,
      ease: 'none'
    })
    .to(textAfter, {
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)',
      duration: 0.5,
      ease: 'none'
    }, '-=0.5')
    .to(words, {
      opacity: 1,
      duration: 0.5,
      stagger: { amount: 0.5, from: 'start' },
      ease: 'none'
    }, '<')
    .to(btnAfter, {
      y: 0,
      visibility: 'visible',
      opacity: 1,
      duration: 0.5,
      ease: 'none'
    }, '<');
  }


  /*==========================================================
      CARD APPEAR ON VIDEO
  =========================================================== */
  function cardAppearScroll() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    const section = document.querySelector('.tl-card-appear-on-video');
    const animationStage = document.querySelector('.card-appear-animation');
    const video = animationStage ? animationStage.querySelector('.card-appear-video') : null;
    const cards = gsap.utils.toArray('.tl-card-appear-on-video-wrapper .single-appeared-card');

    if (!section || !animationStage || !video || !cards.length) return;

    const restingRotation = (i) => (i % 2 === 0 ? -2 : 2);

    cards.forEach((card, i) => {
      card.style.zIndex = i + 1;
    });

    gsap.set(video, { xPercent: -50, yPercent: -50 });

    const lastIndex = cards.length - 1;

    const tl = gsap.timeline({
      scrollTrigger: {
        id: 'cardAppearPin',
        trigger: section,
        start: 'top top',
        end: () => '+=' + (cards.length * 60 + 30) + '%',
        pin: animationStage,
        pinSpacing: true,
        scrub: true,
        refreshPriority: 1,
        invalidateOnRefresh: true
      }
    });

    cards.forEach((card, i) => {
      tl.fromTo(
        card,
        {
          y: () => window.innerHeight,
          rotation: 0,
          xPercent: -50,
          yPercent: -50
        },
        {
          y: 0,
          rotation: restingRotation(i),
          duration: 1,
          ease: 'none'
        },
        i * 0.8
      );
    });
  }


  /*==========================================================
    build text changes animation
  =========================================================== */
  function initBuildAroundAnimation() {
      const textEls = document.querySelectorAll(".blur-text");
      textEls.forEach(el => {
          const text = el.textContent.trim();
          if (!text) return;
          const words = text.split(/\s+/);
          el.innerHTML = words.map(word => `<span class="word">${word}</span>`).join(" ");
      });

      const section = document.querySelector(".build-around-text-effect");
      const mainText = document.querySelector(".tl-build-main-text");
      const initialContent = document.querySelector(".build-bottom-inital");
      const currencyWrapper = document.querySelector(".tl-build-currency-number");
      const currencyVal = document.querySelector(".tl-currency-val");

      const itemOne = document.querySelector(".build-content-one");
      const itemTwo = document.querySelector(".build-content-two");
      const itemThree = document.querySelector(".build-content-three");

      const currencyObj = { value: 0 };

      function updateCurrency() {
          currencyVal.innerText = "$" + Math.round(currencyObj.value).toLocaleString();
      }

      function animateIn(targetEl, targetVal, dir = 1) {
          const heading = targetEl.querySelector(".build-content-list-single h3");
          const words = targetEl.querySelectorAll(".blur-text .word");

          gsap.killTweensOf([targetEl, heading, words, currencyObj, currencyVal]);

          const tl = gsap.timeline();
          
          tl.to(targetEl, { autoAlpha: 1, duration: 0.1 });

          if (heading) {
              tl.fromTo(heading, 
                  { y: 20 * dir, opacity: 0, filter: "blur(4px)", "--rule": 0 }, 
                  { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.4, ease: "power2.out" }
              );
              tl.to(heading, { "--rule": 1, duration: 0.5, ease: "power3.out" }, "<0.2");
          }

          // Animate paragraph words with blur effect
          tl.fromTo(words, 
              { y: 12 * dir, opacity: 0, filter: "blur(8px) brightness(30%)" },
              {
                  y: 0,
                  opacity: 1,
                  filter: "blur(0px) brightness(100%)",
                  duration: 0.4,
                  stagger: 0.02,
                  ease: "power2.out"
              }, 
              heading ? "<-0.4" : 0
          );


          if (typeof targetVal === "number") {
              tl.to(currencyObj, {
                  value: targetVal,
                  duration: 0.6,
                  ease: "power2.out",
                  onUpdate: updateCurrency
              }, 0);
              tl.fromTo(currencyVal,
                  { scale: 1.06, opacity: 0.35, filter: "blur(10px)" },
                  { scale: 1, opacity: 1, filter: "blur(0px)", duration: 0.7, ease: "power3.out" },
              0);
          }

          return tl;
      }

      function animateOutToDim(targetEl, dir = 1) {
          const heading = targetEl.querySelector(".build-content-list-single h3");
          const words = targetEl.querySelectorAll(".blur-text .word");

          gsap.killTweensOf([targetEl, heading, words]);

          const targetsToAnimate = heading ? [heading, ...words] : words;

          const tl = gsap.timeline();
          
          tl.to(targetsToAnimate, {
              y: -10 * dir,
              opacity: 0,
              filter: "blur(6px) brightness(30%)",
              duration: 0.25,
              ease: "power2.inOut"
          }).to(targetEl, { autoAlpha: 0, duration: 0.1 });

          if (heading) {
              tl.to(heading, { "--rule": 0, duration: 0.2, ease: "power2.in" }, 0);
          }

          return tl;
      }

      gsap.set([itemOne, itemTwo, itemThree], { autoAlpha: 0 });
      animateIn(initialContent);

      const mainTl = gsap.timeline({
          scrollTrigger: {
              trigger: section,
              start: "top top",
              end: "+=350%",
              pin: true,
              scrub: true,
              invalidateOnRefresh: true
          }
      });

      mainTl.to({}, { duration: 1 });

      mainTl.to({}, { duration: 0.1 })
            .to({}, {
                duration: 0.1,
                onStart: () => {
                    animateOutToDim(initialContent);
                    gsap.to(currencyWrapper, { autoAlpha: 1, duration: 0.2 });
                    animateIn(itemOne, 12000);
                },
                onReverseComplete: () => {
                    gsap.to(currencyWrapper, { autoAlpha: 0, duration: 0.2 });
                    animateOutToDim(itemOne, -1);
                    animateIn(initialContent, undefined, -1);
                    
                    gsap.killTweensOf(currencyObj);
                    gsap.to(currencyObj, {
                        value: 0,
                        duration: 0.3,
                        onUpdate: updateCurrency
                    });
                }
            });
      // STEP 2: Trigger Stage 2 ($22,000 + Item 2)
      mainTl.to({}, { duration: 1 })
            .to({}, {
                duration: 0.1,
                onStart: () => {
                    animateOutToDim(itemOne);
                    animateIn(itemTwo, 22000);
                },
                onReverseComplete: () => {
                    animateOutToDim(itemTwo, -1);
                    animateIn(itemOne, 12000, -1);
                }
            });
      // STEP 3: Trigger Stage 3 ($45,000 + Item 3)
      mainTl.to({}, { duration: 1 })
            .to({}, {
                duration: 0.1,
                onStart: () => {
                    animateOutToDim(itemTwo);
                    animateIn(itemThree, 45000);
                },
                onReverseComplete: () => {
                    animateOutToDim(itemThree, -1);
                    animateIn(itemTwo, 22000, -1);
                }
            })
            .to({}, { duration: .7 });

      gsap.to(mainText, {
          top: "5%",
          transform: "translateY(0%)",
          ease: "none",
          scrollTrigger: {
              trigger: section,
              start: "top top",
              end: () => "+=" + Math.round(section.offsetHeight * 0.45 - mainText.offsetHeight * 0.5),
              scrub: true,
              invalidateOnRefresh: true
          }
      });
  }

 
  /*==========================================================
      STATS CARDS- DIAGONAL CONVEYOR STREAM
  =========================================================== */
  function initStatsCardsScroll() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const section = document.querySelector('.tl-stats-cards');
    const grid = document.querySelector('.tl-stats-cards .stats-cards-grid');
    if (!section || !grid) return;

    const boxes = Array.from(
      section.querySelectorAll('.single-glass-card, .stats-jf-logo, .stats-zara-logo, .stats-zara-img')
    );
    if (!boxes.length) return;

    const ANGLE = 33 * Math.PI / 180;
    const ux = Math.cos(ANGLE), uy = Math.sin(ANGLE);
    const nx = -uy, ny = ux;
    const GAIN_DESKTOP = 1.25;
    const GAIN_MOBILE = 1.0;
    const LATE_UNIT = 2.2;
    const END_GAP = 80;

    const FORMATION = [
      { x: 40, y: 38, s: 1.00, v: 1.10 },
      { x: 61, y: 95, s: 1.00, v: 0.92 },
      { x: 86, y: 105, s: 1.00, v: .85 },
      { x: 72, y: 55, s: 1.00, v: 0.95 },
      /* zara — one beat later */
      { x: 50, y: 70, s: 1.00, v: 0.94, t: 0.40 },
      { x: 75, y: 125, s: 1.00, v: 1.08, t: 0.40 },
      { x: 110, y: 150, s: 1.00, v: 0.92, t: 0.40 },
      { x: 50, y: 120, s: 1.00, v: 1.10, t: 0.40 },
      { x: 100, y: 75, s: 1.00, v: 0.70, t: 0.40 }
    ];
    /* (MOBILE, below 768px)   */
    const FORMATION_MOBILE = [
      /* falafel — in place when the section arrives */
      { x: 38, y: 17, s: 1.25, v: 1.10 },
      { x: 62, y: 62, s: 1.25, v: 0.92 },
      { x: 108, y: 92, s: 1.25, v: .85 },
      { x: 96, y: 32, s: 1.25, v: 0.85 },
      /* zara — one beat later */
      { x: 45, y: 35, s: 1.25, v: 0.94, t: 0.50 },
      { x: 96, y: 78, s: 1.25, v: 1.06, t: 0.50 },
      { x: 155, y: 94, s: 1.25, v: 0.92, t: 0.50 },
      { x: 40, y: 78, s: 1.25, v: 1.10, t: 0.50 },
      { x: 120, y: 46, s: 1.6, v: 0.70, t: 0.50 } 
    ];

    const stage = document.createElement('div');
    stage.className = 'stats-stage';
    stage.innerHTML =
      '<div class="stats-stage-blobs"></div>' +
      '<div class="stats-world"></div>';
    section.appendChild(stage);
    section.classList.add('stats-stream-on');

    const world = stage.querySelector('.stats-world');
    const blobs = stage.querySelector('.stats-stage-blobs');

    const items = boxes.map((el, i) => {
      const holder = document.createElement('div');
      holder.className = 'stats-item';
      world.appendChild(holder);
      holder.appendChild(el);
      return { el, holder, idx: i, w: 0, h: 0, rad: 0, X: 0, Y: 0, sc: 1 };
    });

    let vw = 0, vh = 0, span = 0, Smin = 0, travel = 0;

    function measure() {
      vw = window.innerWidth;
      vh = window.innerHeight;

      span = vw * Math.abs(ux) + vh * Math.abs(uy);

      items.forEach((r) => {
        r.w = r.el.offsetWidth;
        r.h = r.el.offsetHeight;
        r.rad = Math.hypot(r.w, r.h) / 2;
      });

      let fit = 0.83 * clamp(vw / 1440, 0.55, 1);
      if (vw < 768) {

        const hScale = clamp(vh / 750, 0.72, 1.0);
        fit *= hScale;
      }
      items.forEach((r) => { r.fit = fit; });

      Smin = span * 0.18;

      const F = vw < 768 ? FORMATION_MOBILE : FORMATION;
      items.forEach((r) => {
        const c = F[r.idx] || { x: 50, y: 50, s: 1 };
        const dx = (c.x / 100) * vw - vw / 2;
        const dy = (c.y / 100) * vh - vh / 2;
        r.lane = dx * nx + dy * ny;
        r.depth = clamp(1 + ((c.s || 1) - 1) / 0.42, 0.85, 1.25);
        r.vel = clamp(c.v || 1, 0.5, 1.5); 
        const form = Smin + (c.t || 0) * LATE_UNIT * span;
        r.spot = ((dx * ux + dy * uy) + form * r.depth * r.vel) / span;
      });

      const tail = 0.10;
      const gain = vw < 768 ? GAIN_MOBILE : GAIN_DESKTOP;
      let Smax = 0;
      items.forEach((r) => {
        Smax = Math.max(Smax, (r.spot * span + span * tail) / (r.depth * r.vel));
      });

      const slot = stage.parentElement === section ? stage : stage.parentElement;
      const floor = vh - slot.offsetTop - END_GAP;
      items.forEach((r) => {
        const sc = r.fit * (1 + (r.depth - 1) * 0.42);
        const hw = r.w * sc / 2, hh = r.h * sc / 2;
        const rate = r.depth * r.vel;
        const a = r.spot * span - Smax * rate;
        const X = vw / 2 + ux * a + nx * r.lane;
        const Y = vh / 2 + uy * a + ny * r.lane;
        if (X + hw <= 0 || X - hw >= vw || Y + hh <= floor) return;
        Smax += Math.min(
          (Y + hh - floor) / (uy * rate),
          (X + hw) / (ux * rate)
        );
      });
      travel = Smax - Smin;

      section.style.height = Math.round(travel / gain + vh) + 'px';
    }

    let target = 0;

    function render() {
      const S = Smin + target;
      const cx = vw / 2, cy = vh / 2;

      const bp = -S * 0.42;
      blobs.style.transform =
        'translate3d(' + (bp * ux).toFixed(2) + 'px, ' + (bp * uy).toFixed(2) + 'px, 0)';
      items.forEach((r) => {
        const a = r.spot * span - S * r.depth * r.vel;
        const p = r.lane;
        r.X = cx + ux * a + nx * p;
        r.Y = cy + uy * a + ny * p;
        r.sc = r.fit * (1 + (r.depth - 1) * 0.42);

        r.holder.style.transform =
          'translate3d(' + r.X.toFixed(2) + 'px, ' + r.Y.toFixed(2) + 'px, 0)' +
          ' scale(' + r.sc.toFixed(4) + ')' +
          ' translate(-50%, -50%)';
      });
    }

    measure();

    ScrollTrigger.addEventListener('refreshInit', measure);

    ScrollTrigger.create({
      id: 'statsCardsStream',
      trigger: section,
      start: 'top top',
      end: 'bottom bottom',
      pin: stage,
      pinSpacing: false,
      invalidateOnRefresh: true,
      refreshPriority: 2,
      onUpdate: (self) => {
        target = self.progress * travel;
        render();
      },
      onRefresh: (self) => {
        target = self.progress * travel;
        render();
      }
    });

    section.querySelectorAll('img').forEach((img) => {
      if (!img.complete) {
        img.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
      }
    });

    render();
  }

  
  /*==========================================================
      SAFE UNIFIED INITIALIZATION & SCROLL SYNC
  =========================================================== */
  function initAllAboutAnimations() {
    try {
      initHeroScrollAnimation();
    } catch (e) {
      console.warn('[initAllAboutAnimations] initHeroScrollAnimation failed:', e);
    }

    try {
      initStatsCardsScroll();
    } catch (e) {
      console.warn('[initAllAboutAnimations] initStatsCardsScroll failed:', e);
    }

    try {
      cardAppearScroll();
    } catch (e) {
      console.warn('[initAllAboutAnimations] cardAppearScroll failed:', e);
    }

    try {
      initBuildAroundAnimation();
    } catch (e) {
      console.warn('[initAllAboutAnimations] initBuildAroundAnimation failed:', e);
    }


    if (typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.sort();
      ScrollTrigger.refresh();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllAboutAnimations);
  } else {
    initAllAboutAnimations();
  }

  window.addEventListener('load', () => {
    if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
  });

})(jQuery);