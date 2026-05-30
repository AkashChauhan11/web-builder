// mp-shortcode — placeholder widget. The {code} text is preserved as-is in saved HTML,
// then ShortcodeRenderer::replace() substitutes it server-side before public render.

import { registerContentGroup } from '../style-panel/index.js';

const KNOWN = [
    { value: 'site_name',  label: '{site_name}' },
    { value: 'year',       label: '{year}' },
    { value: 'today',      label: '{today}' },
    { value: 'today:short', label: '{today:short}' },
    { value: 'user_email', label: '{user_email}' },
];

export function registerShortcode(editor) {
    editor.DomComponents.addType('mp-shortcode', {
        isComponent: (el) => el.classList?.contains('mp-shortcode'),
        model: {
            defaults: {
                tagName: 'span',
                name: 'Shortcode',
                draggable: '.mp-col',
                droppable: false,
                attributes: { class: 'mp-shortcode', 'data-mp-widget': 'shortcode' },
                props: { code: 'site_name' },
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
                // In the editor canvas, show `[{code}]` so the author sees what's there.
                // The saved HTML contains the literal `{code}` placeholder; the server replaces it.
                el.textContent = `{${props.code || 'site_name'}}`;
            },
            toHTML() {
                const props = this.get('props') || {};
                // Literal placeholder — server-side ShortcodeRenderer expands it on render.
                return `<span class="mp-shortcode" data-mp-widget="shortcode">{${escapeText(props.code || 'site_name')}}</span>`;
            },
        },
    });

    registerContentGroup('mp-shortcode', renderContentTab);
}

function renderContentTab(component) {
    const body = document.createElement('div');
    body.className = 'p-3 space-y-3 text-xs';

    const props = component.get('props') || {};

    const sel = document.createElement('select');
    sel.className = 'w-full px-2 py-1 border border-slate-300 rounded';
    KNOWN.forEach((opt) => {
        const o = document.createElement('option');
        o.value = opt.value;
        o.textContent = opt.label;
        if (opt.value === props.code) o.selected = true;
        sel.appendChild(o);
    });
    sel.addEventListener('change', () => component.set('props', { ...component.get('props'), code: sel.value }));
    body.appendChild(labeled('Built-in', sel));

    const custom = document.createElement('input');
    custom.type = 'text';
    custom.className = 'w-full px-2 py-1 border border-slate-300 rounded font-mono';
    custom.placeholder = 'custom_code or custom_code:param';
    custom.value = props.code || '';
    custom.addEventListener('input', () => component.set('props', { ...component.get('props'), code: custom.value }));
    body.appendChild(labeled('Custom code', custom));

    const note = document.createElement('p');
    note.className = 'text-[10px] text-slate-500';
    note.innerHTML = 'Built-ins: <code>{site_name}</code>, <code>{year}</code>, <code>{today}</code> (or <code>{today:short}</code>, <code>{today:iso}</code>), <code>{user_email}</code>. Server replaces these on render.';
    body.appendChild(note);

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

function escapeText(s) {
    return String(s ?? '').replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
}
