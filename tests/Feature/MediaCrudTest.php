<?php

use App\Models\MediaItem;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->admin = User::factory()->create(['role' => 'admin']);
    Storage::fake('public');
});

it('index lists media items as an authenticated admin', function () {
    MediaItem::factory()->count(3)->create();

    $resp = $this->actingAs($this->admin)->get(route('admin.media.index'));
    $resp->assertOk();
    expect($resp->getContent())->toContain('/storage/builder-assets/');
});

it('index requires admin auth', function () {
    $this->get(route('admin.media.index'))->assertRedirect('/admin/login');
});

it('store accepts an image upload', function () {
    $file = UploadedFile::fake()->image('logo.png', 100, 100);

    $resp = $this->actingAs($this->admin)
        ->post(route('admin.media.store'), ['file' => $file]);

    $resp->assertRedirect(route('admin.media.index'));
    expect(MediaItem::count())->toBe(1);

    $item = MediaItem::first();
    expect($item->mime_type)->toStartWith('image/');
    Storage::disk('public')->assertExists($item->path);
});

it('store rejects oversized file (> 10 MB)', function () {
    $file = UploadedFile::fake()->image('huge.png')->size(11 * 1024);

    $this->actingAs($this->admin)
        ->post(route('admin.media.store'), ['file' => $file])
        ->assertSessionHasErrors('file');
});

it('update sets alt_text', function () {
    $item = MediaItem::factory()->create(['alt_text' => null]);

    $this->actingAs($this->admin)
        ->patch(route('admin.media.update', $item->id), ['alt_text' => 'Company logo'])
        ->assertRedirect();

    expect($item->fresh()->alt_text)->toBe('Company logo');
});

it('destroy removes file from disk and row from db', function () {
    $file = UploadedFile::fake()->image('to-delete.png');
    $path = $file->store('builder-assets', 'public');
    $item = MediaItem::create([
        'filename' => 'to-delete.png',
        'mime_type' => 'image/png',
        'size' => 1024,
        'path' => $path,
        'url' => "/storage/{$path}",
    ]);

    $this->actingAs($this->admin)
        ->delete(route('admin.media.destroy', $item->id))
        ->assertRedirect(route('admin.media.index'));

    expect(MediaItem::find($item->id))->toBeNull();
    Storage::disk('public')->assertMissing($path);
});

it('picker returns paginated JSON of media items', function () {
    MediaItem::factory()->count(5)->create();

    $resp = $this->actingAs($this->admin)
        ->get(route('admin.media.picker'), ['Accept' => 'application/json']);

    $resp->assertOk()
        ->assertJsonStructure(['data' => [['id', 'url', 'filename', 'alt_text']]]);
    expect($resp->json('data'))->toHaveCount(5);
});

it('picker supports search by filename', function () {
    MediaItem::factory()->create(['filename' => 'hero-banner.png']);
    MediaItem::factory()->create(['filename' => 'footer-logo.png']);

    $resp = $this->actingAs($this->admin)
        ->get(route('admin.media.picker', ['q' => 'hero']));

    $resp->assertOk();
    expect($resp->json('data'))->toHaveCount(1);
    expect($resp->json('data.0.filename'))->toContain('hero');
});
