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
