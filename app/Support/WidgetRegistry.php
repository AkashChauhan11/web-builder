<?php

namespace App\Support;

class WidgetRegistry
{
    /**
     * Every component `type` value allowed in a saved `components_json` tree.
     * This list is the source of truth for both the JS-side registry and server-side validation.
     */
    public const ALLOWED_TYPES = [
        // Layout primitives
        'mp-section',
        'mp-column',

        // GrapesJS built-in for inline text
        'textnode',

        // 20 widgets (Plan 6 implements them client-side)
        // Content (8)
        'mp-heading',
        'mp-text',
        'mp-image',
        'mp-button',
        'mp-icon',
        'mp-icon-box',
        'mp-divider',
        'mp-spacer',
        // Media (3)
        'mp-video',
        'mp-carousel',
        'mp-gallery',
        // Interactive (3)
        'mp-accordion',
        'mp-tabs',
        'mp-counter',
        // Social proof (3)
        'mp-testimonial',
        'mp-pricing',
        'mp-social',
        // Utility (3)
        'mp-progress',
        'mp-alert',
        'mp-html',

        // Sub-types for compound widgets (children of their parent widget only)
        'mp-accordion-item',
        'mp-tab',
        'mp-carousel-slide',
    ];

    /** @return string[] */
    public static function allowedTypes(): array
    {
        return self::ALLOWED_TYPES;
    }

    public static function isAllowed(string $type): bool
    {
        return in_array($type, self::ALLOWED_TYPES, true);
    }

    /**
     * Walk a component tree and return any unknown `type` values found.
     *
     * @param  array<int,array<string,mixed>>  $tree
     * @return string[]  Unique unknown type names, in order of first appearance.
     */
    public static function unknownTypesIn(array $tree): array
    {
        $unknown = [];
        self::walk($tree, function (array $node) use (&$unknown) {
            $type = $node['type'] ?? null;
            if (is_string($type) && ! self::isAllowed($type) && ! in_array($type, $unknown, true)) {
                $unknown[] = $type;
            }
        });
        return $unknown;
    }

    /**
     * Returns true if any root-level component is NOT `mp-section`.
     *
     * @param  array<int,array<string,mixed>>  $tree
     */
    public static function hasInvalidRoots(array $tree): bool
    {
        foreach ($tree as $node) {
            if (! is_array($node)) {
                return true;
            }
            if (($node['type'] ?? null) !== 'mp-section') {
                return true;
            }
        }
        return false;
    }

    /**
     * Depth-first walk over a component tree.
     *
     * @param  array<int,array<string,mixed>>  $tree
     * @param  callable(array<string,mixed>):void  $visit
     */
    private static function walk(array $tree, callable $visit): void
    {
        foreach ($tree as $node) {
            if (! is_array($node)) {
                continue;
            }
            $visit($node);
            if (isset($node['components']) && is_array($node['components'])) {
                self::walk($node['components'], $visit);
            }
        }
    }
}
