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
