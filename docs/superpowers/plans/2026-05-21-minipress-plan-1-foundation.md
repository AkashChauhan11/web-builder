# MiniPress Plan 1: Foundation, Domain, Admin CRUD, Frontend Rendering

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a working Laravel 12 + Blade CMS skeleton where admins can log in, create/list/delete pages via plain forms (no visual editor yet), and the public site renders the seeded pages with full SEO/hreflang/sitemap support. Plans 2-4 add the GrapesJS editor, media library, user/language CRUD, and test hardening.

**Architecture:**
- Single `builder_pages` table with `type ∈ {page, header, footer}`; per-locale translation and SEO rows.
- Server-rendered Blade for both admin and frontend — no Inertia/Livewire/SPA.
- Session auth via Laravel's built-in `Auth` (no Sanctum/Breeze/Jetstream/Fortify). `EnsureUserIsAdmin` middleware gates `/admin/*`.
- Sitemap and homepage flags backed by observers that bust a single `builder.sitemap.xml` cache key.

**Tech Stack:** PHP 8.2+, Laravel 12, Pest 3, SQLite (tests) / MySQL (prod), Tailwind v4 (admin styling only in this plan), Vite 7.

---

## Scope of Plan 1

Implements **spec milestones 1-4**:
1. Fresh Laravel touch-ups + auth + login Blade + admin middleware + admin layout
2. Migrations + models + observers + `LocaleResolver` + `HtmlSanitizer` + seeders
3. Admin page CRUD (index, create, store, destroy) — no editor yet, just title/slug forms
4. Frontend `PageController` + sitemap + `layouts/app.blade.php`

**Out of scope** (covered by later plans):
- GrapesJS editor mount + auto-save (Plan 2)
- `BuilderPagesController@edit/update/publish/uploadAsset` (Plan 2 — stubs only here)
- Settings/SEO modals, custom blocks, Coloris (Plan 2)
- Media library, Users CRUD, Languages CRUD admin screens (Plan 3)
- Comprehensive test sweep + README (Plan 4)

---

## File Map

### Created
- `app/Http/Middleware/EnsureUserIsAdmin.php`
- `app/Http/Controllers/Admin/AuthController.php`
- `app/Http/Controllers/Admin/BuilderPagesController.php` (subset — only index/create/store/destroy in this plan)
- `app/Http/Controllers/Frontend/PageController.php`
- `app/Http/Controllers/Frontend/SitemapController.php`
- `app/Models/BuilderPage.php`
- `app/Models/BuilderPageTranslation.php`
- `app/Models/BuilderPageSeo.php`
- `app/Models/Language.php`
- `app/Models/MediaItem.php` (minimal — just FK target)
- `app/Observers/BuilderPageObserver.php`
- `app/Observers/BuilderPageTranslationObserver.php`
- `app/Observers/LanguageObserver.php`
- `app/Support/HtmlSanitizer.php`
- `app/Support/LocaleResolver.php`
- `app/Providers/AppServiceProvider.php` (Laravel ships an empty one — we'll edit it; create if missing)
- `database/migrations/*_add_role_to_users_table.php`
- `database/migrations/*_create_languages_table.php`
- `database/migrations/*_create_media_table.php`
- `database/migrations/*_create_builder_pages_table.php`
- `database/migrations/*_create_builder_page_translations_table.php`
- `database/migrations/*_create_builder_page_seo_table.php`
- `database/seeders/LanguagesSeeder.php`
- `database/seeders/AdminUserSeeder.php`
- `database/seeders/PlaceholderPagesSeeder.php`
- `resources/views/layouts/admin.blade.php`
- `resources/views/layouts/app.blade.php`
- `resources/views/admin/auth/login.blade.php`
- `resources/views/admin/builder/index.blade.php`
- `resources/views/admin/builder/create.blade.php`
- `resources/css/app.css` (Tailwind v4 entry)
- `tests/Unit/HtmlSanitizerTest.php`
- `tests/Unit/BuilderPageObserverTest.php`
- `tests/Unit/LanguageObserverTest.php`
- `tests/Feature/AdminAuthTest.php`
- `tests/Feature/BuilderPageCrudTest.php`
- `tests/Feature/PageResolverTest.php`
- `tests/Feature/SitemapTest.php`

### Modified
- `app/Models/User.php` — add `role` to fillable + casts + helper methods
- `routes/web.php` — register all routes
- `bootstrap/app.php` — register `admin` middleware alias
- `database/seeders/DatabaseSeeder.php` — call new seeders
- `package.json` — add `@tailwindcss/vite` is already there; add `vite-plugin-laravel` etc. (already there)
- `vite.config.js` — wire Tailwind v4 + Laravel plugin
- `phpunit.xml` — confirm SQLite `:memory:` for tests
- `.env.example` — set sensible defaults

---

## Conventions for This Plan

- **Migration filenames:** the engineer should use `php artisan make:migration ...` so timestamps are correct. The plan shows the migration **body** and the filename pattern with `*` for the timestamp.
- **Pest 3 syntax** is used throughout; never PHPUnit-style classes.
- **One feature per commit.** Conventional Commits style: `feat:`, `fix:`, `test:`, `chore:`.
- **TDD where it's cheap:** support classes, observers, controllers — write a failing Pest test, then implement.

---

## Task 1: Verify the Laravel skeleton starts cleanly

**Files:** none (sanity check)

- [ ] **Step 1: Run the existing test suite**

```bash
php artisan test
```

Expected: 2 example tests pass (Laravel 12 ships with a default `ExampleTest`). If you get a "no APP_KEY" failure, run `php artisan key:generate` first.

- [ ] **Step 2: Boot the dev server**

```bash
php artisan serve
```

Expected: server listens on `http://127.0.0.1:8000` and `GET /` returns the default welcome page. Stop the server (`Ctrl+C`) before continuing.

- [ ] **Step 3: Confirm SQLite is configured for tests**

Open `phpunit.xml` and confirm these env entries exist inside `<php>`. If `DB_CONNECTION=sqlite` and `DB_DATABASE=:memory:` are missing, add them:

```xml
<env name="DB_CONNECTION" value="sqlite"/>
<env name="DB_DATABASE" value=":memory:"/>
<env name="CACHE_STORE" value="array"/>
<env name="SESSION_DRIVER" value="array"/>
<env name="QUEUE_CONNECTION" value="sync"/>
```

- [ ] **Step 4: Verify the local dev DB**

Confirm `.env` has a working `DB_CONNECTION`. For local dev, SQLite is fine:

```dotenv
DB_CONNECTION=sqlite
```

Make sure `database/database.sqlite` exists:

```bash
test -f database/database.sqlite || touch database/database.sqlite
php artisan migrate
```

Expected: the three default migrations (users, cache, jobs) run cleanly.

- [ ] **Step 5: Commit baseline state**

```bash
git add -A
git commit -m "chore: confirm Laravel 12 skeleton boots with SQLite in-memory tests"
```

---

## Task 2: Add `role` column to users + helper methods

**Files:**
- Create: `database/migrations/*_add_role_to_users_table.php`
- Modify: `app/Models/User.php`
- Test: `tests/Unit/UserRoleTest.php`

- [ ] **Step 1: Write the failing test**

Create `tests/Unit/UserRoleTest.php`:

```php
<?php

use App\Models\User;

uses(Illuminate\Foundation\Testing\RefreshDatabase::class);

it('treats admin as admin/developer/editor', function () {
    $u = User::factory()->create(['role' => 'admin']);
    expect($u->isAdmin())->toBeTrue();
    expect($u->isDeveloper())->toBeFalse();
    expect($u->isEditor())->toBeTrue();
    expect($u->isAdminOrDeveloper())->toBeTrue();
});

it('treats developer as not-admin but editor and admin-or-developer', function () {
    $u = User::factory()->create(['role' => 'developer']);
    expect($u->isAdmin())->toBeFalse();
    expect($u->isDeveloper())->toBeTrue();
    expect($u->isEditor())->toBeTrue();
    expect($u->isAdminOrDeveloper())->toBeTrue();
});

it('treats editor as editor only', function () {
    $u = User::factory()->create(['role' => 'editor']);
    expect($u->isAdmin())->toBeFalse();
    expect($u->isDeveloper())->toBeFalse();
    expect($u->isEditor())->toBeTrue();
    expect($u->isAdminOrDeveloper())->toBeFalse();
});

it('treats unknown roles as not-editor', function () {
    $u = User::factory()->create(['role' => 'guest']);
    expect($u->isEditor())->toBeFalse();
});
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
php artisan test --filter=UserRoleTest
```

Expected: FAIL — column `role` does not exist and methods are undefined.

- [ ] **Step 3: Generate the migration**

```bash
php artisan make:migration add_role_to_users_table --table=users
```

Replace its body with:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('editor')->after('password');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('role');
        });
    }
};
```

- [ ] **Step 4: Update the User model**

Replace `app/Models/User.php` with:

```php
<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isDeveloper(): bool
    {
        return $this->role === 'developer';
    }

    public function isEditor(): bool
    {
        return in_array($this->role, ['admin', 'developer', 'editor'], true);
    }

    public function isAdminOrDeveloper(): bool
    {
        return in_array($this->role, ['admin', 'developer'], true);
    }
}
```

- [ ] **Step 5: Update the User factory**

Edit `database/factories/UserFactory.php` to set a default role. The default factory has a `definition()` method returning an array — add `'role' => 'editor',` to that array:

```php
public function definition(): array
{
    return [
        'name' => fake()->name(),
        'email' => fake()->unique()->safeEmail(),
        'email_verified_at' => now(),
        'password' => static::$password ??= Hash::make('password'),
        'remember_token' => Str::random(10),
        'role' => 'editor',
    ];
}
```

- [ ] **Step 6: Run the test to confirm it passes**

```bash
php artisan test --filter=UserRoleTest
```

Expected: 4 passed.

- [ ] **Step 7: Commit**

```bash
git add app/Models/User.php database/migrations database/factories tests/Unit/UserRoleTest.php
git commit -m "feat: add role column to users with isAdmin/isDeveloper/isEditor helpers"
```

---

## Task 3: HtmlSanitizer support class

**Files:**
- Create: `app/Support/HtmlSanitizer.php`
- Test: `tests/Unit/HtmlSanitizerTest.php`

- [ ] **Step 1: Write the failing test**

Create `tests/Unit/HtmlSanitizerTest.php`:

```php
<?php

use App\Support\HtmlSanitizer;

it('strips html/head/body wrappers but keeps inner content', function () {
    $input = '<html><head><title>x</title></head><body><p>Hello</p></body></html>';
    $out = HtmlSanitizer::stripDocumentWrappers($input);
    expect($out)->not->toContain('<html')
        ->not->toContain('</html>')
        ->not->toContain('<head')
        ->not->toContain('</head>')
        ->not->toContain('<body')
        ->not->toContain('</body>')
        ->toContain('<p>Hello</p>');
});

it('removes external script tags but keeps inline scripts intact', function () {
    $input = '<p>ok</p><script src="https://evil.example/x.js"></script><script>console.log(1)</script>';
    $out = HtmlSanitizer::stripDocumentWrappers($input);
    expect($out)->not->toContain('evil.example')
        ->toContain('<p>ok</p>')
        ->toContain('console.log(1)');
});

it('is idempotent on already-clean fragments', function () {
    $clean = '<section><h1>Hi</h1><p>World</p></section>';
    expect(HtmlSanitizer::stripDocumentWrappers($clean))->toBe($clean);
});

it('handles attributes on wrapper tags', function () {
    $input = '<html lang="en"><body class="x" data-y="1"><div>kept</div></body></html>';
    $out = HtmlSanitizer::stripDocumentWrappers($input);
    expect($out)
        ->not->toContain('<html')
        ->not->toContain('<body')
        ->toContain('<div>kept</div>');
});
```

- [ ] **Step 2: Run to confirm fail**

```bash
php artisan test --filter=HtmlSanitizerTest
```

Expected: FAIL — class not found.

- [ ] **Step 3: Implement HtmlSanitizer**

Create `app/Support/HtmlSanitizer.php`:

```php
<?php

namespace App\Support;

class HtmlSanitizer
{
    public static function stripDocumentWrappers(string $html): string
    {
        $patterns = [
            '#<html\b[^>]*>#i',
            '#</html\s*>#i',
            '#<head\b[^>]*>.*?</head\s*>#is',
            '#<body\b[^>]*>#i',
            '#</body\s*>#i',
            '#<script\b[^>]*\bsrc\s*=\s*["\'][^"\']*["\'][^>]*>\s*</script\s*>#is',
            '#<script\b[^>]*\bsrc\s*=\s*["\'][^"\']*["\'][^>]*/\s*>#is',
        ];

        return preg_replace($patterns, '', $html);
    }
}
```

> **Note:** `<head>` is stripped entirely (tag + inner contents). `<html>` and `<body>` only have their tags removed; inner content is preserved.

- [ ] **Step 4: Run the test**

```bash
php artisan test --filter=HtmlSanitizerTest
```

Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add app/Support/HtmlSanitizer.php tests/Unit/HtmlSanitizerTest.php
git commit -m "feat: add HtmlSanitizer for stripping document wrappers and external scripts"
```

---

## Task 4: Languages table + Language model + observer

**Files:**
- Create: `database/migrations/*_create_languages_table.php`
- Create: `app/Models/Language.php`
- Create: `app/Observers/LanguageObserver.php`
- Test: `tests/Unit/LanguageObserverTest.php`

- [ ] **Step 1: Generate migration**

```bash
php artisan make:migration create_languages_table
```

Replace body:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('languages', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code', 8)->unique();
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('languages');
    }
};
```

- [ ] **Step 2: Create the model**

Create `app/Models/Language.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Language extends Model
{
    protected $fillable = ['name', 'code', 'is_default', 'is_active', 'sort_order'];

    protected $casts = [
        'is_default' => 'bool',
        'is_active' => 'bool',
        'sort_order' => 'int',
    ];

    public static function default(): ?self
    {
        return static::where('is_default', true)->first();
    }

    /** @return array<int,string> */
    public static function activeCodes(): array
    {
        return static::where('is_active', true)
            ->orderBy('sort_order')
            ->pluck('code')
            ->all();
    }

    /** @return array<int,string> */
    public static function nonDefaultActiveCodes(): array
    {
        return static::where('is_active', true)
            ->where('is_default', false)
            ->orderBy('sort_order')
            ->pluck('code')
            ->all();
    }
}
```

- [ ] **Step 3: Write the failing observer test**

Create `tests/Unit/LanguageObserverTest.php`:

```php
<?php

use App\Models\Language;

uses(Illuminate\Foundation\Testing\RefreshDatabase::class);

it('clears is_default on other rows when a language is set as default', function () {
    $en = Language::create(['name' => 'English', 'code' => 'en', 'is_default' => true]);
    $es = Language::create(['name' => 'Spanish', 'code' => 'es', 'is_default' => false]);

    $es->update(['is_default' => true]);

    expect($en->fresh()->is_default)->toBeFalse();
    expect($es->fresh()->is_default)->toBeTrue();
});

it('keeps other rows untouched when a non-default save happens', function () {
    $en = Language::create(['name' => 'English', 'code' => 'en', 'is_default' => true]);
    $es = Language::create(['name' => 'Spanish', 'code' => 'es', 'is_default' => false]);

    $es->update(['name' => 'Castellano']);

    expect($en->fresh()->is_default)->toBeTrue();
});
```

- [ ] **Step 4: Run, confirm fail**

```bash
php artisan test --filter=LanguageObserverTest
```

Expected: FAIL — both rows end up with `is_default = true` (no observer yet).

- [ ] **Step 5: Create the observer**

Create `app/Observers/LanguageObserver.php`:

```php
<?php

namespace App\Observers;

use App\Models\Language;
use App\Support\LocaleResolver;

class LanguageObserver
{
    public function saving(Language $language): void
    {
        if ($language->is_default) {
            Language::where('id', '!=', $language->id ?? 0)
                ->where('is_default', true)
                ->update(['is_default' => false]);
        }
    }

    public function saved(Language $language): void
    {
        LocaleResolver::bustCache();
    }

    public function deleted(Language $language): void
    {
        LocaleResolver::bustCache();
    }
}
```

> **Note:** `LocaleResolver` doesn't exist yet — Task 5 creates it. Until then, the observer file will fail to autoload. To avoid breaking the test in this task, temporarily comment out the `LocaleResolver::bustCache()` calls, OR run Task 5 immediately after writing the observer file but before running the test.
>
> The simpler path: write `LocaleResolver` with a no-op `bustCache()` first, then come back. The plan does Task 5 right after this — so just write the LanguageObserver as shown, do Task 5, then run all tests.

- [ ] **Step 6: Register observer in AppServiceProvider (skeleton)**

Open `app/Providers/AppServiceProvider.php` (Laravel 12 ships it). Replace its `boot()` method:

```php
public function boot(): void
{
    \App\Models\Language::observe(\App\Observers\LanguageObserver::class);
}
```

We'll add more observer registrations as we create them.

- [ ] **Step 7: Commit (don't run tests yet — depends on Task 5)**

```bash
git add database/migrations app/Models/Language.php app/Observers/LanguageObserver.php app/Providers/AppServiceProvider.php tests/Unit/LanguageObserverTest.php
git commit -m "feat: add languages table, Language model, and observer enforcing single default"
```

---

## Task 5: LocaleResolver support class

**Files:**
- Create: `app/Support/LocaleResolver.php`
- Test: `tests/Unit/LocaleResolverTest.php`

- [ ] **Step 1: Write the failing test**

Create `tests/Unit/LocaleResolverTest.php`:

```php
<?php

use App\Models\Language;
use App\Support\LocaleResolver;
use Illuminate\Support\Facades\Cache;

uses(Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(fn () => LocaleResolver::bustCache());

it('returns "en" when no language rows exist', function () {
    expect(LocaleResolver::defaultCode())->toBe('en');
});

it('returns the default language code', function () {
    Language::create(['name' => 'Spanish', 'code' => 'es', 'is_default' => true]);
    Language::create(['name' => 'English', 'code' => 'en', 'is_default' => false]);

    expect(LocaleResolver::defaultCode())->toBe('es');
});

it('returns active codes sorted by sort_order', function () {
    Language::create(['name' => 'English', 'code' => 'en', 'is_default' => true, 'is_active' => true, 'sort_order' => 1]);
    Language::create(['name' => 'Spanish', 'code' => 'es', 'is_active' => true, 'sort_order' => 0]);
    Language::create(['name' => 'French', 'code' => 'fr', 'is_active' => false]);

    expect(LocaleResolver::activeCodes())->toBe(['es', 'en']);
});

it('returns non-default active codes only', function () {
    Language::create(['name' => 'English', 'code' => 'en', 'is_default' => true, 'is_active' => true]);
    Language::create(['name' => 'Spanish', 'code' => 'es', 'is_active' => true]);

    expect(LocaleResolver::nonDefaultActiveCodes())->toBe(['es']);
});

it('busts cache on demand', function () {
    Language::create(['name' => 'English', 'code' => 'en', 'is_default' => true]);
    expect(LocaleResolver::defaultCode())->toBe('en');

    // Manually invalidate and change DB without observer
    Language::query()->update(['code' => 'xx']);
    LocaleResolver::bustCache();

    expect(LocaleResolver::defaultCode())->toBe('xx');
});
```

- [ ] **Step 2: Run, confirm fail**

```bash
php artisan test --filter=LocaleResolverTest
```

Expected: FAIL — class not found.

- [ ] **Step 3: Implement LocaleResolver**

Create `app/Support/LocaleResolver.php`:

```php
<?php

namespace App\Support;

use App\Models\Language;
use Illuminate\Support\Facades\Cache;

class LocaleResolver
{
    private const TTL = 300;

    private const CACHE_KEYS = [
        'locale.default',
        'locale.active',
        'locale.non_default_active',
    ];

    public static function defaultCode(): string
    {
        return Cache::remember('locale.default', self::TTL, function () {
            return Language::default()?->code ?? 'en';
        });
    }

    /** @return array<int,string> */
    public static function activeCodes(): array
    {
        return Cache::remember('locale.active', self::TTL, fn () => Language::activeCodes());
    }

    /** @return array<int,string> */
    public static function nonDefaultActiveCodes(): array
    {
        return Cache::remember('locale.non_default_active', self::TTL, fn () => Language::nonDefaultActiveCodes());
    }

    public static function bustCache(): void
    {
        foreach (self::CACHE_KEYS as $key) {
            Cache::forget($key);
        }
    }
}
```

- [ ] **Step 4: Run both this test and the language observer test**

```bash
php artisan test --filter=LocaleResolverTest
php artisan test --filter=LanguageObserverTest
```

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add app/Support/LocaleResolver.php tests/Unit/LocaleResolverTest.php
git commit -m "feat: add LocaleResolver with 5-minute cache and bustCache hook"
```

---

## Task 6: Media table + MediaItem model (minimal)

> Even though Plan 3 builds out the media library, Plan 1 needs the table because `media.uploaded_by` references `users.id` and `BuilderPagesController@uploadAsset` (built later) writes rows. We create the table + model now to keep migrations linear.

**Files:**
- Create: `database/migrations/*_create_media_table.php`
- Create: `app/Models/MediaItem.php`

- [ ] **Step 1: Generate migration**

```bash
php artisan make:migration create_media_table
```

Replace body:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('media', function (Blueprint $table) {
            $table->id();
            $table->string('filename');
            $table->string('mime_type');
            $table->unsignedBigInteger('size');
            $table->string('path');
            $table->string('url');
            $table->string('alt_text')->nullable();
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('media');
    }
};
```

- [ ] **Step 2: Create the model**

Create `app/Models/MediaItem.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MediaItem extends Model
{
    protected $table = 'media';

    protected $fillable = [
        'filename', 'mime_type', 'size', 'path', 'url', 'alt_text', 'uploaded_by',
    ];

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
```

- [ ] **Step 3: Run migrate to confirm**

```bash
php artisan migrate
```

Expected: `media` table created.

- [ ] **Step 4: Commit**

```bash
git add database/migrations app/Models/MediaItem.php
git commit -m "feat: add media table and MediaItem model"
```

---

## Task 7: builder_pages + builder_page_translations + builder_page_seo migrations

**Files:**
- Create: `database/migrations/*_create_builder_pages_table.php`
- Create: `database/migrations/*_create_builder_page_translations_table.php`
- Create: `database/migrations/*_create_builder_page_seo_table.php`

- [ ] **Step 1: Generate three migrations in this order**

```bash
php artisan make:migration create_builder_pages_table
php artisan make:migration create_builder_page_translations_table
php artisan make:migration create_builder_page_seo_table
```

- [ ] **Step 2: builder_pages body**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('builder_pages', function (Blueprint $table) {
            $table->id();
            $table->string('type')->default('page')->index();
            $table->string('slug')->nullable()->index();
            $table->boolean('is_homepage')->default(false)->index();
            $table->string('status')->default('draft')->index();
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('builder_pages');
    }
};
```

> SQLite doesn't enforce CHECK constraints by default and Laravel doesn't have a portable `enum()` for MySQL+SQLite, so we use `string` and rely on validation + casts. This matches the spec ("enum: page | header | footer") while keeping tests working on SQLite.

- [ ] **Step 3: builder_page_translations body**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('builder_page_translations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('builder_page_id')->constrained('builder_pages')->cascadeOnDelete();
            $table->string('locale', 8)->index();
            $table->string('title');
            $table->longText('html')->nullable();
            $table->longText('css')->nullable();
            $table->json('components_json')->nullable();
            $table->json('styles_json')->nullable();
            $table->timestamps();
            $table->unique(['builder_page_id', 'locale']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('builder_page_translations');
    }
};
```

> `html` and `css` are nullable so an empty page can be created before the editor saves content. The spec lists them as `longText` (not nullable) — but for the create-page flow we need to insert a translation row before any HTML exists. Allowing null here is a pragmatic deviation; the editor will write actual strings on first save.

- [ ] **Step 4: builder_page_seo body**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('builder_page_seo', function (Blueprint $table) {
            $table->id();
            $table->foreignId('builder_page_id')->constrained('builder_pages')->cascadeOnDelete();
            $table->string('locale', 8)->index();
            $table->string('meta_title')->nullable();
            $table->text('meta_description')->nullable();
            $table->string('meta_keywords')->nullable();
            $table->string('og_title')->nullable();
            $table->text('og_description')->nullable();
            $table->string('og_image')->nullable();
            $table->string('canonical_url')->nullable();
            $table->string('robots')->default('index,follow');
            $table->json('schema_json')->nullable();
            $table->timestamps();
            $table->unique(['builder_page_id', 'locale']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('builder_page_seo');
    }
};
```

- [ ] **Step 5: Run migrate**

```bash
php artisan migrate
```

Expected: 3 tables created.

- [ ] **Step 6: Commit**

```bash
git add database/migrations
git commit -m "feat: add builder_pages, translations, and seo tables"
```

---

## Task 8: BuilderPage / Translation / Seo models

**Files:**
- Create: `app/Models/BuilderPage.php`
- Create: `app/Models/BuilderPageTranslation.php`
- Create: `app/Models/BuilderPageSeo.php`

- [ ] **Step 1: Create BuilderPage**

Create `app/Models/BuilderPage.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BuilderPage extends Model
{
    public const TYPE_PAGE = 'page';
    public const TYPE_HEADER = 'header';
    public const TYPE_FOOTER = 'footer';
    public const TYPES = [self::TYPE_PAGE, self::TYPE_HEADER, self::TYPE_FOOTER];

    public const STATUS_DRAFT = 'draft';
    public const STATUS_PUBLISHED = 'published';

    protected $fillable = [
        'type', 'slug', 'is_homepage', 'status', 'published_at',
    ];

    protected $casts = [
        'is_homepage' => 'bool',
        'published_at' => 'datetime',
    ];

    public function translations(): HasMany
    {
        return $this->hasMany(BuilderPageTranslation::class);
    }

    public function seo(): HasMany
    {
        return $this->hasMany(BuilderPageSeo::class);
    }

    public function translationFor(string $locale, ?string $fallback = null): ?BuilderPageTranslation
    {
        $t = $this->translations->firstWhere('locale', $locale);
        if ($t) {
            return $t;
        }
        if ($fallback !== null) {
            return $this->translations->firstWhere('locale', $fallback);
        }
        return null;
    }

    public function seoFor(string $locale, ?string $fallback = null): ?BuilderPageSeo
    {
        $s = $this->seo->firstWhere('locale', $locale);
        if ($s) {
            return $s;
        }
        if ($fallback !== null) {
            return $this->seo->firstWhere('locale', $fallback);
        }
        return null;
    }

    public function scopePublished(Builder $q): Builder
    {
        return $q->where('status', self::STATUS_PUBLISHED);
    }

    public function scopeType(Builder $q, string $type): Builder
    {
        return $q->where('type', $type);
    }
}
```

- [ ] **Step 2: Create BuilderPageTranslation**

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BuilderPageTranslation extends Model
{
    protected $fillable = [
        'builder_page_id', 'locale', 'title', 'html', 'css', 'components_json', 'styles_json',
    ];

    protected $casts = [
        'components_json' => 'array',
        'styles_json' => 'array',
    ];

    public function page(): BelongsTo
    {
        return $this->belongsTo(BuilderPage::class, 'builder_page_id');
    }
}
```

- [ ] **Step 3: Create BuilderPageSeo**

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BuilderPageSeo extends Model
{
    protected $table = 'builder_page_seo';

    protected $fillable = [
        'builder_page_id', 'locale',
        'meta_title', 'meta_description', 'meta_keywords',
        'og_title', 'og_description', 'og_image',
        'canonical_url', 'robots', 'schema_json',
    ];

    protected $casts = [
        'schema_json' => 'array',
    ];

    public function page(): BelongsTo
    {
        return $this->belongsTo(BuilderPage::class, 'builder_page_id');
    }
}
```

- [ ] **Step 4: Smoke test in Tinker**

```bash
php artisan tinker
```

In tinker:

```php
$p = App\Models\BuilderPage::create(['type' => 'page', 'slug' => 'about', 'status' => 'published']);
$p->translations()->create(['locale' => 'en', 'title' => 'About Us', 'html' => '<p>Hi</p>', 'css' => '']);
$p->seo()->create(['locale' => 'en', 'meta_title' => 'About Us']);
$p->fresh()->translationFor('en')->title;
// "About Us"
$p->fresh()->seoFor('en')->meta_title;
// "About Us"
exit
```

Expected: both lookups return the seeded values.

- [ ] **Step 5: Commit**

```bash
git add app/Models/BuilderPage.php app/Models/BuilderPageTranslation.php app/Models/BuilderPageSeo.php
git commit -m "feat: add BuilderPage, Translation, Seo models with translationFor/seoFor helpers"
```

---

## Task 9: BuilderPageObserver — homepage uniqueness + sitemap cache

**Files:**
- Create: `app/Observers/BuilderPageObserver.php`
- Create: `app/Observers/BuilderPageTranslationObserver.php`
- Modify: `app/Providers/AppServiceProvider.php`
- Test: `tests/Unit/BuilderPageObserverTest.php`

- [ ] **Step 1: Write the failing test**

Create `tests/Unit/BuilderPageObserverTest.php`:

```php
<?php

use App\Models\BuilderPage;
use Illuminate\Support\Facades\Cache;

uses(Illuminate\Foundation\Testing\RefreshDatabase::class);

it('clears is_homepage on other pages when one is marked homepage', function () {
    $a = BuilderPage::create(['type' => 'page', 'slug' => 'a', 'is_homepage' => true]);
    $b = BuilderPage::create(['type' => 'page', 'slug' => 'b', 'is_homepage' => false]);

    $b->update(['is_homepage' => true]);

    expect($a->fresh()->is_homepage)->toBeFalse();
    expect($b->fresh()->is_homepage)->toBeTrue();
});

it('does not touch is_homepage on header/footer rows', function () {
    $page = BuilderPage::create(['type' => 'page', 'slug' => 'a', 'is_homepage' => true]);
    $header = BuilderPage::create(['type' => 'header', 'is_homepage' => true]);

    $other = BuilderPage::create(['type' => 'page', 'slug' => 'b', 'is_homepage' => true]);

    expect($page->fresh()->is_homepage)->toBeFalse();
    expect($header->fresh()->is_homepage)->toBeTrue();
});

it('busts the sitemap cache when a page is saved', function () {
    Cache::put('builder.sitemap.xml', 'stale', 60);

    BuilderPage::create(['type' => 'page', 'slug' => 'x']);

    expect(Cache::has('builder.sitemap.xml'))->toBeFalse();
});

it('busts the sitemap cache when a page is deleted', function () {
    $p = BuilderPage::create(['type' => 'page', 'slug' => 'x']);
    Cache::put('builder.sitemap.xml', 'stale', 60);

    $p->delete();

    expect(Cache::has('builder.sitemap.xml'))->toBeFalse();
});
```

- [ ] **Step 2: Run, confirm fail**

```bash
php artisan test --filter=BuilderPageObserverTest
```

Expected: FAIL on every test.

- [ ] **Step 3: Create BuilderPageObserver**

Create `app/Observers/BuilderPageObserver.php`:

```php
<?php

namespace App\Observers;

use App\Models\BuilderPage;
use Illuminate\Support\Facades\Cache;

class BuilderPageObserver
{
    public function saving(BuilderPage $page): void
    {
        if ($page->is_homepage && $page->type === BuilderPage::TYPE_PAGE) {
            BuilderPage::query()
                ->where('id', '!=', $page->id ?? 0)
                ->where('type', BuilderPage::TYPE_PAGE)
                ->where('is_homepage', true)
                ->update(['is_homepage' => false]);
        }
    }

    public function saved(BuilderPage $page): void
    {
        Cache::forget('builder.sitemap.xml');
    }

    public function deleted(BuilderPage $page): void
    {
        Cache::forget('builder.sitemap.xml');
    }
}
```

- [ ] **Step 4: Create BuilderPageTranslationObserver**

Create `app/Observers/BuilderPageTranslationObserver.php`:

```php
<?php

namespace App\Observers;

use App\Models\BuilderPageTranslation;
use Illuminate\Support\Facades\Cache;

class BuilderPageTranslationObserver
{
    public function saved(BuilderPageTranslation $t): void
    {
        Cache::forget('builder.sitemap.xml');
    }

    public function deleted(BuilderPageTranslation $t): void
    {
        Cache::forget('builder.sitemap.xml');
    }
}
```

- [ ] **Step 5: Register observers**

Replace `app/Providers/AppServiceProvider.php` `boot()`:

```php
public function boot(): void
{
    \App\Models\Language::observe(\App\Observers\LanguageObserver::class);
    \App\Models\BuilderPage::observe(\App\Observers\BuilderPageObserver::class);
    \App\Models\BuilderPageTranslation::observe(\App\Observers\BuilderPageTranslationObserver::class);
}
```

- [ ] **Step 6: Run the test**

```bash
php artisan test --filter=BuilderPageObserverTest
```

Expected: 4 passed.

- [ ] **Step 7: Commit**

```bash
git add app/Observers app/Providers/AppServiceProvider.php tests/Unit/BuilderPageObserverTest.php
git commit -m "feat: add BuilderPage and Translation observers for homepage uniqueness + sitemap cache"
```

---

## Task 10: Seeders — Languages, Admin user, Placeholder pages

**Files:**
- Create: `database/seeders/LanguagesSeeder.php`
- Create: `database/seeders/AdminUserSeeder.php`
- Create: `database/seeders/PlaceholderPagesSeeder.php`
- Modify: `database/seeders/DatabaseSeeder.php`

- [ ] **Step 1: LanguagesSeeder**

Create `database/seeders/LanguagesSeeder.php`:

```php
<?php

namespace Database\Seeders;

use App\Models\Language;
use Illuminate\Database\Seeder;

class LanguagesSeeder extends Seeder
{
    public function run(): void
    {
        Language::updateOrCreate(
            ['code' => 'en'],
            ['name' => 'English', 'is_default' => true, 'is_active' => true, 'sort_order' => 0],
        );

        Language::updateOrCreate(
            ['code' => 'es'],
            ['name' => 'Spanish', 'is_default' => false, 'is_active' => true, 'sort_order' => 1],
        );
    }
}
```

- [ ] **Step 2: AdminUserSeeder**

Create `database/seeders/AdminUserSeeder.php`:

```php
<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $existing = User::where('email', 'admin@example.test')->first();
        if ($existing) {
            $this->command?->warn('Admin user already exists; skipping.');
            return;
        }

        $password = Str::random(16);
        User::create([
            'name' => 'Admin',
            'email' => 'admin@example.test',
            'password' => Hash::make($password),
            'role' => 'admin',
            'email_verified_at' => now(),
        ]);

        $this->command?->info('=========================================');
        $this->command?->info('Admin user created.');
        $this->command?->info('  Email:    admin@example.test');
        $this->command?->info('  Password: ' . $password);
        $this->command?->info('=========================================');
    }
}
```

- [ ] **Step 3: PlaceholderPagesSeeder**

Create `database/seeders/PlaceholderPagesSeeder.php`:

```php
<?php

namespace Database\Seeders;

use App\Models\BuilderPage;
use Illuminate\Database\Seeder;

class PlaceholderPagesSeeder extends Seeder
{
    public function run(): void
    {
        // Homepage (published)
        $home = BuilderPage::firstOrCreate(
            ['type' => 'page', 'slug' => null, 'is_homepage' => true],
            ['status' => 'published', 'published_at' => now()],
        );

        $home->translations()->updateOrCreate(
            ['locale' => 'en'],
            [
                'title' => 'Welcome to MiniPress',
                'html' => '<section class="p-12 text-center"><h1 class="text-4xl font-bold">Welcome to MiniPress</h1><p class="mt-4">A WordPress-style CMS powered by Laravel + GrapesJS.</p></section>',
                'css' => '',
            ],
        );

        $home->translations()->updateOrCreate(
            ['locale' => 'es'],
            [
                'title' => 'Bienvenido a MiniPress',
                'html' => '<section class="p-12 text-center"><h1 class="text-4xl font-bold">Bienvenido a MiniPress</h1><p class="mt-4">Un CMS estilo WordPress con Laravel + GrapesJS.</p></section>',
                'css' => '',
            ],
        );

        $home->seo()->updateOrCreate(
            ['locale' => 'en'],
            ['meta_title' => 'Welcome — MiniPress', 'meta_description' => 'MiniPress demo homepage.'],
        );

        $home->seo()->updateOrCreate(
            ['locale' => 'es'],
            ['meta_title' => 'Bienvenido — MiniPress', 'meta_description' => 'Página de inicio de demostración.'],
        );

        // Header (published)
        $header = BuilderPage::firstOrCreate(
            ['type' => 'header'],
            ['status' => 'published', 'published_at' => now()],
        );

        $header->translations()->updateOrCreate(
            ['locale' => 'en'],
            [
                'title' => 'Site Header',
                'html' => '<header class="bg-slate-900 text-white p-4"><div class="max-w-5xl mx-auto"><a href="/" class="text-xl font-bold">MiniPress</a></div></header>',
                'css' => '',
            ],
        );

        $header->translations()->updateOrCreate(
            ['locale' => 'es'],
            [
                'title' => 'Encabezado',
                'html' => '<header class="bg-slate-900 text-white p-4"><div class="max-w-5xl mx-auto"><a href="/es" class="text-xl font-bold">MiniPress</a></div></header>',
                'css' => '',
            ],
        );

        // Footer (published)
        $footer = BuilderPage::firstOrCreate(
            ['type' => 'footer'],
            ['status' => 'published', 'published_at' => now()],
        );

        $footer->translations()->updateOrCreate(
            ['locale' => 'en'],
            [
                'title' => 'Site Footer',
                'html' => '<footer class="bg-slate-800 text-slate-300 p-6 text-center"><p>&copy; '.date('Y').' MiniPress</p></footer>',
                'css' => '',
            ],
        );

        $footer->translations()->updateOrCreate(
            ['locale' => 'es'],
            [
                'title' => 'Pie de página',
                'html' => '<footer class="bg-slate-800 text-slate-300 p-6 text-center"><p>&copy; '.date('Y').' MiniPress</p></footer>',
                'css' => '',
            ],
        );
    }
}
```

- [ ] **Step 4: Wire DatabaseSeeder**

Replace `database/seeders/DatabaseSeeder.php`:

```php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            LanguagesSeeder::class,
            AdminUserSeeder::class,
            PlaceholderPagesSeeder::class,
        ]);
    }
}
```

- [ ] **Step 5: Run a clean migrate+seed**

```bash
php artisan migrate:fresh --seed
```

Expected: all tables created; console prints the admin password line; no errors.

- [ ] **Step 6: Commit**

```bash
git add database/seeders
git commit -m "feat: add seeders for languages, admin user (random pw), placeholder pages"
```

---

## Task 11: EnsureUserIsAdmin middleware

**Files:**
- Create: `app/Http/Middleware/EnsureUserIsAdmin.php`
- Modify: `bootstrap/app.php`
- Test: `tests/Feature/AdminAuthTest.php` (first slice)

- [ ] **Step 1: Write the failing feature test**

Create `tests/Feature/AdminAuthTest.php`:

```php
<?php

use App\Models\User;

uses(Illuminate\Foundation\Testing\RefreshDatabase::class);

it('redirects guests away from /admin', function () {
    $this->get('/admin/builder')->assertRedirect('/admin/login');
});

it('rejects non-editor users from /admin/builder', function () {
    $u = User::factory()->create(['role' => 'guest']);
    $this->actingAs($u)->get('/admin/builder')
        ->assertRedirect('/admin/login');
});

it('allows editor through /admin', function () {
    $u = User::factory()->create(['role' => 'editor']);
    $this->actingAs($u)->get('/admin/builder')->assertOk();
});
```

Don't run yet — routes/controller don't exist; we'll wire them in a moment.

- [ ] **Step 2: Create the middleware**

Create `app/Http/Middleware/EnsureUserIsAdmin.php`:

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()) {
            return redirect()->route('admin.login');
        }

        if (! $request->user()->isEditor()) {
            return redirect()->route('admin.login')
                ->withErrors(['email' => 'You do not have permission to access the admin area.']);
        }

        return $next($request);
    }
}
```

- [ ] **Step 3: Register the alias**

Replace `bootstrap/app.php`:

```php
<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'admin' => \App\Http\Middleware\EnsureUserIsAdmin::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
```

- [ ] **Step 4: Commit (test will be run together with Task 12)**

```bash
git add app/Http/Middleware/EnsureUserIsAdmin.php bootstrap/app.php tests/Feature/AdminAuthTest.php
git commit -m "feat: add EnsureUserIsAdmin middleware with admin alias"
```

---

## Task 12: Admin AuthController + login view + routes

**Files:**
- Create: `app/Http/Controllers/Admin/AuthController.php`
- Create: `resources/views/layouts/admin.blade.php`
- Create: `resources/views/admin/auth/login.blade.php`
- Modify: `routes/web.php`

- [ ] **Step 1: Create the controller**

Create `app/Http/Controllers/Admin/AuthController.php`:

```php
<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\View\View;

class AuthController extends Controller
{
    public function showLoginForm(): View|RedirectResponse
    {
        if (Auth::check() && Auth::user()->isEditor()) {
            return redirect()->route('admin.builder.index');
        }

        return view('admin.auth.login');
    }

    public function login(Request $request): RedirectResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        $remember = (bool) $request->boolean('remember');

        if (! Auth::attempt($credentials, $remember)) {
            return back()
                ->withInput($request->only('email'))
                ->withErrors(['email' => 'Invalid credentials.']);
        }

        if (! Auth::user()->isEditor()) {
            Auth::logout();
            return back()
                ->withInput($request->only('email'))
                ->withErrors(['email' => 'Your account is not authorized for the admin area.']);
        }

        $request->session()->regenerate();
        return redirect()->intended(route('admin.builder.index'));
    }

    public function logout(Request $request): RedirectResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('admin.login');
    }
}
```

- [ ] **Step 2: Create admin layout**

Create `resources/views/layouts/admin.blade.php`:

```blade
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ $title ?? 'MiniPress Admin' }}</title>
    @vite(['resources/css/app.css'])
</head>
<body class="bg-slate-100 text-slate-800 min-h-screen">
@auth
    <div class="flex min-h-screen">
        <aside class="w-56 bg-slate-900 text-slate-100 flex flex-col">
            <div class="p-4 text-xl font-bold border-b border-slate-800">MiniPress</div>
            <nav class="flex-1 p-2 space-y-1 text-sm">
                <a href="{{ route('admin.builder.index', ['type' => 'page']) }}" class="block px-3 py-2 rounded hover:bg-slate-800">Pages</a>
                <a href="{{ route('admin.builder.index', ['type' => 'header']) }}" class="block px-3 py-2 rounded hover:bg-slate-800">Headers</a>
                <a href="{{ route('admin.builder.index', ['type' => 'footer']) }}" class="block px-3 py-2 rounded hover:bg-slate-800">Footers</a>
                <div class="border-t border-slate-800 my-2"></div>
                <a href="#" class="block px-3 py-2 rounded text-slate-500 cursor-not-allowed" title="Coming in Plan 3">Media</a>
                <a href="#" class="block px-3 py-2 rounded text-slate-500 cursor-not-allowed" title="Coming in Plan 3">Languages</a>
                <a href="#" class="block px-3 py-2 rounded text-slate-500 cursor-not-allowed" title="Coming in Plan 3">Users</a>
            </nav>
            <div class="p-3 border-t border-slate-800 text-xs text-slate-400">
                <div class="mb-2 truncate">{{ auth()->user()->email }}</div>
                <form method="POST" action="{{ route('admin.logout') }}">
                    @csrf
                    <button type="submit" class="text-slate-200 hover:text-white underline">Log out</button>
                </form>
            </div>
        </aside>

        <main class="flex-1 p-6">
            @if (session('status'))
                <div class="mb-4 rounded bg-green-100 text-green-800 p-3 text-sm">{{ session('status') }}</div>
            @endif
            @if ($errors->any())
                <div class="mb-4 rounded bg-red-100 text-red-800 p-3 text-sm">
                    <ul class="list-disc ms-5">
                        @foreach ($errors->all() as $err)
                            <li>{{ $err }}</li>
                        @endforeach
                    </ul>
                </div>
            @endif

            {{ $slot ?? '' }}
            @yield('content')
        </main>
    </div>
@else
    <div class="min-h-screen flex items-center justify-center p-4">
        {{ $slot ?? '' }}
        @yield('content')
    </div>
@endauth
</body>
</html>
```

- [ ] **Step 3: Create login view**

Create `resources/views/admin/auth/login.blade.php`:

```blade
@extends('layouts.admin')

@section('content')
<div class="w-full max-w-sm bg-white rounded shadow p-6">
    <h1 class="text-xl font-semibold mb-4">MiniPress Sign In</h1>

    @if ($errors->any())
        <div class="mb-3 rounded bg-red-100 text-red-800 p-2 text-sm">
            @foreach ($errors->all() as $err)
                <div>{{ $err }}</div>
            @endforeach
        </div>
    @endif

    <form method="POST" action="{{ route('admin.login.submit') }}" class="space-y-3">
        @csrf
        <div>
            <label class="block text-sm mb-1" for="email">Email</label>
            <input id="email" name="email" type="email" required autofocus
                value="{{ old('email') }}"
                class="w-full border rounded px-3 py-2">
        </div>
        <div>
            <label class="block text-sm mb-1" for="password">Password</label>
            <input id="password" name="password" type="password" required
                class="w-full border rounded px-3 py-2">
        </div>
        <label class="flex items-center gap-2 text-sm">
            <input type="checkbox" name="remember" value="1"> Remember me
        </label>
        <button type="submit" class="w-full bg-slate-900 text-white py-2 rounded hover:bg-slate-700">Sign in</button>
    </form>
</div>
@endsection
```

- [ ] **Step 4: Create the Tailwind entry CSS**

Create `resources/css/app.css`:

```css
@import "tailwindcss";
```

- [ ] **Step 5: Wire Vite**

Open `vite.config.js`, replace with:

```js
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.js'],
            refresh: true,
        }),
        tailwindcss(),
    ],
});
```

- [ ] **Step 6: Create the (stub) JS entry**

Create `resources/js/app.js`:

```js
// MiniPress: admin scripts entry. The GrapesJS builder loads from a separate entry in Plan 2.
```

- [ ] **Step 7: Build assets once**

```bash
npm install
npm run build
```

Expected: `public/build/manifest.json` is generated.

- [ ] **Step 8: Add routes**

Replace `routes/web.php`:

```php
<?php

use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\BuilderPagesController;
use App\Http\Controllers\Frontend\PageController;
use App\Http\Controllers\Frontend\SitemapController;
use Illuminate\Support\Facades\Route;

// ---- Admin auth ----
Route::middleware('guest')->group(function () {
    Route::get('/admin/login', [AuthController::class, 'showLoginForm'])->name('admin.login');
    Route::post('/admin/login', [AuthController::class, 'login'])->name('admin.login.submit');
});

Route::post('/admin/logout', [AuthController::class, 'logout'])
    ->middleware('auth')
    ->name('admin.logout');

// ---- Admin (protected) ----
Route::middleware(['auth', 'admin'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get('/', fn () => redirect()->route('admin.builder.index'));
        Route::get('/builder', [BuilderPagesController::class, 'index'])->name('builder.index');
        Route::get('/builder/create', [BuilderPagesController::class, 'create'])->name('builder.create');
        Route::post('/builder', [BuilderPagesController::class, 'store'])->name('builder.store');
        Route::delete('/builder/{id}', [BuilderPagesController::class, 'destroy'])->name('builder.destroy');
        // edit/update/publish/uploadAsset are added in Plan 2
    });

// ---- Frontend ----
Route::get('/sitemap.xml', [SitemapController::class, 'index'])->name('sitemap');
Route::get('/', [PageController::class, 'show'])->name('home');
Route::get('/{first}', [PageController::class, 'show'])
    ->where('first', '[a-z0-9][a-z0-9-]*')
    ->name('page.one');
Route::get('/{first}/{second}', [PageController::class, 'show'])
    ->where(['first' => '[a-z0-9][a-z0-9-]*', 'second' => '[a-z0-9][a-z0-9-]*'])
    ->name('page.two');
```

> **Note:** the frontend catch-all routes use regex constraints so they don't capture `admin`, `sitemap.xml`, `up` (health check), etc.

- [ ] **Step 9: Commit**

```bash
git add app/Http/Controllers/Admin/AuthController.php resources/views resources/css resources/js vite.config.js routes/web.php
git commit -m "feat: add admin auth controller, login view, admin layout, vite+tailwind wiring"
```

---

## Task 13: BuilderPagesController index + create + store + destroy (no editor)

**Files:**
- Create: `app/Http/Controllers/Admin/BuilderPagesController.php`
- Create: `resources/views/admin/builder/index.blade.php`
- Create: `resources/views/admin/builder/create.blade.php`
- Test: `tests/Feature/BuilderPageCrudTest.php`

- [ ] **Step 1: Write the failing test**

Create `tests/Feature/BuilderPageCrudTest.php`:

```php
<?php

use App\Models\BuilderPage;
use App\Models\BuilderPageSeo;
use App\Models\BuilderPageTranslation;
use App\Models\User;

uses(Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->admin = User::factory()->create(['role' => 'admin']);

    \App\Models\Language::create(['name' => 'English', 'code' => 'en', 'is_default' => true]);
    \App\Models\Language::create(['name' => 'Spanish', 'code' => 'es', 'is_default' => false]);
});

it('lists only pages by default, filtered by type query', function () {
    BuilderPage::create(['type' => 'page', 'slug' => 'about']);
    BuilderPage::create(['type' => 'header']);

    $this->actingAs($this->admin)
        ->get('/admin/builder?type=page')
        ->assertOk()
        ->assertSee('about');

    $this->actingAs($this->admin)
        ->get('/admin/builder?type=header')
        ->assertOk()
        ->assertDontSee('about');
});

it('store creates a page with default-locale translation and seo rows', function () {
    $resp = $this->actingAs($this->admin)->post('/admin/builder', [
        'type' => 'page',
        'slug' => 'about-us',
        'title' => 'About Us',
    ]);

    $page = BuilderPage::where('slug', 'about-us')->first();
    expect($page)->not->toBeNull();
    expect($page->translations()->where('locale', 'en')->count())->toBe(1);
    expect($page->seo()->where('locale', 'en')->count())->toBe(1);
    expect($page->translations->first()->title)->toBe('About Us');
    $resp->assertRedirect();
});

it('store rejects invalid slug format', function () {
    $this->actingAs($this->admin)
        ->post('/admin/builder', ['type' => 'page', 'slug' => 'BAD slug!', 'title' => 'X'])
        ->assertSessionHasErrors('slug');
});

it('store rejects duplicate slug', function () {
    BuilderPage::create(['type' => 'page', 'slug' => 'taken']);

    $this->actingAs($this->admin)
        ->post('/admin/builder', ['type' => 'page', 'slug' => 'taken', 'title' => 'X'])
        ->assertSessionHasErrors('slug');
});

it('store allows header without slug', function () {
    $this->actingAs($this->admin)
        ->post('/admin/builder', ['type' => 'header', 'title' => 'Main Header'])
        ->assertRedirect();

    expect(BuilderPage::where('type', 'header')->count())->toBe(1);
});

it('destroy deletes page and cascades translations and seo', function () {
    $page = BuilderPage::create(['type' => 'page', 'slug' => 'gone']);
    $page->translations()->create(['locale' => 'en', 'title' => 'Gone']);
    $page->seo()->create(['locale' => 'en']);

    $this->actingAs($this->admin)
        ->delete("/admin/builder/{$page->id}")
        ->assertRedirect();

    expect(BuilderPage::find($page->id))->toBeNull();
    expect(BuilderPageTranslation::where('builder_page_id', $page->id)->count())->toBe(0);
    expect(BuilderPageSeo::where('builder_page_id', $page->id)->count())->toBe(0);
});
```

- [ ] **Step 2: Run, confirm fail**

```bash
php artisan test --filter=BuilderPageCrudTest
```

Expected: every test fails (controller doesn't exist).

- [ ] **Step 3: Create the controller (slice for Plan 1 only)**

Create `app/Http/Controllers/Admin/BuilderPagesController.php`:

```php
<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BuilderPage;
use App\Support\LocaleResolver;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\View\View;

class BuilderPagesController extends Controller
{
    public function index(Request $request): View
    {
        $type = $request->query('type', BuilderPage::TYPE_PAGE);
        if (! in_array($type, BuilderPage::TYPES, true)) {
            $type = BuilderPage::TYPE_PAGE;
        }

        $pages = BuilderPage::type($type)
            ->with('translations')
            ->orderByDesc('updated_at')
            ->paginate(25)
            ->withQueryString();

        return view('admin.builder.index', [
            'pages' => $pages,
            'type' => $type,
        ]);
    }

    public function create(Request $request): View
    {
        $type = $request->query('type', BuilderPage::TYPE_PAGE);
        if (! in_array($type, BuilderPage::TYPES, true)) {
            $type = BuilderPage::TYPE_PAGE;
        }

        return view('admin.builder.create', ['type' => $type]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'type' => ['required', Rule::in(BuilderPage::TYPES)],
            'title' => ['required', 'string', 'max:255'],
            'slug' => [
                Rule::requiredIf(fn () => $request->input('type') === BuilderPage::TYPE_PAGE),
                'nullable',
                'string',
                'max:255',
                'regex:/^[a-z0-9][a-z0-9-]*$/',
                Rule::unique('builder_pages', 'slug'),
            ],
        ]);

        $locale = LocaleResolver::defaultCode();

        $page = DB::transaction(function () use ($data, $locale) {
            $page = BuilderPage::create([
                'type' => $data['type'],
                'slug' => $data['type'] === BuilderPage::TYPE_PAGE ? $data['slug'] : null,
                'status' => BuilderPage::STATUS_DRAFT,
            ]);

            $page->translations()->create([
                'locale' => $locale,
                'title' => $data['title'],
                'html' => '',
                'css' => '',
            ]);

            $page->seo()->create([
                'locale' => $locale,
            ]);

            return $page;
        });

        // In Plan 1, redirect back to the index. The editor route is wired in Plan 2.
        return redirect()
            ->route('admin.builder.index', ['type' => $data['type']])
            ->with('status', "Created “{$data['title']}”. Open it from the list to edit.");
    }

    public function destroy(int $id): RedirectResponse
    {
        $page = BuilderPage::findOrFail($id);
        $type = $page->type;
        $page->delete();

        return redirect()
            ->route('admin.builder.index', ['type' => $type])
            ->with('status', 'Deleted.');
    }
}
```

- [ ] **Step 4: Create the index view**

Create `resources/views/admin/builder/index.blade.php`:

```blade
@extends('layouts.admin')

@php
    $labels = ['page' => 'Pages', 'header' => 'Headers', 'footer' => 'Footers'];
@endphp

@section('content')
<div class="bg-white rounded shadow">
    <div class="p-4 border-b flex items-center gap-2">
        <div class="flex gap-1 text-sm">
            @foreach ($labels as $key => $label)
                <a href="{{ route('admin.builder.index', ['type' => $key]) }}"
                    class="px-3 py-1 rounded {{ $type === $key ? 'bg-slate-900 text-white' : 'bg-slate-100 hover:bg-slate-200' }}">
                    {{ $label }}
                </a>
            @endforeach
        </div>
        <div class="ml-auto">
            <a href="{{ route('admin.builder.create', ['type' => $type]) }}"
                class="bg-emerald-600 text-white px-3 py-1.5 rounded text-sm hover:bg-emerald-500">
                New {{ rtrim($labels[$type], 's') }}
            </a>
        </div>
    </div>

    <table class="w-full text-sm">
        <thead class="bg-slate-50 text-left">
            <tr>
                <th class="p-3">Title</th>
                <th class="p-3">Slug</th>
                <th class="p-3">Status</th>
                <th class="p-3">Updated</th>
                <th class="p-3 text-right">Actions</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($pages as $page)
                <tr class="border-t">
                    <td class="p-3">
                        {{ optional($page->translations->first())->title ?? '(no title)' }}
                        @if ($page->is_homepage)
                            <span class="ms-2 text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">homepage</span>
                        @endif
                    </td>
                    <td class="p-3 font-mono text-xs">{{ $page->slug ?? '—' }}</td>
                    <td class="p-3">
                        <span class="text-xs px-2 py-0.5 rounded {{ $page->status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700' }}">
                            {{ $page->status }}
                        </span>
                    </td>
                    <td class="p-3 text-slate-500">{{ $page->updated_at?->diffForHumans() }}</td>
                    <td class="p-3 text-right space-x-2">
                        {{-- Edit lands in Plan 2 --}}
                        <span class="text-slate-400 text-xs">edit comes in Plan 2</span>
                        <form method="POST" action="{{ route('admin.builder.destroy', $page->id) }}" class="inline"
                              onsubmit="return confirm('Delete this {{ $page->type }}? This cascades translations and SEO.');">
                            @csrf
                            @method('DELETE')
                            <button type="submit" class="text-red-600 hover:underline text-xs">Delete</button>
                        </form>
                    </td>
                </tr>
            @empty
                <tr><td colspan="5" class="p-6 text-center text-slate-500">Nothing here yet.</td></tr>
            @endforelse
        </tbody>
    </table>
    <div class="p-3">{{ $pages->links() }}</div>
</div>
@endsection
```

- [ ] **Step 5: Create the create view**

Create `resources/views/admin/builder/create.blade.php`:

```blade
@extends('layouts.admin')

@section('content')
<div class="bg-white rounded shadow max-w-lg p-6">
    <h1 class="text-lg font-semibold mb-4">New {{ ucfirst($type) }}</h1>

    <form method="POST" action="{{ route('admin.builder.store') }}" class="space-y-3">
        @csrf
        <input type="hidden" name="type" value="{{ $type }}">

        <div>
            <label class="block text-sm mb-1" for="title">Title</label>
            <input id="title" name="title" required value="{{ old('title') }}"
                class="w-full border rounded px-3 py-2">
        </div>

        @if ($type === 'page')
            <div>
                <label class="block text-sm mb-1" for="slug">Slug</label>
                <input id="slug" name="slug" required value="{{ old('slug') }}"
                    pattern="^[a-z0-9][a-z0-9-]*$"
                    class="w-full border rounded px-3 py-2 font-mono">
                <p class="text-xs text-slate-500 mt-1">Lowercase letters, digits, and hyphens. Must start with a letter or digit.</p>
            </div>
        @endif

        <div class="flex justify-end gap-2 pt-2">
            <a href="{{ route('admin.builder.index', ['type' => $type]) }}" class="px-3 py-2 text-sm">Cancel</a>
            <button type="submit" class="bg-slate-900 text-white px-4 py-2 rounded text-sm hover:bg-slate-700">Create</button>
        </div>
    </form>
</div>
@endsection
```

- [ ] **Step 6: Add `create` route**

Already added in Task 12, Step 8. Confirm the line `Route::get('/builder/create', ...)->name('builder.create');` is present in `routes/web.php`.

- [ ] **Step 7: Run the test**

```bash
php artisan test --filter=BuilderPageCrudTest
php artisan test --filter=AdminAuthTest
```

Expected: all green.

- [ ] **Step 8: Commit**

```bash
git add app/Http/Controllers/Admin/BuilderPagesController.php resources/views/admin/builder tests/Feature
git commit -m "feat: add admin BuilderPagesController index/create/store/destroy with views"
```

---

## Task 14: Frontend PageController — resolve helper (TDD)

**Files:**
- Create: `app/Http/Controllers/Frontend/PageController.php` (resolve method first; show comes in Task 15)
- Test: `tests/Feature/PageResolverTest.php` (resolve slice)

- [ ] **Step 1: Write the resolve-only test**

Create `tests/Feature/PageResolverTest.php`:

```php
<?php

use App\Http\Controllers\Frontend\PageController;
use App\Models\Language;
use App\Support\LocaleResolver;

uses(Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    LocaleResolver::bustCache();
    Language::create(['name' => 'English', 'code' => 'en', 'is_default' => true]);
    Language::create(['name' => 'Spanish', 'code' => 'es']);
    LocaleResolver::bustCache();
});

it('resolves zero-arg as default locale homepage', function () {
    [$locale, $slug] = (new PageController)->resolve(null, null);
    expect($locale)->toBe('en');
    expect($slug)->toBeNull();
});

it('resolves single non-locale arg as default-locale page slug', function () {
    [$locale, $slug] = (new PageController)->resolve('about', null);
    expect($locale)->toBe('en');
    expect($slug)->toBe('about');
});

it('resolves single locale arg as that locale homepage', function () {
    [$locale, $slug] = (new PageController)->resolve('es', null);
    expect($locale)->toBe('es');
    expect($slug)->toBeNull();
});

it('resolves locale + slug', function () {
    [$locale, $slug] = (new PageController)->resolve('es', 'sobre-nosotros');
    expect($locale)->toBe('es');
    expect($slug)->toBe('sobre-nosotros');
});

it('404s when first arg is not a known locale but two args are given', function () {
    expect(fn () => (new PageController)->resolve('about', 'team'))
        ->toThrow(Symfony\Component\HttpKernel\Exception\NotFoundHttpException::class);
});
```

- [ ] **Step 2: Run, confirm fail**

```bash
php artisan test --filter=PageResolverTest
```

Expected: class not found.

- [ ] **Step 3: Implement PageController.resolve()**

Create `app/Http/Controllers/Frontend/PageController.php`:

```php
<?php

namespace App\Http\Controllers\Frontend;

use App\Http\Controllers\Controller;
use App\Models\BuilderPage;
use App\Support\LocaleResolver;
use Illuminate\Http\Request;
use Illuminate\View\View;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class PageController extends Controller
{
    /**
     * @return array{0:string,1:?string}
     */
    public function resolve(?string $first, ?string $second): array
    {
        $default = LocaleResolver::defaultCode();
        $altLocales = LocaleResolver::nonDefaultActiveCodes();

        // 0 args
        if ($first === null && $second === null) {
            return [$default, null];
        }

        // 1 arg
        if ($second === null) {
            if (in_array($first, $altLocales, true)) {
                return [$first, null];
            }
            return [$default, $first];
        }

        // 2 args
        if (in_array($first, $altLocales, true)) {
            return [$first, $second];
        }

        throw new NotFoundHttpException();
    }

    public function show(Request $request, ?string $first = null, ?string $second = null): View
    {
        // Implementation lands in Task 15.
        throw new NotFoundHttpException();
    }
}
```

- [ ] **Step 4: Run resolve tests**

```bash
php artisan test --filter=PageResolverTest
```

Expected: 5 pass.

- [ ] **Step 5: Commit**

```bash
git add app/Http/Controllers/Frontend/PageController.php tests/Feature/PageResolverTest.php
git commit -m "feat: add PageController.resolve for locale/slug URL disambiguation"
```

---

## Task 15: PageController@show + layouts/app.blade.php

**Files:**
- Modify: `app/Http/Controllers/Frontend/PageController.php`
- Create: `resources/views/layouts/app.blade.php`
- Test: `tests/Feature/PageResolverTest.php` (extend)

- [ ] **Step 1: Extend the test file**

Append to `tests/Feature/PageResolverTest.php`:

```php
it('serves the seeded homepage at /', function () {
    $home = \App\Models\BuilderPage::create([
        'type' => 'page', 'is_homepage' => true, 'status' => 'published', 'published_at' => now(),
    ]);
    $home->translations()->create(['locale' => 'en', 'title' => 'Home', 'html' => '<h1>Home</h1>', 'css' => '']);
    $home->seo()->create(['locale' => 'en', 'meta_title' => 'Home Title']);

    $resp = $this->get('/');
    $resp->assertOk()
        ->assertSee('<h1>Home</h1>', false)
        ->assertSee('<title>Home Title</title>', false);
});

it('serves a slug page at /{slug}', function () {
    $p = \App\Models\BuilderPage::create([
        'type' => 'page', 'slug' => 'about', 'status' => 'published', 'published_at' => now(),
    ]);
    $p->translations()->create(['locale' => 'en', 'title' => 'About', 'html' => '<p>about</p>', 'css' => '']);
    $p->seo()->create(['locale' => 'en']);

    $this->get('/about')->assertOk()->assertSee('about');
});

it('serves a localized homepage at /es', function () {
    $home = \App\Models\BuilderPage::create([
        'type' => 'page', 'is_homepage' => true, 'status' => 'published', 'published_at' => now(),
    ]);
    $home->translations()->create(['locale' => 'en', 'title' => 'Home', 'html' => '<h1>Home</h1>', 'css' => '']);
    $home->translations()->create(['locale' => 'es', 'title' => 'Inicio', 'html' => '<h1>Inicio</h1>', 'css' => '']);
    $home->seo()->create(['locale' => 'en']);
    $home->seo()->create(['locale' => 'es']);

    $this->get('/es')->assertOk()->assertSee('Inicio');
});

it('404s on missing slug', function () {
    $this->get('/missing')->assertNotFound();
});

it('hides drafts from guests', function () {
    $p = \App\Models\BuilderPage::create(['type' => 'page', 'slug' => 'draft', 'status' => 'draft']);
    $p->translations()->create(['locale' => 'en', 'title' => 'Draft', 'html' => '<p>draft</p>', 'css' => '']);
    $p->seo()->create(['locale' => 'en']);

    $this->get('/draft')->assertNotFound();
});

it('shows drafts to authenticated users', function () {
    $user = \App\Models\User::factory()->create(['role' => 'editor']);
    $p = \App\Models\BuilderPage::create(['type' => 'page', 'slug' => 'draft', 'status' => 'draft']);
    $p->translations()->create(['locale' => 'en', 'title' => 'Draft', 'html' => '<p>draft</p>', 'css' => '']);
    $p->seo()->create(['locale' => 'en']);

    $this->actingAs($user)->get('/draft')->assertOk()->assertSee('draft');
});

it('falls back to default locale when requested locale has no translation', function () {
    $home = \App\Models\BuilderPage::create([
        'type' => 'page', 'is_homepage' => true, 'status' => 'published', 'published_at' => now(),
    ]);
    $home->translations()->create(['locale' => 'en', 'title' => 'Home', 'html' => '<h1>English only</h1>', 'css' => '']);
    $home->seo()->create(['locale' => 'en']);

    $this->get('/es')->assertOk()->assertSee('English only');
});

it('emits hreflang alternates for all translations', function () {
    $home = \App\Models\BuilderPage::create([
        'type' => 'page', 'is_homepage' => true, 'status' => 'published', 'published_at' => now(),
    ]);
    $home->translations()->create(['locale' => 'en', 'title' => 'Home', 'html' => 'en', 'css' => '']);
    $home->translations()->create(['locale' => 'es', 'title' => 'Inicio', 'html' => 'es', 'css' => '']);
    $home->seo()->create(['locale' => 'en']);
    $home->seo()->create(['locale' => 'es']);

    $resp = $this->get('/');
    $resp->assertSee('hreflang="en"', false);
    $resp->assertSee('hreflang="es"', false);
});
```

- [ ] **Step 2: Run, confirm fails (many tests)**

```bash
php artisan test --filter=PageResolverTest
```

Expected: new tests fail.

- [ ] **Step 3: Implement show + layout**

Replace `app/Http/Controllers/Frontend/PageController.php`:

```php
<?php

namespace App\Http\Controllers\Frontend;

use App\Http\Controllers\Controller;
use App\Models\BuilderPage;
use App\Support\LocaleResolver;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\View\View;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class PageController extends Controller
{
    /**
     * @return array{0:string,1:?string}
     */
    public function resolve(?string $first, ?string $second): array
    {
        $default = LocaleResolver::defaultCode();
        $altLocales = LocaleResolver::nonDefaultActiveCodes();

        if ($first === null && $second === null) {
            return [$default, null];
        }

        if ($second === null) {
            if (in_array($first, $altLocales, true)) {
                return [$first, null];
            }
            return [$default, $first];
        }

        if (in_array($first, $altLocales, true)) {
            return [$first, $second];
        }

        throw new NotFoundHttpException();
    }

    public function show(Request $request, ?string $first = null, ?string $second = null): View
    {
        [$locale, $slug] = $this->resolve($first, $second);

        $query = BuilderPage::query()
            ->where('type', BuilderPage::TYPE_PAGE)
            ->with(['translations', 'seo']);

        if ($slug === null) {
            $query->where('is_homepage', true);
        } else {
            $query->where('slug', $slug);
        }

        if (! Auth::check()) {
            $query->where('status', BuilderPage::STATUS_PUBLISHED);
        }

        $page = $query->first();
        if (! $page) {
            throw new NotFoundHttpException();
        }

        $default = LocaleResolver::defaultCode();
        $translation = $page->translationFor($locale, $default);
        $seo = $page->seoFor($locale, $default);

        if (! $translation) {
            throw new NotFoundHttpException();
        }

        // Latest published header + footer (with translations for this locale, falling back to default)
        $headerPage = BuilderPage::query()
            ->where('type', BuilderPage::TYPE_HEADER)
            ->published()
            ->with('translations')
            ->orderByDesc('updated_at')
            ->first();
        $header = $headerPage?->translationFor($locale, $default);

        $footerPage = BuilderPage::query()
            ->where('type', BuilderPage::TYPE_FOOTER)
            ->published()
            ->with('translations')
            ->orderByDesc('updated_at')
            ->first();
        $footer = $footerPage?->translationFor($locale, $default);

        // Build hreflang alternates
        $alternates = [];
        foreach ($page->translations as $t) {
            $alternates[] = [
                'locale' => $t->locale,
                'url' => $this->urlFor($t->locale, $page->slug, $default),
            ];
        }

        return view('layouts.app', [
            'page' => $page,
            'translation' => $translation,
            'seo' => $seo,
            'header' => $header,
            'footer' => $footer,
            'locale' => $locale,
            'alternates' => $alternates,
        ]);
    }

    private function urlFor(string $locale, ?string $slug, string $defaultLocale): string
    {
        $segments = [];
        if ($locale !== $defaultLocale) {
            $segments[] = $locale;
        }
        if ($slug !== null) {
            $segments[] = $slug;
        }
        return url('/' . implode('/', $segments));
    }
}
```

- [ ] **Step 4: Create the frontend layout**

Create `resources/views/layouts/app.blade.php`:

```blade
<!doctype html>
<html lang="{{ $locale }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>{{ $seo->meta_title ?? $translation->title }}</title>

    @if ($seo?->meta_description)
        <meta name="description" content="{{ $seo->meta_description }}">
    @endif
    @if ($seo?->meta_keywords)
        <meta name="keywords" content="{{ $seo->meta_keywords }}">
    @endif
    <meta name="robots" content="{{ $seo->robots ?? 'index,follow' }}">

    <link rel="canonical" href="{{ $seo->canonical_url ?? url()->current() }}">

    @foreach ($alternates as $alt)
        <link rel="alternate" hreflang="{{ $alt['locale'] }}" href="{{ $alt['url'] }}">
    @endforeach

    <meta property="og:title" content="{{ $seo->og_title ?? $seo->meta_title ?? $translation->title }}">
    <meta property="og:description" content="{{ $seo->og_description ?? $seo->meta_description }}">
    @if ($seo?->og_image)
        <meta property="og:image" content="{{ $seo->og_image }}">
    @endif
    <meta property="og:url" content="{{ url()->current() }}">

    @if ($seo?->schema_json)
        <script type="application/ld+json">@json($seo->schema_json)</script>
    @endif

    <style>{!! $translation->css ?? '' !!}</style>
    @if ($header)
        <style>{!! $header->css ?? '' !!}</style>
    @endif
    @if ($footer)
        <style>{!! $footer->css ?? '' !!}</style>
    @endif
</head>
<body>
    @if ($header)
        {!! $header->html ?? '' !!}
    @endif

    <main>
        {!! $translation->html ?? '' !!}
    </main>

    @if ($footer)
        {!! $footer->html ?? '' !!}
    @endif
</body>
</html>
```

- [ ] **Step 5: Run all tests**

```bash
php artisan test --filter=PageResolverTest
```

Expected: all 12 pass (5 resolve + 7 show).

- [ ] **Step 6: Manual smoke test**

```bash
php artisan migrate:fresh --seed
php artisan serve
```

In a browser:
- `http://127.0.0.1:8000/` → English homepage, header and footer visible
- `http://127.0.0.1:8000/es` → Spanish homepage

Stop the server.

- [ ] **Step 7: Commit**

```bash
git add app/Http/Controllers/Frontend/PageController.php resources/views/layouts/app.blade.php tests/Feature/PageResolverTest.php
git commit -m "feat: render frontend pages with SEO, hreflang alternates, header, and footer"
```

---

## Task 16: SitemapController + caching

**Files:**
- Create: `app/Http/Controllers/Frontend/SitemapController.php`
- Test: `tests/Feature/SitemapTest.php`

- [ ] **Step 1: Write the failing test**

Create `tests/Feature/SitemapTest.php`:

```php
<?php

use App\Models\BuilderPage;
use App\Models\Language;
use App\Support\LocaleResolver;
use Illuminate\Support\Facades\Cache;

uses(Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    LocaleResolver::bustCache();
    Language::create(['name' => 'English', 'code' => 'en', 'is_default' => true]);
    Language::create(['name' => 'Spanish', 'code' => 'es']);
    LocaleResolver::bustCache();
    Cache::forget('builder.sitemap.xml');
});

it('returns valid XML with content-type application/xml', function () {
    $p = BuilderPage::create(['type' => 'page', 'slug' => 'about', 'status' => 'published', 'published_at' => now()]);
    $p->translations()->create(['locale' => 'en', 'title' => 'About', 'html' => '', 'css' => '']);
    $p->translations()->create(['locale' => 'es', 'title' => 'Sobre', 'html' => '', 'css' => '']);

    $resp = $this->get('/sitemap.xml');
    $resp->assertOk()
        ->assertHeader('Content-Type', 'application/xml; charset=UTF-8');

    expect($resp->getContent())
        ->toContain('<?xml')
        ->toContain('<urlset')
        ->toContain('xmlns:xhtml=')
        ->toContain('<loc>'.url('/about').'</loc>')
        ->toContain('<loc>'.url('/es/about').'</loc>')
        ->toContain('hreflang="en"')
        ->toContain('hreflang="es"');
});

it('excludes draft pages', function () {
    BuilderPage::create(['type' => 'page', 'slug' => 'draft', 'status' => 'draft'])
        ->translations()->create(['locale' => 'en', 'title' => 'Draft', 'html' => '', 'css' => '']);

    $resp = $this->get('/sitemap.xml');
    expect($resp->getContent())->not->toContain('/draft');
});

it('busts cache when a page is saved', function () {
    Cache::put('builder.sitemap.xml', '<stale/>', 3600);

    BuilderPage::create(['type' => 'page', 'slug' => 'fresh', 'status' => 'published', 'published_at' => now()])
        ->translations()->create(['locale' => 'en', 'title' => 'Fresh', 'html' => '', 'css' => '']);

    expect(Cache::has('builder.sitemap.xml'))->toBeFalse();
});

it('uses homepage url when slug is null', function () {
    $home = BuilderPage::create(['type' => 'page', 'is_homepage' => true, 'status' => 'published', 'published_at' => now()]);
    $home->translations()->create(['locale' => 'en', 'title' => 'Home', 'html' => '', 'css' => '']);

    $resp = $this->get('/sitemap.xml');
    expect($resp->getContent())->toContain('<loc>'.url('/').'</loc>');
});
```

- [ ] **Step 2: Run, confirm fail**

```bash
php artisan test --filter=SitemapTest
```

Expected: 404 — route exists but no controller.

- [ ] **Step 3: Implement SitemapController**

Create `app/Http/Controllers/Frontend/SitemapController.php`:

```php
<?php

namespace App\Http\Controllers\Frontend;

use App\Http\Controllers\Controller;
use App\Models\BuilderPage;
use App\Support\LocaleResolver;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Cache;

class SitemapController extends Controller
{
    public function index(): Response
    {
        $xml = Cache::remember('builder.sitemap.xml', 3600, fn () => $this->buildXml());

        return response($xml, 200, ['Content-Type' => 'application/xml; charset=UTF-8']);
    }

    private function buildXml(): string
    {
        $default = LocaleResolver::defaultCode();

        $pages = BuilderPage::query()
            ->where('type', BuilderPage::TYPE_PAGE)
            ->published()
            ->with('translations')
            ->get();

        $lines = [];
        $lines[] = '<?xml version="1.0" encoding="UTF-8"?>';
        $lines[] = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">';

        foreach ($pages as $page) {
            $siblings = [];
            foreach ($page->translations as $t) {
                $siblings[] = [
                    'locale' => $t->locale,
                    'url' => $this->urlFor($t->locale, $page->slug, $default),
                ];
            }

            foreach ($page->translations as $t) {
                $loc = $this->urlFor($t->locale, $page->slug, $default);
                $lastmod = $t->updated_at?->toIso8601String() ?? now()->toIso8601String();
                $lines[] = '  <url>';
                $lines[] = '    <loc>'.htmlspecialchars($loc).'</loc>';
                $lines[] = '    <lastmod>'.htmlspecialchars($lastmod).'</lastmod>';
                foreach ($siblings as $sib) {
                    $lines[] = sprintf(
                        '    <xhtml:link rel="alternate" hreflang="%s" href="%s"/>',
                        htmlspecialchars($sib['locale']),
                        htmlspecialchars($sib['url']),
                    );
                }
                $lines[] = '  </url>';
            }
        }

        $lines[] = '</urlset>';
        return implode("\n", $lines);
    }

    private function urlFor(string $locale, ?string $slug, string $defaultLocale): string
    {
        $segments = [];
        if ($locale !== $defaultLocale) {
            $segments[] = $locale;
        }
        if ($slug !== null) {
            $segments[] = $slug;
        }
        return url('/' . implode('/', $segments));
    }
}
```

- [ ] **Step 4: Run all tests**

```bash
php artisan test
```

Expected: green across the board.

- [ ] **Step 5: Manual smoke test**

```bash
php artisan migrate:fresh --seed
php artisan serve
```

Visit `http://127.0.0.1:8000/sitemap.xml` — confirm XML appears with both English and Spanish URLs for the seeded homepage.

Stop the server.

- [ ] **Step 6: Commit**

```bash
git add app/Http/Controllers/Frontend/SitemapController.php tests/Feature/SitemapTest.php
git commit -m "feat: render sitemap.xml with hreflang alternates and 1-hour cache"
```

---

## Task 17: Final verification + login flow smoke test

**Files:** none — verification only.

- [ ] **Step 1: Reset and seed**

```bash
php artisan migrate:fresh --seed
```

Note the random admin password printed to the console.

- [ ] **Step 2: Boot server**

```bash
php artisan serve
```

- [ ] **Step 3: Smoke test in a browser**

1. Visit `http://127.0.0.1:8000/` → seeded English homepage with header + footer.
2. Visit `/es` → Spanish homepage.
3. Visit `/sitemap.xml` → XML with hreflang for both locales.
4. Visit `/admin/login` → login form.
5. Log in with `admin@example.test` + the printed password → redirect to `/admin/builder`.
6. Click **Pages** tab → see "Welcome to MiniPress".
7. Click **New Page** → fill title `Test Page`, slug `test-page` → submit → redirected to list, new row visible.
8. Visit `/test-page` while logged in → page renders (it's a draft).
9. Log out, visit `/test-page` → 404 (draft hidden from guests).
10. Log back in, delete the test page from the list → confirm it vanishes from the list and `/test-page` 404s.

Stop the server.

- [ ] **Step 4: Run the full test suite one more time**

```bash
php artisan test
```

Expected: all green.

- [ ] **Step 5: Build assets**

```bash
npm run build
```

Expected: `public/build/manifest.json` exists.

- [ ] **Step 6: Commit any straggler changes (none expected)**

```bash
git status
```

Expected: clean working tree. If anything is uncommitted, commit it now with an appropriate message.

---

## Plan 1 Acceptance Criteria

A reviewer should be able to confirm:

1. `php artisan migrate:fresh --seed` runs cleanly and prints a random admin password.
2. `php artisan test` passes (HtmlSanitizerTest, LanguageObserverTest, LocaleResolverTest, BuilderPageObserverTest, UserRoleTest, AdminAuthTest, BuilderPageCrudTest, PageResolverTest, SitemapTest).
3. `npm run build` produces a Vite manifest.
4. `GET /` returns 200 with the seeded English homepage.
5. `GET /es` returns 200 with the seeded Spanish homepage.
6. `GET /sitemap.xml` returns XML with `<xhtml:link rel="alternate" hreflang>` for both locales.
7. `GET /admin/login` shows the login form; valid credentials redirect to `/admin/builder`.
8. From the page list, "New Page" creates a draft and shows it in the table; deleting cascades translations + SEO.
9. Drafts are hidden from guests and visible to authenticated users.
10. Slug uniqueness, regex validation, and homepage uniqueness all enforced.

---

## Handoff to Plan 2

Plan 2 picks up by:
- Adding `grapesjs` + plugins + `@melloware/coloris` to `package.json`.
- Adding `BuilderPagesController@edit/update/publish/uploadAsset` and the editor blade view.
- Building `resources/js/builder.js` with the editor mount, asset manager, custom blocks, Coloris, locale switcher, settings + SEO modals, and auto-save.
- Adding `BuilderAdminTest` covering update/publish flows and `HtmlSanitizer` integration in saves.

The data model, observers, routing scaffolding, and frontend rendering are all done in Plan 1 — Plan 2 only touches the editor and the missing controller actions.
