// mp-social — row of platform icon links.

import { registerContentGroup } from '../style-panel/index.js';
import { presetChips } from '../controls/preset-chips.js';
import { numberWithUnit } from '../controls/number-with-unit.js';
import { renderIcon, hasIcon } from '../icons/lucide-sprite.js';

const SHAPE_CLASSES = ['mp-social--none', 'mp-social--square', 'mp-social--circle'];
const SIZE_CLASSES = ['mp-social--sm', 'mp-social--md', 'mp-social--lg'];

const PLATFORMS = [
    { value: 'facebook',  label: 'Facebook',  icon: 'facebook',  prefix: 'https://' },
    { value: 'twitter',   label: 'X/Twitter', icon: 'twitter',   prefix: 'https://' },
    { value: 'instagram', label: 'Instagram', icon: 'instagram', prefix: 'https://' },
    { value: 'linkedin',  label: 'LinkedIn',  icon: 'linkedin',  prefix: 'https://' },
    { value: 'youtube',   label: 'YouTube',   icon: 'youtube',   prefix: 'https://' },
    { value: 'github',    label: 'GitHub',    icon: 'github',    prefix: 'https://' },
    { value: 'email',     label: 'Email',     icon: 'mail',      prefix: 'mailto:' },
    { value: 'phone',     label: 'Phone',     icon: 'phone',     prefix: 'tel:' },
];

export function registerSocial(editor) {
    editor.DomComponents.addType('mp-social', {
        isComponent: (el) => el.classList?.contains('mp-social'),
        model: {
            defaults: {
                tagName: 'div',
                name: 'Social',
                draggable: '.mp-col',
                droppable: false,
                attributes: { class: 'mp-social mp-social--circle mp-social--md', 'data-mp-widget': 'social' },
                props: {
                    networks: [
                        { platform: 'facebook',  url: 'https://facebook.com/' },
                        { platform: 'twitter',   url: 'https://twitter.com/' },
                        { platform: 'instagram', url: 'https://instagram.com/' },
                    ],
                    shape: 'circle',
                    size: 'md',
                    gap: 8,
                },
                components: [],
            },
            init() {
                this.on('change:props', this.handlePropsChange);
                this.handlePropsChange();
            },
            handlePropsChange() {
                const props = this.get('props') || {};

                this.removeClass(SHAPE_CLASSES);
                this.addClass(`mp-social--${props.shape || 'circle'}`);

                this.removeClass(SIZE_CLASSES);
                this.addClass(`mp-social--${props.size || 'md'}`);

                if (props.gap !== undefined) this.addStyle({ gap: `${parseInt(props.gap, 10)}px` });

                const el = this.getEl();
                if (!el) return;
                el.innerHTML = (props.networks || []).map((n) => renderLink(n)).join('');
            },
            toHTML() {
                const props = this.get('props') || {};
                const links = (props.networks || []).map((n) => renderLink(n)).join('');
                return `<div class="mp-social mp-social--${props.shape || 'circle'} mp-social--${props.size || 'md'}" data-mp-widget="social" style="gap:${parseInt(props.gap, 10) || 8}px">${links}</div>`;
            },
        },
    });

    registerContentGroup('mp-social', renderContentTab);
}

function renderLink(n) {
    const platform = PLATFORMS.find((p) => p.value === n.platform);
    if (!platform || !hasIcon(platform.icon)) return '';
    const target = (n.platform === 'email' || n.platform === 'phone') ? '' : ' target="_blank" rel="noopener noreferrer"';
    return `<a href="${escapeAttr(n.url || '')}" class="mp-social__link" data-platform="${n.platform}"${target}>${renderIcon(platform.icon, { size: 18 })}</a>`;
}

function renderContentTab(component) {
    const body = document.createElement('div');
    body.className = 'p-3 space-y-3 text-xs';

    const props = component.get('props') || {};

    const shape = presetChips({
        options: [
            { value: 'none', label: 'None' },
            { value: 'square', label: 'Square' },
            { value: 'circle', label: 'Circle' },
        ],
        value: props.shape || 'circle',
        onChange: (v) => component.set('props', { ...component.get('props'), shape: v }),
    });
    body.appendChild(labeled('Shape', shape.el));

    const size = presetChips({
        options: [
            { value: 'sm', label: 'SM' },
            { value: 'md', label: 'MD' },
            { value: 'lg', label: 'LG' },
        ],
        value: props.size || 'md',
        onChange: (v) => component.set('props', { ...component.get('props'), size: v }),
    });
    body.appendChild(labeled('Size', size.el));

    const gap = numberWithUnit({
        value: props.gap || 8,
        unit: 'px',
        units: ['px'],
        min: 0, max: 32,
        onChange: ({ value }) => component.set('props', { ...component.get('props'), gap: value }),
    });
    body.appendChild(labeled('Gap', gap.el));

    const listLabel = document.createElement('label');
    listLabel.className = 'text-[10px] uppercase tracking-wide text-slate-500 pt-2 block';
    listLabel.textContent = 'Networks';
    body.appendChild(listLabel);

    const list = document.createElement('div');
    list.className = 'space-y-2';
    body.appendChild(list);

    function renderList() {
        list.innerHTML = '';
        const networks = component.get('props')?.networks || [];
        networks.forEach((n, idx) => {
            const row = document.createElement('div');
            row.className = 'flex gap-2 items-center';

            const sel = document.createElement('select');
            sel.className = 'px-1 py-1 text-xs border border-slate-300 rounded';
            PLATFORMS.forEach((p) => {
                const opt = document.createElement('option');
                opt.value = p.value;
                opt.textContent = p.label;
                if (p.value === n.platform) opt.selected = true;
                sel.appendChild(opt);
            });
            sel.addEventListener('change', () => update(idx, { platform: sel.value }));
            row.appendChild(sel);

            const url = document.createElement('input');
            url.type = 'text';
            url.className = 'flex-1 min-w-0 px-2 py-1 text-xs border border-slate-300 rounded';
            url.value = n.url || '';
            url.addEventListener('input', () => update(idx, { url: url.value }));
            row.appendChild(url);

            const del = document.createElement('button');
            del.type = 'button';
            del.className = 'px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded';
            del.textContent = '×';
            del.addEventListener('click', () => remove(idx));
            row.appendChild(del);

            list.appendChild(row);
        });

        const add = document.createElement('button');
        add.type = 'button';
        add.className = 'w-full px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded';
        add.textContent = '+ Add network';
        add.addEventListener('click', () => {
            const networks = [...(component.get('props')?.networks || []), { platform: 'facebook', url: 'https://' }];
            component.set('props', { ...component.get('props'), networks });
            renderList();
        });
        list.appendChild(add);
    }

    function update(idx, patch) {
        const networks = [...(component.get('props')?.networks || [])];
        networks[idx] = { ...networks[idx], ...patch };
        component.set('props', { ...component.get('props'), networks });
        renderList();
    }
    function remove(idx) {
        const networks = [...(component.get('props')?.networks || [])];
        networks.splice(idx, 1);
        component.set('props', { ...component.get('props'), networks });
        renderList();
    }

    renderList();
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

function escapeAttr(s) { return String(s ?? '').replace(/"/g, '&quot;'); }
