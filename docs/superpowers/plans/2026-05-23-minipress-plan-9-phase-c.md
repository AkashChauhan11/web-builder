# MiniPress Plan 9: Phase C/1 — Polish (Animations, Hover, Motion, 3 widgets)

> **Continuous execution preferred.** No subagent dispatches, no per-task stops. User commits the whole batch at the end.

**Goal:** Phase C delivers the visual polish that turns a functional Elementor-style editor into one that *feels* premium. Six features:

1. **Entrance animations** — fade, slide-up/left/right, zoom-in. Configurable duration + delay. Triggered on scroll-into-view by the public runtime.
2. **Hover states** — every style group can write to `:hover` pseudo-rules via a Normal/Hover state toggle at the top of the Style tab.
3. **`mp-map`** — Google Maps embed (or fallback iframe without API key), configurable address + zoom + height.
4. **`mp-rating`** — display-only star rating widget (0-5 with half-star support).
5. **`mp-shortcode`** — placeholder text replaced server-side via a registry. Built-in shortcodes for `{site_name}`, `{today}`, `{user_email}`, `{year}`.
6. **Parallax + sticky** — new "Motion" group in Style tab with parallax bg toggle and sticky offset.

**Form Builder is OUT OF SCOPE** — see Plan 10.

**Architecture:**

- **Animations** are data-attr-driven: `<element data-mp-animation="fade-up" data-mp-anim-duration="600" data-mp-anim-delay="100">`. CSS handles the initial transform + transition; a small runtime block in `builder-runtime.js` toggles `is-revealed` via IntersectionObserver. New "Animation" group in the Style tab writes the data attrs through GrapesJS `setAttributes`.
- **Hover states** leverage GrapesJS's State manager. The style panel's header gets a Normal/Hover segmented control. When Hover is active, `component.setState('hover')` ensures `addStyle` writes go to `:hover` CSS rules. The panel re-renders the controls to show the hover state's values (or "inherits" from normal).
- **mp-map** is a static iframe embed. With an API key configured, uses Google Maps Embed API; otherwise falls back to `https://maps.google.com/?q={address}&output=embed`.
- **mp-rating** renders 5 inline SVG stars filled according to the value prop, with half-star precision via SVG clip paths.
- **mp-shortcode** stores `{code}` placeholder text. On save, the placeholder is preserved as-is in the saved HTML. On render, `ShortcodeRenderer::replace($html)` runs in `PageController::show` and substitutes the registry's handlers.
- **Parallax / sticky** are CSS properties wrapped in a small Motion group in the Style tab. Parallax = `background-attachment: fixed`. Sticky = `position: sticky; top: Npx`.

**Tech stack additions:** none.

**Effort estimate:** ~8-10 days, 8 tasks.

---

## File Map for Plan 9

### Created (JS)
- `resources/js/builder/widgets/map.js`
- `resources/js/builder/widgets/rating.js`
- `resources/js/builder/widgets/shortcode.js`
- `resources/js/builder/style-panel/groups/animation.js`
- `resources/js/builder/style-panel/groups/motion.js`
- `resources/js/builder/style-panel/state-toggle.js`

### Created (PHP)
- `app/Support/ShortcodeRenderer.php`
- `app/Support/Shortcodes/CoreShortcodes.php`
- `tests/Unit/ShortcodeRendererTest.php`

### Modified
- `resources/js/builder/widgets/index.js` — register map / rating / shortcode + add BLOCK_DEFS
- `resources/js/builder/style-panel/index.js` — render the Normal/Hover state toggle in the header
- `resources/js/builder.js` — register the new style groups
- `resources/js/builder-runtime.js` — animation reveal handler
- `resources/css/builder-runtime.css` — animation base CSS + map/rating/shortcode widget base CSS
- `resources/views/layouts/app.blade.php` — call `ShortcodeRenderer::replace` on the rendered HTML
- `app/Http/Controllers/Frontend/PageController.php` — pass the rendered+expanded HTML to the view (or do the replace in a Blade directive)
- `app/Support/WidgetRegistry.php` — add `mp-map`, `mp-rating`, `mp-shortcode`
- `tests/Unit/WidgetRegistryTest.php` — bump count, add containment assertions

---

## Conventions

- No git commits from subagents.
- No new feature tests in Plan 9 except `ShortcodeRendererTest` (the visual stuff is hard to TDD); rely on existing 104 tests + build verification.
- Plain ES modules, no framework, no virtual DOM. Reuse existing control primitives.

---

## Task 1: WidgetRegistry — add 3 new widget types

**Files:**
- Modify: `app/Support/WidgetRegistry.php`
- Modify: `tests/Unit/WidgetRegistryTest.php`

- [ ] Add `mp-map`, `mp-rating`, `mp-shortcode` to `ALLOWED_TYPES`.
- [ ] Update count expectation (28 → 31) and add `toContain` assertion for the 3 new types.

---

## Task 2: Animation base CSS + runtime reveal handler

**Files:**
- Modify: `resources/css/builder-runtime.css`
- Modify: `resources/js/builder-runtime.js`

- [ ] CSS:

```css
[data-mp-animation] {
    opacity: 0;
    transition: opacity var(--mp-anim-duration, 600ms) cubic-bezier(.2,.6,.3,1),
                transform var(--mp-anim-duration, 600ms) cubic-bezier(.2,.6,.3,1);
    transition-delay: var(--mp-anim-delay, 0ms);
}
[data-mp-animation="fade"]       { transform: translateY(0); }
[data-mp-animation="fade-up"]    { transform: translateY(24px); }
[data-mp-animation="fade-down"]  { transform: translateY(-24px); }
[data-mp-animation="fade-left"]  { transform: translateX(-24px); }
[data-mp-animation="fade-right"] { transform: translateX(24px); }
[data-mp-animation="zoom-in"]    { transform: scale(0.95); }
[data-mp-animation="zoom-out"]   { transform: scale(1.05); }
[data-mp-animation].is-revealed,
.gjs-editor [data-mp-animation] { opacity: 1; transform: none; }
```

(The `.gjs-editor` rule makes animations always visible inside the editor canvas so authoring isn't affected.)

- [ ] Runtime handler in `builder-runtime.js`:

```js
const animObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            animObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.15 });

document.querySelectorAll('[data-mp-animation]').forEach((el) => animObserver.observe(el));
```

Wire this in `initAll()` alongside the widget handler loop.

---

## Task 3: Animation style group

**Files:**
- Create: `resources/js/builder/style-panel/groups/animation.js`
- Modify: `resources/js/builder.js`

- [ ] `animationGroup(component, editor)` returns a collapsible group with:
  - Type select: None / Fade / Fade Up / Fade Down / Fade Left / Fade Right / Zoom In / Zoom Out
  - Duration input (ms, 100-3000, default 600)
  - Delay input (ms, 0-3000, default 0)

- [ ] Writing `data-mp-animation` etc. — use `component.addAttributes({ 'data-mp-animation': type })` etc. Or use inline `--mp-anim-duration` style var. Pattern:
  ```js
  component.addAttributes({ 'data-mp-animation': type });
  component.addStyle({ '--mp-anim-duration': `${duration}ms`, '--mp-anim-delay': `${delay}ms` });
  ```

- [ ] Register in `builder.js`:
  ```js
  import { animationGroup } from './builder/style-panel/groups/animation.js';
  registerStyleGroup(animationGroup);
  ```

---

## Task 4: Motion group (parallax + sticky)

**Files:**
- Create: `resources/js/builder/style-panel/groups/motion.js`
- Modify: `resources/js/builder.js`

- [ ] Two controls:
  - Parallax checkbox → toggles `background-attachment: fixed` (only takes effect when a background image is set)
  - Sticky number input + unit (px or 0 for off) → toggles `position: sticky; top: {N}px`

- [ ] Register in `builder.js`.

---

## Task 5: Hover state toggle in style panel header

**Files:**
- Create: `resources/js/builder/style-panel/state-toggle.js`
- Modify: `resources/js/builder/style-panel/index.js`

- [ ] `state-toggle.js` exports `stateToggle({ editor, component, onChange })` returning a Normal/Hover segmented control.

- [ ] In `makeHeader()` (index.js), add the state toggle below the name/type row. When state changes:
  - Call `component.setState(newState === 'hover' ? 'hover' : '')`
  - Re-render the panel so controls read from the new state's styles

- [ ] No changes needed to the individual style groups — they call `component.addStyle()` which GrapesJS routes to the active state's CSS rule.

---

## Task 6: `mp-map` widget

**Files:**
- Create: `resources/js/builder/widgets/map.js`
- Modify: `resources/css/builder-runtime.css`
- Modify: `resources/js/builder/widgets/index.js`

- [ ] Component type `mp-map`. Props: `address`, `zoom` (1-20), `height_px`, `api_key`.

- [ ] `toHTML()` builds an iframe pointing to either:
  - Google Embed API with key: `https://www.google.com/maps/embed/v1/place?key={key}&q={address}&zoom={zoom}`
  - Or fallback: `https://maps.google.com/?q={address}&output=embed`

- [ ] CSS: `.mp-map { width: 100%; } .mp-map iframe { border: 0; width: 100%; }`.

- [ ] Add to BLOCK_DEFS under Media category with glyph "📍".

---

## Task 7: `mp-rating` widget

**Files:**
- Create: `resources/js/builder/widgets/rating.js`
- Modify: `resources/css/builder-runtime.css`
- Modify: `resources/js/builder/widgets/index.js`

- [ ] Component type `mp-rating`. Props: `value` (0-5 step 0.5), `max` (default 5), `color`.

- [ ] `toHTML()` renders inline SVG stars: a row of empty stars with a clipped row of filled stars sized to `value/max * 100%` for half-star precision.

- [ ] CSS for `.mp-rating { display: inline-flex; }` etc.

- [ ] Add to BLOCK_DEFS under Social category with glyph "⭐".

---

## Task 8: `mp-shortcode` widget + ShortcodeRenderer

**Files:**
- Create: `resources/js/builder/widgets/shortcode.js`
- Create: `app/Support/ShortcodeRenderer.php`
- Create: `app/Support/Shortcodes/CoreShortcodes.php`
- Create: `tests/Unit/ShortcodeRendererTest.php`
- Modify: `app/Providers/AppServiceProvider.php` — register core shortcodes
- Modify: `resources/views/layouts/app.blade.php` — pipe `$translation->html` through the renderer

- [ ] `ShortcodeRenderer` has `register(string $name, Closure $handler)` and `replace(string $html): string`. Handlers receive `(array $params)` (parsed from `{name:key=value}` syntax) and return a string.

- [ ] `CoreShortcodes::register()` registers `site_name`, `today`, `year`, `user_email`.

- [ ] Match pattern: `\{([a-z][a-z_]*)(:([^}]*))?\}` — captures name + optional params after a colon.

- [ ] Public layout uses the renderer:
  ```blade
  {!! \App\Support\ShortcodeRenderer::replace($translation->html ?? '') !!}
  ```

- [ ] JS widget `mp-shortcode`: renders placeholder text `[{code}]` in the editor canvas; the actual `{code}` value is saved as-is in the HTML so the server-side renderer replaces it on output.

- [ ] Tests:
  - `replace` handles a registered shortcode
  - Unknown shortcodes pass through unchanged
  - Parameter parsing works (`{format:date,short}`)

---

## Task 9: Build + verify

- [ ] `npm run build` clean
- [ ] `php artisan test` green
- [ ] Manual smoke:
  1. Drop a heading, set animation to "Fade up" in the new Animation group, save+publish → public URL shows the heading fading in on scroll.
  2. Select a button → toggle State to Hover → change background color → public URL shows the new color only on hover.
  3. Drop a Map widget → enter address "Empire State Building" → publish → embedded map renders.
  4. Drop a Rating widget → set value 3.5 → see 3.5 stars filled.
  5. Type `{site_name}` in a Heading via the Shortcode widget → publish → public URL shows the app name.

---

## Plan 9 Acceptance Criteria

1. `WidgetRegistry::ALLOWED_TYPES` includes the 3 new types.
2. `data-mp-animation` attribute drives a scroll-reveal animation on public pages.
3. Style panel header has Normal/Hover state toggle.
4. Hover state writes route to `:hover` CSS rules.
5. New "Animation" + "Motion" groups in Style tab.
6. `mp-map`, `mp-rating`, `mp-shortcode` widgets registered as blocks in the left panel.
7. `ShortcodeRenderer` replaces `{site_name}` / `{today}` / `{year}` / `{user_email}` placeholders in saved HTML before public render.
8. `php artisan test` green; `npm run build` clean.
