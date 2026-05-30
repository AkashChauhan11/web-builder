// mp-rating — display-only star rating with half-star support.

import { registerContentGroup } from '../style-panel/index.js';
import { slider } from '../controls/slider.js';
import { colorPicker } from '../controls/color-picker.js';

const STAR_PATH = 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z';

export function registerRating(editor) {
    editor.DomComponents.addType('mp-rating', {
        isComponent: (el) => el.classList?.contains('mp-rating'),
        model: {
            defaults: {
                tagName: 'div',
                name: 'Rating',
                draggable: '.mp-col',
                droppable: false,
                attributes: { class: 'mp-rating', 'data-mp-widget': 'rating' },
                props: {
                    value: 4.5,
                    max: 5,
                    color: '#f59e0b',
                    size: 24,
                },
                components: [],
            },
            init() {
                this.on('change:props', this.handlePropsChange);
                this.handlePropsChange();
            },
            handlePropsChange() {
                const props = this.get('props') || {};
                const el = this.getEl();
                if (!el) return;
                el.innerHTML = renderStars(props);
                el.style.color = props.color || '#f59e0b';
            },
            toHTML() {
                const props = this.get('props') || {};
                const inlineColor = `color:${props.color || '#f59e0b'}`;
                return `<div class="mp-rating" data-mp-widget="rating" style="${inlineColor}">${renderStars(props)}</div>`;
            },
        },
    });

    registerContentGroup('mp-rating', renderContentTab);
}

function renderStars(props) {
    const max = Math.max(1, Math.min(10, parseInt(props.max, 10) || 5));
    const value = Math.max(0, Math.min(max, parseFloat(props.value) || 0));
    const size = Math.max(12, Math.min(64, parseInt(props.size, 10) || 24));

    let out = '';
    for (let i = 0; i < max; i++) {
        const fill = Math.max(0, Math.min(1, value - i)); // 0..1
        const fillPct = Math.round(fill * 100);
        const clipId = `mp-r-clip-${Math.random().toString(36).slice(2, 8)}`;
        out += `
            <svg class="mp-rating__star" viewBox="0 0 24 24" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
                <defs><clipPath id="${clipId}"><rect x="0" y="0" width="${fillPct * 0.24}" height="24" /></clipPath></defs>
                <path d="${STAR_PATH}" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.35"/>
                <path d="${STAR_PATH}" fill="currentColor" clip-path="url(#${clipId})"/>
            </svg>`;
    }
    return out;
}

function renderContentTab(component) {
    const body = document.createElement('div');
    body.className = 'p-3 space-y-3 text-xs';

    const props = component.get('props') || {};

    const value = slider({
        min: 0, max: 5, step: 0.5,
        value: props.value || 0,
        onChange: (v) => component.set('props', { ...component.get('props'), value: v }),
    });
    body.appendChild(labeled('Value', value.el));

    const size = slider({
        min: 12, max: 64, step: 2,
        value: props.size || 24,
        onChange: (v) => component.set('props', { ...component.get('props'), size: v }),
    });
    body.appendChild(labeled('Size (px)', size.el));

    const color = colorPicker({
        value: props.color || '#f59e0b',
        onChange: (v) => component.set('props', { ...component.get('props'), color: v }),
    });
    body.appendChild(labeled('Color', color.el));

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
