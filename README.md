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

- No redirects table — slug changes 404 the old URL by design.
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
