<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BuilderPageSeo extends Model
{
    protected $table = 'builder_page_seo';

    protected $fillable = [
        'builder_page_id', 'locale',
        'meta_title', 'meta_description', 'meta_keywords',
        'og_title', 'og_description', 'og_image',
        'canonical_url', 'robots', 'schema_json',
    ];

    protected $casts = [
        'schema_json' => 'array',
    ];

    public function page(): BelongsTo
    {
        return $this->belongsTo(BuilderPage::class, 'builder_page_id');
    }
}
