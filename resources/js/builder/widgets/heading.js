// mp-heading — inline-editable heading (h1-h6) with optional link.

import { registerContentGroup } from '../style-panel/index.js';
import { presetChips } from '../controls/preset-chips.js';

export function registerHeading(editor) {
    editor.DomComponents.addType('mp-heading', {
        isComponent: (el) => /^H[1-6]$/.test(el.tagName) && el.dataset?.mpWidget === 'heading',
        model: {
            defaults: {
                tagName: 'h2',
                name: 'Heading',
                draggable: '.mp-col',
                droppable: false,
                attributes: { class: 'mp-heading', 'data-mp-widget': 'heading' },
                props: { level: 2, link: null },
                components: 'Heading text',
                editable: true,
                rte_profile: 'heading',
            },
            init() {
                this.on('change:props', this.handlePropsChange);
                this.handlePropsChange();
            },
            handlePropsChange() {
                const props = this.get('props') || {};
                const level = parseInt(props.level, 10);
                if (level >= 1 && level <= 6) this.set('tagName', `h${level}`);
            },
        },
    });

    registerContentGroup('mp-heading', renderContentTab);
}

function renderContentTab(component) {
    const body = document.createElement('div');
    body.className = 'p-3 space-y-3 text-xs';

    const props = component.get('props') || {};

    const levelChips = presetChips({
        options: [1, 2, 3, 4, 5, 6].map((n) => ({ value: n, label: `H${n}` })),
        value: props.level || 2,
        onChange: (v) => component.set('props', { ...component.get('props'), level: v }),
    });
    body.appendChild(labeled('Level', levelChips.el));

    const linkUrl = document.createElement('input');
    linkUrl.type = 'url';
    linkUrl.placeholder = 'https:// (optional)';
    linkUrl.className = 'w-full px-2 py-1 border border-slate-300 rounded';
    linkUrl.value = props.link?.url || '';
    linkUrl.addEventListener('input', () => {
        const next = linkUrl.value ? { url: linkUrl.value, target: '_self' } : null;
        component.set('props', { ...component.get('props'), link: next });
    });
    body.appendChild(labeled('Link URL', linkUrl));

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
