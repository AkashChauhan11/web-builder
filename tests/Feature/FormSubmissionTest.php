<?php

use App\Models\FormSubmission;
use Illuminate\Support\Facades\Mail;

uses(Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    Mail::fake();
});

it('accepts a valid submission and stores it', function () {
    $resp = $this->postJson('/forms/submit', [
        'form_id' => 'fabc123',
        'form_name' => 'Contact',
        'page_url' => 'https://example.com/contact',
        'fields' => [
            'name' => 'Jane',
            'email' => 'jane@example.com',
            'message' => 'Hi there.',
        ],
        '_honeypot' => '',
        '_ts' => time() - 10,
    ]);

    $resp->assertOk()->assertJsonPath('ok', true);

    expect(FormSubmission::count())->toBe(1);
    $submission = FormSubmission::first();
    expect($submission->form_id)->toBe('fabc123');
    expect($submission->form_name)->toBe('Contact');
    expect($submission->data)->toBe([
        'name' => 'Jane',
        'email' => 'jane@example.com',
        'message' => 'Hi there.',
    ]);
});

it('silently drops bot submissions with a non-empty honeypot', function () {
    $resp = $this->postJson('/forms/submit', [
        'form_id' => 'fabc123',
        'fields' => ['name' => 'Bot'],
        '_honeypot' => 'i-am-a-bot',
        '_ts' => time() - 10,
    ]);

    // 422 because the validator enforces _honeypot must be max:0 chars
    expect($resp->status())->toBe(422);
    expect(FormSubmission::count())->toBe(0);
});

it('silently drops submissions that arrive within 2 seconds', function () {
    $resp = $this->postJson('/forms/submit', [
        'form_id' => 'fabc123',
        'fields' => ['name' => 'Speedrun'],
        '_honeypot' => '',
        '_ts' => time(),
    ]);

    $resp->assertOk()->assertJsonPath('ok', true);
    expect(FormSubmission::count())->toBe(0);
});

it('strips underscore-prefixed internal fields before storing', function () {
    $this->postJson('/forms/submit', [
        'form_id' => 'fabc123',
        'fields' => [
            'name' => 'Jane',
            '_internal' => 'should not be stored',
        ],
        '_honeypot' => '',
        '_ts' => time() - 10,
    ])->assertOk();

    expect(FormSubmission::first()->data)->toBe(['name' => 'Jane']);
});

it('sends email when notification_email is set', function () {
    $this->postJson('/forms/submit', [
        'form_id' => 'fabc123',
        'form_name' => 'Contact',
        'notification_email' => 'admin@example.com',
        'fields' => ['name' => 'Jane'],
        '_honeypot' => '',
        '_ts' => time() - 10,
    ])->assertOk();

    Mail::assertSent(\App\Mail\FormSubmissionMail::class);
});

it('does not send email when notification_email is empty', function () {
    $this->postJson('/forms/submit', [
        'form_id' => 'fabc123',
        'fields' => ['name' => 'Jane'],
        '_honeypot' => '',
        '_ts' => time() - 10,
    ])->assertOk();

    Mail::assertNothingSent();
});

it('rejects submissions missing form_id or fields', function () {
    $this->postJson('/forms/submit', [
        'fields' => ['name' => 'Jane'],
        '_honeypot' => '',
        '_ts' => time() - 10,
    ])->assertStatus(422)->assertJsonValidationErrors('form_id');

    $this->postJson('/forms/submit', [
        'form_id' => 'fabc123',
        '_honeypot' => '',
        '_ts' => time() - 10,
    ])->assertStatus(422)->assertJsonValidationErrors('fields');
});

it('admin submissions page lists submissions', function () {
    $admin = \App\Models\User::factory()->create(['role' => 'admin']);

    FormSubmission::create([
        'form_id' => 'fabc',
        'form_name' => 'Test form',
        'data' => ['email' => 'x@example.com'],
    ]);

    $this->actingAs($admin)
        ->get(route('admin.forms.submissions.index'))
        ->assertOk()
        ->assertSee('Test form')
        ->assertSee('x@example.com');
});

it('non-admin users get redirected from submissions page', function () {
    $this->get(route('admin.forms.submissions.index'))
        ->assertRedirect();
});
