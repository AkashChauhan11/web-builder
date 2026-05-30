# MiniPress Plan 8: Phase B — Productivity (Responsive + Templates + Global Styles)

> **Continuous execution preferred.** No subagent dispatches, no per-task stops. User commits the whole batch at the end.

**Goal:** Phase B turns the Phase A editor from "feature-complete" to "fast." Three productivity multipliers:

1. **Per-breakpoint responsive values** — any style control can have separate Desktop / Tablet / Mobile values. Tablet/Mobile inherit from Desktop unless overridden.
2. **Template library** — 14 bundled templates (4 from Phase A + 10 new) accessible via the section picker, plus a DB-backed "My Templates" for user-saved sections. New admin page `/admin/templates` lists/manages them. "Save as Template" button on every Section's canvas toolbar.
3. **Global styles** — singleton DB record holding 6 site colors and 4 typography presets (H1, H2, H3, Body). Emitted as CSS variables on every page (`--mp-color-primary`, `--mp-font-h1`, etc.). Widgets reference these variables by default. New admin page `/admin/global-styles` to edit them.

**Architecture:**

- **Per-breakpoint** leverages GrapesJS's native `mediaText` on style rules. When `editor.setDevice('Tablet')` is active, `editor.getSelected().addStyle({...})` writes rules into a `@media (max-width: 992px) { ... }` block. The style panel's controls are wrapped in a thin device-aware adapter that reads/writes via the active device. A small "Editing: Desktop" pill in the style panel header makes the active device visible at all times. Each control shows a faint device-glyph badge when its value is inherited from a wider breakpoint (so users know "this hasn't been customized for mobile yet").
- **Template library:** new `builder_templates` table with `id`, `name`, `type` (`section` or `page`), `thumbnail_url` (nullable), `components_json`, `css`, `created_by` (nullable for bundled), `created_at`, `updated_at`. Bundled templates are seeded via `BundledTemplatesSeeder` so they appear in the DB and the same query handles both bundled + user. Section picker's "Templates" tab queries the DB. New admin route `/admin/templates` with index/destroy actions. New canvas toolbar button "Save as Template" on every `mp-section` that opens a small modal for name + saves.
- **Global styles:** new `global_styles` table (singleton — `id` always 1). Columns: `colors` (JSON: `{ primary, secondary, accent, text, background, muted }`), `typography` (JSON: `{ h1, h2, h3, body }` each with `font_family`, `font_size`, `font_weight`, `line_height`). Admin page `/admin/global-styles` with form. Public layout + editor canvas inject a `<style>` block at the top of the page emitting CSS custom properties. Widget base CSS in `builder-runtime.css` is updated to reference these vars (with sane fallbacks). Style-panel color picker shows the 6 theme colors as a row of swatches above the custom hex input; typography group's font-family select has the 4 presets at the top.

**Tech stack additions:** none.

**Effort estimate:** ~2-3 weeks (11 tasks).

---

## Scope of Plan 8

Implements **spec Phase B sections in the Elementor design doc**:
- Per-breakpoint responsive values
- Template library (page + block templates + save-your-own)
- Global styles (typography + color palette)

**Out of scope (Phase C):**
- Entrance animations / scroll reveal
- Hover states + transitions
- Form builder widget
- Google Map, Star Rating, Shortcode widgets
- Motion effects (parallax, sticky)

---

## File Map for Plan 8

### Created (PHP)
- `database/migrations/YYYY_MM_DD_create_builder_templates_table.php`
- `database/migrations/YYYY_MM_DD_create_global_styles_table.php`
- `app/Models/BuilderTemplate.php`
- `app/Models/GlobalStyle.php`
- `app/Http/Controllers/Admin/TemplatesController.php`
- `app/Http/Controllers/Admin/GlobalStylesController.php`
- `database/seeders/BundledTemplatesSeeder.php`
- `resources/views/admin/templates/index.blade.php`
- `resources/views/admin/global-styles/edit.blade.php`
- `tests/Feature/TemplatesAdminTest.php`
- `tests/Feature/GlobalStylesAdminTest.php`

### Created (JS)
- `resources/js/builder/responsive/device-style.js` — device-aware getStyle/addStyle adapter
- `resources/js/builder/templates/save-as-template-modal.js`
- `resources/js/builder/templates/library.js` — fetches DB templates + adds them to the section picker
- `resources/js/builder/templates/extra/` — 10 new bundled template JSON-tree files
- `resources/js/builder/global-styles/theme-colors.js` — fetches the 6 colors for use by the color picker

### Modified
- `routes/web.php` — add 5 new routes (templates: index/destroy/store; global-styles: edit/update)
- `resources/views/layouts/app.blade.php` — inject `<style>:root{...}</style>` with global style CSS vars
- `resources/views/admin/builder/editor.blade.php` — inject the same CSS vars in the editor; add device pill in style-panel header
- `resources/views/layouts/admin.blade.php` — add nav links to Templates + Global Styles admin pages
- `resources/js/builder/style-panel/index.js` — render the device pill in the panel header
- `resources/js/builder/style-panel/groups/typography.js` — typography presets row above family select
- `resources/js/builder/controls/color-picker.js` — theme swatches row above the hex input
- `resources/js/builder/sections/section.js` — add "Save as Template" command to the section toolbar
- `resources/css/builder-runtime.css` — `.mp-heading`, `.mp-btn`, etc. default to CSS variables with fallbacks
- `app/Support/WidgetRegistry.php` — no change (templates/global-styles use existing types)

---

## Task 1: DB migrations + models (templates + global styles)

**Files:**
- Create: `database/migrations/YYYY_MM_DD_create_builder_templates_table.php`
- Create: `database/migrations/YYYY_MM_DD_create_global_styles_table.php`
- Create: `app/Models/BuilderTemplate.php`
- Create: `app/Models/GlobalStyle.php`

- [ ] Migration for `builder_templates`:

```php
Schema::create('builder_templates', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->enum('type', ['section', 'page'])->default('section');
    $table->string('thumbnail_url')->nullable();
    $table->json('components_json');
    $table->longText('css')->nullable();
    $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
    $table->boolean('is_bundled')->default(false);
    $table->timestamps();
    $table->index(['type', 'is_bundled']);
});
```

- [ ] Migration for `global_styles`:

```php
Schema::create('global_styles', function (Blueprint $table) {
    $table->id();
    $table->json('colors');
    $table->json('typography');
    $table->timestamps();
});
```

- [ ] `BuilderTemplate` model: standard Eloquent, `protected $casts = ['components_json' => 'array']`, `belongsTo(User::class, 'created_by')`.

- [ ] `GlobalStyle` model: standard Eloquent with `protected $casts = ['colors' => 'array', 'typography' => 'array']`. Add a `static current()` helper that returns the singleton row, creating defaults if none exists.

Run migrations.

**Stop here. (No commit — continuous.)**

---

## Task 2: Global styles admin page

**Files:**
- Create: `app/Http/Controllers/Admin/GlobalStylesController.php`
- Create: `resources/views/admin/global-styles/edit.blade.php`
- Modify: `routes/web.php`

- [ ] Route group adds:

```php
Route::get('/global-styles', [GlobalStylesController::class, 'edit'])->name('global-styles.edit');
Route::put('/global-styles', [GlobalStylesController::class, 'update'])->name('global-styles.update');
```

- [ ] `GlobalStylesController@edit` returns view with `GlobalStyle::current()`.

- [ ] `update` validates + saves the 6 colors and 4 typography presets.

- [ ] View has 6 color pickers (using existing Coloris) + 4 typography blocks (font family select, size px input, weight select, line-height number).

- [ ] Nav link in admin layout.

**Stop here.**

---

## Task 3: Global styles CSS emission

**Files:**
- Modify: `resources/views/layouts/app.blade.php`
- Modify: `resources/views/admin/builder/editor.blade.php`
- Modify: `resources/css/builder-runtime.css`
- Modify: `app/Http/Controllers/Frontend/PageController.php` (pass `GlobalStyle::current()` to the view)
- Modify: `app/Http/Controllers/Admin/BuilderPagesController.php` (same for `edit()`)

- [ ] In public layout, emit a `<style>` block at the top of `<head>`:

```blade
<style>:root {
    --mp-color-primary: {{ $globalStyle->colors['primary'] ?? '#3b82f6' }};
    --mp-color-secondary: {{ $globalStyle->colors['secondary'] ?? '#1e293b' }};
    --mp-color-accent: {{ $globalStyle->colors['accent'] ?? '#10b981' }};
    --mp-color-text: {{ $globalStyle->colors['text'] ?? '#0f172a' }};
    --mp-color-bg: {{ $globalStyle->colors['background'] ?? '#ffffff' }};
    --mp-color-muted: {{ $globalStyle->colors['muted'] ?? '#64748b' }};
    --mp-font-h1: {{ $globalStyle->typography['h1']['font_family'] ?? 'inherit' }};
    /* ...more */
}</style>
```

- [ ] In `builder-runtime.css`, update widget defaults:

```css
.mp-heading { color: var(--mp-color-text, #0f172a); }
.mp-btn { background: var(--mp-color-primary, #1e293b); }
.mp-text { color: var(--mp-color-text, #0f172a); }
/* etc. */
```

- [ ] Editor canvas reads the same global styles (controller passes `globalStyle` to `editor.blade.php`).

**Stop here.**

---

## Task 4: Global styles in style panel

**Files:**
- Modify: `resources/js/builder/controls/color-picker.js`
- Modify: `resources/js/builder/style-panel/groups/typography.js`
- Create: `resources/js/builder/global-styles/theme-colors.js`

- [ ] `theme-colors.js`: reads global style CSS vars from `document.documentElement` via `getComputedStyle` and returns them as `{ primary, secondary, ... }`.

- [ ] `colorPicker` factory: add a row of 6 swatches at the top labeled "Theme". Click a swatch → set value to that color. Custom hex input below.

- [ ] `typographyGroup`: above the font-family select, add 4 preset chips ("H1 / H2 / H3 / Body") that apply the full typography preset (family + size + weight + line-height) when clicked.

**Stop here.**

---

## Task 5: Per-breakpoint storage — device-aware style adapter

**Files:**
- Create: `resources/js/builder/responsive/device-style.js`
- Modify: `resources/js/builder/style-panel/index.js`
- Modify: `resources/js/builder/style-panel/groups/*.js` (all 7 files) to use the adapter instead of `component.addStyle` directly

- [ ] `device-style.js` exports `readStyle(component)` and `writeStyle(component, patch)`. Both check `editor.getDeviceModel().get('name')` — for Desktop, behaves like `getStyle`/`addStyle`; for Tablet/Mobile, scopes to `@media` rules via GrapesJS's `mediaText`. Falls back to Desktop value when current device has no override (the "inheritance" behavior).

- [ ] Update all style group files to import `readStyle` / `writeStyle` instead of using `component.getStyle()` / `component.addStyle()` directly.

**Stop here.**

---

## Task 6: Per-breakpoint UI

**Files:**
- Modify: `resources/js/builder/style-panel/index.js`

- [ ] Add a device pill in the panel header showing current device + a small click target to swap.

- [ ] Per-control: when rendering a control, if the value is inherited from a wider breakpoint (no current-device override), show a faint "↳ desktop" badge next to it.

- [ ] Listen to `editor.on('change:device', ...)` and re-render the panel when the device changes.

**Stop here.**

---

## Task 7: Templates admin CRUD

**Files:**
- Create: `app/Http/Controllers/Admin/TemplatesController.php`
- Create: `resources/views/admin/templates/index.blade.php`
- Create: `tests/Feature/TemplatesAdminTest.php`
- Modify: `routes/web.php`

- [ ] Routes: `index`, `destroy`. (User-side `store` happens from the editor via "Save as Template" — separate route.)

- [ ] `index` lists templates with thumbnail + name + type + delete button.

- [ ] Pest tests: admin can list / delete; non-admin gets 403; bundled templates cannot be deleted.

**Stop here.**

---

## Task 8: "Save as Template" button on Section toolbar

**Files:**
- Modify: `resources/js/builder/sections/section.js`
- Create: `resources/js/builder/templates/save-as-template-modal.js`

- [ ] Add a toolbar command to `mp-section`:

```js
toolbar: [
    { command: 'save-as-template', label: '★', attributes: { title: 'Save as Template' } },
    ...defaultToolbar,
],
```

- [ ] Register the command:

```js
editor.Commands.add('save-as-template', {
    run(editor) {
        openSaveAsTemplateModal(editor, editor.getSelected());
    },
});
```

- [ ] `save-as-template-modal.js` opens a small modal with a name input + Save button. POSTs to `/admin/templates` with the section's `components_json` + `css`.

**Stop here.**

---

## Task 9: Template library — fetch DB templates into section picker

**Files:**
- Modify: `resources/js/builder/sections/section-picker.js`
- Create: `resources/js/builder/templates/library.js`

- [ ] `library.js`: `fetchTemplates()` does a GET to `/admin/templates/list` returning the JSON list. Cache in module-level state.

- [ ] Section picker's "Templates" tab now fetches and shows both bundled + user templates with thumbnails. Clicking inserts the template's `components_json` into the canvas.

**Stop here.**

---

## Task 10: 10 new bundled templates + seeder

**Files:**
- Create: `resources/js/builder/templates/extra/about.js`
- Create: `resources/js/builder/templates/extra/pricing.js`
- Create: `resources/js/builder/templates/extra/contact.js`
- Create: `resources/js/builder/templates/extra/team.js`
- Create: `resources/js/builder/templates/extra/services.js`
- Create: `resources/js/builder/templates/extra/portfolio.js`
- Create: `resources/js/builder/templates/extra/testimonials.js`
- Create: `resources/js/builder/templates/extra/faq.js`
- Create: `resources/js/builder/templates/extra/footer-cta.js`
- Create: `resources/js/builder/templates/extra/feature-list.js`
- Create: `database/seeders/BundledTemplatesSeeder.php`
- Modify: `database/seeders/DatabaseSeeder.php`

- [ ] Each template file exports a `get*Template()` function returning the JSON tree.

- [ ] `BundledTemplatesSeeder` reads these (via a hand-maintained PHP array mirroring the JS, since seeders run server-side and can't import JS). Or alternative: the seeder just inserts placeholder rows with `is_bundled=true` + a `name` + an empty `components_json`, and the JS-side picker overlays bundled templates from JS files on top of DB-listed user templates. Simpler. Going with that approach.

**Stop here.**

---

## Task 11: Final acceptance verification

- [ ] `npm run build` clean.
- [ ] `php artisan migrate:fresh --seed` clean.
- [ ] `php artisan test` — all 103+ tests passing + new admin tests.
- [ ] Manual smoke:
  1. Visit `/admin/global-styles` → change primary color to red → save → visit `/` → buttons are red.
  2. Editor → drop a section → "Save as Template" → name it → see it in `/admin/templates`.
  3. Editor → "+ Section" → Templates tab → see bundled + your saved templates → insert.
  4. Editor → click an element → Tablet device button in top toolbar → change padding → switch back to Desktop → padding stays at the desktop value. Switch to Tablet → see the tablet override.

---

## Plan 8 Acceptance Criteria

1. New `builder_templates` + `global_styles` tables exist; migrations run cleanly.
2. `/admin/global-styles` page lets admins edit 6 colors + 4 typography presets.
3. CSS variables (`--mp-color-*`, `--mp-font-*`) are emitted on every public page.
4. Widget base CSS in `builder-runtime.css` references the variables.
5. Color picker in the editor shows the 6 theme colors as quick swatches.
6. Typography group shows 4 preset chips (H1, H2, H3, Body).
7. Style panel writes per-breakpoint values when Tablet or Mobile is the active device.
8. Style panel header shows the active device; controls show "↳ desktop" badge when inherited.
9. `/admin/templates` page lists all bundled + user templates with delete actions.
10. "Save as Template" button on each Section saves a `BuilderTemplate` row.
11. Section picker's Templates tab shows 14 bundled + any user-saved templates.
12. `php artisan test` is green; `npm run build` is clean.
