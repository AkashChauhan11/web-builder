// FAQ — heading + accordion with 4 default items.

export function getFaqTemplate() {
    return {
        type: 'mp-section',
        props: { width: 'boxed', max_inner_width: 800 },
        components: [{
            tagName: 'div', attributes: { class: 'mp-sec__inner' },
            selectable: false, hoverable: false, draggable: false, droppable: '.mp-col',
            components: [
                {
                    type: 'mp-column', props: { size_pct: 100 }, components: [
                        { type: 'mp-heading', props: { level: 2 }, components: [{ type: 'textnode', content: 'Frequently asked questions' }] },
                        {
                            type: 'mp-accordion',
                            props: { allow_multiple_open: false, default_open_index: 0 },
                            components: Array.from({ length: 4 }).map((_, i) => ({
                                type: 'mp-accordion-item',
                                props: { open: i === 0 },
                            })),
                        },
                    ],
                },
            ],
        }],
    };
}
