<?php

namespace Database\Factories;

use App\Models\BuilderPage;
use App\Models\BuilderPageTranslation;
use Illuminate\Database\Eloquent\Factories\Factory;

class BuilderPageTranslationFactory extends Factory
{
    protected $model = BuilderPageTranslation::class;

    public function definition(): array
    {
        return [
            'builder_page_id' => BuilderPage::factory(),
            'locale' => 'en',
            'title' => $this->faker->sentence(3),
            'html' => '<p>'.$this->faker->paragraph().'</p>',
            'css' => '',
        ];
    }
}
