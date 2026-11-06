(function () {
  if (typeof ScrollTrigger !== "undefined") {
    ScrollTrigger.config({ ignoreMobileResize: true });
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


  /* ===========================================================
    2. BANNER SCROLL ANIMATION
  =========================================================== */
  function initHeroScrollAnimation() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

      if (!window.gsap || !window.ScrollTrigger) return;
      ScrollTrigger.config({ ignoreMobileResize: true });

      const hero = document.querySelector('[data-hero]');
      if (!hero) return;
      if (hero.dataset.heroInit) return;
      hero.dataset.heroInit = '1';

      const stage = hero.querySelector('[data-stage]');
      const world = hero.querySelector('[data-world]');
      const layer = (n) => hero.querySelector(`[data-layer="${n}"]`);
      const L = {
        sky:         layer('sky'),
        cloudsBack:  layer('clouds-back'),
        skyline:     layer('skyline'),
        cloudsFront: layer('clouds-front'),
        city:        layer('city'),
        est:         layer('est'),
        cloudRight:  layer('cloud-right'),
        cloudLeft:   layer('cloud-left'),
        bridge:      layer('bridge'),
        star:        layer('star'),
      };
      const starStreak = L.star.querySelector('.star__streak');
      const starHead   = L.star.querySelector('.star__head');
      const trailsBox  = hero.querySelector('[data-trails]');
      const particles  = layer('particles');
      const copy       = hero.querySelector('[data-copy]');
      const lines      = Array.from(hero.querySelectorAll('[data-line]'));

      const smallQuery = window.matchMedia('(max-width: 767px)');
      let effectsTier = null;

      const DESIGN_W     = 1440;
      const WORLD_MIN_H  = 1000; 
      const BRIDGE_TOP   = 721;
      const WORLD_BOTTOM = 1243; 
      const PUSH_ORIGIN  = { x: 720, y: 945 }; 

      const F = { sky: 0.04, particles: 0.10, cloudsBack: 0.22, skyline: 0.30, cloudsFront: 0.5, city: 1 };
      const CLOUDS_BACK_DRIFT = 60;
      const FG_CLOUD = { y: 0.25, xRight: 0.12, xLeft: 0.10 };
      const SCALE = { world: 1.06, cloudsFront: 1.08 };

      const PH = {
        star:        [0.074, 0.266],
        worldScale:  [0.470, 1.000],
        cloudsScale: [0.000, 0.800],
        copyBlock:   [0.740, 1.000],
        line1:       [0.760, 0.900],
        line2:       [0.810, 0.950],
        sub:         [0.870, 1.000], 
      };

      const scrollLength = () => (smallQuery.matches ? 2.0 : 2.4);
      
      const EXIT_START = 0.90;
      const EST_DISSOLVE  = 0.21;

      /* Helpers */
      const clamp01   = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
      const seg       = (p, a, b) => clamp01((p - a) / (b - a));
      const smooth    = (v) => { v = clamp01(v); return v * v * (3 - 2 * v); };
      const easeInOut = gsap.parseEase('power2.inOut');
      const easeOut   = gsap.parseEase('power2.out');
      const estColor  = gsap.utils.interpolate('#FFFFFF', '#9FB4CF');

      let G = null;
      let U = 1; 

      let introActive = false;

      function geometry(Hd) {
        const V0 = Math.min(-200, BRIDGE_TOP - 10 - Hd);
        const grow = (WORLD_BOTTOM - PUSH_ORIGIN.y) * (SCALE.world - 1);
        const V1 = WORLD_BOTTOM + grow - Hd - 6;
        const Vb = Math.min(797 - 0.66 * Hd, V1 - 90);

        const d1 = Vb - V0;
        const P  = [0, 0.19, 0.49, 0.565, 0.64, 1];
        const Vk = [V0, V0 + 0.16 * d1, Vb - 50, Vb, Vb + 50, V1];
        const D  = [];
        for (let i = 0; i < 5; i++) D.push((Vk[i + 1] - Vk[i]) / (P[i + 1] - P[i]));
        const M  = [0, 0.8 * D[1], Math.min(0.65 * D[1], 1.4 * D[2]), 0.6 * D[2], Math.min(0.65 * D[1], 1.1 * D[4], 1.4 * D[3]), 0.25 * D[4]];
        for (let i = 1; i < 5; i++) {
          const lim = 2.5 * Math.min(D[i - 1] || 1e9, D[i] || 1e9);
          M[i] = Math.min(M[i], lim);
        }

        const estStartV = Math.min(60, V1 - 120);
        let lo = 0, hi = 1;
        for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (hermite(P, Vk, M, m) < estStartV) lo = m; else hi = m; }
        const estP0 = Math.min(lo, 0.55);
        const estP1 = Math.min(estP0 + EST_DISSOLVE, 0.80);
        return { Hd, V0, Vb, V1, P, Vk, M, estP0, estP1 };
      }

      function hermite(P, Vk, M, p) {
        let i = 0;
        while (i < P.length - 2 && p > P[i + 1]) i++;
        const h = P[i + 1] - P[i];
        const u = (p - P[i]) / h, u2 = u * u, u3 = u2 * u;
        return (2 * u3 - 3 * u2 + 1) * Vk[i] + (u3 - 2 * u2 + u) * h * M[i]
            + (-2 * u3 + 3 * u2) * Vk[i + 1] + (u3 - u2) * h * M[i + 1];
      }
      const camV = (p) => hermite(G.P, G.Vk, G.M, p);

      function configureEffects() {
        const tier = smallQuery.matches ? 'small' : 'full';
        if (tier === effectsTier) return;
        effectsTier = tier;
        buildParticles(tier === 'small');
      }

      function measure() {
        const W = hero.clientWidth, H = hero.clientHeight;
        if (!W || !H) { G = G || geometry(900); return; }
        const s = Math.max(W / DESIGN_W, H / WORLD_MIN_H);
        world.style.transform = `translate(-50%, 0) scale(${s})`;
        U = W / DESIGN_W;
        document.documentElement.style.setProperty('--u', `${U}px`);
        G = geometry(H / s);

        const visibleRight = DESIGN_W / 2 + (W / s) / 2;
        starPath = visibleRight >= 1310 ? STAR_PATHS.side : STAR_PATHS.center;
      }

      /* Bridge light streaks autonomous, randomized traffic  */
      const LANES = [
        { y: 41.5, len: 320, w: 2.0, color: '#FFE9C4', head: '#FFFFFF', glow: 0.46 },
        { y: 44.5, len: 440, w: 2.3, color: '#FF3D3D', head: '#FFB4A8', glow: 0.52 },
        { y: 38.0, len: 230, w: 1.5, color: '#FFB35C', head: '#FFE6C2', glow: 0.38 },
        { y: 46.5, len: 260, w: 1.7, color: '#FF6A4E', head: '#FFC9BD', glow: 0.44 },
        { y: 35.5, len: 160, w: 1.2, color: '#E8F1FF', head: '#FFFFFF', glow: 0.28 },
        { y: 43.0, len: 380, w: 1.8, color: '#FFE2B8', head: '#FFFFFF', glow: 0.40 },
        { y: 45.5, len: 200, w: 1.4, color: '#FF4B4B', head: '#FFC0B6', glow: 0.40 },
        { y: 39.5, len: 300, w: 1.3, color: '#FFA24A', head: '#FFE0BF', glow: 0.32 }
      ];

      function initAutonomousTrails() {
        if (!trailsBox) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        trailsBox.textContent = '';
        trailsBox.style.opacity = '1';

        const rand = (a, b) => a + Math.random() * (b - a);

        const lanes = LANES.map((t) => {
          const mk = (cls, h, opacity) => {
            const el = document.createElement('div');
            el.className = cls;
            el.style.cssText = `top:${(t.y - h / 2).toFixed(2)}px;width:${t.len}px;height:${h.toFixed(2)}px;opacity:${opacity}`;
            trailsBox.appendChild(el);
            return el;
          };
          const glow = mk('trail__glow', t.w * 4.5, t.glow);
          const line = mk('trail', t.w, 0.92);
          gsap.set([glow, line], { x: -t.len - 10 });
          return { spec: t, glow, line, busy: false };
        });

        let active = 0, timer = null, running = false;

        function launch(lane) {
          const t = lane.spec;
          const dir = Math.random() < 0.5 ? 1 : -1;
          const stops = `transparent 0%, ${t.color} 58%, ${t.head} 93%, ${t.head} 100%`;
          const grad = `linear-gradient(${dir > 0 ? 90 : 270}deg, ${stops})`;
          lane.glow.style.background = grad;
          lane.line.style.background = grad;
          const from = dir > 0 ? -t.len : DESIGN_W;
          const to   = dir > 0 ? DESIGN_W : -t.len;
          const duration = rand(0.9, 1.8) * (0.85 + t.len / 1800);
          lane.busy = true;
          active++;
          gsap.fromTo([lane.glow, lane.line], { x: from }, {
            x: to, duration, ease: 'none',
            onComplete: () => { lane.busy = false; active--; }
          });
        }

        function schedule() {
          clearTimeout(timer);
          if (!running) return;
          timer = setTimeout(() => {
            const pool = smallQuery.matches ? lanes.slice(0, 6) : lanes;
            const cap  = smallQuery.matches ? 3 : 4;
            const free = pool.filter((l) => !l.busy);
            if (active < cap && free.length) launch(free[Math.floor(Math.random() * free.length)]);
            schedule();
          }, rand(250, 1400));
        }

        function start() { if (!running) { running = true; schedule(); } }
        function stop()  { running = false; clearTimeout(timer); }

        // Only run while the hero is on screen and the tab is visible.
        let heroVisible = true, started = false;
        function sync() { if (started && heroVisible && !document.hidden) start(); else stop(); }
        if ('IntersectionObserver' in window) {
          new IntersectionObserver((entries) => {
            heroVisible = entries[0].isIntersecting;
            sync();
          }, { threshold: 0 }).observe(hero);
        }
        document.addEventListener('visibilitychange', sync);

        // Begin once the hero reveals (same hook the entrance animation uses), with a fallback.
        function begin() { if (!started) { started = true; sync(); } }
        window.addEventListener('about-hero:ready', begin, { once: true });
        setTimeout(begin, 2500);
      }

      const bands = {
        far:  particles.querySelector('[data-particles-far]'),
        mid:  particles.querySelector('[data-particles-mid]'),
        near: particles.querySelector('[data-particles-near]'),
      };

      function buildParticles(small) {
        const NS = 'http://www.w3.org/2000/svg';
        bands.far.textContent = bands.mid.textContent = bands.near.textContent = '';
        const count = small ? 26 : 54;
        let seed = 20120713;
        const rnd = () => (seed = (seed * 48271) % 2147483647) / 2147483647;
        for (let i = 0; i < count; i++) {
          const x = 20 + rnd() * 1400;
          const y = 50 + Math.pow(rnd(), 0.85) * 430;
          const depth = rnd();
          let g, r, o;
          if (depth < 0.45)      { g = bands.far;  r = 0.55 + rnd() * 0.3; o = 0.14 + rnd() * 0.14; }
          else if (depth < 0.8)  { g = bands.mid;  r = 0.7  + rnd() * 0.3; o = 0.22 + rnd() * 0.18; }
          else                   { g = bands.near; r = 1.0  + rnd() * 0.4; o = 0.16 + rnd() * 0.16; }
          const warm = rnd() < 0.6;
          const c = document.createElementNS(NS, 'circle');
          c.setAttribute('cx', x.toFixed(1));
          c.setAttribute('cy', y.toFixed(1));
          if (g === bands.near) {
            c.setAttribute('r', (r * 1.7).toFixed(2));
            c.setAttribute('fill', warm ? 'url(#particle-warm)' : 'url(#particle-cool)');
          } else {
            c.setAttribute('r', r.toFixed(2));
            c.setAttribute('fill', warm ? '#F6F0E4' : '#E6EEFB');
          }
          c.setAttribute('opacity', o.toFixed(2));
          g.appendChild(c);
        }
      }

      function renderParticles(V, travel, dV) {
        gsap.set(particles, { y: -F.particles * V, x: 8 * travel });
        bands.far.setAttribute('transform',  `translate(${(2 * travel).toFixed(2)} ${(-0.012 * dV).toFixed(2)})`);
        bands.mid.setAttribute('transform',  `translate(${(6 * travel + 3 * Math.sin(travel * 2.1)).toFixed(2)} ${(-0.03 * dV).toFixed(2)})`);
        bands.near.setAttribute('transform', `translate(${(11 * travel + 5 * Math.sin(travel * 1.6 + 1)).toFixed(2)} ${(-0.055 * dV).toFixed(2)})`);
      }

      const STAR_PATHS = {
        side:   { from: { x: 1040, y: 135 }, to: { x: 1300, y: 245 } },
        center: { from: { x: 540,  y: 105 }, to: { x: 790,  y: 195 } },
      };
      const STAR_LEN = 130;
      let starPath = STAR_PATHS.side;

      function renderStar(p, V, travel) {
        const [a, b] = PH.star;
        const u = seg(p, a, b);
        const env = smooth(seg(u, 0, 0.14)) * (1 - smooth(seg(u, 0.40, 0.90)));
        L.star.style.opacity = env.toFixed(3);
        gsap.set(L.star, { y: -F.particles * V, x: 8 * travel }); 
        if (env <= 0) return;
        const hx = starPath.from.x + (starPath.to.x - starPath.from.x) * u;
        const hy = starPath.from.y + (starPath.to.y - starPath.from.y) * u;
        const angle = Math.atan2(starPath.to.y - starPath.from.y, starPath.to.x - starPath.from.x) * 180 / Math.PI;
        const tail = Math.min(1, u / 0.28) * (1 - 0.45 * smooth(seg(u, 0.45, 0.9)));
        starStreak.style.transform = `translate3d(${(hx - STAR_LEN).toFixed(2)}px, ${(hy - 0.7).toFixed(2)}px, 0) rotate(${angle.toFixed(2)}deg) scaleX(${tail.toFixed(3)})`;
        starHead.style.transform   = `translate3d(${hx.toFixed(2)}px, ${hy.toFixed(2)}px, 0)`;
      }

      function renderCopy(p) {
        const block = easeOut(seg(p, PH.copyBlock[0], PH.copyBlock[1]));
        gsap.set(copy, { y: (1 - block) * 36 * U });
        const spans = [PH.line1, PH.line2, PH.sub];
        lines.forEach((el, i) => {
          const u = easeOut(seg(p, spans[i][0], spans[i][1]));
          gsap.set(el, { yPercent: 112 * (1 - u), opacity: u <= 0 ? 0 : 0.35 + 0.65 * u });
        });
      }

      function render(p) {
        if (introActive) return;  
        const V      = camV(p); 
        const travel = (V - G.V0) / (G.V1 - G.V0); 
        const dV     = V - G.V0;


        gsap.set(L.sky,        { y: -F.sky * V });
        renderParticles(V, travel, dV);
        renderStar(p, V, travel);
        gsap.set(L.cloudsBack, { x: CLOUDS_BACK_DRIFT * travel, y: -F.cloudsBack * V });
        gsap.set(L.skyline,    { y: -F.skyline * V });
        gsap.set(L.cloudsFront, {
          y: -F.cloudsFront * V,
          scale: 1 + (SCALE.cloudsFront - 1) * easeInOut(seg(p, PH.cloudsScale[0], PH.cloudsScale[1])),
        });

        const kW = 1 + (SCALE.world - 1) * easeInOut(seg(p, PH.worldScale[0], PH.worldScale[1]));
        gsap.set(L.city, { y: -F.city * V, scale: kW });

        const d = seg(p, G.estP0, G.estP1);
        const haze = smooth(seg(d, 0.00, 0.70));
        gsap.set(L.est, {
          scale: 1 / kW,
          y: V / kW,
          opacity: 1 - smooth(seg(d, 0.25, 1)),
          color: estColor(smooth(seg(d, 0, 0.8))),
          filter: haze > 0.001 ? `blur(${(8 * haze).toFixed(2)}px)` : 'none',
        });
        L.est.style.setProperty('--est-mask', `${(200 * smooth(seg(d, 0.1, 1))).toFixed(1)}%`);

        gsap.set(L.cloudRight, { x: FG_CLOUD.xRight * dV, y: -FG_CLOUD.y * dV });
        gsap.set(L.cloudLeft,  { x: FG_CLOUD.xLeft  * dV, y: -FG_CLOUD.y * dV });

        renderCopy(p);
      }

      function renderExit(progress, pinLength) {
        const u = seg(progress, EXIT_START, 1);
        // E(u) = pinLength·(1−EXIT_START)·u²/2  →  dE/dscroll = u, reaching 1 at release
        const e = pinLength * (1 - EXIT_START) * u * u * 0.5;
        stage.style.transform = `translate3d(0, ${(-e).toFixed(2)}px, 0)`;
      }

      const state = { p: 0 };

      function init() {
        configureEffects();
        initAutonomousTrails();
        gsap.set(L.city,        { transformOrigin: `${PUSH_ORIGIN.x}px ${PUSH_ORIGIN.y}px` });
        gsap.set(L.est,         { transformOrigin: `${PUSH_ORIGIN.x}px ${PUSH_ORIGIN.y - 215}px` }); 
        gsap.set(L.cloudsFront, { transformOrigin: '50% 50%' });
        gsap.set(lines,         { y: 0, yPercent: 112, opacity: 0 });

        measure();
        render(0);

        const introTargets = '.about-hero-layer--clouds-back, .about-hero-layer--skyline, .about-hero-layer--clouds-front, .about-hero-layer--city, .about-hero-layer--est';
        const introBegin = () => { introActive = true; };
        let introDoneResolved = false;
        const introDonePromise = new Promise((resolve) => { introDoneResolve = resolve; });
        const introEnd   = () => {
          if (introActive) {
            introActive = false;
            gsap.set(introTargets, { clearProps: 'opacity' }); 
          }

          gsap.killTweensOf(introTargets);
          render(state.p);
          if (!introDoneResolved) { introDoneResolved = true; introDoneResolve(); }
        };

        window.__aboutHero = { introBegin, introEnd, introDonePromise };


        const heroImgs = Array.from(hero.querySelectorAll('img'));
        const imagesReady = Promise.all(heroImgs.map((img) => {
          if (img.complete && img.naturalWidth === 0) return null; 
          if (img.decode) return img.decode().catch(() => {});
          return new Promise((res) => {
            img.addEventListener('load', res, { once: true });
            img.addEventListener('error', res, { once: true });
          });
        }));
        const revealHero = () => {

          window.dispatchEvent(new Event('about-hero:ready'));
          world.classList.add('is-ready');
        };
        Promise.race([imagesReady, new Promise((r) => setTimeout(r, 1000))]).then(revealHero);


        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: hero,
            start: 'top top',
            end: () => `+=${Math.round(window.innerHeight * scrollLength())}`,
            pin: true,
            anticipatePin: 1,
            scrub: 0.35,  
            invalidateOnRefresh: true,
            onUpdate: (self) => {

              if (introActive && self.progress > 0.001) introEnd();
              renderExit(self.progress, self.end - self.start);
            },
          },
        });
        tl.to(state, { p: 1, duration: 1, ease: 'none', onUpdate: () => render(state.p) });
        const st = tl.scrollTrigger;

        ScrollTrigger.addEventListener('refresh', () => {
          configureEffects(); measure(); render(state.p);
          renderExit(st.progress, st.end - st.start);
        });
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());

        const designFrame = () => {
          gsap.set([L.sky, particles, L.cloudsBack, L.skyline, L.cloudsFront, L.city, L.cloudRight, L.cloudLeft], { x: 0, y: 0, scale: 1 });
          gsap.set(L.est, { x: 0, y: 0, scale: 1, opacity: 1, color: '#FFFFFF', filter: 'none' });
          gsap.set(L.star, { x: 0, y: 0 }); L.star.style.opacity = 0;
          stage.style.transform = '';
          L.est.style.setProperty('--est-mask', '0%');
          gsap.set(copy, { y: 0 });
          gsap.set(lines, { yPercent: 0, opacity: 1 });
          trailsBox.style.opacity = 1;
        };
        Object.assign(window.__aboutHero, { render, state, geometry: () => G, camV, designFrame });
      }

      init();

  }



  /* ===========================================================
    3. 3D STAGGERED GRID ANIMATION & SCROLL MARQUEE
  =========================================================== */
  function initStaggered3DGrid() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    const grid = document.querySelector('.tl-stagger-grid');
    if (!grid) return;

    const gridImages = grid.querySelectorAll('.tl-stagger-grid-imgwrap, .grid__item-imgwrap');
    const marqueeInner = document.querySelector('.tl-stagger-mark > .tl-stagger-mark-inner, .mark > .mark__inner');

    const isLeftSide = (element) => {
      const elementCenter = element.getBoundingClientRect().left + element.offsetWidth / 2;
      const viewportCenter = window.innerWidth / 2;
      return elementCenter < viewportCenter;
    };


    const isMobileGrid = window.matchMedia('(max-width: 767px)').matches;
    const useFilters = !isMobileGrid;

    const gridScrub = 1;
    const animateScrollGrid = () => {
      if (isMobileGrid) {
        animateScrollGridLight();
        return;
      }
      gridImages.forEach(imageWrap => {
        const imgEl = imageWrap.querySelector('.tl-stagger-grid-img, .grid__item-img');
        const leftSide = isLeftSide(imageWrap);

        const enterVars = {
          z: 300,
          rotateX: 70,
          rotateZ: leftSide ? 5 : -5,
          xPercent: leftSide ? -40 : 40,
          skewX: leftSide ? -20 : 20,
          yPercent: 100,
          ease: 'sine',
        };
        const exitVars = {
          z: 300,
          rotateX: -50,
          rotateZ: leftSide ? -1 : 1,
          xPercent: leftSide ? -20 : 20,
          skewX: leftSide ? 10 : -10,
          ease: 'sine.in',
        };
        if (useFilters) {
          enterVars.startAt = { filter: 'blur(0px) brightness(100%) contrast(100%)' };
          enterVars.filter = 'blur(7px) brightness(0%) contrast(400%)';
          exitVars.filter = 'blur(4px) brightness(0%) contrast(500%)';
        }

        gsap.timeline({
          scrollTrigger: {
            trigger: imageWrap,
            start: 'top bottom+=10%',
            end: 'bottom top-=25%',
            scrub: gridScrub,
          }
        })
        .from(imageWrap, enterVars)
        .to(imageWrap, exitVars)
        .from(imgEl, {
          scaleY: 1.8,
          ease: 'sine',
        }, 0)
        .to(imgEl, {
          scaleY: 1.8,
          ease: 'sine.in'
        }, '>');
      });
    };


    const animateScrollGridLight = () => {
      const SINE_OUT = (t) => Math.sin(t * Math.PI * 0.5);
      const SINE_IN  = (t) => 1 - Math.cos(t * Math.PI * 0.5);
      const clamp01  = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
      const items = Array.from(gridImages).map((wrap) => ({
        wrap,
        img: wrap.querySelector('.tl-stagger-grid-img, .grid__item-img'),
        left: isLeftSide(wrap),
        last: -1,
        st: null,
      }));
      const renderItem = (it, u) => {
        const kIn   = SINE_OUT(clamp01(u / 0.5));
        const kOut  = SINE_IN(clamp01((u - 0.5) / 0.5));
        const leave = 1 - kIn;
        const L = it.left;
        const rz = (L ? 5 : -5) * leave + (L ? -1 : 1) * kOut;
        const rx = 70 * leave - 50 * kOut;
        const xp = (L ? -40 : 40) * leave + (L ? -20 : 20) * kOut;
        const sx = (L ? -20 : 20) * leave + (L ? 10 : -10) * kOut;
        const yp = 100 * leave;
        const z  = 300 * (leave + kOut);
        it.wrap.style.transform = `translate3d(${xp.toFixed(2)}%, ${yp.toFixed(2)}%, ${z.toFixed(2)}px) rotate(${rz.toFixed(2)}deg) rotateX(${rx.toFixed(2)}deg) skewX(${sx.toFixed(2)}deg)`;
        if (it.img) it.img.style.transform = `scaleY(${(1.8 - 0.8 * kIn + 0.8 * kOut).toFixed(3)})`;
      };

      items.forEach((it) => {
        it.st = ScrollTrigger.create({
          trigger: it.wrap,
          start: 'top bottom+=10%',
          end: 'bottom top-=25%',
        });
      });

      const tick = () => {
        const y = window.pageYOffset;
        for (let i = 0; i < items.length; i++) {
          const it = items[i];
          const u = clamp01((y - it.st.start) / (it.st.end - it.st.start));
          if (u === it.last) continue;
          it.last = u;
          renderItem(it, u);
        }
      };
      tick();
      gsap.ticker.add(tick);
    };

    const animateMarquee = () => {
      const mark = document.querySelector('.tl-stagger-mark');
      if (!marqueeInner || !mark) return;

      mark.classList.add('is-off');
      gsap.timeline({
        scrollTrigger: {
          trigger: grid,
          start: 'top bottom-=30%',
          end: 'bottom top',
          scrub: gridScrub,
          onToggle: (self) => mark.classList.toggle('is-off', !self.isActive),
        }
      })
      .fromTo(marqueeInner, {
        x: '100vw'
      }, {
        x: '-102%',
        ease: 'sine',
      });
    };

    animateScrollGrid();
    animateMarquee();
  }



  function expensationImgText() {
    // Initial resets
    gsap.set(".expansion-media", { width: 0, height: 0 });

    var isMobile = window.matchMedia("(max-width: 768px)").matches;

    if (!isMobile) {
      // Desktop Setup (> 768px)
      gsap.set(".expansion-top-text", { columnGap: "20vw" });
      
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: ".expansion-close-to-work",
          start: "top center+=20%",
          end: "bottom 100%",
          scrub: .5,
          invalidateOnRefresh: true
        }
      });

        tl.to(".expansion-top-text", {columnGap: "2vw",duration: 1.5,ease: "power2.inOut"
        }, 0)
        .to(".expansion-media", {width: "40vw",height: "20vw",duration: 1,ease: "none"
        }, 0.7);
      } else {
      // Mobile Setup (<= 768px)
      gsap.set(".expansion-top-text", { columnGap: "25vw" });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: ".expansion-close-to-work",
          start: "top center",
          end: "bottom 100%",
          scrub: 1,
          invalidateOnRefresh: true
        }
      });

      tl.to(".expansion-top-text", {
        columnGap: "10px",
        duration: 1.5,
        ease: "power2.inOut"
      }, 0)
      .to(".expansion-media", {
        width: "70vw",
        height: "35vw",
        duration: 1,
        ease: "none"
      }, 0.5);
    }
  }


  // image , text, tab chagnes with scroll animation
  function initSelectiveScrollAnimation() {

    const section = document.querySelector('.selective-scroll-animation');
    const tabs = document.querySelectorAll('.pin-tab');
    const descriptions = document.querySelectorAll('.selective-des-item');

    let activeIndex = 0;
    function setActive(index) {
      activeIndex = index;
      tabs.forEach((tab, i) => tab.classList.toggle('active', i === index));
      descriptions.forEach((desc, i) => desc.classList.toggle('active', i === index));
    }

    gsap.set('.plx-img-2 img, .plx-img-3 img', { y: 200, scale: 1.03 });
    gsap.set('.plx-img-1 img', { y: 0, scale: 1.03 });

    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: '+=200%',
        pin: true,
        scrub: 0.5,
        anticipatePin: 1,
        onUpdate: (self) => {
          const p = self.progress;
          if (activeIndex === 0 && p > 0.45) {
            setActive(1); 
          } else if (activeIndex === 1) {
            if (p > 0.95) {
              setActive(2);  
            } else if (p < 0.05) {
              setActive(0); 
            }
          } else if (activeIndex === 2 && p < 0.55) {
            setActive(1); 
          }
        }
      }
    });

    // ==========================================
    // TRANSITION 1: Slide 1 <-> Slide 2
    // ==========================================
    timeline
      .to('.plx-img-1', {
        clipPath: 'inset(0% 0% 100% 0%)',
        ease: 'none',
        duration: 1
      }, 'step1')
      .to('.plx-img-1 img', {
        y: -200,
        scale: 1,
        ease: 'none',
        duration: 1
      }, 'step1')
      .to('.plx-img-2 img', {
        y: 0,
        scale: 1.03,
        ease: 'none',
        duration: 1
      }, 'step1')

    // ==========================================
    // TRANSITION 2: Slide 2 <-> Slide 3
    // ==========================================
      .to('.plx-img-2', {
        clipPath: 'inset(0% 0% 100% 0%)',
        ease: 'none',
        duration: 1
      }, 'step2')
      .to('.plx-img-2 img', {
        y: -200,
        scale: 1,
        ease: 'none',
        duration: 1
      }, 'step2')
      .to('.plx-img-3 img', {
        y: 0,
        scale: 1.03,
        ease: 'none',
        duration: 1
      }, 'step2');
  }


  /*==========================================================
      SAFE UNIFIED INITIALIZATION
  =========================================================== */
  function initAllAboutAnimations() {

    if (typeof initHeroScrollAnimation === 'function') {
      try {
        initHeroScrollAnimation();
      } catch (e) {
        console.warn('[initAllAboutAnimations] initHeroScrollAnimation failed:', e);
      }
    }

    if (typeof initStaggered3DGrid === 'function') {
      try {
        initStaggered3DGrid();
      } catch (e) {
        console.warn('[initAllAboutAnimations] initStaggered3DGrid failed:', e);
      }
    }

    if (typeof expensationImgText === 'function') {
      try {
        expensationImgText();
      } catch (e) {
        console.warn('[initAllAboutAnimations] expensationImgText failed:', e);
      }
    }

    if (typeof initSelectiveScrollAnimation === 'function') {
      try {
        initSelectiveScrollAnimation();
      } catch (e) {
        console.warn('[initAllAboutAnimations] initSelectiveScrollAnimation failed:', e);
      }
    }

    requestAnimationFrame(() => {
      if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.sort();
        ScrollTrigger.refresh();
      }
    });
  }


  function bootHero() {
    try {
      initHeroScrollAnimation();
    } catch (e) {
      console.warn('[bootHero] initHeroScrollAnimation failed:', e);
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootHero);
  } else {
    bootHero();
  }

  function initSectionsAfterIntro() {
    const done = (window.__aboutHero && window.__aboutHero.introDonePromise) || Promise.resolve();
    Promise.race([Promise.resolve(done), new Promise((r) => setTimeout(r, 4000))])
      .then(initAllAboutAnimations);
  }
  if (document.readyState === 'complete') {
    initSectionsAfterIntro();
  } else {
    window.addEventListener('load', initSectionsAfterIntro);
  }

})();