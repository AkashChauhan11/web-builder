<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Language extends Model
{
    protected $fillable = ['name', 'code', 'is_default', 'is_active', 'sort_order'];

    protected $casts = [
        'is_default' => 'bool',
        'is_active' => 'bool',
        'sort_order' => 'int',
    ];

    public static function default(): ?self
    {
        return static::where('is_default', true)->first();
    }

    /** @return array<int,string> */
    public static function activeCodes(): array
    {
        return static::where('is_active', true)
            ->orderBy('sort_order')
            ->pluck('code')
            ->all();
    }

    /** @return array<int,string> */
    public static function nonDefaultActiveCodes(): array
    {
        return static::where('is_active', true)
            ->where('is_default', false)
            ->orderBy('sort_order')
            ->pluck('code')
            ->all();
    }
}
