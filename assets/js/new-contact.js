/* ==========================================================================
   71Three — Contact: intro sequence + stars (tl- prefixed)
   --------------------------------------------------------------------------
   Ported from 7 - Contact/script.js with all selectors prefixed with tl-
   to avoid conflicts with other pages' styles and scripts.

   1. Hero      the cupola rests over the playing Earth video
   2. Zoom      the cupola flies past the camera
   3. Descent   the Earth sinks while the form is uncovered
   4. At rest   the cursor is a mass: the star field bends around it
   5. And back  scrolling up returns to the cockpit, down replays
   ========================================================================== */

(function () {
  'use strict';

  const CONFIG = {
    landscape: { fadeIn: 0.8, hold: 1.0, zoom: 2.2, zoomPower: 1.5, zoomFloor: 0,   zoomFade: 0.14, zoomBlur: 0, earthLead: 0.72, earthEase: 2.2, earthTail: 1.15, formLead: 0.3,  revealBy: 0.96, fieldBlur: 0 },
    portrait:  { fadeIn: 0.7, hold: 0.9, zoom: 1.8, zoomPower: 1.6, zoomFloor: 3.4, zoomFade: 0.16, zoomBlur: 0, earthLead: 0.7,  earthEase: 2.0, earthTail: 1.1,  formLead: 0.25, revealBy: 0.92, fieldBlur: 0 },

    earthPush: 1.035,
    earthDim: 0.6,

    fieldReveal: 0.75,
    fieldStagger: 0.07,
    fieldRise: 14,
    fieldSettle: 0.985,

    shootingStar: true,

    gravity: {
      radius: 360,
      core: 70,
      pull: [15, 19, 22],
      ceiling: 22,
      omega: [7.5, 6.5, 5.5],
      damping: 0.6,
      swirl: 3,
      wave: 2400,
      linger: 0.3,
      fast: 900,
      surge: 0.55,
      bend: 0.5,
      wake: 0.015,
      wakeMax: 8,
      loosen: 0.15,
      lens: 130,
      stretch: 0.14,
      glow: 0.22,
      streak: 0.0012,
      streakMax: 0.16,
      easeIn: 0.35,
      easeOut: 0.45,
      travel: 6,
      formCalm: 0.12,
      formMargin: 20,
      formFeather: 90
    },

    scrollBack: {
      rewindRate: 2.6,
      threshold: 40,
      quiet: 220,
      line: 40,
      flipEvents: 2,
      touchUp: 36,
      touchDown: 48,
      vertical: 1.5,
      preroll: 150,
      focusBlocksWheel: false
    },

    hurryOnScroll: false,
    hurryRate: 3,

    loopBlend: 1.4,

    portholeRadius: 0.19675
  };

  const EASE_OUT = 'cubic-bezier(0.22, 0.61, 0.36, 1)';
  const EASE_PUSH = 'cubic-bezier(0.4, 0, 0.2, 1)';

  const root = document.documentElement;
  const $ = (selector) => document.querySelector(selector);

  // Add tl-js class to mark JS availability
  root.classList.add('tl-js', 'tl-is-intro');

  const stage = $('.tl-contact-outer-stage');
  if (!stage) return; // bail if not on the contact page

  const earth = $('.tl-earth');
  const media = $('.tl-earth__media');
  const video = $('.tl-earth__video');
  const bloom = $('.tl-earth__bloom');
  const dim = $('.tl-space__dim');
  const canvas = $('.tl-stars');
  const fg = $('.tl-fg');
  const cockpit = $('.tl-fg__cockpit');
  const veil = $('.tl-stage__veil');
  const cue = $('.tl-scroll-cue');
  const contact = $('.tl-contact-inner');
  const form = $('.tl-contact-form');
  const title = $('.tl-contact-title');
  const lines = Array.from(document.querySelectorAll('.tl-hero-title__line'));

  const portraitQuery = matchMedia('(max-aspect-ratio: 4/5)');
  const calmQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const onChange = (query, fn) =>
    query.addEventListener ? query.addEventListener('change', fn) : query.addListener(fn);


  /* Video
     ---------------------------------------------------------------------- */

  const tryPlay = () => {
    const playing = video.play();
    if (playing) {
      playing.catch(() => addEventListener('pointerdown', tryPlay, { once: true }));
    }
  };

  const pickVideo = () => {
    const variant = portraitQuery.matches ? 'mobile' : 'desktop';
    if (video.dataset.variant === variant) return;
    const resumeAt = video.currentTime || 0;
    video.dataset.variant = variant;
    // Use CDN video URLs
    if (variant === 'desktop') {
      video.src = 'https://71three.sfo3.cdn.digitaloceanspaces.com/7contactd.mp4';
    } else {
      video.src = 'https://71three.sfo3.cdn.digitaloceanspaces.com/7contactm.mp4';
    }
    video.load();
    if (resumeAt) {
      video.addEventListener('loadedmetadata', () => { video.currentTime = resumeAt; }, { once: true });
    }
    tryPlay();
  };

  video.muted = true;
  pickVideo();
  onChange(portraitQuery, pickVideo);

  // Seamless loop
  const still = $('.tl-earth__still');
  let lap = 'idle';

  const fade = (opacity, duration, easing) => {
    still.style.transition = `opacity ${duration}s ${easing}`;
    still.style.opacity = opacity;
  };

  const release = () => {
    if (lap !== 'held') return;
    lap = 'releasing';
    fade(0, CONFIG.loopBlend, 'ease-in-out');
    setTimeout(() => { lap = 'idle'; }, CONFIG.loopBlend * 1000 + 60);
  };

  const watchLap = () => {
    const left = video.duration - video.currentTime;

    if (lap === 'near') {
      if (video.paused || !(left > 0 && left < 2.5)) { lap = 'idle'; return; }
      if (left < 1.1) {
        try {
          still.width = video.videoWidth;
          still.height = video.videoHeight;
          still.getContext('2d').drawImage(video, 0, 0);
        } catch (error) { lap = 'idle'; return; }
        lap = 'held';
        fade(1, 0.85, 'ease-in-out');
        setTimeout(release, 2600);
      }
    } else if (lap === 'held') {
      if (left > 1.5) return release();
    } else {
      return;
    }
    requestAnimationFrame(watchLap);
  };

  video.addEventListener('timeupdate', () => {
    if (lap !== 'idle' || !CONFIG.loopBlend || video.paused) return;
    const left = video.duration - video.currentTime;
    if (left > 0 && left < 2.2) { lap = 'near'; requestAnimationFrame(watchLap); }
  });


  /* Layout the CSS cannot do alone
     ---------------------------------------------------------------------- */

  const probe = (height) => {
    const el = document.createElement('div');
    el.style.cssText = `position:absolute;top:0;left:0;width:0;visibility:hidden;pointer-events:none;height:${height}`;
    stage.appendChild(el);
    return () => el.getBoundingClientRect().height;
  };

  const screenHeight = probe('calc(var(--svh) * 100)');
  const limbHero = probe('var(--limb-hero)');
  const limbRestMin = probe('var(--limb-rest-min)');
  const limbGap = probe('var(--limb-gap)');

  let limbRest = 0;
  let limb = { cx: 0.6916, cy: 2.40341, r: 2.28251 };
  let pin = { x: 0.6916, y: 0.12089 };

  const layout = () => {
    const min = limbRestMin();
    const formBottom = form.getBoundingClientRect().bottom - stage.getBoundingClientRect().top;
    const share = title ? ((parseFloat(getComputedStyle(title).height) || 0) + (parseFloat(getComputedStyle(form).rowGap) || 0)) / 2 : 0;
    limbRest = Math.max(min, formBottom - share + limbGap());

    if (limbRest > min + 0.5) stage.style.setProperty('--limb-rest', `${limbRest.toFixed(1)}px`);
    else stage.style.removeProperty('--limb-rest');

    const band = Math.max(screenHeight() * 0.15, 96);
    const tail = Math.max(0, limbRest + band - contact.offsetHeight);
    stage.style.setProperty('--stage-tail', `${tail.toFixed(1)}px`);

    const style = getComputedStyle(stage);
    const read = (name, fallback) => parseFloat(style.getPropertyValue(name)) || fallback;
    limb = { cx: read('--limb-cx', limb.cx), cy: read('--limb-cy', limb.cy), r: read('--limb-r', limb.r) };
    pin = { x: read('--vid-ax', pin.x), y: read('--vid-ay', pin.y) };
  };

  const zoomGeometry = () => {
    const w = fg.clientWidth;
    const h = fg.clientHeight;
    if (!w || !h || !cockpit.offsetHeight) return { clear: 7.5, end: 8, open: 3 };
    const ox = w / 2;
    const oy = h / 2;
    const glass = cockpit.offsetHeight * CONFIG.portholeRadius;
    const patch = { left: form.offsetLeft, top: form.offsetTop, right: form.offsetLeft + form.offsetWidth, bottom: form.offsetTop + form.offsetHeight };

    let end = Math.hypot(ox, oy) / glass;
    let open = Math.max(
      Math.hypot(patch.left - ox, patch.top - oy), Math.hypot(patch.right - ox, patch.top - oy),
      Math.hypot(patch.left - ox, patch.bottom - oy), Math.hypot(patch.right - ox, patch.bottom - oy)
    ) / glass;

    lines.forEach((line) => {
      const block = line.offsetParent;
      const left = block.offsetLeft + line.offsetLeft;
      const top = block.offsetTop + line.offsetTop;
      const right = left + line.offsetWidth;
      const bottom = top + line.offsetHeight;
      const exits = [];
      if (left > ox) exits.push((w - ox) / (left - ox));
      if (right < ox) exits.push(ox / (ox - right));
      if (top > oy) exits.push((h - oy) / (top - oy));
      if (bottom < oy) exits.push(oy / (oy - bottom));
      if (exits.length) end = Math.max(end, Math.min(...exits));

      const leaves = [];
      if (right < ox && patch.left < ox) leaves.push((ox - patch.left) / (ox - right));
      if (left > ox && patch.right > ox) leaves.push((patch.right - ox) / (left - ox));
      if (bottom < oy && patch.top < oy) leaves.push((oy - patch.top) / (oy - bottom));
      if (top > oy && patch.bottom > oy) leaves.push((patch.bottom - oy) / (top - oy));
      if (leaves.length) open = Math.max(open, Math.min(...leaves));
    });

    return { clear: end, end: Math.min(Math.max(end * 1.06, T.zoomFloor, 2.4), 14), open: open * 1.25 };
  };

  let zoomReach = 0.85;

  const zoomFrames = () => {
    zoomReach = 1 - 1 / zoomGeometry().end;
    const frames = [];
    for (let i = 0; i <= 132; i++) {
      const p = i / 132;
      const scale = 1 / (1 - Math.pow(p, T.zoomPower) * zoomReach);
      frames.push({ offset: p, transform: `scale(${scale.toFixed(4)})` });
    }
    return frames;
  };


  /* Timeline
     ---------------------------------------------------------------------- */

  const T = CONFIG[portraitQuery.matches ? 'portrait' : 'landscape'];
  const calm = calmQuery.matches;

  const tZoom = T.hold;
  const tThrough = tZoom + (calm ? 1.0 : T.zoom);
  const tSettled = tThrough + (calm ? 1.4 : T.earthTail);
  const revealables = Array.from(form.children);

  let tGone = tThrough;
  let tOpen = tThrough;
  let tRim = tThrough;

  const schedule = () => {
    if (calm) return;
    const { clear, end, open } = zoomGeometry();
    const whenScaled = (scale) =>
      tZoom + T.zoom * Math.pow(Math.min(Math.max((1 - 1 / scale) / (1 - 1 / end), 0), 1), 1 / T.zoomPower);
    tGone = whenScaled(clear);
    tRim = whenScaled(open);
    tOpen = Math.max(tGone - T.formLead, tRim);
  };

  const sinkCurve = (x) => {
    const split = T.zoom / (T.zoom + T.earthTail);
    if (x <= split) return T.earthLead * Math.pow(x / split, T.earthEase);
    const s = (x - split) / (1 - split);
    const rest = 1 - T.earthLead;
    const carry = Math.min(((T.earthLead * T.earthEase) / T.zoom) * (T.earthTail / rest), 3);
    return T.earthLead + rest * (carry * (s - 2 * s * s + s * s * s) + 3 * s * s - 2 * s * s * s);
  };

  const sinkReaches = (progress) => {
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      if (sinkCurve(mid) < progress) lo = mid; else hi = mid;
    }
    return tZoom + (T.zoom + T.earthTail) * ((lo + hi) / 2);
  };

  const animations = [];
  const markers = [];
  const rebuilders = [];
  let finished = false;
  let frozen = false;
  const effects = [];
  const rewinderOf = new Map();
  let state = 'intro';
  let run = 0;
  let doneHandle = 0;
  let arrival = null;
  let resizeDirty = false;
  let zoomAnimation = null;
  let pushAnimation = null;
  let sinkAnimation = null;

  const seconds = (at) => (typeof at === 'function' ? at() : at);

  const play = (el, frames, at, duration, easing = 'linear', fill = 'both') => {
    const animation = el.animate(frames(), { delay: seconds(at) * 1000, duration: duration * 1000, easing, fill });
    animation.pause();
    animations.push(animation);
    effects.push(animation);
    rebuilders.push(() => {
      animation.effect.setKeyframes(frames());
      if (typeof at === 'function') animation.effect.updateTiming({ delay: at() * 1000 });
    });
    return animation;
  };

  const arm = (marker) => {
    const promise = marker.animation.finished;
    if (marker.armedOn === promise) return;
    marker.armedOn = promise;
    promise.then(() => { if (!finished || marker.fn === done) marker.fn(); }, () => {});
  };

  const mark = (at, fn) => {
    const length = () => Math.max(seconds(at), 0.001) * 1000;
    const animation = new Animation(new KeyframeEffect(stage, null, { duration: length() }), document.timeline);
    animation.pause();
    const marker = { at, fn, animation, armedOn: null };
    arm(marker);
    animations.push(animation);
    markers.push(marker);
    if (typeof at === 'function') rebuilders.push(() => animation.effect.updateTiming({ duration: length() }));
  };

  const progressOf = (animation) => {
    if (finished) return 1;
    const rewinder = rewinderOf.get(animation);
    if (rewinder) return 1 - (rewinder.effect.getComputedTiming().progress || 0);
    const progress = animation && animation.effect.getComputedTiming().progress;
    return progress == null ? 0 : progress;
  };

  const travel = () => `translate3d(0, ${(limbHero() - limbRest).toFixed(1)}px, 0)`;

  const sinkFrames = () => {
    const distance = limbHero() - limbRest;
    const frames = [];
    for (let i = 0; i <= 200; i++) {
      const x = i / 200;
      frames.push({ offset: x, transform: `translate3d(0, ${(distance * (1 - sinkCurve(x))).toFixed(2)}px, 0)` });
    }
    return frames;
  };

  const clearsAt = (el) => {
    const w = media.offsetWidth;
    const bottom = el.offsetTop + el.offsetHeight - 6;
    const restingLimbAt = (x) => {
      const u = (x - media.offsetLeft) / w - limb.cx;
      return media.offsetTop + (limb.cy - Math.sqrt(limb.r * limb.r - u * u)) * w;
    };
    const nearest = Math.min(restingLimbAt(el.offsetLeft), restingLimbAt(el.offsetLeft + el.offsetWidth));
    const progress = 1 - (nearest - bottom) / Math.max(limbRest - limbHero(), 1);
    return sinkReaches(Math.min(Math.max(progress, 0), T.revealBy));
  };

  const lead = revealables[0] === title ? 1 : 0;
  const revealAt = (el, i) => (calm
    ? tThrough + 0.7 + (i - lead) * CONFIG.fieldStagger
    : Math.max(tOpen + (i - lead) * CONFIG.fieldStagger, tRim, clearsAt(el)));

  const tForm = () => revealAt(revealables[0], 0);
  const tEnd = () => Math.max(tSettled, ...revealables.map((el, i) => revealAt(el, i) + CONFIG.fieldReveal));

  function build() {
    layout();
    schedule();
    form.inert = true;

    play(veil, () => [{ opacity: 1 }, { opacity: 0 }], 0, T.fadeIn, 'cubic-bezier(0.4, 0, 0.2, 1)');

    if (calm) {
      play(fg, () => [{ opacity: 1 }, { opacity: 0 }], tZoom, tThrough - tZoom, 'ease-in-out');
      play(earth, () => [
        { opacity: 1, transform: travel(), easing: 'ease-in-out' },
        { opacity: 0, transform: travel(), offset: 0.45, easing: 'steps(1, end)' },
        { opacity: 0, transform: 'translate3d(0, 0, 0)', offset: 0.55, easing: 'ease-in-out' },
        { opacity: 1, transform: 'translate3d(0, 0, 0)' }
      ], tThrough - 0.5, tSettled - tThrough + 0.5);
      play(dim, () => [{ opacity: 0 }, { opacity: 1 - CONFIG.earthDim }], tThrough - 0.5 + (tSettled - tThrough + 0.5) * 0.45, (tSettled - tThrough + 0.5) * 0.1);
    } else {
      zoomAnimation = play(fg, zoomFrames, tZoom, T.zoom);

      if (T.zoomFade) {
        play(fg, () => [{ opacity: 1 }, { opacity: 0 }], tThrough - T.zoom * T.zoomFade, T.zoom * T.zoomFade, 'cubic-bezier(0.5, 0, 0.9, 0.6)');
      }

      if (T.zoomBlur) {
        play(fg, () => [
          { filter: 'blur(0px)', offset: 0 },
          { filter: 'blur(0px)', offset: 0.5, easing: 'cubic-bezier(0.55, 0, 0.9, 0.55)' },
          { filter: `blur(${T.zoomBlur}px)`, offset: 1 }
        ], tZoom, T.zoom, 'linear', 'forwards');
      }

      pushAnimation = play(media, () => [
        { transform: `scale(${(1 / CONFIG.earthPush).toFixed(4)})` },
        { transform: 'scale(1)' }
      ], tZoom, tSettled - tZoom, EASE_PUSH);

      sinkAnimation = play(earth, sinkFrames, tZoom, tSettled - tZoom);

      const tDim = tThrough - T.zoom * 0.22;
      play(dim, () => [{ opacity: 0 }, { opacity: 1 - CONFIG.earthDim }], tDim, tSettled - tDim, 'cubic-bezier(0.4, 0, 0.3, 1)');

      const span = tSettled - tZoom;
      play(bloom, () => [
        { opacity: 0.55, offset: 0, easing: 'cubic-bezier(0.5, 0, 0.8, 0.5)' },
        { opacity: 1, offset: (tThrough + 0.1 - tZoom) / span, easing: 'cubic-bezier(0.2, 0.6, 0.3, 1)' },
        { opacity: 0.8, offset: 1 }
      ], tZoom, span);
    }

    revealables.forEach((el, i) => {
      const from = calm ? 'translate3d(0, 0, 0)' : `translate3d(0, ${CONFIG.fieldRise}px, 0) scale(${CONFIG.fieldSettle})`;
      play(el, () => [
        { opacity: 0, transform: from },
        { opacity: 1, transform: 'translate3d(0, 0, 0) scale(1)' }
      ], () => revealAt(el, i), CONFIG.fieldReveal, EASE_OUT);

      if (T.fieldBlur && !calm) {
        play(el, () => [{ filter: `blur(${T.fieldBlur}px)` }, { filter: 'blur(0px)' }], () => revealAt(el, i), CONFIG.fieldReveal, EASE_OUT, 'none');
      }
    });

    mark(T.fadeIn, () => stage.classList.add('tl-is-ready'));
    mark(tThrough, () => stage.classList.add('tl-is-through'));
    mark(tForm, () => { stage.classList.add('tl-is-form'); form.inert = false; });
    if (CONFIG.shootingStar && !calm) mark(() => tGone + 0.45, () => { if (!frozen) stars.shoot(); });
    mark(tEnd, () => enter('form'));
    mark(() => tEnd() + 0.9, () => { doneHandle = whenIdle(done); });
  }

  const whenIdle = (fn) => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 0));
  const cancelIdle = (handle) => (window.cancelIdleCallback ? cancelIdleCallback(handle) : clearTimeout(handle));

  function done() {
    if (finished || state === 'to-cockpit' || state === 'cockpit') return;
    finished = true;
    stage.classList.add('tl-is-ready', 'tl-is-through', 'tl-is-form', 'tl-is-done');
    root.classList.remove('tl-is-intro');
    form.inert = false;
    animations.forEach((animation) => animation.cancel());
    layout();
    stars.resize();
    stars.settle();
    enter('form');
  }

  const seek = (time) => {
    animations.forEach((animation) => { animation.currentTime = time * 1000; });
  };

  function start() {
    schedule();
    rebuilders.forEach((rebuild) => rebuild());
    const at = new URLSearchParams(location.search).get('at');

    if (at === 'end') return done();
    if (at !== null && !Number.isNaN(parseFloat(at))) {
      frozen = true;
      markers.forEach((marker) => { if (seconds(marker.at) <= parseFloat(at) && marker.fn !== done) marker.fn(); });
      return seek(parseFloat(at));
    }

    const now = document.timeline.currentTime;
    animations.forEach((animation) => { animation.play(); animation.startTime = now; });
  }

  const hurry = () => {
    if (finished || state !== 'intro' || !CONFIG.hurryOnScroll) return;
    animations.forEach((animation) => animation.updatePlaybackRate(CONFIG.hurryRate));
  };


  /* Scroll-back: form ⇄ cockpit
     ---------------------------------------------------------------------- */

  const SB = CONFIG.scrollBack;
  const FILL = { both: 'both', forwards: 'backwards', backwards: 'forwards', none: 'none' };

  const mirrorEase = (easing = 'linear') => {
    const bezier = /^cubic-bezier\(([^)]+)\)$/.exec(easing);
    if (bezier) {
      const [x1, y1, x2, y2] = bezier[1].split(',').map(Number);
      return `cubic-bezier(${+(1 - x2).toFixed(4)}, ${+(1 - y2).toFixed(4)}, ${+(1 - x1).toFixed(4)}, ${+(1 - y1).toFixed(4)})`;
    }
    if (easing === 'ease') return 'cubic-bezier(0.75, 0, 0.75, 0.9)';
    if (easing === 'ease-in') return 'ease-out';
    if (easing === 'ease-out') return 'ease-in';
    if (/^steps\(\s*1\s*(,\s*(jump-)?end\s*)?\)$/.test(easing) || easing === 'step-end') return 'steps(1, start)';
    if (/^steps\(\s*1\s*,\s*(jump-)?start\s*\)$/.test(easing) || easing === 'step-start') return 'steps(1, end)';
    return easing;
  };

  const rewinderFor = (animation, length, rate) => {
    const timing = animation.effect.getTiming();
    const frames = animation.effect.getKeyframes();
    const mirrored = frames.map((frame, i) => {
      const copy = {};
      Object.keys(frame).forEach((key) => { if (!['offset', 'computedOffset', 'easing', 'composite'].includes(key)) copy[key] = frame[key]; });
      copy.offset = +(1 - frame.computedOffset).toFixed(6);
      if (i > 0) copy.easing = mirrorEase(frames[i - 1].easing);
      return copy;
    }).reverse();
    const rewinder = animation.effect.target.animate(mirrored, {
      delay: Math.max(0, length - (timing.delay + timing.duration)) / rate,
      duration: timing.duration / rate,
      easing: mirrorEase(timing.easing),
      fill: FILL[timing.fill] || 'both'
    });
    rewinder.pause();
    return rewinder;
  };

  const blank = (el) => (el.type === 'checkbox' || el.type === 'radio' ? !el.checked : String(el.value || '').trim() === '');
  const formInUse = () => Array.from(form.elements).some((el) => !['submit', 'button', 'reset', 'fieldset', 'hidden'].includes(el.type) && !blank(el));
  const typing = () => { const el = document.activeElement; return !!el && form.contains(el) && el.matches('input, textarea, select, [contenteditable]'); };
  const unzoomed = () => !window.visualViewport || (visualViewport.scale <= 1.01 && visualViewport.offsetTop <= 0.5);

  const canTrigger = (direction, touch = false) => !frozen && !root.classList.contains('menu-open')  && unzoomed()
    && (direction > 0
      ? state === 'cockpit'
      : state === 'form' && window.scrollY <= 0 && !formInUse() && !((touch || SB.focusBlocksWheel) && typing()));

  const syncCanReturn = () => root.classList.toggle('tl-can-return', state === 'form' && !frozen && !formInUse());
  let resetGesture = () => {};
  function enter(next) { state = next; resetGesture(); syncCanReturn(); }

  async function rewind(touch = false) {
    if (!canTrigger(-1, touch)) return;
    const mine = ++run;
    cancelIdle(doneHandle);
    enter('to-cockpit');
    if (form.contains(document.activeElement)) document.activeElement.blur();

    root.classList.add('tl-is-intro');
    stage.classList.remove('tl-is-done');
    form.inert = true;
    layout();
    schedule();
    rebuilders.forEach((rebuild) => rebuild());
    const length = tEnd() * 1000;
    effects.forEach((animation) => rewinderOf.set(animation, rewinderFor(animation, length, SB.rewindRate)));
    animations.forEach((animation) => animation.cancel());
    finished = false;
    stars.rouse();
    stars.resize();

    await Promise.race([
      cockpit.decode ? cockpit.decode().catch(() => {}) : null,
      new Promise((resolve) => setTimeout(resolve, SB.preroll))
    ]);
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    if (mine !== run) return;

    const now = document.timeline.currentTime;
    rewinderOf.forEach((rewinder) => { rewinder.play(); rewinder.startTime = now; });
    arrival = new Animation(new KeyframeEffect(stage, null, { duration: Math.max(length - tZoom * 1000, 1) / SB.rewindRate }), document.timeline);
    arrival.play();
    arrival.startTime = now;
    arrival.finished.then(() => { if (mine === run) arriveCockpit(); }, () => {});
  }

  function arriveCockpit() {
    run++;
    if (arrival) { arrival.cancel(); arrival = null; }
    if (resizeDirty) {
      resizeDirty = false;
      layout();
      schedule();
      rebuilders.forEach((rebuild) => rebuild());
      stars.resize();
    }
    effects.forEach((animation) => { animation.currentTime = tZoom * 1000; });
    rewinderOf.forEach((rewinder) => rewinder.cancel());
    rewinderOf.clear();
    stage.classList.remove('tl-is-through', 'tl-is-form');
    stars.rest();
    enter('cockpit');
    if (cue) cue.classList.add('tl-is-on');
  }

  function replay() {
    if (!canTrigger(1)) return;
    run++;
    enter('to-form');
    if (cue) cue.classList.remove('tl-is-on');
    stars.rouse();
    markers.forEach(arm);
    const now = document.timeline.currentTime;
    animations.forEach((animation) => { animation.play(); animation.startTime = now - tZoom * 1000; });
  }

  const go = (direction, touch) => (direction > 0 ? replay() : rewind(touch));


  /* Stars
     ---------------------------------------------------------------------- */

  const stars = (() => {
    const ctx = canvas.getContext('2d');
    const TINTS = ['255,255,255', '206,222,255', '255,236,214'];
    const POOL = 220;
    const PUSH_Z = 0.05;
    const LAYERS = [
      { size: [0.4, 0.5],  alpha: [0.16, 0.42], twinkle: [0.2, 0.5],  drift: 0.1, tilt: 0.04,  depth: null },
      { size: [0.7, 0.65], alpha: [0.34, 0.5],  twinkle: [0.2, 0.45], drift: 0.5, tilt: 0.07,  depth: [7, 16] },
      { size: [1.3, 0.9],  alpha: [0.14, 0.2],  twinkle: [0.05, 0.2], drift: 1.6, tilt: 0.115, depth: [1.7, 4.2] }
    ];

    let width = 0;
    let height = 0;
    let midX = 0;
    let midY = 0;
    let count = 0;
    let idle = false;
    let wells = false;
    let looping = false;
    let tick = 0;
    let last = 0;
    let box = { x: 0, y: 0, w: 1, ox: 0, oy: 0, travel: 0 };
    let shot = null;
    let shotDone = false;

    let seed = 71003;
    const random = () => {
      seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    const pool = Array.from({ length: POOL }, (_, i) => {
      const layer = i % 20 === 0 ? 2 : i % 4 === 1 ? 1 : 0;
      const spec = LAYERS[layer];
      const magnitude = Math.pow(random(), 3);
      const tint = random();
      return {
        layer,
        x: random(),
        y: random(),
        size: spec.size[0] + magnitude * spec.size[1] + random() * 0.12,
        alpha: spec.alpha[0] + magnitude * spec.alpha[1] + random() * 0.1,
        depth: spec.depth ? spec.depth[0] + random() * (spec.depth[1] - spec.depth[0]) : 0,
        twinkle: spec.twinkle[0] + random() * spec.twinkle[1],
        rate: (Math.PI * 2) / (2.2 + random() * 4.8),
        phase: random() * Math.PI * 2,
        flutter: (Math.PI * 2) / (0.9 + random() * 1.3),
        flutterPhase: random() * Math.PI * 2,
        tint: layer === 2 ? 0 : tint < 0.7 ? 0 : tint < 0.88 ? 1 : 2
      };
    });

    const sprites = TINTS.map((rgb) => {
      const sprite = document.createElement('canvas');
      sprite.width = sprite.height = 64;
      const g = sprite.getContext('2d');
      const glow = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      glow.addColorStop(0, `rgba(${rgb},1)`);
      glow.addColorStop(0.14, `rgba(${rgb},0.85)`);
      glow.addColorStop(0.32, `rgba(${rgb},0.24)`);
      glow.addColorStop(0.62, `rgba(${rgb},0.05)`);
      glow.addColorStop(1, `rgba(${rgb},0)`);
      g.fillStyle = glow;
      g.fillRect(0, 0, 64, 64);
      return sprite;
    });

    // Cursor gravity
    const G = CONFIG.gravity;
    const R = G.radius;
    const R2 = R * R;
    const CORE2 = G.core * G.core;
    const HISTORY = 64;
    const warp = new Float32Array(POOL * 4);
    const hold = new Float32Array(POOL * 2);
    const turn = new Int8Array(POOL).fill(1);
    const past = new Float64Array(HISTORY * 6);
    let head = -1;
    let filled = 0;

    const heft = (() => {
      const glare = pool.map((star) => star.size * star.alpha);
      const range = LAYERS.map((_, layer) => {
        const own = glare.filter((__, i) => pool[i].layer === layer);
        return [Math.min(...own), Math.max(...own)];
      });
      return Float32Array.from(pool, (star, i) => {
        const [lo, hi] = range[star.layer];
        return 0.55 + 0.45 * Math.pow((glare[i] - lo) / Math.max(hi - lo, 1e-6), 0.7);
      });
    })();
    const pull = Float32Array.from(pool, (star, i) => G.pull[star.layer] * heft[i]);
    const omega = Float32Array.from(pool, (star, i) => G.omega[star.layer] * (0.88 + 0.24 * ((i * 0.618034) % 1)));

    const fine = matchMedia('(hover: hover) and (pointer: fine)');
    let allowed = fine.matches && !calmQuery.matches;
    let armed = false;
    let present = false;
    let strength = 0;
    let wakeUntil = 0;
    let echoUntil = 0;
    let range2 = 0;
    let mouseX = 0;
    let mouseY = 0;
    let anchorX = NaN;
    let anchorY = 0;
    let scrollX = 0;
    let scrollY = 0;
    let originX = 0;
    let originY = 0;
    let pixels = 1;
    let shelter = { left: 0, top: 0, right: 0, bottom: 0 };
    let wellX = 0;
    let wellY = 0;
    let wellVX = 0;
    let wellVY = 0;
    let sighted = false;

    const cursorRelease = () => { present = false; anchorX = NaN; sighted = false; };

    const track = (event) => {
      if (event.pointerType === 'touch' || !wells) return cursorRelease();
      if (!allowed) return;
      if (!present) {
        if (anchorX !== anchorX) { anchorX = event.clientX; anchorY = event.clientY; return; }
        if (Math.hypot(event.clientX - anchorX, event.clientY - anchorY) < G.travel) return;
        present = true;
      }
      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const armCursor = () => {
      if (armed || calm || !idle || !allowed || !window.PointerEvent) return;
      armed = true;
      scrollX = window.scrollX;
      scrollY = window.scrollY;
      addEventListener('pointermove', track, { passive: true });
      addEventListener('pointerdown', track, { passive: true });
      addEventListener('scroll', () => { scrollX = window.scrollX; scrollY = window.scrollY; }, { passive: true });
      root.addEventListener('pointerleave', cursorRelease);
      addEventListener('pointercancel', cursorRelease);
      addEventListener('blur', cursorRelease);
      document.addEventListener('visibilitychange', () => { if (document.hidden) cursorRelease(); });
    };

    const regate = () => { allowed = fine.matches && !calmQuery.matches; if (!allowed) cursorRelease(); armCursor(); };
    onChange(fine, regate);
    onChange(calmQuery, regate);

    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      const ratio = Math.max(1, Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(3.2e6 / Math.max(width * height, 1))));
      const w = Math.round(width * ratio);
      const h = Math.round(height * ratio);
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      pixels = ratio;
      count = Math.round(Math.min(Math.max((width * height) / 8000, 48), POOL));
      midX = width / 2;
      midY = Math.min(height, screenHeight() || height) / 2;

      const mw = media.offsetWidth;
      box = { x: media.offsetLeft, y: media.offsetTop, w: mw, ox: media.offsetLeft + pin.x * mw, oy: media.offsetTop + pin.y * mw, travel: limbHero() - limbRest };

      const own = canvas.getBoundingClientRect();
      originX = own.left + window.scrollX;
      originY = own.top + window.scrollY;
      warp.fill(0, count * 4);
      hold.fill(0, count * 2);

      const patch = form.getBoundingClientRect();
      shelter = { left: patch.left - own.left - G.formMargin, top: patch.top - own.top - G.formMargin, right: patch.right - own.left + G.formMargin, bottom: patch.bottom - own.top + G.formMargin };
    };

    const smooth = (from, to, value) => {
      const t = Math.min(Math.max((value - from) / (to - from), 0), 1);
      return t * t * (3 - 2 * t);
    };

    const camera = () => {
      if (calm) return { z: 0, push: 1, tilt: 1 };
      const push = progressOf(pushAnimation);
      return {
        z: Math.pow(progressOf(zoomAnimation), T.zoomPower) * zoomReach + PUSH_Z * push,
        push,
        tilt: sinkCurve(progressOf(sinkAnimation))
      };
    };

    const drawShot = (time) => {
      const t = (time - shot.from) / 0.75;
      if (t >= 1) { shot = null; return; }
      const wide = width > height;
      const [x0, y0, x1, y1] = wide ? [0.80, 0.085, 0.615, 0.20] : [0.90, 0.125, 0.40, 0.225];
      const eased = 1 - Math.pow(1 - t, 2.4);
      const hx = (x0 + (x1 - x0) * eased) * width;
      const hy = (y0 + (y1 - y0) * eased) * height;
      const length = Math.hypot((x1 - x0) * width, (y1 - y0) * height);
      const ux = ((x1 - x0) * width) / length;
      const uy = ((y1 - y0) * height) / length;
      const tail = length * 0.42 * Math.sin(Math.PI * Math.min(t * 1.1, 1));
      const glowVal = Math.sin(Math.PI * t) * 0.5;

      const streak = ctx.createLinearGradient(hx, hy, hx - ux * tail, hy - uy * tail);
      streak.addColorStop(0, `rgba(255,255,255,${glowVal.toFixed(3)})`);
      streak.addColorStop(0.3, `rgba(206,222,255,${(glowVal * 0.35).toFixed(3)})`);
      streak.addColorStop(1, 'rgba(206,222,255,0)');
      ctx.globalAlpha = 1;
      ctx.strokeStyle = streak;
      ctx.lineWidth = 1.1;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(hx - ux * tail, hy - uy * tail);
      ctx.stroke();
      ctx.globalAlpha = glowVal;
      ctx.drawImage(sprites[0], hx - 3.5, hy - 3.5, 7, 7);
    };

    const draw = (time, elapsed) => {
      const { z, push, tilt } = camera();
      let cx;
      let cy;
      let span;
      if (calm) {
        const seen = media.getBoundingClientRect();
        const own = canvas.getBoundingClientRect();
        span = seen.width;
        cx = seen.left - own.left + limb.cx * span;
        cy = seen.top - own.top + limb.cy * span;
      } else {
        const scale = (1 + (CONFIG.earthPush - 1) * push) / CONFIG.earthPush;
        span = box.w * scale;
        cx = box.ox + (box.x + limb.cx * box.w - box.ox) * scale;
        cy = box.oy + (box.y + limb.cy * box.w - box.oy) * scale + box.travel * (1 - tilt);
      }
      const radius = limb.r * span;
      const haze = span * 0.016;
      const clear = span * 0.055;

      let stir = 0;
      let steps = 1;
      if (armed) {
        const want = present ? 1 : 0;
        if (strength !== want) {
          strength += (want - strength) * (1 - Math.exp(-elapsed / (want ? G.easeIn : G.easeOut)));
          if (Math.abs(want - strength) < 0.002) strength = want;
        }

        const nowX = mouseX + scrollX - originX;
        const nowY = mouseY + scrollY - originY;
        if (present && sighted && elapsed > 0) {
          const ease = 1 - Math.exp(-elapsed / 0.05);
          wellVX += ((nowX - wellX) / elapsed - wellVX) * ease;
          wellVY += ((nowY - wellY) / elapsed - wellVY) * ease;
        } else {
          const fadeVal = Math.exp(-elapsed / 0.12);
          wellVX *= fadeVal;
          wellVY *= fadeVal;
        }
        if (present) { wellX = nowX; wellY = nowY; sighted = true; }

        head = (head + 1) % HISTORY;
        filled = Math.min(filled + 1, HISTORY);
        const slot = head * 6;
        past[slot] = time;
        past[slot + 1] = wellX;
        past[slot + 2] = wellY;
        past[slot + 3] = wellVX;
        past[slot + 4] = wellVY;
        past[slot + 5] = strength;
        if (strength > 0) echoUntil = time + R / G.wave + 0.05;
        const slip = Math.hypot(wellVX, wellVY) * (R / G.wave);
        range2 = (R * 1.3 + slip) * (R * 1.3 + slip);

        steps = Math.min(6, Math.max(1, Math.ceil(elapsed * 90)));
      }

      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < count; i++) {
        const star = pool[i];
        const spec = LAYERS[star.layer];

        if (!calm) {
          star.x -= (1.3 * spec.drift * elapsed) / width;
          star.y += (0.45 * spec.drift * elapsed) / height;
          if (star.x < 0) star.x += 1;
          if (star.y > 1) star.y -= 1;
        }

        let sy = star.y + tilt * spec.tilt;
        sy -= Math.floor(sy);
        let x = star.x * width;
        let y = sy * height;
        let size = star.size;
        let alpha = star.alpha;

        if (star.depth && z > 0) {
          const spread = star.depth / (star.depth - z);
          x = midX + (x - midX) * spread;
          y = midY + (y - midY) * spread;
          if (x < -20 || x > width + 20 || y < -20 || y > height + 20) continue;
          size *= Math.sqrt(spread);
          alpha /= Math.pow(spread, 0.8);
        }

        let lensed = 0;
        let axisX = 0;
        let axisY = 0;
        if (armed) {
          const k = i * 4;
          let tx = 0;
          let ty = 0;
          const homeX = x;
          const homeY = y;
          const free = (G.formCalm + (1 - G.formCalm) * smooth(0, G.formFeather, Math.max(shelter.left - x, x - shelter.right, shelter.top - y, y - shelter.bottom)))
            * smooth(0, 60, Math.min(x, height - y));

          let nearX = wellX - x;
          let nearY = wellY - y;
          const near2 = nearX * nearX + nearY * nearY;
          if (time < echoUntil && near2 < range2) {
            const lag = Math.min(Math.sqrt(near2), R) / G.wave;
            let at = head;
            for (let back = 1; back < filled && past[at * 6] > time - lag; back++) at = (at + HISTORY - 1) % HISTORY;
            const dx = past[at * 6 + 1] - x;
            const dy = past[at * 6 + 2] - y;
            const vx = past[at * 6 + 3];
            const vy = past[at * 6 + 4];
            const d2 = dx * dx + dy * dy;
            const power = past[at * 6 + 5];
            if (power > 0 && d2 < R2 && d2 > 1e-6) {
              const d = Math.sqrt(d2);
              const edge = 1 - d2 / R2;
              const well = ((2 * d * G.core) / (d2 + CORE2)) * edge * edge;
              const hurryVal = Math.min(Math.hypot(vx, vy) / G.fast, 1);
              const inward = Math.min(pull[i] * well * (1 + G.surge * hurryVal), 0.78 * d);
              const ux = dx / d;
              const uy = dy / d;
              if (hurryVal > 0.04) turn[i] = vx * -dy - vy * -dx >= 0 ? 1 : -1;
              const sweep = G.bend * inward * hurryVal * turn[i];
              const drag = G.wake * well * heft[i];
              tx = ux * inward - uy * sweep + Math.max(-G.wakeMax, Math.min(G.wakeMax, vx * drag));
              ty = uy * inward + ux * sweep + Math.max(-G.wakeMax, Math.min(G.wakeMax, vy * drag));
              const reach = Math.hypot(tx, ty);
              const held = (power * free * G.ceiling * Math.tanh(reach / G.ceiling)) / (reach || 1);
              tx *= held;
              ty *= held;
            }
          }

          const keep = Math.exp(-elapsed / G.linger);
          const heldX = hold[i * 2] * keep;
          const heldY = hold[i * 2 + 1] * keep;
          if (tx * tx + ty * ty < heldX * heldX + heldY * heldY) { tx = heldX; ty = heldY; }
          if (tx * tx + ty * ty < 1e-3) { tx = 0; ty = 0; }
          hold[i * 2] = tx;
          hold[i * 2 + 1] = ty;

          if (tx || ty || warp[k] || warp[k + 1] || warp[k + 2] || warp[k + 3]) {
            const om = omega[i];
            const loose = G.damping - G.loosen * Math.min(Math.hypot(wellVX, wellVY) / G.fast, 1);
            const h = elapsed / steps;
            const angle = G.swirl * h * turn[i];
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            let ox = warp[k];
            let oy = warp[k + 1];
            let vx = warp[k + 2];
            let vy = warp[k + 3];
            for (let step = 0; step < steps; step++) {
              vx += (om * om * (tx - ox) - 2 * loose * om * vx) * h;
              vy += (om * om * (ty - oy) - 2 * loose * om * vy) * h;
              const turned = cos * vx - sin * vy;
              vy = sin * vx + cos * vy;
              vx = turned;
              ox += vx * h;
              oy += vy * h;
            }
            const speed = vx * vx + vy * vy;
            if (!tx && !ty && speed < 0.01 && ox * ox + oy * oy < 0.001) { ox = 0; oy = 0; vx = 0; vy = 0; }
            else if (speed > stir) stir = speed;
            warp[k] = ox;
            warp[k + 1] = oy;
            warp[k + 2] = vx;
            warp[k + 3] = vy;
            x += ox;
            y += oy;

            if (x > shelter.left && x < shelter.right && y > shelter.top && y < shelter.bottom
              && !(homeX > shelter.left && homeX < shelter.right && homeY > shelter.top && homeY < shelter.bottom)) {
              const out = Math.min(x - shelter.left, shelter.right - x, y - shelter.top, shelter.bottom - y);
              if (out === x - shelter.left) x = shelter.left; else if (out === shelter.right - x) x = shelter.right;
              else if (out === y - shelter.top) y = shelter.top; else y = shelter.bottom;
            }

            nearX = wellX - x;
            nearY = wellY - y;
            const close = Math.sqrt(nearX * nearX + nearY * nearY);
            if (close < G.lens && close > 1e-3) {
              lensed = strength * free * Math.pow(1 - close / G.lens, 2);
              axisX = (-nearY / close) * G.stretch * lensed;
              axisY = (nearX / close) * G.stretch * lensed;
            }
            const pace = Math.min(Math.sqrt(speed) * G.streak, G.streakMax) * free;
            if (pace > 0.02) {
              const along = Math.sqrt(speed);
              const same = axisX * vx + axisY * vy < 0 ? -1 : 1;
              axisX += (same * vx / along) * pace;
              axisY += (same * vy / along) * pace;
            }
          }
        }

        if (star.layer < 2) {
          const above = Math.hypot(x - cx, y - cy) - radius;
          if (above <= haze) continue;
          alpha *= smooth(haze, clear, above);
        }

        const twinkle = calm ? 1 : 1 - star.twinkle
          * (0.5 + 0.5 * Math.sin(time * star.rate + star.phase))
          * (0.72 + 0.28 * Math.sin(time * star.flutter + star.flutterPhase));
        alpha *= twinkle;
        if (alpha < 0.012) continue;

        const d = size * 7;
        const drawn = Math.hypot(axisX, axisY);
        ctx.globalAlpha = Math.min(alpha * (1 + G.glow * lensed), 1);
        if (drawn > 0.03) {
          const lengthen = 1 + Math.min(drawn, 0.3);
          const thin = 1 / Math.sqrt(lengthen);
          const ax = axisX / drawn;
          const ay = axisY / drawn;
          ctx.setTransform(pixels * ax * lengthen, pixels * ay * lengthen, -pixels * ay * thin, pixels * ax * thin, pixels * x, pixels * y);
          ctx.drawImage(sprites[star.tint], -d / 2, -d / 2, d, d);
          ctx.setTransform(pixels, 0, 0, pixels, 0, 0);
        } else {
          ctx.drawImage(sprites[star.tint], x - d / 2, y - d / 2, d, d);
        }
      }

      if (stir > 20) wakeUntil = time + 0.15;

      if (shot) drawShot(time);
    };

    const frame = (now) => {
      if (calm && idle) { looping = false; return; }
      requestAnimationFrame(frame);
      const time = now / 1000;
      if (idle && !shot && (time < wakeUntil ? time - last < 0.012 : tick++ & 1)) return;
      draw(time, Math.min(time - last, 0.1));
      last = time;
    };

    return {
      start() { resize(); last = performance.now() / 1000; looping = true; requestAnimationFrame(frame); },
      resize() { resize(); if (calm) requestAnimationFrame((now) => draw(now / 1000, 0)); },
      rouse() {
        idle = false; wells = false; cursorRelease(); shotDone = false;
        if (!looping) { looping = true; last = performance.now() / 1000; requestAnimationFrame(frame); }
      },
      rest() { idle = true; wells = false; tick = 0; if (calm) requestAnimationFrame((now) => draw(now / 1000, 0)); },
      settle() { idle = true; wells = true; if (calm) requestAnimationFrame((now) => draw(now / 1000, 0)); else armCursor(); },
      shoot() { if (!shotDone) { shotDone = true; shot = { from: performance.now() / 1000 }; } }
    };
  })();


  /* Form niceties
     ---------------------------------------------------------------------- */

  const details = form.querySelector('textarea');
  if (details) {
    details.addEventListener('input', () => {
      details.style.height = 'auto';
      const wanted = details.scrollHeight + 1;
      const limit = parseFloat(getComputedStyle(details).maxHeight) || 134;
      details.style.height = `${Math.min(wanted, limit)}px`;
      details.style.overflowY = wanted > limit ? 'auto' : 'hidden';
    });
  }

  form.addEventListener('submit', (event) => {
    if (!form.getAttribute('action')) event.preventDefault();
  });


  /* Go
     ---------------------------------------------------------------------- */

  build();
  stars.start();

  let resizeQueued = false;
  const onResize = () => {
    if (resizeQueued) return;
    resizeQueued = true;
    requestAnimationFrame(() => {
      resizeQueued = false;
      if (state === 'to-cockpit') { resizeDirty = true; return; }
      layout();
      schedule();
      if (!finished) rebuilders.forEach((rebuild) => rebuild());
      stars.resize();
    });
  };
  addEventListener('resize', onResize);
  if ('ResizeObserver' in window) new ResizeObserver(onResize).observe(form);

  addEventListener('wheel', (event) => { if (Math.abs(event.deltaY) > 4) hurry(); }, { passive: true });
  let touchY = null;
  addEventListener('touchstart', (event) => { touchY = event.touches[0].clientY; }, { passive: true });
  addEventListener('touchmove', (event) => {
    if (touchY !== null && Math.abs(event.touches[0].clientY - touchY) > 28) hurry();
  }, { passive: true });
  addEventListener('keydown', (event) => {
    if (['ArrowDown', 'PageDown', 'End', ' '].includes(event.key) && !event.target.closest('a, button, input, textarea')) hurry();
  });

  // Scroll-back gestures
  {
    let lastT = -Infinity;
    let dir = 0;
    let acc = 0;
    let gestureCount = 0;
    let live = false;
    let flipBorn = false;
    resetGesture = () => { acc = 0; live = false; };

    addEventListener('wheel', (event) => {
      if (event.ctrlKey || event.metaKey) return;
      const mode = event.deltaMode;
      const dy = event.deltaY * (mode === 1 ? SB.line : mode === 2 ? innerHeight : 1);
      const gap = event.timeStamp - lastT;
      lastT = event.timeStamp;
      if (gap > SB.quiet) dir = 0;
      if (!dy || event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      const d = dy > 0 ? 1 : -1;
      if (d !== dir) {
        flipBorn = dir !== 0;
        dir = d; acc = 0; gestureCount = 0;
        live = canTrigger(d);
      }
      if (!live) return;
      acc += dy;
      gestureCount++;
      if (Math.abs(acc) < SB.threshold || (flipBorn && gestureCount < SB.flipEvents)) return;
      live = false;
      go(d, false);
    }, { passive: true });

    let finger = null;
    let voided = false;
    addEventListener('touchstart', (event) => {
      syncCanReturn();
      if (event.touches.length !== 1) { voided = true; finger = null; return; }
      voided = false;
      const t = event.touches[0];
      const direction = state === 'cockpit' ? 1 : -1;
      finger = { id: t.identifier, x: t.clientX, y: t.clientY, direction, ok: canTrigger(direction, true) };
    }, { passive: true });
    addEventListener('touchmove', (event) => {
      if (event.touches.length !== 1) { voided = true; finger = null; return; }
      if (!finger || !finger.ok || voided) return;
      const t = Array.from(event.touches).find((touch) => touch.identifier === finger.id);
      if (!t) return;
      const dx = t.clientX - finger.x;
      const dy = t.clientY - finger.y;
      if (Math.abs(dy) < SB.vertical * Math.abs(dx)) return;
      if (finger.direction > 0 ? dy > -SB.touchUp : dy < SB.touchDown) return;
      const direction = finger.direction;
      finger = null;
      go(direction, true);
    }, { passive: true });
    const lift = (event) => { finger = null; if (!event.touches.length) voided = false; };
    addEventListener('touchend', lift, { passive: true });
    addEventListener('touchcancel', lift, { passive: true });

    addEventListener('keydown', (event) => {
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || event.isComposing || event.defaultPrevented) return;
      if (state !== 'cockpit' && state !== 'form') return;
      const target = event.target && event.target.closest ? event.target : document.body;
      const inField = !!target.closest('input, textarea, select, [contenteditable]');
      const onControl = inField || !!target.closest('a, button, summary');
      const key = event.key;
      const space = key === ' ' && !onControl;
      if (state === 'cockpit') {
        if ((!event.shiftKey && !inField && ['ArrowDown', 'PageDown', 'End'].includes(key)) || (space && !event.shiftKey)) replay();
      } else if ((!event.shiftKey && !inField && ['ArrowUp', 'PageUp', 'Home'].includes(key)) || (space && event.shiftKey)) rewind(false);
    });
    form.addEventListener('focusin', () => { if (state === 'cockpit') replay(); });

    ['input', 'change', 'focusin', 'focusout'].forEach((type) => form.addEventListener(type, syncCanReturn, { passive: true }));
    form.addEventListener('reset', () => setTimeout(syncCanReturn, 0));
    addEventListener('pageshow', syncCanReturn);
  }

  // Hold the sequence while the tab is in the background
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && video.paused) tryPlay();
    if (finished || frozen || state === 'cockpit') return;
    if (state === 'to-cockpit') { if (document.hidden) arriveCockpit(); return; }
    animations.forEach((animation) => {
      if (document.hidden && animation.playState === 'running') animation.pause();
      else if (!document.hidden && animation.playState === 'paused') animation.play();
    });
  });

  // Lift the veil once the hero can be shown whole
  const settled = (promise) => Promise.resolve(promise).catch(() => {});
  const videoReady = new Promise((resolve) => {
    if (video.readyState >= 2) return resolve();
    ['loadeddata', 'playing', 'error'].forEach((type) => video.addEventListener(type, resolve, { once: true }));
  });
  const imageReady = cockpit.decode ? settled(cockpit.decode()) : Promise.resolve();
  const fontsReady = document.fonts ? settled(document.fonts.load('400 1em "Maison Neue"')) : Promise.resolve();

  Promise.race([
    Promise.all([videoReady, imageReady, fontsReady]),
    new Promise((resolve) => setTimeout(resolve, 3500))
  ]).then(() => requestAnimationFrame(start));
})();
