// About — Section with heading, paragraph, image.

export function getAboutTemplate() {
    return {
        type: 'mp-section',
        props: { width: 'boxed', max_inner_width: 1200 },
        components: [{
            tagName: 'div', attributes: { class: 'mp-sec__inner' },
            selectable: false, hoverable: false, draggable: false, droppable: '.mp-col',
            components: [
                {
                    type: 'mp-column', props: { size_pct: 60 }, components: [
                        { type: 'mp-heading', props: { level: 2 }, components: [{ type: 'textnode', content: 'About us' }] },
                        { type: 'mp-text', components: [{ type: 'textnode', content: 'We build the tools that help small teams ship faster. Our mission is to make web publishing as easy as writing a tweet.' }] },
                    ],
                },
                {
                    type: 'mp-column', props: { size_pct: 40 }, components: [
                        { type: 'mp-image', props: { src: '/images/placeholder.png', alt: 'About illustration' } },
                    ],
                },
            ],
        }],
    };
}
