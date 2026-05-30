<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BuilderTemplate extends Model
{
    use HasFactory;

    public const TYPE_SECTION = 'section';
    public const TYPE_PAGE = 'page';

    protected $fillable = [
        'name',
        'type',
        'thumbnail_url',
        'components_json',
        'css',
        'created_by',
        'is_bundled',
    ];

    protected $casts = [
        'components_json' => 'array',
        'is_bundled' => 'boolean',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
