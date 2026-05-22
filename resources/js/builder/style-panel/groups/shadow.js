import { numberWithUnit } from '../../controls/number-with-unit.js';
import { colorPicker } from '../../controls/color-picker.js';
import { presetChips } from '../../controls/preset-chips.js';
import { collapsibleGroup } from '../../controls/collapsible-group.js';

const PRESETS = [
    { value: 'none', label: 'None', css: 'none' },
    { value: 'sm',   label: 'SM',   css: '0 1px 2px rgba(15,23,42,0.08)' },
    { value: 'md',   label: 'MD',   css: '0 4px 6px rgba(15,23,42,0.10)' },
    { value: 'lg',   label: 'LG',   css: '0 10px 15px rgba(15,23,42,0.12)' },
    { value: 'xl',   label: 'XL',   css: '0 20px 25px rgba(15,23,42,0.16)' },
    { value: '2xl',  label: '2XL',  css: '0 25px 50px rgba(15,23,42,0.25)' },
    { value: 'custom', label: 'Custom', css: null },
];

export function shadowGroup(component) {
    const style = component.getStyle();
    const initial = matchPreset(style['box-shadow']) || 'custom';

    const chips = presetChips({
        options: PRESETS,
        value: initial,
        onChange: (v) => {
            const preset = PRESETS.find(p => p.value === v);
            if (preset && preset.css !== null) {
                component.addStyle({ 'box-shadow': preset.css });
                custom.style.display = 'none';
            } else {
                custom.style.display = '';
                emitCustom();
            }
        },
    });

    const custom = document.createElement('div');
    custom.className = 'space-y-2';
    custom.style.display = initial === 'custom' ? '' : 'none';

    const x = numberWithUnit({ value: 0, unit: 'px', units: ['px'], min: -100, max: 100, onChange: emitCustom });
    const y = numberWithUnit({ value: 4, unit: 'px', units: ['px'], min: -100, max: 100, onChange: emitCustom });
    const blur   = numberWithUnit({ value: 8, unit: 'px', units: ['px'], min: 0, max: 200, onChange: emitCustom });
    const spread = numberWithUnit({ value: 0, unit: 'px', units: ['px'], min: -100, max: 100, onChange: emitCustom });
    const color  = colorPicker({ value: '#0f172a26', onChange: emitCustom });
    const insetChips = presetChips({
        options: [{ value: 'outer', label: 'Outer' }, { value: 'inset', label: 'Inset' }],
        value: 'outer',
        onChange: emitCustom,
    });

    custom.appendChild(row('X', x.el));
    custom.appendChild(row('Y', y.el));
    custom.appendChild(row('Blur', blur.el));
    custom.appendChild(row('Spread', spread.el));
    custom.appendChild(row('Color', color.el));
    custom.appendChild(row('Type', insetChips.el));

    function emitCustom() {
        const prefix = insetChips.get() === 'inset' ? 'inset ' : '';
        component.addStyle({
            'box-shadow': `${prefix}${x.get().value}px ${y.get().value}px ${blur.get().value}px ${spread.get().value}px ${color.get()}`,
        });
    }

    const body = document.createElement('div');
    body.className = 'space-y-3 text-xs';
    body.appendChild(row('Preset', chips.el));
    body.appendChild(custom);

    return collapsibleGroup({ title: 'Box Shadow', defaultOpen: false, children: [body] }).el;
}

function matchPreset(boxShadow) {
    if (!boxShadow) return 'none';
    const found = PRESETS.find(p => p.css === boxShadow);
    return found?.value ?? null;
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
