# MiniPress Plan 2: GrapesJS Editor + Modals + Custom Blocks

> **For agentic workers:** Use superpowers:subagent-driven-development to execute. Steps use checkbox (`- [ ]`) syntax. **Git note:** The user handles git themselves — do NOT run `git add` or `git commit` from subagents. Stop after tests pass.

**Goal:** Wire up the GrapesJS visual editor. Editors can open a page from the admin list, drag custom blocks onto a Tailwind-styled canvas, edit per-locale title/slug/status/homepage flag in a Settings modal, edit per-locale SEO in an SEO modal, switch locales without losing changes, upload assets, and save (auto-save as draft + explicit Save Draft / Publish buttons).

**Architecture:**
- `resources/js/builder.js` is a single ES module that mounts GrapesJS on `#gjs`. It reads its full configuration (page metadata, locales, current translation, SEO rows, CSRF token, URLs) from a `data-config` attribute on the mount point — populated by Blade via `@json`.
- The editor talks to a single `PUT /admin/builder/{id}` endpoint that accepts the entire payload (translation + every locale's SEO row) in one JSON request. Save is debounced auto-save + explicit toolbar buttons.
- Asset uploads POST to `/admin/builder/assets` and return JSON in the GrapesJS asset-manager format. Uploaded files land in `storage/app/public/builder-assets/` and create matching `MediaItem` rows so the media library (Plan 3) sees them.
- HTML and CSS exports from GrapesJS run through `HtmlSanitizer::stripDocumentWrappers` before persisting.

**Tech stack additions:** `grapesjs ^0.22`, `grapesjs-preset-webpage`, `grapesjs-blocks-basic`, `grapesjs-custom-code`, `grapesjs-style-bg`, `@melloware/coloris ^0.25`. Built via Vite.

---

## Scope of Plan 2

Implements **spec milestones 5-7**:
5. GrapesJS editor mount + save flow + auto-save
6. Settings modal + SEO modal + locale switcher
7. Custom blocks + Coloris

**Out of scope** (covered by Plan 3+):
- Media library admin UI (Plan 3) — but the uploader endpoint is created here because the editor needs it
- Users / Languages admin CRUD (Plan 3)
- Test hardening sweep (Plan 4)

---

## What Plan 1 Already Did

These are dependencies you can rely on:

- `BuilderPagesController` exists at `app/Http/Controllers/Admin/BuilderPagesController.php` with `index/create/store/destroy` actions. This plan ADDS `edit/update/publish/uploadAsset`.
- Routes: `/admin/builder/{id}/edit`, `/admin/builder/{id}` (PUT), `/admin/builder/{id}/publish` (POST), `/admin/builder/assets` (POST) — NOT yet registered in `routes/web.php`. This plan adds them.
- The editor view is referenced from `BuilderPagesController@edit` (to be created) and lives at `resources/views/admin/builder/editor.blade.php` (to be created).
- `HtmlSanitizer::stripDocumentWrappers` is already implemented and tested.
- `MediaItem` model + `media` table exist with an `uploaded_by` FK.
- `EnsureUserIsAdmin` middleware + `auth` gate already wrap all `/admin/*` routes.
- Vite is wired with Tailwind v4. `resources/js/app.js` exists but is empty — Plan 2 creates a new entry `resources/js/builder.js` and adds it to the Vite config inputs.
- Admin layout (`resources/views/layouts/admin.blade.php`) is set up. The editor page extends it but adds its own scripts via `@push`.

---

## File Map

### Created
- `resources/js/builder.js` (main editor module)
- `resources/js/builder/blocks.js` (custom block definitions, kept separate for readability)
- `resources/js/builder/coloris-init.js` (Coloris setup helper)
- `resources/views/admin/builder/editor.blade.php` (editor page)
- `tests/Feature/BuilderAdminTest.php` (covers update/publish/uploadAsset/sanitization)
- `storage/app/public/builder-assets/.gitkeep` (so the upload directory exists in git)
- `database/factories/BuilderPageFactory.php` (needed by BuilderAdminTest)
- `database/factories/BuilderPageTranslationFactory.php`

### Modified
- `app/Http/Controllers/Admin/BuilderPagesController.php` — add `edit/update/publish/uploadAsset`
- `routes/web.php` — add the 4 new routes inside the `admin.builder` group
- `resources/views/admin/builder/index.blade.php` — replace the "edit comes in Plan 2" placeholder with a real "Edit" link
- `vite.config.js` — add `resources/js/builder.js` to the inputs
- `package.json` — add GrapesJS + Coloris deps (and run `npm install`)
- `.gitignore` — add `/public/builder-assets` if not already covered by the existing `/public/build`, `/public/storage` patterns (likely not needed since `storage/app/public/builder-assets/` is the storage path and `public/builder-assets` is a symlink target created by `php artisan storage:link`)

---

## Conventions for This Plan

- **No git commits.** Subagents stop after tests pass. The user stages and commits.
- **Pest 3 for new tests.** Existing tests live in `tests/Feature/` and `tests/Unit/`.
- **TDD for the controller actions** — write the failing test before implementing `update/publish/uploadAsset`. The JS editor module is harder to TDD; we rely on manual smoke tests + the controller-side tests to cover the contract.
- **JS:** plain ES modules, no TypeScript, no framework. The module is structured so individual concerns (blocks, coloris, modal HTML, save fetch) live in small functions.
- **Symlink note:** before `uploadAsset` works, the user must run `php artisan storage:link` once (creates `public/storage` → `storage/app/public`). The plan's first task includes this.

---

## Task 1: Install JS dependencies + create asset storage symlink

**Files:**
- Modify: `package.json` (via `npm install`)
- Modify: `vite.config.js`
- Create: `storage/app/public/builder-assets/.gitkeep`

- [ ] **Step 1: Install npm packages**

```bash
npm install grapesjs@^0.22.16 grapesjs-preset-webpage grapesjs-blocks-basic grapesjs-custom-code grapesjs-style-bg @melloware/coloris
```

Expected: deps appear in `dependencies` (not `devDependencies`, since they're shipped to the client). Confirm via:

```bash
grep -E '"grapesjs"|"@melloware/coloris"' package.json
```

- [ ] **Step 2: Add the builder entry to Vite config**

Edit `vite.config.js`. Update the `input` array:

```js
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [
        laravel({
            input: [
                'resources/css/app.css',
                'resources/js/app.js',
                'resources/js/builder.js',
            ],
            refresh: true,
        }),
        tailwindcss(),
    ],
});
```

- [ ] **Step 3: Create the asset storage directory placeholder**

```bash
mkdir -p storage/app/public/builder-assets
```

Create `storage/app/public/builder-assets/.gitkeep` as an empty file. This guarantees the directory exists when the project is cloned fresh.

- [ ] **Step 4: Create the storage symlink (one-time per environment)**

```bash
php artisan storage:link
```

Expected: `public/storage` → `storage/app/public`. If it says "already exists", that's fine.

- [ ] **Step 5: Confirm everything still builds**

```bash
npm run build
```

Expected: build succeeds. You'll see `builder` in the manifest (the new entry hasn't been written yet, so it'll fail — actually, Vite will error because the entry file doesn't exist. SKIP this step and revisit after Task 2 creates `builder.js`.) Just confirm `node_modules/grapesjs` exists after install.

**Stop here. The user will stage/commit.**

---

## Task 2: Minimal `builder.js` skeleton — just enough to verify the mount

**Files:**
- Create: `resources/js/builder.js`

The full editor module is big. This task builds the bare minimum: import GrapesJS, mount on `#gjs`, log "ready" to the console. Subsequent tasks expand it.

- [ ] **Step 1: Create `resources/js/builder.js`**

```js
import grapesjs from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';

document.addEventListener('DOMContentLoaded', () => {
    const mount = document.getElementById('gjs');
    if (!mount) return;

    const config = JSON.parse(mount.dataset.config ?? '{}');

    const editor = grapesjs.init({
        container: '#gjs',
        height: '100vh',
        fromElement: false,
        storageManager: false, // we manage save manually
        deviceManager: {
            devices: [
                { name: 'Desktop', width: '' },
                { name: 'Tablet', width: '768px', widthMedia: '992px' },
                { name: 'Mobile', width: '375px', widthMedia: '480px' },
            ],
        },
        canvas: {
            scripts: ['https://cdn.tailwindcss.com'],
        },
    });

    // Load existing content
    if (config.translation?.components) {
        editor.setComponents(config.translation.components);
    } else if (config.translation?.html) {
        editor.setComponents(config.translation.html);
    }
    if (config.translation?.styles) {
        editor.setStyle(config.translation.styles);
    } else if (config.translation?.css) {
        editor.setStyle(config.translation.css);
    }

    // Expose for debugging
    window.gjsEditor = editor;
    console.info('[MiniPress] GrapesJS mounted', { pageId: config.page?.id, locale: config.locale });
});
```

- [ ] **Step 2: Build assets**

```bash
npm run build
```

Expected: succeeds, manifest now has a `resources/js/builder.js` entry.

**Stop here.**

---

## Task 3: Editor route + `edit()` controller action + editor Blade view

**Files:**
- Modify: `app/Http/Controllers/Admin/BuilderPagesController.php`
- Modify: `routes/web.php`
- Create: `resources/views/admin/builder/editor.blade.php`
- Modify: `resources/views/admin/builder/index.blade.php` (link the "Edit" action)

- [ ] **Step 1: Register the edit route**

In `routes/web.php`, inside the `Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(...)` block, add (next to the existing builder routes, before the closing brace):

```php
Route::get('/builder/{id}/edit', [BuilderPagesController::class, 'edit'])->name('builder.edit');
```

- [ ] **Step 2: Add the `edit()` method to BuilderPagesController**

Add this method to `app/Http/Controllers/Admin/BuilderPagesController.php` (alongside the existing `index/create/store/destroy`):

```php
public function edit(int $id, Request $request): View
{
    $page = BuilderPage::query()
        ->with(['translations', 'seo'])
        ->findOrFail($id);

    $defaultLocale = LocaleResolver::defaultCode();
    $locale = $request->query('locale', $defaultLocale);

    // Make sure the requested locale is one of the active codes
    $activeCodes = LocaleResolver::activeCodes();
    if (! in_array($locale, $activeCodes, true)) {
        $locale = $defaultLocale;
    }

    $translation = $page->translationFor($locale)
        ?? $page->translations()->create([
            'locale' => $locale,
            'title' => $page->translations->first()?->title ?? '(untitled)',
            'html' => '',
            'css' => '',
        ]);

    // Ensure each active locale has at least an SEO row stub (so the SEO modal has somewhere to write)
    foreach ($activeCodes as $code) {
        if (! $page->seo->firstWhere('locale', $code)) {
            $page->seo()->create(['locale' => $code]);
        }
    }
    $page->load('seo'); // refresh

    $config = [
        'csrf' => csrf_token(),
        'page' => [
            'id' => $page->id,
            'type' => $page->type,
            'slug' => $page->slug,
            'status' => $page->status,
            'is_homepage' => $page->is_homepage,
        ],
        'locale' => $locale,
        'locales' => $activeCodes,
        'default_locale' => $defaultLocale,
        'translation' => [
            'title' => $translation->title,
            'html' => $translation->html,
            'css' => $translation->css,
            'components' => $translation->components_json,
            'styles' => $translation->styles_json,
        ],
        'seo' => $page->seo->keyBy('locale')->map(fn ($s) => [
            'meta_title' => $s->meta_title,
            'meta_description' => $s->meta_description,
            'meta_keywords' => $s->meta_keywords,
            'og_title' => $s->og_title,
            'og_description' => $s->og_description,
            'og_image' => $s->og_image,
            'canonical_url' => $s->canonical_url,
            'robots' => $s->robots,
            'schema_json' => $s->schema_json,
        ])->toArray(),
        'urls' => [
            'save' => route('admin.builder.update', $page->id),
            'publish' => route('admin.builder.publish', $page->id),
            'upload' => route('admin.builder.upload_asset'),
            'index' => route('admin.builder.index', ['type' => $page->type]),
        ],
    ];

    return view('admin.builder.editor', [
        'page' => $page,
        'config' => $config,
    ]);
}
```

> The route names `admin.builder.update`, `admin.builder.publish`, `admin.builder.upload_asset` are registered in Task 5. Adding `edit()` before those routes exist is fine — `route('admin.builder.update', $id)` will only throw if it's actually called, and `edit()` is only called when an admin clicks "Edit", which won't happen until the full plan is wired. Tests are written after Task 5.

- [ ] **Step 3: Create the editor Blade view**

Create `resources/views/admin/builder/editor.blade.php`:

```blade
@extends('layouts.admin')

@section('content')
<div class="-m-6 h-screen flex flex-col">
    <div class="bg-white border-b px-4 py-2 flex items-center gap-2 text-sm">
        <a href="{{ $config['urls']['index'] }}" class="text-slate-600 hover:underline">← Back to {{ ucfirst($page->type) }}s</a>
        <span class="mx-2 text-slate-300">|</span>
        <span class="font-mono text-slate-700">{{ $page->slug ?? '(' . $page->type . ')' }}</span>
        <span class="ms-2 text-xs px-2 py-0.5 rounded {{ $page->status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700' }}" id="gjs-status-badge">
            {{ $page->status }}
        </span>

        <div class="ms-auto flex items-center gap-2">
            <span id="gjs-save-indicator" class="text-xs text-slate-500"></span>

            <select id="gjs-locale" class="border rounded text-xs px-2 py-1">
                @foreach ($config['locales'] as $code)
                    <option value="{{ $code }}" @selected($code === $config['locale'])>{{ strtoupper($code) }}</option>
                @endforeach
            </select>

            <button id="gjs-settings" type="button" class="text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded">Settings</button>
            <button id="gjs-seo" type="button" class="text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded">SEO</button>

            <button id="gjs-save-draft" type="button" class="text-xs bg-slate-800 text-white hover:bg-slate-700 px-3 py-1 rounded">Save Draft</button>
            <button id="gjs-publish" type="button" class="text-xs bg-emerald-600 text-white hover:bg-emerald-500 px-3 py-1 rounded">Publish</button>
        </div>
    </div>

    <div id="gjs" class="flex-1" data-config='@json($config)'></div>
</div>

{{-- Settings modal --}}
<div id="gjs-settings-modal" class="hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
    <div class="bg-white rounded shadow-xl w-full max-w-md">
        <div class="px-4 py-3 border-b flex items-center justify-between">
            <h3 class="font-semibold">Page Settings</h3>
            <button data-close="gjs-settings-modal" class="text-slate-400 hover:text-slate-700">&times;</button>
        </div>
        <form id="gjs-settings-form" class="p-4 space-y-3 text-sm">
            <div>
                <label class="block mb-1">Title</label>
                <input type="text" name="title" required class="w-full border rounded px-2 py-1">
            </div>
            @if ($page->type === 'page')
                <div>
                    <label class="block mb-1">Slug</label>
                    <input type="text" name="slug" required pattern="^[a-z0-9][a-z0-9-]*$" class="w-full border rounded px-2 py-1 font-mono">
                </div>
                <label class="flex items-center gap-2">
                    <input type="checkbox" name="is_homepage"> Use as homepage
                </label>
            @endif
            <div>
                <label class="block mb-1">Status</label>
                <select name="status" class="w-full border rounded px-2 py-1">
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                </select>
            </div>
            <div class="text-xs text-slate-500" id="gjs-url-preview"></div>
            <div class="flex justify-end gap-2 pt-2">
                <button type="button" data-close="gjs-settings-modal" class="px-3 py-1">Cancel</button>
                <button type="submit" class="bg-slate-900 text-white px-3 py-1 rounded">Apply</button>
            </div>
        </form>
    </div>
</div>

{{-- SEO modal --}}
<div id="gjs-seo-modal" class="hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
    <div class="bg-white rounded shadow-xl w-full max-w-2xl">
        <div class="px-4 py-3 border-b flex items-center justify-between">
            <h3 class="font-semibold">SEO</h3>
            <button data-close="gjs-seo-modal" class="text-slate-400 hover:text-slate-700">&times;</button>
        </div>
        <div class="border-b">
            <nav id="gjs-seo-tabs" class="flex text-sm px-4"></nav>
        </div>
        <form id="gjs-seo-form" class="p-4 space-y-3 text-sm max-h-[60vh] overflow-y-auto">
            {{-- Body is rendered by JS, since fields are bound per-locale --}}
        </form>
        <div class="px-4 py-3 border-t flex justify-end gap-2">
            <button type="button" data-close="gjs-seo-modal" class="px-3 py-1">Cancel</button>
            <button type="button" id="gjs-seo-apply" class="bg-slate-900 text-white px-3 py-1 rounded">Apply</button>
        </div>
    </div>
</div>

@push('head')
    @vite(['resources/js/builder.js'])
@endpush
@endsection
```

> **Important Blade idiom:** the `@vite([...])` directive is placed inside a `@push('head')` so it lands in the admin layout's `<head>`. But the admin layout doesn't currently have a `@stack('head')`. We need to add one. See Step 4.

- [ ] **Step 4: Add a `@stack('head')` to the admin layout**

Edit `resources/views/layouts/admin.blade.php`. Inside the `<head>` block, just before the closing `</head>` tag (after the existing `@vite([...])` line), add:

```blade
    @stack('head')
```

This lets any view that extends `layouts.admin` push extra `<head>` content (like the editor's `builder.js` script).

- [ ] **Step 5: Wire the "Edit" link in the index view**

Open `resources/views/admin/builder/index.blade.php`. Find the line:

```blade
<span class="text-slate-400 text-xs">edit comes in Plan 2</span>
```

Replace it with:

```blade
<a href="{{ route('admin.builder.edit', $page->id) }}" class="text-slate-700 hover:underline text-xs">Edit</a>
```

- [ ] **Step 6: Verify the existing tests still pass**

```bash
php artisan test
```

Expected: 47 still pass. The new `edit()` method doesn't have a test yet — that comes in Task 5.

**Stop here.**

---

## Task 4: `uploadAsset()` controller action + storage + tests

**Files:**
- Modify: `app/Http/Controllers/Admin/BuilderPagesController.php`
- Modify: `routes/web.php`
- Create: `tests/Feature/BuilderAdminTest.php` (start it — Task 5 expands it)
- Create: `database/factories/BuilderPageFactory.php`
- Create: `database/factories/BuilderPageTranslationFactory.php`

- [ ] **Step 1: Create the BuilderPage factory**

Create `database/factories/BuilderPageFactory.php`:

```php
<?php

namespace Database\Factories;

use App\Models\BuilderPage;
use Illuminate\Database\Eloquent\Factories\Factory;

class BuilderPageFactory extends Factory
{
    protected $model = BuilderPage::class;

    public function definition(): array
    {
        return [
            'type' => BuilderPage::TYPE_PAGE,
            'slug' => $this->faker->unique()->slug(2),
            'status' => BuilderPage::STATUS_DRAFT,
            'is_homepage' => false,
        ];
    }

    public function published(): static
    {
        return $this->state(['status' => BuilderPage::STATUS_PUBLISHED, 'published_at' => now()]);
    }
}
```

Add `use HasFactory` and the factory annotation to `app/Models/BuilderPage.php`:

```php
use Illuminate\Database\Eloquent\Factories\HasFactory;

class BuilderPage extends Model
{
    /** @use HasFactory<\Database\Factories\BuilderPageFactory> */
    use HasFactory;
    // ... existing code ...
}
```

- [ ] **Step 2: Create the BuilderPageTranslation factory**

Create `database/factories/BuilderPageTranslationFactory.php`:

```php
<?php

namespace Database\Factories;

use App\Models\BuilderPage;
use App\Models\BuilderPageTranslation;
use Illuminate\Database\Eloquent\Factories\Factory;

class BuilderPageTranslationFactory extends Factory
{
    protected $model = BuilderPageTranslation::class;

    public function definition(): array
    {
        return [
            'builder_page_id' => BuilderPage::factory(),
            'locale' => 'en',
            'title' => $this->faker->sentence(3),
            'html' => '<p>'.$this->faker->paragraph().'</p>',
            'css' => '',
        ];
    }
}
```

Add `use HasFactory` to `BuilderPageTranslation` similarly.

- [ ] **Step 3: Register the upload route**

In `routes/web.php`, inside the `admin.builder` group, add:

```php
Route::post('/builder/assets', [BuilderPagesController::class, 'uploadAsset'])->name('builder.upload_asset');
```

- [ ] **Step 4: Write the failing upload test**

Create `tests/Feature/BuilderAdminTest.php`:

```php
<?php

use App\Models\Language;
use App\Models\MediaItem;
use App\Models\User;
use App\Support\LocaleResolver;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->admin = User::factory()->create(['role' => 'admin']);

    LocaleResolver::bustCache();
    Language::create(['name' => 'English', 'code' => 'en', 'is_default' => true]);
    Language::create(['name' => 'Spanish', 'code' => 'es']);
    LocaleResolver::bustCache();

    Storage::fake('public');
});

it('uploadAsset accepts an image and returns a GrapesJS-shaped JSON response', function () {
    $file = UploadedFile::fake()->image('hero.png', 200, 200);

    $resp = $this->actingAs($this->admin)
        ->post(route('admin.builder.upload_asset'), [
            'files' => [$file],
        ], ['Accept' => 'application/json']);

    $resp->assertOk()
        ->assertJsonStructure(['data']);

    expect($resp->json('data'))->toBeArray()->not->toBeEmpty();

    // File exists in public disk
    expect(MediaItem::count())->toBe(1);
    $item = MediaItem::first();
    expect($item->mime_type)->toStartWith('image/');
    Storage::disk('public')->assertExists($item->path);
});

it('uploadAsset rejects non-image files', function () {
    $file = UploadedFile::fake()->create('doc.pdf', 100, 'application/pdf');

    $this->actingAs($this->admin)
        ->post(route('admin.builder.upload_asset'), ['files' => [$file]])
        ->assertSessionHasErrors('files.0');
});

it('uploadAsset rejects oversized files', function () {
    $file = UploadedFile::fake()->image('huge.png')->size(11 * 1024); // 11 MB

    $this->actingAs($this->admin)
        ->post(route('admin.builder.upload_asset'), ['files' => [$file]])
        ->assertSessionHasErrors('files.0');
});

it('uploadAsset requires admin auth', function () {
    $file = UploadedFile::fake()->image('hero.png');

    $this->post(route('admin.builder.upload_asset'), ['files' => [$file]])
        ->assertRedirect('/admin/login');
});
```

- [ ] **Step 5: Confirm failure**

```bash
php artisan test --filter=BuilderAdminTest
```

Expected: 4 failures.

- [ ] **Step 6: Implement `uploadAsset()`**

Add to `BuilderPagesController`:

```php
public function uploadAsset(Request $request): JsonResponse
{
    $request->validate([
        'files'   => ['required', 'array'],
        'files.*' => ['file', 'image', 'max:10240'], // 10 MB
    ]);

    $urls = [];
    foreach ($request->file('files', []) as $file) {
        $path = $file->store('builder-assets', 'public');
        $url = Storage::disk('public')->url($path);

        MediaItem::create([
            'filename' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
            'path' => $path,
            'url' => $url,
            'uploaded_by' => $request->user()?->id,
        ]);

        $urls[] = $url;
    }

    return response()->json(['data' => $urls]);
}
```

Add the imports at the top of the file:

```php
use App\Models\MediaItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
```

- [ ] **Step 7: Run the test**

```bash
php artisan test --filter=BuilderAdminTest
```

Expected: 4 passed.

Full suite:
```bash
php artisan test
```

Expected: 51 passing (47 prior + 4 new).

**Stop here.**

---

## Task 5: `update()` + `publish()` controller actions + tests

**Files:**
- Modify: `app/Http/Controllers/Admin/BuilderPagesController.php`
- Modify: `routes/web.php`
- Extend: `tests/Feature/BuilderAdminTest.php`

- [ ] **Step 1: Register routes**

In `routes/web.php`, inside the admin.builder group:

```php
Route::put('/builder/{id}', [BuilderPagesController::class, 'update'])->name('builder.update');
Route::post('/builder/{id}/publish', [BuilderPagesController::class, 'publish'])->name('builder.publish');
```

- [ ] **Step 2: Append the failing tests**

Append to `tests/Feature/BuilderAdminTest.php`:

```php
use App\Models\BuilderPage;
use App\Models\BuilderPageSeo;
use App\Models\BuilderPageTranslation;

it('update saves translation html/css/components/styles for the requested locale', function () {
    $page = BuilderPage::factory()->create(['type' => 'page', 'slug' => 'updateable']);
    $page->translations()->create(['locale' => 'en', 'title' => 'Old', 'html' => '<p>old</p>', 'css' => '']);
    $page->seo()->create(['locale' => 'en']);

    $resp = $this->actingAs($this->admin)
        ->putJson(route('admin.builder.update', $page->id), [
            'locale' => 'en',
            'title' => 'New Title',
            'slug' => 'updateable',
            'status' => 'draft',
            'is_homepage' => false,
            'html' => '<p>new content</p>',
            'css' => '.hero{color:red}',
            'components_json' => [['type' => 'text', 'content' => 'new content']],
            'styles_json' => [['selectors' => ['.hero'], 'style' => ['color' => 'red']]],
            'seo' => [
                'en' => ['meta_title' => 'New Title — Site', 'robots' => 'index,follow'],
            ],
        ]);

    $resp->assertOk()->assertJson(['ok' => true]);

    $t = $page->fresh()->translationFor('en');
    expect($t->title)->toBe('New Title');
    expect($t->html)->toBe('<p>new content</p>');
    expect($t->css)->toBe('.hero{color:red}');
    expect($t->components_json)->toBe([['type' => 'text', 'content' => 'new content']]);

    expect($page->fresh()->seoFor('en')->meta_title)->toBe('New Title — Site');
});

it('update strips html/head/body wrappers before saving', function () {
    $page = BuilderPage::factory()->create(['type' => 'page', 'slug' => 'sanitize']);
    $page->translations()->create(['locale' => 'en', 'title' => 'X', 'html' => '', 'css' => '']);
    $page->seo()->create(['locale' => 'en']);

    $this->actingAs($this->admin)
        ->putJson(route('admin.builder.update', $page->id), [
            'locale' => 'en',
            'title' => 'X',
            'slug' => 'sanitize',
            'status' => 'draft',
            'is_homepage' => false,
            'html' => '<html><head><title>x</title></head><body><p>kept</p></body></html>',
            'css' => '',
            'seo' => ['en' => []],
        ])->assertOk();

    $html = $page->fresh()->translationFor('en')->html;
    expect($html)->not->toContain('<html')
        ->not->toContain('<head')
        ->not->toContain('<body')
        ->toContain('<p>kept</p>');
});

it('update returns redirect_url when slug changes', function () {
    $page = BuilderPage::factory()->create(['type' => 'page', 'slug' => 'old-slug']);
    $page->translations()->create(['locale' => 'en', 'title' => 'X', 'html' => '', 'css' => '']);
    $page->seo()->create(['locale' => 'en']);

    $resp = $this->actingAs($this->admin)
        ->putJson(route('admin.builder.update', $page->id), [
            'locale' => 'en',
            'title' => 'X',
            'slug' => 'new-slug',
            'status' => 'draft',
            'is_homepage' => false,
            'html' => '',
            'css' => '',
            'seo' => ['en' => []],
        ]);

    $resp->assertOk()->assertJsonPath('redirect_url', route('admin.builder.edit', $page->id) . '?locale=en');
    expect($page->fresh()->slug)->toBe('new-slug');
});

it('update rejects slug taken by another page', function () {
    BuilderPage::factory()->create(['type' => 'page', 'slug' => 'taken']);
    $page = BuilderPage::factory()->create(['type' => 'page', 'slug' => 'mine']);
    $page->translations()->create(['locale' => 'en', 'title' => 'X', 'html' => '', 'css' => '']);
    $page->seo()->create(['locale' => 'en']);

    $this->actingAs($this->admin)
        ->putJson(route('admin.builder.update', $page->id), [
            'locale' => 'en',
            'title' => 'X',
            'slug' => 'taken',
            'status' => 'draft',
            'is_homepage' => false,
            'html' => '',
            'css' => '',
            'seo' => ['en' => []],
        ])->assertStatus(422);
});

it('publish toggles draft -> published and sets published_at on first publish', function () {
    $page = BuilderPage::factory()->create(['type' => 'page', 'slug' => 'pub', 'status' => 'draft', 'published_at' => null]);

    $resp = $this->actingAs($this->admin)
        ->postJson(route('admin.builder.publish', $page->id));

    $resp->assertOk()->assertJsonPath('status', 'published');

    $page->refresh();
    expect($page->status)->toBe('published');
    expect($page->published_at)->not->toBeNull();
});

it('publish toggles published -> draft', function () {
    $page = BuilderPage::factory()->create(['status' => 'published', 'published_at' => now()->subDay()]);

    $resp = $this->actingAs($this->admin)
        ->postJson(route('admin.builder.publish', $page->id));

    $resp->assertOk()->assertJsonPath('status', 'draft');
    expect($page->fresh()->status)->toBe('draft');
});
```

- [ ] **Step 3: Confirm failure**

```bash
php artisan test --filter=BuilderAdminTest
```

Expected: 6 new tests fail.

- [ ] **Step 4: Implement `update()`**

Add to `BuilderPagesController`:

```php
public function update(int $id, Request $request): JsonResponse
{
    $page = BuilderPage::findOrFail($id);

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
        'components_json' => ['nullable', 'array'],
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

    $slugChanged = ($page->type === BuilderPage::TYPE_PAGE)
        && array_key_exists('slug', $data)
        && $data['slug'] !== $page->slug;

    DB::transaction(function () use ($page, $data) {
        $page->update([
            'slug' => $page->type === BuilderPage::TYPE_PAGE ? ($data['slug'] ?? null) : null,
            'status' => $data['status'],
            'is_homepage' => $data['is_homepage'] ?? false,
            'published_at' => ($data['status'] === BuilderPage::STATUS_PUBLISHED && $page->published_at === null)
                ? now()
                : $page->published_at,
        ]);

        $sanitizedHtml = HtmlSanitizer::stripDocumentWrappers($data['html'] ?? '');

        $page->translations()->updateOrCreate(
            ['locale' => $data['locale']],
            [
                'title' => $data['title'],
                'html' => $sanitizedHtml,
                'css' => $data['css'] ?? '',
                'components_json' => $data['components_json'] ?? null,
                'styles_json' => $data['styles_json'] ?? null,
            ],
        );

        foreach ($data['seo'] ?? [] as $locale => $seoData) {
            $page->seo()->updateOrCreate(
                ['locale' => $locale],
                array_merge(
                    ['robots' => 'index,follow'],
                    array_intersect_key($seoData, array_flip([
                        'meta_title', 'meta_description', 'meta_keywords',
                        'og_title', 'og_description', 'og_image',
                        'canonical_url', 'robots', 'schema_json',
                    ])),
                ),
            );
        }
    });

    $response = [
        'ok' => true,
        'page' => [
            'id' => $page->id,
            'slug' => $page->slug,
            'status' => $page->status,
        ],
    ];

    if ($slugChanged) {
        $response['redirect_url'] = route('admin.builder.edit', $page->id) . '?locale=' . urlencode($data['locale']);
    }

    return response()->json($response);
}
```

Add the import at the top:

```php
use App\Support\HtmlSanitizer;
```

(`DB`, `Rule`, etc. are already imported from Plan 1.)

- [ ] **Step 5: Implement `publish()`**

Add:

```php
public function publish(int $id): JsonResponse
{
    $page = BuilderPage::findOrFail($id);

    $next = $page->status === BuilderPage::STATUS_PUBLISHED
        ? BuilderPage::STATUS_DRAFT
        : BuilderPage::STATUS_PUBLISHED;

    $update = ['status' => $next];
    if ($next === BuilderPage::STATUS_PUBLISHED && $page->published_at === null) {
        $update['published_at'] = now();
    }

    $page->update($update);

    return response()->json([
        'ok' => true,
        'status' => $page->status,
        'published_at' => $page->published_at?->toIso8601String(),
    ]);
}
```

- [ ] **Step 6: Run tests**

```bash
php artisan test --filter=BuilderAdminTest
```

Expected: 10 passed (4 upload + 6 update/publish).

Full suite:
```bash
php artisan test
```

Expected: 57 passing (47 prior + 10 new).

**Stop here.**

---

## Task 6: Save flow + auto-save in `builder.js`

**Files:**
- Modify: `resources/js/builder.js`

This task adds the save fetch, debounced auto-save, the Save Draft / Publish buttons, and the "Saving... / Saved" indicator.

- [ ] **Step 1: Extend `builder.js`**

Replace `resources/js/builder.js` with:

```js
import grapesjs from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';

const SAVE_DEBOUNCE_MS = 5000;

document.addEventListener('DOMContentLoaded', () => {
    const mount = document.getElementById('gjs');
    if (!mount) return;

    const config = JSON.parse(mount.dataset.config ?? '{}');

    const editor = grapesjs.init({
        container: '#gjs',
        height: '100%',
        fromElement: false,
        storageManager: false,
        deviceManager: {
            devices: [
                { name: 'Desktop', width: '' },
                { name: 'Tablet', width: '768px', widthMedia: '992px' },
                { name: 'Mobile', width: '375px', widthMedia: '480px' },
            ],
        },
        canvas: {
            scripts: ['https://cdn.tailwindcss.com'],
        },
    });

    // Initial content
    if (config.translation?.components) {
        editor.setComponents(config.translation.components);
    } else if (config.translation?.html) {
        editor.setComponents(config.translation.html);
    }
    if (config.translation?.styles) {
        editor.setStyle(config.translation.styles);
    } else if (config.translation?.css) {
        editor.setStyle(config.translation.css);
    }

    // ----- Save state -----
    const state = {
        currentLocale: config.locale,
        currentTitle: config.translation?.title ?? '(untitled)',
        currentSlug: config.page?.slug ?? null,
        currentStatus: config.page?.status ?? 'draft',
        isHomepage: !!config.page?.is_homepage,
        seo: { ...config.seo },
        pending: false,
    };

    const indicator = document.getElementById('gjs-save-indicator');
    const statusBadge = document.getElementById('gjs-status-badge');
    const setIndicator = (text) => { if (indicator) indicator.textContent = text; };

    async function save({ statusOverride } = {}) {
        setIndicator('Saving…');
        const html = editor.getHtml();
        const css = editor.getCss();
        const components = editor.getComponents().toJSON();
        const styles = editor.getStyle().toJSON();

        const payload = {
            locale: state.currentLocale,
            title: state.currentTitle,
            slug: state.currentSlug,
            status: statusOverride ?? state.currentStatus,
            is_homepage: state.isHomepage,
            html,
            css,
            components_json: components,
            styles_json: styles,
            seo: state.seo,
        };

        try {
            const resp = await fetch(config.urls.save, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': config.csrf,
                },
                body: JSON.stringify(payload),
            });

            if (!resp.ok) {
                if (resp.status === 422) {
                    const body = await resp.json();
                    setIndicator(`Save failed: ${Object.values(body.errors || {}).flat().join(', ')}`);
                } else {
                    setIndicator(`Save failed (${resp.status})`);
                }
                return false;
            }

            const body = await resp.json();
            setIndicator('Saved ✓');
            window.setTimeout(() => setIndicator(''), 2000);

            if (body.redirect_url) {
                window.location.href = body.redirect_url;
                return true;
            }

            if (statusOverride) {
                state.currentStatus = statusOverride;
                if (statusBadge) {
                    statusBadge.textContent = statusOverride;
                    statusBadge.className = statusBadge.className.replace(/bg-\S+|text-\S+/g, '');
                    statusBadge.classList.add(
                        statusOverride === 'published' ? 'bg-emerald-100' : 'bg-slate-200',
                        statusOverride === 'published' ? 'text-emerald-800' : 'text-slate-700',
                        'px-2', 'py-0.5', 'rounded', 'text-xs',
                    );
                }
            }
            return true;
        } catch (err) {
            console.error('[MiniPress] save failed', err);
            setIndicator('Save failed (network)');
            return false;
        }
    }

    // ----- Auto-save: debounce on any change -----
    let saveTimer = null;
    const queueAutoSave = () => {
        if (saveTimer) window.clearTimeout(saveTimer);
        setIndicator('Unsaved changes');
        saveTimer = window.setTimeout(() => { save(); saveTimer = null; }, SAVE_DEBOUNCE_MS);
    };
    editor.on('component:add component:remove component:update style:update', queueAutoSave);

    // ----- Toolbar buttons -----
    document.getElementById('gjs-save-draft')?.addEventListener('click', () => save());
    document.getElementById('gjs-publish')?.addEventListener('click', async () => {
        const ok = await save({ statusOverride: 'published' });
        if (ok) setIndicator('Published ✓');
    });

    // ----- Locale switcher -----
    document.getElementById('gjs-locale')?.addEventListener('change', async (e) => {
        const newLocale = e.target.value;
        if (newLocale === state.currentLocale) return;
        const ok = await save();
        if (ok) {
            const url = new URL(window.location.href);
            url.searchParams.set('locale', newLocale);
            window.location.href = url.toString();
        }
    });

    // ----- Modal helpers -----
    bindModal(editor, state, config);

    window.gjsEditor = editor;
    console.info('[MiniPress] editor ready', { pageId: config.page?.id, locale: config.locale });
});

function bindModal(editor, state, config) {
    document.querySelectorAll('[data-close]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.close;
            document.getElementById(id)?.classList.add('hidden');
        });
    });

    // Settings modal
    const settingsBtn = document.getElementById('gjs-settings');
    const settingsModal = document.getElementById('gjs-settings-modal');
    const settingsForm = document.getElementById('gjs-settings-form');
    const urlPreview = document.getElementById('gjs-url-preview');

    settingsBtn?.addEventListener('click', () => {
        if (!settingsForm) return;
        settingsForm.title.value = state.currentTitle;
        if (settingsForm.slug) settingsForm.slug.value = state.currentSlug ?? '';
        if (settingsForm.is_homepage) settingsForm.is_homepage.checked = !!state.isHomepage;
        settingsForm.status.value = state.currentStatus;
        updateUrlPreview();
        settingsModal?.classList.remove('hidden');
    });

    settingsForm?.addEventListener('input', () => {
        if (settingsForm.slug) {
            settingsForm.slug.value = slugify(settingsForm.slug.value);
        }
        updateUrlPreview();
    });

    function updateUrlPreview() {
        if (!urlPreview) return;
        const slug = settingsForm?.slug?.value || '';
        const isHome = !!settingsForm?.is_homepage?.checked;
        const locale = state.currentLocale;
        const localePart = locale === config.default_locale ? '' : `/${locale}`;
        const path = isHome ? `${localePart || '/'}` : `${localePart}/${slug}`;
        urlPreview.textContent = `Will be available at: ${window.location.origin}${path}`;
    }

    settingsForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(settingsForm);
        state.currentTitle = String(fd.get('title') || '').trim();
        if (settingsForm.slug) state.currentSlug = String(fd.get('slug') || '').trim() || null;
        state.currentStatus = String(fd.get('status') || 'draft');
        state.isHomepage = !!fd.get('is_homepage');
        settingsModal?.classList.add('hidden');
    });

    // SEO modal
    const seoBtn = document.getElementById('gjs-seo');
    const seoModal = document.getElementById('gjs-seo-modal');
    const seoTabs = document.getElementById('gjs-seo-tabs');
    const seoForm = document.getElementById('gjs-seo-form');
    const seoApply = document.getElementById('gjs-seo-apply');

    seoBtn?.addEventListener('click', () => {
        if (!seoTabs || !seoForm) return;
        seoTabs.innerHTML = '';
        config.locales.forEach((code, idx) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = code.toUpperCase();
            btn.className = 'px-3 py-2 border-b-2 border-transparent text-slate-600 hover:text-slate-900';
            btn.dataset.locale = code;
            if (idx === 0) btn.classList.add('border-slate-900', 'text-slate-900');
            btn.addEventListener('click', () => switchSeoTab(code));
            seoTabs.appendChild(btn);
        });
        switchSeoTab(config.locales[0]);
        seoModal?.classList.remove('hidden');
    });

    function switchSeoTab(locale) {
        if (!seoTabs || !seoForm) return;
        seoTabs.querySelectorAll('button').forEach(b => b.classList.remove('border-slate-900', 'text-slate-900'));
        const active = seoTabs.querySelector(`[data-locale="${locale}"]`);
        active?.classList.add('border-slate-900', 'text-slate-900');
        seoForm.dataset.activeLocale = locale;
        const s = state.seo[locale] || {};
        seoForm.innerHTML = `
            <div><label class="block mb-1">Meta title</label><input name="meta_title" class="w-full border rounded px-2 py-1" value="${escapeAttr(s.meta_title)}"></div>
            <div><label class="block mb-1">Meta description</label><textarea name="meta_description" rows="2" class="w-full border rounded px-2 py-1">${escapeText(s.meta_description)}</textarea></div>
            <div><label class="block mb-1">Meta keywords</label><input name="meta_keywords" class="w-full border rounded px-2 py-1" value="${escapeAttr(s.meta_keywords)}"></div>
            <div><label class="block mb-1">OG title</label><input name="og_title" class="w-full border rounded px-2 py-1" value="${escapeAttr(s.og_title)}"></div>
            <div><label class="block mb-1">OG description</label><textarea name="og_description" rows="2" class="w-full border rounded px-2 py-1">${escapeText(s.og_description)}</textarea></div>
            <div><label class="block mb-1">OG image URL</label><input name="og_image" class="w-full border rounded px-2 py-1" value="${escapeAttr(s.og_image)}"></div>
            <div><label class="block mb-1">Canonical URL</label><input name="canonical_url" class="w-full border rounded px-2 py-1" value="${escapeAttr(s.canonical_url)}"></div>
            <div><label class="block mb-1">Robots</label>
                <select name="robots" class="w-full border rounded px-2 py-1">
                    <option value="index,follow"  ${s.robots === 'index,follow'   ? 'selected' : ''}>index, follow</option>
                    <option value="noindex,follow"${s.robots === 'noindex,follow' ? 'selected' : ''}>noindex, follow</option>
                    <option value="index,nofollow"${s.robots === 'index,nofollow' ? 'selected' : ''}>index, nofollow</option>
                    <option value="noindex,nofollow"${s.robots === 'noindex,nofollow' ? 'selected' : ''}>noindex, nofollow</option>
                </select>
            </div>
            <div><label class="block mb-1">JSON-LD schema</label><textarea name="schema_json" rows="5" class="w-full border rounded px-2 py-1 font-mono text-xs">${escapeText(s.schema_json ? JSON.stringify(s.schema_json, null, 2) : '')}</textarea></div>
        `;
    }

    seoApply?.addEventListener('click', () => {
        if (!seoForm || !seoTabs) return;
        const locale = seoForm.dataset.activeLocale;
        if (!locale) return;
        const fd = new FormData(seoForm);
        const obj = {};
        for (const [k, v] of fd.entries()) obj[k] = v;
        // schema_json — try to parse JSON; if invalid, alert and abort
        if (obj.schema_json) {
            try { obj.schema_json = JSON.parse(obj.schema_json); }
            catch (e) { alert('JSON-LD schema is invalid JSON: ' + e.message); return; }
        } else {
            obj.schema_json = null;
        }
        state.seo[locale] = { ...(state.seo[locale] || {}), ...obj };
        seoModal?.classList.add('hidden');
    });
}

function slugify(s) {
    return String(s || '')
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

function escapeAttr(s) { return String(s ?? '').replace(/"/g, '&quot;'); }
function escapeText(s) { return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
```

- [ ] **Step 2: Build assets**

```bash
npm run build
```

Expected: succeeds.

- [ ] **Step 3: Manual smoke test (browser)**

Boot the server:

```bash
php artisan serve
```

1. Log in at `/admin/login`.
2. From the page list, click "Edit" on "Welcome to MiniPress".
3. The editor loads with the existing HTML visible on the canvas.
4. Click "Settings" → modal opens with title/slug/status fields prefilled.
5. Click "SEO" → modal opens with EN tab; switch to ES tab.
6. Make any change in the editor canvas. Wait 5s. The indicator should change "Unsaved changes" → "Saving…" → "Saved ✓".
7. Click "Publish" → indicator shows "Saved ✓" → "Published ✓"; status badge flips to green "published".
8. Open `/` in a new tab — the changes are live.

Stop the server.

**Stop here.**

---

## Task 7: Custom blocks (Hero / Two Column / CTA Banner / Feature Grid)

**Files:**
- Create: `resources/js/builder/blocks.js`
- Modify: `resources/js/builder.js` (call `registerBlocks(editor)`)

- [ ] **Step 1: Create `resources/js/builder/blocks.js`**

```js
import grapesjsPresetWebpage from 'grapesjs-preset-webpage';
import grapesjsBlocksBasic from 'grapesjs-blocks-basic';
import grapesjsCustomCode from 'grapesjs-custom-code';
import grapesjsStyleBg from 'grapesjs-style-bg';

export function plugins() {
    return [grapesjsPresetWebpage, grapesjsBlocksBasic, grapesjsCustomCode, grapesjsStyleBg];
}

export function registerBlocks(editor) {
    const bm = editor.BlockManager;

    bm.add('mp-hero', {
        label: 'Hero Section',
        category: 'MiniPress',
        media: '<svg width="44" height="32" viewBox="0 0 44 32" fill="none"><rect x="2" y="2" width="40" height="28" rx="2" fill="#1e3a8a"/><rect x="10" y="10" width="24" height="3" rx="1" fill="white"/><rect x="13" y="16" width="18" height="2" rx="1" fill="#cbd5e1"/></svg>',
        content: `
<section class="bg-slate-900 text-white py-20 px-6 text-center">
  <h1 class="text-4xl md:text-5xl font-bold">Your Headline Here</h1>
  <p class="mt-4 max-w-2xl mx-auto text-slate-300">A short subheading explaining your value proposition.</p>
  <a href="#" class="inline-block mt-8 bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-3 rounded font-semibold">Get Started</a>
</section>`.trim(),
    });

    bm.add('mp-two-col', {
        label: 'Two Column',
        category: 'MiniPress',
        media: '<svg width="44" height="32" viewBox="0 0 44 32" fill="none"><rect x="2" y="6" width="18" height="20" rx="2" fill="#94a3b8"/><rect x="24" y="6" width="18" height="20" rx="2" fill="#cbd5e1"/></svg>',
        content: `
<section class="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto p-8">
  <div>
    <h2 class="text-2xl font-bold mb-2">Left column</h2>
    <p class="text-slate-600">Drop content here.</p>
  </div>
  <div>
    <h2 class="text-2xl font-bold mb-2">Right column</h2>
    <p class="text-slate-600">Drop content here too.</p>
  </div>
</section>`.trim(),
    });

    bm.add('mp-cta', {
        label: 'CTA Banner',
        category: 'MiniPress',
        media: '<svg width="44" height="32" viewBox="0 0 44 32" fill="none"><rect x="2" y="10" width="40" height="12" rx="2" fill="#059669"/><rect x="28" y="14" width="10" height="4" rx="1" fill="white"/></svg>',
        content: `
<section class="bg-emerald-600 text-white py-12 px-6 text-center">
  <h2 class="text-3xl font-bold">Ready to take the next step?</h2>
  <a href="#" class="inline-block mt-6 bg-white text-emerald-700 px-5 py-2 rounded font-semibold hover:bg-slate-100">Contact us</a>
</section>`.trim(),
    });

    bm.add('mp-feature-grid', {
        label: 'Feature Grid',
        category: 'MiniPress',
        media: '<svg width="44" height="32" viewBox="0 0 44 32" fill="none"><rect x="2" y="6" width="11" height="20" rx="2" fill="#cbd5e1"/><rect x="16" y="6" width="11" height="20" rx="2" fill="#cbd5e1"/><rect x="30" y="6" width="11" height="20" rx="2" fill="#cbd5e1"/></svg>',
        content: `
<section class="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto p-8">
  <div class="p-6 border rounded bg-white">
    <div class="text-3xl mb-3">⚡</div>
    <h3 class="font-semibold mb-2">Feature one</h3>
    <p class="text-slate-600 text-sm">Describe the value of this feature in one or two sentences.</p>
  </div>
  <div class="p-6 border rounded bg-white">
    <div class="text-3xl mb-3">🛡️</div>
    <h3 class="font-semibold mb-2">Feature two</h3>
    <p class="text-slate-600 text-sm">Describe the value of this feature in one or two sentences.</p>
  </div>
  <div class="p-6 border rounded bg-white">
    <div class="text-3xl mb-3">🚀</div>
    <h3 class="font-semibold mb-2">Feature three</h3>
    <p class="text-slate-600 text-sm">Describe the value of this feature in one or two sentences.</p>
  </div>
</section>`.trim(),
    });
}
```

- [ ] **Step 2: Wire plugins + blocks in `builder.js`**

In `resources/js/builder.js`, add imports near the top:

```js
import { plugins, registerBlocks } from './builder/blocks.js';
```

In the `grapesjs.init({...})` call, add a `plugins` field after `canvas`:

```js
plugins: plugins(),
pluginsOpts: {
    'grapesjs-preset-webpage': {},
    'grapesjs-blocks-basic': {},
},
```

Right after the `editor` is created (before "Initial content" comment), call:

```js
registerBlocks(editor);
```

- [ ] **Step 3: Build and smoke-test**

```bash
npm run build
```

In the browser, reload the editor. In the left sidebar's Blocks panel, scroll down: under the "MiniPress" category there should be 4 blocks (Hero / Two Column / CTA Banner / Feature Grid). Drag the Hero block onto an empty canvas — it should render with the dark navy background and the CTA button.

**Stop here.**

---

## Task 8: Coloris color pickers + asset manager wiring

**Files:**
- Create: `resources/js/builder/coloris-init.js`
- Modify: `resources/js/builder.js`

- [ ] **Step 1: Create the Coloris helper**

Create `resources/js/builder/coloris-init.js`:

```js
import Coloris from '@melloware/coloris';
import '@melloware/coloris/dist/coloris.css';

let initialized = false;

export function initColoris() {
    if (initialized) return;
    initialized = true;
    Coloris.init();
    Coloris({
        themeMode: 'dark',
        theme: 'pill',
        format: 'hex',
        alpha: false,
        swatches: [
            '#0f172a', '#1e293b', '#475569', '#64748b', '#cbd5e1', '#ffffff',
            '#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#0891b2', '#2563eb', '#7c3aed', '#db2777',
        ],
    });
}

// Re-bind Coloris to any newly-added color inputs whenever GrapesJS re-renders the style panel
export function rebindColorisOnStyleChanges(editor) {
    const apply = () => {
        document.querySelectorAll('.gjs-field input[type="color"]').forEach((input) => {
            if (input.dataset.colorisBound) return;
            input.dataset.colorisBound = '1';
            input.setAttribute('data-coloris', '');
        });
    };

    editor.on('style:property:update style:target', () => window.setTimeout(apply, 50));
    editor.on('load', () => window.setTimeout(apply, 100));
}
```

- [ ] **Step 2: Wire Coloris into the editor**

In `resources/js/builder.js`, add imports:

```js
import { initColoris, rebindColorisOnStyleChanges } from './builder/coloris-init.js';
```

After `registerBlocks(editor);`, add:

```js
initColoris();
rebindColorisOnStyleChanges(editor);
```

- [ ] **Step 3: Wire the asset manager to the upload endpoint**

In `grapesjs.init({...})`, add an `assetManager` field after `deviceManager`:

```js
assetManager: {
    upload: config.urls.upload,
    uploadName: 'files',
    multiUpload: true,
    autoAdd: true,
    headers: {
        'X-CSRF-TOKEN': config.csrf,
        'Accept': 'application/json',
    },
    uploadFile: async (e) => {
        const files = e.dataTransfer ? e.dataTransfer.files : e.target.files;
        const form = new FormData();
        for (const f of files) form.append('files[]', f);
        const resp = await fetch(config.urls.upload, {
            method: 'POST',
            headers: { 'X-CSRF-TOKEN': config.csrf, 'Accept': 'application/json' },
            body: form,
        });
        if (!resp.ok) {
            console.error('[MiniPress] upload failed', resp.status);
            return;
        }
        const body = await resp.json();
        editor.AssetManager.add(body.data || []);
    },
},
```

- [ ] **Step 4: Build and smoke-test**

```bash
npm run build
```

In the browser:
1. Open the editor.
2. Click a styled component (e.g. a heading). In the right Styles panel, find any color picker (e.g. text color). Click — Coloris dark-themed popup with swatches should appear.
3. Click the Assets button in the top-right of the GrapesJS panel. Upload an image via drag/drop. The image should appear in the asset list and be insertable into the canvas. The uploaded file lands in `storage/app/public/builder-assets/` and a row appears in the `media` table.

**Stop here.**

---

## Task 9: Final verification for Plan 2

**Files:** none — verification only.

- [ ] **Step 1: Full test suite**

```bash
php artisan test
```

Expected: 57 passing (47 + 10 new BuilderAdminTest assertions).

- [ ] **Step 2: Build assets**

```bash
npm run build
```

Expected: clean build, no "empty chunk" warning (since builder.js is now non-trivial).

- [ ] **Step 3: End-to-end smoke test**

```bash
php artisan migrate:fresh --seed
php artisan serve
```

In the browser:
1. Visit `/` → seeded English homepage.
2. Visit `/es` → Spanish homepage.
3. Visit `/sitemap.xml` → XML lists both locales.
4. Visit `/admin/login`, log in.
5. From the page list, click "Edit" on Welcome → editor loads.
6. All 4 custom blocks visible in the palette.
7. Drag a Hero, click "Save Draft" → "Saved ✓".
8. Open Settings modal → change title → submit → settings closed.
9. Open SEO modal → switch between EN and ES tabs → enter meta titles → Apply.
10. Click Publish → "Published ✓".
11. Visit `/` (or whatever the homepage URL became) → see the changes live including the meta title in the page source.
12. Upload an image via the asset manager → see file under `storage/app/public/builder-assets/` and a row in `media` table (`php artisan tinker` → `App\Models\MediaItem::count()`).

Stop server.

## Plan 2 Acceptance Criteria

The build is complete when:

1. `php artisan test` is green (57 tests).
2. `npm run build` produces a Vite manifest with the `builder` chunk.
3. From the page list, clicking "Edit" opens the GrapesJS editor with all 4 custom blocks in the palette.
4. Dragging a block + clicking Save Draft → "Saved ✓" toast; reloading the editor preserves the change.
5. Opening the SEO modal, entering a meta title in EN and ES tabs, saving → values appear in the rendered `<title>` and `<meta>` tags on the public URL.
6. Clicking Publish → page accessible to logged-out visitors.
7. Changing the slug → old URL 404s; the editor reloads at the new URL (via the JSON `redirect_url`).
8. Uploading an image lands the file in `storage/app/public/builder-assets/` and creates a `MediaItem` row.
9. Coloris dark-themed popup appears when clicking any color picker in the style panel.

## Handoff to Plan 3

Plan 3 picks up by:
- Building the **Media library admin UI** (grid view, paginated, alt-text editing, deletion). Endpoint `/admin/media/picker` returns JSON for the GrapesJS asset-manager media picker.
- **Users CRUD** (Admin role only — 403 to others). Includes role assignment and self-deletion block.
- **Languages CRUD** (toggle active, set default, change sort order, rename).

The editor and save flow are stable; Plan 3 only adds admin screens around them.
