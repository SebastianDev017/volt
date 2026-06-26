/* =====================================================================
   VOLT — theme.js · core web components (framework-free)
   Section-specific components (cart, mega-menu, quiz, etc.) load later.
   ===================================================================== */
(function () {
  'use strict';

  const root = document.documentElement;
  const body = document.body;
  const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const on = (v) => v !== 'false' && v !== false;

  window.Volt = {
    ease: 'cubic-bezier(0.16, 1, 0.3, 1)',
    reducedMotion: RM,
    settings: {
      animations: on(body.dataset.animations),
      gauge: on(body.dataset.gauge),
      smoothScroll: on(body.dataset.smoothScroll),
    },
  };

  /* page fade-in */
  window.addEventListener('load', () => {
    requestAnimationFrame(() => body.classList.add('ready'));
  });

  /* ---------- ScrollAnimator: reveals [data-animate] ---------- */
  const animatable = () => Array.from(document.querySelectorAll('[data-animate]'));
  if (!root.classList.contains('js')) root.classList.add('js');

  if (!Volt.settings.animations || RM) {
    animatable().forEach((el) => el.classList.add('is-visible'));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.2, rootMargin: '0px 0px -6% 0px' }
    );
    animatable().forEach((el) => io.observe(el));
  }

  /* ---------- VoltGauge: animated SVG semicircle ---------- */
  class VoltGauge extends HTMLElement {
    connectedCallback() {
      const value = Math.max(0, Math.min(100, parseFloat(this.dataset.value || '0')));
      const label = this.dataset.label || '';
      const sub = this.dataset.sub || '';
      const r = 42, len = Math.PI * r;
      const offset = RM || !Volt.settings.gauge ? len * (1 - value / 100) : len;
      this.innerHTML =
        '<div class="gauge-wrap" style="position:relative">' +
        '<svg viewBox="0 0 100 60" role="img" aria-label="' + label + ' ' + value + '%">' +
        '<path class="gauge-track" d="M8 50 A42 42 0 0 1 92 50" stroke-width="6"></path>' +
        '<path class="gauge-value" d="M8 50 A42 42 0 0 1 92 50" stroke-width="6" ' +
        'style="stroke-dasharray:' + len + ';stroke-dashoffset:' + offset + '"></path>' +
        '</svg>' +
        '<div class="gauge-label" style="position:absolute;inset:0;display:flex;flex-direction:column;' +
        'align-items:center;justify-content:flex-end;padding-bottom:2px;text-align:center">' +
        (label ? '<span class="data" style="font-size:22px;line-height:1;color:var(--color-ink)">' + label + '</span>' : '') +
        (sub ? '<span class="label muted" style="margin-top:4px">' + sub + '</span>' : '') +
        '</div></div>';

      if (RM || !Volt.settings.gauge) return;
      const valuePath = this.querySelector('.gauge-value');
      const target = len * (1 - value / 100);
      const io = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              requestAnimationFrame(() => { valuePath.style.strokeDashoffset = target; });
              obs.disconnect();
            }
          });
        },
        { threshold: 0.4 }
      );
      io.observe(this);
    }
  }
  customElements.define('volt-gauge', VoltGauge);

  /* ---------- VoltVitalsStrip: seamless marquee ---------- */
  class VoltVitalsStrip extends HTMLElement {
    connectedCallback() {
      const track = this.querySelector('.vitals-track');
      if (!track || track.dataset.cloned) return;
      track.dataset.cloned = '1';
      track.setAttribute('aria-hidden', 'false');
      const clone = track.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      this.appendChild(clone);
    }
  }
  customElements.define('volt-vitals-strip', VoltVitalsStrip);

  /* ---------- ScrollTopButton ---------- */
  class ScrollTopButton extends HTMLElement {
    connectedCallback() {
      const btn = this.querySelector('button');
      if (!btn) return;
      const toggle = () => this.classList.toggle('is-visible', window.scrollY > 400);
      toggle();
      window.addEventListener('scroll', toggle, { passive: true });
      btn.addEventListener('click', () => {
        if (window.Volt.lenis) window.Volt.lenis.scrollTo(0);
        else window.scrollTo({ top: 0, behavior: RM ? 'auto' : 'smooth' });
      });
    }
  }
  customElements.define('scroll-top-button', ScrollTopButton);

  /* ---------- CountdownTimer (global: announcement bar, membership tiers) ---------- */
  class VoltCountdown extends HTMLElement {
    connectedCallback() {
      this.display = this.querySelector('[data-cd-display]');
      this.end = new Date(this.getAttribute('data-end')).getTime();
      if (!this.display || isNaN(this.end)) return;
      this.tick = this.tick.bind(this);
      this.tick();
      this.timer = setInterval(this.tick, 1000);
    }
    disconnectedCallback() { clearInterval(this.timer); }
    p(n) { return String(n).padStart(2, '0'); }
    tick() {
      let s = Math.floor((this.end - Date.now()) / 1000);
      if (s <= 0) { this.display.textContent = '00:00:00'; clearInterval(this.timer); return; }
      const d = Math.floor(s / 86400); s -= d * 86400;
      const h = Math.floor(s / 3600); s -= h * 3600;
      const m = Math.floor(s / 60); s -= m * 60;
      this.display.textContent = (d > 0 ? d + 'd ' : '') + this.p(h) + ':' + this.p(m) + ':' + this.p(s);
    }
  }
  if (!customElements.get('countdown-timer')) customElements.define('countdown-timer', VoltCountdown);

  /* ---------- Card colour swatches (hover/click swaps image + label) ---------- */
  const swImg = (card) => card.querySelector('.volt-card__img');
  const swLabel = (card) => card.querySelector('.card-swatch-label');
  function swApply(card, sw) {
    const img = swImg(card), label = swLabel(card);
    if (img && sw.dataset.swatchImage) {
      if (!img.dataset.origSrc) img.dataset.origSrc = img.currentSrc || img.src;
      img.src = sw.dataset.swatchImage;
      if (window.gsap) gsap.fromTo(img, { opacity: 0.7 }, { opacity: 1, duration: 0.25, ease: 'power2.out' });
    }
    if (label) {
      if (!label.dataset.orig) label.dataset.orig = label.textContent.trim();
      if (sw.dataset.colorName) label.textContent = sw.dataset.colorName;
    }
  }
  document.addEventListener('mouseover', (e) => {
    const sw = e.target.closest ? e.target.closest('.card-swatch') : null;
    if (!sw) return;
    const card = sw.closest('.volt-card');
    if (card) swApply(card, sw);
  });
  document.addEventListener('mouseout', (e) => {
    const card = e.target.closest ? e.target.closest('.volt-card') : null;
    if (!card || card.contains(e.relatedTarget)) return;
    const img = swImg(card), label = swLabel(card), active = card.querySelector('.card-swatch.is-active');
    if (active) {
      swApply(card, active);
      if (!active.dataset.swatchImage && img && img.dataset.origSrc) img.src = img.dataset.origSrc;
    } else {
      if (img && img.dataset.origSrc) img.src = img.dataset.origSrc;
      if (label && label.dataset.orig) label.textContent = label.dataset.orig;
    }
  });
  document.addEventListener('click', (e) => {
    const sw = e.target.closest ? e.target.closest('.card-swatch') : null;
    if (!sw) return;
    e.preventDefault();
    const card = sw.closest('.volt-card');
    if (!card) return;
    card.querySelectorAll('.card-swatch').forEach((s) => s.classList.remove('is-active'));
    sw.classList.add('is-active');
    swApply(card, sw);
  });

  /* ---------- Smooth scroll (Lenis, if present & enabled) ---------- */
  if (Volt.settings.smoothScroll && !RM && window.Lenis) {
    const lenis = new window.Lenis({ duration: 1.1, easing: (t) => 1 - Math.pow(1 - t, 3) });
    window.Volt.lenis = lenis;
    const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
})();
