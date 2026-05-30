// Contact — Section with two columns: heading+text and contact details.

export function getContactTemplate() {
    return {
        type: 'mp-section',
        props: { width: 'boxed', max_inner_width: 1200 },
        components: [{
            tagName: 'div', attributes: { class: 'mp-sec__inner' },
            selectable: false, hoverable: false, draggable: false, droppable: '.mp-col',
            components: [
                {
                    type: 'mp-column', props: { size_pct: 50 }, components: [
                        { type: 'mp-heading', props: { level: 2 }, components: [{ type: 'textnode', content: 'Get in touch' }] },
                        { type: 'mp-text', components: [{ type: 'textnode', content: 'Have a question or want to work with us? We respond within 24 hours.' }] },
                    ],
                },
                {
                    type: 'mp-column', props: { size_pct: 50 }, components: [
                        { type: 'mp-icon-box', props: { icon_name: 'mail', title_position: 'left', alignment: 'left' } },
                        { type: 'mp-icon-box', props: { icon_name: 'phone', title_position: 'left', alignment: 'left' } },
                        { type: 'mp-icon-box', props: { icon_name: 'map-pin', title_position: 'left', alignment: 'left' } },
                    ],
                },
            ],
        }],
    };
}
