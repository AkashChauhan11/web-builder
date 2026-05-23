// mp-testimonial — quote card with avatar, author, role, and star rating.

import { registerContentGroup } from '../style-panel/index.js';
import { presetChips } from '../controls/preset-chips.js';
import { slider } from '../controls/slider.js';
import { renderIcon } from '../icons/lucide-sprite.js';

const LAYOUT_CLASSES = ['mp-testimonial--image-top', 'mp-testimonial--image-left', 'mp-testimonial--image-right'];

export function registerTestimonial(editor) {
    editor.DomComponents.addType('mp-testimonial', {
        isComponent: (el) => el.classList?.contains('mp-testimonial'),
        model: {
            defaults: {
                tagName: 'div',
                name: 'Testimonial',
                draggable: '.mp-col',
                droppable: false,
                attributes: { class: 'mp-testimonial mp-testimonial--image-top', 'data-mp-widget': 'testimonial' },
                props: {
                    image_src: '/images/placeholder.png',
                    layout: 'image-top',
                    star_rating: 5,
                },
                components: [
                    {
                        tagName: 'img',
                        attributes: { class: 'mp-testimonial__avatar', src: '/images/placeholder.png', alt: '' },
                        selectable: false, hoverable: false, draggable: false, droppable: false,
                    },
                    {
                        tagName: 'blockquote',
                        attributes: { class: 'mp-testimonial__quote' },
                        components: [{ type: 'textnode', content: '"This product changed how we work. Highly recommended."' }],
                        editable: true, rte_profile: 'inline',
                        draggable: false, droppable: false,
                    },
                    {
                        tagName: 'cite',
                        attributes: { class: 'mp-testimonial__author' },
                        components: 'Jane Doe',
                        editable: true, rte_profile: 'inline',
                        draggable: false, droppable: false,
                    },
                    {
                        tagName: 'span',
                        attributes: { class: 'mp-testimonial__role' },
                        components: 'CEO, Example Co.',
                        editable: true, rte_profile: 'inline',
                        draggable: false, droppable: false,
                    },
                    {
                        tagName: 'div',
                        attributes: { class: 'mp-testimonial__stars' },
                        selectable: false, hoverable: false, draggable: false, droppable: false,
                    },
                ],
            },
            init() {
                this.on('change:props', this.handlePropsChange);
                this.handlePropsChange();
            },
            handlePropsChange() {
                const props = this.get('props') || {};

                this.removeClass(LAYOUT_CLASSES);
                this.addClass(`mp-testimonial--${props.layout || 'image-top'}`);

                const el = this.getEl();
                if (!el) return;
                const img = el.querySelector('img.mp-testimonial__avatar');
                if (img) img.setAttribute('src', props.image_src || '');

                const stars = el.querySelector('.mp-testimonial__stars');
                if (stars) {
                    stars.innerHTML = '';
                    const rating = Math.max(0, Math.min(5, parseInt(props.star_rating, 10) || 0));
                    for (let i = 0; i < 5; i++) {
                        stars.insertAdjacentHTML('beforeend', renderIcon('star', { size: 16, className: i < rating ? 'mp-star-filled' : 'mp-star-empty' }));
                    }
                }
            },
        },
    });

    registerContentGroup('mp-testimonial', renderContentTab);
}

function renderContentTab(component, editor) {
    const body = document.createElement('div');
    body.className = 'p-3 space-y-3 text-xs';

    const props = component.get('props') || {};

    const layout = presetChips({
        options: [
            { value: 'image-top',   label: 'Top' },
            { value: 'image-left',  label: 'Left' },
            { value: 'image-right', label: 'Right' },
        ],
        value: props.layout || 'image-top',
        onChange: (v) => component.set('props', { ...component.get('props'), layout: v }),
    });
    body.appendChild(labeled('Avatar position', layout.el));

    const srcRow = document.createElement('div');
    srcRow.className = 'flex gap-2';
    const src = document.createElement('input');
    src.type = 'text';
    src.className = 'flex-1 min-w-0 px-2 py-1 border border-slate-300 rounded';
    src.value = props.image_src || '';
    src.addEventListener('input', () => component.set('props', { ...component.get('props'), image_src: src.value }));
    srcRow.appendChild(src);

    const pick = document.createElement('button');
    pick.type = 'button';
    pick.className = 'px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded';
    pick.textContent = 'Pick';
    pick.addEventListener('click', () => {
        editor.AssetManager.open({
            select: (asset) => {
                src.value = asset.getSrc();
                component.set('props', { ...component.get('props'), image_src: asset.getSrc() });
                editor.AssetManager.close();
            },
        });
    });
    srcRow.appendChild(pick);
    body.appendChild(labeled('Avatar', srcRow));

    const stars = slider({
        min: 0, max: 5, step: 1,
        value: props.star_rating || 5,
        onChange: (v) => component.set('props', { ...component.get('props'), star_rating: v }),
    });
    body.appendChild(labeled('Star rating', stars.el));

    return body;
}

function labeled(label, control) {
    const w = document.createElement('div');
    w.className = 'flex flex-col gap-1';
    const l = document.createElement('label');
    l.className = 'text-[10px] uppercase tracking-wide text-slate-500';
    l.textContent = label;
    w.appendChild(l);
    w.appendChild(control);
    return w;
}
