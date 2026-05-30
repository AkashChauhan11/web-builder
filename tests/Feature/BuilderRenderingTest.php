<?php

use App\Models\BuilderPage;
use App\Models\Language;
use App\Support\LocaleResolver;

uses(Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    LocaleResolver::bustCache();
    Language::create(['name' => 'English', 'code' => 'en', 'is_default' => true]);
    LocaleResolver::bustCache();
});

it('renders a saved component-tree page with the expected HTML markers', function () {
    $page = BuilderPage::factory()->create([
        'type' => BuilderPage::TYPE_PAGE,
        'slug' => null,
        'status' => BuilderPage::STATUS_PUBLISHED,
        'published_at' => now(),
        'is_homepage' => true,
    ]);
    $page->translations()->create([
        'locale' => 'en',
        'title' => 'Welcome',
        'html' => '<section class="mp-sec mp-sec--full" data-mp-widget="section"><div class="mp-sec__inner"><div class="mp-col" data-mp-widget="column" style="flex-basis:100%"><h1 class="mp-heading" data-mp-widget="heading">Hello</h1></div></div></section>',
        'css' => '',
    ]);
    $page->seo()->create(['locale' => 'en']);

    $response = $this->get('/');
    $response->assertOk();
    $content = $response->getContent();

    expect($content)
        ->toContain('mp-sec--full')
        ->toContain('mp-sec__inner')
        ->toContain('data-mp-widget="section"')
        ->toContain('data-mp-widget="column"')
        ->toContain('data-mp-widget="heading"')
        ->toContain('Hello');
});

it('loads the builder-runtime script tag on public pages', function () {
    $page = BuilderPage::factory()->create([
        'type' => BuilderPage::TYPE_PAGE,
        'slug' => null,
        'status' => BuilderPage::STATUS_PUBLISHED,
        'published_at' => now(),
        'is_homepage' => true,
    ]);
    $page->translations()->create(['locale' => 'en', 'title' => 'X', 'html' => '', 'css' => '']);
    $page->seo()->create(['locale' => 'en']);

    $response = $this->get('/');
    $response->assertOk();

    expect($response->getContent())->toContain('builder-runtime');
});

it('renders all interactive widget markers so the runtime can hook them', function () {
    $widgetHtml = collect([
        '<div class="mp-accordion" data-mp-widget="accordion" data-mp-multiple="0" data-mp-default-open="0"><div class="mp-accordion__item" data-mp-widget="accordion-item" data-mp-open="1"><button class="mp-accordion__title">Q</button><div class="mp-accordion__body">A</div></div></div>',
        '<div class="mp-tabs mp-tabs--horizontal" data-mp-widget="tabs" data-mp-default="0"><div class="mp-tab" data-mp-widget="tab" data-mp-active="1"><button class="mp-tab__label" data-mp-active="1">T1</button><div class="mp-tab__panel" data-mp-active="1">P1</div></div></div>',
        '<div class="mp-alert mp-alert--info" data-mp-widget="alert" data-mp-dismissible="1"><span class="mp-alert__icon"></span><div class="mp-alert__body"><h4 class="mp-alert__title">!</h4><div class="mp-alert__message">m</div></div><button class="mp-alert__close" type="button">×</button></div>',
        '<div class="mp-counter" data-mp-widget="counter" data-mp-start="0" data-mp-end="100" data-mp-duration="2000" data-mp-prefix="" data-mp-suffix="" data-mp-separator=","><span class="mp-counter__value">100</span></div>',
        '<div class="mp-progress" data-mp-widget="progress" data-mp-value="75" data-mp-max="100" data-mp-animated="1"><div class="mp-progress__track"><div class="mp-progress__fill" style="width:75%"></div></div></div>',
        '<div class="mp-carousel mp-carousel--slides-1" data-mp-widget="carousel" data-mp-autoplay="0" data-mp-loop="1" data-mp-arrows="1" data-mp-dots="1"><div class="mp-carousel__viewport"><div class="mp-carousel__container"><div class="mp-carousel__slide" data-mp-widget="carousel-slide"><img src="/x.png" alt=""></div></div></div></div>',
        '<div class="mp-gallery mp-gallery--cols-3" data-mp-widget="gallery" data-mp-lightbox="1"><figure class="mp-gallery__item"><img src="/x.png" alt=""></figure></div>',
    ])->implode('');

    $page = BuilderPage::factory()->create([
        'type' => BuilderPage::TYPE_PAGE,
        'slug' => null,
        'status' => BuilderPage::STATUS_PUBLISHED,
        'published_at' => now(),
        'is_homepage' => true,
    ]);
    $page->translations()->create([
        'locale' => 'en',
        'title' => 'All widgets',
        'html' => '<section class="mp-sec"><div class="mp-sec__inner"><div class="mp-col" data-mp-widget="column">'.$widgetHtml.'</div></div></section>',
        'css' => '',
    ]);
    $page->seo()->create(['locale' => 'en']);

    $response = $this->get('/');
    $response->assertOk();
    $content = $response->getContent();

    expect($content)
        ->toContain('data-mp-widget="accordion"')
        ->toContain('data-mp-widget="tabs"')
        ->toContain('data-mp-widget="alert"')
        ->toContain('data-mp-widget="counter"')
        ->toContain('data-mp-widget="progress"')
        ->toContain('data-mp-widget="carousel"')
        ->toContain('data-mp-widget="gallery"');
});

it('preserves SEO meta tags with the new HTML shape', function () {
    $page = BuilderPage::factory()->create([
        'type' => BuilderPage::TYPE_PAGE,
        'slug' => null,
        'status' => BuilderPage::STATUS_PUBLISHED,
        'published_at' => now(),
        'is_homepage' => true,
    ]);
    $page->translations()->create([
        'locale' => 'en',
        'title' => 'X',
        'html' => '<section class="mp-sec"><div class="mp-sec__inner"><div class="mp-col">hi</div></div></section>',
        'css' => '',
    ]);
    $page->seo()->create([
        'locale' => 'en',
        'meta_title' => 'Snap Title',
        'meta_description' => 'Snap description.',
        'robots' => 'index,follow',
    ]);

    $response = $this->get('/');
    $response->assertOk();
    $content = $response->getContent();

    expect($content)
        ->toContain('<title>Snap Title</title>')
        ->toContain('Snap description.')
        ->toContain('robots');
});
