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
