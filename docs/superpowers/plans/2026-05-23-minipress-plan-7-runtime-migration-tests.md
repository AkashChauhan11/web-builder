# MiniPress Plan 7: Elementor Phase A — Public Runtime + Migration + Tests + Polish

> **For agentic workers:** Steps use checkbox (`- [ ]`) syntax. **Git note:** User handles git themselves — do NOT run `git add` / `git commit`. Continuous execution preferred (no per-task stops). Skip spec/quality review subagents.

**Goal:** Close out the Elementor Phase A spec. Phase 5 shipped the editor foundation, Phase 6 shipped widgets + RTE + templates. Phase 7 makes the saved pages render correctly on the PUBLIC frontend with interactive widgets working (accordions expand, tabs swap, carousel slides, counters animate, gallery lightboxes open, alerts dismiss). It also migrates the seeded placeholder pages to the new component-tree format, adds snapshot tests pinning the HTML output, and addresses the quality backlog accumulated during Plans 5+6.

**Architecture:**
- New `resources/js/builder-runtime.js` — a small (~3-5kb gzipped) ES module loaded by the PUBLIC layout. It auto-initializes any `[data-mp-widget]` element it finds on `DOMContentLoaded` by dispatching to per-widget init handlers. Embla powers the carousel; everything else is vanilla JS with IntersectionObserver where needed.
- Vite gains a new entry input for `resources/js/builder-runtime.js`. The public layout adds `@vite(['resources/js/builder-runtime.js'])` to load it.
- `PlaceholderPagesSeeder` is rewritten to produce component-tree JSON for the seeded Welcome (and any other placeholder) pages. The seeded pages render through the Section → Column → Widget pipeline instead of raw HTML blocks.
- New `tests/Feature/BuilderRenderingTest.php` adds snapshot tests against representative component trees (empty section, mixed widgets, nested Inner Section, all 20 widgets) so future refactors can't silently change the rendered HTML.
- The Plan 5/6 backlog gets paid down: `WidgetRegistry` rejects malformed nodes (non-string `type`, non-array `components`); `section-picker.js` adds keyboard/focus/aria-haspopup affordances; popover positioning clamps to the viewport and repositions on resize; the deferred-listener race window is closed by tracking a `closed` flag.

**Tech stack additions:** none — `embla-carousel` was already installed in Plan 6.

**Effort estimate:** ~3-4 days (7 tasks).

---

## Scope of Plan 7

Implements **spec sections:** Migration + frontend rendering, Testing strategy.

This is the final plan for the Phase A spec. After Plan 7 ships, Phase A is complete and the editor is ready for real use. Phase B (per-breakpoint responsive, template library, global styles) and Phase C (animations, hover states, form builder) get their own spec → plan cycles when the user is ready.

---

## What Plans 1-6 Already Did

- Plan 1: admin auth + page CRUD + database schema for `builder_pages` / `builder_page_translations` / `builder_page_seo` + 47 Pest tests.
- Plan 2: GrapesJS editor mount + save/publish flow + asset uploads + SEO modal + 10 more tests.
- Plans 3-4: Media library + Users CRUD + Languages CRUD + README + test sweep.
- Plan 5: Editor foundation — runtime CSS, `WidgetRegistry` whitelist, `mp-section`/`mp-column` types, custom Tailwind style panel with 7 groups + Advanced tab, 6 reusable control primitives.
- Plan 6: 20 widget types, custom RTE with per-widget action profiles, Lucide icon sprite with 34 icons, 4 starter Section templates, BlockManager-driven left widget panel.

The editor at `/admin/builder/{id}/edit` is fully featured. Public pages currently render via the existing PageController + the saved `html`/`css` fields, but interactive widgets are static (no JS hooks) and the seeded pages still use the old raw-HTML format.

---

## File Map for Plan 7

### Created (JS)
- `resources/js/builder-runtime.js` — public-page interactive runtime

### Created (PHP / tests)
- `tests/Feature/BuilderRenderingTest.php` — snapshot tests for rendered HTML
- `tests/__snapshots__/...` — Pest snapshot files (created by Pest on first run)

### Modified
- `vite.config.js` — add `resources/js/builder-runtime.js` to inputs
- `resources/views/layouts/app.blade.php` — add `@vite(['resources/js/builder-runtime.js'])`
- `database/seeders/PlaceholderPagesSeeder.php` — rewrite seeded pages to use component-tree JSON
- `app/Support/WidgetRegistry.php` — reject malformed nodes (non-string `type`, non-array `components`)
- `tests/Unit/WidgetRegistryTest.php` — add tests pinning the new malformed-node rejection
- `resources/js/builder/sections/section-picker.js` — viewport clamping, scroll/resize reposition, listener-leak fix, aria-haspopup/aria-expanded on the trigger button, focus management
- `resources/js/builder/rte/link-popover.js` — same a11y improvements as section-picker
- `resources/views/admin/builder/editor.blade.php` — add `aria-haspopup="dialog" aria-expanded="false" aria-controls="mp-section-picker"` to the `gjs-add-section` button

### Untouched
- All Plan 5/6 widget files — they emit the correct `data-mp-widget`/data-attr scaffolding for the runtime to hook into
- All style panel files
- `WidgetRegistry::ALLOWED_TYPES` content — only the validation logic changes

---

## Conventions for This Plan

- **No git commits from subagents.** User stages.
- **TDD where useful** — tests for `WidgetRegistry` tightening, snapshot tests for renderings.
- **JS:** plain ES modules. `builder-runtime.js` has no framework, no virtual DOM.
- **Continuous execution preferred.** Plow through tasks; user reviews the batch at the end.

---

## Task 1: Public-page runtime JS

**Files:**
- Create: `resources/js/builder-runtime.js`

The runtime auto-initializes on `DOMContentLoaded`. It queries for `[data-mp-widget]` elements and dispatches each to its handler. Handlers are idempotent — they read data attributes for config and set up event listeners + observers.

- [ ] **Step 1: Skeleton + dispatcher**

```js
// resources/js/builder-runtime.js
// Loaded on PUBLIC pages. Wires interactive behaviors to the widget HTML the editor saves.

const HANDLERS = {
    'accordion': initAccordion,
    'tabs': initTabs,
    'alert': initAlert,
    'counter': initCounter,
    'progress': initProgress,
    'carousel': initCarousel,
    'gallery': initGallery,
};

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-mp-widget]').forEach((el) => {
        const type = el.dataset.mpWidget;
        const handler = HANDLERS[type];
        if (handler) handler(el);
    });
});
```

- [ ] **Step 2: Accordion handler**

Click on `.mp-accordion__title` toggles `data-mp-open` on the parent `.mp-accordion__item`. Respects parent's `data-mp-multiple` (1 = allow multiple open, 0 = close siblings).

```js
function initAccordion(root) {
    const allowMultiple = root.dataset.mpMultiple === '1';
    root.querySelectorAll('.mp-accordion__item').forEach((item) => {
        const title = item.querySelector('.mp-accordion__title');
        title?.addEventListener('click', () => {
            const isOpen = item.dataset.mpOpen === '1';
            if (!allowMultiple) {
                root.querySelectorAll('.mp-accordion__item').forEach((sib) => {
                    sib.dataset.mpOpen = '0';
                });
            }
            item.dataset.mpOpen = isOpen ? '0' : '1';
        });
    });
}
```

- [ ] **Step 3: Tabs handler**

Click on `.mp-tab__label` activates that tab and deactivates siblings. Inside an `mp-tabs` parent, also need to swap `data-mp-active` on each `.mp-tab__panel`. The default tab is read from `root.dataset.mpDefault`.

```js
function initTabs(root) {
    const tabs = Array.from(root.querySelectorAll('.mp-tab'));
    const defaultIdx = parseInt(root.dataset.mpDefault, 10) || 0;

    function activate(idx) {
        tabs.forEach((tab, i) => {
            const active = i === idx ? '1' : '0';
            tab.dataset.mpActive = active;
            tab.querySelector('.mp-tab__label')?.setAttribute('data-mp-active', active);
            tab.querySelector('.mp-tab__panel')?.setAttribute('data-mp-active', active);
        });
    }
    tabs.forEach((tab, i) => {
        tab.querySelector('.mp-tab__label')?.addEventListener('click', () => activate(i));
    });
    activate(defaultIdx);
}
```

- [ ] **Step 4: Alert handler**

Click on `.mp-alert__close` hides the alert (sets `display: none`). Client-side only — no persistence.

```js
function initAlert(root) {
    if (root.dataset.mpDismissible !== '1') return;
    const close = root.querySelector('.mp-alert__close');
    close?.addEventListener('click', () => {
        root.style.display = 'none';
    });
}
```

- [ ] **Step 5: Counter handler**

IntersectionObserver triggers count-up from `data-mp-start` to `data-mp-end` over `data-mp-duration` ms. Once-only; observer disconnects after fire.

```js
function initCounter(root) {
    const start = parseFloat(root.dataset.mpStart) || 0;
    const end = parseFloat(root.dataset.mpEnd) || 100;
    const duration = parseFloat(root.dataset.mpDuration) || 2000;
    const prefix = root.dataset.mpPrefix || '';
    const suffix = root.dataset.mpSuffix || '';
    const separator = root.dataset.mpSeparator || ',';
    const display = root.querySelector('.mp-counter__value');
    if (!display) return;

    const fmt = (n) => {
        const rounded = Math.round(n);
        const withSep = separator
            ? String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, separator)
            : String(rounded);
        return `${prefix}${withSep}${suffix}`;
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                animateValue(start, end, duration, (v) => { display.textContent = fmt(v); });
                observer.disconnect();
            }
        });
    }, { threshold: 0.3 });
    observer.observe(root);
}

function animateValue(from, to, duration, onTick) {
    const t0 = performance.now();
    function tick(now) {
        const t = Math.min(1, (now - t0) / duration);
        const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
        const v = from + (to - from) * eased;
        onTick(v);
        if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
}
```

- [ ] **Step 6: Progress handler**

Similar pattern — IntersectionObserver triggers fill animation. The fill bar starts at width 0 and animates to its target width on scroll-in (only if `data-mp-animated="1"`).

```js
function initProgress(root) {
    const animated = root.dataset.mpAnimated === '1';
    const fill = root.querySelector('.mp-progress__fill');
    if (!fill) return;
    if (!animated) return; // No animation requested — leave as rendered

    const targetWidth = fill.style.width || '0%';
    fill.style.width = '0%';

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                requestAnimationFrame(() => { fill.style.width = targetWidth; });
                observer.disconnect();
            }
        });
    }, { threshold: 0.3 });
    observer.observe(root);
}
```

- [ ] **Step 7: Carousel handler (Embla)**

Initialize Embla on the `.mp-carousel__viewport`. Wire prev/next buttons + dots if present. Honor `data-mp-loop` / `data-mp-autoplay` / `data-mp-arrows` / `data-mp-dots`.

```js
import EmblaCarousel from 'embla-carousel';

function initCarousel(root) {
    const viewport = root.querySelector('.mp-carousel__viewport');
    if (!viewport) return;
    const loop = root.dataset.mpLoop === '1';
    const slidesPerView = parseInt(root.dataset.mpSlides, 10) || 1;

    const embla = EmblaCarousel(viewport, { loop, slidesToScroll: 1 });

    // Prev/next
    if (root.dataset.mpArrows === '1') {
        root.querySelector('.mp-carousel__prev')?.addEventListener('click', () => embla.scrollPrev());
        root.querySelector('.mp-carousel__next')?.addEventListener('click', () => embla.scrollNext());
    }

    // Dots
    if (root.dataset.mpDots === '1') {
        const dotsContainer = root.querySelector('.mp-carousel__dots');
        if (dotsContainer) {
            const slides = embla.scrollSnapList();
            dotsContainer.innerHTML = slides.map((_, i) =>
                `<button class="mp-carousel__dot" data-active="${i === 0 ? 1 : 0}" data-idx="${i}"></button>`
            ).join('');
            dotsContainer.addEventListener('click', (e) => {
                const idx = e.target.closest('[data-idx]')?.dataset.idx;
                if (idx !== undefined) embla.scrollTo(parseInt(idx, 10));
            });
            embla.on('select', () => {
                const active = embla.selectedScrollSnap();
                dotsContainer.querySelectorAll('.mp-carousel__dot').forEach((dot, i) => {
                    dot.dataset.active = i === active ? '1' : '0';
                });
            });
        }
    }

    // Autoplay
    const autoplayMs = parseInt(root.dataset.mpAutoplay, 10) || 0;
    if (autoplayMs > 0) {
        setInterval(() => embla.scrollNext(), autoplayMs);
    }
}
```

- [ ] **Step 8: Gallery lightbox handler**

Click on any `.mp-gallery__item img` opens a modal showing the full image. Esc / click-outside / X button closes. No external dep — vanilla DOM.

```js
function initGallery(root) {
    if (root.dataset.mpLightbox !== '1') return;
    root.querySelectorAll('.mp-gallery__item').forEach((item) => {
        item.addEventListener('click', () => {
            const img = item.querySelector('img');
            if (!img) return;
            openLightbox(img.src, img.alt);
        });
    });
}

function openLightbox(src, alt) {
    const overlay = document.createElement('div');
    overlay.className = 'mp-lightbox';
    overlay.innerHTML = `
        <button class="mp-lightbox__close" aria-label="Close">×</button>
        <img src="${src.replace(/"/g, '&quot;')}" alt="${(alt || '').replace(/"/g, '&quot;')}">
    `;
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    const close = () => {
        overlay.remove();
        document.body.style.overflow = '';
        document.removeEventListener('keydown', onEsc);
    };
    function onEsc(e) { if (e.key === 'Escape') close(); }
    overlay.addEventListener('click', (e) => { if (e.target === overlay || e.target.closest('.mp-lightbox__close')) close(); });
    document.addEventListener('keydown', onEsc);
}
```

- [ ] **Step 9: Lightbox styling — extend `builder-runtime.css`**

Add at the end of the file:

```css
.mp-lightbox {
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(15, 23, 42, .92);
    display: grid; place-items: center;
    padding: 40px;
    cursor: zoom-out;
}
.mp-lightbox img {
    max-width: 100%; max-height: 100%;
    object-fit: contain;
    border-radius: 6px;
}
.mp-lightbox__close {
    position: absolute; top: 16px; right: 16px;
    width: 40px; height: 40px; border-radius: 50%;
    background: rgba(255, 255, 255, .15); color: white;
    border: 0; font-size: 24px; line-height: 1; cursor: pointer;
}
.mp-lightbox__close:hover { background: rgba(255, 255, 255, .25); }
```

**Stop here.**

---

## Task 2: Vite + layout wiring

**Files:**
- Modify: `vite.config.js` — add `resources/js/builder-runtime.js` to inputs
- Modify: `resources/views/layouts/app.blade.php` — add `@vite(['resources/js/builder-runtime.js'])`

- [ ] **Step 1: `vite.config.js`**

```js
laravel({
    input: [
        'resources/css/app.css',
        'resources/js/app.js',
        'resources/js/builder.js',
        'resources/js/builder-runtime.js',
    ],
    refresh: true,
}),
```

- [ ] **Step 2: `app.blade.php`**

In the `<head>`, add a Vite directive:

```blade
@vite(['resources/css/app.css', 'resources/js/builder-runtime.js'])
```

(If `app.css` was already included via `@vite`, just add the runtime entry to the array; don't duplicate the css.)

- [ ] **Step 3: Build**

```bash
npm run build
```

Expected: success. New chunks: `builder-runtime-*.js` (~5kb gzipped).

**Stop here.**

---

## Task 3: `PlaceholderPagesSeeder` rewrite

**Files:**
- Modify: `database/seeders/PlaceholderPagesSeeder.php`

Rewrite the seeded "Welcome" placeholder (and any others) to use the new component-tree JSON format. The seeder calls a builder helper that produces the `html` + `css` + `components_json` + `styles_json` fields by leveraging the Hero starter template's JSON structure.

- [ ] **Step 1: Read the current seeder + understand the schema**

Open `database/seeders/PlaceholderPagesSeeder.php` to see what it currently writes. The seeder probably creates one or more `BuilderPage` with `BuilderPageTranslation` rows containing raw HTML.

- [ ] **Step 2: Replace with component-tree-based content**

For each seeded page, replace the translation's `html` with rendered HTML from a small helper that serializes the component tree to HTML strings (since seeders run server-side and can't invoke GrapesJS). Use a hand-authored HTML string that matches what the editor would produce — the Hero starter template's output, essentially.

Example shape for "Welcome" page:

```php
$html = <<<'HTML'
<section class="mp-sec mp-sec--full" id="i_welcome_1" style="--mp-sec-inner:1200px; min-height:480px">
  <div class="mp-sec__inner">
    <div class="mp-col" id="i_welcome_2" style="flex-basis:50%" data-content-pos="start" data-valign="middle">
      <h1 class="mp-heading" data-mp-widget="heading" id="i_welcome_3">Welcome to MiniPress</h1>
      <div class="mp-text" data-mp-widget="text" id="i_welcome_4">Build pages visually in minutes — no code required.</div>
      <a class="mp-btn mp-btn--lg" data-mp-widget="button" id="i_welcome_5" href="/get-started">Get Started</a>
    </div>
    <div class="mp-col" id="i_welcome_6" style="flex-basis:50%" data-valign="middle">
      <figure class="mp-image" data-mp-widget="image" id="i_welcome_7">
        <img src="/images/placeholder.png" alt="Hero illustration" loading="lazy" class="mp-image__img">
      </figure>
    </div>
  </div>
</section>
HTML;
```

And construct the matching component_json tree using a static array (the same shape `editor.getComponents().toJSON()` would produce for those elements).

- [ ] **Step 3: Run the seeder**

```bash
php artisan migrate:fresh --seed
```

Expected: clean migrate. Visit `/` — see the new Welcome page rendering through the runtime CSS.

**Stop here.**

---

## Task 4: Snapshot tests for HTML output

**Files:**
- Create: `tests/Feature/BuilderRenderingTest.php`

Pest snapshots pin the rendered HTML produced for a fixed component tree. If a future refactor changes the output shape, the snapshot fails and forces a deliberate update.

- [ ] **Step 1: Bootstrap the test file**

```php
<?php

use App\Models\BuilderPage;
use App\Models\BuilderPageTranslation;
use App\Models\Language;
use App\Support\LocaleResolver;

uses(Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    LocaleResolver::bustCache();
    Language::create(['name' => 'English', 'code' => 'en', 'is_default' => true]);
    LocaleResolver::bustCache();
});
```

- [ ] **Step 2: Snapshot test for the seeded Welcome page render**

```php
it('renders a saved component-tree page with the expected HTML shape', function () {
    $page = BuilderPage::factory()->create([
        'type' => BuilderPage::TYPE_PAGE,
        'slug' => 'welcome-snap',
        'status' => BuilderPage::STATUS_PUBLISHED,
        'published_at' => now(),
        'is_homepage' => true,
    ]);
    $page->translations()->create([
        'locale' => 'en',
        'title' => 'Welcome',
        'html' => '<section class="mp-sec mp-sec--full"><div class="mp-sec__inner"><div class="mp-col" style="flex-basis:100%"><h1 class="mp-heading" data-mp-widget="heading">Hello</h1></div></div></section>',
        'css' => '',
    ]);
    $page->seo()->create(['locale' => 'en']);

    $response = $this->get('/');
    $response->assertOk();
    // Strip whitespace so the snapshot isn't whitespace-sensitive in trivial ways
    $normalized = preg_replace('/\s+/', ' ', $response->getContent());
    expect($normalized)->toMatchSnapshot();
});
```

- [ ] **Step 3: Snapshot tests for all 20 widgets in isolation (one composite snapshot is fine)**

A single test rendering a page that contains one of every widget type (statically authored HTML in a fixture). On first run Pest writes the snapshot; subsequent runs compare.

- [ ] **Step 4: Run tests**

```bash
php artisan test --filter=BuilderRenderingTest
```

Expected: snapshots created on first run; subsequent runs PASS.

**Stop here.**

---

## Task 5: `WidgetRegistry` malformed-node hardening

**Files:**
- Modify: `app/Support/WidgetRegistry.php`
- Modify: `tests/Unit/WidgetRegistryTest.php`

Tighten the validator to reject:
- Nodes with non-string `type`
- Nodes with non-array `components`
- Nodes where the root level has a non-array entry

- [ ] **Step 1: Add `hasMalformedNodes` helper**

```php
public static function hasMalformedNodes(array $tree): bool
{
    $found = false;
    self::walk($tree, function (array $node) use (&$found) {
        // Type must be a non-empty string
        if (! isset($node['type']) || ! is_string($node['type']) || $node['type'] === '') {
            $found = true;
            return;
        }
        // If components key exists, must be an array
        if (array_key_exists('components', $node) && ! is_array($node['components'])) {
            $found = true;
        }
    });
    return $found;
}
```

- [ ] **Step 2: Wire into the `update` validator**

In `BuilderPagesController@update`, the closure rule should call `hasMalformedNodes` before `hasInvalidRoots`:

```php
function (string $attribute, mixed $value, \Closure $fail) {
    if (! is_array($value)) return;
    if (WidgetRegistry::hasMalformedNodes($value)) {
        $fail('Page contains malformed component nodes (missing or invalid type, or non-array components).');
        return;
    }
    if (WidgetRegistry::hasInvalidRoots($value)) {
        $fail('Page root must contain only mp-section components.');
        return;
    }
    $unknown = WidgetRegistry::unknownTypesIn($value);
    if (! empty($unknown)) {
        $fail('Unknown component types: ' . implode(', ', $unknown));
    }
},
```

- [ ] **Step 3: Add unit tests**

```php
it('flags nodes with non-string type as malformed', function () {
    $tree = [['type' => 123, 'components' => []]];
    expect(WidgetRegistry::hasMalformedNodes($tree))->toBeTrue();
});

it('flags nodes with missing type as malformed', function () {
    $tree = [['components' => []]];
    expect(WidgetRegistry::hasMalformedNodes($tree))->toBeTrue();
});

it('flags nodes with non-array components as malformed', function () {
    $tree = [['type' => 'mp-section', 'components' => 'oops']];
    expect(WidgetRegistry::hasMalformedNodes($tree))->toBeTrue();
});

it('accepts well-formed trees', function () {
    $tree = [['type' => 'mp-section', 'components' => [['type' => 'mp-column', 'components' => []]]]];
    expect(WidgetRegistry::hasMalformedNodes($tree))->toBeFalse();
});

it('returns ordered unique unknown types', function () {
    $tree = [
        ['type' => 'mp-section', 'components' => [
            ['type' => 'mp-foo'],
            ['type' => 'mp-bar', 'components' => [['type' => 'mp-foo']]],
        ]],
    ];
    expect(WidgetRegistry::unknownTypesIn($tree))->toBe(['mp-foo', 'mp-bar']);
});
```

- [ ] **Step 4: Run tests**

```bash
php artisan test --filter=WidgetRegistry
```

**Stop here.**

---

## Task 6: Popover quality fixes — accessibility + viewport clamping + listener-leak

**Files:**
- Modify: `resources/js/builder/sections/section-picker.js`
- Modify: `resources/js/builder/rte/link-popover.js`
- Modify: `resources/views/admin/builder/editor.blade.php`

Address the Plan 4 + Plan 6 review backlog: popover viewport clamping, scroll/resize reposition, listener-leak edge case, accessibility attributes.

- [ ] **Step 1: Shared popover positioning helper**

Create a small helper to position popovers under an anchor element with viewport clamping:

```js
// Position a popover under anchorEl, clamped to the viewport with 8px margin.
function positionPopover(popover, anchorEl) {
    const rect = anchorEl.getBoundingClientRect();
    const popRect = popover.getBoundingClientRect();
    const margin = 8;

    let left = rect.right + window.scrollX - popRect.width;
    let top = rect.bottom + window.scrollY + 4;

    // Clamp horizontally
    left = Math.max(margin, Math.min(window.innerWidth - popRect.width - margin + window.scrollX, left));

    // Clamp vertically — flip above the anchor if not enough space below
    if (top + popRect.height > window.innerHeight + window.scrollY - margin) {
        const above = rect.top + window.scrollY - popRect.height - 4;
        if (above > window.scrollY + margin) top = above;
    }

    popover.style.left = `${left}px`;
    popover.style.top = `${top}px`;
}
```

Inline this helper at the top of both `section-picker.js` and `link-popover.js` (or extract to a shared `controls/popover-position.js` — your call).

- [ ] **Step 2: Fix the listener-leak race**

Track a `closed` flag and bail out of the deferred `setTimeout` callback if the popover was already removed:

```js
let closed = false;
setTimeout(() => {
    if (closed) return;
    document.addEventListener('mousedown', closeOnOutside, true);
    document.addEventListener('keydown', closeOnEscape, true);
}, 0);

// In closeExistingPicker (or closeLinkPopover):
closed = true;
// then proceed with normal cleanup
```

- [ ] **Step 3: Reposition on scroll + resize**

```js
const reposition = () => positionPopover(popover, anchorButton);
window.addEventListener('scroll', reposition, true);
window.addEventListener('resize', reposition);
// In cleanup:
window.removeEventListener('scroll', reposition, true);
window.removeEventListener('resize', reposition);
```

- [ ] **Step 4: Accessibility — section picker**

In `editor.blade.php`, update the button:

```blade
<button id="gjs-add-section" type="button"
    aria-haspopup="dialog"
    aria-expanded="false"
    aria-controls="mp-section-picker"
    class="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded font-semibold">
    + Section
</button>
```

In `openSectionPicker`:

```js
anchorButton.setAttribute('aria-expanded', 'true');
popover.setAttribute('role', 'dialog');
popover.setAttribute('aria-label', 'Choose section structure');
// Move focus into the first preset button
popover.querySelector('button')?.focus();
```

In `closeExistingPicker`:

```js
existing.previousAnchor?.setAttribute('aria-expanded', 'false');
existing.previousAnchor?.focus();
```

Store `previousAnchor` on the popover when opening so close can restore focus.

- [ ] **Step 5: Same for link-popover.js**

Same accessibility pattern. The link popover doesn't have a permanent trigger button (it's spawned from inside the RTE), so the focus restore target is whatever element was active when the popover opened — save `document.activeElement` and restore on close.

- [ ] **Step 6: Build**

```bash
npm run build
```

**Stop here.**

---

## Task 7: Final acceptance verification

**Files:** none — verification only.

- [ ] **Step 1: Full test suite**

```bash
php artisan test
```

Expected: green. New tests: ~5 snapshot tests (Plan 7), 4 malformed-node tests (Plan 7), 6 unit + 4 feature (Plan 5) — total ~109 tests (92 from before + ~9 new + 5 snapshots).

- [ ] **Step 2: Clean build**

```bash
npm run build
```

Expected: manifest has chunks `app-*.js`, `app-*.css`, `builder-*.js`, `builder-*.css`, `builder-runtime-*.js`. Bundle sizes roughly: builder ~330kb gz, builder-runtime ~5kb gz, app ~12kb gz.

- [ ] **Step 3: End-to-end manual smoke checklist**

```bash
php artisan migrate:fresh --seed
php artisan serve
```

Then in the browser:

1. Visit `/` → seeded Welcome page renders with the Section/Column/Widget markup. Inspect DOM: `.mp-sec`, `.mp-col`, `.mp-heading`, `.mp-btn` all present.
2. Log into `/admin/login`.
3. Click Edit on Welcome → editor loads. Left panel shows 20 widget tiles grouped into 5 categories. Right panel mounts on selection.
4. Drag a Heading widget from the left into the first column → it appears in the canvas. Click into it, type "Hello World", click outside.
5. Drag an Accordion → click "+ Add item" in the Content tab → drag an Alert into one of the accordion item bodies.
6. Click "+ Section" → Templates tab → click Feature Grid → it inserts.
7. Save Draft → "Saved ✓".
8. Publish → "Published ✓".
9. Refresh the editor → all changes persist.
10. Visit the public URL → the page renders correctly. Click an accordion item — it expands. Click a tab — content swaps. Click a gallery image — lightbox opens. Scroll past a counter — it animates from 0 to its end value. Scroll past a progress bar — fill animates.
11. Test the carousel — arrows + dots + autoplay.
12. Test alert dismiss — click × → alert hides.

- [ ] **Step 4: Performance check**

Open Chrome DevTools → Lighthouse → Performance audit on the published Welcome page. Targets per spec:
- Desktop: ≥ 90
- Mobile: ≥ 75
- CSS payload < 50kb
- Runtime JS < 15kb gzipped

If any miss, file as Phase B/C issues rather than blocking Phase A.

**Stop here. Plan 7 complete.**

---

## Plan 7 Acceptance Criteria

Plan 7 is complete when:

1. `resources/js/builder-runtime.js` exists, registered as a Vite entry, loaded by the public layout.
2. All 7 interactive widgets work on public pages (accordion, tabs, alert dismiss, counter, progress, carousel, gallery lightbox).
3. `PlaceholderPagesSeeder` produces seeded pages using the new component-tree format; `migrate:fresh --seed` works.
4. `tests/Feature/BuilderRenderingTest.php` has at least 2 passing snapshot tests.
5. `tests/Unit/WidgetRegistryTest.php` has ~4 new tests for malformed-node rejection.
6. `WidgetRegistry::hasMalformedNodes` exists and is called before `hasInvalidRoots` / `unknownTypesIn` in the validator.
7. Section picker + link popover clamp to the viewport, reposition on scroll/resize, have no listener leak, and announce themselves to assistive tech via `role="dialog"` + `aria-haspopup`/`aria-expanded`.
8. `php artisan test` is green; `npm run build` is clean.
9. Manual smoke checklist passes end-to-end (visit public URL, see interactive widgets working).

---

## Phase A complete!

After Plan 7 ships, the Elementor Phase A spec is fully delivered:

- Section / Column / Inner Section layout primitive ✓
- 20 widgets in 5 categories ✓
- Custom RTE with per-widget profiles ✓
- 4 starter Section templates ✓
- Custom Tailwind-styled style panel with 7 groups + Advanced tab ✓
- 6 reusable control primitives ✓
- 34 curated icons (Lucide + custom social) ✓
- Server-side WidgetRegistry whitelist with malformed-node rejection ✓
- Public-page interactive runtime (carousel, accordion, tabs, counter, progress, gallery, alert) ✓
- Seeded placeholder pages using the new component format ✓
- Snapshot tests pinning the rendered HTML shape ✓
- Accessibility + viewport clamping on popovers ✓

Phase B (per-breakpoint responsive, template library, global styles) and Phase C (animations, hover states, form builder) get their own spec → plan cycles when the user is ready to start.
