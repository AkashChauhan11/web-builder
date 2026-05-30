// Portfolio — heading + 6-image gallery.

export function getPortfolioTemplate() {
    return {
        type: 'mp-section',
        props: { width: 'boxed', max_inner_width: 1200 },
        components: [{
            tagName: 'div', attributes: { class: 'mp-sec__inner' },
            selectable: false, hoverable: false, draggable: false, droppable: '.mp-col',
            components: [
                {
                    type: 'mp-column', props: { size_pct: 100, content_position: 'center' }, components: [
                        { type: 'mp-heading', props: { level: 2 }, components: [{ type: 'textnode', content: 'Recent work' }] },
                        {
                            type: 'mp-gallery',
                            props: {
                                columns: 3, gap: 12, lightbox_enabled: true,
                                images: Array.from({ length: 6 }).map(() => ({
                                    src: '/images/placeholder.png', alt: '', caption: '',
                                })),
                            },
                        },
                    ],
                },
            ],
        }],
    };
}
