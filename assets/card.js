/* =====================================================================
   VOLT — card.js · product-card interactivity (swatches + quick-add)
   Delegated listeners scoped per .volt-card. Loaded deferred, framework-free.
   ===================================================================== */
(function () {
  'use strict';

  // Both the primary image and the hover-swap second image (--2) carry .volt-card__img;
  // swap them together so the colour image is the one shown even while hovering.
  var swImgs = function (card) { return card.querySelectorAll('.volt-card__img'); };
  var swLabel = function (card) { return card.querySelector('.card-swatch-label'); };

  function swApply(card, sw) {
    var imgs = swImgs(card), label = swLabel(card);
    if (imgs.length && sw.dataset.swatchImage) {
      imgs.forEach(function (img) {
        if (!img.dataset.origSrc) img.dataset.origSrc = img.currentSrc || img.src;
        img.src = sw.dataset.swatchImage;
      });
      if (window.gsap) gsap.fromTo(imgs[0], { opacity: 0.7 }, { opacity: 1, duration: 0.25, ease: 'power2.out' });
    }
    if (label) {
      if (!label.dataset.orig) label.dataset.orig = label.textContent.trim();
      if (sw.dataset.colorName) label.textContent = sw.dataset.colorName;
    }
  }

  function swRestore(card) {
    swImgs(card).forEach(function (img) { if (img.dataset.origSrc) img.src = img.dataset.origSrc; });
    var label = swLabel(card);
    if (label && label.dataset.orig) label.textContent = label.dataset.orig;
  }

  /* hover → preview the colour's image + label on that card only */
  document.addEventListener('mouseover', function (e) {
    var sw = e.target.closest ? e.target.closest('.card-swatch') : null;
    if (!sw) return;
    var card = sw.closest('.volt-card');
    if (card) swApply(card, sw);
  });

  /* leaving the card → restore original (unless a swatch is locked with its own image) */
  document.addEventListener('mouseout', function (e) {
    var card = e.target.closest ? e.target.closest('.volt-card') : null;
    if (!card || card.contains(e.relatedTarget)) return;
    var active = card.querySelector('.card-swatch.is-active');
    if (active && active.dataset.swatchImage) swApply(card, active);
    else swRestore(card);
  });

  /* click → lock the swatch + set the card's selected variant for quick-add */
  document.addEventListener('click', function (e) {
    var sw = e.target.closest ? e.target.closest('.card-swatch') : null;
    if (!sw) return;
    e.preventDefault();
    var card = sw.closest('.volt-card');
    if (!card) return;
    card.querySelectorAll('.card-swatch').forEach(function (s) { s.classList.remove('is-active'); });
    sw.classList.add('is-active');
    swApply(card, sw);
    // Track the selected variant for quick-add. avail requires a real id, so an
    // unmatched colour (no variant id) disables quick-add instead of leaving stale state.
    var hasId = !!sw.dataset.variantId;
    var avail = sw.dataset.available !== 'false' && hasId;
    card.dataset.selectedAvailable = avail ? 'true' : 'false';
    if (hasId) {
      card.dataset.selectedVariant = sw.dataset.variantId;
      var idInput = card.querySelector('[data-qa-id]');
      if (idInput) idInput.value = sw.dataset.variantId;
    }
    var qbtn = card.querySelector('[data-qa-btn]');
    if (qbtn) {
      qbtn.disabled = !avail;
      qbtn.textContent = avail ? (qbtn.dataset.addLabel || qbtn.textContent) : (qbtn.dataset.soldLabel || 'Sold out');
    }
  });

  /* quick-add → add the SELECTED variant (data-selected-variant), not the default */
  document.addEventListener('submit', function (e) {
    var form = e.target.closest ? e.target.closest('.volt-card__qa') : null;
    if (!form) return;
    e.preventDefault();
    var card = form.closest('.volt-card');
    if (card && card.dataset.selectedAvailable === 'false') return;
    var id = (card && card.dataset.selectedVariant) || (form.querySelector('[data-qa-id]') || {}).value;
    if (!id) return;
    var btn = form.querySelector('[data-qa-btn]');
    var label = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = '…'; }
    fetch('/cart/add.js', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: [{ id: Number(id), quantity: 1 }] }) })
      .then(function (r) { if (!r.ok) throw 0; return fetch('/cart.js'); })
      .then(function (r) { return r.json(); })
      .then(function (cart) {
        document.querySelectorAll('[data-cart-count]').forEach(function (n) { n.textContent = cart.item_count; });
        document.dispatchEvent(new CustomEvent('volt:cart:open'));
        document.dispatchEvent(new CustomEvent('cart:updated', { detail: { item_count: cart.item_count } }));
        if (btn) { btn.textContent = '✓'; setTimeout(function () { btn.disabled = false; btn.textContent = btn.dataset.addLabel || label; }, 900); }
      })
      .catch(function () { if (btn) { btn.disabled = false; btn.textContent = btn.dataset.addLabel || label; } });
  });
})();
