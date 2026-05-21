<?php

use App\Support\HtmlSanitizer;

it('strips html/head/body wrappers but keeps inner content', function () {
    $input = '<html><head><title>x</title></head><body><p>Hello</p></body></html>';
    $out = HtmlSanitizer::stripDocumentWrappers($input);
    expect($out)->not->toContain('<html')
        ->not->toContain('</html>')
        ->not->toContain('<head')
        ->not->toContain('</head>')
        ->not->toContain('<body')
        ->not->toContain('</body>')
        ->toContain('<p>Hello</p>');
});

it('removes external script tags but keeps inline scripts intact', function () {
    $input = '<p>ok</p><script src="https://evil.example/x.js"></script><script>console.log(1)</script>';
    $out = HtmlSanitizer::stripDocumentWrappers($input);
    expect($out)->not->toContain('evil.example')
        ->toContain('<p>ok</p>')
        ->toContain('console.log(1)');
});

it('is idempotent on already-clean fragments', function () {
    $clean = '<section><h1>Hi</h1><p>World</p></section>';
    expect(HtmlSanitizer::stripDocumentWrappers($clean))->toBe($clean);
});

it('handles attributes on wrapper tags', function () {
    $input = '<html lang="en"><body class="x" data-y="1"><div>kept</div></body></html>';
    $out = HtmlSanitizer::stripDocumentWrappers($input);
    expect($out)
        ->not->toContain('<html')
        ->not->toContain('<body')
        ->toContain('<div>kept</div>');
});
