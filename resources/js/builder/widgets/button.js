// mp-button — inline-editable label + link + size preset + icon.

import { registerContentGroup } from '../style-panel/index.js';
import { presetChips } from '../controls/preset-chips.js';
import { iconPicker } from '../controls/icon-picker.js';
import { renderIcon } from '../icons/lucide-sprite.js';

const SIZE_CLASSES = ['mp-btn--sm', 'mp-btn--md', 'mp-btn--lg'];

export function registerButton(editor) {
    editor.DomComponents.addType('mp-button', {
        isComponent: (el) => el.tagName === 'A' && el.classList?.contains('mp-btn'),
        model: {
            defaults: {
                tagName: 'a',
                name: 'Button',
                draggable: '.mp-col',
                droppable: false,
                attributes: { class: 'mp-btn mp-btn--md', 'data-mp-widget': 'button', href: '#' },
                props: {
                    link: { url: '#', target: '_self', rel: null },
                    size: 'md',
                    full_width: false,
                    icon: { name: null, position: 'after' },
                },
                components: 'Click me',
                editable: true,
                rte_profile: 'button',
            },
            init() {
                this.on('change:props', this.handlePropsChange);
                this.handlePropsChange();
            },
            handlePropsChange() {
                const props = this.get('props') || {};

                this.removeClass(SIZE_CLASSES);
                this.addClass(['mp-btn', `mp-btn--${props.size || 'md'}`]);

                if (props.full_width) this.addClass('mp-btn--full');
                else this.removeClass('mp-btn--full');

                const link = props.link || {};
                if (link.url) this.addAttributes({ href: link.url });
                if (link.target) this.addAttributes({ target: link.target });
                if (link.rel) this.addAttributes({ rel: link.rel });
                else this.removeAttributes('rel');

                // Render icon as the first or last child without disturbing the editable text
                renderButtonIcon(this, props.icon);
            },
        },
    });

    registerContentGroup('mp-button', renderContentTab);
}

function renderButtonIcon(component, icon) {
    const el = component.getEl();
    if (!el) return;

    // Remove any previous icon wrapper
    el.querySelectorAll('[data-mp-btn-icon]').forEach((n) => n.remove());

    if (!icon?.name) return;

    const wrap = document.createElement('span');
    wrap.dataset.mpBtnIcon = '';
    wrap.style.display = 'inline-flex';
    wrap.contentEditable = 'false';
    wrap.innerHTML = renderIcon(icon.name, { size: 16 });

    if (icon.position === 'before') el.insertBefore(wrap, el.firstChild);
    else el.appendChild(wrap);
}

function renderContentTab(component) {
    const body = document.createElement('div');
    body.className = 'p-3 space-y-3 text-xs';

    const props = component.get('props') || {};

    const url = document.createElement('input');
    url.type = 'url';
    url.className = 'w-full px-2 py-1 border border-slate-300 rounded';
    url.placeholder = 'https:// or /relative';
    url.value = props.link?.url || '';
    url.addEventListener('input', () => {
        component.set('props', {
            ...component.get('props'),
            link: { ...(component.get('props')?.link || {}), url: url.value },
        });
    });
    body.appendChild(labeled('URL', url));

    const target = presetChips({
        options: [{ value: '_self', label: 'Same' }, { value: '_blank', label: 'New tab' }],
        value: props.link?.target || '_self',
        onChange: (v) => component.set('props', {
            ...component.get('props'),
            link: { ...(component.get('props')?.link || {}), target: v },
        }),
    });
    body.appendChild(labeled('Target', target.el));

    const nofollow = document.createElement('label');
    nofollow.className = 'flex items-center gap-2';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = (props.link?.rel || '').includes('nofollow');
    cb.addEventListener('change', () => component.set('props', {
        ...component.get('props'),
        link: { ...(component.get('props')?.link || {}), rel: cb.checked ? 'nofollow' : null },
    }));
    nofollow.appendChild(cb);
    const span = document.createElement('span');
    span.textContent = 'Add rel="nofollow"';
    nofollow.appendChild(span);
    body.appendChild(nofollow);

    const size = presetChips({
        options: [{ value: 'sm', label: 'SM' }, { value: 'md', label: 'MD' }, { value: 'lg', label: 'LG' }],
        value: props.size || 'md',
        onChange: (v) => component.set('props', { ...component.get('props'), size: v }),
    });
    body.appendChild(labeled('Size', size.el));

    const fullWidth = document.createElement('label');
    fullWidth.className = 'flex items-center gap-2';
    const fwCb = document.createElement('input');
    fwCb.type = 'checkbox';
    fwCb.checked = !!props.full_width;
    fwCb.addEventListener('change', () => component.set('props', { ...component.get('props'), full_width: fwCb.checked }));
    fullWidth.appendChild(fwCb);
    const fwSpan = document.createElement('span');
    fwSpan.textContent = 'Full width';
    fullWidth.appendChild(fwSpan);
    body.appendChild(fullWidth);

    const icon = iconPicker({
        value: props.icon?.name || null,
        onChange: (v) => component.set('props', {
            ...component.get('props'),
            icon: { ...(component.get('props')?.icon || {}), name: v, position: component.get('props')?.icon?.position || 'after' },
        }),
    });
    body.appendChild(labeled('Icon', icon.el));

    const iconPos = presetChips({
        options: [{ value: 'before', label: 'Before' }, { value: 'after', label: 'After' }],
        value: props.icon?.position || 'after',
        onChange: (v) => component.set('props', {
            ...component.get('props'),
            icon: { ...(component.get('props')?.icon || {}), position: v },
        }),
    });
    body.appendChild(labeled('Icon position', iconPos.el));

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
