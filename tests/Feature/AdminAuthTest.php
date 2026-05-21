<?php

use App\Models\User;

uses(Illuminate\Foundation\Testing\RefreshDatabase::class);

it('redirects guests away from /admin', function () {
    $this->get('/admin/builder')->assertRedirect('/admin/login');
});

it('rejects non-editor users from /admin/builder', function () {
    $u = User::factory()->create(['role' => 'guest']);
    $this->actingAs($u)->get('/admin/builder')
        ->assertRedirect('/admin/login');
});

it('allows editor through /admin', function () {
    $u = User::factory()->create(['role' => 'editor']);
    $this->actingAs($u)->get('/admin/builder')->assertOk();
});
