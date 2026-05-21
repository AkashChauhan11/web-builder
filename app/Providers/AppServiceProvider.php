<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        \App\Models\Language::observe(\App\Observers\LanguageObserver::class);
        \App\Models\BuilderPage::observe(\App\Observers\BuilderPageObserver::class);
        \App\Models\BuilderPageTranslation::observe(\App\Observers\BuilderPageTranslationObserver::class);
    }
}
