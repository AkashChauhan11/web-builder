// Team — heading + 4 testimonial-card-shaped team member cards.

export function getTeamTemplate() {
    return {
        type: 'mp-section',
        props: { width: 'boxed', max_inner_width: 1200 },
        components: [{
            tagName: 'div', attributes: { class: 'mp-sec__inner' },
            selectable: false, hoverable: false, draggable: false, droppable: '.mp-col',
            components: [
                {
                    type: 'mp-column', props: { size_pct: 100 }, components: [
                        { type: 'mp-heading', props: { level: 2 }, components: [{ type: 'textnode', content: 'Meet the team' }] },
                    ],
                },
                ...Array.from({ length: 4 }).map(() => ({
                    type: 'mp-column', props: { size_pct: 25 }, components: [{
                        type: 'mp-testimonial', props: { image_src: '/images/placeholder.png', layout: 'image-top', star_rating: 0 },
                    }],
                })),
            ],
        }],
    };
}
