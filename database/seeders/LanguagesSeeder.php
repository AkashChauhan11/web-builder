<?php

namespace Database\Seeders;

use App\Models\Language;
use Illuminate\Database\Seeder;

class LanguagesSeeder extends Seeder
{
    public function run(): void
    {
        Language::updateOrCreate(
            ['code' => 'en'],
            ['name' => 'English', 'is_default' => true, 'is_active' => true, 'sort_order' => 0],
        );

        Language::updateOrCreate(
            ['code' => 'es'],
            ['name' => 'Spanish', 'is_default' => false, 'is_active' => true, 'sort_order' => 1],
        );
    }
}
