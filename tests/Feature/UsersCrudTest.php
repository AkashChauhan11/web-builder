<?php

use App\Models\User;

uses(Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->admin = User::factory()->create(['role' => 'admin']);
    $this->editor = User::factory()->create(['role' => 'editor']);
});

it('index requires admin role (editor gets 403)', function () {
    $this->actingAs($this->editor)
        ->get(route('admin.users.index'))
        ->assertForbidden();
});

it('index shows users to admin', function () {
    $this->actingAs($this->admin)
        ->get(route('admin.users.index'))
        ->assertOk()
        ->assertSee($this->admin->email)
        ->assertSee($this->editor->email);
});

it('store creates a user with role and hashed password', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.users.store'), [
            'name' => 'Jane',
            'email' => 'jane@example.test',
            'password' => 'secret-pass',
            'password_confirmation' => 'secret-pass',
            'role' => 'editor',
        ])->assertRedirect(route('admin.users.index'));

    $u = User::where('email', 'jane@example.test')->first();
    expect($u)->not->toBeNull();
    expect($u->role)->toBe('editor');
    expect($u->password)->not->toBe('secret-pass'); // hashed
});

it('store rejects duplicate email', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.users.store'), [
            'name' => 'Dup',
            'email' => $this->editor->email,
            'password' => 'pass1234',
            'password_confirmation' => 'pass1234',
            'role' => 'editor',
        ])->assertSessionHasErrors('email');
});

it('store rejects invalid role', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.users.store'), [
            'name' => 'X',
            'email' => 'x@example.test',
            'password' => 'pass1234',
            'password_confirmation' => 'pass1234',
            'role' => 'superadmin',
        ])->assertSessionHasErrors('role');
});

it('update changes name, email, role; password optional', function () {
    $resp = $this->actingAs($this->admin)
        ->put(route('admin.users.update', $this->editor->id), [
            'name' => 'Editor Renamed',
            'email' => 'renamed@example.test',
            'role' => 'developer',
        ]);

    $resp->assertRedirect();
    $u = $this->editor->fresh();
    expect($u->name)->toBe('Editor Renamed');
    expect($u->email)->toBe('renamed@example.test');
    expect($u->role)->toBe('developer');
});

it('update with password+confirmation rehashes', function () {
    $oldHash = $this->editor->password;

    $this->actingAs($this->admin)
        ->put(route('admin.users.update', $this->editor->id), [
            'name' => $this->editor->name,
            'email' => $this->editor->email,
            'role' => 'editor',
            'password' => 'newpass123',
            'password_confirmation' => 'newpass123',
        ])->assertRedirect();

    expect($this->editor->fresh()->password)->not->toBe($oldHash);
});

it('destroy blocks self-deletion', function () {
    $this->actingAs($this->admin)
        ->delete(route('admin.users.destroy', $this->admin->id))
        ->assertSessionHasErrors();

    expect(User::find($this->admin->id))->not->toBeNull();
});

it('destroy removes another user', function () {
    $this->actingAs($this->admin)
        ->delete(route('admin.users.destroy', $this->editor->id))
        ->assertRedirect(route('admin.users.index'));

    expect(User::find($this->editor->id))->toBeNull();
});

it('non-admin developer gets 403 on store', function () {
    $dev = User::factory()->create(['role' => 'developer']);

    $this->actingAs($dev)
        ->post(route('admin.users.store'), [
            'name' => 'Y',
            'email' => 'y@example.test',
            'password' => 'pass1234',
            'password_confirmation' => 'pass1234',
            'role' => 'editor',
        ])->assertForbidden();
});
