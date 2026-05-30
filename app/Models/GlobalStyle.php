<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GlobalStyle extends Model
{
    use HasFactory;

    protected $fillable = ['colors', 'typography'];

    protected $casts = [
        'colors' => 'array',
        'typography' => 'array',
    ];

    /**
     * Get the singleton GlobalStyle row, creating sensible defaults if none exists.
     */
    public static function current(): self
    {
        return static::firstOrCreate(
            ['id' => 1],
            [
                'colors' => self::defaultColors(),
                'typography' => self::defaultTypography(),
            ]
        );
    }

    /** @return array<string, string> */
    public static function defaultColors(): array
    {
        return [
            'primary'    => '#3b82f6',
            'secondary'  => '#1e293b',
            'accent'     => '#10b981',
            'text'       => '#0f172a',
            'background' => '#ffffff',
            'muted'      => '#64748b',
        ];
    }

    /** @return array<string, array<string, string|int>> */
    public static function defaultTypography(): array
    {
        return [
            'h1' => ['font_family' => 'system-ui, -apple-system, sans-serif', 'font_size' => 48, 'font_weight' => 700, 'line_height' => 1.2],
            'h2' => ['font_family' => 'system-ui, -apple-system, sans-serif', 'font_size' => 36, 'font_weight' => 700, 'line_height' => 1.25],
            'h3' => ['font_family' => 'system-ui, -apple-system, sans-serif', 'font_size' => 24, 'font_weight' => 600, 'line_height' => 1.3],
            'body' => ['font_family' => 'system-ui, -apple-system, sans-serif', 'font_size' => 16, 'font_weight' => 400, 'line_height' => 1.6],
        ];
    }
}
