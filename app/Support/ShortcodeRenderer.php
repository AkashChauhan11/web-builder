<?php

namespace App\Support;

use Closure;

class ShortcodeRenderer
{
    /** @var array<string, Closure> */
    private static array $handlers = [];

    /**
     * Register a shortcode handler.
     *
     * The handler receives the params string after the colon (e.g. for `{date:short}` it gets `"short"`)
     * and returns the replacement string.
     */
    public static function register(string $name, Closure $handler): void
    {
        self::$handlers[$name] = $handler;
    }

    public static function clear(): void
    {
        self::$handlers = [];
    }

    /** @return string[] */
    public static function registered(): array
    {
        return array_keys(self::$handlers);
    }

    /**
     * Replace `{name}` and `{name:params}` placeholders in HTML with their handler output.
     * Unknown shortcodes pass through unchanged.
     */
    public static function replace(string $html): string
    {
        if ($html === '' || empty(self::$handlers)) {
            return $html;
        }

        return preg_replace_callback(
            '/\{([a-z][a-z0-9_]*)(?::([^}]*))?\}/i',
            function (array $match) {
                $name = $match[1];
                $params = $match[2] ?? '';
                $handler = self::$handlers[$name] ?? null;
                if ($handler === null) {
                    return $match[0];
                }
                return (string) $handler($params);
            },
            $html
        );
    }
}
