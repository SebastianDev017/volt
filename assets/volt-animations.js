/* =====================================================================
   VOLT Animations — GSAP 3.13 (free standard license, incl. all plugins)
   Orchestrates the signature scroll/reveal/morph animations.
   Respects prefers-reduced-motion and the merchant's use_gsap toggle.
   Config is injected as window.VoltAnimConfig in layout/theme.liquid.
   ===================================================================== */
(function () {
  'use strict';

  var CFG = window.VoltAnimConfig || {
    speed: 1, stagger: 0.06, parallaxIntensity: 30, ease: 'power3.out',
    respectReducedMotion: true, smoother: false, smootherAmount: 4
  };

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else { fn(); }
  }

  // Reveal pre-hidden elements no matter what (CDN failure failsafe also in theme.liquid).
  function reveal() { document.documentElement.classList.add('gsap-ready'); }

  function init() {
    if (!window.gsap) { reveal(); return; }

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced && CFG.respectReducedMotion !== false && !document.body.dataset.forceAnimations) {
      reveal();
      return;
    }

    // Register every plugin that actually loaded (CDN-resilient).
    var plugins = [
      window.ScrollTrigger, window.SplitText, window.DrawSVGPlugin,
      window.MorphSVGPlugin, window.Flip, window.ScrollSmoother,
      window.Draggable, window.InertiaPlugin
    ].filter(Boolean);
    if (plugins.length) gsap.registerPlugin.apply(gsap, plugins);

    // Keep ScrollTrigger from rendering start-states / firing callbacks during
    // setup — a common cause of the page jumping mid-load before settling.
    if (window.ScrollTrigger) {
      ScrollTrigger.defaults({ immediateRender: false });
      ScrollTrigger.config({ limitCallbacks: true });
    }

    gsap.defaults({ ease: CFG.ease || 'power3.out' });

    VoltAnim.smoothScroll();
    VoltAnim.splitTextReveal();
    VoltAnim.scrollParallax();
    VoltAnim.staggerCards();
    VoltAnim.counterRollup();
    VoltAnim.magneticHover();
    VoltAnim.drawSVGLines();
    VoltAnim.clipReveal();
    VoltAnim.genericReveal();
    VoltAnim.horizontalScroll();
    VoltAnim.morphStateChange();
    VoltAnim.flipLayoutTransition();
    VoltAnim.draggableCarousel();
    VoltAnim.floatCarousel();
    VoltAnim.heroSlider();
    VoltAnim.liquidCursor();
    VoltAnim.ctaPulse();

    reveal();
    // Lenis is initialised in volt-scroll.js, which loads before this file, so
    // refresh here runs AFTER Lenis init; refresh again on load once images/
    // fonts settle so trigger positions are correct (prevents mid-page landings).
    if (window.ScrollTrigger) {
      ScrollTrigger.refresh();
      window.addEventListener('load', function () { ScrollTrigger.refresh(); });
    }
  }

  var sp = function () { return CFG.speed || 1; };

  // ── GSAP seamless infinite loop helper (official GreenSock utility, verbatim) ──
  // Lays items in a row and builds a wrapping timeline; draggable:true gives
  // drag-with-snap via Draggable + Inertia WITHOUT pinning the page, so vertical
  // scroll is never blocked. Returns the timeline with next/previous/toIndex/
  // current/closestIndex helpers. https://gsap.com/docs/v3/HelperFunctions/
  function horizontalLoop(items, config) {
    let timeline;
    items = gsap.utils.toArray(items);
    config = config || {};
    gsap.context(() => {
      let onChange = config.onChange,
        lastIndex = 0,
        tl = gsap.timeline({repeat: config.repeat, onUpdate: onChange && function() {
            let i = tl.closestIndex();
            if (lastIndex !== i) { lastIndex = i; onChange(items[i], i); }
          }, paused: config.paused, defaults: {ease: "none"}, onReverseComplete: () => tl.totalTime(tl.rawTime() + tl.duration() * 100)}),
        length = items.length,
        startX = items[0].offsetLeft,
        times = [],
        widths = [],
        spaceBefore = [],
        xPercents = [],
        curIndex = 0,
        indexIsDirty = false,
        center = config.center,
        pixelsPerSecond = (config.speed || 1) * 100,
        snap = config.snap === false ? (v) => v : gsap.utils.snap(config.snap || 1),
        timeOffset = 0,
        container = center === true ? items[0].parentNode : gsap.utils.toArray(center)[0] || items[0].parentNode,
        totalWidth,
        getTotalWidth = () => items[length - 1].offsetLeft + xPercents[length - 1] / 100 * widths[length - 1] - startX + spaceBefore[0] + items[length - 1].offsetWidth * gsap.getProperty(items[length - 1], "scaleX") + (parseFloat(config.paddingRight) || 0),
        populateWidths = () => {
          let b1 = container.getBoundingClientRect(), b2;
          items.forEach((el, i) => {
            widths[i] = parseFloat(gsap.getProperty(el, "width", "px"));
            xPercents[i] = snap(parseFloat(gsap.getProperty(el, "x", "px")) / widths[i] * 100 + gsap.getProperty(el, "xPercent"));
            b2 = el.getBoundingClientRect();
            spaceBefore[i] = b2.left - (i ? b1.right : b1.left);
            b1 = b2;
          });
          gsap.set(items, { xPercent: (i) => xPercents[i] });
          totalWidth = getTotalWidth();
        },
        timeWrap,
        populateOffsets = () => {
          timeOffset = center ? tl.duration() * (container.offsetWidth / 2) / totalWidth : 0;
          center && times.forEach((t, i) => {
            times[i] = timeWrap(tl.labels["label" + i] + tl.duration() * widths[i] / 2 / totalWidth - timeOffset);
          });
        },
        getClosest = (values, value, wrap) => {
          let i = values.length, closest = 1e10, index = 0, d;
          while (i--) {
            d = Math.abs(values[i] - value);
            if (d > wrap / 2) { d = wrap - d; }
            if (d < closest) { closest = d; index = i; }
          }
          return index;
        },
        populateTimeline = () => {
          let i, item, curX, distanceToStart, distanceToLoop;
          tl.clear();
          for (i = 0; i < length; i++) {
            item = items[i];
            curX = xPercents[i] / 100 * widths[i];
            distanceToStart = item.offsetLeft + curX - startX + spaceBefore[0];
            distanceToLoop = distanceToStart + widths[i] * gsap.getProperty(item, "scaleX");
            tl.to(item, {xPercent: snap((curX - distanceToLoop) / widths[i] * 100), duration: distanceToLoop / pixelsPerSecond}, 0)
              .fromTo(item, {xPercent: snap((curX - distanceToLoop + totalWidth) / widths[i] * 100)}, {xPercent: xPercents[i], duration: (curX - distanceToLoop + totalWidth - curX) / pixelsPerSecond, immediateRender: false}, distanceToLoop / pixelsPerSecond)
              .add("label" + i, distanceToStart / pixelsPerSecond);
            times[i] = distanceToStart / pixelsPerSecond;
          }
          timeWrap = gsap.utils.wrap(0, tl.duration());
        },
        refresh = (deep) => {
          let progress = tl.progress();
          tl.progress(0, true);
          populateWidths();
          deep && populateTimeline();
          populateOffsets();
          deep && tl.draggable && tl.paused() ? tl.time(times[curIndex], true) : tl.progress(progress, true);
        },
        onResize = () => refresh(true),
        proxy;
      gsap.set(items, {x: 0});
      populateWidths();
      populateTimeline();
      populateOffsets();
      window.addEventListener("resize", onResize);
      function toIndex(index, vars) {
        vars = vars || {};
        (Math.abs(index - curIndex) > length / 2) && (index += index > curIndex ? -length : length);
        let newIndex = gsap.utils.wrap(0, length, index),
          time = times[newIndex];
        if (time > tl.time() !== index > curIndex && index !== curIndex) {
          time += tl.duration() * (index > curIndex ? 1 : -1);
        }
        if (time < 0 || time > tl.duration()) { vars.modifiers = {time: timeWrap}; }
        curIndex = newIndex;
        vars.overwrite = true;
        gsap.killTweensOf(proxy);
        return vars.duration === 0 ? tl.time(timeWrap(time)) : tl.tweenTo(time, vars);
      }
      tl.toIndex = (index, vars) => toIndex(index, vars);
      tl.closestIndex = (setCurrent) => {
        let index = getClosest(times, tl.time(), tl.duration());
        if (setCurrent) { curIndex = index; indexIsDirty = false; }
        return index;
      };
      tl.current = () => indexIsDirty ? tl.closestIndex(true) : curIndex;
      tl.next = (vars) => toIndex(tl.current() + 1, vars);
      tl.previous = (vars) => toIndex(tl.current() - 1, vars);
      tl.times = times;
      tl.progress(1, true).progress(0, true);
      if (config.reversed) { tl.vars.onReverseComplete(); tl.reverse(); }
      if (config.draggable && typeof Draggable === "function") {
        proxy = document.createElement("div");
        let wrap = gsap.utils.wrap(0, 1),
          ratio, startProgress, draggable, lastSnap, initChangeX, wasPlaying,
          align = () => tl.progress(wrap(startProgress + (draggable.startX - draggable.x) * ratio)),
          syncIndex = () => tl.closestIndex(true);
        draggable = Draggable.create(proxy, {
          trigger: items[0].parentNode,
          type: "x",
          onPressInit() {
            let x = this.x;
            gsap.killTweensOf(tl);
            wasPlaying = !tl.paused();
            tl.pause();
            startProgress = tl.progress();
            refresh();
            ratio = 1 / totalWidth;
            initChangeX = (startProgress / -ratio) - x;
            gsap.set(proxy, {x: startProgress / -ratio});
          },
          onDrag: align,
          onThrowUpdate: align,
          overshootTolerance: 0,
          inertia: true,
          snap(value) {
            if (Math.abs(startProgress / -ratio - this.x) < 10) { return lastSnap + initChangeX; }
            let time = -(value * ratio) * tl.duration(),
              wrappedTime = timeWrap(time),
              snapTime = times[getClosest(times, wrappedTime, tl.duration())],
              dif = snapTime - wrappedTime;
            Math.abs(dif) > tl.duration() / 2 && (dif += dif < 0 ? tl.duration() : -tl.duration());
            lastSnap = (time + dif) / tl.duration() / -ratio;
            return lastSnap;
          },
          onRelease() { syncIndex(); draggable.isThrowing && (indexIsDirty = true); },
          onThrowComplete: syncIndex
        })[0];
        tl.draggable = draggable;
      }
      tl.closestIndex(true);
      lastIndex = curIndex;
      onChange && onChange(items[curIndex], curIndex);
      timeline = tl;
      return () => window.removeEventListener("resize", onResize);
    });
    return timeline;
  }

  var VoltAnim = {

    // ── ScrollSmoother (opt-in; wrapper rendered only when setting on) ──
    smoothScroll: function () {
      if (!CFG.smoother || !window.ScrollSmoother) return;
      if (!document.getElementById('smooth-wrapper')) return;
      window.Volt = window.Volt || {};
      window.Volt.smoother = ScrollSmoother.create({
        wrapper: '#smooth-wrapper',
        content: '#smooth-content',
        smooth: Math.max(0.4, (CFG.smootherAmount || 4) * 0.3),
        effects: true,
        normalizeScroll: true
      });
    },

    // ── 1 · SplitText char/word/line reveal ──────────────────────────
    splitTextReveal: function () {
      if (!window.SplitText) return;
      document.querySelectorAll('[data-split]').forEach(function (el) {
        var type = el.dataset.split || 'words';
        var delay = parseFloat(el.dataset.animDelay || 0);
        var split = new SplitText(el, { type: type, mask: true, aria: 'auto' });
        var targets = type === 'chars' ? split.chars : type === 'lines' ? split.lines : split.words;
        gsap.from(targets, {
          yPercent: 110, opacity: 0, duration: 0.75 * sp(), stagger: 0.035, delay: delay,
          ease: 'power4.out',
          scrollTrigger: el.dataset.animTrigger === 'load' ? false
            : { trigger: el, start: 'top 88%', once: true }
        });
      });
    },

    // ── 2 · Scrub parallax ───────────────────────────────────────────
    scrollParallax: function () {
      if (!window.ScrollTrigger) return;
      var intensity = CFG.parallaxIntensity || 30;
      document.querySelectorAll('[data-parallax]').forEach(function (el) {
        var factor = parseFloat(el.dataset.parallax || 0.3);
        gsap.to(el, {
          yPercent: intensity * factor * -1, ease: 'none',
          scrollTrigger: { trigger: el.closest('section') || el, start: 'top bottom', end: 'bottom top', scrub: true }
        });
      });
    },

    // ── 3 · Stagger cascade ──────────────────────────────────────────
    staggerCards: function () {
      document.querySelectorAll('[data-stagger-group]').forEach(function (group) {
        var children = group.querySelectorAll('[data-stagger-item]');
        if (!children.length) return;
        var dir = group.dataset.staggerDir || 'up';
        var from = {
          opacity: 0, duration: 0.6 * sp(), stagger: CFG.stagger || 0.06, ease: 'power3.out',
          scrollTrigger: window.ScrollTrigger ? { trigger: group, start: 'top 82%', once: true } : false
        };
        if (dir === 'up') from.yPercent = 40;
        else if (dir === 'left') from.xPercent = 30;
        else if (dir === 'scale') from.scale = 0.85;
        else if (dir === 'rotate') { from.rotation = 5; from.yPercent = 20; }
        gsap.from(children, from);
      });
    },

    // ── 4 · Counter rollup ───────────────────────────────────────────
    counterRollup: function () {
      document.querySelectorAll('[data-counter]').forEach(function (el) {
        var target = parseFloat(el.dataset.counter);
        if (isNaN(target)) return;
        var prefix = el.dataset.counterPrefix || '';
        var suffix = el.dataset.counterSuffix || '';
        var decimals = parseInt(el.dataset.counterDecimals || 0, 10);
        var sep = el.dataset.counterSep === 'true';
        var run = function () {
          gsap.to({ v: 0 }, {
            v: target, duration: 1.6 * sp(), ease: 'power2.out',
            onUpdate: function () {
              var n = this.targets()[0].v.toFixed(decimals);
              if (sep) n = (+n).toLocaleString();
              el.textContent = prefix + n + suffix;
            }
          });
        };
        if (window.ScrollTrigger) ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true, onEnter: run });
        else run();
      });
    },

    // ── 5 · Magnetic hover ───────────────────────────────────────────
    magneticHover: function () {
      if (matchMedia('(hover: none)').matches) return;
      document.querySelectorAll('[data-magnetic]').forEach(function (el) {
        var strength = parseFloat(el.dataset.magneticStrength || 0.3);
        el.addEventListener('mousemove', function (e) {
          var r = el.getBoundingClientRect();
          gsap.to(el, {
            x: (e.clientX - (r.left + r.width / 2)) * strength,
            y: (e.clientY - (r.top + r.height / 2)) * strength,
            duration: 0.3, ease: 'power2.out'
          });
        });
        el.addEventListener('mouseleave', function () {
          gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1,0.5)' });
        });
      });
    },

    // ── 6 · DrawSVG paths ────────────────────────────────────────────
    drawSVGLines: function () {
      if (!window.DrawSVGPlugin) return;
      document.querySelectorAll('[data-draw]').forEach(function (path) {
        gsap.from(path, {
          drawSVG: '0%', duration: 1.2 * sp(), ease: 'power2.inOut',
          scrollTrigger: window.ScrollTrigger ? { trigger: path.closest('section') || path, start: 'top 78%', once: true } : false
        });
      });
    },

    // ── 7 · Clip-path reveal ─────────────────────────────────────────
    clipReveal: function () {
      var clips = {
        bottom: ['inset(100% 0 0 0)', 'inset(0% 0 0 0)'],
        top:    ['inset(0 0 100% 0)', 'inset(0 0 0% 0)'],
        left:   ['inset(0 100% 0 0)', 'inset(0 0% 0 0)'],
        right:  ['inset(0 0 0 100%)', 'inset(0 0 0 0%)'],
        center: ['inset(50% 50%)',    'inset(0% 0%)']
      };
      document.querySelectorAll('[data-clip]').forEach(function (el) {
        var dir = el.dataset.clip || 'bottom';
        var delay = parseFloat(el.dataset.animDelay || 0);
        gsap.fromTo(el, { clipPath: clips[dir][0] }, {
          clipPath: clips[dir][1], duration: 0.9 * sp(), delay: delay, ease: 'power4.inOut',
          scrollTrigger: window.ScrollTrigger ? { trigger: el, start: 'top 86%', once: true } : false
        });
      });
    },

    // ── 7b · Generic fade/slide/scale (driven by per-section settings) ─
    genericReveal: function () {
      var map = {
        'fade-up':    { y: 32, opacity: 0 },
        'fade-in':    { opacity: 0 },
        'slide-left': { x: -48, opacity: 0 },
        'slide-right':{ x: 48, opacity: 0 },
        'scale-in':   { scale: 0.92, opacity: 0 }
      };
      document.querySelectorAll('[data-anim]').forEach(function (el) {
        var from = map[el.dataset.anim];
        if (!from) return;
        var props = Object.assign({}, from, {
          duration: 0.7 * sp(), delay: parseFloat(el.dataset.animDelay || 0), ease: CFG.ease,
          scrollTrigger: window.ScrollTrigger ? { trigger: el, start: 'top 88%', once: true } : false
        });
        gsap.from(el, props);
      });
    },

    // ── 8 · Horizontal scroll (lookbook / gallery tracks) ────────────
    horizontalScroll: function () {
      if (!window.ScrollTrigger) return;
      document.querySelectorAll('[data-horizontal-scroll]').forEach(function (wrap) {
        var track = wrap.querySelector('[data-h-track]');
        if (!track) return;
        gsap.to(track, {
          x: function () { return -(track.scrollWidth - wrap.offsetWidth); }, ease: 'none',
          scrollTrigger: {
            trigger: wrap, start: 'top top',
            end: function () { return '+=' + (track.scrollWidth - wrap.offsetWidth); },
            pin: true, scrub: 1, anticipatePin: 1, invalidateOnRefresh: true
          }
        });
      });
    },

    // ── 9 · MorphSVG toggle (menu↔close, play↔pause) ─────────────────
    morphStateChange: function () {
      if (!window.MorphSVGPlugin) return;
      document.querySelectorAll('[data-morph-toggle]').forEach(function (trigger) {
        var fromPath = trigger.dataset.morphFrom, toPath = trigger.dataset.morphTo;
        var path = trigger.querySelector('[data-morph-path]') || trigger.querySelector('path');
        if (!fromPath || !toPath || !path) return;
        var on = false;
        trigger.addEventListener('click', function () {
          on = !on;
          gsap.to(path, { duration: 0.4, morphSVG: on ? toPath : fromPath, ease: 'power2.inOut' });
        });
      });
    },

    // ── Draggable carousel (hero product rail, inertia throw) ────────
    draggableCarousel: function () {
      if (!window.Draggable) return;
      document.querySelectorAll('[data-draggable-carousel]').forEach(function (track) {
        var wrap = track.closest('[data-carousel-wrap]') || track.parentElement;
        var bounds = function () { var m = -(track.scrollWidth - wrap.offsetWidth); return { minX: m > 0 ? 0 : m, maxX: 0 }; };
        Draggable.create(track, {
          type: 'x',
          bounds: bounds(),
          inertia: !!window.InertiaPlugin,
          edgeResistance: 0.85,
          dragClickables: true,
          onPress: function () { wrap.classList.add('is-dragging', 'has-dragged'); },
          onRelease: function () { wrap.classList.remove('is-dragging'); }
        });
        var d = Draggable.get(track);
        wrap.style.overflowX = 'hidden'; // Draggable owns movement now; disable native scroll
        window.addEventListener('resize', function () { if (d) d.applyBounds(bounds()); });
        if (window.ScrollTrigger) {
          gsap.from(track.children, {
            xPercent: 12, opacity: 0, duration: 0.55 * sp(), stagger: 0.06, ease: 'power3.out',
            scrollTrigger: { trigger: wrap, start: 'top 88%', once: true }
          });
        }
      });
    },

    // ── Floating scattered-card carousel (hero rail, inertia throw) ──
    floatCarousel: function () {
      var track = document.getElementById('fc-track');
      var stage = document.getElementById('fc-stage');
      if (!track || !stage) return;
      var cards = track.querySelectorAll('.fc-card');
      if (!cards.length) return;

      // Read the per-card scatter offsets straight from the inline CSS vars
      // (no matrix decomposition — avoids GSAP/CSS-transition conflicts).
      function v(card, prop, fb) { var n = parseFloat(card.style.getPropertyValue(prop)); return isNaN(n) ? fb : n; }
      function scatterTo(card, extra) {
        return gsap.to(card, Object.assign({ y: v(card, '--fc-y', 0), rotation: v(card, '--fc-rot', 0), scale: v(card, '--fc-scale', 1) }, extra));
      }
      function scatterAll(extra) { cards.forEach(function (card) { scatterTo(card, Object.assign({ delay: Math.random() * 0.2 }, extra)); }); }

      // Entrance: rise + fade, then land on the exact scatter targets.
      if (window.ScrollTrigger) {
        gsap.set(cards, { opacity: 0, y: 60, rotation: 0, scale: 1 });
        ScrollTrigger.create({
          trigger: stage, start: 'top 85%', once: true,
          onEnter: function () {
            cards.forEach(function (card, i) {
              scatterTo(card, { opacity: 1, duration: 0.7, delay: i * 0.07, ease: 'power3.out' });
            });
          }
        });
      }

      if (!window.Draggable) return; // native scroll fallback stays active
      var bounds = function () { var max = -(track.scrollWidth - stage.offsetWidth + 24); return { minX: max > 0 ? 0 : max, maxX: 0 }; };
      Draggable.create(track, {
        type: 'x', bounds: bounds(), inertia: !!window.InertiaPlugin,
        edgeResistance: 0.85, dragClickables: true,
        onPress: function () { stage.classList.add('has-dragged'); },
        onDragStart: function () { gsap.to(cards, { y: 0, rotation: 0, scale: 1, duration: 0.3, ease: 'power2.out' }); },
        onDragEnd: function () { scatterAll({ duration: 0.7, ease: 'elastic.out(1, 0.6)' }); },
        onThrowComplete: function () { scatterAll({ duration: 0.5, ease: 'power2.out' }); }
      });
      var d = Draggable.get(track);
      stage.style.overflowX = 'hidden'; // Draggable owns movement now
      window.addEventListener('resize', function () { if (d) d.applyBounds(bounds()); });
    },

    // ── Hero infinite slider (seamless loop, drag-snap, autoplay, no pin) ──
    heroSlider: function () {
      var root = document.querySelector('[data-hero-slider]');
      if (!root) return;
      var viewport = root.querySelector('[data-slider-viewport]');
      var track = root.querySelector('[data-slider-track]');
      var slides = root.querySelectorAll('.hero-slide');
      if (!slides.length || !track) return;
      // Only take over when the rail actually overflows; a short rail would show a
      // travelling gap in the loop, so leave the native overflow-x:auto fallback.
      var avail = viewport ? viewport.clientWidth : root.clientWidth;
      if (track.scrollWidth <= avail + 1) return;

      var loop = horizontalLoop(slides, { paused: true, draggable: true, speed: 1 });
      if (!loop) return;
      if (viewport) viewport.style.overflow = 'hidden'; // loop owns movement now

      var DELAY = 3, isHovering = false, timer = gsap.delayedCall(DELAY, spin);
      function spin() { loop.next({ duration: 0.8, ease: 'power2.inOut' }); timer.restart(true); }
      function pause() { timer.pause(); }
      function play() { if (!isHovering) timer.restart(true); }

      root.addEventListener('mouseenter', function () { isHovering = true; pause(); });
      root.addEventListener('mouseleave', function () { isHovering = false; play(); });

      var prev = root.querySelector('[data-slider-prev]');
      var next = root.querySelector('[data-slider-next]');
      if (prev) prev.addEventListener('click', function () { loop.previous({ duration: 0.5, ease: 'power2.inOut' }); });
      if (next) next.addEventListener('click', function () { loop.next({ duration: 0.5, ease: 'power2.inOut' }); });

      if (loop.draggable) {
        loop.draggable.addEventListener('press', pause);
        loop.draggable.addEventListener('release', play);
      }
    },

    // ── Liquid cursor (desktop pointer:fine only; velocity-driven deform) ──
    liquidCursor: function () {
      if (!document.body.classList.contains('volt-cursor-enabled')) return;
      if (!window.matchMedia('(pointer: fine)').matches) return;
      if (!window.gsap || typeof gsap.quickTo !== 'function') return;

      var dot = document.createElement('div'); dot.className = 'volt-cursor-dot';
      var fol = document.createElement('div'); fol.className = 'volt-cursor-follower';
      document.body.appendChild(dot); document.body.appendChild(fol);
      document.body.classList.add('has-custom-cursor');
      gsap.set([dot, fol], { transformOrigin: '50% 50%' });

      // A modal <dialog> renders in the top layer (above any z-index), which clips
      // a body-level cursor. Re-parent the cursor into whichever dialog is open so
      // it stays visible inside Quick View etc.; move it back to body on close.
      // position:fixed keeps the transform viewport-relative across re-parenting.
      function relocateCursor() {
        var dlg = document.querySelector('dialog[open]');
        var host = dlg || document.body;
        if (dot.parentNode !== host) { host.appendChild(dot); host.appendChild(fol); }
      }
      if (window.MutationObserver) {
        new MutationObserver(relocateCursor).observe(document.body, { attributes: true, attributeFilter: ['open'], subtree: true });
      }

      var dotX = gsap.quickSetter(dot, 'x', 'px'), dotY = gsap.quickSetter(dot, 'y', 'px');
      var xTo = gsap.quickTo(fol, 'x', { duration: 0.12, ease: 'power3' });
      var yTo = gsap.quickTo(fol, 'y', { duration: 0.12, ease: 'power3' });

      var px = 0, py = 0, hovDot = 1, hovFol = 1, idle;
      function deform(t, ang) {
        gsap.to(fol, {
          rotation: ang, scaleX: hovFol * (1 + t * 0.6), scaleY: hovFol * (1 - t * 0.35),
          borderRadius: t > 0.5 ? '58% 42% 52% 48%' : (t > 0.12 ? '50% 45% 50% 45%' : '50%'),
          duration: 0.2, ease: 'power3.out', overwrite: 'auto'
        });
      }
      window.addEventListener('mousemove', function (e) {
        dotX(e.clientX); dotY(e.clientY); xTo(e.clientX); yTo(e.clientY);
        var vx = e.clientX - px, vy = e.clientY - py; px = e.clientX; py = e.clientY;
        var t = Math.min(Math.sqrt(vx * vx + vy * vy), 60) / 60;
        deform(t, Math.atan2(vy, vx) * 180 / Math.PI);
        clearTimeout(idle); idle = setTimeout(function () { deform(0, 0); }, 90);
      }, { passive: true });

      function hover(ds, fs) { hovDot = ds; hovFol = fs; gsap.to(dot, { scale: ds, duration: 0.2, delay: 0.04, ease: 'power3.out' }); deform(0, 0); }
      function unhover() { hovDot = 1; hovFol = 1; gsap.to(dot, { scale: 1, duration: 0.25, ease: 'power3.out' }); deform(0, 0); }
      var sel = 'a, button, [data-quick-view], [role="button"], .btn, summary, label, input, select, textarea';
      var media = 'img, picture, .volt-card__media, [data-cursor-image]';
      document.addEventListener('mouseover', function (e) {
        if (!e.target.closest) return;
        if (e.target.closest(media)) hover(0.3, 2.0);
        else if (e.target.closest(sel)) hover(0.5, 1.6);
      });
      document.addEventListener('mouseout', function (e) {
        if (!e.target.closest) return;
        var was = e.target.closest(sel + ', ' + media);
        if (was && (!e.relatedTarget || !was.contains(e.relatedTarget))) unhover();
      });
      window.addEventListener('mousedown', function () { gsap.to(dot, { scale: 0.8, duration: 0.12 }); gsap.to(fol, { scale: 0.8, duration: 0.12, overwrite: 'auto' }); });
      window.addEventListener('mouseup', function () { gsap.to(dot, { scale: hovDot, duration: 0.5, ease: 'elastic.out(1,0.5)' }); deform(0, 0); });
    },

    // ── Idle pulse on primary CTAs (stops on any user engagement) ──
    ctaPulse: function () {
      if (!window.gsap || window.matchMedia('(hover: none)').matches) return;
      var ctas = document.querySelectorAll('.btn--acid:not(.volt-qv__add):not(.volt-sticky-cta__btn)');
      if (!ctas.length) return;
      var tween = null, idle = null;
      function start() { if (tween) return; tween = gsap.to(ctas, { scale: 1.02, duration: 0.45, repeat: -1, yoyo: true, repeatDelay: 3.1, ease: 'sine.inOut', transformOrigin: '50% 50%' }); }
      function stop() { if (tween) { tween.kill(); tween = null; gsap.to(ctas, { scale: 1, duration: 0.3, overwrite: 'auto' }); } }
      function reset() { stop(); clearTimeout(idle); idle = setTimeout(start, 4000); }
      ['mousemove', 'scroll', 'keydown', 'pointerdown', 'touchstart'].forEach(function (ev) { window.addEventListener(ev, reset, { passive: true }); });
      reset();
    },

    // ── 10 · FLIP layout transitions (grid/list, filters, reorder) ────
    flipLayoutTransition: function () {
      if (!window.Flip) return;
      window.VoltFlip = {
        capture: function (els) { return Flip.getState(els); },
        animate: function (state, els, opts) {
          opts = opts || {};
          Flip.from(state, {
            targets: els, duration: opts.duration || 0.5, ease: opts.ease || 'power2.inOut',
            stagger: opts.stagger || 0.04, absolute: true,
            onEnter: function (e) { return gsap.from(e, { opacity: 0, scale: 0.9, duration: 0.4 }); },
            onLeave: function (e) { return gsap.to(e, { opacity: 0, scale: 0.9, duration: 0.3 }); }
          });
        }
      };
    }
  };

  window.VoltAnim = VoltAnim;

  // Defined last so the object literal above is assigned before init runs
  // (deferred scripts execute at readyState 'interactive', so ready() may
  // fire synchronously).
  ready(init);
})();
