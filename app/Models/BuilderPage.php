<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BuilderPage extends Model
{
    public const TYPE_PAGE = 'page';
    public const TYPE_HEADER = 'header';
    public const TYPE_FOOTER = 'footer';
    public const TYPES = [self::TYPE_PAGE, self::TYPE_HEADER, self::TYPE_FOOTER];

    public const STATUS_DRAFT = 'draft';
    public const STATUS_PUBLISHED = 'published';

    protected $fillable = [
        'type', 'slug', 'is_homepage', 'status', 'published_at',
    ];

    protected $casts = [
        'is_homepage' => 'bool',
        'published_at' => 'datetime',
    ];

    public function translations(): HasMany
    {
        return $this->hasMany(BuilderPageTranslation::class);
    }

    public function seo(): HasMany
    {
        return $this->hasMany(BuilderPageSeo::class);
    }

    public function translationFor(string $locale, ?string $fallback = null): ?BuilderPageTranslation
    {
        $t = $this->translations->firstWhere('locale', $locale);
        if ($t) {
            return $t;
        }
        if ($fallback !== null) {
            return $this->translations->firstWhere('locale', $fallback);
        }
        return null;
    }

    public function seoFor(string $locale, ?string $fallback = null): ?BuilderPageSeo
    {
        $s = $this->seo->firstWhere('locale', $locale);
        if ($s) {
            return $s;
        }
        if ($fallback !== null) {
            return $this->seo->firstWhere('locale', $fallback);
        }
        return null;
    }

    public function scopePublished(Builder $q): Builder
    {
        return $q->where('status', self::STATUS_PUBLISHED);
    }

    public function scopeType(Builder $q, string $type): Builder
    {
        return $q->where('type', $type);
    }
}
