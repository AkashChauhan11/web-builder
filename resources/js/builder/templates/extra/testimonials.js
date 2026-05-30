// Testimonials — 3 testimonial cards.

export function getTestimonialsTemplate() {
    return {
        type: 'mp-section',
        props: { width: 'boxed', max_inner_width: 1200 },
        components: [{
            tagName: 'div', attributes: { class: 'mp-sec__inner' },
            selectable: false, hoverable: false, draggable: false, droppable: '.mp-col',
            components: [
                {
                    type: 'mp-column', props: { size_pct: 100, content_position: 'center' }, components: [
                        { type: 'mp-heading', props: { level: 2 }, components: [{ type: 'textnode', content: 'What our customers say' }] },
                    ],
                },
                ...Array.from({ length: 3 }).map(() => ({
                    type: 'mp-column', props: { size_pct: 33.33 }, components: [{
                        type: 'mp-testimonial', props: { image_src: '/images/placeholder.png', layout: 'image-top', star_rating: 5 },
                    }],
                })),
            ],
        }],
    };
}
