// CTA Banner — full-width Section with centered heading + button.

export function getCtaBannerTemplate() {
    return {
        type: 'mp-section',
        props: { width: 'full', max_inner_width: 1200, vertical_align: 'middle' },
        components: [{
            tagName: 'div',
            attributes: { class: 'mp-sec__inner' },
            selectable: false, hoverable: false, draggable: false, droppable: '.mp-col',
            components: [
                {
                    type: 'mp-column',
                    props: { size_pct: 100, content_position: 'center' },
                    components: [
                        { type: 'mp-heading', props: { level: 2 }, components: [{ type: 'textnode', content: 'Ready to get started?' }] },
                        { type: 'mp-text', components: [{ type: 'textnode', content: 'Join thousands of teams already shipping with MiniPress.' }] },
                        {
                            type: 'mp-button',
                            props: { link: { url: '/sign-up', target: '_self', rel: null }, size: 'lg', icon: { name: 'arrow-right', position: 'after' } },
                            components: 'Sign up free',
                        },
                    ],
                },
            ],
        }],
    };
}
