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
