import { numberWithUnit } from '../../controls/number-with-unit.js';
import { colorPicker } from '../../controls/color-picker.js';
import { presetChips } from '../../controls/preset-chips.js';
import { collapsibleGroup } from '../../controls/collapsible-group.js';

const FONT_FAMILIES = [
    { value: 'inherit', label: 'Inherit' },
    { value: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', label: 'System' },
    { value: 'Inter, sans-serif', label: 'Inter' },
    { value: 'Georgia, serif', label: 'Serif' },
    { value: '"Courier New", monospace', label: 'Mono' },
];

const WEIGHTS = ['300', '400', '500', '600', '700', '800', '900'];
const ALIGNS = [
    { value: 'left',    label: 'L' },
    { value: 'center',  label: 'C' },
    { value: 'right',   label: 'R' },
    { value: 'justify', label: 'J' },
];
const TRANSFORMS = [
    { value: 'none',       label: 'Aa' },
    { value: 'uppercase',  label: 'AA' },
    { value: 'lowercase',  label: 'aa' },
    { value: 'capitalize', label: 'Aa.' },
];

export function typographyGroup(component) {
    const style = component.getStyle();

    const fontFamilySelect = document.createElement('select');
    fontFamilySelect.className = 'w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white';
    FONT_FAMILIES.forEach((f) => {
        const opt = document.createElement('option');
        opt.value = f.value;
        opt.textContent = f.label;
        if (style['font-family'] === f.value) opt.selected = true;
        fontFamilySelect.appendChild(opt);
    });
    fontFamilySelect.addEventListener('change', () => {
        component.addStyle({ 'font-family': fontFamilySelect.value });
    });

    const fontSize = numberWithUnit({
        value: parseFloat(style['font-size']) || 16,
        unit: extractUnit(style['font-size']) || 'px',
        units: ['px', 'em', 'rem', '%'],
        onChange: ({ value, unit }) => component.addStyle({ 'font-size': `${value}${unit}` }),
    });

    const weight = presetChips({
        options: WEIGHTS,
        value: style['font-weight'] || '400',
        onChange: (v) => component.addStyle({ 'font-weight': v }),
    });

    const lineHeight = numberWithUnit({
        value: parseFloat(style['line-height']) || 1.5,
        unit: extractUnit(style['line-height']) || '',
        units: ['', 'px', 'em', 'rem', '%'],
        min: 0,
        step: 0.1,
        onChange: ({ value, unit }) => component.addStyle({ 'line-height': unit ? `${value}${unit}` : String(value) }),
    });

    const letterSpacing = numberWithUnit({
        value: parseFloat(style['letter-spacing']) || 0,
        unit: extractUnit(style['letter-spacing']) || 'px',
        units: ['px', 'em'],
        min: -10,
        max: 30,
        step: 0.1,
        onChange: ({ value, unit }) => component.addStyle({ 'letter-spacing': `${value}${unit}` }),
    });

    const align = presetChips({
        options: ALIGNS,
        value: style['text-align'] || 'left',
        onChange: (v) => component.addStyle({ 'text-align': v }),
    });

    const transform = presetChips({
        options: TRANSFORMS,
        value: style['text-transform'] || 'none',
        onChange: (v) => component.addStyle({ 'text-transform': v }),
    });

    const color = colorPicker({
        value: style.color || '#0f172a',
        onChange: (v) => component.addStyle({ color: v }),
    });

    const body = document.createElement('div');
    body.className = 'space-y-3 text-xs';
    body.appendChild(row('Family', fontFamilySelect));
    body.appendChild(row('Size', fontSize.el));
    body.appendChild(row('Weight', weight.el));
    body.appendChild(row('Line height', lineHeight.el));
    body.appendChild(row('Letter spacing', letterSpacing.el));
    body.appendChild(row('Align', align.el));
    body.appendChild(row('Transform', transform.el));
    body.appendChild(row('Color', color.el));

    return collapsibleGroup({ title: 'Typography', defaultOpen: true, children: [body] }).el;
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
    const match = cssValue.match(/[a-z%]+$/i);
    return match ? match[0] : null;
}
