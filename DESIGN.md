# VOLT — Design Contract
Shopify Theme Store · Fitness + Membership + Fit Products
Visual references: Linear.app (white+dark+accent), WHOOP (data UI),
AG1 (science-led off-white ecommerce), Hyrox (performance sport)

## POSITIONING
Not a gym theme. VOLT is the first Shopify Theme Store theme where
memberships are the PRIMARY product. Design language borrowed from
performance data wearables (WHOOP) and clean science-first DTC brands
(AG1), applied to fitness ecommerce. Mineral white background inverts
every existing dark gym theme — uniquely positioned in the market.

## PALETTE — 3 PRESETS

### Volt (default)
- `--color-bg`      `#F0EEEA`  mineral white (warmth, NOT pure #FFFFFF)
- `--color-surface` `#E8E5E0`  cards, inputs, panel backgrounds
- `--color-ink`     `#0D0C0B`  near-black with subtle warm undertone
- `--color-acid`    `#D4FF00`  volt lime — ONLY: primary CTA buttons, active/selected prices, key conversion badges. NEVER decorative. Max 3× per screen.
- `--color-mid`     `#8A8784`  secondary text, labels, metadata, inactive
- `--color-border`  `#D0CDC8`  hairline borders, dividers, input outlines
- `--color-danger`  `#E84040`  out-of-stock, sale price, error states
- `--color-success` `#2ECC71`  in-stock indicator, success confirmation
- `--color-ink-10`  `rgba(13,12,11,0.10)`  hover backgrounds on white
- `--color-ink-06`  `rgba(13,12,11,0.06)`  subtle hover state
- `--color-acid-10` `rgba(212,255,0,0.10)` acid glow on acid elements

### Anthracite (dark premium)
- `--color-bg` `#141311` · `--color-surface` `#1E1C1A` · `--color-ink` `#F0EEEA`
- `--color-acid` `#D4FF00` (now on dark — more dramatic) · `--color-mid` `#706E6C`
- `--color-border` `#2E2C2A` · `--color-danger` `#E84040` · `--color-success` `#2ECC71`

### Titanium (mid-range, equipment stores)
- `--color-bg` `#2C2A28` · `--color-surface` `#363330` · `--color-ink` `#F5F3F0`
- `--color-acid` `#D4FF00` · `--color-mid` `#8A8886`
- `--color-border` `#484540` · `--color-danger` `#E84040` · `--color-success` `#2ECC71`

## TYPOGRAPHY

### Display — Syne 700/800
NOT in Shopify font_picker → load via Google Fonts CDN.
Geometric, unusual letter-spacing. Nobody uses this in fitness → instant differentiation.
- h0: clamp(52px, 6vw, 96px) / lh 0.92 / ls -0.02em
- h1: clamp(40px, 4vw, 64px) / lh 0.95 / ls -0.015em
- h2: clamp(28px, 2.8vw, 44px) / lh 1.02
- h3: clamp(20px, 2vw, 28px) / lh 1.08

### Body/UI — DM Sans 300/400/500
Shopify font_picker handle: `dm_sans_n4`.
- Body: 14-16px / lh 1.65 · Labels: 10-11px / all-caps / ls 0.18em / 500 · Nav: 11px / 500 / ls 0.1em

### Mono/Data — DM Mono 400
For ALL numeric data: metrics, stats, specs, batch numbers, prices. Load via CDN.
- 11-14px / ls 0.04em · e.g. "89.5% RECOVERY" · "14.2 STRAIN" · "$49/mo" · "2,400 MEMBERS"

## MOTION
- Primary ease: `cubic-bezier(0.16, 1, 0.3, 1)` · Fast 0.22s · Med 0.38s · Slow 0.6s
- Gauge animation: 1.2s ease-out on IntersectionObserver entry
- All motion respects `prefers-reduced-motion: reduce`

## LAYOUT
- Max page width 1280px · container padding clamp(24px → 56px) · section spacing clamp(80px, 10vw, 140px)
- Product grid: 4-col → 2-col tablet → 1-col mobile · gutter clamp(14px, 2vw, 26px)
- Border radius: 0 on ALL cards/buttons/badges/inputs (editorial). Merchant can set 0-16px in settings.

## HOMEPAGE SCROLL NARRATIVE (required default order — SPYLT scroll-as-narrative)
The homepage is a single argument, not a stack of sections. `templates/index.json`
MUST default to this sequence; merchants can deviate, but demos/listings ship it:

1. **Diagnostic** — `hero-diagnostic` (the problem + the split identity, quiz CTA)
2. **Proof** — `vitals-strip` (live institutional/member stats marquee)
3. **Protocol** — `membership-tiers` (the core offer: choose your tier)
4. **Products** — `product-grid` (gear the protocol)
5. **Benefits** — `performance-stats` (outcomes in numbers, `data-tint="surface"`)
6. **Testimony** — `before-after` (member transformation, dark panel)
7. **Method** — `how-it-works` (pre/during/post phases + inline add-to-cart)
8. **Journal** — `journal` (editorial depth, per-category treatment, `data-tint="surface"`)
9. **Capture** — `newsletter-diagnostic` (quiz + email — the conversion floor)
10. **Recall** — `recently-viewed` · **Trust floor** — `certification-strip` above the footer

Background tint: sections marked `data-tint="surface"` nudge the page background
one step within the preset palette while in view (`VoltAnim.sectionTint()`); never
introduce colors outside the active preset.

## CONVERSION PRINCIPLES (Gymshark breakdown + Baymard 2025)
1. Cross-sell AFTER add-to-cart, NOT before.
2. Member pricing visible on product card without clicking.
3. Countdown timer on recommended membership tier only.
4. Quick-add on collection pages: slide up from bottom of card image.
5. Sticky add-to-cart bar mobile: position fixed bottom: 0.
6. Stock counter appears only when inventory < threshold (configurable).
7. "START YOUR PROTOCOL" as hero CTA — not "Shop Now" / "Buy Now".
