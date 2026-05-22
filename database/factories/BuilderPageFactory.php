<?php

namespace Database\Factories;

use App\Models\BuilderPage;
use Illuminate\Database\Eloquent\Factories\Factory;

class BuilderPageFactory extends Factory
{
    protected $model = BuilderPage::class;

    public function definition(): array
    {
        return [
            'type' => BuilderPage::TYPE_PAGE,
            'slug' => $this->faker->unique()->slug(2),
            'status' => BuilderPage::STATUS_DRAFT,
            'is_homepage' => false,
        ];
    }

    public function published(): static
    {
        return $this->state(['status' => BuilderPage::STATUS_PUBLISHED, 'published_at' => now()]);
    }
}
