<?php

namespace App\Observers;

use App\Models\BuilderPage;
use Illuminate\Support\Facades\Cache;

class BuilderPageObserver
{
    public function saving(BuilderPage $page): void
    {
        if ($page->is_homepage && $page->type === BuilderPage::TYPE_PAGE) {
            BuilderPage::query()
                ->where('id', '!=', $page->id ?? 0)
                ->where('type', BuilderPage::TYPE_PAGE)
                ->where('is_homepage', true)
                ->update(['is_homepage' => false]);
        }
    }

    public function saved(BuilderPage $page): void
    {
        Cache::forget('builder.sitemap.xml');
    }

    public function deleted(BuilderPage $page): void
    {
        Cache::forget('builder.sitemap.xml');
    }
}
