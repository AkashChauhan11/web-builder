// mp-html — raw HTML escape hatch.

import { registerContentGroup } from '../style-panel/index.js';

export function registerHtml(editor) {
    editor.DomComponents.addType('mp-html', {
        isComponent: (el) => el.classList?.contains('mp-html'),
        model: {
            defaults: {
                tagName: 'div',
                name: 'HTML',
                draggable: '.mp-col',
                droppable: false,
                attributes: { class: 'mp-html', 'data-mp-widget': 'html' },
                props: { raw_html: '<p>Custom HTML</p>' },
                components: [],
            },
            init() {
                this.on('change:props', this.handlePropsChange);
                this.handlePropsChange();
            },
            handlePropsChange() {
                const props = this.get('props') || {};
                const el = this.getEl();
                if (el) el.innerHTML = props.raw_html || '';
            },
            toHTML() {
                const props = this.get('props') || {};
                return `<div class="mp-html" data-mp-widget="html">${props.raw_html || ''}</div>`;
            },
        },
    });

    registerContentGroup('mp-html', renderContentTab);
}

function renderContentTab(component) {
    const body = document.createElement('div');
    body.className = 'p-3 space-y-3 text-xs';

    const props = component.get('props') || {};

    const lbl = document.createElement('label');
    lbl.className = 'text-[10px] uppercase tracking-wide text-slate-500';
    lbl.textContent = 'Raw HTML';
    body.appendChild(lbl);

    const ta = document.createElement('textarea');
    ta.rows = 10;
    ta.className = 'w-full px-2 py-1 border border-slate-300 rounded font-mono text-xs';
    ta.value = props.raw_html || '';
    ta.addEventListener('blur', () => {
        component.set('props', { ...component.get('props'), raw_html: ta.value });
    });
    body.appendChild(ta);

    const note = document.createElement('p');
    note.className = 'text-[10px] text-slate-500';
    note.textContent = 'Server sanitizes <script> and disallowed tags on save.';
    body.appendChild(note);

    return body;
}
