<?php

namespace Database\Seeders;

use App\Models\BuilderPage;
use Illuminate\Database\Seeder;

class PlaceholderPagesSeeder extends Seeder
{
    public function run(): void
    {
        // ----- Homepage (published) — uses new Section/Column/Widget format -----
        $home = BuilderPage::firstOrCreate(
            ['type' => 'page', 'slug' => null, 'is_homepage' => true],
            ['status' => 'published', 'published_at' => now()],
        );

        $home->translations()->updateOrCreate(
            ['locale' => 'en'],
            [
                'title' => 'Welcome to MiniPress',
                'html' => $this->welcomeHtml('Welcome to MiniPress', 'Build pages visually in minutes — no code required.', 'Get Started'),
                'css' => '',
                'components_json' => $this->welcomeTree('Welcome to MiniPress', 'Build pages visually in minutes — no code required.', 'Get Started'),
            ],
        );

        $home->translations()->updateOrCreate(
            ['locale' => 'es'],
            [
                'title' => 'Bienvenido a MiniPress',
                'html' => $this->welcomeHtml('Bienvenido a MiniPress', 'Crea páginas visualmente en minutos — sin código.', 'Comenzar'),
                'css' => '',
                'components_json' => $this->welcomeTree('Bienvenido a MiniPress', 'Crea páginas visualmente en minutos — sin código.', 'Comenzar'),
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

        // ----- Header (published) -----
        $header = BuilderPage::firstOrCreate(
            ['type' => 'header'],
            ['status' => 'published', 'published_at' => now()],
        );

        $header->translations()->updateOrCreate(
            ['locale' => 'en'],
            [
                'title' => 'Site Header',
                'html' => '<header class="bg-slate-900 text-white p-4"><div class="max-w-5xl mx-auto"><a href="{{LOCALE_PREFIX}}/" class="text-xl font-bold">MiniPress</a></div></header>',
                'css' => '',
            ],
        );

        $header->translations()->updateOrCreate(
            ['locale' => 'es'],
            [
                'title' => 'Encabezado',
                'html' => '<header class="bg-slate-900 text-white p-4"><div class="max-w-5xl mx-auto"><a href="{{LOCALE_PREFIX}}/" class="text-xl font-bold">MiniPress</a></div></header>',
                'css' => '',
            ],
        );

        // ----- Footer (published) -----
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

    /**
     * Hero-shaped HTML using the new Section → Column → Widget classes.
     */
    private function welcomeHtml(string $heading, string $body, string $buttonLabel): string
    {
        $headingEsc = e($heading);
        $bodyEsc = e($body);
        $btnEsc = e($buttonLabel);

        return <<<HTML
<section class="mp-sec mp-sec--full" id="i_welcome_section" style="--mp-sec-inner:1200px; min-height:480px" data-mp-widget="section" data-valign="middle">
  <div class="mp-sec__inner">
    <div class="mp-col" id="i_welcome_col1" data-mp-widget="column" data-valign="middle" style="flex-basis:50%">
      <h1 class="mp-heading" id="i_welcome_heading" data-mp-widget="heading">{$headingEsc}</h1>
      <div class="mp-text" id="i_welcome_text" data-mp-widget="text">{$bodyEsc}</div>
      <a class="mp-btn mp-btn--lg" id="i_welcome_button" data-mp-widget="button" href="/get-started">{$btnEsc}</a>
    </div>
    <div class="mp-col" id="i_welcome_col2" data-mp-widget="column" data-valign="middle" style="flex-basis:50%">
      <figure class="mp-image" id="i_welcome_image" data-mp-widget="image">
        <img class="mp-image__img" src="/images/placeholder.png" alt="Hero illustration" loading="lazy">
      </figure>
    </div>
  </div>
</section>
HTML;
    }

    /**
     * Component-tree JSON matching the welcomeHtml shape — re-openable in the editor.
     *
     * @return array<int, array<string, mixed>>
     */
    private function welcomeTree(string $heading, string $body, string $buttonLabel): array
    {
        return [[
            'type' => 'mp-section',
            'attributes' => ['id' => 'i_welcome_section'],
            'props' => [
                'width' => 'full',
                'max_inner_width' => 1200,
                'vertical_align' => 'middle',
                'min_height_mode' => 'fixed',
                'min_height' => 480,
                'html_tag' => 'section',
            ],
            'components' => [[
                'tagName' => 'div',
                'attributes' => ['class' => 'mp-sec__inner'],
                'selectable' => false,
                'hoverable' => false,
                'draggable' => false,
                'droppable' => '.mp-col',
                'components' => [
                    [
                        'type' => 'mp-column',
                        'attributes' => ['id' => 'i_welcome_col1'],
                        'props' => ['size_pct' => 50, 'vertical_align' => 'middle', 'content_position' => 'start'],
                        'components' => [
                            [
                                'type' => 'mp-heading',
                                'attributes' => ['id' => 'i_welcome_heading'],
                                'props' => ['level' => 1, 'link' => null],
                                'components' => [['type' => 'textnode', 'content' => $heading]],
                            ],
                            [
                                'type' => 'mp-text',
                                'attributes' => ['id' => 'i_welcome_text'],
                                'props' => [],
                                'components' => [['type' => 'textnode', 'content' => $body]],
                            ],
                            [
                                'type' => 'mp-button',
                                'attributes' => ['id' => 'i_welcome_button'],
                                'props' => [
                                    'link' => ['url' => '/get-started', 'target' => '_self', 'rel' => null],
                                    'size' => 'lg',
                                    'full_width' => false,
                                    'icon' => ['name' => null, 'position' => 'after'],
                                ],
                                'components' => [['type' => 'textnode', 'content' => $buttonLabel]],
                            ],
                        ],
                    ],
                    [
                        'type' => 'mp-column',
                        'attributes' => ['id' => 'i_welcome_col2'],
                        'props' => ['size_pct' => 50, 'vertical_align' => 'middle', 'content_position' => 'start'],
                        'components' => [
                            [
                                'type' => 'mp-image',
                                'attributes' => ['id' => 'i_welcome_image'],
                                'props' => [
                                    'src' => '/images/placeholder.png',
                                    'alt' => 'Hero illustration',
                                    'link' => null,
                                    'lightbox_enabled' => false,
                                    'caption' => '',
                                ],
                                'components' => [],
                            ],
                        ],
                    ],
                ],
            ]],
        ]];
    }
}
