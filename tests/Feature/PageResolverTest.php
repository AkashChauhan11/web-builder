<?php

use App\Http\Controllers\Frontend\PageController;
use App\Models\BuilderPage;
use App\Models\Language;
use App\Models\User;
use App\Support\LocaleResolver;

uses(Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    LocaleResolver::bustCache();
    Language::create(['name' => 'English', 'code' => 'en', 'is_default' => true]);
    Language::create(['name' => 'Spanish', 'code' => 'es']);
    LocaleResolver::bustCache();
});

// ---- resolve() unit-style tests ----

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

// ---- show() integration tests ----

it('serves the seeded homepage at /', function () {
    $home = BuilderPage::create([
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
    $p = BuilderPage::create([
        'type' => 'page', 'slug' => 'about', 'status' => 'published', 'published_at' => now(),
    ]);
    $p->translations()->create(['locale' => 'en', 'title' => 'About', 'html' => '<p>about</p>', 'css' => '']);
    $p->seo()->create(['locale' => 'en']);

    $this->get('/about')->assertOk()->assertSee('about');
});

it('serves a localized homepage at /es', function () {
    $home = BuilderPage::create([
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
    $p = BuilderPage::create(['type' => 'page', 'slug' => 'draft', 'status' => 'draft']);
    $p->translations()->create(['locale' => 'en', 'title' => 'Draft', 'html' => '<p>draft</p>', 'css' => '']);
    $p->seo()->create(['locale' => 'en']);

    $this->get('/draft')->assertNotFound();
});

it('shows drafts to authenticated users', function () {
    $user = User::factory()->create(['role' => 'editor']);
    $p = BuilderPage::create(['type' => 'page', 'slug' => 'draft', 'status' => 'draft']);
    $p->translations()->create(['locale' => 'en', 'title' => 'Draft', 'html' => '<p>draft</p>', 'css' => '']);
    $p->seo()->create(['locale' => 'en']);

    $this->actingAs($user)->get('/draft')->assertOk()->assertSee('draft');
});

it('falls back to default locale when requested locale has no translation', function () {
    $home = BuilderPage::create([
        'type' => 'page', 'is_homepage' => true, 'status' => 'published', 'published_at' => now(),
    ]);
    $home->translations()->create(['locale' => 'en', 'title' => 'Home', 'html' => '<h1>English only</h1>', 'css' => '']);
    $home->seo()->create(['locale' => 'en']);

    $this->get('/es')->assertOk()->assertSee('English only');
});

it('emits hreflang alternates for all translations', function () {
    $home = BuilderPage::create([
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

it('renders page without an SEO row using sensible defaults', function () {
    $home = BuilderPage::create([
        'type' => 'page', 'is_homepage' => true, 'status' => 'published', 'published_at' => now(),
    ]);
    $home->translations()->create([
        'locale' => 'en',
        'title' => 'Page Title Used As Fallback',
        'html' => '<p>body</p>',
        'css' => '',
    ]);
    // NOTE: deliberately no $home->seo()->create(...) — this is the bug scenario.

    $resp = $this->get('/');
    $resp->assertOk()
        ->assertSee('Page Title Used As Fallback', false)  // falls back to translation title in <title>
        ->assertSee('<p>body</p>', false)
        ->assertSee('content="index,follow"', false);       // default robots applied
});
