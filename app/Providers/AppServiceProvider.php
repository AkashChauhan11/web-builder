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

        // Register built-in shortcodes for {site_name}, {year}, {today}, {user_email}
        \App\Support\Shortcodes\CoreShortcodes::register();

        // Share the current GlobalStyle singleton with the public layout + the editor.
        // Skipped during console (migrations/seeders) since the table may not exist yet.
        \Illuminate\Support\Facades\View::composer(
            ['layouts.app', 'admin.builder.editor'],
            function ($view) {
                if (! $this->app->runningInConsole() && \Illuminate\Support\Facades\Schema::hasTable('global_styles')) {
                    $view->with('globalStyle', \App\Models\GlobalStyle::current());
                }
            }
        );
    }
}
