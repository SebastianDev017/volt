/* =====================================================================
   VOLT — volt-scroll.js · Lenis smooth scroll, synced to the GSAP ticker
   Loaded only when settings.smooth_scroll is on and ScrollSmoother is off.
   Exposes window.VoltLenis (and window.Volt.lenis) for the rest of the theme.
   ===================================================================== */
(function () {
  'use strict';

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  // ScrollSmoother (when enabled) owns the scroll position — don't double-drive it.
  if (document.getElementById('smooth-wrapper')) return;
  if (!window.Lenis) return;

  var lenis = new window.Lenis({ lerp: 0.08, duration: 1.2, smoothWheel: true });
  lenis.scrollTo(0, { immediate: true }); // pin to top before any ScrollTrigger setup (FIX 12)

  window.VoltLenis = lenis;
  window.Volt = window.Volt || {};
  window.Volt.lenis = lenis;

  if (window.gsap) {
    // Drive Lenis from GSAP's ticker so scroll-linked animations stay in sync.
    if (window.ScrollTrigger) lenis.on('scroll', window.ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  } else {
    // GSAP failed to load — keep Lenis running on its own rAF loop.
    var raf = function (t) { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
})();
