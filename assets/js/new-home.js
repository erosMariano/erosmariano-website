(function () {

  if (typeof ScrollTrigger !== "undefined") {
    ScrollTrigger.config({ ignoreMobileResize: true });
  }

  /*==========================================================
      GLOBAL WIDTH-GATED RESIZE -> ScrollTrigger.refresh
  =========================================================== */
  const __refreshHooks = [];
  window.__registerRefreshHook = (fn) => { if (typeof fn === 'function') __refreshHooks.push(fn); };
  let __lastWidth = window.innerWidth;
  let __resizeTimer = null;
  window.addEventListener('resize', () => {
      if (window.innerWidth === __lastWidth) return;
      __lastWidth = window.innerWidth;
      clearTimeout(__resizeTimer);
      __resizeTimer = setTimeout(() => {
          for (let i = 0; i < __refreshHooks.length; i++) {
              try { __refreshHooks[i](); } catch (e) { /* keep going */ }
          }
          if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
      }, 200);
  });

  // INITIAL ENTRY POINT
    loadingAnimation();

    function primeTrailVeil() {
        const canvas = document.getElementById("motion-trail-overlay");
        if (!canvas) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
        const w = window.innerWidth || canvas.clientWidth || 1;
        const h = window.innerHeight || canvas.clientHeight || 1;
        canvas.width = Math.max(1, Math.round(w * dpr));
        canvas.height = Math.max(1, Math.round(h * dpr));
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function startBannerExperience() {
        bannerTextInit().then(() => {
            initAllScrollAnimations();
            const trailControl = bannerMotionTrail();
            trailControl.triggerAutoTrail();
            trailControl.startIntervalTimer();
        });
    }



    /*==========================================================
        1. LOADING ANIMATION
    ===========================================================*/
    function runSplitText(selector) {
        if (typeof SplitText !== "undefined" && document.querySelector(selector)) {
            return new SplitText(selector, { type: "lines, words, chars" });
        }
    }
    
    function loadingAnimation() {
        const loader = document.querySelector('.ta-loader');
        const progressBar = document.getElementById('eros-loader-bar');
        const percentText = document.getElementById('eros-loader-percent');

        function unlockAllScroll() {
            document.documentElement.classList.remove('is-loading');
            document.body.classList.remove('no-scroll', 'home-no-scroll');
            $('body').removeClass('no-scroll home-no-scroll');
            $('html').removeClass('is-loading');
            if (typeof window.resumeLenis === 'function') window.resumeLenis();
            if (window.lenis && typeof window.lenis.start === 'function') window.lenis.start();
            if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
        }

        if (loader) {
            let startTime = performance.now();
            const totalDuration = 2200; // lets the logo write-on animation finish

            function step(now) {
                const elapsed = now - startTime;
                const progress = Math.min(100, Math.round((elapsed / totalDuration) * 100));

                if (progressBar) progressBar.style.width = progress + '%';
                if (percentText) percentText.textContent = progress + '%';

                if (progress < 100) {
                    requestAnimationFrame(step);
                } else {
                    setTimeout(() => {
                        primeTrailVeil();
                        gsap.to(loader, {
                            duration: 0.45,
                            autoAlpha: 0,
                            ease: "power2.inOut",
                            onComplete: () => {
                                loader.style.display = 'none';
                                $('body').addClass('peloader-done loaded');
                                unlockAllScroll();
                                startBannerExperience();
                            }
                        });
                    }, 120);
                }
            }

            requestAnimationFrame(step);

            // Safety timeout
            setTimeout(() => {
                if (loader && loader.style.display !== 'none') {
                    unlockAllScroll();
                    loader.style.display = 'none';
                    $('body').addClass('peloader-done loaded');
                    startBannerExperience();
                }
            }, 4200);
        } else {
            unlockAllScroll();
            startBannerExperience();
        }
    }


     /*==========================================================
        SAFARI: HOLD WHEEL INPUT FROM LENIS DURING THE SCROLL HAND-OFF
    ===========================================================*/
    let wheelHold = 0; 

    function onHeldWheel(e) {
        // Keep wheel scroll completely free
        return;
    }

    function holdWheelFromLenis() {
        // No-op to prevent locking scroll
    }

    function releaseWheelToLenis() {
        // No-op
    }





    /*========================================================
        2. BANNER TEXT ANIMATION
    ===========================================================*/
    function bannerTextInit() {
        return new Promise((resolve) => {
            const splittingOutput = Splitting({ target: '.anime-text-transition' });
            const texts = [...document.querySelectorAll('.anime-text-transition')];
            
            if (!texts.length) {
                $('body').removeClass('home-no-scroll');
                if (typeof ScrollTrigger !== 'undefined') {
                    requestAnimationFrame(() => ScrollTrigger.refresh());
                }
                resolve();
                return;
            }

            const chars = texts.map(text => {
                const words = text.querySelectorAll('.word');
                return [...words].map(word => word.querySelectorAll('.char'));
            });

            const revealText = (textPos) => {
                const words = (splittingOutput && splittingOutput[textPos] && splittingOutput[textPos].words) ? splittingOutput[textPos].words : [];
                const tl = gsap.timeline();

                if (texts[textPos]) texts[textPos].classList.add('is-current');

                if (!words.length || !chars[textPos]) {
                    return tl;
                }

                words.forEach((_, wordIndex) => {
                    if (!chars[textPos][wordIndex]) return;
                    const wordTl = gsap.timeline().fromTo(
                        chars[textPos][wordIndex],
                        { transformOrigin: '50% 100%', scaleY: 0, force3D: true },
                        {
                            duration: 0.6,
                            ease: 'power4',
                            scaleY: 1,
                            force3D: true,
                            stagger: { each: 0.03, from: 'start' }
                        }
                    );
                    tl.add(wordTl, wordIndex * 0.03);
                });

                return tl;
            };

            const textTl = revealText(0);

            const animations = [
                { selector: '.motion-trail-hero .tl-banner-description', delay: 300 },
                { selector: '.motion-trail-hero .tl-banner-bottom-left', delay: 800 },
                { selector: '.motion-trail-hero .tl-banner-bottom-right', delay: 1200 },
            ];

            animations.forEach(({ selector, delay }) => {
                setTimeout(() => {
                    document.querySelector(selector)?.classList.add('visible');
                }, delay);
            });

            textTl.then(() => {
              setTimeout(() => {
                // 1. Unlock scroll and refresh layout
                $('body').removeClass('home-no-scroll');
                if (typeof ScrollTrigger !== 'undefined') {
                    ScrollTrigger.refresh();
                }
              }, 300);

              setTimeout(() => {
                  if (typeof ScrollTrigger !== 'undefined') {
                      ScrollTrigger.refresh();
                  }
                  resolve();
              }, 400);
          });
        });
    }



    /*==========================================================
        3. HOME MOTION TRAIL EFFECT
    ===========================================================*/
    function bannerMotionTrail() {
        const canvas = document.getElementById("motion-trail-overlay");
        const hero = document.getElementById("motion-trail-hero");

        if (!canvas || !hero) return { triggerAutoTrail: () => {}, startIntervalTimer: () => {}, stopIntervalTimer: () => {} };

        hero.style.touchAction = "pan-y";
        canvas.style.touchAction = "pan-y";

        const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
        const HOLE_DIAMETER  = 220;
        const TRAIL_LIFETIME = 800;
        const FADE_IN_TIME   = 100;
        const IDLE_TIMEOUT   = 120;
        const SMOOTHING      = 0.30;
        const MIN_MOVE_PX    = 4;
        const HOLE_RADIUS    = HOLE_DIAMETER / 1.5;

        const BLOB_COUNT      = 5;
        const BLOB_SPREAD     = 0.55;
        const BLOB_MIN_SCALE  = 0.40;
        const BLOB_MAX_SCALE  = 0.95;
        const DISPERSE_AMOUNT = 0.7;

        const maxPuffRadius = HOLE_RADIUS * BLOB_MAX_SCALE * (1 + DISPERSE_AMOUNT);
        const puffCanvas = document.createElement("canvas");
        const textureDPR = 1.5; 
        const basePuffSize = Math.ceil(maxPuffRadius * 2);
        puffCanvas.width = basePuffSize * textureDPR;
        puffCanvas.height = basePuffSize * textureDPR;
        
        const puffCtx = puffCanvas.getContext("2d");
        puffCtx.scale(textureDPR, textureDPR);

        const centerX = basePuffSize / 2;
        const centerY = basePuffSize / 2;
        const maxR = basePuffSize / 2;

        const grad1 = puffCtx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxR);
        grad1.addColorStop(0, "rgba(0,0,0,1)");
        grad1.addColorStop(0.5, "rgba(0,0,0,0.5)");
        grad1.addColorStop(1, "rgba(0,0,0,0)");
        puffCtx.fillStyle = grad1;
        puffCtx.fillRect(0, 0, basePuffSize, basePuffSize);

        puffCtx.globalCompositeOperation = 'source-atop';
        puffCtx.fillStyle = "rgba(0,0,0,0.8)";
        for (let i = 0; i < 6; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = maxR * 0.4;
            const px = centerX + Math.cos(angle) * dist;
            const py = centerY + Math.sin(angle) * dist;
            const pr = maxR * (0.3 + Math.random() * 0.3);
            
            puffCtx.beginPath();
            puffCtx.arc(px, py, pr, 0, Math.PI * 2);
            puffCtx.fill();
        }

        let trail = [];
        let targetX = null, targetY = null;
        let smoothX = 0, smoothY = 0;
        let hasSmoothPos = false;   
        let lastPushedX = null, lastPushedY = null;
        
        let idleTimer = null;
        let autoTriggerInterval = null;
        let isUserInteracting = false;
        let isHeroVisible = true;
        let rafRunning = false;
        let heroRect = hero.getBoundingClientRect();

        function updateRect() {
            heroRect = hero.getBoundingClientRect();
        }

        let rectReadQueued = false;
        function queueRectUpdate() {
            if (rectReadQueued) return;
            rectReadQueued = true;
            requestAnimationFrame(() => {
                rectReadQueued = false;
                updateRect();
            });
        }

        function drawWhiteBase() {
            ctx.clearRect(0, 0, heroRect.width, heroRect.height);
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, heroRect.width, heroRect.height);
        }

        const ctx = canvas.getContext("2d");

        function resize() {
            updateRect();
            canvas.width = heroRect.width * dpr;
            canvas.height = heroRect.height * dpr;
            canvas.style.width = heroRect.width + "px";
            canvas.style.height = heroRect.height + "px";
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            drawWhiteBase();
            trail = [];
            lastPushedX = lastPushedY = null;
        }

        let resizeTimer = null;
        function debouncedResize() {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(resize, 100);
        }

        resize();

        const resizeObserver = new ResizeObserver(() => {
            debouncedResize();
        });
        resizeObserver.observe(hero);

        window.addEventListener("orientationchange", debouncedResize, { passive: true });
        document.addEventListener("visibilitychange", () => {
            if (!document.hidden) debouncedResize();
        });

        function makeBlobCluster() {
            const blobs = [];
            for (let i = 0; i < BLOB_COUNT; i++) {
                blobs.push({
                    angle: Math.random() * Math.PI * 2,
                    dist: Math.random() * BLOB_SPREAD,
                    scale: BLOB_MIN_SCALE + Math.random() * (BLOB_MAX_SCALE - BLOB_MIN_SCALE),
                    driftSpeed: (Math.random() - 0.5) * 0.0015,
                    phase: Math.random() * Math.PI * 2 
                });
            }
            return blobs;
        }

        function updatePointer(x, y, userInitiated = true) {
            if (userInitiated) {
                isUserInteracting = true;
            }

            targetX = x - heroRect.left;
            targetY = y - heroRect.top;

            if (!hasSmoothPos) {
                smoothX = targetX;
                smoothY = targetY;
                hasSmoothPos = true;
            }

            clearTimeout(idleTimer);
            idleTimer = setTimeout(() => { 
                targetX = targetY = null; 
                if (userInitiated) isUserInteracting = false;
            }, IDLE_TIMEOUT);

            if (!rafRunning) {
                rafRunning = true;
                requestAnimationFrame(loop);
            }
        }

        function clearPointer() {
            clearTimeout(idleTimer);
            targetX = targetY = null;
            hasSmoothPos = false;
            isUserInteracting = false;
        }

        function handlePointer(e) {
            if (!hasSmoothPos) {
                updateRect();
            } else {
                queueRectUpdate();
            }
            updatePointer(e.clientX, e.clientY, true);
        }

        hero.addEventListener("pointerdown", handlePointer, { passive: true });
        hero.addEventListener("pointermove", handlePointer, { passive: true });
        hero.addEventListener("pointerup", clearPointer, { passive: true });
        hero.addEventListener("pointercancel", clearPointer, { passive: true });
        hero.addEventListener("pointerleave", clearPointer, { passive: true });

        function triggerAutoTrail() {
            if (isUserInteracting || !isHeroVisible) return;

            stopIntervalTimer();

            updateRect();
            if (canvas.width === 0 || canvas.height === 0) {
                resize();
            }

            trail.length = 0;
            lastPushedX = lastPushedY = null;
            const startX = heroRect.width * 0.25;
            const endX = heroRect.width * 0.75;
            const startY = heroRect.height * 0.45;
            const endY = heroRect.height * 0.55;
            smoothX = startX;
            smoothY = startY;
            hasSmoothPos = true;

            const duration = 1000;
            const startTime = performance.now();

            function animateAutoStep(now) {
                if (isUserInteracting) return;

                const elapsed = now - startTime;
                const progress = Math.min(1, elapsed / duration);
                
                const easeProgress = progress < 0.5 
                    ? 4 * progress * progress * progress 
                    : 1 - Math.pow(-2 * progress + 2, 3) / 2;

                targetX = startX + (endX - startX) * easeProgress;
                targetY = startY + (Math.sin(progress * Math.PI) * 40) + (endY - startY) * easeProgress;

                clearTimeout(idleTimer);
                idleTimer = setTimeout(() => { 
                    targetX = targetY = null; 
                }, IDLE_TIMEOUT);

                if (!rafRunning) {
                    rafRunning = true;
                    requestAnimationFrame(loop);
                }

                if (progress < 1) {
                    requestAnimationFrame(animateAutoStep);
                } else {
                    clearTimeout(idleTimer);
                    targetX = targetY = null;
                    startIntervalTimer(); 
                }
            }
            requestAnimationFrame(animateAutoStep);
        }

        function startIntervalTimer() {
            const isMobile = window.matchMedia("(max-width: 767px), (pointer: coarse)").matches;
            if (isMobile) return;

            stopIntervalTimer();

            autoTriggerInterval = setInterval(() => {
                if (isHeroVisible && !isUserInteracting) {
                    triggerAutoTrail();
                }
            }, 10000);
        }

        function stopIntervalTimer() {
            if (autoTriggerInterval) {
                clearInterval(autoTriggerInterval);
                autoTriggerInterval = null;
            }
        }

          const observer = new IntersectionObserver((entries) => {
              entries.forEach(entry => {
                  isHeroVisible = entry.isIntersecting;
                  if (!isHeroVisible) {
                      stopIntervalTimer();
                  }

              });
          }, { threshold: 0.1 });

          observer.observe(hero);

        function loop(timestamp) {
            const now = timestamp || performance.now();

            if (!isHeroVisible) {
                trail.length = 0;
                lastPushedX = lastPushedY = null;
                hasSmoothPos = false;
                drawWhiteBase();
                rafRunning = false;
                return;
            }

            if (targetX !== null) {
                smoothX += (targetX - smoothX) * SMOOTHING;
                smoothY += (targetY - smoothY) * SMOOTHING;

                const dist = lastPushedX === null ? Infinity : Math.hypot(smoothX - lastPushedX, smoothY - lastPushedY);
                if (dist > MIN_MOVE_PX) {
                    trail.push({
                        x: smoothX,
                        y: smoothY,
                        time: now,
                        blobs: makeBlobCluster()
                    });
                    lastPushedX = smoothX;
                    lastPushedY = smoothY;
                }
            }

            let activeIndex = 0;
            for (let i = 0; i < trail.length; i++) {
                if (now - trail[i].time < TRAIL_LIFETIME) {
                    trail[activeIndex++] = trail[i];
                }
            }
            trail.length = activeIndex;

            ctx.globalCompositeOperation = "source-over";
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, heroRect.width, heroRect.height);

            ctx.globalCompositeOperation = "destination-out";

            for (let i = 0; i < trail.length; i++) {
                const p = trail[i];
                const age = now - p.time;
                const lifeProgress = Math.min(1, age / TRAIL_LIFETIME);
                const fadeOut = Math.max(0, 1 - lifeProgress);
                const fadeIn = Math.min(1, age / FADE_IN_TIME);
                const opacity = fadeOut * fadeIn;
                const baseDisperse = 1 + lifeProgress * DISPERSE_AMOUNT;

                if (opacity < 0.0039) continue;

                for (let b = 0; b < p.blobs.length; b++) {
                    const blob = p.blobs[b];
                    const oscillate = 1 + Math.sin(age * 0.005 + blob.phase) * 0.1;
                    const currentDisperse = baseDisperse * oscillate;

                    const angle = blob.angle + age * blob.driftSpeed;
                    const offsetDist = blob.dist * HOLE_RADIUS * currentDisperse;
                    const bx = p.x + Math.cos(angle) * offsetDist;
                    const by = p.y + Math.sin(angle) * offsetDist;
                    
                    const radius = blob.scale * HOLE_RADIUS * currentDisperse;
                    const diameter = radius * 2;

                    ctx.globalAlpha = opacity * (0.70 + blob.scale * 0.30);
                    
                    ctx.drawImage(
                        puffCanvas,
                        bx - radius,
                        by - radius,
                        diameter,
                        diameter
                    );
                }
            }

            ctx.globalAlpha = 1.0;
            ctx.globalCompositeOperation = "source-over";

            if (trail.length > 0 || targetX !== null) {
                requestAnimationFrame(loop);
            } else {
                rafRunning = false;
                lastPushedX = lastPushedY = null;
            }
        }

        return { triggerAutoTrail, startIntervalTimer, stopIntervalTimer };
    }

    function initAllScrollAnimations() {
        if (typeof init3DCarouselSequence === 'function') init3DCarouselSequence();
        if (typeof initScrollCardAnimation === 'function') initScrollCardAnimation();
        if (typeof setupCombinedScrollAnimation === 'function') setupCombinedScrollAnimation();

        requestAnimationFrame(() => {
            if (typeof ScrollTrigger !== 'undefined') {
                ScrollTrigger.sort();
                ScrollTrigger.refresh();
            }
        });
    }


  /*==========================================================
            3d carousel effect
    ===========================================================*/
   const init3DCarouselSequence = () => {
    const section = document.querySelector('.carousle-3d');
    if (!section) return;

    section.style.touchAction = 'pan-y';
    section.querySelectorAll('.carousle-3d-images-wrapper, .image-anchor, .single-3d-image').forEach((el) => {
      el.style.touchAction = 'pan-y';
    });

    if (typeof Splitting === 'function') {
      Splitting({ target: ['.carousle-content-middle h3', '.carousle-intro h2'] });
    }

    const textBlocks = gsap.utils.toArray('.inner-content-3d');
    const imageRings = gsap.utils.toArray('.carousle-3d-images-wrapper');

    if (!textBlocks.length || !imageRings.length || textBlocks.length !== imageRings.length) {
      console.warn('[carousle-3d] Expected matching textBlocks/imageRings; skipping init.');
      return;
    }

    const cardSizeVW = 10;
    let radiusFactor = 350;
    let verticalArcFactor = 85;
    const maxWrapperTilt = 3;

    let radius = 380;
    let verticalArc = 85;

    const recalcGeometry = () => {
      const vw = window.innerWidth;
      const isMobile = vw < 768;

      if (isMobile) {
        radius = 150;
        verticalArc = 28;
        document.documentElement.style.setProperty('--img-w', `${vw * 0.22}px`);
        document.documentElement.style.setProperty('--img-h', `${vw * 0.22}px`);
      } else {
        if (vw >= 2500) {
          radiusFactor = 450;
        } else if (vw > 1921) {
          radiusFactor = 400;
        } else {
          radiusFactor = 350;
        }

        const scale = gsap.utils.clamp(0.55, 1, vw / 1200);
        radius = radiusFactor * scale;
        verticalArc = verticalArcFactor * scale;
        const imgSize = (vw * cardSizeVW) / 100;
        document.documentElement.style.setProperty('--img-w', `${imgSize}px`);
        document.documentElement.style.setProperty('--img-h', `${imgSize}px`);
      }
    };

    recalcGeometry();

    const ringCache = new Map();

    const getRingParts = (ring) => {
      let parts = ringCache.get(ring);
      if (!parts) {
        const anchors = Array.from(ring.querySelectorAll('.image-anchor'));
        parts = {
          setRotation: gsap.quickSetter(ring, 'rotation', 'deg'),
          items: anchors.map((anchor) => ({
            anchor,
            card: anchor.querySelector('.single-3d-image'),
            lastZIndex: null,
          })),
        };
        ringCache.set(ring, parts);
      }
      return parts;
    };

    const update3DRing = (ring, wrapRotation) => {
      const { setRotation, items } = getRingParts(ring);
      const count = items.length;
      if (!count) return;

      const step = 360 / count;
      const radRotation = (wrapRotation * Math.PI) / 180;

      setRotation(Math.sin(radRotation * 2) * -maxWrapperTilt);

      for (let i = 0; i < count; i++) {
        const item = items[i];
        const angle = i * step + wrapRotation;
        const norm = ((angle % 360) + 360) % 360;
        const signed = norm > 180 ? norm - 360 : norm;
        const rad = (signed * Math.PI) / 180;

        const facing = Math.cos(rad);

        const x = Math.sin(rad) * radius;
        const z = Math.cos(rad) * radius;
        const y = facing * verticalArc;

        const tilt = -signed * 0.15;
        const scale = 0.6 + ((facing + 1) / 2) * 0.52;
        const zIndex = Math.round((z + radius) * 10);

        if (item.lastZIndex !== zIndex) {
          item.lastZIndex = zIndex;
          item.anchor.style.zIndex = zIndex;
        }

        if (item.card) {
          item.card.style.transform =
            `translate3d(${x}px, ${y}px, ${z}px) rotateY(${tilt}deg) scale(${scale})`;
        }
      }
    };

    const RING_START_Y = '70vh';

    imageRings.forEach((ring) => {
      update3DRing(ring, 0);
      gsap.set(ring, { y: RING_START_Y, opacity: 1, force3D: true });
    });

    textBlocks.forEach((block, idx) => {
      const h2Chars = block.querySelectorAll('.carousle-intro h2 .char');
      const innerRows = block.querySelectorAll(
        '.carousle-content-top, .carousle-content-middle, .carousle-content-bottom'
      );

      gsap.set(block, {
        autoAlpha: 0,
        y: 0,
      });

      gsap.set(innerRows, { opacity: 0, y: 25 });

      if (h2Chars.length) {
        gsap.set(h2Chars, {
          filter: 'blur(10px) brightness(50%)',
          opacity: 0.3,
          display: 'inline-block',
        });
      }
    });

    const animateHeadingFilter = (textBlock) => {
      const chars = textBlock.querySelectorAll('.carousle-intro h2 .char');
      if (!chars.length) return;

      gsap.killTweensOf(chars);

      gsap.set(chars, {
        filter: 'blur(5px) brightness(50%)',
        opacity: 0.3,
      });

      gsap.to(chars, {
        filter: 'blur(0px) brightness(100%)',
        opacity: 1,
        duration: 0.5,
        stagger: 0.05,
        ease: 'power2.out',
      });
    };

    const animateQuoteChars = (textBlock) => {
      const chars = textBlock.querySelectorAll('.carousle-content-middle h3 .char');
      if (!chars.length) return;
      gsap.killTweensOf(chars);
      gsap.set(chars, { transformOrigin: '50% 100%', scaleY: 0 });
      gsap.to(chars, { scaleY: 1, duration: 0.35, ease: 'power3.out', stagger: 0.012 });
    };

    // ANIMATION: Counter Number
    const animateCounter = (textBlock) => {
      const numEl = textBlock.querySelector('.count-num');
      const target = parseFloat(textBlock.dataset.count) || 0;
      if (!numEl) return;

      if (textBlock._countTween) textBlock._countTween.kill();

      const c = { val: 0 };
      numEl.textContent = '0';
      textBlock._countTween = gsap.to(c, {
        val: target,
        duration: 1.2,
        ease: 'power2.out',
        onUpdate: () => {
          numEl.textContent = Math.round(c.val);
        },
      });
    };

    const triggerBlockAnimation = (block) => {
      const innerRows = block.querySelectorAll(
        '.carousle-content-top, .carousle-content-middle, .carousle-content-bottom'
      );
      gsap.to(innerRows, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'power2.out',
        stagger: 0.08,
        overwrite: 'auto',
      });

      animateHeadingFilter(block);
      animateQuoteChars(block);
      animateCounter(block);
    };

    let activeBlockIndex = -1;
    let blockTransitionTl = null;

    const showBlock = (newIndex) => {
      const nextBlock = textBlocks[newIndex];
      const prevBlock = textBlocks[activeBlockIndex];
      if (!nextBlock) return;

      if (blockTransitionTl) blockTransitionTl.kill();

      blockTransitionTl = gsap.timeline({
        onComplete: () => {
          blockTransitionTl = null;
        },
      });

      if (prevBlock && prevBlock !== nextBlock) {
        const prevChars = prevBlock.querySelectorAll('.carousle-intro h2 .char');

        blockTransitionTl.to(
          prevBlock,
          {
            autoAlpha: 0,
            duration: 0.25,
            ease: 'power2.inOut',
          },
          0
        );

        if (prevChars.length) {
          blockTransitionTl.to(
            prevChars,
            {
              filter: 'blur(5px) brightness(30%)',
              opacity: 0.3,
              duration: 0.25,
              ease: 'power2.inOut',
            },
            0
          );
        }
      }

      blockTransitionTl.to(
        nextBlock,
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.25,
          ease: 'power2.inOut',
        },
        prevBlock && prevBlock !== nextBlock ? 0.08 : 0
      );
    };

    const updateActiveBlockIndex = (newIndex) => {
      if (activeBlockIndex !== newIndex) {
        showBlock(newIndex);
        triggerBlockAnimation(textBlocks[newIndex]);
        activeBlockIndex = newIndex;
      }
    };

    ScrollTrigger.create({
      trigger: section,
      start: 'top 65%',
      onEnter: () => {
        if (activeBlockIndex === -1) {
          updateActiveBlockIndex(0);
        }
      },
      onLeaveBack: () => {
        textBlocks.forEach((block) => {
          const innerRows = block.querySelectorAll(
            '.carousle-content-top, .carousle-content-middle, .carousle-content-bottom'
          );
          gsap.to(innerRows, { opacity: 0, y: 25, duration: 0.3, overwrite: 'auto' });
          gsap.to(block, { autoAlpha: 0, duration: 0.3, overwrite: 'auto' });
        });
        activeBlockIndex = -1;
      },
    });

    const RING_DURATION = 3; 
    const RING_OVERLAP = 0.15;
    const sectionTop = section.getBoundingClientRect().top;
    const sectionHeight = section.offsetHeight;
    const ringTravel = 1.7 * sectionHeight;
    let ringTop = Infinity;
    let ringBottom = -Infinity;
    imageRings[0].querySelectorAll('.single-3d-image').forEach((card) => {
      const rect = card.getBoundingClientRect();
      ringTop = Math.min(ringTop, rect.top - sectionTop);
      ringBottom = Math.max(ringBottom, rect.bottom - sectionTop);
    });
    const ringHiddenAtStart = Math.max(0, (RING_DURATION * (ringTop - sectionHeight)) / ringTravel);
    const ringHiddenAtEnd = Math.max(0, (RING_DURATION * (ringTravel - ringBottom)) / ringTravel);
    const RING_STEP = RING_DURATION - ringHiddenAtStart - ringHiddenAtEnd - RING_OVERLAP;
    const CAROUSEL_DURATION = 2 * RING_STEP + RING_DURATION;

    const BLOCK_2_AT = (RING_DURATION - ringHiddenAtEnd) / CAROUSEL_DURATION;
    const BLOCK_3_AT = (RING_STEP + RING_DURATION - ringHiddenAtEnd) / CAROUSEL_DURATION;

    const CAROUSEL_SCRUB_END = `+=${(500 * CAROUSEL_DURATION) / 9}%`;
    const CAROUSEL_PIN_END = `+=${(500 * CAROUSEL_DURATION) / 9}%`;

    ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: CAROUSEL_PIN_END,
      pin: true,
      anticipatePin: 1,
      refreshPriority: 2,
      invalidateOnRefresh: true,
    });

    const masterTl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: CAROUSEL_SCRUB_END,
        scrub: true,
        refreshPriority: 2,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const progress = self.progress;

          if (progress < BLOCK_2_AT) {
            updateActiveBlockIndex(0);
          } else if (progress >= BLOCK_2_AT && progress < BLOCK_3_AT) {
            updateActiveBlockIndex(1);
          } else if (progress >= BLOCK_3_AT) {
            updateActiveBlockIndex(2);
          }
        },
      },
    });

    const ring1Rot = { deg: 0 };
    const ring2Rot = { deg: 0 };
    const ring3Rot = { deg: 0 };

    masterTl
      .to(imageRings[0], { y: '-100vh', duration: 3, ease: 'none' }, 0)
      .to(
        ring1Rot,
        {
          deg: -360,
          duration: 3,
          ease: 'none',
          onUpdate: () => update3DRing(imageRings[0], ring1Rot.deg),
        },
        0
      );

    masterTl
      .fromTo(
        imageRings[1],
        { y: RING_START_Y },
        { y: '-100vh', duration: 3, ease: 'none', immediateRender: false },
        RING_STEP
      )
      .to(
        ring2Rot,
        {
          deg: -360,
          duration: 3,
          ease: 'none',
          onUpdate: () => update3DRing(imageRings[1], ring2Rot.deg),
        },
        RING_STEP
      );

    masterTl
      .fromTo(
        imageRings[2],
        { y: RING_START_Y },
        { y: '-100vh', duration: 3, ease: 'none', immediateRender: false },
        2 * RING_STEP
      )
      .to(
        ring3Rot,
        {
          deg: -360,
          duration: 3,
          ease: 'none',
          onUpdate: () => update3DRing(imageRings[2], ring3Rot.deg),
        },
        2 * RING_STEP
      );

    if (typeof window.__registerRefreshHook === 'function') {
      window.__registerRefreshHook(recalcGeometry);
    }
  };



  // text color change effect
  document.querySelectorAll('.charismatic-effect').forEach((container) => {
    const text = container.textContent.trim();
    container.innerHTML = text
      .split('')
      .map((char) => {
        if (char === ' ') return ' ';
        return `<span class="char-effect">${char}</span>`;
      })
      .join('');

    const chars = container.querySelectorAll('.char-effect');
    gsap.set(chars, { textShadow: '0px 0px 25px rgba(255, 0, 0, 0)' });
    const tl = gsap.timeline({ paused: true });

    tl.to(chars, {
      duration: 0.1,
      color: '#ffffff',
      textShadow: '0px 0px 25px rgba(255, 0, 0, 1)',
      repeat: 1,
      yoyo: true,
      ease: 'power1.inOut',
      stagger: {
        amount: 0.3,
        from: 'random'
      }
    });

    ScrollTrigger.create({
      trigger: container,
      start: 'top 80%',
      onEnter: () => tl.restart(true),
      onEnterBack: () => tl.restart(true),
    });
  });


  // ==================== SERVICES BACKGROUND SWITCH ====================
  const servicesSection = document.querySelector('.services-section');
  if (servicesSection) {
    let isOffWhite = null;

    const servicesObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const midpoint = entry.rootBounds
          ? entry.rootBounds.bottom
          : window.innerHeight / 2;
        const shouldBeOffWhite = entry.boundingClientRect.top <= midpoint;

        if (shouldBeOffWhite !== isOffWhite) {
          isOffWhite = shouldBeOffWhite;
          servicesSection.classList.toggle('off-white-bg', shouldBeOffWhite);
        }
      }
    }, { rootMargin: '0px 0px -50% 0px', threshold: 0 });

    servicesObserver.observe(servicesSection);
  }


  // Combind section of image vertical scrolling and text
  function setupCombinedScrollAnimation() {
    if (!document.querySelector(".combind-scroll-animation")) return;

    const mainContainer = document.querySelector(".combind-scroll-animation");
    const serviceSection = document.querySelector(".services-section-outer");
    const wrapper = document.querySelector(".scroll-images-wrapper");
    
    const trailController = (typeof initMotionTrail === "function")
      ? initMotionTrail()
      : null;

    document.querySelectorAll(".img-scroll-middle-text .tl-banner-description, .tl-reveal-text-animation h2").forEach((el) => {
      const text = el.textContent.trim();
      if (!text) return;
      const words = text.split(/\s+/);

      el.innerHTML = words
        .map((word) => {
          const letters = word
            .split("")
            .map((char) => `<span class="char" style="display:inline-block;">${char}</span>`)
            .join("");

          return `<span class="word" style="display:inline-block; white-space:nowrap;">${letters}</span>`;
        })
        .join(" ");
    });

    const leftCol = document.querySelector(".tl-scroll-img-left");
    const rightCol = document.querySelector(".tl-scroll-img-right");
    const middleCol = document.querySelector(".tl-scroll-img-middle");
    if (!leftCol || !rightCol || !middleCol) return;

    const isMobile = window.innerWidth < 768;

    const middleImgs = middleCol.querySelectorAll(".middle-img, .moving-img");
    const lastMiddleImg = middleCol.querySelector(".tl-zoom-full-img");
    const beforeLastImgs = Array.from(middleImgs).filter((img) => img !== lastMiddleImg);

    const wrapOne = document.querySelector(".reveal-wrapper-one");
    const wrapTwo = document.querySelector(".reveal-wrapper-two");
    const wrapThree = document.querySelector(".reveal-wrapper-three");

    const getPositions = () => {
      const vh = window.innerHeight;
      const WRAPPER_SCALE = 1.6;

      const leftImgs = leftCol.querySelectorAll(".moving-img");
      const lastLeftImg = leftImgs[leftImgs.length - 1];

      const leftStartY = -(leftCol.offsetHeight - (lastLeftImg ? lastLeftImg.offsetHeight : 0));

      const leftImg1 = leftImgs[0];
      const leftGap = parseFloat(getComputedStyle(leftCol).gap) || 0;
      const leftGapCenterInColumn = (leftImg1 ? leftImg1.offsetHeight : 0) + leftGap / 2;
      const leftTargetY = vh / (2 * WRAPPER_SCALE) - leftGapCenterInColumn;

      const firstMiddleImg = middleImgs[0];
      const middleFirstH = firstMiddleImg ? firstMiddleImg.offsetHeight : 0;
      const middleStartY = vh - middleFirstH;

      const middleGap = parseFloat(getComputedStyle(middleCol).gap) || 0;
      const middleTargetStage1Y = vh / 2 - (middleFirstH + middleGap / 2);

      return { leftStartY, leftTargetY, middleStartY, middleTargetStage1Y };
    };

    const getMiddleColEnd = () => {
      const w = window.innerWidth;
      return w < 768 ? "5%" : w < 1024 ? "-38%" : w < 1280 ? "-35%" : "-40%";
    };

    const getScaleValue = () => {
      const w = window.innerWidth;
      return w < 768 ? 12 : w < 1024 ? 7 : w < 1280 ? 6 : 4.5;
    };

    const getBeforeLastImgTopVal = () => {
      const w = window.innerWidth;
      return w < 768 ? "-35%" : w < 1024 ? "10%" : w < 1280 ? "25%" : "30%";
    };

    gsap.set([wrapOne, wrapTwo, wrapThree], {
      xPercent: -50,
      yPercent: -50,
      left: "50%",
      top: "50%",
      opacity: 0,
      scale: 1.15,
      willChange: "transform, opacity"
    });

    if (lastMiddleImg) {
      gsap.set(lastMiddleImg, { willChange: "transform" });
    }

    const initialPos = getPositions();
    gsap.set([leftCol, rightCol], { y: initialPos.leftStartY });
    gsap.set(middleCol, { y: initialPos.middleStartY });

    const VH_PER_TL_SECOND = 115;
    const TEXT_REVEAL_SCROLL_FACTOR = 0.6;
    const PIN_RELEASE_LEAD = 0.2 * TEXT_REVEAL_SCROLL_FACTOR;
    const tl = gsap.timeline();
    const getServicesScrollVh = () => {
      if (!serviceSection) return 100;
      return Math.max(100, (serviceSection.offsetHeight / window.innerHeight) * 100);
    };
    const STAGE_0_DURATION = getServicesScrollVh() / VH_PER_TL_SECOND;
    if (serviceSection) {
      gsap.to(serviceSection, {
        yPercent: -100,
        ease: "none",
        scrollTrigger: {
          trigger: mainContainer,
          start: "top top",
          end: () => `+=${Math.round(STAGE_0_DURATION * VH_PER_TL_SECOND)}%`,
          scrub: true,
          invalidateOnRefresh: true
        }
      });
    }

    const stage1Start = STAGE_0_DURATION;
    tl.to(".moving-col", { gap: "40vh", ease: "none", duration: 0.6 }, stage1Start);
    tl.to([leftCol, rightCol], { y: () => getPositions().leftTargetY, ease: "none", duration: 0.6 }, stage1Start);
    tl.to(middleCol, { y: () => getPositions().middleTargetStage1Y, ease: "none", duration: 0.6 }, stage1Start);

    const stage2Start = stage1Start + 0.6;
    tl.to(".moving-col", { gap: "10vh", ease: "none", duration: 0.6 }, stage2Start);
    tl.to(wrapper, { scale: 1.6, transformOrigin: "center center", ease: "none", duration: 0.6 }, stage2Start);
    tl.to([leftCol, rightCol], { y: () => getPositions().leftTargetY, ease: "none", duration: 0.6 }, stage2Start);
    tl.to(middleCol, { y: () => getMiddleColEnd(), ease: "none", duration: 0.6 }, stage2Start);

    const stage3Start = stage2Start + 0.6;
    if (isMobile) {
      tl.to(".left-beforelast", { xPercent: -100, ease: "none", duration: 0.3 }, stage3Start);
      tl.to(".right-beforelast", { xPercent: 100, ease: "none", duration: 0.3 }, stage3Start);
      tl.to(beforeLastImgs, { yPercent: -220, ease: "none", duration: 0.3 }, stage3Start);
    } else {
      tl.to(leftCol, { x: "-35%", ease: "none", duration: 0.3 }, stage3Start);
      tl.to(rightCol, { x: "35%", ease: "none", duration: 0.3 }, stage3Start);
      tl.to(beforeLastImgs, { y: "-35%", ease: "none", duration: 0.3 }, stage3Start);
      tl.to(lastMiddleImg, { y: "35%", ease: "none", duration: 0.3 }, stage3Start);
    }

    tl.to(".img-scroll-middle-text .tl-section-headline-one", { y: -40, duration: 0.15, ease: "power3.out" }, stage3Start);
    tl.to(".img-scroll-middle-text .tl-banner-description", { opacity: 1, y: -40, duration: 0.3, ease: "power3.out" }, stage3Start);
    tl.to(".img-scroll-middle-text .tl-banner-description .char", { opacity: 1, scale: 1, duration: 0.25, stagger: { amount: 0.15, from: "start" }, ease: "power2.out" }, stage3Start);

    const stage4Start = stage3Start + 0.3;
    tl.to(middleCol, { gap: "10vh", zIndex: 999, ease: "none", duration: 1.0 }, stage4Start);
    tl.to(lastMiddleImg, { zIndex: 9999, y: () => getBeforeLastImgTopVal(), scale: () => getScaleValue(), ease: "power2.inOut", duration: 1 }, stage4Start);
    tl.to(lastMiddleImg.querySelector(".img-dark-overlay"), { opacity: 1, ease: "power2.inOut", duration: 1 }, stage4Start);

    fadeOutMiddleText(tl, stage4Start);

    tl.to(wrapper.querySelectorAll(".moving-img img"), { opacity: 0, ease: "power1.out", duration: 2.0 }, stage4Start + 0.7);

    const stage5Start = stage4Start + 0.52;
    playTextReveals(tl, wrapOne, wrapTwo, wrapThree, stage5Start);
    attachTrailController(tl, trailController, stage5Start);

    const scrubEnd = () => `+=${Math.round(tl.duration() * VH_PER_TL_SECOND)}%`;
    const pinEnd = () => `+=${Math.round(tl.duration() * VH_PER_TL_SECOND)}%`;

    ScrollTrigger.create({
      trigger: mainContainer,
      start: "top top",
      end: pinEnd,
      pin: true,
      anticipatePin: 1,
      invalidateOnRefresh: true
    });

    ScrollTrigger.create({
      trigger: mainContainer,
      start: "top top",
      end: scrubEnd,
      scrub: true,
      animation: tl,
      invalidateOnRefresh: true
    });

    function fadeOutMiddleText(tl, startTime) {
      tl.set(".img-scroll-middle-text", { zIndex: -10 }, startTime);

      tl.to(".img-scroll-middle-text", {
        opacity: 0,
        y: -20,
        duration: 0.3,
        ease: "power2.in"
      }, startTime + 0.3);
    }

    function playTextReveals(tl, wrapOne, wrapTwo, wrapThree, startTime) {
      const reveal = gsap.timeline();

      reveal.to(wrapOne, { opacity: 1, scale: 1, xPercent: -50, yPercent: -50, ease: "power2.out", duration: 1 }, 0);
      reveal.to(wrapOne.querySelectorAll(".char"), { opacity: 1, scale: 1, filter: "blur(0px) brightness(100%)", duration: 0.3, stagger: { each: 0.02, from: "start" }, ease: "power2.out" }, 0);
      reveal.to(wrapOne, { opacity: 0, scale: 0.9, xPercent: -50, yPercent: -50, ease: "power2.in", duration: 0.6 }, 0.9);

      const wrapTwoWords = wrapTwo.querySelectorAll(".word");
      const wrapTwoChars = wrapTwo.querySelectorAll(".char");
      gsap.set(wrapTwoChars, { opacity: 1, filter: "blur(0px)", scale: 1, willChange: "auto" });
      gsap.set(wrapTwoWords, { opacity: 0, filter: "blur(8px) brightness(30%)", willChange: "filter, opacity" });
      reveal.to(wrapTwo, { opacity: 1, scale: 1, xPercent: -50, yPercent: -50, ease: "power2.out", duration: 0.5 }, 1.43);
      reveal.to(wrapTwoWords, { opacity: 1, filter: "blur(0px) brightness(100%)", duration: 0.4, stagger: { amount: 0.5, from: "start" }, ease: "power2.out" }, 1.43);
      reveal.to(wrapTwo, { opacity: 0, scale: 0.9, xPercent: -50, yPercent: -50, ease: "power2.in", duration: 0.6 }, 2.2);

      reveal.to(wrapThree, { opacity: 1, scale: 1, xPercent: -50, yPercent: -50, ease: "power2.out", duration: 0.5 }, 2.72);
      reveal.to(wrapThree.querySelectorAll(".char"), { opacity: 1, scale: 1, filter: "blur(0px) brightness(100%)", duration: 0.35, stagger: { each: 0.012, from: "start" }, ease: "power2.out" }, 2.72);
      reveal.to(wrapThree, { opacity: 1, xPercent: -50, yPercent: -50, duration: 0.7 }, 2.7);

      reveal.timeScale(1 / TEXT_REVEAL_SCROLL_FACTOR);
      tl.add(reveal, startTime);
    }

    function attachTrailController(tl, trailController, trailOnTime) {
      if (!trailController) return;

      let isTrailActive = false;

      tl.eventCallback("onUpdate", () => {
        const t = tl.time();
        const totalDuration = tl.duration();
        const shouldBeActive = t >= trailOnTime && t <= totalDuration;

        if (shouldBeActive && !isTrailActive) {
          isTrailActive = true;
          trailController.start();
        } else if (!shouldBeActive && isTrailActive) {
          isTrailActive = false;
          trailController.stop();
        }
      });
    }
  }

  function initMotionTrail() {
      const container = document.querySelector('.trail-img-content');
      if (!container) return null;

      const isMobile = () => window.innerWidth < 768;
      if (isMobile()) {
          return { start: () => {}, stop: () => {} };
      }

      const lerp = (a, b, n) => (1 - n) * a + n * b;
      const distance = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
      const getMouseDistance = (mousePos, lastMousePos) => distance(mousePos.x, mousePos.y, lastMousePos.x, lastMousePos.y);

      const setClipPath = (clipInnerElements, numRows, numCols) => {
          if (clipInnerElements.length !== numRows * numCols) return;
          for (let i = 0; i < numRows; i++) {
              for (let j = 0; j < numCols; j++) {
                  const idx = i * numCols + j;
                  const top = (100 / numRows) * i + '%';
                  const bottom = (100 / numRows) * (i + 1) + '%';
                  const left = (100 / numCols) * j + '%';
                  const right = (100 / numCols) * (j + 1) + '%';
                  clipInnerElements[idx].style.clipPath =
                      `polygon(${left} ${top}, ${right} ${top}, ${right} ${bottom}, ${left} ${bottom})`;
              }
          }
      };

      function createTrailImage(DOM_el) {
          const item = {
              DOM: { el: DOM_el, inner: null, clipInnerElements: null },
              defaultStyle: { scale: 1, x: 0, y: 0, opacity: 0 },
              timeline: null,
              rect: null,
              clipRows: 3,
              clipColumns: 3
          };

          item.DOM.inner = item.DOM.el.querySelector('.content__img-inner');
          const clipCount = item.clipRows * item.clipColumns;
          for (let i = 1; i < clipCount; ++i) {
              const clonedDiv = item.DOM.inner.cloneNode(true);
              item.DOM.el.appendChild(clonedDiv);
          }
          item.DOM.el.classList.add('content__img--clip');
          item.DOM.clipInnerElements = item.DOM.el.children;
          setClipPath(item.DOM.clipInnerElements, item.clipRows, item.clipColumns);

          item.getRect = () => {
              item.rect = item.DOM.el.getBoundingClientRect();
          };
          item.getRect();

          item.resize = () => {
              gsap.set(item.DOM.el, item.defaultStyle);
              item.getRect();
          };

          return item;
      }

      const images = [...container.querySelectorAll('.content__img')].map(createTrailImage);
      const imagesTotal = images.length;

      let trailResizeWidth = window.innerWidth;
      window.addEventListener('resize', () => {
          if (window.innerWidth === trailResizeWidth) return;
          trailResizeWidth = window.innerWidth;
          images.forEach(img => img.resize());
      });

      let imgPosition = 0;
      let zIndexVal = 1;
      let activeImagesCount = 0;
      let isIdle = true;
      let isActive = false;
      let rafId = null;
      const threshold = 80;

      let mousePos = { x: 0, y: 0 };
      let lastMousePos = { x: 0, y: 0 };
      let cacheMousePos = { x: 0, y: 0 };
      // automovement
      let hasAutoTriggered = false;

      function getRelativePos(ev) {
          const rect = container.getBoundingClientRect();
          let clientX, clientY;
          if (ev.touches && ev.touches.length) {
              clientX = ev.touches[0].clientX;
              clientY = ev.touches[0].clientY;
          } else {
              clientX = ev.clientX;
              clientY = ev.clientY;
          }
          return { x: clientX - rect.left, y: clientY - rect.top };
      }

      function onPointerMove(ev) {
          if (!isActive) return;
          mousePos = getRelativePos(ev);
      }
      window.addEventListener('mousemove', onPointerMove, { passive: true });
      window.addEventListener('touchmove', onPointerMove, { passive: true });

      function onImageActivated() {
          activeImagesCount++;
          isIdle = false;
      }
      function onImageDeactivated() {
          activeImagesCount--;
          if (activeImagesCount === 0) isIdle = true;
      }

      function showNextImage() {
          ++zIndexVal;
          imgPosition = imgPosition < imagesTotal - 1 ? imgPosition + 1 : 0;
          const img = images[imgPosition];

          gsap.killTweensOf(img.DOM.clipInnerElements);

          img.timeline = gsap.timeline({
              onStart: onImageActivated,
              onComplete: onImageDeactivated
          })
          .set(img.DOM.el, {
              opacity: 1,
              zIndex: zIndexVal,
              x: mousePos.x - img.rect.width / 2,
              y: mousePos.y - img.rect.height / 2,
          }, 0)
          .set(img.DOM.clipInnerElements, {
              x: 0, y: 0, scale: 1, opacity: 1
          }, 0)
          .to(img.DOM.clipInnerElements, {
              duration: 0.25,
              ease: 'power2.out',
              x: () => gsap.utils.random(-15, 15),
              y: () => gsap.utils.random(-15, 15),
              opacity: 0,
              scale: () => gsap.utils.random(0.8, 1),
              stagger: 0.005,
              onComplete: () => {
                  gsap.set(img.DOM.el, { opacity: 0 });
              }
          }, 0.02);
      }

      function renderLoop() {
          if (!isActive) return;

          const dist = getMouseDistance(mousePos, lastMousePos);

          cacheMousePos.x = lerp(cacheMousePos.x || mousePos.x, mousePos.x, 0.3);
          cacheMousePos.y = lerp(cacheMousePos.y || mousePos.y, mousePos.y, 0.3);

          if (dist > threshold) {
              showNextImage();
              lastMousePos = { ...mousePos };
          }

          if (isIdle && zIndexVal !== 1) {
              zIndexVal = 1;
          }

          rafId = requestAnimationFrame(renderLoop);
      }

      function start() {
          if (isActive) return;

          isActive = true;
          images.forEach(img => img.getRect());
          
          const startX = window.innerWidth * 0.2;
          const startY = window.innerHeight / 2;
          const endX = window.innerWidth * 0.8;
          const endY = window.innerHeight / 2;

          mousePos = { x: startX, y: startY };
          lastMousePos = { ...mousePos };
          cacheMousePos = { ...mousePos };
          
          gsap.killTweensOf(mousePos);

          setTimeout(() => {
              if (!isActive) return;
              gsap.to(mousePos, {
                  x: endX,
                  y: endY,
                  duration: 1.3,
                  ease: "power2.inOut"
              });
          }, 300);
          
          rafId = requestAnimationFrame(renderLoop);
      }

      function stop() {
          if (!isActive) return;
          isActive = false;
          if (rafId) cancelAnimationFrame(rafId);

          images.forEach(img => {
              gsap.killTweensOf(img.DOM.clipInnerElements);
              gsap.killTweensOf(img.DOM.el);
              gsap.set(img.DOM.el, { opacity: 0 });
          });

          isIdle = true;
          activeImagesCount = 0;
          zIndexVal = 1;
      }

      return { start, stop };
  }


  // scroll card animation
  function initScrollCardAnimation() {
    const cardWrap = document.querySelector(".tl-scroll-card-animation");
    const cards = gsap.utils.toArray(".tl-single-scroll-card");
    const headline = document.querySelector(".tl-scroll-card-animation .tl-section-headline-one");
    const totalCards = cards.length;

    if (!cardWrap || !totalCards) return;

    cards.forEach((card, index) => {
      gsap.set(card, {
        transformPerspective: 1000,
        x: 0,
        y: 1000,
        z: 750,
        rotateX: 90,
        scale: 1,
        zIndex: index + 1
      });
    });

    const cardDuration = 1.5;
    const cardStagger = 2;
    const enterPhaseEndTime = (totalCards - 1) * cardStagger + cardDuration;

    const exitPhaseStartTime = enterPhaseEndTime + 0.3;
    const exitStagger = 0.15;
    const exitDuration = 1.2;
    const totalTimelineDuration = exitPhaseStartTime + (totalCards * exitStagger) + exitDuration;

    const SCROLL_VH_PER_SECOND = 30;
    const scrollDistanceVh = Math.round(totalTimelineDuration * SCROLL_VH_PER_SECOND);

    const masterTL = gsap.timeline({
      scrollTrigger: {
        trigger: cardWrap,
        start: "top top",
        end: `+=${scrollDistanceVh}%`,
        pin: true,
        scrub: true,
        anticipatePin: 1,
        invalidateOnRefresh: true
      }
    });

    if (headline) {
      masterTL.to(headline, {
        scale: 0.7,
        duration: exitPhaseStartTime,
        ease: "none"
      }, 0);
    }

    cards.forEach((card, index) => {
      const cardStartTime = index * cardStagger;

      masterTL.to(card, {
        x: 0,
        y: 0,
        z: 0,
        rotateX: 0,
        scale: 1,
        duration: cardDuration,
        ease: "power2.out"
      }, cardStartTime);

      if (index > 0) {
        for (let i = 0; i < index; i++) {
          masterTL.to(cards[i], {
            y: -50 * (index - i),
            duration: cardDuration,
            ease: "power2.out"
          }, cardStartTime);
        }
      }
    });

    const fadeOutDuration = exitDuration * 1.5;

    masterTL.to(cards, {
      y: "-50vh",
      duration: fadeOutDuration,
      ease: "power2.inOut",
      stagger: exitStagger
    }, exitPhaseStartTime);
    
    masterTL.to(cardWrap, {
      opacity: 0,
      duration: fadeOutDuration,
      ease: "power2.inOut"
    }, exitPhaseStartTime);

    if (headline) {
      masterTL.to(headline, {
        y: "-50vh",
        duration: fadeOutDuration,
        ease: "power2.inOut"
      }, exitPhaseStartTime);
    }
  }


  // faq accordion
  $('.tl-faq-question').on('click', function () {
    var $current = $(this).closest('.tl-single-faq');
    var $answer = $current.find('.tl-faq-answer');

    if ($current.hasClass('active')) {
        $current.removeClass('active');
        $answer.css('max-height', 0);
    } else {
        $('.tl-single-faq.active').each(function () {
            $(this)
                .removeClass('active')
                .find('.tl-faq-answer')
                .css('max-height', 0);
        });

        $current.addClass('active');
        $answer.css('max-height', $answer[0].scrollHeight + 'px');
    }
  });


})();


