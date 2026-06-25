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
16. No GSAP (Business Green license for resale). Lenis OK (MIT).
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

## METAFIELDS
- `product.metafields.volt.badge`    string: new/bestseller/limited/rare
- `product.metafields.volt.category` string: strength/recovery/endurance/nutrition
- `product.metafields.volt.specs`    JSON: {protein, carbs, fat, serving, cert}
- `product.metafields.volt.protocol` rich_text: usage protocol
- `product.metafields.volt.tier`     string: starter/performance/elite (membership)

## METAOBJECTS
- NutritionFacts: serving_size, calories, protein, carbs, fat, fiber, key_vitamins (JSON), certifications (list)
- MemberTestimonial: name, tier_name, join_date, result_headline, before_metric, after_metric, before_image, after_image

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

## USER-ONLY / OUT-OF-BAND STEPS (cannot be done headlessly)
- Create dev store `volt-dev.myshopify.com` in Shopify Partners.
- Connect GitHub repo → Shopify (Online Store → Themes → Add theme → Connect from GitHub → main).
- Shopify CLI device-code auth for `theme dev`/`theme check` against the store.
- Lighthouse runs (incognito), final submission form in Partners.
- `gh` CLI is NOT installed; repo private read of Actions/Pages not available headlessly.
