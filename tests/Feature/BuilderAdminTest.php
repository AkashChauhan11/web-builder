<?php

use App\Models\BuilderPage;
use App\Models\BuilderPageSeo;
use App\Models\BuilderPageTranslation;
use App\Models\Language;
use App\Models\MediaItem;
use App\Models\User;
use App\Support\LocaleResolver;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->admin = User::factory()->create(['role' => 'admin']);

    LocaleResolver::bustCache();
    Language::create(['name' => 'English', 'code' => 'en', 'is_default' => true]);
    Language::create(['name' => 'Spanish', 'code' => 'es']);
    LocaleResolver::bustCache();

    Storage::fake('public');
});

it('uploadAsset accepts an image and returns a GrapesJS-shaped JSON response', function () {
    $file = UploadedFile::fake()->image('hero.png', 200, 200);

    $resp = $this->actingAs($this->admin)
        ->post(route('admin.builder.upload_asset'), [
            'files' => [$file],
        ], ['Accept' => 'application/json']);

    $resp->assertOk()
        ->assertJsonStructure(['data']);

    expect($resp->json('data'))->toBeArray()->not->toBeEmpty();

    expect(MediaItem::count())->toBe(1);
    $item = MediaItem::first();
    expect($item->mime_type)->toStartWith('image/');
    Storage::disk('public')->assertExists($item->path);
});

it('uploadAsset rejects non-image files', function () {
    $file = UploadedFile::fake()->create('doc.pdf', 100, 'application/pdf');

    $this->actingAs($this->admin)
        ->post(route('admin.builder.upload_asset'), ['files' => [$file]])
        ->assertSessionHasErrors('files.0');
});

it('uploadAsset rejects oversized files', function () {
    $file = UploadedFile::fake()->image('huge.png')->size(11 * 1024); // 11 MB

    $this->actingAs($this->admin)
        ->post(route('admin.builder.upload_asset'), ['files' => [$file]])
        ->assertSessionHasErrors('files.0');
});

it('uploadAsset requires admin auth', function () {
    $file = UploadedFile::fake()->image('hero.png');

    $this->post(route('admin.builder.upload_asset'), ['files' => [$file]])
        ->assertRedirect('/admin/login');
});

it('update saves translation html/css/components/styles for the requested locale', function () {
    $page = BuilderPage::factory()->create(['type' => 'page', 'slug' => 'updateable']);
    $page->translations()->create(['locale' => 'en', 'title' => 'Old', 'html' => '<p>old</p>', 'css' => '']);
    $page->seo()->create(['locale' => 'en']);

    $resp = $this->actingAs($this->admin)
        ->putJson(route('admin.builder.update', $page->id), [
            'locale' => 'en',
            'title' => 'New Title',
            'slug' => 'updateable',
            'status' => 'draft',
            'is_homepage' => false,
            'html' => '<p>new content</p>',
            'css' => '.hero{color:red}',
            'components_json' => [['type' => 'text', 'content' => 'new content']],
            'styles_json' => [['selectors' => ['.hero'], 'style' => ['color' => 'red']]],
            'seo' => [
                'en' => ['meta_title' => 'New Title — Site', 'robots' => 'index,follow'],
            ],
        ]);

    $resp->assertOk()->assertJson(['ok' => true]);

    $t = $page->fresh()->translationFor('en');
    expect($t->title)->toBe('New Title');
    expect($t->html)->toBe('<p>new content</p>');
    expect($t->css)->toBe('.hero{color:red}');
    expect($t->components_json)->toBe([['type' => 'text', 'content' => 'new content']]);

    expect($page->fresh()->seoFor('en')->meta_title)->toBe('New Title — Site');
});

it('update strips html/head/body wrappers before saving', function () {
    $page = BuilderPage::factory()->create(['type' => 'page', 'slug' => 'sanitize']);
    $page->translations()->create(['locale' => 'en', 'title' => 'X', 'html' => '', 'css' => '']);
    $page->seo()->create(['locale' => 'en']);

    $this->actingAs($this->admin)
        ->putJson(route('admin.builder.update', $page->id), [
            'locale' => 'en',
            'title' => 'X',
            'slug' => 'sanitize',
            'status' => 'draft',
            'is_homepage' => false,
            'html' => '<html><head><title>x</title></head><body><p>kept</p></body></html>',
            'css' => '',
            'seo' => ['en' => []],
        ])->assertOk();

    $html = $page->fresh()->translationFor('en')->html;
    expect($html)->not->toContain('<html')
        ->not->toContain('<head')
        ->not->toContain('<body')
        ->toContain('<p>kept</p>');
});

it('update returns redirect_url when slug changes', function () {
    $page = BuilderPage::factory()->create(['type' => 'page', 'slug' => 'old-slug']);
    $page->translations()->create(['locale' => 'en', 'title' => 'X', 'html' => '', 'css' => '']);
    $page->seo()->create(['locale' => 'en']);

    $resp = $this->actingAs($this->admin)
        ->putJson(route('admin.builder.update', $page->id), [
            'locale' => 'en',
            'title' => 'X',
            'slug' => 'new-slug',
            'status' => 'draft',
            'is_homepage' => false,
            'html' => '',
            'css' => '',
            'seo' => ['en' => []],
        ]);

    $resp->assertOk()->assertJsonPath('redirect_url', route('admin.builder.edit', $page->id) . '?locale=en');
    expect($page->fresh()->slug)->toBe('new-slug');
});

it('update rejects slug taken by another page', function () {
    BuilderPage::factory()->create(['type' => 'page', 'slug' => 'taken']);
    $page = BuilderPage::factory()->create(['type' => 'page', 'slug' => 'mine']);
    $page->translations()->create(['locale' => 'en', 'title' => 'X', 'html' => '', 'css' => '']);
    $page->seo()->create(['locale' => 'en']);

    $this->actingAs($this->admin)
        ->putJson(route('admin.builder.update', $page->id), [
            'locale' => 'en',
            'title' => 'X',
            'slug' => 'taken',
            'status' => 'draft',
            'is_homepage' => false,
            'html' => '',
            'css' => '',
            'seo' => ['en' => []],
        ])->assertStatus(422);
});

it('publish toggles draft -> published and sets published_at on first publish', function () {
    $page = BuilderPage::factory()->create(['type' => 'page', 'slug' => 'pub', 'status' => 'draft', 'published_at' => null]);

    $resp = $this->actingAs($this->admin)
        ->postJson(route('admin.builder.publish', $page->id));

    $resp->assertOk()->assertJsonPath('status', 'published');

    $page->refresh();
    expect($page->status)->toBe('published');
    expect($page->published_at)->not->toBeNull();
});

it('publish toggles published -> draft', function () {
    $page = BuilderPage::factory()->create(['status' => 'published', 'published_at' => now()->subDay()]);

    $resp = $this->actingAs($this->admin)
        ->postJson(route('admin.builder.publish', $page->id));

    $resp->assertOk()->assertJsonPath('status', 'draft');
    expect($page->fresh()->status)->toBe('draft');
});
