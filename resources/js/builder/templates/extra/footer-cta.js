// Footer CTA — closing call to action section.

export function getFooterCtaTemplate() {
    return {
        type: 'mp-section',
        props: { width: 'full', max_inner_width: 800, vertical_align: 'middle', min_height_mode: 'fixed', min_height: 320 },
        components: [{
            tagName: 'div', attributes: { class: 'mp-sec__inner' },
            selectable: false, hoverable: false, draggable: false, droppable: '.mp-col',
            components: [
                {
                    type: 'mp-column', props: { size_pct: 100, content_position: 'center' }, components: [
                        { type: 'mp-heading', props: { level: 2 }, components: [{ type: 'textnode', content: 'Ready to launch?' }] },
                        { type: 'mp-text', components: [{ type: 'textnode', content: 'Join thousands of teams already publishing with MiniPress.' }] },
                        {
                            type: 'mp-button',
                            props: {
                                link: { url: '/signup', target: '_self', rel: null },
                                size: 'lg', icon: { name: 'arrow-right', position: 'after' },
                            },
                            components: 'Start free trial',
                        },
                    ],
                },
            ],
        }],
    };
}
