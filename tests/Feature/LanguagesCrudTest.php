<?php

use App\Models\Language;
use App\Models\User;
use App\Support\LocaleResolver;

uses(Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->admin = User::factory()->create(['role' => 'admin']);
    LocaleResolver::bustCache();
});

it('index lists languages', function () {
    Language::create(['name' => 'English', 'code' => 'en', 'is_default' => true]);
    Language::create(['name' => 'Spanish', 'code' => 'es']);

    $this->actingAs($this->admin)
        ->get(route('admin.languages.index'))
        ->assertOk()
        ->assertSee('English')
        ->assertSee('Spanish');
});

it('store creates language', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.languages.store'), [
            'name' => 'French',
            'code' => 'fr',
            'is_active' => '1',
            'sort_order' => 2,
        ])->assertRedirect(route('admin.languages.index'));

    expect(Language::where('code', 'fr')->exists())->toBeTrue();
});

it('store rejects duplicate code', function () {
    Language::create(['name' => 'English', 'code' => 'en']);

    $this->actingAs($this->admin)
        ->post(route('admin.languages.store'), [
            'name' => 'Other English',
            'code' => 'en',
        ])->assertSessionHasErrors('code');
});

it('update renames and toggles active', function () {
    $en = Language::create(['name' => 'English', 'code' => 'en', 'is_active' => true]);

    $this->actingAs($this->admin)
        ->put(route('admin.languages.update', $en->id), [
            'name' => 'British English',
            'code' => 'en',
            'is_active' => '0',
            'sort_order' => 5,
        ])->assertRedirect();

    $fresh = $en->fresh();
    expect($fresh->name)->toBe('British English');
    expect($fresh->is_active)->toBeFalse();
    expect($fresh->sort_order)->toBe(5);
});

it('setting is_default clears other defaults (observer)', function () {
    $en = Language::create(['name' => 'English', 'code' => 'en', 'is_default' => true]);
    $es = Language::create(['name' => 'Spanish', 'code' => 'es', 'is_default' => false]);

    $this->actingAs($this->admin)
        ->put(route('admin.languages.update', $es->id), [
            'name' => 'Spanish',
            'code' => 'es',
            'is_default' => '1',
            'is_active' => '1',
            'sort_order' => 0,
        ])->assertRedirect();

    expect($en->fresh()->is_default)->toBeFalse();
    expect($es->fresh()->is_default)->toBeTrue();
});

it('destroy blocks deletion of default language', function () {
    $en = Language::create(['name' => 'English', 'code' => 'en', 'is_default' => true]);

    $this->actingAs($this->admin)
        ->delete(route('admin.languages.destroy', $en->id))
        ->assertSessionHasErrors();

    expect(Language::find($en->id))->not->toBeNull();
});

it('destroy removes a non-default language', function () {
    Language::create(['name' => 'English', 'code' => 'en', 'is_default' => true]);
    $fr = Language::create(['name' => 'French', 'code' => 'fr']);

    $this->actingAs($this->admin)
        ->delete(route('admin.languages.destroy', $fr->id))
        ->assertRedirect(route('admin.languages.index'));

    expect(Language::find($fr->id))->toBeNull();
});

it('requires admin auth for index', function () {
    $this->get(route('admin.languages.index'))->assertRedirect('/admin/login');
});
