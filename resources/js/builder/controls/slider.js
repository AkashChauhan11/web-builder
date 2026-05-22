// slider({ min, max, step, value, onChange })

export function slider({ min = 0, max = 100, step = 1, value = 0, onChange = () => {} } = {}) {
    const el = document.createElement('div');
    el.className = 'flex items-center gap-2';

    const input = document.createElement('input');
    input.type = 'range';
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(value);
    input.className = 'flex-1 min-w-0';

    const readout = document.createElement('span');
    readout.className = 'text-xs text-slate-700 w-10 text-right tabular-nums';
    readout.textContent = String(value);

    input.addEventListener('input', () => {
        readout.textContent = input.value;
        onChange(parseFloat(input.value));
    });

    el.appendChild(input);
    el.appendChild(readout);

    return {
        el,
        get: () => parseFloat(input.value),
        set: (v) => { input.value = String(v); readout.textContent = String(v); },
    };
}
