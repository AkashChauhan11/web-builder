// mp-image — single image with optional caption + link + lightbox flag.

import { registerContentGroup } from '../style-panel/index.js';

export function registerImage(editor) {
    editor.DomComponents.addType('mp-image', {
        isComponent: (el) => el.tagName === 'FIGURE' && el.classList?.contains('mp-image'),
        model: {
            defaults: {
                tagName: 'figure',
                name: 'Image',
                draggable: '.mp-col',
                droppable: false,
                attributes: { class: 'mp-image', 'data-mp-widget': 'image' },
                props: {
                    src: '/images/placeholder.png',
                    alt: '',
                    link: null,
                    lightbox_enabled: false,
                    caption: '',
                },
                components: [
                    {
                        tagName: 'img',
                        attributes: { class: 'mp-image__img', src: '/images/placeholder.png', alt: '', loading: 'lazy' },
                        selectable: false, hoverable: false, draggable: false, droppable: false,
                    },
                    {
                        tagName: 'figcaption',
                        attributes: { class: 'mp-image__caption' },
                        components: [{ type: 'textnode', content: '' }],
                        editable: true, rte_profile: 'inline',
                        draggable: false, droppable: false,
                    },
                ],
            },
            init() {
                this.on('change:props', this.handlePropsChange);
                this.handlePropsChange();
            },
            handlePropsChange() {
                const props = this.get('props') || {};
                const img = this.getEl()?.querySelector('img.mp-image__img');
                if (img) {
                    img.setAttribute('src', props.src || '');
                    img.setAttribute('alt', props.alt || '');
                }
                if (props.lightbox_enabled) this.addAttributes({ 'data-mp-lightbox': '1' });
                else this.removeAttributes('data-mp-lightbox');
            },
        },
    });

    registerContentGroup('mp-image', renderContentTab);
}

function renderContentTab(component, editor) {
    const body = document.createElement('div');
    body.className = 'p-3 space-y-3 text-xs';

    const props = component.get('props') || {};

    const srcRow = document.createElement('div');
    srcRow.className = 'flex gap-2';
    const srcInput = document.createElement('input');
    srcInput.type = 'text';
    srcInput.className = 'flex-1 min-w-0 px-2 py-1 border border-slate-300 rounded';
    srcInput.value = props.src || '';
    srcInput.placeholder = '/storage/builder-assets/...';
    srcInput.addEventListener('input', () => component.set('props', { ...component.get('props'), src: srcInput.value }));
    srcRow.appendChild(srcInput);

    const pickBtn = document.createElement('button');
    pickBtn.type = 'button';
    pickBtn.className = 'px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded';
    pickBtn.textContent = 'Pick';
    pickBtn.addEventListener('click', () => {
        editor.AssetManager.open({
            select: (asset) => {
                srcInput.value = asset.getSrc();
                component.set('props', { ...component.get('props'), src: asset.getSrc() });
                editor.AssetManager.close();
            },
        });
    });
    srcRow.appendChild(pickBtn);
    body.appendChild(labeled('Source', srcRow));

    const alt = document.createElement('input');
    alt.type = 'text';
    alt.className = 'w-full px-2 py-1 border border-slate-300 rounded';
    alt.value = props.alt || '';
    alt.addEventListener('input', () => component.set('props', { ...component.get('props'), alt: alt.value }));
    body.appendChild(labeled('Alt text', alt));

    const link = document.createElement('input');
    link.type = 'url';
    link.className = 'w-full px-2 py-1 border border-slate-300 rounded';
    link.placeholder = 'https:// (optional)';
    link.value = props.link?.url || '';
    link.addEventListener('input', () => {
        const next = link.value ? { url: link.value, target: '_self' } : null;
        component.set('props', { ...component.get('props'), link: next });
    });
    body.appendChild(labeled('Link URL', link));

    const lightbox = document.createElement('label');
    lightbox.className = 'flex items-center gap-2';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = !!props.lightbox_enabled;
    cb.addEventListener('change', () => component.set('props', { ...component.get('props'), lightbox_enabled: cb.checked }));
    lightbox.appendChild(cb);
    const sp = document.createElement('span');
    sp.textContent = 'Enable lightbox on click';
    lightbox.appendChild(sp);
    body.appendChild(lightbox);

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
