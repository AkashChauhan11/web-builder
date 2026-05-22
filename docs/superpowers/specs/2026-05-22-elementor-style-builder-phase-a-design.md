# Elementor-Style Page Builder — Phase A Design

**Date:** 2026-05-22
**Status:** Approved (pending user review of this spec)
**Owner:** MiniPress
**Predecessor plans:** Plan 1 (admin auth + page CRUD), Plan 2 (GrapesJS editor + custom blocks + SEO modal + asset uploads)

---

## Why this exists

MiniPress already has a GrapesJS-based visual editor from Plan 2 with 4 hand-built custom blocks (Hero, Two-Column, CTA Banner, Feature Grid), a Coloris color picker, asset uploads, multi-locale support, and an SEO modal. That work is solid for "drop pre-built sections onto a canvas" but does not feel like Elementor. Users coming from WordPress expect:

- A Section → Column → Widget layout primitive
- A library of ~20 widgets they compose into pages, not 4 pre-built blocks
- Inline click-and-type editing on the canvas
- A continuous-value style panel with typography, spacing, borders, shadows, background — every CSS property visible Elementor exposes
- Templates for fast starts

Phase A delivers the foundation that makes the editor *feel* like Elementor. Phases B (per-breakpoint responsive, template library, global styles) and C (animations, hover states, form builder) come in separate spec → plan cycles after Phase A ships.

---

## Decisions made during brainstorming

These are the choices we converged on. Future agents reading this should treat them as fixed unless explicitly revisited. The *why* matters more than the *what* — if a constraint changes, these justifications tell you whether the decision still holds.

| # | Decision | Why |
|---|---|---|
| 1 | **Phase split into A / B / C.** Phase A only in this spec. | All-8-features in one plan is unsafe to execute. Phasing lets us ship a usable editor at each step. |
| 2 | **Extend GrapesJS, do not replace it.** | Plan 2 invested in GrapesJS wiring (save flow, asset manager, multi-locale). Replacing would invalidate that work. GrapesJS supports custom component types, custom panels, and CSS export — sufficient for everything Phase A needs. |
| 3 | **Editor layout: GrapesJS-style (left blocks + right styles).** | Faster than rebuilding the panel geometry. We pay the visual cost in the right panel by replacing it with a custom Tailwind-styled UI. Pure-Elementor geometry is reconsidered in Phase B if needed. |
| 4 | **Style controls: Elementor-style continuous values (sliders, NumberWithUnit, FourSideInput).** | User wants pixel-perfect control. Output is per-element CSS rules keyed by GrapesJS auto-generated component classes (e.g. `#i7a3f { padding: 48px; }`) emitted into the saved `css` field and `styles_json` array — **not** inline `style=""` attributes. This is GrapesJS's native pattern. Tradeoff: existing Tailwind-class-based blocks must be rebuilt to be style-panel-driven (their utility classes would otherwise win specificity battles). |
| 5 | **Section primitive: Boxed / Full width toggle per section.** | Canonical Elementor behavior. Enables dark full-width hero sections with boxed inner content, which is a common pattern. |
| 6 | **Column structure: preset structures + draggable resize.** | Faster than free-form for the 95% case (Elementor's preset picker on Section creation). Drag-to-resize handles the edge cases. |
| 7 | **Nesting: Inner Sections allowed.** | Real Elementor layouts require it (e.g., column with image above + two-column text below). Adds complexity but unlocks Elementor-quality designs. |
| 8 | **Widget roster: 20 widgets in Phase A.** | Covers ~90% of marketing-page needs. Form builder, Google Map, Star Rating, Shortcode deferred to Phase B/C because each has out-of-scope dependencies (email backend, API keys, dynamic content). |
| 9 | **Inline editing: every text-bearing widget (D2).** | Click-and-type on Heading/Text/Button/Icon-Box/Testimonial/Pricing/Alert/Accordion-item/Tab-label. Inline editing is the main reason users prefer Elementor over GrapesJS. Worth the ~3-day implementation cost. |
| 10 | **Existing pages: reset seed data (E1).** | The project is young; seeded pages are placeholders. We rewrite seeders to use the new component tree. No upgrade path for hand-authored content. |
| 11 | **No DB schema changes.** | The four existing fields (`html`, `css`, `components_json`, `styles_json`) on `builder_page_translations` hold everything. The component tree just gets richer. |
| 12 | **Mobile fallback in Phase A:** `flex-wrap: wrap` + `@media (max-width: 768px) { .mp-col { flex-basis: 100% !important; } }` in `builder-runtime.css`. | Per-breakpoint overrides are Phase B. Phase A guarantees columns stack on mobile without user effort, even if the precise tablet/mobile values are not yet user-controllable. |

---

## Architecture overview

**What we're building:** an Elementor-style visual page builder mounted in the existing MiniPress admin at `/admin/builder/{id}/edit`. The user opens a builder page, drags Sections onto the canvas, picks a column structure, drops Widgets into columns, edits text inline, and tweaks every property via a continuous-value style panel on the right. Save flow is unchanged — it PUTs to `/admin/builder/{id}` and the public PageController renders what's saved.

**Stack additions on top of Plan 2:**

- **GrapesJS Custom Component Types** for `mp-section`, `mp-column`, and 20 widget types (replaces the "drop HTML into the canvas" block model — components now have schema, traits, and structured serialization)
- **Custom Style Manager UI** — we replace GrapesJS's default style manager with a custom Tailwind-styled panel that emits continuous CSS values. Backed by GrapesJS's CSS API so save/load is unchanged.
- **Inline RTE** via GrapesJS's built-in `editable: true` on specific subregions, with a custom Tailwind-styled floating toolbar
- **Lucide icons** for the Icon widget and Icon Box (curated SVG sprite bundled in builder runtime, ~30 icons)
- **`embla-carousel`** dep for Image Carousel (~5kb)
- **Per-widget renderers** in widget `toHTML()` methods, so the saved `html` field is the structured widget markup, not editor wrappers
- **`builder-runtime.css`** + **`builder-runtime.js`** — small shared runtime loaded by both the editor canvas and the public layout

**What is NOT changing:**

- `BuilderPage` / `BuilderPageTranslation` / `BuilderPageSeo` schema
- `/admin/builder/{id}` save endpoint and payload shape
- `/admin/builder/assets` upload endpoint
- Multi-locale, SEO modal, draft auto-save, publish flow
- Vite/Tailwind/Coloris setup
- Frontend URL routing and SEO/sitemap pipeline

---

## Data model

**No schema migrations.** Phase 1 and 2 already gave us the four fields we need on `builder_page_translations`:

| Field | Type | Purpose |
|---|---|---|
| `html` | longText | Flat rendered HTML — produced by `editor.getHtml()` |
| `css` | longText | Flat CSS — produced by `editor.getCss()` |
| `components_json` | json | GrapesJS component tree — produced by `editor.getComponents().toJSON()` |
| `styles_json` | json | GrapesJS styles array — produced by `editor.getStyle().toJSON()` |

### Component tree shape

```json
[
  {
    "type": "mp-section",
    "attributes": { "id": "i7a3f" },
    "props": {
      "width": "full",
      "max_inner_width": 1200,
      "vertical_align": "middle",
      "min_height_mode": "fixed",
      "min_height": 480,
      "html_tag": "section"
    },
    "components": [
      {
        "type": "mp-column",
        "attributes": { "id": "i9b1c" },
        "props": { "size_pct": 50, "vertical_align": "middle", "content_position": "start" },
        "components": [
          {
            "type": "mp-heading",
            "attributes": { "id": "i2d4e" },
            "props": { "level": "h1", "html_tag": "h1", "link": null },
            "components": [
              { "type": "textnode", "content": "Welcome to MiniPress" }
            ]
          },
          {
            "type": "mp-button",
            "attributes": { "id": "i8f6a" },
            "props": {
              "link": { "url": "/contact", "target": "_self", "rel": null },
              "size": "lg",
              "full_width": false,
              "icon": { "name": "arrow-right", "position": "after" }
            },
            "components": [
              { "type": "textnode", "content": "Get Started" }
            ]
          }
        ]
      },
      {
        "type": "mp-column",
        "attributes": { "id": "i3c7b" },
        "props": { "size_pct": 50, "vertical_align": "top" },
        "components": [
          {
            "type": "mp-image",
            "attributes": { "id": "i1e9d" },
            "props": {
              "src": "/storage/builder-assets/hero.jpg",
              "alt": "Hero image",
              "link": null,
              "lightbox_enabled": false,
              "caption": ""
            }
          }
        ]
      }
    ]
  }
]
```

**Rules:**

- Every node has `type` (matches a registered GrapesJS component type), `attributes.id` (auto-generated, stable across saves), `props` (typed primitives — the Content tab values), and optionally `components` (children).
- **Style data lives in `styles_json`**, NOT in `props`. The styles array contains GrapesJS-managed CSS rules keyed by auto-generated component classes (e.g. `#i7a3f { padding: 80px 24px; background: #0f172a; }`). This is GrapesJS's native pattern.
- **Component IDs are stable across save/load** — preserved via `attributes.id`. The matching CSS rule in `styles_json` survives because it targets the ID.
- **Inner Sections** are just `mp-section` nodes inside an `mp-column`. Same type, recursive.
- **Inline text** lives as GrapesJS `textnode` children with `editable: true` on the parent component.

### Server-side validation (in `BuilderPagesController@update`)

A new `WidgetRegistry` class enumerates the 23 allowed types: `mp-section`, `mp-column`, plus the 20 widgets, plus `textnode`. The `update` validator rejects:

- A root-level component that is not `mp-section`
- Any node with an unrecognized `type`
- `mp-html` widget content containing `<script>` or non-whitelisted iframes (extends `HtmlSanitizer`)

The full component tree is otherwise treated as opaque JSON — we trust the editor for shape, but whitelist types as a defense against malicious payloads.

---

## Style panel and CSS compilation

This is ~40% of Phase A effort. We replace GrapesJS's default Style Manager UI entirely while keeping its underlying CSS storage.

### Panel structure — three tabs per selected widget

| Tab | What's in it |
|---|---|
| **Content** | Widget-specific props (Heading: level + link, Image: src/alt/link, Button: text/link/icon, etc.). Form fields driven by the widget's prop schema. |
| **Style** | Universal CSS controls grouped by section. See below. |
| **Advanced** | Margin (4-side), CSS class additions, custom CSS textarea, element ID override, z-index. |

### Style tab — collapsible groups

1. **Typography** — font family (system stack + ~6 Google Fonts), size (NumberWithUnit), weight (100-900 chips), line-height (number), letter-spacing (NumberWithUnit), text-transform (chips), text-decoration (chips), font-style (chips), text-align (chips), color (Coloris)
2. **Background** — type radio (None/Color/Gradient/Image). Color = single Coloris picker. Gradient = 2-stop linear with angle slider. Image = URL + position (9-cell grid) + size (cover/contain/auto) + repeat + attachment.
3. **Border** — style (chips: solid/dashed/dotted/double/none), width 4-side (with link toggle), color (Coloris), radius 4-side (with link toggle)
4. **Box Shadow** — preset chips (none/sm/md/lg/xl/2xl) + custom (X/Y/blur/spread/color/inset)
5. **Spacing** — padding 4-side (FourSideInput with link toggle, unit toggle px/%/em/rem). Margin lives on Advanced tab.
6. **Sizing** — width (auto/100%/custom NumberWithUnit), max-width, height (auto/min/custom), min-height. Hidden for inline widgets.

**Section-specific groups (only shown when `mp-section` is selected):**
- **Layout** — gap between columns, content-position (horizontal align of columns within inner)

**Column-specific groups (only shown when `mp-column` is selected):**
- **Layout** — column width % (slider 8.33–100), content position (start/center/end), content vertical align (top/middle/bottom)

### Reusable control primitives — `resources/js/builder/controls/`

Each is a small vanilla-JS factory returning an `HTMLElement` with an event-emitter interface:

- **`numberWithUnit({ value, unit, units, onChange })`** — number input + unit dropdown. ~50 lines.
- **`fourSideInput({ values, linked, onChange })`** — 4× NumberWithUnit + central link toggle. ~80 lines.
- **`colorPicker({ value, onChange })`** — wraps Coloris (existing dep). ~30 lines.
- **`presetChips({ options, value, onChange })`** — row of pill buttons. ~40 lines.
- **`collapsibleGroup({ title, children })`** — group with expand/collapse arrow. ~30 lines.
- **`slider({ min, max, value, onChange })`** — labelled range input. ~30 lines.

No framework, no virtual DOM. Each control owns its DOM and dispatches `change` events.

### How values flow into CSS

1. User changes a control (e.g. padding-top to 48px)
2. Control fires `change` event with `{ property: 'padding-top', value: '48px' }`
3. Panel handler calls `editor.getSelected().addStyle({ 'padding-top': '48px' })` — GrapesJS updates internal style rules for that component's class
4. `editor.getCss()` now returns the updated stylesheet
5. Save (debounced, already implemented in Plan 2) PUTs the new `css` + `styles_json` + `components_json` to the server

### Style panel ↔ widget selection

- GrapesJS fires `component:selected` events
- A controller in `builder.js` listens, reads selected component's `type` + current `getStyle()` object, and renders the appropriate panel into `#mp-style-panel` (a div replacing GrapesJS's default `.gjs-pn-views-container`)
- On deselect → panel shows "Select an element to edit its style"
- Tab state (Content/Style/Advanced) is preserved per widget *type* — switching between two Headings keeps you on the Style tab if that's where you were

### Effort

~5-7 days. Bulk is the 6 style groups × ~6 controls = ~36 wired controls, plus the 6 reusable primitives, plus visual polish.

---

## Section / Column primitive

Three new GrapesJS component types form the layout backbone: `mp-section`, `mp-column`, plus drag-drop rules.

### `mp-section`

- Renders as `<section class="mp-sec mp-sec--{width}" id="{id}">` (tag swappable via `html_tag` prop)
- **Drop rules:** Root or inside `mp-column` (Inner Section). Not inside another `mp-section` directly.
- **Accepts:** only `mp-column` children
- **Props:**
  - `width`: `boxed` | `full` (default: `boxed`)
  - `max_inner_width`: number in px (default: 1200)
  - `vertical_align`: `top` | `middle` | `bottom` (default: `top`)
  - `min_height_mode`: `default` | `fit` | `fixed` | `screen` (default: `default`)
  - `min_height`: number with px/vh unit (default: 0)
  - `html_tag`: `section` | `header` | `footer` | `div` | `aside` (default: `section`)
- **Default style:** `padding: 80px 24px; width: 100%`. When boxed, inner uses `max-width: var(--max-inner-width); margin: 0 auto`.
- **Toolbar:** Section icon (drag), Duplicate, Save as Template (greyed — Phase B), Delete

### `mp-column`

- Renders as `<div class="mp-col" id="{id}" style="flex-basis:{size_pct}%">`
- **Drop rules:** Only inside `mp-section`.
- **Accepts:** any widget type, plus `mp-section` (Inner Section)
- **Props:**
  - `size_pct`: number 8.33–100
  - `vertical_align`: `top` | `middle` | `bottom`
  - `content_position`: `start` | `center` | `end`
- **Toolbar:** Column icon (drag), Add column (splits remaining space), Delete column
- **Resize affordance:** Hovering the right edge shows a vertical grip; dragging adjusts `size_pct` for this column AND the sibling to its right (adjacent columns trade percentage — Elementor behavior).

### Adding a Section — the picker UI

Clicking the "+" button in the left panel's Sections tab opens a popover with the 8 preset column structures: `[1]`, `[1/2 + 1/2]`, `[1/3 × 3]`, `[1/4 × 4]`, `[1/3 + 2/3]`, `[2/3 + 1/3]`, `[1/4 + 1/2 + 1/4]`, `[1/6 × 6]`. Click one → empty section inserts at cursor. User can add/remove/resize columns afterward.

### Output

**HTML** (from `editor.getHtml()`):
```html
<section class="mp-sec mp-sec--full" id="i7a3f">
  <div class="mp-sec__inner">
    <div class="mp-col" id="i9b1c" style="flex-basis:50%">...</div>
    <div class="mp-col" id="i2d4e" style="flex-basis:50%">...</div>
  </div>
</section>
```

**CSS** (mixed between `builder-runtime.css` base + per-page `css` field):

Base (in `builder-runtime.css`):
```css
.mp-sec { width: 100%; padding: 80px 24px; }
.mp-sec--boxed .mp-sec__inner,
.mp-sec--full .mp-sec__inner { max-width: var(--mp-inner, 1200px); margin: 0 auto; }
.mp-sec__inner { display: flex; flex-wrap: wrap; gap: 20px; align-items: flex-start; }
.mp-col { flex: 0 1 auto; min-width: 0; }

@media (max-width: 768px) {
  .mp-col { flex-basis: 100% !important; }
}
```

Per-page (in saved `css` field):
```css
#i7a3f { background: #0f172a; min-height: 480px; }
```

### Drag-drop constraints

GrapesJS `draggable` / `droppable` use CSS selectors:

- `mp-section`: `{ draggable: 'body, .mp-col', droppable: '.mp-col' }`
- `mp-column`: `{ draggable: '.mp-sec__inner', droppable: '[data-mp-widget], .mp-sec' }`
- Each widget: `{ draggable: '.mp-col', droppable: false }` (or true with selector for slot-containers like Tabs)

---

## Widget catalog

Each widget registered in `resources/js/builder/widgets/{name}.js` exporting `register(editor)`. A single `widgets/index.js` imports and registers all 20.

### Per-widget contract

- `type` (string, prefixed `mp-`)
- `props` schema (drives Content tab fields)
- Default style values
- `toHTML()` function (drives saved HTML)
- Inline-editable subregions
- Drop rules

### Content widgets (8)

| Widget | Props | Inline-editable | Notes |
|---|---|---|---|
| **mp-heading** | level (h1-h6), html_tag, link, link_target | inner text | RTE: bold, italic, link only |
| **mp-text** | (none) | inner rich HTML | Full RTE: bold/italic/underline/lists/links/h2-h4/blockquote/code |
| **mp-image** | src, alt, link, link_target, lightbox_enabled, caption | caption | Asset picker uses `/admin/builder/assets` |
| **mp-button** | link, link_target, icon (name, position), size preset, full_width | label | RTE: bold, italic |
| **mp-icon** | icon_name (Lucide), shape (none/square/circle), link | — | Lucide SVG, ~30 icons curated |
| **mp-icon-box** | icon, title_tag, title_position (top/left/right), alignment | title, description | Composite |
| **mp-divider** | style (solid/dashed/dotted), width_pct, alignment, gap | — | Decorative HR |
| **mp-spacer** | (height in style only) | — | Default height 50px |

### Media widgets (3)

| Widget | Props | Inline-editable | Notes |
|---|---|---|---|
| **mp-video** | source (youtube/vimeo/url), video_id_or_url, autoplay, loop, muted, controls, aspect_ratio | — | iframe (YT/Vimeo) or `<video>` (mp4). `loading=lazy`. |
| **mp-carousel** | autoplay_ms, loop, show_arrows, show_dots, slides_per_view | per-slide caption | Slides are `mp-carousel-slide` child sub-components. Uses `embla-carousel`. |
| **mp-gallery** | columns (2-6), gap, lightbox_enabled, hover_effect | per-image caption | Grid + custom lightbox modal |

### Interactive widgets (3)

| Widget | Props | Inline-editable | Notes |
|---|---|---|---|
| **mp-accordion** | items (array), allow_multiple_open, default_open_index | item title + body | Items are `mp-accordion-item` child sub-components |
| **mp-tabs** | tabs (array), orientation (horizontal/vertical), default_tab_index | tab label + panel body | Same pattern as accordion |
| **mp-counter** | start, end, duration_ms, prefix, suffix, separator | — | Animates on scroll via IntersectionObserver |

### Social proof widgets (3)

| Widget | Props | Inline-editable | Notes |
|---|---|---|---|
| **mp-testimonial** | image_src, layout (image-top/image-left/image-right), star_rating (0-5) | quote, author, role | Star rating renders SVG inline |
| **mp-pricing** | currency_symbol, period_label, highlighted, features (array of `{text, included}`), button | plan name, price, feature text, button label | `highlighted` flag drives different default style |
| **mp-social** | networks (array of `{platform, url}`), shape (circle/square/none), size, gap | — | 8 platforms: X, FB, IG, LinkedIn, YouTube, GitHub, Email, Phone |

### Utility widgets (3)

| Widget | Props | Inline-editable | Notes |
|---|---|---|---|
| **mp-progress** | value (0-100), max, show_label, label_format, animated | — | Animates on scroll |
| **mp-alert** | variant (info/success/warning/error), dismissible, icon_enabled, title | title, message body | Dismiss is client-side only |
| **mp-html** | raw_html | — | Sanitized server-side. Escape hatch for power users. |

### Starter Section templates

The 4 deleted blocks become starter Section templates (under a Templates tab in the left panel). Each is a JSON-tree snippet that drops in as a fully-composed Section:

| Template | Composition |
|---|---|
| Hero | `mp-section`(full-width, dark, min-height 480) → `mp-column`(50%, vert-center)[heading, text, button] + `mp-column`(50%)[image] |
| Two-Column | `mp-section`(boxed) → 2× `mp-column`(50%)[heading, text] |
| CTA Banner | `mp-section`(full-width, accent) → `mp-column`(100%)[heading, button] |
| Feature Grid | `mp-section`(boxed) → 3× `mp-column`(33%)[icon-box] |

### Implementation order (informs the plan)

- **Trivial (~½ day each):** spacer, divider, html, alert, icon, heading, text, button — 4 days total
- **Medium (~1 day each):** image, gallery, icon-box, social, progress, counter, video — 7 days
- **Complex (~1.5-2 days each):** accordion, tabs, carousel, testimonial, pricing — 8-10 days
- **Templates (~1 day total):** rebuild the 4 starter Sections

**Widget total:** ~20-22 days.

---

## Inline editing UX

D2 chosen — every text-bearing widget supports click-and-type.

### Three editing patterns

**Pattern 1 — Single editable region** (mp-heading, mp-button label)

Widget's `toHTML()` puts a single editable `textnode` inside. GrapesJS handles selection-to-edit. Limited RTE — Heading allows bold/italic/link; Button label allows bold/italic.

**Pattern 2 — Full rich text region** (mp-text, accordion-item bodies, tabs panels, mp-alert message)

Full RTE: bold, italic, underline, strikethrough, link, h2/h3/h4, ul/ol, blockquote, code, clear formatting. Output is sanitized HTML.

**Pattern 3 — Multi-region composite widgets** (mp-icon-box, mp-testimonial, mp-pricing, mp-image caption, mp-gallery captions, mp-carousel captions, mp-accordion item titles, mp-tabs tab labels)

Widget template defines named child slots, each its own editable component. Clicking widget body selects the parent. Clicking *into* a subregion enters edit mode for that subregion. Subregions appear in the Navigator tree.

### Click model

| Action | Result |
|---|---|
| Single-click widget body | Select widget |
| Single-click editable subregion of selected widget | Enter edit mode |
| Double-click widget body | Select + enter edit mode on primary editable region |
| Click outside / Escape / Enter (heading) | Commit, return to selection |

### Custom RTE toolbar

Custom Tailwind-styled floating bar replacing GrapesJS's default. Built once, reused across widgets — button visibility driven by the active widget's allowed-formatting list.

```
[B] [I] [U] [S] | [link] | [h2] [h3] [h4] | [• list] [1. list] | [❝] [</>] | [×]
```

Positioned above the editing region. Implementation: a Tailwind-styled `<div>` positioned manually (no `popper.js` dep — manual calculation is fine for this case).

### Link editing

Clicking the **link** button opens a popover with: URL input, target dropdown (same/new window), rel options (nofollow toggle). Apply commits the `<a>` wrapper. Existing links: clicking them in edit mode reopens the popover prefilled.

### Sanitization

- Client side: RTE inserts only toolbar-allowed tags. `paste` event handler strips formatting except allowed tags. Plain-text fallback for Word/Google Docs paste.
- Server side: `HtmlSanitizer::stripDocumentWrappers` keeps doing its job on page-level HTML. No per-field sanitization beyond that.

### Accessibility

- Editable regions: `contenteditable=true`, `role=textbox`, `aria-multiline` where relevant
- Floating toolbar: `role=toolbar`, arrow-key navigation between buttons
- Canvas tab order preserved

### Effort

~3-4 days. ~2 days for the custom toolbar, ~1-2 days for per-widget editable-region wiring.

---

## Migration and frontend rendering

### Migration (E1 — reset seeders)

**Changes:**

- `database/seeders/PlaceholderPagesSeeder.php` — rewrite seeded "Welcome" and any placeholder pages so each translation's `html`/`css`/`components_json`/`styles_json` reflect the new component tree.
- `resources/js/builder/blocks.js` — **delete**. The 4 raw-HTML blocks go away.
- New `resources/js/builder/templates/` directory — holds the 4 starter Section template JSON-tree snippets.

**Migration command:** `php artisan migrate:fresh --seed`. No upgrade path for hand-authored content (acceptable — project is young).

`HtmlSanitizer::stripDocumentWrappers` unchanged.

### Frontend rendering

**The public PageController is structurally untouched.** Still resolves slug + locale → `BuilderPageTranslation` → renders saved `html` + `css` in the layout. What differs is *what's inside* those fields.

### Shared runtime CSS — `resources/css/builder-runtime.css`

~3kb stylesheet with base `.mp-sec`, `.mp-col`, `.mp-sec__inner` rules plus widget base classes (`.mp-btn`, `.mp-card`, `.mp-accordion`, etc.). Loaded by:

1. Editor canvas (preview matches live page)
2. Public layout (live pages render correctly)

Wired via `@import 'builder-runtime.css';` in `resources/css/app.css`. Vite bundles.

### Shared runtime JS — `resources/js/builder-runtime.js`

New Vite entry. Loaded by the **public** layout. Initializes interactive widgets on `DOMContentLoaded`:

- `mp-counter` → IntersectionObserver + count-up
- `mp-progress` → IntersectionObserver + width animation
- `mp-carousel` → init `embla-carousel`
- `mp-gallery` → lightbox modal
- `mp-accordion` → toggle `.is-open` on item header click
- `mp-tabs` → swap `.is-active` on tab button click
- `mp-alert` → hide on dismiss click

Auto-initializes by querying for `[data-mp-widget]` and dispatching by type. Total ~3-4kb gzipped.

Progressive enhancement — no React, no hydration, no virtual DOM. Server-rendered HTML works without JS; interactivity is JS-only.

### Public layout changes — `resources/views/layouts/app.blade.php`

Add `@vite(['resources/js/builder-runtime.js'])` to `<head>`. CSS auto-loaded via `app.css` @import. No other layout changes.

### SEO

Existing PageController + sitemap + hreflang + meta tags pipeline unchanged. Only the HTML *shape* changed.

---

## Testing strategy

### Layer 1 — Pest tests (TDD where possible)

**`tests/Feature/BuilderAdminTest.php` additions:**

1. `update` accepts the new component_json shape (tree with `mp-section` / `mp-column` / widget nodes) without rejection
2. `update` validates root-level components are only `mp-section`; other types at root → 422
3. `update` rejects unknown widget types in component_json → 422
4. `update` strips doc wrappers from the new `html` field
5. `update` sanitizes user-supplied content in `mp-html` widget — strips `<script>`, strips non-whitelist iframes, preserves YouTube/Vimeo iframes
6. Existing `update` / `publish` / `uploadAsset` tests stay green

**`tests/Feature/BuilderRenderingTest.php` (new file):**

1. A `BuilderPage` with a component-tree-based `html` renders on the public URL with `.mp-sec`, `.mp-col` markup intact
2. Public response includes the `builder-runtime.js` script tag
3. SEO meta tags / hreflang emit correctly with the new HTML shape

**`tests/Unit/` additions:**

- `HtmlSanitizerTest` — extend to cover `mp-html` widget edge cases
- `WidgetRegistryTest` — the server-side registry enumerates exactly 23 types matching the JS-side registry

**Target:** ~18 new Pest tests. ~1.5 days.

### Layer 2 — Snapshot tests

3-4 `expect($html)->toMatchSnapshot()` cases:

- Empty section
- Section with mixed widgets
- Nested Inner Section
- All 20 widgets in isolation

Pest's built-in `toMatchSnapshot()`. Snapshots in `tests/__snapshots__/`.

### Layer 3 — Manual smoke test checklist

Lives at the bottom of the eventual Phase A plan as the final acceptance gate:

1. Open editor → see 20 widgets in left palette grouped by category + 4 starter Section templates in Templates tab
2. Drag a Section template → lands as Section with columns + widgets
3. Click empty "+ Section" → preset picker → choose 1/3 + 2/3 → empty section inserts
4. Drop Heading into column → click to select → click again to edit → type "Hello" → click outside → text persists
5. Select Heading → Style tab → change font size 32→80 via slider → canvas updates
6. Change padding-top to 64 via FourSideInput → canvas reflects
7. Apply box-shadow preset "lg" → component reflects
8. Drop Section inside column (Inner Section) → nests correctly
9. Drag right edge of column → adjacent column resizes
10. Click Tabs widget → 2 tabs → click tab 2 label → inline edit → drop Heading in tab 2 panel
11. Save Draft → reload editor → state restored exactly
12. Publish → visit public URL → renders with same structure + style
13. Public URL: click accordion item → expands. Click gallery image → lightbox opens. Counter animates on scroll.
14. `php artisan migrate:fresh --seed` → seeded pages load with new trees
15. Browser DevTools mobile preview → columns stack at <768px

### Layer 4 — Performance smoke

Lighthouse on the published Welcome page after smoke test. Target: Performance ≥ 90 desktop, ≥ 75 mobile. CSS payload < 50kb. Runtime JS (not editor) < 15kb gzipped.

### Not tested in Phase A

- Browser-driver (Dusk / Playwright) end-to-end — reconsider Phase B
- Cross-browser matrix — reactive only
- Visual regression — design too fluid in Phase A

---

## Acceptance criteria

Phase A is complete when:

1. `php artisan test` is green (existing tests + ~18 new)
2. Snapshot tests pass for the 3-4 reference component trees
3. `npm run build` produces `app`, `builder`, `builder-runtime` chunks in the manifest
4. The manual smoke test checklist (15 items) is fully checked
5. Lighthouse targets met on the published Welcome page
6. `php artisan migrate:fresh --seed` produces seeded pages that open and render correctly
7. `resources/js/builder/blocks.js` is deleted; the 4 starter Section templates exist under `resources/js/builder/templates/`
8. No regressions in existing public-URL rendering, SEO meta, sitemap, or asset uploads

---

## Out of scope (Phase B and C)

### Phase B (productivity)

- Per-breakpoint responsive values (Tablet/Mobile overrides for any style property — backed by GrapesJS media query support)
- Template library — ~15 pre-built page templates + ~25 block templates + "save as template" flow
- Global styles — 6 site colors + 4 typography presets, with widgets referencing them by default

### Phase C (polish)

- Entrance animations (fade/slide/zoom/scroll-reveal)
- Hover states + transitions per widget
- Form builder widget (validation + email submission backend)
- Google Map widget
- Star Rating widget
- Custom Shortcode / dynamic content widget
- Motion effects (parallax, sticky)

---

## Effort estimate

| Area | Days |
|---|---|
| Section/Column primitive + drop rules + preset picker | 5 |
| Style panel: primitives | 3 |
| Style panel: groups + tab logic + serialization | 4-5 |
| Inline RTE: custom toolbar | 2 |
| Inline RTE: per-widget wiring | 1-2 |
| Widgets — trivial 8 | 4 |
| Widgets — medium 7 | 7 |
| Widgets — complex 5 | 8-10 |
| Starter Section templates (4) | 1 |
| `builder-runtime.css` + `builder-runtime.js` | 2 |
| Seeder rewrite | 0.5 |
| Public layout wiring | 0.5 |
| Pest tests (~18) | 1.5 |
| Snapshot tests | 0.5 |
| Manual smoke + polish | 2-3 |
| Buffer | 3-5 |
| **Total** | **~45-50 working days (~9-10 weeks for one engineer)** |

The earlier "3-4 weeks" estimate on screen 02 was the optimistic mockup figure. Full inline editing on all text-bearing widgets + custom style panel + 20 widgets + Inner Sections is realistically ~9-10 weeks. If 9-10 weeks is too long, the highest-leverage cut is dropping Pattern 3 inline editing (multi-region composites) — fall back to form-field-based editing for those widgets, saving ~2 weeks at the cost of feeling less Elementor-like.

---

## File map

### Created

- `resources/js/builder/widgets/` — one file per widget (20 files)
- `resources/js/builder/widgets/index.js` — registers all 20
- `resources/js/builder/sections/` — `section.js`, `column.js`, `section-picker.js`
- `resources/js/builder/controls/` — `number-with-unit.js`, `four-side-input.js`, `color-picker.js`, `preset-chips.js`, `collapsible-group.js`, `slider.js`
- `resources/js/builder/style-panel/` — `index.js` (mounts panel), `groups/typography.js`, `groups/background.js`, `groups/border.js`, `groups/shadow.js`, `groups/spacing.js`, `groups/sizing.js`, `groups/layout.js`
- `resources/js/builder/rte/` — `toolbar.js`, `link-popover.js`, `paste-filter.js`
- `resources/js/builder/templates/` — `hero.js`, `two-column.js`, `cta-banner.js`, `feature-grid.js` (JSON-tree snippets)
- `resources/js/builder/icons/lucide-sprite.js` — bundled SVG sprite
- `resources/js/builder-runtime.js` — public-page runtime
- `resources/css/builder-runtime.css` — shared runtime CSS
- `app/Support/WidgetRegistry.php` — server-side type whitelist
- `tests/Feature/BuilderRenderingTest.php`
- `tests/Unit/WidgetRegistryTest.php`
- `tests/__snapshots__/...` — Pest snapshot files

### Modified

- `resources/js/builder.js` — restructured: remove inline block defs, import widgets/sections/style-panel modules, mount custom style panel
- `resources/css/app.css` — `@import 'builder-runtime.css'`
- `resources/views/layouts/app.blade.php` — `@vite(['resources/js/builder-runtime.js'])` in `<head>`
- `vite.config.js` — add `resources/js/builder-runtime.js` to inputs
- `package.json` — add `embla-carousel` (and `lucide` build-time dep for sprite generation, if not already present)
- `app/Http/Controllers/Admin/BuilderPagesController.php` — `update()` adds component-tree validation via `WidgetRegistry`
- `app/Support/HtmlSanitizer.php` — extend with `mp-html` content sanitizer (script/iframe rules)
- `database/seeders/PlaceholderPagesSeeder.php` — rewrite seeded pages using new component tree
- `tests/Feature/BuilderAdminTest.php` — add the 6 new tests
- `tests/Unit/HtmlSanitizerTest.php` — extend with `mp-html` edge cases

### Deleted

- `resources/js/builder/blocks.js` — replaced by widgets + starter templates
- `resources/js/builder/coloris-init.js` — keep as-is; the style panel's `colorPicker` control wraps it

---

## Handoff to plan

Once the user reviews and approves this spec, the next step is invoking the `writing-plans` skill to break the work into ordered tasks with TDD checkpoints. The plan will likely run 7-10 tasks (Section/Column primitive → controls → style panel groups → RTE → widgets in implementation-order tiers → templates → runtime → seeder → tests → final smoke).
