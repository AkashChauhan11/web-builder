// Feature Grid — boxed Section with three columns of icon-box widgets.

export function getFeatureGridTemplate() {
    return {
        type: 'mp-section',
        props: { width: 'boxed', max_inner_width: 1200 },
        components: [{
            tagName: 'div',
            attributes: { class: 'mp-sec__inner' },
            selectable: false, hoverable: false, draggable: false, droppable: '.mp-col',
            components: [
                {
                    type: 'mp-column',
                    props: { size_pct: 33.33 },
                    components: [{
                        type: 'mp-icon-box',
                        props: { icon_name: 'check-circle', title_tag: 'h3', title_position: 'top', alignment: 'left' },
                    }],
                },
                {
                    type: 'mp-column',
                    props: { size_pct: 33.33 },
                    components: [{
                        type: 'mp-icon-box',
                        props: { icon_name: 'star', title_tag: 'h3', title_position: 'top', alignment: 'left' },
                    }],
                },
                {
                    type: 'mp-column',
                    props: { size_pct: 33.34 },
                    components: [{
                        type: 'mp-icon-box',
                        props: { icon_name: 'heart', title_tag: 'h3', title_position: 'top', alignment: 'left' },
                    }],
                },
            ],
        }],
    };
}
