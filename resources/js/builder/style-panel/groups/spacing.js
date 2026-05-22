import { fourSideInput } from '../../controls/four-side-input.js';
import { collapsibleGroup } from '../../controls/collapsible-group.js';

export function spacingGroup(component) {
    const style = component.getStyle();

    const padding = fourSideInput({
        values: {
            top:    parseFloat(style['padding-top'])    || parseFloat(style.padding) || 0,
            right:  parseFloat(style['padding-right'])  || parseFloat(style.padding) || 0,
            bottom: parseFloat(style['padding-bottom']) || parseFloat(style.padding) || 0,
            left:   parseFloat(style['padding-left'])   || parseFloat(style.padding) || 0,
        },
        unit: 'px',
        units: ['px', '%', 'em', 'rem'],
        max: 500,
        linked: false,
        onChange: ({ top, right, bottom, left, unit }) => component.addStyle({
            'padding-top':    `${top}${unit}`,
            'padding-right':  `${right}${unit}`,
            'padding-bottom': `${bottom}${unit}`,
            'padding-left':   `${left}${unit}`,
        }),
    });

    const body = document.createElement('div');
    body.className = 'space-y-3 text-xs';
    body.appendChild(row('Padding (T/R/B/L)', padding.el));

    return collapsibleGroup({ title: 'Spacing', defaultOpen: false, children: [body] }).el;
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
