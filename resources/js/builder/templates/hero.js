// Hero — full-width Section with text on left, image on right.

export function getHeroTemplate() {
    return {
        type: 'mp-section',
        props: { width: 'full', max_inner_width: 1200, vertical_align: 'middle', min_height_mode: 'fixed', min_height: 480 },
        components: [{
            tagName: 'div',
            attributes: { class: 'mp-sec__inner' },
            selectable: false, hoverable: false, draggable: false, droppable: '.mp-col',
            components: [
                {
                    type: 'mp-column',
                    props: { size_pct: 50, vertical_align: 'middle', content_position: 'start' },
                    components: [
                        { type: 'mp-heading', props: { level: 1 }, components: [{ type: 'textnode', content: 'Welcome to MiniPress' }] },
                        { type: 'mp-text', components: [{ type: 'textnode', content: 'Build pages visually in minutes — no code required.' }] },
                        {
                            type: 'mp-button',
                            props: { link: { url: '/get-started', target: '_self', rel: null }, size: 'lg', full_width: false, icon: { name: 'arrow-right', position: 'after' } },
                            components: 'Get Started',
                        },
                    ],
                },
                {
                    type: 'mp-column',
                    props: { size_pct: 50, vertical_align: 'middle' },
                    components: [
                        { type: 'mp-image', props: { src: '/images/placeholder.png', alt: 'Hero illustration' } },
                    ],
                },
            ],
        }],
    };
}
