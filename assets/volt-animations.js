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

  ready(function () {
    if (!window.gsap) { reveal(); return; }

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced && CFG.respectReducedMotion !== false && !document.body.dataset.forceAnimations) {
      reveal();
      return;
    }

    // Register every plugin that actually loaded (CDN-resilient).
    var plugins = [
      window.ScrollTrigger, window.SplitText, window.DrawSVGPlugin,
      window.MorphSVGPlugin, window.Flip, window.ScrollSmoother
    ].filter(Boolean);
    if (plugins.length) gsap.registerPlugin.apply(gsap, plugins);

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

    reveal();
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  });

  var sp = function () { return CFG.speed || 1; };

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
})();
