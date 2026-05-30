<?php

use App\Support\WidgetRegistry;

it('lists every component type allowed in a builder page tree', function () {
    $types = WidgetRegistry::allowedTypes();

    expect($types)->toContain('mp-section', 'mp-column', 'textnode');

    // All 20 Phase-A widgets — these are still NotYetImplemented in Plan 5,
    // but the registry pre-enumerates them so the server side is ready for Plan 6.
    expect($types)->toContain(
        'mp-heading', 'mp-text', 'mp-image', 'mp-button',
        'mp-icon', 'mp-icon-box', 'mp-divider', 'mp-spacer',
        'mp-video', 'mp-carousel', 'mp-gallery',
        'mp-accordion', 'mp-tabs', 'mp-counter',
        'mp-testimonial', 'mp-pricing', 'mp-social',
        'mp-progress', 'mp-alert', 'mp-html',
    );
});

it('lists exactly 34 types — Phase A 28 + Phase C 3 + Form Builder 3', function () {
    expect(WidgetRegistry::allowedTypes())->toHaveCount(34);
});

it('includes Phase C widgets', function () {
    expect(WidgetRegistry::allowedTypes())->toContain('mp-map', 'mp-rating', 'mp-shortcode');
});

it('includes Form Builder widget types', function () {
    expect(WidgetRegistry::allowedTypes())->toContain('mp-form', 'mp-form-field', 'mp-form-submit');
});

it('allows GrapesJS built-in implicit types', function () {
    expect(WidgetRegistry::allowedTypes())->toContain('default', 'wrapper');
});

it('includes compound-widget sub-types', function () {
    expect(WidgetRegistry::allowedTypes())->toContain('mp-accordion-item', 'mp-tab', 'mp-carousel-slide');
});

it('rejects unknown types via isAllowed()', function () {
    expect(WidgetRegistry::isAllowed('mp-heading'))->toBeTrue();
    expect(WidgetRegistry::isAllowed('mp-unknown'))->toBeFalse();
    expect(WidgetRegistry::isAllowed(''))->toBeFalse();
});

it('finds unknown types in a component tree', function () {
    $tree = [
        ['type' => 'mp-section', 'components' => [
            ['type' => 'mp-column', 'components' => [
                ['type' => 'mp-heading', 'components' => [
                    ['type' => 'textnode', 'content' => 'Hi'],
                ]],
                ['type' => 'mp-evil', 'components' => []],  // <-- bad
            ]],
        ]],
    ];

    expect(WidgetRegistry::unknownTypesIn($tree))->toBe(['mp-evil']);
});

it('returns no unknown types for a valid tree', function () {
    $tree = [
        ['type' => 'mp-section', 'components' => [
            ['type' => 'mp-column', 'components' => [
                ['type' => 'mp-button', 'components' => [
                    ['type' => 'textnode', 'content' => 'Click'],
                ]],
            ]],
        ]],
    ];

    expect(WidgetRegistry::unknownTypesIn($tree))->toBe([]);
});

it('rejects roots that are not mp-section', function () {
    $tree = [['type' => 'mp-heading', 'components' => []]];
    expect(WidgetRegistry::hasInvalidRoots($tree))->toBeTrue();

    $valid = [['type' => 'mp-section', 'components' => []]];
    expect(WidgetRegistry::hasInvalidRoots($valid))->toBeFalse();
});

it('flags nodes with non-string type as malformed', function () {
    $tree = [['type' => 123, 'components' => []]];
    expect(WidgetRegistry::hasMalformedNodes($tree))->toBeTrue();
});

it('accepts nodes with missing type (implicit GrapesJS default)', function () {
    // GrapesJS omits `type` from toJSON output for plain elements that match the default type.
    $tree = [['tagName' => 'div', 'components' => []]];
    expect(WidgetRegistry::hasMalformedNodes($tree))->toBeFalse();
});

it('flags nodes with empty-string type as malformed', function () {
    $tree = [['type' => '', 'components' => []]];
    expect(WidgetRegistry::hasMalformedNodes($tree))->toBeTrue();
});

it('flags nodes with non-array components as malformed', function () {
    $tree = [['type' => 'mp-section', 'components' => 'oops']];
    expect(WidgetRegistry::hasMalformedNodes($tree))->toBeTrue();
});

it('accepts well-formed trees', function () {
    $tree = [['type' => 'mp-section', 'components' => [['type' => 'mp-column', 'components' => []]]]];
    expect(WidgetRegistry::hasMalformedNodes($tree))->toBeFalse();
});

it('returns ordered unique unknown types when multiple unknowns present', function () {
    $tree = [
        ['type' => 'mp-section', 'components' => [
            ['type' => 'mp-foo', 'components' => []],
            ['type' => 'mp-bar', 'components' => [['type' => 'mp-foo', 'components' => []]]],
        ]],
    ];
    expect(WidgetRegistry::unknownTypesIn($tree))->toBe(['mp-foo', 'mp-bar']);
});
