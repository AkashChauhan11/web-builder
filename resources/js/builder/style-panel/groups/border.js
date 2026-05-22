import { colorPicker } from '../../controls/color-picker.js';
import { presetChips } from '../../controls/preset-chips.js';
import { fourSideInput } from '../../controls/four-side-input.js';
import { collapsibleGroup } from '../../controls/collapsible-group.js';

const STYLES = [
    { value: 'none',   label: 'None' },
    { value: 'solid',  label: 'Solid' },
    { value: 'dashed', label: 'Dash' },
    { value: 'dotted', label: 'Dot' },
    { value: 'double', label: 'Dbl' },
];

export function borderGroup(component) {
    const style = component.getStyle();

    const styleChips = presetChips({
        options: STYLES,
        value: style['border-style'] || 'none',
        onChange: (v) => component.addStyle({ 'border-style': v }),
    });

    const width = fourSideInput({
        values: {
            top:    parseFloat(style['border-top-width'])    || parseFloat(style['border-width']) || 0,
            right:  parseFloat(style['border-right-width'])  || parseFloat(style['border-width']) || 0,
            bottom: parseFloat(style['border-bottom-width']) || parseFloat(style['border-width']) || 0,
            left:   parseFloat(style['border-left-width'])   || parseFloat(style['border-width']) || 0,
        },
        unit: 'px',
        units: ['px'],
        max: 50,
        linked: true,
        onChange: ({ top, right, bottom, left }) => component.addStyle({
            'border-top-width':    `${top}px`,
            'border-right-width':  `${right}px`,
            'border-bottom-width': `${bottom}px`,
            'border-left-width':   `${left}px`,
        }),
    });

    const color = colorPicker({
        value: style['border-color'] || '#cbd5e1',
        onChange: (v) => component.addStyle({ 'border-color': v }),
    });

    const radius = fourSideInput({
        values: {
            top:    parseFloat(style['border-top-left-radius'])     || parseFloat(style['border-radius']) || 0,
            right:  parseFloat(style['border-top-right-radius'])    || parseFloat(style['border-radius']) || 0,
            bottom: parseFloat(style['border-bottom-right-radius']) || parseFloat(style['border-radius']) || 0,
            left:   parseFloat(style['border-bottom-left-radius'])  || parseFloat(style['border-radius']) || 0,
        },
        unit: 'px',
        units: ['px', '%'],
        max: 200,
        linked: true,
        onChange: ({ top, right, bottom, left, unit }) => component.addStyle({
            'border-top-left-radius':     `${top}${unit}`,
            'border-top-right-radius':    `${right}${unit}`,
            'border-bottom-right-radius': `${bottom}${unit}`,
            'border-bottom-left-radius':  `${left}${unit}`,
        }),
    });

    const body = document.createElement('div');
    body.className = 'space-y-3 text-xs';
    body.appendChild(row('Style', styleChips.el));
    body.appendChild(row('Width (T/R/B/L)', width.el));
    body.appendChild(row('Color', color.el));
    body.appendChild(row('Radius (TL/TR/BR/BL)', radius.el));

    return collapsibleGroup({ title: 'Border', defaultOpen: false, children: [body] }).el;
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
