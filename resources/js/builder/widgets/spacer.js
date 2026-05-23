// mp-spacer — vertical empty space. Height set via Style tab → Sizing.

import { registerContentGroup } from '../style-panel/index.js';
import { numberWithUnit } from '../controls/number-with-unit.js';

export function registerSpacer(editor) {
    editor.DomComponents.addType('mp-spacer', {
        isComponent: (el) => el.classList?.contains('mp-spacer'),
        model: {
            defaults: {
                tagName: 'div',
                name: 'Spacer',
                draggable: '.mp-col',
                droppable: false,
                attributes: { class: 'mp-spacer', 'data-mp-widget': 'spacer' },
                props: { height: 50 },
                components: [],
                'style-default': { height: '50px' },
            },
            init() {
                this.on('change:props', this.handlePropsChange);
                this.handlePropsChange();
            },
            handlePropsChange() {
                const props = this.get('props') || {};
                const height = parseInt(props.height, 10);
                if (height > 0) this.addStyle({ height: `${height}px` });
            },
        },
    });

    registerContentGroup('mp-spacer', renderContentTab);
}

function renderContentTab(component) {
    const body = document.createElement('div');
    body.className = 'p-3 space-y-3 text-xs';

    const props = component.get('props') || {};

    const height = numberWithUnit({
        value: props.height || 50,
        unit: 'px',
        units: ['px', 'vh'],
        min: 1, max: 800,
        onChange: ({ value }) => component.set('props', { ...component.get('props'), height: value }),
    });
    body.appendChild(labeled('Height', height.el));

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
