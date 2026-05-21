<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BuilderPageTranslation extends Model
{
    protected $fillable = [
        'builder_page_id', 'locale', 'title', 'html', 'css', 'components_json', 'styles_json',
    ];

    protected $casts = [
        'components_json' => 'array',
        'styles_json' => 'array',
    ];

    public function page(): BelongsTo
    {
        return $this->belongsTo(BuilderPage::class, 'builder_page_id');
    }
}
