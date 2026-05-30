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

// ----- sanitizeRawHtml (Plan 11) -----

it('sanitizeRawHtml strips script tags entirely', function () {
    $input = '<p>ok</p><script>alert(1)</script><p>after</p>';
    $out = HtmlSanitizer::sanitizeRawHtml($input);
    expect($out)
        ->not->toContain('alert')
        ->not->toContain('<script')
        ->toContain('<p>ok</p>')
        ->toContain('<p>after</p>');
});

it('sanitizeRawHtml strips object/embed/style/link/meta tags', function () {
    $tags = ['object', 'embed', 'style', 'link', 'meta'];
    foreach ($tags as $t) {
        $input = "<div>ok</div><{$t}>bad</{$t}>";
        expect(HtmlSanitizer::sanitizeRawHtml($input))
            ->not->toContain("<{$t}")
            ->toContain('<div>ok</div>');
    }
});

it('sanitizeRawHtml preserves whitelisted iframe hosts (YouTube)', function () {
    $input = '<iframe src="https://www.youtube.com/embed/abc"></iframe>';
    expect(HtmlSanitizer::sanitizeRawHtml($input))->toContain('youtube.com/embed/abc');
});

it('sanitizeRawHtml strips iframes with non-whitelisted hosts', function () {
    $input = '<iframe src="https://evil.example/page"></iframe><p>after</p>';
    $out = HtmlSanitizer::sanitizeRawHtml($input);
    expect($out)
        ->not->toContain('evil.example')
        ->not->toContain('<iframe')
        ->toContain('<p>after</p>');
});

it('sanitizeRawHtml strips on* event handlers', function () {
    $input = '<button onclick="alert(1)" onmouseover="x()">Click</button>';
    $out = HtmlSanitizer::sanitizeRawHtml($input);
    expect($out)
        ->not->toContain('onclick')
        ->not->toContain('onmouseover')
        ->not->toContain('alert')
        ->toContain('<button')
        ->toContain('>Click</button>');
});

it('sanitizeRawHtml strips javascript: hrefs', function () {
    $input = '<a href="javascript:alert(1)">x</a>';
    $out = HtmlSanitizer::sanitizeRawHtml($input);
    expect($out)
        ->not->toContain('javascript:')
        ->not->toContain('alert(1)');
});

it('sanitizeRawHtml leaves clean HTML unchanged', function () {
    $clean = '<div class="card"><h2>Hi</h2><p>World <a href="https://example.com">link</a></p></div>';
    expect(HtmlSanitizer::sanitizeRawHtml($clean))->toBe($clean);
});

it('sanitizeHtmlWidgets cleans the raw_html prop of every mp-html node', function () {
    $tree = [
        [
            'type' => 'mp-section',
            'components' => [
                [
                    'type' => 'mp-column',
                    'components' => [
                        [
                            'type' => 'mp-html',
                            'props' => ['raw_html' => '<p>ok</p><script>alert(1)</script>'],
                        ],
                    ],
                ],
            ],
        ],
    ];

    $clean = HtmlSanitizer::sanitizeHtmlWidgets($tree);
    $htmlContent = $clean[0]['components'][0]['components'][0]['props']['raw_html'];
    expect($htmlContent)
        ->not->toContain('<script')
        ->not->toContain('alert(1)')
        ->toContain('<p>ok</p>');
});
