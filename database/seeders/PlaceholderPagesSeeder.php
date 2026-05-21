<?php

namespace Database\Seeders;

use App\Models\BuilderPage;
use Illuminate\Database\Seeder;

class PlaceholderPagesSeeder extends Seeder
{
    public function run(): void
    {
        // Homepage (published)
        $home = BuilderPage::firstOrCreate(
            ['type' => 'page', 'slug' => null, 'is_homepage' => true],
            ['status' => 'published', 'published_at' => now()],
        );

        $home->translations()->updateOrCreate(
            ['locale' => 'en'],
            [
                'title' => 'Welcome to MiniPress',
                'html' => '<section class="p-12 text-center"><h1 class="text-4xl font-bold">Welcome to MiniPress</h1><p class="mt-4">A WordPress-style CMS powered by Laravel + GrapesJS.</p></section>',
                'css' => '',
            ],
        );

        $home->translations()->updateOrCreate(
            ['locale' => 'es'],
            [
                'title' => 'Bienvenido a MiniPress',
                'html' => '<section class="p-12 text-center"><h1 class="text-4xl font-bold">Bienvenido a MiniPress</h1><p class="mt-4">Un CMS estilo WordPress con Laravel + GrapesJS.</p></section>',
                'css' => '',
            ],
        );

        $home->seo()->updateOrCreate(
            ['locale' => 'en'],
            ['meta_title' => 'Welcome — MiniPress', 'meta_description' => 'MiniPress demo homepage.'],
        );

        $home->seo()->updateOrCreate(
            ['locale' => 'es'],
            ['meta_title' => 'Bienvenido — MiniPress', 'meta_description' => 'Página de inicio de demostración.'],
        );

        // Header (published)
        $header = BuilderPage::firstOrCreate(
            ['type' => 'header'],
            ['status' => 'published', 'published_at' => now()],
        );

        $header->translations()->updateOrCreate(
            ['locale' => 'en'],
            [
                'title' => 'Site Header',
                'html' => '<header class="bg-slate-900 text-white p-4"><div class="max-w-5xl mx-auto"><a href="/" class="text-xl font-bold">MiniPress</a></div></header>',
                'css' => '',
            ],
        );

        $header->translations()->updateOrCreate(
            ['locale' => 'es'],
            [
                'title' => 'Encabezado',
                'html' => '<header class="bg-slate-900 text-white p-4"><div class="max-w-5xl mx-auto"><a href="/es" class="text-xl font-bold">MiniPress</a></div></header>',
                'css' => '',
            ],
        );

        // Footer (published)
        $footer = BuilderPage::firstOrCreate(
            ['type' => 'footer'],
            ['status' => 'published', 'published_at' => now()],
        );

        $footer->translations()->updateOrCreate(
            ['locale' => 'en'],
            [
                'title' => 'Site Footer',
                'html' => '<footer class="bg-slate-800 text-slate-300 p-6 text-center"><p>&copy; '.date('Y').' MiniPress</p></footer>',
                'css' => '',
            ],
        );

        $footer->translations()->updateOrCreate(
            ['locale' => 'es'],
            [
                'title' => 'Pie de página',
                'html' => '<footer class="bg-slate-800 text-slate-300 p-6 text-center"><p>&copy; '.date('Y').' MiniPress</p></footer>',
                'css' => '',
            ],
        );
    }
}
