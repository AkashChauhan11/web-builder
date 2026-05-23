// mp-carousel + mp-carousel-slide — image carousel.
// In the editor canvas, slides display side-by-side (scrollable strip). Embla initializes on public pages only (Plan 7).

import { registerContentGroup } from '../style-panel/index.js';
import { slider } from '../controls/slider.js';
import { numberWithUnit } from '../controls/number-with-unit.js';

const SLIDE_CLASSES = ['mp-carousel--slides-1', 'mp-carousel--slides-2', 'mp-carousel--slides-3', 'mp-carousel--slides-4', 'mp-carousel--slides-5', 'mp-carousel--slides-6'];

const SLIDE_DEFAULTS = () => ({
    type: 'mp-carousel-slide',
});

export function registerCarousel(editor) {
    editor.DomComponents.addType('mp-carousel', {
        isComponent: (el) => el.classList?.contains('mp-carousel'),
        model: {
            defaults: {
                tagName: 'div',
                name: 'Carousel',
                draggable: '.mp-col',
                droppable: '[data-mp-widget="carousel-slide"]',
                attributes: { class: 'mp-carousel mp-carousel--slides-1', 'data-mp-widget': 'carousel' },
                props: {
                    autoplay_ms: 0,
                    loop: true,
                    show_arrows: true,
                    show_dots: true,
                    slides_per_view: 1,
                },
                components: [
                    {
                        tagName: 'div',
                        attributes: { class: 'mp-carousel__viewport' },
                        selectable: false, hoverable: false, draggable: false, droppable: '[data-mp-widget="carousel-slide"]',
                        components: [
                            {
                                tagName: 'div',
                                attributes: { class: 'mp-carousel__container' },
                                selectable: false, hoverable: false, draggable: false, droppable: '[data-mp-widget="carousel-slide"]',
                                components: [SLIDE_DEFAULTS(), SLIDE_DEFAULTS(), SLIDE_DEFAULTS()],
                            },
                        ],
                    },
                ],
            },
            init() {
                this.on('change:props', this.handlePropsChange);
                this.handlePropsChange();
            },
            handlePropsChange() {
                const props = this.get('props') || {};

                this.removeClass(SLIDE_CLASSES);
                const n = Math.min(6, Math.max(1, parseInt(props.slides_per_view, 10) || 1));
                this.addClass(`mp-carousel--slides-${n}`);

                this.addAttributes({
                    'data-mp-autoplay': String(parseInt(props.autoplay_ms, 10) || 0),
                    'data-mp-loop': props.loop ? '1' : '0',
                    'data-mp-arrows': props.show_arrows ? '1' : '0',
                    'data-mp-dots': props.show_dots ? '1' : '0',
                });
            },
        },
    });

    editor.DomComponents.addType('mp-carousel-slide', {
        isComponent: (el) => el.classList?.contains('mp-carousel__slide'),
        model: {
            defaults: {
                tagName: 'div',
                name: 'Slide',
                draggable: '.mp-carousel__container',
                droppable: false,
                attributes: { class: 'mp-carousel__slide', 'data-mp-widget': 'carousel-slide' },
                props: { src: '/images/placeholder.png', alt: '', caption: '' },
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
                el.innerHTML = `
                    <img src="${escapeAttr(props.src || '')}" alt="${escapeAttr(props.alt || '')}" loading="lazy">
                    ${props.caption ? `<div class="mp-carousel__caption">${escapeText(props.caption)}</div>` : ''}
                `;
            },
        },
    });

    registerContentGroup('mp-carousel', renderCarouselContent);
    registerContentGroup('mp-carousel-slide', renderSlideContent);
}

function renderCarouselContent(component) {
    const body = document.createElement('div');
    body.className = 'p-3 space-y-3 text-xs';

    const props = component.get('props') || {};

    const auto = numberWithUnit({
        value: props.autoplay_ms || 0,
        unit: 'ms', units: ['ms'],
        min: 0, max: 20000, step: 500,
        onChange: ({ value }) => component.set('props', { ...component.get('props'), autoplay_ms: value }),
    });
    body.appendChild(labeled('Autoplay (0 = off)', auto.el));

    const slidesPerView = slider({
        min: 1, max: 6, step: 1,
        value: props.slides_per_view || 1,
        onChange: (v) => component.set('props', { ...component.get('props'), slides_per_view: v }),
    });
    body.appendChild(labeled('Slides per view', slidesPerView.el));

    body.appendChild(checkbox('Loop', !!props.loop, (c) => component.set('props', { ...component.get('props'), loop: c })));
    body.appendChild(checkbox('Show arrows', !!props.show_arrows, (c) => component.set('props', { ...component.get('props'), show_arrows: c })));
    body.appendChild(checkbox('Show dots', !!props.show_dots, (c) => component.set('props', { ...component.get('props'), show_dots: c })));

    const add = document.createElement('button');
    add.type = 'button';
    add.className = 'w-full px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded';
    add.textContent = '+ Add slide';
    add.addEventListener('click', () => {
        const container = component.find('.mp-carousel__container')[0];
        container?.append(SLIDE_DEFAULTS());
    });
    body.appendChild(add);

    return body;
}

function renderSlideContent(component, editor) {
    const body = document.createElement('div');
    body.className = 'p-3 space-y-3 text-xs';

    const props = component.get('props') || {};

    const srcRow = document.createElement('div');
    srcRow.className = 'flex gap-2';
    const src = document.createElement('input');
    src.type = 'text';
    src.className = 'flex-1 min-w-0 px-2 py-1 border border-slate-300 rounded';
    src.value = props.src || '';
    src.addEventListener('input', () => component.set('props', { ...component.get('props'), src: src.value }));
    srcRow.appendChild(src);

    const pick = document.createElement('button');
    pick.type = 'button';
    pick.className = 'px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded';
    pick.textContent = 'Pick';
    pick.addEventListener('click', () => {
        editor.AssetManager.open({
            select: (asset) => {
                src.value = asset.getSrc();
                component.set('props', { ...component.get('props'), src: asset.getSrc() });
                editor.AssetManager.close();
            },
        });
    });
    srcRow.appendChild(pick);
    body.appendChild(labeled('Image URL', srcRow));

    const alt = document.createElement('input');
    alt.type = 'text';
    alt.className = 'w-full px-2 py-1 border border-slate-300 rounded';
    alt.value = props.alt || '';
    alt.addEventListener('input', () => component.set('props', { ...component.get('props'), alt: alt.value }));
    body.appendChild(labeled('Alt text', alt));

    const cap = document.createElement('input');
    cap.type = 'text';
    cap.className = 'w-full px-2 py-1 border border-slate-300 rounded';
    cap.value = props.caption || '';
    cap.addEventListener('input', () => component.set('props', { ...component.get('props'), caption: cap.value }));
    body.appendChild(labeled('Caption', cap));

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'w-full px-2 py-1 text-xs bg-red-50 text-red-700 hover:bg-red-100 rounded';
    del.textContent = 'Remove slide';
    del.addEventListener('click', () => component.remove());
    body.appendChild(del);

    return body;
}

function checkbox(text, checked, onChange) {
    const lbl = document.createElement('label');
    lbl.className = 'flex items-center gap-2';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = checked;
    cb.addEventListener('change', () => onChange(cb.checked));
    lbl.appendChild(cb);
    const sp = document.createElement('span');
    sp.textContent = text;
    lbl.appendChild(sp);
    return lbl;
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

function escapeAttr(s) { return String(s ?? '').replace(/"/g, '&quot;'); }
function escapeText(s) { return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
