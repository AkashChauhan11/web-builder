<?php

use App\Models\BuilderPage;
use App\Models\BuilderPageSeo;
use App\Models\BuilderPageTranslation;
use App\Models\Language;
use App\Models\User;
use App\Support\LocaleResolver;

uses(Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->admin = User::factory()->create(['role' => 'admin']);

    LocaleResolver::bustCache();
    Language::create(['name' => 'English', 'code' => 'en', 'is_default' => true]);
    Language::create(['name' => 'Spanish', 'code' => 'es', 'is_default' => false]);
    LocaleResolver::bustCache();
});

it('lists only pages by default, filtered by type query', function () {
    $page = BuilderPage::create(['type' => 'page', 'slug' => 'about']);
    $page->translations()->create(['locale' => 'en', 'title' => 'About Page']);

    $header = BuilderPage::create(['type' => 'header']);
    $header->translations()->create(['locale' => 'en', 'title' => 'Main Header']);

    $this->actingAs($this->admin)
        ->get('/admin/builder?type=page')
        ->assertOk()
        ->assertSee('About Page');

    $this->actingAs($this->admin)
        ->get('/admin/builder?type=header')
        ->assertOk()
        ->assertSee('Main Header');
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
