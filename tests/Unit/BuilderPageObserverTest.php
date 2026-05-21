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
