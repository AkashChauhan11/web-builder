// Wraps the existing Coloris init from Plan 2.
// Coloris is initialized once in builder.js (kept from existing builder/coloris-init.js).
// This factory just returns an <input data-coloris> that the global Coloris instance attaches to.

export function colorPicker({ value = '#000000', onChange = () => {} } = {}) {
    const el = document.createElement('div');
    el.className = 'flex items-center gap-2';

    const swatch = document.createElement('span');
    swatch.className = 'w-6 h-6 rounded border border-slate-300 shrink-0';
    swatch.style.background = value;

    const input = document.createElement('input');
    input.type = 'text';
    input.setAttribute('data-coloris', '');
    input.value = value;
    input.className = 'flex-1 min-w-0 px-2 py-1 text-xs border border-slate-300 rounded bg-white font-mono focus:border-blue-500 focus:outline-none';

    input.addEventListener('input', () => {
        swatch.style.background = input.value;
        onChange(input.value);
    });

    el.appendChild(swatch);
    el.appendChild(input);

    return {
        el,
        get: () => input.value,
        set: (v) => { input.value = v; swatch.style.background = v; },
    };
}
