/* VOLT page loader — letter-fill intro. Coordinates with body.ready and
   dispatches `volt:ready` so the hero entrance can wait for it.
   Respects prefers-reduced-motion + session-once + a hard safety timeout. */
(function () {
  var loader = document.getElementById('volt-loader');
  var root = document.documentElement;
  var body = document.body;

  function finish() {
    body.classList.add('ready');
    document.dispatchEvent(new CustomEvent('volt:ready'));
  }

  // Skipped (repeat visit, or no loader in DOM): reveal immediately.
  if (!loader || root.classList.contains('loader-skip')) {
    if (loader) loader.parentNode && loader.remove();
    finish();
    return;
  }

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var bar = loader.querySelector('[data-loader-bar]');
  var chars = loader.querySelectorAll('[data-loader-char]');
  var done = false;

  function markSession() {
    if (loader.dataset.sessionOnce === '1') {
      try { sessionStorage.setItem('volt-loaded', '1'); } catch (e) {}
    }
  }

  function animateLetters() {
    if (reduced) return;
    if (window.gsap) {
      gsap.to(chars, { y: '0%', duration: 0.5, stagger: 0.07, ease: 'power4.out', delay: 0.05 });
    } else {
      chars.forEach(function (c, i) {
        setTimeout(function () { c.style.transition = '0.4s cubic-bezier(0.16,1,0.3,1)'; c.style.transform = 'translateY(0)'; }, i * 70);
      });
    }
  }

  function close() {
    if (done) return;
    done = true;
    clearInterval(timer);
    if (bar) bar.style.width = '100%';
    markSession();
    var wait = reduced ? 150 : (chars.length * 70 + 450);
    setTimeout(function () {
      loader.classList.add('is-done');
      finish();
      setTimeout(function () { loader.parentNode && loader.remove(); }, 600);
    }, wait);
  }

  // Fake progress
  var progress = 0;
  var timer = setInterval(function () {
    progress += Math.random() * 14;
    if (progress > 90) progress = 90;
    if (bar) bar.style.width = progress + '%';
  }, 100);

  animateLetters();
  window.addEventListener('load', close);
  // Safety: never trap the user behind the loader.
  setTimeout(close, 4000);
})();
