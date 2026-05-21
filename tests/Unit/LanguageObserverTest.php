<?php

use App\Models\Language;

uses(Illuminate\Foundation\Testing\RefreshDatabase::class);

it('clears is_default on other rows when a language is set as default', function () {
    $en = Language::create(['name' => 'English', 'code' => 'en', 'is_default' => true]);
    $es = Language::create(['name' => 'Spanish', 'code' => 'es', 'is_default' => false]);

    $es->update(['is_default' => true]);

    expect($en->fresh()->is_default)->toBeFalse();
    expect($es->fresh()->is_default)->toBeTrue();
});

it('keeps other rows untouched when a non-default save happens', function () {
    $en = Language::create(['name' => 'English', 'code' => 'en', 'is_default' => true]);
    $es = Language::create(['name' => 'Spanish', 'code' => 'es', 'is_default' => false]);

    $es->update(['name' => 'Castellano']);

    expect($en->fresh()->is_default)->toBeTrue();
});
