// Wraps the existing Coloris init from Plan 2.
// Now also shows a row of 6 theme color swatches above the hex input.

import { getThemeColors } from '../global-styles/theme-colors.js';

export function colorPicker({ value = '#000000', onChange = () => {} } = {}) {
    const el = document.createElement('div');
    el.className = 'flex flex-col gap-2';

    // Theme swatches row
    const themeRow = document.createElement('div');
    themeRow.className = 'flex items-center gap-1';

    const themeLabel = document.createElement('span');
    themeLabel.className = 'text-[10px] uppercase tracking-wide text-slate-500 mr-1';
    themeLabel.textContent = 'Theme';
    themeRow.appendChild(themeLabel);

    const colors = getThemeColors();
    Object.entries(colors).forEach(([key, color]) => {
        const sw = document.createElement('button');
        sw.type = 'button';
        sw.className = 'w-5 h-5 rounded border border-slate-300 hover:border-blue-500 hover:scale-110 transition shrink-0';
        sw.style.background = color;
        sw.title = `${key} (${color})`;
        sw.addEventListener('click', () => {
            input.value = color;
            swatch.style.background = color;
            onChange(color);
        });
        themeRow.appendChild(sw);
    });
    el.appendChild(themeRow);

    // Custom hex input row (existing)
    const customRow = document.createElement('div');
    customRow.className = 'flex items-center gap-2';

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

    customRow.appendChild(swatch);
    customRow.appendChild(input);
    el.appendChild(customRow);

    return {
        el,
        get: () => input.value,
        set: (v) => { input.value = v; swatch.style.background = v; },
    };
}
