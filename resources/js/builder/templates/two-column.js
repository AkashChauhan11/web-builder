// Two Column — boxed Section with two equal columns of heading + text.

export function getTwoColumnTemplate() {
    return {
        type: 'mp-section',
        props: { width: 'boxed', max_inner_width: 1200, vertical_align: 'top' },
        components: [{
            tagName: 'div',
            attributes: { class: 'mp-sec__inner' },
            selectable: false, hoverable: false, draggable: false, droppable: '.mp-col',
            components: [
                {
                    type: 'mp-column',
                    props: { size_pct: 50 },
                    components: [
                        { type: 'mp-heading', props: { level: 2 }, components: [{ type: 'textnode', content: 'Left column heading' }] },
                        { type: 'mp-text', components: [{ type: 'textnode', content: 'Describe the left side here.' }] },
                    ],
                },
                {
                    type: 'mp-column',
                    props: { size_pct: 50 },
                    components: [
                        { type: 'mp-heading', props: { level: 2 }, components: [{ type: 'textnode', content: 'Right column heading' }] },
                        { type: 'mp-text', components: [{ type: 'textnode', content: 'Describe the right side here.' }] },
                    ],
                },
            ],
        }],
    };
}
