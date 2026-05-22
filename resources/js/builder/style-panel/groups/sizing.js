import { numberWithUnit } from '../../controls/number-with-unit.js';
import { collapsibleGroup } from '../../controls/collapsible-group.js';

export function sizingGroup(component) {
    const style = component.getStyle();

    function makeRow(label, prop, defaultUnit = 'px') {
        const ctrl = numberWithUnit({
            value: parseFloat(style[prop]) || 0,
            unit: extractUnit(style[prop]) || defaultUnit,
            units: ['px', '%', 'vw', 'vh', 'em', 'rem', 'auto'],
            min: 0,
            max: 5000,
            onChange: ({ value, unit }) => component.addStyle({ [prop]: unit === 'auto' ? 'auto' : `${value}${unit}` }),
        });
        return row(label, ctrl.el);
    }

    const body = document.createElement('div');
    body.className = 'space-y-3 text-xs';
    body.appendChild(makeRow('Width', 'width'));
    body.appendChild(makeRow('Max width', 'max-width'));
    body.appendChild(makeRow('Height', 'height'));
    body.appendChild(makeRow('Min height', 'min-height'));

    return collapsibleGroup({ title: 'Sizing', defaultOpen: false, children: [body] }).el;
}

function row(label, control) {
    const r = document.createElement('div');
    r.className = 'flex flex-col gap-1';
    const lbl = document.createElement('label');
    lbl.className = 'text-[10px] uppercase tracking-wide text-slate-500';
    lbl.textContent = label;
    r.appendChild(lbl);
    r.appendChild(control);
    return r;
}

function extractUnit(cssValue) {
    if (!cssValue || typeof cssValue !== 'string') return null;
    if (cssValue === 'auto') return 'auto';
    const match = cssValue.match(/[a-z%]+$/i);
    return match ? match[0] : null;
}
