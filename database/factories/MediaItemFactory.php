<?php

namespace Database\Factories;

use App\Models\MediaItem;
use Illuminate\Database\Eloquent\Factories\Factory;

class MediaItemFactory extends Factory
{
    protected $model = MediaItem::class;

    public function definition(): array
    {
        $name = $this->faker->slug(2) . '.png';
        return [
            'filename' => $name,
            'mime_type' => 'image/png',
            'size' => $this->faker->numberBetween(1000, 500000),
            'path' => "builder-assets/{$name}",
            'url' => "/storage/builder-assets/{$name}",
            'alt_text' => null,
            'uploaded_by' => null,
        ];
    }
}
