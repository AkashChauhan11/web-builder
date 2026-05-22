# MiniPress Plan 5: Elementor Phase A — Editor Foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **Git note:** The user handles git themselves — do NOT run `git add` or `git commit` from subagents. Stop after each task's checks pass.

**Goal:** Replace the current "drag a Hero block" GrapesJS setup with the architectural foundation for an Elementor-style builder: a typed Section → Column primitive, a runtime stylesheet shared by editor + public pages, reusable control primitives (NumberWithUnit, FourSideInput, etc.), and a custom Tailwind-styled three-tab style panel with all six universal style groups. After this plan, the editor still has zero widgets (Plan 6 adds them) but you can drop Sections, choose column structures, drag-resize columns, and the right panel shows polished style controls when an element is selected.

**Architecture:**
- Two new GrapesJS custom component types (`mp-section`, `mp-column`) with strict drop rules.
- A `WidgetRegistry` PHP class enumerates the 23 future-allowed component types and is wired into `BuilderPagesController@update` validation — defensive whitelist for the JSON tree saved to `components_json`.
- A small `resources/css/builder-runtime.css` provides base structural CSS for `.mp-sec`, `.mp-col`, etc. — `@import`ed by `app.css` so it loads in the editor canvas AND on public pages.
- The right-panel style UI is hand-built in vanilla JS / Tailwind, replacing GrapesJS's default style manager. Six reusable control primitives + seven style groups. Selection events fire → panel mounts the appropriate groups → control changes call GrapesJS `getSelected().addStyle()`.
- No widgets, no RTE, no public-runtime JS, no seeder changes in this plan — those are Plans 6 and 7.

**Tech stack additions:** none — uses existing GrapesJS, Coloris, Tailwind, Vite, Pest.

---

## Scope of Plan 5

Implements **spec sections:** Architecture, Data model, Style panel & CSS compilation, Section / Column primitive.

**Out of scope (Plans 6 / 7):**
- 20 widgets — Plan 6
- Custom RTE toolbar + inline editing — Plan 6
- 4 starter Section templates — Plan 6
- Public-page `builder-runtime.js` — Plan 7
- `PlaceholderPagesSeeder` rewrite — Plan 7
- Snapshot tests, final smoke checklist — Plan 7

---

## What Plans 1-4 Already Did (and we rely on)

- GrapesJS 0.22 mounted on `#gjs` via [resources/js/builder.js](resources/js/builder.js); reads `data-config` from the editor view.
- `BuilderPagesController` with `edit/update/publish/uploadAsset` actions at [app/Http/Controllers/Admin/BuilderPagesController.php](app/Http/Controllers/Admin/BuilderPagesController.php). The `update` action already validates the payload, stores translation fields, sanitizes HTML, and writes `components_json` + `styles_json`.
- `HtmlSanitizer::stripDocumentWrappers` at [app/Support/HtmlSanitizer.php](app/Support/HtmlSanitizer.php) strips `<html>` / `<head>` / `<body>` wrappers from saved HTML.
- Coloris dark-themed picker initialized in [resources/js/builder/coloris-init.js](resources/js/builder/coloris-init.js) — we'll wrap this in the new `colorPicker` control primitive in Task 6.
- Existing custom blocks (Hero, Two-Column, CTA, Feature Grid) defined in [resources/js/builder/blocks.js](resources/js/builder/blocks.js). **Plan 5 leaves this file alone.** Plan 6 deletes it once the widget catalog + starter Section templates replace those blocks.
- Vite config at [vite.config.js](vite.config.js) currently bundles `app.css`, `app.js`, `builder.js`. Plan 5 modifies it once (Task 1) to handle the new CSS import.
- 57 Pest tests passing. Plan 5 adds ~6 new ones in Task 2.

---

## Conventions for This Plan

- **No git commits.** Subagents stop after a task's checks pass. The user stages and commits.
- **Pest 3** for tests, in `tests/Feature/` or `tests/Unit/`.
- **TDD for the server-side `WidgetRegistry` and `update` validation** — write failing test, implement, confirm pass (Task 2).
- **JS is plain ES modules, no TypeScript, no framework.** Each control primitive is a small factory function returning an `HTMLElement` with an event-emitter interface.
- **Style panel UI** is built with Tailwind utility classes. We use existing Tailwind v4 already wired by Plan 2 — no new build deps.
- **One task = one verifiable milestone.** Stop at the end of each task for user review.

---

## File Map for Plan 5

### Created (PHP)
- `app/Support/WidgetRegistry.php`
- `tests/Unit/WidgetRegistryTest.php`

### Created (JS)
- `resources/js/builder/sections/section.js` — `mp-section` GrapesJS component type
- `resources/js/builder/sections/column.js` — `mp-column` component type
- `resources/js/builder/sections/section-picker.js` — the preset structure popover
- `resources/js/builder/controls/number-with-unit.js`
- `resources/js/builder/controls/four-side-input.js`
- `resources/js/builder/controls/color-picker.js` — wraps Coloris
- `resources/js/builder/controls/preset-chips.js`
- `resources/js/builder/controls/slider.js`
- `resources/js/builder/controls/collapsible-group.js`
- `resources/js/builder/style-panel/index.js` — panel mount + tab routing + selection wiring
- `resources/js/builder/style-panel/groups/typography.js`
- `resources/js/builder/style-panel/groups/background.js`
- `resources/js/builder/style-panel/groups/border.js`
- `resources/js/builder/style-panel/groups/shadow.js`
- `resources/js/builder/style-panel/groups/spacing.js`
- `resources/js/builder/style-panel/groups/sizing.js`
- `resources/js/builder/style-panel/groups/layout.js`

### Created (CSS)
- `resources/css/builder-runtime.css`

### Modified
- `resources/css/app.css` — add `@import 'builder-runtime.css';`
- `resources/js/builder.js` — register new component types, mount style panel, remove the right-panel default behavior
- `resources/views/admin/builder/editor.blade.php` — adjust the editor frame so the new style panel has a mount point and the GrapesJS default panel area is hidden
- `app/Http/Controllers/Admin/BuilderPagesController.php` — `update()` now validates `components_json` shape via `WidgetRegistry`
- `tests/Feature/BuilderAdminTest.php` — add 4 new tests for component-tree validation

---

## Task 1: Runtime stylesheet + Vite wiring

**Files:**
- Create: `resources/css/builder-runtime.css`
- Modify: `resources/css/app.css`
- Modify: `resources/js/builder.js` (load runtime CSS into the GrapesJS canvas)

This task ships the structural CSS that both the editor canvas and public pages will load. After this task, dropping bare `<section class="mp-sec">` markup on a page renders as expected on mobile and desktop.

- [ ] **Step 1: Create `resources/css/builder-runtime.css`**

```css
/* MiniPress builder runtime — shared by editor canvas and public pages.
   Structural CSS only. Per-element styling lives in saved page CSS. */

:root {
  --mp-sec-inner: 1200px;
  --mp-sec-gap: 20px;
  --mp-col-gap: 16px;
}

.mp-sec {
  width: 100%;
  padding: 80px 24px;
  position: relative;
}

.mp-sec--boxed .mp-sec__inner,
.mp-sec--full  .mp-sec__inner {
  max-width: var(--mp-sec-inner);
  margin: 0 auto;
}

.mp-sec__inner {
  display: flex;
  flex-wrap: wrap;
  gap: var(--mp-sec-gap);
  align-items: flex-start;
  width: 100%;
}

.mp-sec[data-valign="middle"] .mp-sec__inner { align-items: center; }
.mp-sec[data-valign="bottom"] .mp-sec__inner { align-items: flex-end; }

.mp-col {
  flex: 0 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--mp-col-gap);
}

.mp-col[data-content-pos="center"] { align-items: center; }
.mp-col[data-content-pos="end"]    { align-items: flex-end; }

@media (max-width: 768px) {
  .mp-col { flex-basis: 100% !important; }
}

/* Resize grip — shown only inside the editor (parent has .gjs-editor- root class) */
.gjs-editor .mp-col + .mp-col {
  position: relative;
}
.gjs-editor .mp-col + .mp-col::before {
  content: "";
  position: absolute;
  left: calc(-1 * var(--mp-sec-gap) / 2);
  top: 0;
  bottom: 0;
  width: 6px;
  cursor: col-resize;
  background: transparent;
  z-index: 5;
}
.gjs-editor .mp-col + .mp-col:hover::before {
  background: rgba(59, 130, 246, 0.3);
}
```

- [ ] **Step 2: Add the `@import` to `resources/css/app.css`**

Open [resources/css/app.css](resources/css/app.css). It currently looks roughly like:

```css
@import "tailwindcss";
```

Add the runtime import on the next line:

```css
@import "tailwindcss";
@import "./builder-runtime.css";
```

- [ ] **Step 3: Load the runtime CSS into the GrapesJS canvas**

The canvas runs in an iframe — it doesn't inherit the parent page's styles. We need to tell GrapesJS to load the same compiled CSS that public pages use. Vite emits hashed asset URLs; we resolve via the Vite manifest at runtime through Laravel's `Vite::asset()`.

In [app/Http/Controllers/Admin/BuilderPagesController.php](app/Http/Controllers/Admin/BuilderPagesController.php), find the `edit()` method's `$config` array. Add a `canvas_css_url` field:

```php
use Illuminate\Support\Facades\Vite;
// (add to existing imports)

$config = [
    'csrf' => csrf_token(),
    'canvas_css_url' => Vite::asset('resources/css/app.css'),
    'page' => [
        // ...existing fields...
    ],
    // ...existing fields...
];
```

In [resources/js/builder.js](resources/js/builder.js), find the `grapesjs.init({...})` call and update the `canvas` section:

```js
canvas: {
    styles: config.canvas_css_url ? [config.canvas_css_url] : [],
    scripts: [], // tailwindcss cdn was here for plan 2; drop it — we now use compiled Tailwind via canvas_css_url
},
```

(If `scripts: ['https://cdn.tailwindcss.com']` is currently present in `canvas:`, replace it with the lines above. Existing inline Tailwind classes in current blocks keep working only until Plan 6 deletes those blocks; after Plan 6, the canvas no longer needs the CDN Tailwind script either — but compiled Tailwind via `app.css` includes everything the runtime needs.)

- [ ] **Step 4: Build assets**

Run from the project root:

```bash
npm run build
```

Expected: build succeeds. The `app.css` chunk now includes the runtime rules. Confirm:

```bash
grep -o 'mp-sec' public/build/assets/app-*.css | head -1
```

Expected output: `mp-sec`. If empty, the import isn't compiled — re-check Step 2.

- [ ] **Step 5: Manual smoke test**

```bash
php artisan serve
```

1. Log in at `/admin/login`.
2. Click "Edit" on the Welcome page (existing Plan 2 content).
3. Open the browser DevTools → Network tab. Reload the editor. Confirm `app-*.css` loads from inside the iframe (filter "css" — you should see two requests for `app-*.css`: one for the parent admin shell, one for the canvas iframe).
4. In the iframe's elements panel, verify `.mp-sec` rules are present in the stylesheet. (The page itself won't have `.mp-sec` elements yet — that's Task 3+. We're just verifying the CSS reaches the canvas.)

Stop the server.

**Stop here. The user will stage/commit.**

---

## Task 2: WidgetRegistry + server-side component-tree validation

**Files:**
- Create: `app/Support/WidgetRegistry.php`
- Create: `tests/Unit/WidgetRegistryTest.php`
- Modify: `app/Http/Controllers/Admin/BuilderPagesController.php`
- Modify: `tests/Feature/BuilderAdminTest.php`

Defensive whitelist for the JSON tree saved by the editor. Today the `update` validator treats `components_json` as opaque — any shape passes. We make it whitelist component types and reject unknown ones.

- [ ] **Step 1: Write the failing `WidgetRegistryTest`**

Create `tests/Unit/WidgetRegistryTest.php`:

```php
<?php

use App\Support\WidgetRegistry;

it('lists every component type allowed in a builder page tree', function () {
    $types = WidgetRegistry::allowedTypes();

    expect($types)->toContain('mp-section', 'mp-column', 'textnode');

    // All 20 Phase-A widgets — these are still NotYetImplemented in Plan 5,
    // but the registry pre-enumerates them so the server side is ready for Plan 6.
    expect($types)->toContain(
        'mp-heading', 'mp-text', 'mp-image', 'mp-button',
        'mp-icon', 'mp-icon-box', 'mp-divider', 'mp-spacer',
        'mp-video', 'mp-carousel', 'mp-gallery',
        'mp-accordion', 'mp-tabs', 'mp-counter',
        'mp-testimonial', 'mp-pricing', 'mp-social',
        'mp-progress', 'mp-alert', 'mp-html',
    );
});

it('lists exactly 23 types — section + column + textnode + 20 widgets', function () {
    expect(WidgetRegistry::allowedTypes())->toHaveCount(23);
});

it('rejects unknown types via isAllowed()', function () {
    expect(WidgetRegistry::isAllowed('mp-heading'))->toBeTrue();
    expect(WidgetRegistry::isAllowed('mp-unknown'))->toBeFalse();
    expect(WidgetRegistry::isAllowed(''))->toBeFalse();
});

it('finds unknown types in a component tree', function () {
    $tree = [
        ['type' => 'mp-section', 'components' => [
            ['type' => 'mp-column', 'components' => [
                ['type' => 'mp-heading', 'components' => [
                    ['type' => 'textnode', 'content' => 'Hi'],
                ]],
                ['type' => 'mp-evil', 'components' => []],  // <-- bad
            ]],
        ]],
    ];

    expect(WidgetRegistry::unknownTypesIn($tree))->toBe(['mp-evil']);
});

it('returns no unknown types for a valid tree', function () {
    $tree = [
        ['type' => 'mp-section', 'components' => [
            ['type' => 'mp-column', 'components' => [
                ['type' => 'mp-button', 'components' => [
                    ['type' => 'textnode', 'content' => 'Click'],
                ]],
            ]],
        ]],
    ];

    expect(WidgetRegistry::unknownTypesIn($tree))->toBe([]);
});

it('rejects roots that are not mp-section', function () {
    $tree = [['type' => 'mp-heading', 'components' => []]];
    expect(WidgetRegistry::hasInvalidRoots($tree))->toBeTrue();

    $valid = [['type' => 'mp-section', 'components' => []]];
    expect(WidgetRegistry::hasInvalidRoots($valid))->toBeFalse();
});
```

- [ ] **Step 2: Confirm the test fails**

```bash
php artisan test --filter=WidgetRegistryTest
```

Expected: 6 failures (class missing).

- [ ] **Step 3: Implement `WidgetRegistry`**

Create `app/Support/WidgetRegistry.php`:

```php
<?php

namespace App\Support;

class WidgetRegistry
{
    /**
     * Every component `type` value allowed in a saved `components_json` tree.
     * This list is the source of truth for both the JS-side registry and server-side validation.
     */
    public const ALLOWED_TYPES = [
        // Layout primitives
        'mp-section',
        'mp-column',

        // GrapesJS built-in for inline text
        'textnode',

        // 20 widgets (Plan 6 implements them client-side)
        // Content (8)
        'mp-heading',
        'mp-text',
        'mp-image',
        'mp-button',
        'mp-icon',
        'mp-icon-box',
        'mp-divider',
        'mp-spacer',
        // Media (3)
        'mp-video',
        'mp-carousel',
        'mp-gallery',
        // Interactive (3)
        'mp-accordion',
        'mp-tabs',
        'mp-counter',
        // Social proof (3)
        'mp-testimonial',
        'mp-pricing',
        'mp-social',
        // Utility (3)
        'mp-progress',
        'mp-alert',
        'mp-html',
    ];

    /** @return string[] */
    public static function allowedTypes(): array
    {
        return self::ALLOWED_TYPES;
    }

    public static function isAllowed(string $type): bool
    {
        return in_array($type, self::ALLOWED_TYPES, true);
    }

    /**
     * Walk a component tree and return any unknown `type` values found.
     *
     * @param  array<int,array<string,mixed>>  $tree
     * @return string[]  Unique unknown type names, in order of first appearance.
     */
    public static function unknownTypesIn(array $tree): array
    {
        $unknown = [];
        self::walk($tree, function (array $node) use (&$unknown) {
            $type = $node['type'] ?? null;
            if (is_string($type) && ! self::isAllowed($type) && ! in_array($type, $unknown, true)) {
                $unknown[] = $type;
            }
        });
        return $unknown;
    }

    /**
     * Returns true if any root-level component is NOT `mp-section`.
     *
     * @param  array<int,array<string,mixed>>  $tree
     */
    public static function hasInvalidRoots(array $tree): bool
    {
        foreach ($tree as $node) {
            if (! is_array($node)) {
                return true;
            }
            if (($node['type'] ?? null) !== 'mp-section') {
                return true;
            }
        }
        return false;
    }

    /**
     * Depth-first walk over a component tree.
     *
     * @param  array<int,array<string,mixed>>  $tree
     * @param  callable(array<string,mixed>):void  $visit
     */
    private static function walk(array $tree, callable $visit): void
    {
        foreach ($tree as $node) {
            if (! is_array($node)) {
                continue;
            }
            $visit($node);
            if (isset($node['components']) && is_array($node['components'])) {
                self::walk($node['components'], $visit);
            }
        }
    }
}
```

- [ ] **Step 4: Confirm the unit test passes**

```bash
php artisan test --filter=WidgetRegistryTest
```

Expected: 6 passing.

- [ ] **Step 5: Write failing feature tests for `update` validation**

Append to `tests/Feature/BuilderAdminTest.php` (after the existing tests):

```php
it('update accepts a valid component tree (section > column > widget > textnode)', function () {
    $page = BuilderPage::factory()->create(['type' => 'page', 'slug' => 'tree-ok']);
    $page->translations()->create(['locale' => 'en', 'title' => 'X', 'html' => '', 'css' => '']);
    $page->seo()->create(['locale' => 'en']);

    $tree = [[
        'type' => 'mp-section',
        'attributes' => ['id' => 'i1'],
        'props' => ['width' => 'boxed'],
        'components' => [[
            'type' => 'mp-column',
            'attributes' => ['id' => 'i2'],
            'props' => ['size_pct' => 100],
            'components' => [[
                'type' => 'mp-heading',
                'attributes' => ['id' => 'i3'],
                'props' => ['level' => 'h1'],
                'components' => [['type' => 'textnode', 'content' => 'Hello']],
            ]],
        ]],
    ]];

    $this->actingAs($this->admin)
        ->putJson(route('admin.builder.update', $page->id), [
            'locale' => 'en',
            'title' => 'X',
            'slug' => 'tree-ok',
            'status' => 'draft',
            'is_homepage' => false,
            'html' => '<section class="mp-sec mp-sec--boxed" id="i1"><div class="mp-sec__inner"><div class="mp-col" id="i2"><h1 id="i3">Hello</h1></div></div></section>',
            'css' => '',
            'components_json' => $tree,
            'seo' => ['en' => []],
        ])->assertOk();
});

it('update rejects a tree whose root is not mp-section', function () {
    $page = BuilderPage::factory()->create(['type' => 'page', 'slug' => 'bad-root']);
    $page->translations()->create(['locale' => 'en', 'title' => 'X', 'html' => '', 'css' => '']);
    $page->seo()->create(['locale' => 'en']);

    $tree = [[
        'type' => 'mp-heading',
        'components' => [['type' => 'textnode', 'content' => 'orphan']],
    ]];

    $this->actingAs($this->admin)
        ->putJson(route('admin.builder.update', $page->id), [
            'locale' => 'en',
            'title' => 'X',
            'slug' => 'bad-root',
            'status' => 'draft',
            'is_homepage' => false,
            'html' => '',
            'css' => '',
            'components_json' => $tree,
            'seo' => ['en' => []],
        ])->assertStatus(422)
          ->assertJsonValidationErrors('components_json');
});

it('update rejects a tree with an unknown component type', function () {
    $page = BuilderPage::factory()->create(['type' => 'page', 'slug' => 'unknown-type']);
    $page->translations()->create(['locale' => 'en', 'title' => 'X', 'html' => '', 'css' => '']);
    $page->seo()->create(['locale' => 'en']);

    $tree = [[
        'type' => 'mp-section',
        'components' => [[
            'type' => 'mp-column',
            'components' => [['type' => 'mp-evil', 'components' => []]],
        ]],
    ]];

    $this->actingAs($this->admin)
        ->putJson(route('admin.builder.update', $page->id), [
            'locale' => 'en',
            'title' => 'X',
            'slug' => 'unknown-type',
            'status' => 'draft',
            'is_homepage' => false,
            'html' => '',
            'css' => '',
            'components_json' => $tree,
            'seo' => ['en' => []],
        ])->assertStatus(422)
          ->assertJsonValidationErrors('components_json');
});

it('update accepts an empty component tree (no components yet)', function () {
    $page = BuilderPage::factory()->create(['type' => 'page', 'slug' => 'empty-tree']);
    $page->translations()->create(['locale' => 'en', 'title' => 'X', 'html' => '', 'css' => '']);
    $page->seo()->create(['locale' => 'en']);

    $this->actingAs($this->admin)
        ->putJson(route('admin.builder.update', $page->id), [
            'locale' => 'en',
            'title' => 'X',
            'slug' => 'empty-tree',
            'status' => 'draft',
            'is_homepage' => false,
            'html' => '',
            'css' => '',
            'components_json' => [],
            'seo' => ['en' => []],
        ])->assertOk();
});
```

- [ ] **Step 6: Confirm 4 new tests fail**

```bash
php artisan test --filter=BuilderAdminTest
```

Expected: 4 new failures (validation not yet wired); the existing tests still pass.

- [ ] **Step 7: Wire validation into `BuilderPagesController@update`**

Open [app/Http/Controllers/Admin/BuilderPagesController.php](app/Http/Controllers/Admin/BuilderPagesController.php). Add the import at the top:

```php
use App\Support\WidgetRegistry;
```

Inside the `update()` method, find the existing `$data = $request->validate([...])` block. Replace it with a version that adds a custom rule for `components_json`:

```php
$data = $request->validate([
    'locale' => ['required', 'string', 'max:8'],
    'title' => ['required', 'string', 'max:255'],
    'slug' => [
        Rule::requiredIf(fn () => $page->type === BuilderPage::TYPE_PAGE),
        'nullable',
        'string',
        'max:255',
        'regex:/^[a-z0-9][a-z0-9-]*$/',
        Rule::unique('builder_pages', 'slug')->ignore($page->id),
    ],
    'status' => ['required', Rule::in([BuilderPage::STATUS_DRAFT, BuilderPage::STATUS_PUBLISHED])],
    'is_homepage' => ['sometimes', 'boolean'],
    'html' => ['nullable', 'string'],
    'css' => ['nullable', 'string'],
    'components_json' => [
        'nullable',
        'array',
        function (string $attribute, mixed $value, \Closure $fail) {
            if (! is_array($value)) {
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
    ],
    'styles_json' => ['nullable', 'array'],
    'seo' => ['sometimes', 'array'],
    'seo.*.meta_title' => ['nullable', 'string', 'max:255'],
    'seo.*.meta_description' => ['nullable', 'string'],
    'seo.*.meta_keywords' => ['nullable', 'string', 'max:255'],
    'seo.*.og_title' => ['nullable', 'string', 'max:255'],
    'seo.*.og_description' => ['nullable', 'string'],
    'seo.*.og_image' => ['nullable', 'string', 'max:1024'],
    'seo.*.canonical_url' => ['nullable', 'string', 'max:1024'],
    'seo.*.robots' => ['nullable', 'string', 'max:64'],
    'seo.*.schema_json' => ['nullable', 'array'],
]);
```

The new closure-rule for `components_json` calls `WidgetRegistry::hasInvalidRoots()` first (more specific error) and `unknownTypesIn()` second.

- [ ] **Step 8: Confirm all `BuilderAdminTest` tests pass**

```bash
php artisan test --filter=BuilderAdminTest
```

Expected: existing tests pass + 4 new tests pass.

- [ ] **Step 9: Confirm the full suite stays green**

```bash
php artisan test
```

Expected: 67 passing (57 prior + 6 Unit + 4 Feature).

**Stop here. The user will stage/commit.**

---

## Task 3: `mp-section` GrapesJS component type

**Files:**
- Create: `resources/js/builder/sections/section.js`
- Modify: `resources/js/builder.js`

This task registers the Section component type with all its props, drop rules, default style, and `toHTML()` output. After this task, you can manually inject a Section into the editor via the browser console — but the structure picker UI comes in Task 4 and Columns come in Task 5.

- [ ] **Step 1: Create `resources/js/builder/sections/section.js`**

```js
// mp-section — top-level layout container. Width: boxed | full. Holds mp-column children only.
// Drop rules: root or inside an mp-column (Inner Section). Never inside another mp-section directly.

const TAG_OPTIONS = ['section', 'header', 'footer', 'div', 'aside'];

export function registerSection(editor) {
    editor.DomComponents.addType('mp-section', {
        isComponent: (el) => el.tagName && el.classList?.contains('mp-sec'),

        model: {
            defaults: {
                tagName: 'section',
                name: 'Section',
                draggable: 'body, .mp-col',
                droppable: '.mp-col',
                attributes: {
                    class: 'mp-sec mp-sec--boxed',
                    'data-mp-widget': 'section',
                },
                props: {
                    width: 'boxed',
                    max_inner_width: 1200,
                    vertical_align: 'top',
                    min_height_mode: 'default',
                    min_height: 0,
                    html_tag: 'section',
                },
                components: [{
                    tagName: 'div',
                    attributes: { class: 'mp-sec__inner' },
                    selectable: false,
                    hoverable: false,
                    droppable: '.mp-col',
                    draggable: false,
                    components: [],
                }],
                'custom-name': 'Section',
                'style-default': {
                    padding: '80px 24px',
                },
            },

            init() {
                this.on('change:props', this.handlePropsChange);
            },

            handlePropsChange() {
                const props = this.get('props') || {};
                const cls = `mp-sec mp-sec--${props.width || 'boxed'}`;
                this.setAttributes({
                    ...this.getAttributes(),
                    class: cls,
                    'data-valign': props.vertical_align !== 'top' ? props.vertical_align : null,
                    'data-mp-widget': 'section',
                });

                if (TAG_OPTIONS.includes(props.html_tag)) {
                    this.set('tagName', props.html_tag);
                }

                // Sync inner max-width via CSS variable on the section element
                const innerWidth = parseInt(props.max_inner_width ?? 1200, 10);
                this.addStyle({ '--mp-sec-inner': `${innerWidth}px` });

                // Sync min-height
                if (props.min_height_mode === 'fixed' && props.min_height > 0) {
                    this.addStyle({ 'min-height': `${parseInt(props.min_height, 10)}px` });
                } else if (props.min_height_mode === 'screen') {
                    this.addStyle({ 'min-height': '100vh' });
                } else if (props.min_height_mode === 'fit') {
                    this.addStyle({ 'min-height': 'auto' });
                } else {
                    this.addStyle({ 'min-height': '' });
                }
            },
        },

        view: {
            // Default GrapesJS view is fine; we rely on CSS for layout.
        },
    });
}

export const SECTION_PROP_SCHEMA = {
    width: { type: 'select', options: ['boxed', 'full'], default: 'boxed' },
    max_inner_width: { type: 'number', min: 320, max: 2560, default: 1200 },
    vertical_align: { type: 'select', options: ['top', 'middle', 'bottom'], default: 'top' },
    min_height_mode: { type: 'select', options: ['default', 'fit', 'fixed', 'screen'], default: 'default' },
    min_height: { type: 'number', min: 0, max: 2000, default: 0 },
    html_tag: { type: 'select', options: TAG_OPTIONS, default: 'section' },
};
```

The exported `SECTION_PROP_SCHEMA` will drive the Content tab UI in Task 7 (style panel).

- [ ] **Step 2: Register in `builder.js`**

In [resources/js/builder.js](resources/js/builder.js), add the import near the existing imports:

```js
import { registerSection } from './builder/sections/section.js';
```

Right after the `grapesjs.init({...})` call returns the editor instance, but before `registerBlocks(editor)` (which Plan 6 removes), add:

```js
registerSection(editor);
```

Note: the existing `registerBlocks(editor)` line stays for now — Plan 5 doesn't delete the legacy blocks. Plan 6 will.

- [ ] **Step 3: Build assets**

```bash
npm run build
```

Expected: success.

- [ ] **Step 4: Manual smoke test**

```bash
php artisan serve
```

1. Open `/admin/login` and log in.
2. Click Edit on the Welcome page.
3. Open browser DevTools console. Run:

```js
window.gjsEditor.addComponents([{ type: 'mp-section' }]);
```

4. A new `<section class="mp-sec mp-sec--boxed" data-mp-widget="section">` appears at the bottom of the canvas, with an empty `<div class="mp-sec__inner">` inside. It has padding from the runtime CSS.
5. In the GrapesJS Layers panel (left), select the new "Section" node. In the right-side Selected toolbar, verify the component name reads "Section".
6. Run:

```js
window.gjsEditor.getSelected().set('props', { ...window.gjsEditor.getSelected().get('props'), width: 'full' });
```

Confirm the section's class flips to `mp-sec--full` and (per the runtime CSS) the inner `.mp-sec__inner` still has the boxed max-width of 1200.

Stop the server.

**Stop here. The user will stage/commit.**

---

## Task 4: Section structure picker UI

**Files:**
- Create: `resources/js/builder/sections/section-picker.js`
- Modify: `resources/js/builder.js`
- Modify: `resources/views/admin/builder/editor.blade.php` (add a "+ Section" button to the toolbar)

The picker lets the user click "+ Section" → see the 8 column-structure presets → click one → an `mp-section` with the chosen column count appears at the end of the page (or at the cursor — actually for Plan 5 we keep it simple: appends to end; positioning at cursor is Phase B/C).

This task creates Sections WITH the right number of empty `<div class="mp-col" data-mp-widget="column">` children, even though the actual `mp-column` component type isn't registered yet (that's Task 5). The columns render correctly thanks to the runtime CSS — they just don't have GrapesJS behavior yet.

After Task 5, opening a page that has these picker-created Sections will re-parse the column divs into proper `mp-column` components automatically via `isComponent`.

- [ ] **Step 1: Create `resources/js/builder/sections/section-picker.js`**

```js
// Section structure picker — a popover with 8 preset column layouts.
// Clicking a preset inserts a new mp-section with the right number of mp-col children.

export const STRUCTURE_PRESETS = [
    { id: 'one',      label: '1',             cols: [100] },
    { id: 'two',      label: '1/2 + 1/2',     cols: [50, 50] },
    { id: 'three',    label: '1/3 + 1/3 + 1/3', cols: [33.33, 33.33, 33.34] },
    { id: 'four',     label: '1/4 ×4',         cols: [25, 25, 25, 25] },
    { id: '13-23',    label: '1/3 + 2/3',     cols: [33.33, 66.67] },
    { id: '23-13',    label: '2/3 + 1/3',     cols: [66.67, 33.33] },
    { id: '14-12-14', label: '1/4 + 1/2 + 1/4', cols: [25, 50, 25] },
    { id: 'six',      label: '1/6 ×6',         cols: [16.66, 16.66, 16.66, 16.66, 16.66, 16.70] },
];

export function openSectionPicker(editor, anchorButton) {
    closeExistingPicker();

    const popover = document.createElement('div');
    popover.id = 'mp-section-picker';
    popover.className = 'mp-picker absolute z-50 bg-white border border-slate-200 rounded-md shadow-xl p-3 text-sm';
    popover.style.minWidth = '260px';

    const title = document.createElement('div');
    title.className = 'text-xs font-semibold text-slate-500 mb-2';
    title.textContent = 'Choose section structure';
    popover.appendChild(title);

    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-4 gap-2';
    popover.appendChild(grid);

    STRUCTURE_PRESETS.forEach((preset) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'flex flex-col items-center gap-1 p-2 rounded border border-slate-200 hover:border-slate-400 hover:bg-slate-50';

        // Mini preview — N flex children proportional to cols[]
        const preview = document.createElement('div');
        preview.style.cssText = 'display:flex;gap:2px;width:100%;height:24px;';
        preset.cols.forEach((w) => {
            const cell = document.createElement('div');
            cell.style.cssText = `flex-basis:${w}%;background:#3b82f6;border-radius:2px`;
            preview.appendChild(cell);
        });
        btn.appendChild(preview);

        const label = document.createElement('span');
        label.className = 'text-xs text-slate-700';
        label.textContent = preset.label;
        btn.appendChild(label);

        btn.addEventListener('click', () => {
            insertSection(editor, preset.cols);
            closeExistingPicker();
        });

        grid.appendChild(btn);
    });

    // Position the popover under the anchor
    const rect = anchorButton.getBoundingClientRect();
    document.body.appendChild(popover);
    const popRect = popover.getBoundingClientRect();
    popover.style.top = `${rect.bottom + window.scrollY + 4}px`;
    popover.style.left = `${rect.right + window.scrollX - popRect.width}px`;

    // Close on outside click / Escape
    setTimeout(() => {
        document.addEventListener('mousedown', onOutsideClick, true);
        document.addEventListener('keydown', onEscape, true);
    }, 0);

    function onOutsideClick(e) {
        if (popover.contains(e.target) || anchorButton.contains(e.target)) return;
        closeExistingPicker();
    }
    function onEscape(e) { if (e.key === 'Escape') closeExistingPicker(); }
    popover._cleanup = () => {
        document.removeEventListener('mousedown', onOutsideClick, true);
        document.removeEventListener('keydown', onEscape, true);
    };
}

function closeExistingPicker() {
    const existing = document.getElementById('mp-section-picker');
    if (existing) {
        existing._cleanup?.();
        existing.remove();
    }
}

function insertSection(editor, columnWidths) {
    const columns = columnWidths.map((widthPct) => ({
        tagName: 'div',
        attributes: {
            class: 'mp-col',
            'data-mp-widget': 'column',
            style: `flex-basis:${widthPct}%`,
        },
        // The `type: 'mp-column'` is set automatically by isComponent() once Task 5 runs.
        // For Plan 5 task 4 alone, these render as plain divs with .mp-col class.
        components: [],
    }));

    const sectionDef = {
        type: 'mp-section',
        components: [{
            tagName: 'div',
            attributes: { class: 'mp-sec__inner' },
            selectable: false,
            hoverable: false,
            droppable: '.mp-col',
            components: columns,
        }],
    };

    editor.addComponents([sectionDef]);
}
```

- [ ] **Step 2: Add the "+ Section" toolbar button to the editor view**

Open [resources/views/admin/builder/editor.blade.php](resources/views/admin/builder/editor.blade.php). Find the toolbar `<div class="ms-auto flex items-center gap-2">` block. Add a "+ Section" button to the left of `<span id="gjs-save-indicator">`:

```blade
<button id="gjs-add-section" type="button"
    class="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded font-semibold">
    + Section
</button>
```

- [ ] **Step 3: Wire the button in `builder.js`**

In [resources/js/builder.js](resources/js/builder.js), add the import:

```js
import { openSectionPicker } from './builder/sections/section-picker.js';
```

After the existing button handlers (gjs-save-draft, gjs-publish, gjs-locale), add:

```js
document.getElementById('gjs-add-section')?.addEventListener('click', (e) => {
    openSectionPicker(editor, e.currentTarget);
});
```

- [ ] **Step 4: Build + smoke test**

```bash
npm run build
php artisan serve
```

1. Open the editor.
2. Click "+ Section" in the top toolbar.
3. Popover appears with 8 preset thumbnails.
4. Click "1/3 + 2/3" → a new section with two columns (33.33% / 66.67%) appears at the bottom of the canvas.
5. Inspect the DOM in the canvas iframe — verify the section markup is:

```html
<section class="mp-sec mp-sec--boxed" data-mp-widget="section">
  <div class="mp-sec__inner">
    <div class="mp-col" data-mp-widget="column" style="flex-basis:33.33%"></div>
    <div class="mp-col" data-mp-widget="column" style="flex-basis:66.67%"></div>
  </div>
</section>
```

6. Click outside the popover → it closes. Click "+ Section" again → press Escape → it closes.

Stop the server.

**Stop here. The user will stage/commit.**

---

## Task 5: `mp-column` GrapesJS component type + drag-to-resize

**Files:**
- Create: `resources/js/builder/sections/column.js`
- Modify: `resources/js/builder.js`

This task registers the Column component type and adds the drag-to-resize behavior on adjacent columns. After this task, the empty columns from Task 4 are properly typed `mp-column` components — selectable, draggable, with props.

- [ ] **Step 1: Create `resources/js/builder/sections/column.js`**

```js
// mp-column — column inside an mp-section. Holds widgets or Inner Sections.

export function registerColumn(editor) {
    editor.DomComponents.addType('mp-column', {
        isComponent: (el) => el.tagName === 'DIV' && el.classList?.contains('mp-col'),

        model: {
            defaults: {
                tagName: 'div',
                name: 'Column',
                draggable: '.mp-sec__inner',
                droppable: '[data-mp-widget], .mp-sec',
                attributes: {
                    class: 'mp-col',
                    'data-mp-widget': 'column',
                },
                props: {
                    size_pct: 100,
                    vertical_align: 'top',
                    content_position: 'start',
                },
                'custom-name': 'Column',
            },

            init() {
                // Read size_pct from inline style if present (when loaded from saved JSON)
                const style = this.getStyle();
                if (style['flex-basis']) {
                    const pct = parseFloat(style['flex-basis']);
                    if (!isNaN(pct)) {
                        this.set('props', { ...(this.get('props') || {}), size_pct: pct });
                    }
                }
                this.on('change:props', this.handlePropsChange);
            },

            handlePropsChange() {
                const props = this.get('props') || {};
                this.addStyle({ 'flex-basis': `${props.size_pct}%` });
                this.setAttributes({
                    ...this.getAttributes(),
                    'data-content-pos': props.content_position !== 'start' ? props.content_position : null,
                    'data-valign': props.vertical_align !== 'top' ? props.vertical_align : null,
                    'data-mp-widget': 'column',
                });
            },
        },
    });

    enableColumnResize(editor);
}

// Drag-to-resize: hovering the left edge of a non-first column (the gap area) shows a col-resize cursor;
// dragging adjusts size_pct on this column AND the previous-sibling column (they trade percentage).
function enableColumnResize(editor) {
    let dragging = null; // { rightCol, leftCol, startX, startRightPct, startLeftPct, parentWidth }

    editor.on('load', () => {
        const canvasDoc = editor.Canvas.getDocument();
        const canvasBody = canvasDoc.body;

        canvasBody.addEventListener('mousedown', (e) => {
            // Only the bare ::before pseudo-element of .mp-col + .mp-col triggers col-resize.
            // We detect the hit by computing if the click is in the 6px-wide gap on the left of a non-first column.
            const target = e.target.closest('.mp-col');
            if (!target) return;

            const prev = target.previousElementSibling;
            if (!prev || !prev.classList.contains('mp-col')) return;

            const rect = target.getBoundingClientRect();
            const hitZone = 8; // px from left edge
            if (e.clientX - rect.left > hitZone) return;

            e.preventDefault();
            const inner = target.parentElement;
            const innerRect = inner.getBoundingClientRect();

            const rightComponent = editor.getWrapper().findType('mp-column').find(c => c.getEl() === target);
            const leftComponent  = editor.getWrapper().findType('mp-column').find(c => c.getEl() === prev);
            if (!rightComponent || !leftComponent) return;

            dragging = {
                rightCol: rightComponent,
                leftCol: leftComponent,
                startX: e.clientX,
                startRightPct: rightComponent.get('props').size_pct,
                startLeftPct: leftComponent.get('props').size_pct,
                parentWidth: innerRect.width,
            };

            canvasDoc.body.style.cursor = 'col-resize';
            canvasDoc.body.style.userSelect = 'none';
        });

        canvasBody.addEventListener('mousemove', (e) => {
            if (!dragging) return;
            const dxPct = ((e.clientX - dragging.startX) / dragging.parentWidth) * 100;
            const min = 8.33;
            const max = 91.67;

            const newLeft  = clamp(dragging.startLeftPct  + dxPct, min, max);
            const newRight = clamp(dragging.startRightPct - dxPct, min, max);

            dragging.leftCol.set('props',  { ...dragging.leftCol.get('props'),  size_pct: round2(newLeft) });
            dragging.rightCol.set('props', { ...dragging.rightCol.get('props'), size_pct: round2(newRight) });
        });

        const endDrag = () => {
            if (!dragging) return;
            dragging = null;
            const doc = editor.Canvas.getDocument();
            doc.body.style.cursor = '';
            doc.body.style.userSelect = '';
        };
        canvasBody.addEventListener('mouseup', endDrag);
        canvasBody.addEventListener('mouseleave', endDrag);
    });
}

function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
function round2(n) { return Math.round(n * 100) / 100; }
```

- [ ] **Step 2: Register in `builder.js`**

In [resources/js/builder.js](resources/js/builder.js), add the import:

```js
import { registerColumn } from './builder/sections/column.js';
```

Right after `registerSection(editor);` from Task 3, add:

```js
registerColumn(editor);
```

- [ ] **Step 3: Build + smoke test**

```bash
npm run build
php artisan serve
```

1. Open the editor.
2. Click "+ Section" → choose "1/3 + 2/3" → section appears with two columns.
3. In the Layers panel (left), expand the section → the two children should now appear as "Column" entries (not generic divs). Click one — its highlight overlay appears on canvas.
4. Hover near the left edge of the right column on the canvas — cursor changes to `col-resize` (the runtime CSS shows a faint blue strip there too).
5. Drag right by ~50px — both columns' widths update live. Release. Run in console:

```js
window.gjsEditor.getWrapper().findType('mp-column').map(c => c.get('props').size_pct)
```

Expected: two numbers that sum to ~100 and reflect the new split.

6. Try to drag a Section onto another Section's body (NOT inside a column) — GrapesJS should reject the drop (no drop indicator appears) because `mp-section` only accepts `.mp-col` as droppable.
7. Try to drag a Section into a Column (Inner Section case) — the drop indicator should appear, and on drop the section nests correctly. Run:

```js
window.gjsEditor.getWrapper().findType('mp-section').length
```

Expected: 2 (outer + inner).

Stop the server.

**Stop here. The user will stage/commit.**

---

## Task 6: Control primitives library

**Files:**
- Create: `resources/js/builder/controls/number-with-unit.js`
- Create: `resources/js/builder/controls/four-side-input.js`
- Create: `resources/js/builder/controls/color-picker.js`
- Create: `resources/js/builder/controls/preset-chips.js`
- Create: `resources/js/builder/controls/slider.js`
- Create: `resources/js/builder/controls/collapsible-group.js`

Six small factory functions, each returning an `HTMLElement` and exposing a tiny event-emitter interface (`on('change', fn)`). Used everywhere in the style panel (Task 7-9). Pure vanilla JS + Tailwind classes.

- [ ] **Step 1: Create `number-with-unit.js`**

```js
// numberWithUnit({ value, unit, units, min, max, step, onChange })
// Returns { el, get(), set({value, unit}) }

export function numberWithUnit({
    value = 0,
    unit = 'px',
    units = ['px', 'em', 'rem', '%'],
    min = 0,
    max = 999,
    step = 1,
    placeholder = '',
    onChange = () => {},
} = {}) {
    const el = document.createElement('div');
    el.className = 'flex items-center gap-1 w-full';

    const numInput = document.createElement('input');
    numInput.type = 'number';
    numInput.min = String(min);
    numInput.max = String(max);
    numInput.step = String(step);
    numInput.value = String(value);
    numInput.placeholder = placeholder;
    numInput.className = 'flex-1 min-w-0 px-2 py-1 text-xs border border-slate-300 rounded bg-white focus:border-blue-500 focus:outline-none';

    const unitSelect = document.createElement('select');
    unitSelect.className = 'text-xs border border-slate-300 rounded bg-white px-1 py-1 focus:border-blue-500 focus:outline-none';
    for (const u of units) {
        const opt = document.createElement('option');
        opt.value = u;
        opt.textContent = u;
        if (u === unit) opt.selected = true;
        unitSelect.appendChild(opt);
    }

    const fire = () => onChange({ value: parseFloat(numInput.value) || 0, unit: unitSelect.value });
    numInput.addEventListener('input', fire);
    unitSelect.addEventListener('change', fire);

    el.appendChild(numInput);
    el.appendChild(unitSelect);

    return {
        el,
        get: () => ({ value: parseFloat(numInput.value) || 0, unit: unitSelect.value }),
        set: ({ value: v, unit: u } = {}) => {
            if (v !== undefined) numInput.value = String(v);
            if (u !== undefined) unitSelect.value = u;
        },
    };
}
```

- [ ] **Step 2: Create `four-side-input.js`**

```js
import { numberWithUnit } from './number-with-unit.js';

// fourSideInput({ values: {top,right,bottom,left}, unit, units, linked, onChange })
// onChange receives { top, right, bottom, left, unit }

export function fourSideInput({
    values = { top: 0, right: 0, bottom: 0, left: 0 },
    unit = 'px',
    units = ['px', 'em', 'rem', '%'],
    min = 0,
    max = 999,
    linked = true,
    onChange = () => {},
} = {}) {
    const el = document.createElement('div');
    el.className = 'flex flex-col gap-1';

    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-[1fr_1fr_24px] gap-1 items-center';
    el.appendChild(grid);

    const linkBtn = document.createElement('button');
    linkBtn.type = 'button';
    linkBtn.className = 'text-xs border border-slate-300 rounded h-7 grid place-items-center hover:bg-slate-50';
    linkBtn.title = linked ? 'Unlink sides' : 'Link sides';
    linkBtn.textContent = linked ? '\u{1F517}' : '\u{1F494}';
    linkBtn.style.gridRow = '1 / span 2';
    linkBtn.style.gridColumn = '3';

    const inputs = {};
    const sides = ['top', 'right', 'bottom', 'left'];
    const positions = { top: '1 / 1', right: '1 / 2', bottom: '2 / 1', left: '2 / 2' };

    sides.forEach((side) => {
        const wrap = document.createElement('div');
        wrap.style.gridArea = positions[side];
        const labelRow = document.createElement('div');
        labelRow.className = 'text-[10px] uppercase tracking-wide text-slate-500';
        labelRow.textContent = side;
        wrap.appendChild(labelRow);

        const ctrl = numberWithUnit({
            value: values[side] ?? 0,
            unit,
            units,
            min,
            max,
            onChange: ({ value, unit: u }) => {
                if (linked) {
                    sides.forEach((s) => inputs[s].set({ value, unit: u }));
                }
                emit();
            },
        });
        wrap.appendChild(ctrl.el);
        grid.appendChild(wrap);
        inputs[side] = ctrl;
    });

    grid.appendChild(linkBtn);

    linkBtn.addEventListener('click', () => {
        linked = !linked;
        linkBtn.textContent = linked ? '\u{1F517}' : '\u{1F494}';
        linkBtn.title = linked ? 'Unlink sides' : 'Link sides';
        if (linked) {
            // When re-linking, mirror the top value to all sides
            const topVal = inputs.top.get();
            sides.forEach((s) => inputs[s].set({ value: topVal.value, unit: topVal.unit }));
            emit();
        }
    });

    function emit() {
        const top = inputs.top.get();
        onChange({
            top: top.value,
            right: inputs.right.get().value,
            bottom: inputs.bottom.get().value,
            left: inputs.left.get().value,
            unit: top.unit, // unit follows top for simplicity in Phase A
        });
    }

    return {
        el,
        get: () => ({
            top: inputs.top.get().value,
            right: inputs.right.get().value,
            bottom: inputs.bottom.get().value,
            left: inputs.left.get().value,
            unit: inputs.top.get().unit,
        }),
        set: ({ top, right, bottom, left, unit: u }) => {
            if (top    !== undefined) inputs.top.set({ value: top,    unit: u });
            if (right  !== undefined) inputs.right.set({ value: right,  unit: u });
            if (bottom !== undefined) inputs.bottom.set({ value: bottom, unit: u });
            if (left   !== undefined) inputs.left.set({ value: left,    unit: u });
        },
    };
}
```

- [ ] **Step 3: Create `color-picker.js`**

```js
// Wraps the existing Coloris init from Plan 2.
// Coloris is initialized once in builder.js (kept from existing builder/coloris-init.js).
// This factory just returns an <input data-coloris> that the global Coloris instance attaches to.

export function colorPicker({ value = '#000000', onChange = () => {} } = {}) {
    const el = document.createElement('div');
    el.className = 'flex items-center gap-2';

    const swatch = document.createElement('span');
    swatch.className = 'w-6 h-6 rounded border border-slate-300 shrink-0';
    swatch.style.background = value;

    const input = document.createElement('input');
    input.type = 'text';
    input.setAttribute('data-coloris', '');
    input.value = value;
    input.className = 'flex-1 min-w-0 px-2 py-1 text-xs border border-slate-300 rounded bg-white font-mono focus:border-blue-500 focus:outline-none';

    input.addEventListener('input', () => {
        swatch.style.background = input.value;
        onChange(input.value);
    });

    el.appendChild(swatch);
    el.appendChild(input);

    return {
        el,
        get: () => input.value,
        set: (v) => { input.value = v; swatch.style.background = v; },
    };
}
```

- [ ] **Step 4: Create `preset-chips.js`**

```js
// presetChips({ options: [{value, label}], value, onChange })

export function presetChips({ options = [], value = null, onChange = () => {} } = {}) {
    const el = document.createElement('div');
    el.className = 'flex gap-1 flex-wrap';

    const buttons = new Map();
    let current = value;

    options.forEach((opt) => {
        const o = typeof opt === 'string' ? { value: opt, label: opt } : opt;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.dataset.value = o.value;
        btn.className = 'px-2 py-1 text-xs border border-slate-300 rounded hover:bg-slate-50 transition';
        btn.textContent = o.label;
        btn.addEventListener('click', () => {
            current = o.value;
            refresh();
            onChange(o.value);
        });
        buttons.set(o.value, btn);
        el.appendChild(btn);
    });

    function refresh() {
        buttons.forEach((btn, val) => {
            if (val === current) {
                btn.classList.add('bg-blue-500', 'text-white', 'border-blue-500');
                btn.classList.remove('bg-white', 'text-slate-700');
            } else {
                btn.classList.remove('bg-blue-500', 'text-white', 'border-blue-500');
                btn.classList.add('bg-white', 'text-slate-700');
            }
        });
    }
    refresh();

    return {
        el,
        get: () => current,
        set: (v) => { current = v; refresh(); },
    };
}
```

- [ ] **Step 5: Create `slider.js`**

```js
// slider({ min, max, step, value, onChange })

export function slider({ min = 0, max = 100, step = 1, value = 0, onChange = () => {} } = {}) {
    const el = document.createElement('div');
    el.className = 'flex items-center gap-2';

    const input = document.createElement('input');
    input.type = 'range';
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(value);
    input.className = 'flex-1 min-w-0';

    const readout = document.createElement('span');
    readout.className = 'text-xs text-slate-700 w-10 text-right tabular-nums';
    readout.textContent = String(value);

    input.addEventListener('input', () => {
        readout.textContent = input.value;
        onChange(parseFloat(input.value));
    });

    el.appendChild(input);
    el.appendChild(readout);

    return {
        el,
        get: () => parseFloat(input.value),
        set: (v) => { input.value = String(v); readout.textContent = String(v); },
    };
}
```

- [ ] **Step 6: Create `collapsible-group.js`**

```js
// collapsibleGroup({ title, defaultOpen, children: HTMLElement[] })

export function collapsibleGroup({ title = 'Group', defaultOpen = true, children = [] } = {}) {
    const el = document.createElement('div');
    el.className = 'border-b border-slate-200';

    const header = document.createElement('button');
    header.type = 'button';
    header.className = 'w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50';

    const titleEl = document.createElement('span');
    titleEl.textContent = title;
    header.appendChild(titleEl);

    const chevron = document.createElement('span');
    chevron.className = 'text-slate-400 transition-transform';
    chevron.textContent = '▾';
    header.appendChild(chevron);

    const body = document.createElement('div');
    body.className = 'px-3 pb-3 space-y-2';

    let isOpen = defaultOpen;
    function refresh() {
        body.style.display = isOpen ? '' : 'none';
        chevron.style.transform = isOpen ? '' : 'rotate(-90deg)';
    }
    refresh();

    header.addEventListener('click', () => { isOpen = !isOpen; refresh(); });

    children.forEach((c) => body.appendChild(c));

    el.appendChild(header);
    el.appendChild(body);

    return { el, addChild: (c) => body.appendChild(c), setOpen: (b) => { isOpen = b; refresh(); } };
}
```

- [ ] **Step 7: Sanity build**

```bash
npm run build
```

Expected: success (no JS errors).

No smoke test in this task — the controls aren't wired into any UI yet (that's Task 7+). The build success confirms the modules parse.

**Stop here. The user will stage/commit.**

---

## Task 7: Style panel shell — Content / Style / Advanced tabs

**Files:**
- Create: `resources/js/builder/style-panel/index.js`
- Modify: `resources/views/admin/builder/editor.blade.php` (add the mount point + hide GrapesJS's default style manager)
- Modify: `resources/js/builder.js` (mount the panel + wire selection events)

After this task, clicking any component in the canvas shows our custom panel on the right (Content / Style / Advanced tabs) with placeholder content saying "Style controls for {type} coming next." Task 8-9 fill in the Style tab groups.

- [ ] **Step 1: Reserve the mount point in the editor view**

Open [resources/views/admin/builder/editor.blade.php](resources/views/admin/builder/editor.blade.php). Find the `<div id="gjs" ...>` element. Replace its parent flex container so the editor sits left, our panel sits right.

The current structure is roughly:

```blade
<div class="-m-6 h-screen flex flex-col">
    <div class="bg-white border-b px-4 py-2 ...">...toolbar...</div>
    <div id="gjs" class="flex-1" data-config='@json($config)'></div>
</div>
```

Change to:

```blade
<div class="-m-6 h-screen flex flex-col">
    <div class="bg-white border-b px-4 py-2 ...">...toolbar (unchanged)...</div>
    <div class="flex-1 flex min-h-0">
        <div id="gjs" class="flex-1 min-w-0" data-config='@json($config)'></div>
        <aside id="mp-style-panel" class="w-80 shrink-0 bg-slate-50 border-l border-slate-200 overflow-y-auto">
            <div class="p-4 text-xs text-slate-500" id="mp-panel-empty">
                Select an element on the canvas to edit its style.
            </div>
        </aside>
    </div>
</div>
```

- [ ] **Step 2: Hide GrapesJS's default right panels via CSS**

GrapesJS renders its own right-side panel container (`.gjs-pn-views-container`, `.gjs-pn-views`). We don't want those — our `<aside>` replaces them.

Add this small style block at the bottom of [resources/views/admin/builder/editor.blade.php](resources/views/admin/builder/editor.blade.php) just before `@endsection`:

```blade
<style>
    /* Hide GrapesJS default right panel + views so our custom panel is the only one */
    .gjs-pn-views-container,
    .gjs-pn-views,
    .gjs-pn-options {
        display: none !important;
    }
    /* Reclaim the space they used to occupy */
    .gjs-cv-canvas {
        width: 100% !important;
        right: 0 !important;
    }
</style>
```

- [ ] **Step 3: Create the panel module**

Create `resources/js/builder/style-panel/index.js`:

```js
// Custom style panel — three tabs (Content / Style / Advanced) mounted in #mp-style-panel.
// Renders for the currently selected GrapesJS component.

const TAB_DEFS = [
    { id: 'content',  label: 'Content' },
    { id: 'style',    label: 'Style' },
    { id: 'advanced', label: 'Advanced' },
];

let groupRegistry = {
    content: {},   // keyed by component type (e.g. 'mp-section')
    style:   [],   // array of style-group renderers shared by all components
    advanced: [],  // array of advanced-group renderers
};

export function mountStylePanel(editor, rootEl) {
    if (!rootEl) return;

    let currentTab = 'style';
    let currentComponent = null;

    function render() {
        rootEl.innerHTML = '';

        if (!currentComponent) {
            const empty = document.createElement('div');
            empty.className = 'p-4 text-xs text-slate-500';
            empty.textContent = 'Select an element on the canvas to edit its style.';
            rootEl.appendChild(empty);
            return;
        }

        const header = makeHeader(currentComponent);
        rootEl.appendChild(header);

        const tabs = makeTabs(currentTab, (tabId) => { currentTab = tabId; render(); });
        rootEl.appendChild(tabs);

        const body = document.createElement('div');
        body.className = 'pb-6';
        rootEl.appendChild(body);

        renderTabBody(body, currentTab, currentComponent, editor);
    }

    editor.on('component:selected', (component) => {
        currentComponent = component;
        render();
    });
    editor.on('component:deselected', () => {
        currentComponent = null;
        render();
    });

    render();
}

function makeHeader(component) {
    const wrap = document.createElement('div');
    wrap.className = 'px-3 py-2 border-b border-slate-200 bg-white';
    const name = document.createElement('div');
    name.className = 'text-xs font-semibold text-slate-700';
    name.textContent = component.get('name') || component.get('type');
    wrap.appendChild(name);
    const typeBadge = document.createElement('div');
    typeBadge.className = 'text-[10px] uppercase tracking-wide text-slate-400 font-mono';
    typeBadge.textContent = component.get('type');
    wrap.appendChild(typeBadge);
    return wrap;
}

function makeTabs(activeTab, onTab) {
    const nav = document.createElement('nav');
    nav.className = 'flex border-b border-slate-200 bg-white';
    TAB_DEFS.forEach(({ id, label }) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'flex-1 px-3 py-2 text-xs font-medium border-b-2 transition ' +
            (id === activeTab
                ? 'border-blue-500 text-blue-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50');
        btn.textContent = label;
        btn.addEventListener('click', () => onTab(id));
        nav.appendChild(btn);
    });
    return nav;
}

function renderTabBody(body, tabId, component, editor) {
    if (tabId === 'content') {
        const reg = groupRegistry.content[component.get('type')];
        if (typeof reg === 'function') {
            body.appendChild(reg(component, editor));
        } else {
            body.appendChild(placeholder(`No Content controls for ${component.get('type')} in Plan 5.`));
        }
    } else if (tabId === 'style') {
        if (groupRegistry.style.length === 0) {
            body.appendChild(placeholder('Style groups not registered yet (Plan 5 tasks 8-9 add them).'));
            return;
        }
        groupRegistry.style.forEach((renderer) => body.appendChild(renderer(component, editor)));
    } else if (tabId === 'advanced') {
        if (groupRegistry.advanced.length === 0) {
            body.appendChild(placeholder('Advanced controls not registered yet (Plan 5 task 9 adds them).'));
            return;
        }
        groupRegistry.advanced.forEach((renderer) => body.appendChild(renderer(component, editor)));
    }
}

function placeholder(text) {
    const d = document.createElement('div');
    d.className = 'p-4 text-xs text-slate-400';
    d.textContent = text;
    return d;
}

// Public registration API — used by groups/typography.js, groups/background.js, etc.
export function registerStyleGroup(renderer) {
    groupRegistry.style.push(renderer);
}
export function registerAdvancedGroup(renderer) {
    groupRegistry.advanced.push(renderer);
}
export function registerContentGroup(componentType, renderer) {
    groupRegistry.content[componentType] = renderer;
}
```

- [ ] **Step 4: Mount the panel in `builder.js`**

In [resources/js/builder.js](resources/js/builder.js), add the import:

```js
import { mountStylePanel } from './builder/style-panel/index.js';
```

After `registerColumn(editor);` (from Task 5), add:

```js
mountStylePanel(editor, document.getElementById('mp-style-panel'));
```

- [ ] **Step 5: Build + smoke test**

```bash
npm run build
php artisan serve
```

1. Open the editor.
2. The right `<aside>` panel shows "Select an element on the canvas to edit its style."
3. Click "+ Section" → choose any preset → section appears.
4. Click the section on the canvas. Panel updates:
    - Header: "Section" + "mp-section"
    - Tabs: Content / Style / Advanced
    - "Style" tab is active by default; body says "Style groups not registered yet..."
5. Click a Column → header changes to "Column" + "mp-column".
6. Click off (deselect) → panel returns to empty state.
7. Switch to the Content tab → "No Content controls for mp-section in Plan 5."
8. Confirm GrapesJS's old right panel is gone (no leftover `.gjs-pn-views-container` visible).

Stop the server.

**Stop here. The user will stage/commit.**

---

## Task 8: Style groups — Typography + Background

**Files:**
- Create: `resources/js/builder/style-panel/groups/typography.js`
- Create: `resources/js/builder/style-panel/groups/background.js`
- Modify: `resources/js/builder.js` (register the two groups)

After this task, selecting any element and going to the Style tab shows Typography and Background collapsible groups with working controls. Changes immediately apply to the canvas via `component.addStyle()`.

- [ ] **Step 1: Create `groups/typography.js`**

```js
import { numberWithUnit } from '../../controls/number-with-unit.js';
import { colorPicker } from '../../controls/color-picker.js';
import { presetChips } from '../../controls/preset-chips.js';
import { collapsibleGroup } from '../../controls/collapsible-group.js';

const FONT_FAMILIES = [
    { value: 'inherit', label: 'Inherit' },
    { value: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', label: 'System' },
    { value: 'Inter, sans-serif', label: 'Inter' },
    { value: 'Georgia, serif', label: 'Serif' },
    { value: '"Courier New", monospace', label: 'Mono' },
];

const WEIGHTS = ['300', '400', '500', '600', '700', '800', '900'];
const ALIGNS = [
    { value: 'left',    label: 'L' },
    { value: 'center',  label: 'C' },
    { value: 'right',   label: 'R' },
    { value: 'justify', label: 'J' },
];
const TRANSFORMS = [
    { value: 'none',       label: 'Aa' },
    { value: 'uppercase',  label: 'AA' },
    { value: 'lowercase',  label: 'aa' },
    { value: 'capitalize', label: 'Aa.' },
];

export function typographyGroup(component) {
    const style = component.getStyle();

    // Font family
    const fontFamilySelect = document.createElement('select');
    fontFamilySelect.className = 'w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white';
    FONT_FAMILIES.forEach((f) => {
        const opt = document.createElement('option');
        opt.value = f.value;
        opt.textContent = f.label;
        if (style['font-family'] === f.value) opt.selected = true;
        fontFamilySelect.appendChild(opt);
    });
    fontFamilySelect.addEventListener('change', () => {
        component.addStyle({ 'font-family': fontFamilySelect.value });
    });

    // Font size
    const fontSize = numberWithUnit({
        value: parseFloat(style['font-size']) || 16,
        unit: extractUnit(style['font-size']) || 'px',
        units: ['px', 'em', 'rem', '%'],
        onChange: ({ value, unit }) => component.addStyle({ 'font-size': `${value}${unit}` }),
    });

    // Font weight
    const weight = presetChips({
        options: WEIGHTS,
        value: style['font-weight'] || '400',
        onChange: (v) => component.addStyle({ 'font-weight': v }),
    });

    // Line height
    const lineHeight = numberWithUnit({
        value: parseFloat(style['line-height']) || 1.5,
        unit: extractUnit(style['line-height']) || '',
        units: ['', 'px', 'em', 'rem', '%'],
        min: 0,
        step: 0.1,
        onChange: ({ value, unit }) => component.addStyle({ 'line-height': unit ? `${value}${unit}` : String(value) }),
    });

    // Letter spacing
    const letterSpacing = numberWithUnit({
        value: parseFloat(style['letter-spacing']) || 0,
        unit: extractUnit(style['letter-spacing']) || 'px',
        units: ['px', 'em'],
        min: -10,
        max: 30,
        step: 0.1,
        onChange: ({ value, unit }) => component.addStyle({ 'letter-spacing': `${value}${unit}` }),
    });

    // Alignment
    const align = presetChips({
        options: ALIGNS,
        value: style['text-align'] || 'left',
        onChange: (v) => component.addStyle({ 'text-align': v }),
    });

    // Transform
    const transform = presetChips({
        options: TRANSFORMS,
        value: style['text-transform'] || 'none',
        onChange: (v) => component.addStyle({ 'text-transform': v }),
    });

    // Color
    const color = colorPicker({
        value: style.color || '#0f172a',
        onChange: (v) => component.addStyle({ color: v }),
    });

    const body = document.createElement('div');
    body.className = 'space-y-3 text-xs';
    body.appendChild(row('Family', fontFamilySelect));
    body.appendChild(row('Size', fontSize.el));
    body.appendChild(row('Weight', weight.el));
    body.appendChild(row('Line height', lineHeight.el));
    body.appendChild(row('Letter spacing', letterSpacing.el));
    body.appendChild(row('Align', align.el));
    body.appendChild(row('Transform', transform.el));
    body.appendChild(row('Color', color.el));

    return collapsibleGroup({ title: 'Typography', defaultOpen: true, children: [body] }).el;
}

function row(label, control) {
    const r = document.createElement('div');
    r.className = 'flex flex-col gap-1';
    const lbl = document.createElement('label');
    lbl.className = 'text-[10px] uppercase tracking-wide text-slate-500';
    lbl.textContent = label;
    r.appendChild(lbl);
    r.appendChild(control);
    return r;
}

function extractUnit(cssValue) {
    if (!cssValue || typeof cssValue !== 'string') return null;
    const match = cssValue.match(/[a-z%]+$/i);
    return match ? match[0] : null;
}
```

- [ ] **Step 2: Create `groups/background.js`**

```js
import { colorPicker } from '../../controls/color-picker.js';
import { presetChips } from '../../controls/preset-chips.js';
import { collapsibleGroup } from '../../controls/collapsible-group.js';
import { slider } from '../../controls/slider.js';

const BG_TYPES = [
    { value: 'none',     label: 'None' },
    { value: 'color',    label: 'Color' },
    { value: 'gradient', label: 'Gradient' },
    { value: 'image',    label: 'Image' },
];

export function backgroundGroup(component) {
    const style = component.getStyle();

    const typeChips = presetChips({
        options: BG_TYPES,
        value: detectBgType(style),
        onChange: (v) => { applyBgType(component, v); rerenderBody(); },
    });

    const body = document.createElement('div');
    body.className = 'space-y-3 text-xs';

    const dynamicArea = document.createElement('div');
    dynamicArea.className = 'space-y-3';

    body.appendChild(row('Type', typeChips.el));
    body.appendChild(dynamicArea);

    function rerenderBody() {
        dynamicArea.innerHTML = '';
        const type = typeChips.get();
        if (type === 'color') {
            const c = colorPicker({
                value: style['background-color'] || '#ffffff',
                onChange: (v) => component.addStyle({ 'background-color': v, 'background-image': '' }),
            });
            dynamicArea.appendChild(row('Color', c.el));
        } else if (type === 'gradient') {
            const stop1 = colorPicker({
                value: '#3b82f6',
                onChange: () => updateGradient(),
            });
            const stop2 = colorPicker({
                value: '#1e293b',
                onChange: () => updateGradient(),
            });
            const angle = slider({
                min: 0, max: 360, step: 5, value: 135,
                onChange: () => updateGradient(),
            });
            dynamicArea.appendChild(row('Stop 1', stop1.el));
            dynamicArea.appendChild(row('Stop 2', stop2.el));
            dynamicArea.appendChild(row('Angle', angle.el));
            function updateGradient() {
                const grad = `linear-gradient(${angle.get()}deg, ${stop1.get()}, ${stop2.get()})`;
                component.addStyle({ 'background-image': grad, 'background-color': '' });
            }
            updateGradient();
        } else if (type === 'image') {
            const url = document.createElement('input');
            url.type = 'text';
            url.placeholder = '/storage/builder-assets/...';
            url.className = 'w-full px-2 py-1 text-xs border border-slate-300 rounded';
            url.value = extractImageUrl(style['background-image']) || '';
            url.addEventListener('input', () => {
                component.addStyle({ 'background-image': url.value ? `url(${url.value})` : '' });
            });
            dynamicArea.appendChild(row('Image URL', url));

            const size = presetChips({
                options: [
                    { value: 'cover', label: 'Cover' },
                    { value: 'contain', label: 'Contain' },
                    { value: 'auto', label: 'Auto' },
                ],
                value: style['background-size'] || 'cover',
                onChange: (v) => component.addStyle({ 'background-size': v }),
            });
            dynamicArea.appendChild(row('Size', size.el));

            const repeat = presetChips({
                options: [
                    { value: 'no-repeat', label: 'No' },
                    { value: 'repeat',    label: 'Tile' },
                    { value: 'repeat-x',  label: 'X' },
                    { value: 'repeat-y',  label: 'Y' },
                ],
                value: style['background-repeat'] || 'no-repeat',
                onChange: (v) => component.addStyle({ 'background-repeat': v }),
            });
            dynamicArea.appendChild(row('Repeat', repeat.el));
        } else {
            component.addStyle({ 'background-color': '', 'background-image': '' });
        }
    }
    rerenderBody();

    return collapsibleGroup({ title: 'Background', defaultOpen: false, children: [body] }).el;
}

function row(label, control) {
    const r = document.createElement('div');
    r.className = 'flex flex-col gap-1';
    const lbl = document.createElement('label');
    lbl.className = 'text-[10px] uppercase tracking-wide text-slate-500';
    lbl.textContent = label;
    r.appendChild(lbl);
    r.appendChild(control);
    return r;
}

function detectBgType(style) {
    if (!style['background-color'] && !style['background-image']) return 'none';
    if (style['background-image']?.startsWith('linear-gradient')) return 'gradient';
    if (style['background-image']?.startsWith('url(')) return 'image';
    if (style['background-color']) return 'color';
    return 'none';
}

function applyBgType(component, type) {
    if (type === 'none') {
        component.addStyle({ 'background-color': '', 'background-image': '' });
    }
    // Other types apply their own values on first control change
}

function extractImageUrl(bgImage) {
    if (!bgImage || typeof bgImage !== 'string') return null;
    const match = bgImage.match(/url\(\s*['"]?([^'")]+)['"]?\s*\)/);
    return match ? match[1] : null;
}
```

- [ ] **Step 3: Register the groups in `builder.js`**

In [resources/js/builder.js](resources/js/builder.js), add the imports:

```js
import { registerStyleGroup } from './builder/style-panel/index.js';
import { typographyGroup } from './builder/style-panel/groups/typography.js';
import { backgroundGroup } from './builder/style-panel/groups/background.js';
```

After `mountStylePanel(editor, ...)` from Task 7, add:

```js
registerStyleGroup(typographyGroup);
registerStyleGroup(backgroundGroup);
```

(Order matters — Typography is the first group shown in the Style tab.)

- [ ] **Step 4: Build + smoke test**

```bash
npm run build
php artisan serve
```

1. Open the editor → click "+ Section" → choose any preset → click the section.
2. In the Style tab on the right, you see two collapsible groups: "Typography" (open) and "Background" (closed).
3. Open Background → change Type to "Color" → click the Coloris swatch → pick a dark color → the section's background turns that color immediately. The change is reflected in `editor.getCss()`.
4. Change Type to "Gradient" → adjust stops + angle → the section's background updates as a linear gradient.
5. Switch back to "None" → background clears.
6. In Typography, change font size from 16 to 32 → no visible change (the section has no text). Now click a Column (still empty), and verify the panel shows Typography for it too (controls apply per-element).
7. Save Draft → reload editor → confirm the saved styles are restored (open Network → look at the response of `update` PUT, then confirm the loaded `styles_json` includes the rules you set).

Stop the server.

**Stop here. The user will stage/commit.**

---

## Task 9: Style groups — Border, Shadow, Spacing, Sizing, Layout + Advanced tab

**Files:**
- Create: `resources/js/builder/style-panel/groups/border.js`
- Create: `resources/js/builder/style-panel/groups/shadow.js`
- Create: `resources/js/builder/style-panel/groups/spacing.js`
- Create: `resources/js/builder/style-panel/groups/sizing.js`
- Create: `resources/js/builder/style-panel/groups/layout.js`
- Modify: `resources/js/builder.js` (register all five + simple Advanced tab content)

The final task of Plan 5. After it, every Style tab has 6 groups + a useful Advanced tab. Plan 6 builds widgets that consume this panel.

- [ ] **Step 1: Create `groups/border.js`**

```js
import { numberWithUnit } from '../../controls/number-with-unit.js';
import { colorPicker } from '../../controls/color-picker.js';
import { presetChips } from '../../controls/preset-chips.js';
import { fourSideInput } from '../../controls/four-side-input.js';
import { collapsibleGroup } from '../../controls/collapsible-group.js';

const STYLES = [
    { value: 'none',   label: 'None' },
    { value: 'solid',  label: 'Solid' },
    { value: 'dashed', label: 'Dash' },
    { value: 'dotted', label: 'Dot' },
    { value: 'double', label: 'Dbl' },
];

export function borderGroup(component) {
    const style = component.getStyle();

    const styleChips = presetChips({
        options: STYLES,
        value: style['border-style'] || 'none',
        onChange: (v) => component.addStyle({ 'border-style': v }),
    });

    const width = fourSideInput({
        values: {
            top:    parseFloat(style['border-top-width'])    || parseFloat(style['border-width']) || 0,
            right:  parseFloat(style['border-right-width'])  || parseFloat(style['border-width']) || 0,
            bottom: parseFloat(style['border-bottom-width']) || parseFloat(style['border-width']) || 0,
            left:   parseFloat(style['border-left-width'])   || parseFloat(style['border-width']) || 0,
        },
        unit: 'px',
        units: ['px'],
        max: 50,
        linked: true,
        onChange: ({ top, right, bottom, left }) => component.addStyle({
            'border-top-width':    `${top}px`,
            'border-right-width':  `${right}px`,
            'border-bottom-width': `${bottom}px`,
            'border-left-width':   `${left}px`,
        }),
    });

    const color = colorPicker({
        value: style['border-color'] || '#cbd5e1',
        onChange: (v) => component.addStyle({ 'border-color': v }),
    });

    const radius = fourSideInput({
        values: {
            top:    parseFloat(style['border-top-left-radius'])     || parseFloat(style['border-radius']) || 0,
            right:  parseFloat(style['border-top-right-radius'])    || parseFloat(style['border-radius']) || 0,
            bottom: parseFloat(style['border-bottom-right-radius']) || parseFloat(style['border-radius']) || 0,
            left:   parseFloat(style['border-bottom-left-radius'])  || parseFloat(style['border-radius']) || 0,
        },
        unit: 'px',
        units: ['px', '%'],
        max: 200,
        linked: true,
        onChange: ({ top, right, bottom, left, unit }) => component.addStyle({
            'border-top-left-radius':     `${top}${unit}`,
            'border-top-right-radius':    `${right}${unit}`,
            'border-bottom-right-radius': `${bottom}${unit}`,
            'border-bottom-left-radius':  `${left}${unit}`,
        }),
    });

    const body = document.createElement('div');
    body.className = 'space-y-3 text-xs';
    body.appendChild(row('Style', styleChips.el));
    body.appendChild(row('Width (T/R/B/L)', width.el));
    body.appendChild(row('Color', color.el));
    body.appendChild(row('Radius (TL/TR/BR/BL)', radius.el));

    return collapsibleGroup({ title: 'Border', defaultOpen: false, children: [body] }).el;
}

function row(label, control) {
    const r = document.createElement('div');
    r.className = 'flex flex-col gap-1';
    const lbl = document.createElement('label');
    lbl.className = 'text-[10px] uppercase tracking-wide text-slate-500';
    lbl.textContent = label;
    r.appendChild(lbl);
    r.appendChild(control);
    return r;
}
```

- [ ] **Step 2: Create `groups/shadow.js`**

```js
import { numberWithUnit } from '../../controls/number-with-unit.js';
import { colorPicker } from '../../controls/color-picker.js';
import { presetChips } from '../../controls/preset-chips.js';
import { collapsibleGroup } from '../../controls/collapsible-group.js';

const PRESETS = [
    { value: 'none', label: 'None', css: 'none' },
    { value: 'sm',   label: 'SM',   css: '0 1px 2px rgba(15,23,42,0.08)' },
    { value: 'md',   label: 'MD',   css: '0 4px 6px rgba(15,23,42,0.10)' },
    { value: 'lg',   label: 'LG',   css: '0 10px 15px rgba(15,23,42,0.12)' },
    { value: 'xl',   label: 'XL',   css: '0 20px 25px rgba(15,23,42,0.16)' },
    { value: '2xl',  label: '2XL',  css: '0 25px 50px rgba(15,23,42,0.25)' },
    { value: 'custom', label: 'Custom', css: null },
];

export function shadowGroup(component) {
    const style = component.getStyle();
    const initial = matchPreset(style['box-shadow']) || 'custom';

    const chips = presetChips({
        options: PRESETS,
        value: initial,
        onChange: (v) => {
            const preset = PRESETS.find(p => p.value === v);
            if (preset && preset.css !== null) {
                component.addStyle({ 'box-shadow': preset.css });
                custom.style.display = 'none';
            } else {
                custom.style.display = '';
                emitCustom();
            }
        },
    });

    const custom = document.createElement('div');
    custom.className = 'space-y-2';
    custom.style.display = initial === 'custom' ? '' : 'none';

    const x = numberWithUnit({ value: 0, unit: 'px', units: ['px'], min: -100, max: 100, onChange: emitCustom });
    const y = numberWithUnit({ value: 4, unit: 'px', units: ['px'], min: -100, max: 100, onChange: emitCustom });
    const blur   = numberWithUnit({ value: 8, unit: 'px', units: ['px'], min: 0, max: 200, onChange: emitCustom });
    const spread = numberWithUnit({ value: 0, unit: 'px', units: ['px'], min: -100, max: 100, onChange: emitCustom });
    const color  = colorPicker({ value: '#0f172a26', onChange: emitCustom });
    const insetChips = presetChips({
        options: [{ value: 'outer', label: 'Outer' }, { value: 'inset', label: 'Inset' }],
        value: 'outer',
        onChange: emitCustom,
    });

    custom.appendChild(row('X', x.el));
    custom.appendChild(row('Y', y.el));
    custom.appendChild(row('Blur', blur.el));
    custom.appendChild(row('Spread', spread.el));
    custom.appendChild(row('Color', color.el));
    custom.appendChild(row('Type', insetChips.el));

    function emitCustom() {
        const prefix = insetChips.get() === 'inset' ? 'inset ' : '';
        component.addStyle({
            'box-shadow': `${prefix}${x.get().value}px ${y.get().value}px ${blur.get().value}px ${spread.get().value}px ${color.get()}`,
        });
    }

    const body = document.createElement('div');
    body.className = 'space-y-3 text-xs';
    body.appendChild(row('Preset', chips.el));
    body.appendChild(custom);

    return collapsibleGroup({ title: 'Box Shadow', defaultOpen: false, children: [body] }).el;
}

function matchPreset(boxShadow) {
    if (!boxShadow) return 'none';
    const found = PRESETS.find(p => p.css === boxShadow);
    return found?.value ?? null;
}

function row(label, control) {
    const r = document.createElement('div');
    r.className = 'flex flex-col gap-1';
    const lbl = document.createElement('label');
    lbl.className = 'text-[10px] uppercase tracking-wide text-slate-500';
    lbl.textContent = label;
    r.appendChild(lbl);
    r.appendChild(control);
    return r;
}
```

- [ ] **Step 3: Create `groups/spacing.js`**

```js
import { fourSideInput } from '../../controls/four-side-input.js';
import { collapsibleGroup } from '../../controls/collapsible-group.js';

export function spacingGroup(component) {
    const style = component.getStyle();

    const padding = fourSideInput({
        values: {
            top:    parseFloat(style['padding-top'])    || parseFloat(style.padding) || 0,
            right:  parseFloat(style['padding-right'])  || parseFloat(style.padding) || 0,
            bottom: parseFloat(style['padding-bottom']) || parseFloat(style.padding) || 0,
            left:   parseFloat(style['padding-left'])   || parseFloat(style.padding) || 0,
        },
        unit: 'px',
        units: ['px', '%', 'em', 'rem'],
        max: 500,
        linked: false,
        onChange: ({ top, right, bottom, left, unit }) => component.addStyle({
            'padding-top':    `${top}${unit}`,
            'padding-right':  `${right}${unit}`,
            'padding-bottom': `${bottom}${unit}`,
            'padding-left':   `${left}${unit}`,
        }),
    });

    const body = document.createElement('div');
    body.className = 'space-y-3 text-xs';
    body.appendChild(row('Padding (T/R/B/L)', padding.el));

    return collapsibleGroup({ title: 'Spacing', defaultOpen: false, children: [body] }).el;
}

function row(label, control) {
    const r = document.createElement('div');
    r.className = 'flex flex-col gap-1';
    const lbl = document.createElement('label');
    lbl.className = 'text-[10px] uppercase tracking-wide text-slate-500';
    lbl.textContent = label;
    r.appendChild(lbl);
    r.appendChild(control);
    return r;
}
```

- [ ] **Step 4: Create `groups/sizing.js`**

```js
import { numberWithUnit } from '../../controls/number-with-unit.js';
import { collapsibleGroup } from '../../controls/collapsible-group.js';

export function sizingGroup(component) {
    const style = component.getStyle();

    function makeRow(label, prop, defaultUnit = 'px') {
        const ctrl = numberWithUnit({
            value: parseFloat(style[prop]) || 0,
            unit: extractUnit(style[prop]) || defaultUnit,
            units: ['px', '%', 'vw', 'vh', 'em', 'rem', 'auto'],
            min: 0,
            max: 5000,
            onChange: ({ value, unit }) => component.addStyle({ [prop]: unit === 'auto' ? 'auto' : `${value}${unit}` }),
        });
        return row(label, ctrl.el);
    }

    const body = document.createElement('div');
    body.className = 'space-y-3 text-xs';
    body.appendChild(makeRow('Width', 'width'));
    body.appendChild(makeRow('Max width', 'max-width'));
    body.appendChild(makeRow('Height', 'height'));
    body.appendChild(makeRow('Min height', 'min-height'));

    return collapsibleGroup({ title: 'Sizing', defaultOpen: false, children: [body] }).el;
}

function row(label, control) {
    const r = document.createElement('div');
    r.className = 'flex flex-col gap-1';
    const lbl = document.createElement('label');
    lbl.className = 'text-[10px] uppercase tracking-wide text-slate-500';
    lbl.textContent = label;
    r.appendChild(lbl);
    r.appendChild(control);
    return r;
}

function extractUnit(cssValue) {
    if (!cssValue || typeof cssValue !== 'string') return null;
    if (cssValue === 'auto') return 'auto';
    const match = cssValue.match(/[a-z%]+$/i);
    return match ? match[0] : null;
}
```

- [ ] **Step 5: Create `groups/layout.js` — Section/Column-only group**

```js
import { numberWithUnit } from '../../controls/number-with-unit.js';
import { presetChips } from '../../controls/preset-chips.js';
import { slider } from '../../controls/slider.js';
import { collapsibleGroup } from '../../controls/collapsible-group.js';

// This group only renders for mp-section and mp-column. For other types it returns an empty <div>.
export function layoutGroup(component) {
    const type = component.get('type');
    if (type === 'mp-section') return sectionLayout(component);
    if (type === 'mp-column')  return columnLayout(component);
    return document.createDocumentFragment(); // empty placeholder
}

function sectionLayout(component) {
    const props = component.get('props') || {};

    const widthChips = presetChips({
        options: [{ value: 'boxed', label: 'Boxed' }, { value: 'full', label: 'Full' }],
        value: props.width || 'boxed',
        onChange: (v) => component.set('props', { ...component.get('props'), width: v }),
    });

    const maxInner = numberWithUnit({
        value: props.max_inner_width || 1200,
        unit: 'px',
        units: ['px'],
        min: 320,
        max: 2560,
        onChange: ({ value }) => component.set('props', { ...component.get('props'), max_inner_width: value }),
    });

    const valign = presetChips({
        options: [
            { value: 'top',    label: 'Top' },
            { value: 'middle', label: 'Mid' },
            { value: 'bottom', label: 'Bot' },
        ],
        value: props.vertical_align || 'top',
        onChange: (v) => component.set('props', { ...component.get('props'), vertical_align: v }),
    });

    const heightMode = presetChips({
        options: [
            { value: 'default', label: 'Auto' },
            { value: 'fixed',   label: 'Fixed' },
            { value: 'screen',  label: 'Screen' },
        ],
        value: props.min_height_mode || 'default',
        onChange: (v) => component.set('props', { ...component.get('props'), min_height_mode: v }),
    });

    const minHeight = numberWithUnit({
        value: props.min_height || 0,
        unit: 'px',
        units: ['px', 'vh'],
        min: 0,
        max: 2000,
        onChange: ({ value }) => component.set('props', { ...component.get('props'), min_height: value }),
    });

    const body = document.createElement('div');
    body.className = 'space-y-3 text-xs';
    body.appendChild(row('Width mode', widthChips.el));
    body.appendChild(row('Max inner width', maxInner.el));
    body.appendChild(row('Vertical align', valign.el));
    body.appendChild(row('Height mode', heightMode.el));
    body.appendChild(row('Min height', minHeight.el));

    return collapsibleGroup({ title: 'Layout', defaultOpen: true, children: [body] }).el;
}

function columnLayout(component) {
    const props = component.get('props') || {};

    const sizeSlider = slider({
        min: 8.33,
        max: 100,
        step: 0.01,
        value: props.size_pct || 100,
        onChange: (v) => component.set('props', { ...component.get('props'), size_pct: v }),
    });

    const contentPos = presetChips({
        options: [
            { value: 'start',  label: 'Start' },
            { value: 'center', label: 'Center' },
            { value: 'end',    label: 'End' },
        ],
        value: props.content_position || 'start',
        onChange: (v) => component.set('props', { ...component.get('props'), content_position: v }),
    });

    const valign = presetChips({
        options: [
            { value: 'top',    label: 'Top' },
            { value: 'middle', label: 'Mid' },
            { value: 'bottom', label: 'Bot' },
        ],
        value: props.vertical_align || 'top',
        onChange: (v) => component.set('props', { ...component.get('props'), vertical_align: v }),
    });

    const body = document.createElement('div');
    body.className = 'space-y-3 text-xs';
    body.appendChild(row('Width %', sizeSlider.el));
    body.appendChild(row('Content position', contentPos.el));
    body.appendChild(row('Vertical align', valign.el));

    return collapsibleGroup({ title: 'Layout', defaultOpen: true, children: [body] }).el;
}

function row(label, control) {
    const r = document.createElement('div');
    r.className = 'flex flex-col gap-1';
    const lbl = document.createElement('label');
    lbl.className = 'text-[10px] uppercase tracking-wide text-slate-500';
    lbl.textContent = label;
    r.appendChild(lbl);
    r.appendChild(control);
    return r;
}
```

- [ ] **Step 6: Wire the simple Advanced tab + register all groups in `builder.js`**

In [resources/js/builder.js](resources/js/builder.js), add the imports:

```js
import { registerAdvancedGroup } from './builder/style-panel/index.js';
import { borderGroup }  from './builder/style-panel/groups/border.js';
import { shadowGroup }  from './builder/style-panel/groups/shadow.js';
import { spacingGroup } from './builder/style-panel/groups/spacing.js';
import { sizingGroup }  from './builder/style-panel/groups/sizing.js';
import { layoutGroup }  from './builder/style-panel/groups/layout.js';
```

After the Task 8 `registerStyleGroup(typographyGroup); registerStyleGroup(backgroundGroup);` lines, append:

```js
registerStyleGroup(layoutGroup);     // Section/Column-only (empty for others)
registerStyleGroup(spacingGroup);
registerStyleGroup(sizingGroup);
registerStyleGroup(borderGroup);
registerStyleGroup(shadowGroup);

// Simple Advanced tab — margin (4-side) + custom CSS textarea
import { fourSideInput as fourSide } from './builder/controls/four-side-input.js';
import { collapsibleGroup as group } from './builder/controls/collapsible-group.js';

registerAdvancedGroup((component) => {
    const style = component.getStyle();
    const margin = fourSide({
        values: {
            top:    parseFloat(style['margin-top']) || 0,
            right:  parseFloat(style['margin-right']) || 0,
            bottom: parseFloat(style['margin-bottom']) || 0,
            left:   parseFloat(style['margin-left']) || 0,
        },
        unit: 'px',
        units: ['px', '%', 'em', 'rem'],
        min: -500,
        linked: false,
        onChange: ({ top, right, bottom, left, unit }) => component.addStyle({
            'margin-top':    `${top}${unit}`,
            'margin-right':  `${right}${unit}`,
            'margin-bottom': `${bottom}${unit}`,
            'margin-left':   `${left}${unit}`,
        }),
    });

    const body = document.createElement('div');
    body.className = 'space-y-3 text-xs';
    const lbl = document.createElement('label');
    lbl.className = 'text-[10px] uppercase tracking-wide text-slate-500';
    lbl.textContent = 'Margin (T/R/B/L)';
    body.appendChild(lbl);
    body.appendChild(margin.el);

    return group({ title: 'Spacing — margin', defaultOpen: true, children: [body] }).el;
});

registerAdvancedGroup((component) => {
    // Custom CSS textarea — appended to the element's style
    const wrap = document.createElement('div');
    wrap.className = 'p-3 space-y-2 text-xs';
    const lbl = document.createElement('label');
    lbl.className = 'text-[10px] uppercase tracking-wide text-slate-500';
    lbl.textContent = 'Custom CSS (key:value;...)';
    wrap.appendChild(lbl);

    const textarea = document.createElement('textarea');
    textarea.rows = 4;
    textarea.className = 'w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white font-mono';
    textarea.placeholder = 'e.g.  letter-spacing: 0.05em; opacity: 0.9;';
    textarea.addEventListener('blur', () => {
        const css = textarea.value;
        // Parse simple key:value; pairs and apply
        css.split(';').forEach((pair) => {
            const [k, v] = pair.split(':').map((s) => s?.trim());
            if (k && v) component.addStyle({ [k]: v });
        });
    });
    wrap.appendChild(textarea);

    return wrap;
});
```

- [ ] **Step 7: Build + final Plan 5 smoke test**

```bash
npm run build
php artisan serve
```

1. Open the editor.
2. Click "+ Section" → choose 1/3 + 2/3 → click the section.
3. Style tab: confirm 6 collapsible groups visible — Typography, Background, **Layout** (open by default since this is a Section), Spacing, Sizing, Border, Shadow.
4. In Layout: change Width mode from Boxed to Full → canvas background extends to full width (via the runtime CSS handling).
5. Change Vertical align to Middle → canvas updates.
6. In Spacing: change padding-top to 120px → canvas updates.
7. In Border: change Style to Solid, Width to 2 on all sides, Color to a bright color, Radius to 12 → canvas reflects.
8. In Shadow: click "LG" preset → drop shadow appears.
9. Open Advanced tab → set margin-bottom to 60 → canvas updates.
10. In Advanced → Custom CSS: type `opacity: 0.95;` and tab out → opacity applies.
11. Click a Column → Style tab still shows 6 groups, but Layout now has Column-specific controls (Width %, Content position, Vertical align). Drag the Width % slider → the column's flex-basis updates live.
12. Save Draft → "Saved ✓".
13. Reload the page (Cmd/Ctrl+R) → click the section again → all style values are preserved (the slider readouts, the chips, the color swatches).
14. Run full test suite:

```bash
php artisan test
```

Expected: still 67 passing (Plan 5 doesn't add or break any tests beyond Task 2's additions).

15. Final manual end-to-end check: visit the public page (whatever the slug of the page you're editing was) → confirm the section renders with all your style customizations applied (since the saved `html` + `css` flow is unchanged from Plan 2).

Stop the server.

**Stop here. The user will stage/commit.**

---

## Plan 5 Acceptance Criteria

Plan 5 is complete when:

1. `php artisan test` is green — 67 passing (57 prior + 6 unit + 4 feature)
2. `npm run build` produces a clean bundle with no errors
3. The editor at `/admin/builder/{id}/edit` shows a "+ Section" button in the top toolbar
4. Clicking "+ Section" opens a popover with 8 preset column structures; clicking one inserts an `mp-section` with the correct columns
5. Sections and Columns are selectable, draggable (within their drop rules), and resizable (drag the gap between two columns)
6. Inner Sections work — dragging an `mp-section` into an `mp-column` nests correctly
7. The right `<aside>` panel mounts on selection and shows Content / Style / Advanced tabs
8. Style tab shows 6 groups: Typography, Background, Layout (only for Section/Column), Spacing, Sizing, Border, Shadow
9. Every control writes back to the component's CSS via `component.addStyle()` and changes are reflected immediately in the canvas
10. Save Draft + reload preserves every style change (covered by existing Plan 2 save flow + Task 2 validation)
11. `WidgetRegistry` rejects unknown component types and non-Section roots in the `update` validator
12. The runtime CSS (`builder-runtime.css`) loads in both the canvas iframe and on public pages via `app.css` `@import`

---

## Handoff to Plan 6

Plan 6 picks up by:

- Building the custom RTE floating toolbar + link popover
- Implementing 20 widgets in 3 tiers (8 trivial → 7 medium → 5 complex), each as a `register*(editor)` module under `resources/js/builder/widgets/`
- Wiring inline editing on every text-bearing widget (D2 from spec)
- Rebuilding the 4 starter Section templates (Hero, Two-Column, CTA Banner, Feature Grid) using the new widgets
- Deleting `resources/js/builder/blocks.js`
- Registering each widget's Content-tab schema (Plan 5 style panel already has the `registerContentGroup` hook)

The architecture (Section/Column primitive, control primitives, style panel) is stable; Plan 6 fills the canvas with the things the user actually drags onto pages.

## Handoff to Plan 7

After Plan 6:

- `builder-runtime.js` — public-page interactive runtime (counter animation, carousel init, accordion/tabs/alert handlers, gallery lightbox)
- `PlaceholderPagesSeeder` rewrite — seeded pages use the new component tree
- Snapshot tests against reference component trees
- Final manual smoke checklist + Lighthouse performance check
