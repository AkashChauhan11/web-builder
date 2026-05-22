// numberWithUnit({ value, unit, units, min, max, step, onChange })
// Returns { el, get(), set({value, unit}) }

export function numberWithUnit({
    value = 0,
    unit = 'px',
    units = ['px', 'em', 'rem', '%'],
    min = 0,
    max = 999,
    step = 1,
    placeholder = '',
    onChange = () => {},
} = {}) {
    const el = document.createElement('div');
    el.className = 'flex items-center gap-1 w-full';

    const numInput = document.createElement('input');
    numInput.type = 'number';
    numInput.min = String(min);
    numInput.max = String(max);
    numInput.step = String(step);
    numInput.value = String(value);
    numInput.placeholder = placeholder;
    numInput.className = 'flex-1 min-w-0 px-2 py-1 text-xs border border-slate-300 rounded bg-white focus:border-blue-500 focus:outline-none';

    const unitSelect = document.createElement('select');
    unitSelect.className = 'text-xs border border-slate-300 rounded bg-white px-1 py-1 focus:border-blue-500 focus:outline-none';
    for (const u of units) {
        const opt = document.createElement('option');
        opt.value = u;
        opt.textContent = u;
        if (u === unit) opt.selected = true;
        unitSelect.appendChild(opt);
    }

    const fire = () => onChange({ value: parseFloat(numInput.value) || 0, unit: unitSelect.value });
    numInput.addEventListener('input', fire);
    unitSelect.addEventListener('change', fire);

    el.appendChild(numInput);
    el.appendChild(unitSelect);

    return {
        el,
        get: () => ({ value: parseFloat(numInput.value) || 0, unit: unitSelect.value }),
        set: ({ value: v, unit: u } = {}) => {
            if (v !== undefined) numInput.value = String(v);
            if (u !== undefined) unitSelect.value = u;
        },
    };
}
