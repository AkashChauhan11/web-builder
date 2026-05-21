<?php

namespace App\Support;

class HtmlSanitizer
{
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
}
