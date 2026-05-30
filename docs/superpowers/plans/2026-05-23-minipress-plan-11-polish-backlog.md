# MiniPress Plan 11: Polish Backlog

> Continuous execution. No subagent reviews, no per-task stops.

**Goal:** Pay down the quality backlog accumulated during Plans 5-10. Five focused items:

1. **`mp-html` widget sanitization** — server-side `HtmlSanitizer` extension that strips `<script>` and non-whitelisted iframes from the raw HTML widget's content. The widget's escape-hatch nature means a user could paste a `<script>` and it would render with the page; we whitelist iframe domains (youtube/vimeo/maps.google) and strip everything else.
2. **Popover a11y polish** — focus trap, Tab cycle, `aria-modal`, restore focus on close. Applied to `section-picker`, `link-popover`, `save-as-template-modal`.
3. **Per-breakpoint inheritance badges** — when a style control has a value at Desktop but no override on the active Tablet/Mobile device, show a small "↳ desktop" hint next to the control so users know the value is inherited rather than directly set.
4. **JS↔PHP registry sync test** — a Pest test that lists every type registered in JS (via a known constant) and asserts the PHP `WidgetRegistry` knows them all (and vice-versa). Catches drift when someone adds a widget on one side only.
5. **Build + verify**.

**Architecture:**
- `HtmlSanitizer::sanitizeRawHtml($html, $allowedIframeHosts)` — DOM-walk pass that removes `<script>`, `<object>`, `<embed>`, `<style>`, `<link>` tags entirely; for `<iframe>` it inspects `src` and removes the tag if the host isn't in the allowlist.
- `BuilderPagesController@update` walks `components_json` looking for `mp-html` nodes; sanitizes each one's `raw_html` prop in place before persisting.
- A11y for popovers: a tiny `focus-trap.js` helper that handles Tab/Shift+Tab wrap within a given root element + restore-focus-on-close. Reused across the three popovers.
- Inheritance badge: a `device-style.js` helper extended with `valueSource(editor, component, prop)` returning `'desktop' | 'tablet' | 'mobile' | null`. Style groups optionally call it and render the badge.
- Registry sync test: a new endpoint `/api/widget-types` (admin only) returns the JS-side BLOCK_DEFS list as JSON; a Pest test hits it and compares against PHP's `WidgetRegistry::allowedTypes()`. (Alternative: just keep a duplicated PHP-side const that the JS-side imports through Vite's `define`. Simpler: leave it, just add a test that loads the JS bundle's manifest. Actually simplest: a hand-maintained PHP constant `JsExpectedTypes::TYPES` that's the source-of-truth, and a test that fails if a JS-side widget file exists without a PHP entry. Going with: a test that grep's `resources/js/builder/widgets/*.js` for `addType('mp-...'` and asserts each found type is in `WidgetRegistry::ALLOWED_TYPES`.)

**Effort estimate:** ~3-4 days.

---

## Tasks

1. Sanitizer + mp-html hardening + tests
2. Focus-trap helper + apply to 3 popovers
3. Inheritance badges
4. Registry sync test
5. Build + verify
