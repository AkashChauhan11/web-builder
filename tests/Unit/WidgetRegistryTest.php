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

it('lists exactly 23 types — section + column + textnode + 20 widgets', function () {
    expect(WidgetRegistry::allowedTypes())->toHaveCount(23);
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
