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
