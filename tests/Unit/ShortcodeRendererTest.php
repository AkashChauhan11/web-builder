<?php

use App\Support\ShortcodeRenderer;

beforeEach(function () {
    ShortcodeRenderer::clear();
});

it('replaces a registered shortcode', function () {
    ShortcodeRenderer::register('site_name', fn () => 'MiniPress');
    expect(ShortcodeRenderer::replace('<p>Welcome to {site_name}!</p>'))
        ->toBe('<p>Welcome to MiniPress!</p>');
});

it('passes unknown shortcodes through unchanged', function () {
    ShortcodeRenderer::register('site_name', fn () => 'MiniPress');
    expect(ShortcodeRenderer::replace('<p>{unknown_code}</p>'))
        ->toBe('<p>{unknown_code}</p>');
});

it('passes shortcode params to the handler', function () {
    ShortcodeRenderer::register('format_date', fn (string $p) => "fmt={$p}");
    expect(ShortcodeRenderer::replace('<p>{format_date:short}</p>'))
        ->toBe('<p>fmt=short</p>');
});

it('replaces multiple instances in one pass', function () {
    ShortcodeRenderer::register('year', fn () => '2026');
    expect(ShortcodeRenderer::replace('© {year} · all rights reserved · {year}'))
        ->toBe('© 2026 · all rights reserved · 2026');
});

it('returns input unchanged when no handlers are registered', function () {
    expect(ShortcodeRenderer::replace('<p>{site_name}</p>'))
        ->toBe('<p>{site_name}</p>');
});

it('handles empty input', function () {
    ShortcodeRenderer::register('x', fn () => 'y');
    expect(ShortcodeRenderer::replace(''))->toBe('');
});

it('ignores partial matches like { space name }', function () {
    ShortcodeRenderer::register('site', fn () => 'MP');
    expect(ShortcodeRenderer::replace('{ site }'))->toBe('{ site }');
});
