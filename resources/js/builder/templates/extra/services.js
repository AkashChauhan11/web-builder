// Services — section with heading and 4 icon-box cards.

export function getServicesTemplate() {
    const icons = ['arrow-right', 'star', 'heart', 'check-circle'];
    return {
        type: 'mp-section',
        props: { width: 'boxed', max_inner_width: 1200 },
        components: [{
            tagName: 'div', attributes: { class: 'mp-sec__inner' },
            selectable: false, hoverable: false, draggable: false, droppable: '.mp-col',
            components: [
                {
                    type: 'mp-column', props: { size_pct: 100, content_position: 'center' }, components: [
                        { type: 'mp-heading', props: { level: 2 }, components: [{ type: 'textnode', content: 'Our services' }] },
                        { type: 'mp-text', components: [{ type: 'textnode', content: 'Everything you need to launch a beautiful website.' }] },
                    ],
                },
                ...icons.map((icon) => ({
                    type: 'mp-column', props: { size_pct: 25 }, components: [{
                        type: 'mp-icon-box', props: { icon_name: icon, title_position: 'top', alignment: 'center' },
                    }],
                })),
            ],
        }],
    };
}
