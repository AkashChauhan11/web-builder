// mp-gallery — grid of images with optional lightbox.

import { registerContentGroup } from '../style-panel/index.js';
import { slider } from '../controls/slider.js';
import { numberWithUnit } from '../controls/number-with-unit.js';

const COL_CLASSES = ['mp-gallery--cols-2', 'mp-gallery--cols-3', 'mp-gallery--cols-4', 'mp-gallery--cols-5', 'mp-gallery--cols-6'];

export function registerGallery(editor) {
    editor.DomComponents.addType('mp-gallery', {
        isComponent: (el) => el.classList?.contains('mp-gallery'),
        model: {
            defaults: {
                tagName: 'div',
                name: 'Gallery',
                draggable: '.mp-col',
                droppable: false,
                attributes: { class: 'mp-gallery mp-gallery--cols-3', 'data-mp-widget': 'gallery' },
                props: {
                    columns: 3,
                    gap: 12,
                    lightbox_enabled: true,
                    images: [
                        { src: '/images/placeholder.png', alt: '', caption: '' },
                        { src: '/images/placeholder.png', alt: '', caption: '' },
                        { src: '/images/placeholder.png', alt: '', caption: '' },
                    ],
                },
                components: [],
            },
            init() {
                this.on('change:props', this.handlePropsChange);
                this.handlePropsChange();
            },
            handlePropsChange() {
                const props = this.get('props') || {};

                this.removeClass(COL_CLASSES);
                const cols = Math.min(6, Math.max(2, parseInt(props.columns, 10) || 3));
                this.addClass(`mp-gallery--cols-${cols}`);

                if (props.gap !== undefined) this.addStyle({ gap: `${parseInt(props.gap, 10)}px` });

                if (props.lightbox_enabled) this.addAttributes({ 'data-mp-lightbox': '1' });
                else this.removeAttributes('data-mp-lightbox');

                // Render the images into the DOM via the canvas element directly
                const el = this.getEl();
                if (!el) return;
                el.innerHTML = '';
                (props.images || []).forEach((img, idx) => {
                    const fig = document.createElement('figure');
                    fig.className = 'mp-gallery__item';
                    fig.dataset.idx = idx;
                    fig.contentEditable = 'false';
                    fig.innerHTML = `
                        <img src="${escapeAttr(img.src)}" alt="${escapeAttr(img.alt)}" loading="lazy">
                        ${img.caption ? `<figcaption>${escapeText(img.caption)}</figcaption>` : ''}
                    `;
                    el.appendChild(fig);
                });
            },
            toHTML() {
                const props = this.get('props') || {};
                const cols = Math.min(6, Math.max(2, parseInt(props.columns, 10) || 3));
                const gap = parseInt(props.gap, 10) || 12;
                const lb = props.lightbox_enabled ? '1' : '0';
                const items = (props.images || []).map((img) => `
                    <figure class="mp-gallery__item">
                        <img src="${escapeAttr(img.src)}" alt="${escapeAttr(img.alt)}" loading="lazy">
                        ${img.caption ? `<figcaption>${escapeText(img.caption)}</figcaption>` : ''}
                    </figure>
                `).join('');
                return `<div class="mp-gallery mp-gallery--cols-${cols}" data-mp-widget="gallery" data-mp-lightbox="${lb}" style="gap:${gap}px">${items}</div>`;
            },
        },
    });

    registerContentGroup('mp-gallery', renderContentTab);
}

function renderContentTab(component, editor) {
    const body = document.createElement('div');
    body.className = 'p-3 space-y-3 text-xs';

    const props = component.get('props') || {};

    const cols = slider({
        min: 2, max: 6, step: 1,
        value: props.columns || 3,
        onChange: (v) => component.set('props', { ...component.get('props'), columns: v }),
    });
    body.appendChild(labeled('Columns', cols.el));

    const gap = numberWithUnit({
        value: props.gap || 12,
        unit: 'px',
        units: ['px'],
        min: 0, max: 64,
        onChange: ({ value }) => component.set('props', { ...component.get('props'), gap: value }),
    });
    body.appendChild(labeled('Gap', gap.el));

    const lb = document.createElement('label');
    lb.className = 'flex items-center gap-2';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = !!props.lightbox_enabled;
    cb.addEventListener('change', () => component.set('props', { ...component.get('props'), lightbox_enabled: cb.checked }));
    lb.appendChild(cb);
    const sp = document.createElement('span');
    sp.textContent = 'Enable lightbox';
    lb.appendChild(sp);
    body.appendChild(lb);

    const listLabel = document.createElement('label');
    listLabel.className = 'text-[10px] uppercase tracking-wide text-slate-500 pt-2 block';
    listLabel.textContent = 'Images';
    body.appendChild(listLabel);

    const list = document.createElement('div');
    list.className = 'space-y-2';
    body.appendChild(list);

    function renderList() {
        list.innerHTML = '';
        const images = component.get('props')?.images || [];
        images.forEach((img, idx) => {
            const row = document.createElement('div');
            row.className = 'flex gap-2 items-start border border-slate-200 rounded p-2';

            const thumb = document.createElement('img');
            thumb.src = img.src || '';
            thumb.className = 'w-12 h-12 object-cover rounded bg-slate-100';
            thumb.alt = '';
            row.appendChild(thumb);

            const fields = document.createElement('div');
            fields.className = 'flex-1 space-y-1';
            const altIn = mkInput('Alt', img.alt || '', (v) => updateImage(idx, { alt: v }));
            const capIn = mkInput('Caption', img.caption || '', (v) => updateImage(idx, { caption: v }));
            const srcIn = mkInput('URL', img.src || '', (v) => updateImage(idx, { src: v }));
            fields.appendChild(srcIn);
            fields.appendChild(altIn);
            fields.appendChild(capIn);
            row.appendChild(fields);

            const actions = document.createElement('div');
            actions.className = 'flex flex-col gap-1';
            const pick = mkBtn('Pick', () => {
                editor.AssetManager.open({
                    select: (asset) => {
                        updateImage(idx, { src: asset.getSrc() });
                        editor.AssetManager.close();
                    },
                });
            });
            const del = mkBtn('×', () => removeImage(idx), 'text-red-600');
            actions.appendChild(pick);
            actions.appendChild(del);
            row.appendChild(actions);

            list.appendChild(row);
        });

        const addBtn = document.createElement('button');
        addBtn.type = 'button';
        addBtn.className = 'w-full px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded';
        addBtn.textContent = '+ Add image';
        addBtn.addEventListener('click', () => {
            const images = [...(component.get('props')?.images || []), { src: '/images/placeholder.png', alt: '', caption: '' }];
            component.set('props', { ...component.get('props'), images });
            renderList();
        });
        list.appendChild(addBtn);
    }

    function updateImage(idx, patch) {
        const images = [...(component.get('props')?.images || [])];
        images[idx] = { ...images[idx], ...patch };
        component.set('props', { ...component.get('props'), images });
        renderList();
    }
    function removeImage(idx) {
        const images = [...(component.get('props')?.images || [])];
        images.splice(idx, 1);
        component.set('props', { ...component.get('props'), images });
        renderList();
    }

    renderList();
    return body;
}

function mkInput(placeholder, value, onInput) {
    const i = document.createElement('input');
    i.type = 'text';
    i.placeholder = placeholder;
    i.value = value;
    i.className = 'w-full px-2 py-1 text-xs border border-slate-300 rounded';
    i.addEventListener('input', () => onInput(i.value));
    return i;
}
function mkBtn(text, onClick, extra = '') {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded ${extra}`;
    b.textContent = text;
    b.addEventListener('click', onClick);
    return b;
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
