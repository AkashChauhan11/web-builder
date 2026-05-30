<?php

namespace App\Support;

class HtmlSanitizer
{
    /**
     * Whitelist of iframe hosts allowed in user-supplied raw HTML.
     * Anything else is stripped from the iframe `src` (and the iframe itself removed).
     */
    public const IFRAME_HOST_ALLOWLIST = [
        'www.youtube.com',
        'youtube.com',
        'player.vimeo.com',
        'vimeo.com',
        'www.google.com',
        'maps.google.com',
    ];

    /**
     * Tags that get removed entirely (along with their content) from user-supplied raw HTML.
     */
    public const FORBIDDEN_TAGS = ['script', 'object', 'embed', 'style', 'link', 'meta'];

    public static function stripDocumentWrappers(string $html): string
    {
        $patterns = [
            '#<html\b[^>]*>#i',
            '#</html\s*>#i',
            '#<head\b[^>]*>.*?</head\s*>#is',
            '#<body\b[^>]*>#i',
            '#</body\s*>#i',
            '#<script\b[^>]*\bsrc\s*=\s*["\'][^"\']*["\'][^>]*>\s*</script\s*>#is',
            '#<script\b[^>]*\bsrc\s*=\s*["\'][^"\']*["\'][^>]*/\s*>#is',
        ];

        return preg_replace($patterns, '', $html);
    }

    /**
     * Sanitize user-supplied raw HTML (e.g. the content of an mp-html widget).
     * Removes forbidden tags entirely and strips iframes whose host isn't in the allowlist.
     */
    public static function sanitizeRawHtml(string $html): string
    {
        if ($html === '') {
            return $html;
        }

        // Strip forbidden tags + their content (script/object/embed/style/link/meta)
        foreach (self::FORBIDDEN_TAGS as $tag) {
            $html = preg_replace("#<{$tag}\b[^>]*>.*?</{$tag}\s*>#is", '', $html);
            // Also strip self-closing forms
            $html = preg_replace("#<{$tag}\b[^>]*/?>#is", '', $html);
        }

        // Inspect iframes — remove any whose host isn't in the allowlist
        $html = preg_replace_callback('#<iframe\b([^>]*)>(.*?)</iframe\s*>#is', function ($match) {
            $attrs = $match[1];
            if (! preg_match('#src\s*=\s*["\']([^"\']+)["\']#i', $attrs, $srcMatch)) {
                return '';
            }
            $src = $srcMatch[1];
            $host = parse_url($src, PHP_URL_HOST);
            if (! $host || ! in_array(strtolower($host), self::IFRAME_HOST_ALLOWLIST, true)) {
                return '';
            }
            return $match[0];
        }, $html);

        // Strip on* event handlers from any remaining tag
        $html = preg_replace('#\son[a-z]+\s*=\s*"[^"]*"#i', '', $html);
        $html = preg_replace("#\son[a-z]+\s*=\s*'[^']*'#i", '', $html);

        // Strip javascript: URIs from href / src
        $html = preg_replace_callback('#\b(href|src)\s*=\s*["\']javascript:[^"\']*["\']#i', function () {
            return '';
        }, $html);

        return $html;
    }

    /**
     * Walk a saved component tree and sanitize the `raw_html` prop of every `mp-html` node.
     * Mutates and returns the tree.
     *
     * @param  array<int,array<string,mixed>>  $tree
     * @return array<int,array<string,mixed>>
     */
    public static function sanitizeHtmlWidgets(array $tree): array
    {
        return array_map(fn ($node) => self::walkAndSanitize($node), $tree);
    }

    /**
     * @param  array<string,mixed>  $node
     * @return array<string,mixed>
     */
    private static function walkAndSanitize(array $node): array
    {
        if (($node['type'] ?? null) === 'mp-html' && isset($node['props']['raw_html']) && is_string($node['props']['raw_html'])) {
            $node['props']['raw_html'] = self::sanitizeRawHtml($node['props']['raw_html']);
        }

        if (isset($node['components']) && is_array($node['components'])) {
            $node['components'] = array_map(fn ($c) => is_array($c) ? self::walkAndSanitize($c) : $c, $node['components']);
        }

        return $node;
    }
}
