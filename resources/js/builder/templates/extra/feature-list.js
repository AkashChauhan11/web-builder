// Feature list — left text block, right vertical icon-box list.

export function getFeatureListTemplate() {
    return {
        type: 'mp-section',
        props: { width: 'boxed', max_inner_width: 1200 },
        components: [{
            tagName: 'div', attributes: { class: 'mp-sec__inner' },
            selectable: false, hoverable: false, draggable: false, droppable: '.mp-col',
            components: [
                {
                    type: 'mp-column', props: { size_pct: 40, vertical_align: 'middle' }, components: [
                        { type: 'mp-heading', props: { level: 2 }, components: [{ type: 'textnode', content: 'Built for teams that ship' }] },
                        { type: 'mp-text', components: [{ type: 'textnode', content: 'Everything you need to launch and grow.' }] },
                    ],
                },
                {
                    type: 'mp-column', props: { size_pct: 60 }, components: [
                        { type: 'mp-icon-box', props: { icon_name: 'check-circle', title_position: 'left', alignment: 'left' } },
                        { type: 'mp-icon-box', props: { icon_name: 'check-circle', title_position: 'left', alignment: 'left' } },
                        { type: 'mp-icon-box', props: { icon_name: 'check-circle', title_position: 'left', alignment: 'left' } },
                    ],
                },
            ],
        }],
    };
}
