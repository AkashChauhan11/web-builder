// mp-divider — decorative HR.

import { registerContentGroup } from '../style-panel/index.js';
import { presetChips } from '../controls/preset-chips.js';
import { slider } from '../controls/slider.js';
import { numberWithUnit } from '../controls/number-with-unit.js';

const STYLE_CLASSES = ['mp-divider--solid', 'mp-divider--dashed', 'mp-divider--dotted'];
const ALIGN_CLASSES = ['mp-divider--left', 'mp-divider--center', 'mp-divider--right'];

export function registerDivider(editor) {
    editor.DomComponents.addType('mp-divider', {
        isComponent: (el) => el.tagName === 'HR' && el.classList?.contains('mp-divider'),
        model: {
            defaults: {
                tagName: 'hr',
                name: 'Divider',
                draggable: '.mp-col',
                droppable: false,
                attributes: { class: 'mp-divider mp-divider--solid mp-divider--center', 'data-mp-widget': 'divider' },
                props: {
                    style: 'solid',
                    width_pct: 100,
                    alignment: 'center',
                    gap_above: 0,
                },
                components: [],
            },
            init() {
                this.on('change:props', this.handlePropsChange);
                this.handlePropsChange();
            },
            handlePropsChange() {
                const props = this.get('props') || {};

                this.removeClass(STYLE_CLASSES);
                this.addClass(`mp-divider--${props.style || 'solid'}`);

                this.removeClass(ALIGN_CLASSES);
                this.addClass(`mp-divider--${props.alignment || 'center'}`);

                this.addStyle({ width: `${props.width_pct || 100}%` });

                if (props.gap_above && props.gap_above > 0) {
                    this.addStyle({ 'margin-top': `${parseInt(props.gap_above, 10)}px` });
                } else {
                    this.removeStyle('margin-top');
                }
            },
        },
    });

    registerContentGroup('mp-divider', renderContentTab);
}

function renderContentTab(component) {
    const body = document.createElement('div');
    body.className = 'p-3 space-y-3 text-xs';

    const props = component.get('props') || {};

    const style = presetChips({
        options: [
            { value: 'solid', label: 'Solid' },
            { value: 'dashed', label: 'Dashed' },
            { value: 'dotted', label: 'Dotted' },
        ],
        value: props.style || 'solid',
        onChange: (v) => component.set('props', { ...component.get('props'), style: v }),
    });
    body.appendChild(labeled('Style', style.el));

    const width = slider({
        min: 10, max: 100, step: 1,
        value: props.width_pct || 100,
        onChange: (v) => component.set('props', { ...component.get('props'), width_pct: v }),
    });
    body.appendChild(labeled('Width %', width.el));

    const align = presetChips({
        options: [
            { value: 'left', label: 'Left' },
            { value: 'center', label: 'Center' },
            { value: 'right', label: 'Right' },
        ],
        value: props.alignment || 'center',
        onChange: (v) => component.set('props', { ...component.get('props'), alignment: v }),
    });
    body.appendChild(labeled('Alignment', align.el));

    const gap = numberWithUnit({
        value: props.gap_above || 0,
        unit: 'px',
        units: ['px'],
        min: 0, max: 200,
        onChange: ({ value }) => component.set('props', { ...component.get('props'), gap_above: value }),
    });
    body.appendChild(labeled('Gap above', gap.el));

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
