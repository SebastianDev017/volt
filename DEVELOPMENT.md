# VOLT — Development Reference
Repo: github.com/SebastianDev017/volt · Store: volt-dev.myshopify.com
Base: Shopify skeleton-theme (OS 2.0) · Presets: Volt (default) · Anthracite · Titanium

## MCPs ACTIVE
- shopify-dev: validate_theme, search_docs_chunks, learn_shopify_api
- playwright: browser_navigate, browser_take_screenshot, browser_evaluate
- context7: library documentation on demand

## CRITICAL RULES — ALL LEARNED FROM SIDE ATELIER
1. `shopify theme check --config theme-check:all` = 0 offenses BEFORE every commit
2. Schema i18n with `t:` keys FROM THE START — every string in every schema
3. `listings/` = folders: `listings/[preset]/listing.json + preview.png + templates/index.json`
4. First preset name = "Volt" = must match `theme_name` in settings_schema.json EXACTLY
5. `.gitattributes` has: `config/settings_schema.json merge=ours`
6. font_face guards: `{%- if font.family != blank -%}` for all font settings
7. CSS: use `:has()` NEVER `:is()` — Shopify minifier strips `:is()`
8. body data-attrs for ALL feature toggles: data-smooth-scroll data-cursor data-grain data-animations data-transitions
9. Trailing commas in JSON pass theme check but BREAK in production — never add
10. range settings: integers only. Default AND current must sit on step grid exactly
11. theme_info: only ONE of theme_support_url OR theme_support_email (both = error)
12. No hyphens in section/block/order keys — alphanumeric + underscore only
13. Color settings → ALWAYS CSS fallback: `var(--color-bg, #F0EEEA)`
14. settings_data.json `current` = object (live settings), NOT a preset-name string
15. New boolean settings not in settings_data render as `data-x=""` (treated as true) — use `!= false` guard
16. GSAP 3.13+ is free for commercial use incl. all plugins (SplitText/MorphSVG/DrawSVG/Flip/ScrollSmoother) — the old "Business Green for resale" rule was pre-3.13. VOLT loads GSAP 3.13 from jsDelivr CDN by deliberate choice (gated by `settings.use_gsap`). NOTE: this puts VOLT OFF the Theme Store remote-asset path; `RemoteAsset` (CDN scripts) + `AssetSizeJavaScript` (volt-animations.js ~11KB) are suppressed via inline `{%- # theme-check-disable -%}` in theme.liquid. For a Theme-Store build, self-host + trim the plugin set instead. Lenis OK (MIT).
17. product-info custom element needs `display: block` in CSS
18. Shopify GitHub sync can stall → touch layout/theme.liquid to force re-deploy
19. AssetSizeJavaScript: each globally-loaded JS file ≤10KB gzip
20. Always emit a favicon in theme.liquid (inline SVG fallback)

## FONTS — SPECIAL HANDLING
Syne + DM Mono are NOT in the Shopify font_picker → never use font_picker for them.
Load via Google Fonts CDN in layout/theme.liquid:
```
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400&display=swap" rel="stylesheet">
```
Theme Setting `use_syne_heading` (checkbox, default true) toggles Syne vs the font_picker body heading.
css-variables.liquid resolves `--font-display` from the toggle, with a `font_face` guard fallback.

## SUBSCRIPTIONS / SELLING PLANS
VOLT renders Shopify's Selling Plans API natively. Merchants install "Shopify Subscriptions" (free, first-party)
or any paid app. The theme has ZERO billing logic — only renders the UI widget when `product.selling_plan_groups.size > 0`.
Custom UI: "SUBSCRIBE & SAVE" toggle (acid when active), plan radios (acid border), savings pill "-25% ANNUAL",
one-time option (ghost styling).

## PRODUCT DATA — NO METAFIELDS (Theme-Store-clean)
VOLT requires ZERO merchant-configured metafields. Everything comes from the Theme Editor (section blocks/settings) or native Shopify product data. Rule of thumb: if a merchant could set it in the section editor → section block/setting; if it's intrinsic product data → native field/tag. Metafields are never the answer.

Native product TAGS (merchant adds in the normal product admin):
- `badge:new` · `badge:bestseller` · `badge:limited` · `badge:rare` → card/PDP badge (value uppercased)
- `cat:strength` · `cat:recovery` · `cat:endurance` · `cat:nutrition` → card/PDP category pill (value capitalized)
- Journal card category = the article's first tag.

Native product FIELDS:
- `product.type` → membership tier ("Starter" / "Performance" / "Elite"): tier badge, label, and gauge default (33/67/100).
- `product.compare_at_price` > `product.price` → "MEMBER SAVE X%" pill + strikethrough (no hardcoded discount; merchant just sets a compare-at price).
- `product.vendor` → PDP subtitle.

Section BLOCKS (Theme Editor; defaults pre-populated in the template JSON):
- main-product → `macro` (nutrition rows), `certification` (cert badges), `faq`, `shipping_info`, `size_chart`.
- main-product-membership → `feature` (included checkbox + text), `faq`.
- main-product-bundle → `bundle_item` (product + quantity), `bundle_info` (limit 1: discount %, savings label, badge label), `bundle_benefit`.

Template detection: `snippets/product-card.liquid` branches on `product.template_suffix`
(membership → "Membership" badge + "from $X/mo" + Join now; bundle → "Bundle" + Get the bundle; else standard quick-add + compare-at member savings).

Member-only content gating (e.g. `customer.tags`) is the merchant's job via Shopify Flow / Markets — NOT baked into the theme.

## LISTINGS STRUCTURE (Shopify requires this exact format)
```
listings/
  volt/      { listing.json (name "Volt"), preview.png 1904×1065, templates/index.json }
  anthracite/{ listing.json, preview.png, templates/index.json }
  titanium/  { listing.json, preview.png, templates/index.json }
```

## BUILD METHOD (proven on Side Atelier)
1. Scaffold skeleton-theme (the only Theme-Store-approved base).
2. Author the coupled spine (base.css + css-variables + theme.liquid + theme.js + settings + presets) → theme check 0 BEFORE fanning out.
3. Fan out leaf sections via Workflow against a contract + a gold-standard section.
4. Adversarial review Workflow (dimensions × per-finding verify) + Playwright live verify.
5. git fetch + rebase → theme check 0 + validate_theme → push → verify live storefront.

## GSAP MOTION LAYER (assets/volt-animations.js)
Engine reads `window.VoltAnimConfig` (injected in theme.liquid from settings). Handlers, by data-attribute:
- `[data-split="chars|words|lines"]` SplitText reveal · `[data-parallax="0.2"]` scrub parallax
- `[data-stagger-group][data-stagger-dir="up|fade|scale|rotate"]` + `[data-stagger-item]` cascade
- `[data-counter="2400"][data-counter-suffix][data-counter-decimals][data-counter-sep]` rollup
- `[data-magnetic][data-magnetic-strength]` cursor magnet · `[data-draw]` DrawSVG path
- `[data-clip="bottom|top|left|right|center"]` clip reveal · `[data-anim="fade-up|fade-in|slide-left|slide-right|scale-in"]`
- `[data-horizontal-scroll]>[data-h-track]` pinned scroller · `[data-morph-toggle][data-morph-from][data-morph-to]` MorphSVG · `window.VoltFlip` (Flip)
Per-section control: `snippets/anim-attrs.liquid` maps `section.settings.{heading,body,image,cards}_animation` → the right attribute. Shared schema locale keys live under `sections.animation.*`. Anti-FOUC: `html.gsap-anim:not(.gsap-ready)` hides animated nodes; a 2.4s failsafe + `reveal()` always un-hides.
Settings (Theme settings → Animations): use_gsap, respect_reduced_motion, animation_speed, animation_stagger, parallax_intensity, animation_ease, use_scroll_smoother, scroll_smooth_amount.

## FEATURE INVENTORY (beyond the homepage spine)
- Sections: promo-popup, age-verifier, press-coverage, lookbook (scroll/mosaic), slideshow (`<volt-slideshow>`), image-gallery (masonry/grid), image-hotspot (shoppable scene).
- Quick View: `snippets/quick-view.liquid` (dialog shell + co-located inline controller, keeps theme.js <10KB) rendered once in theme.liquid; trigger `[data-quick-view][data-handle]` on product cards (gated by `settings.quick_view`); fetches `/products/{handle}.js`.
- PDP (main-product): `enable_zoom` (click main image → `.volt-zoom` dialog); blocks `shipping_info` (limit 1) and `size_chart` (limit 1, modal).
- Product grid: `promo_tile` block interleaved by `position` (1-based grid slot).
- Dialog primitive: `.volt-dialog` + `.volt-dialog__close` + `.volt-dialog[open]` animation + styled `::backdrop` (base.css). Reused by quick-view, promo-popup, age-verifier, size-chart, zoom.
- i18n: complete EU runtime mirrors `locales/{es,fr,de,it,pt-BR}.json` (commerce/nav strings translated; long-tail keeps English fallback so `MatchingTranslations` passes). RTL block in base.css (`[dir="rtl"]`).
- Known gaps (not built): PDP gallery is image-only (no native video media block yet); no recently-viewed section. Hi-res handled via `image_tag` srcset everywhere.

## USER-ONLY / OUT-OF-BAND STEPS (cannot be done headlessly)
- Create dev store `volt-dev.myshopify.com` in Shopify Partners.
- Connect GitHub repo → Shopify (Online Store → Themes → Add theme → Connect from GitHub → main).
- Shopify CLI device-code auth for `theme dev`/`theme check` against the store.
- Lighthouse runs (incognito), final submission form in Partners.
- `gh` CLI is NOT installed; repo private read of Actions/Pages not available headlessly.
