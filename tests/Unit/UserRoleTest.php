<?php

use App\Models\User;

uses(Illuminate\Foundation\Testing\RefreshDatabase::class);

it('treats admin as admin/developer/editor', function () {
    $u = User::factory()->create(['role' => 'admin']);
    expect($u->isAdmin())->toBeTrue();
    expect($u->isDeveloper())->toBeFalse();
    expect($u->isEditor())->toBeTrue();
    expect($u->isAdminOrDeveloper())->toBeTrue();
});

it('treats developer as not-admin but editor and admin-or-developer', function () {
    $u = User::factory()->create(['role' => 'developer']);
    expect($u->isAdmin())->toBeFalse();
    expect($u->isDeveloper())->toBeTrue();
    expect($u->isEditor())->toBeTrue();
    expect($u->isAdminOrDeveloper())->toBeTrue();
});

it('treats editor as editor only', function () {
    $u = User::factory()->create(['role' => 'editor']);
    expect($u->isAdmin())->toBeFalse();
    expect($u->isDeveloper())->toBeFalse();
    expect($u->isEditor())->toBeTrue();
    expect($u->isAdminOrDeveloper())->toBeFalse();
});

it('treats unknown roles as not-editor', function () {
    $u = User::factory()->create(['role' => 'guest']);
    expect($u->isEditor())->toBeFalse();
});
