# MiniPress Plan 4: Test Sweep + README + Final Polish

> **For agentic workers:** Use superpowers:subagent-driven-development. **Git note:** The user handles git themselves — do NOT run `git add` or `git commit`. Stop after each task's checks pass.

**Goal:** Close out the build. Cross-check coverage against spec §15, fill any meaningful gaps, write the README, verify the `composer setup` script runs end-to-end, and confirm all 16 spec acceptance criteria pass.

**Scope:** Spec milestones 11-12 (Pest tests + README), plus a final end-to-end verification pass.

---

## State at Start of Plan 4

- 83 tests passing across all suites
- All 16 admin/frontend features wired and manually verifiable
- Local admin login works
- The GrapesJS editor is functional (browser smoke testing pending from the user)
- Git: ~30+ files modified/untracked across the 3 prior plans (user manages commits)

---

## Task 1: Coverage sweep — fill any genuine gaps

**Files:**
- Maybe: extend existing test files; do NOT add ceremonial tests just to bump count

The spec §15 test list:

| Spec test | Current home | Status |
|---|---|---|
| BuilderAdminTest: index filters by type | `BuilderPageCrudTest` | ✓ |
| BuilderAdminTest: store creates page+translation+SEO | `BuilderPageCrudTest` | ✓ |
| BuilderAdminTest: update saves HTML/CSS/components/styles | `BuilderAdminTest` | ✓ |
| BuilderAdminTest: HTML wrappers stripped | `BuilderAdminTest` (sanitize test) | ✓ |
| BuilderAdminTest: publish toggles + sets published_at | `BuilderAdminTest` | ✓ |
| BuilderAdminTest: destroy cascades | `BuilderPageCrudTest` | ✓ |
| BuilderAdminTest: non-admin 403 on user routes | `UsersCrudTest` | ✓ |
| BuilderAdminTest: guest redirect on /admin/* | `AdminAuthTest` | ✓ |
| PageResolverTest: / serves homepage | `PageResolverTest` | ✓ |
| PageResolverTest: /{slug} serves page | `PageResolverTest` | ✓ |
| PageResolverTest: /es and /es/{slug} | `PageResolverTest` | ✓ |
| PageResolverTest: missing slug 404 | `PageResolverTest` | ✓ |
| PageResolverTest: draft 404/200 logic | `PageResolverTest` | ✓ |
| PageResolverTest: missing translation falls back | `PageResolverTest` | ✓ |
| PageResolverTest: hreflang alternates in HTML | `PageResolverTest` | ✓ |
| SitemapTest: lists every page × translation | `SitemapTest` | ✓ |
| SitemapTest: cache busts on page save | `SitemapTest` | ✓ |
| HtmlSanitizerTest | `HtmlSanitizerTest` | ✓ |
| BuilderPageObserverTest: homepage uniqueness | `BuilderPageObserverTest` | ✓ |
| LanguageObserverTest: default uniqueness | `LanguageObserverTest` | ✓ |

**Conclusion:** every test listed in spec §15 is covered. **Skip adding more tests in this task.** If a gap is found, add the missing test; otherwise, do nothing here and move to Task 2.

- [ ] **Step 1: Re-run the full suite to confirm green baseline**

```bash
php artisan test
```

Expected: 83 passing.

- [ ] **Step 2: Audit `php artisan route:list` and confirm no route is unreachable from tests/UI**

```bash
php artisan route:list --columns=method,uri,name
```

Cross-check that the following named routes exist:
- `admin.login`, `admin.login.submit`, `admin.logout`
- `admin.builder.index`, `.create`, `.store`, `.edit`, `.update`, `.publish`, `.destroy`, `.upload_asset`
- `admin.media.picker`, `admin.media.index`, `.store`, `.update`, `.destroy`
- `admin.users.index`, `.create`, `.store`, `.edit`, `.update`, `.destroy`
- `admin.languages.index`, `.create`, `.store`, `.edit`, `.update`, `.destroy`
- `home`, `page.one`, `page.two`, `sitemap`

If any are missing, add a focused test that exercises it. Otherwise proceed.

- [ ] **Step 3: Delete the vestigial `tests/Feature/ExampleTest.php` and `tests/Unit/ExampleTest.php`**

These are Laravel skeleton placeholders. The first one was modified in Plan 1 to point at `/admin/login` so it kept passing; both should be removed now that the real tests cover everything.

```bash
rm tests/Feature/ExampleTest.php tests/Unit/ExampleTest.php
```

(On Windows PowerShell: `Remove-Item tests/Feature/ExampleTest.php, tests/Unit/ExampleTest.php`)

- [ ] **Step 4: Re-run suite**

```bash
php artisan test
```

Expected: 81 passing (83 − 2 example tests).

**Stop here.**

---

## Task 2: Write the README

**Files:**
- Modify: `README.md` (currently contains the default Laravel marketing copy)

Replace `README.md` with:

```markdown
# MiniPress

A WordPress-style CMS built on **Laravel 12** with a **GrapesJS** visual editor. Plain server-rendered Blade — no Inertia, no Livewire, no SPA frameworks.

## Features

- **Visual editor** — GrapesJS canvas with custom Tailwind blocks (Hero, Two Column, CTA, Feature Grid), live device preview (desktop/tablet/mobile), debounced auto-save.
- **Per-locale content** — `builder_pages` with translation + SEO rows per language. Switch locales without losing work.
- **WordPress concepts**, mapped:
  - Posts/Pages → `builder_pages` rows with `type ∈ {page, header, footer}`
  - The Loop → `Frontend\PageController` resolves `/{locale?}/{slug?}`
  - Theme parts → `type = header` and `type = footer` rows
  - WPML/Polylang → per-locale translations
  - Yoast SEO → per-locale SEO rows (meta/OG/JSON-LD)
- **Auth** — Laravel sessions; three roles (admin / developer / editor). Admin-only user management.
- **Media library** — drag-drop upload, alt-text, JSON picker endpoint for the editor.
- **Sitemap + hreflang** — `/sitemap.xml` lists every published page × translation with hreflang alternates; observer-driven cache invalidation.

## Tech Stack

- PHP 8.2+, Laravel 12
- MySQL 8 / MariaDB 10.6+ in production; SQLite `:memory:` for tests
- Pest 3
- Vite 7 + Tailwind CSS v4 (`@tailwindcss/vite`)
- GrapesJS 0.22 + preset-webpage / blocks-basic / custom-code / style-bg
- Coloris 0.25 for color pickers

## Setup

```bash
composer setup
```

This:
1. Installs PHP and JS dependencies
2. Copies `.env.example` to `.env` and generates an app key
3. Runs migrations + seeders
4. Builds assets

After setup completes, the seeder prints a **random admin password** to the console. Note it — you'll need it to log in. Email is `admin@example.test`.

If you prefer to do the steps manually:

```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
php artisan migrate:fresh --seed
php artisan storage:link
npm run build
```

## Local Dev

```bash
composer dev
```

Runs `php artisan serve`, `php artisan queue:listen`, and `npm run dev` concurrently.

Then:
- Public site: http://127.0.0.1:8000/
- Spanish site: http://127.0.0.1:8000/es
- Sitemap: http://127.0.0.1:8000/sitemap.xml
- Admin: http://127.0.0.1:8000/admin/login

## Running Tests

```bash
composer test
```

Uses SQLite `:memory:` (configured in `phpunit.xml`). Should run in well under 5 seconds.

## Domain Model

- `users` — auth + role (`admin`/`developer`/`editor`)
- `languages` — locales with active/default/sort_order flags
- `builder_pages` — pages, headers, footers (single table, `type` discriminator)
- `builder_page_translations` — per-locale title/html/css/components/styles
- `builder_page_seo` — per-locale meta/og/canonical/robots/JSON-LD
- `media` — uploaded files (filename, mime, size, path, url, alt_text, uploaded_by)

## Architecture Notes

### URL Routing

The frontend uses two catch-all routes after the explicit `/`:
- `GET /{first}` → 1 segment — if it's a known non-default locale, treat as locale homepage; else treat as a default-locale slug
- `GET /{first}/{second}` → 2 segments — first must be a known locale, second is the slug

Admin routes are explicit and registered BEFORE the catch-alls in `routes/web.php`, so route ordering matters.

### Save Flow

The editor sends a single `PUT /admin/builder/{id}` per save, with the entire payload (translation HTML/CSS/components/styles + all locales' SEO rows). The server:
1. Validates against the slug regex and uniqueness rule
2. Wraps the write in a DB transaction
3. Runs the HTML through `HtmlSanitizer::stripDocumentWrappers` (removes `<html>`, `<head>`, `<body>`, and external `<script src="...">`)
4. Upserts the translation by (page_id, locale)
5. Upserts each SEO row by (page_id, locale)
6. Bumps `published_at` if status flipped to `published` for the first time

If the slug changed, the response includes `redirect_url`; the JS reloads the editor at the new URL.

### Caching

- The sitemap is cached for 1 hour under `builder.sitemap.xml`.
- `BuilderPageObserver` and `BuilderPageTranslationObserver` invalidate that key on any save/delete.
- `LocaleResolver` caches default/active language codes for 5 minutes; `LanguageObserver` busts those keys on language save/delete.

### What's Intentionally Missing

- No redirects table — slug changes 404 the old URL by design. If you need redirects, add them at the web-server level or build a separate redirects feature later.
- No Inertia/Livewire/SPA — the admin is server-rendered Blade. The editor is the only client-side-rich page; it loads as a single Vite bundle and does its work entirely in `resources/js/builder.js`.
- No Breeze/Jetstream/Fortify — auth is hand-written (one controller + one middleware) to keep the surface area small.

## Project Structure

```
app/
  Http/
    Controllers/
      Admin/         BuilderPagesController, AuthController, UsersController, LanguagesController, MediaController
      Frontend/      PageController, SitemapController
    Middleware/      EnsureUserIsAdmin
  Models/            User, Language, BuilderPage, BuilderPageTranslation, BuilderPageSeo, MediaItem
  Observers/         BuilderPageObserver, BuilderPageTranslationObserver, LanguageObserver
  Support/           HtmlSanitizer, LocaleResolver
resources/
  js/
    builder.js       Editor entry — mounts GrapesJS, wires save flow + modals
    builder/         blocks.js (4 custom blocks), coloris-init.js
  views/
    admin/           Admin Blade views (auth, builder, media, users, languages)
    layouts/         admin.blade.php (admin shell), app.blade.php (public site)
routes/
  web.php
database/
  migrations/        users role, languages, media, builder_pages + translations + seo
  factories/         User, BuilderPage, BuilderPageTranslation, MediaItem
  seeders/           Languages, AdminUser (random password), PlaceholderPages
tests/
  Feature/           AdminAuth, BuilderPageCrud, BuilderAdmin, PageResolver, Sitemap, MediaCrud, UsersCrud, LanguagesCrud
  Unit/              UserRole, HtmlSanitizer, LocaleResolver, LanguageObserver, BuilderPageObserver
docs/superpowers/plans/   Implementation plans (1-4)
```

## License

MIT.
```

- [ ] **Step 1: Replace `README.md`**

Use the above text verbatim. (The current README.md is the default Laravel marketing copy; this fully replaces it.)

- [ ] **Step 2: Confirm tests still pass**

```bash
php artisan test
```

Expected: 81 passing (no impact — only README changed).

**Stop here.**

---

## Task 3: Verify `composer setup` runs end-to-end

**Files:**
- Maybe: tweak `composer.json` scripts

The current `composer.json` `scripts.setup` is:

```json
"setup": [
    "composer install",
    "@php -r \"file_exists('.env') || copy('.env.example', '.env');\"",
    "@php artisan key:generate",
    "@php artisan migrate --force",
    "npm install",
    "npm run build"
]
```

The spec wants `setup` to also run seeders. Update to:

```json
"setup": [
    "composer install",
    "@php -r \"file_exists('.env') || copy('.env.example', '.env');\"",
    "@php artisan key:generate",
    "@php artisan migrate --force --seed",
    "npm install",
    "@php artisan storage:link",
    "npm run build"
]
```

Changes:
- `migrate --force` → `migrate --force --seed` (so the random admin password gets printed)
- Added `php artisan storage:link` (the media library + builder uploads need this)

- [ ] **Step 1: Apply the `composer.json` change**

Replace the existing `setup` script block in `composer.json` with the version above.

- [ ] **Step 2: Verify the script syntactically**

```bash
composer validate
```

Expected: `./composer.json is valid` (with possibly a "License is not a recognized SPDX license" warning — ignore it).

- [ ] **Step 3: (Optional) Dry-run setup**

This would wipe the local DB and reseed. Only run if you're OK with that:

```bash
composer setup
```

Expected: every step succeeds and the seeder prints a fresh admin password.

If you'd rather not wipe local data, skip this step and just verify the JSON is syntactically valid.

**Stop here.**

---

## Task 4: Final end-to-end acceptance pass

**Files:** none — verification only.

Cross-check all 16 acceptance criteria from spec §17:

| # | Criterion | How to verify | Expected |
|---|---|---|---|
| 1 | `php artisan migrate --seed` runs cleanly | `php artisan migrate:fresh --seed` | clean run + admin pw printed |
| 2 | `php artisan test` fully green | `php artisan test` | 81 passing |
| 3 | `npm run build` produces a Vite manifest | `npm run build && cat public/build/manifest.json` | builder + css chunks present |
| 4 | `GET /` returns 200 and renders EN homepage | curl `/` | 200 + "Welcome to MiniPress" |
| 5 | `GET /es` returns 200 and renders ES homepage | curl `/es` | 200 + "Bienvenido" |
| 6 | `GET /sitemap.xml` returns valid XML with hreflang | curl `/sitemap.xml` | 200 + xhtml:link + hreflang |
| 7 | `GET /admin/login` shows form; valid creds → `/admin/builder` | curl + cookie session | 200 + login form; 302 to builder after login |
| 8 | "New Page" opens editor with 4 blocks | manual browser test | editor + MiniPress block category |
| 9 | Drag a block + Save Draft → "Saved" + persists on reload | manual browser test | toast + content persists |
| 10 | SEO modal: EN+ES meta titles → values appear on public URL | manual browser test | `<title>` matches |
| 11 | Publish → page accessible to logged-out visitors | curl after publish | 200 not 404 |
| 12 | Slug change → old URL 404s, new URL works | curl both | 404 / 200 |
| 13 | Image upload → file in `storage/app/public/builder-assets/` + `media` row | upload via editor + `php artisan tinker` | file exists + MediaItem count = 1 |
| 14 | Editor role can edit pages but 403 on `/admin/users` | manual browser test | 200 / 403 |
| 15 | Deleting page cascades translations + SEO rows | covered by `BuilderPageCrudTest` | test passes |
| 16 | Setting second page's `is_homepage = true` clears first | covered by `BuilderPageObserverTest` | test passes |

- [ ] **Step 1: Reset, seed, test, build**

```bash
php artisan migrate:fresh --seed
php artisan test
npm run build
```

- [ ] **Step 2: HTTP smoke for endpoints (criteria 4-7, 11, 12)**

Boot `php artisan serve` in background, run the curl/PowerShell checks per the table. Stop server.

- [ ] **Step 3: Manual browser smoke for editor-dependent criteria (8-10, 13, 14)**

These need a real browser. Walk through them in order. If any fails, report it as DONE_WITH_CONCERNS.

- [ ] **Step 4: Report**

Produce a checklist with ✓/✗ for each of the 16 criteria. Note the admin password for convenience.

## Plan 4 Acceptance Criteria

The build is complete when all 16 criteria above pass, the README is current, and the `composer setup` script works end-to-end.

## After Plan 4

The MiniPress build is feature-complete per the original spec. Suggested next steps (not in scope):

- **CI**: add `.github/workflows/ci.yml` running `php artisan test` and `npm run build` on PR
- **Linting**: configure Pint + ESLint
- **Auth hardening**: rate-limit login attempts, password reset flow
- **Media**: add image thumbnail generation (Intervention Image)
- **Editor**: add undo/redo affordances, version history
- **Multi-tenancy**: scope pages by tenant if needed
