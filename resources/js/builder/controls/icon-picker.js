// iconPicker({ value, onChange }) — dropdown of the curated Lucide icons.
// Returns { el, get(), set(name) }.

import { ICON_NAMES, renderIcon } from '../icons/lucide-sprite.js';

export function iconPicker({ value = null, onChange = () => {} } = {}) {
    let current = value;
    const el = document.createElement('div');
    el.className = 'relative';

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'w-full flex items-center gap-2 px-2 py-1 text-xs border border-slate-300 rounded bg-white hover:bg-slate-50';
    renderTrigger();

    const dropdown = document.createElement('div');
    dropdown.className = 'absolute z-50 mt-1 bg-white border border-slate-200 rounded shadow-lg p-2 grid grid-cols-6 gap-1 hidden';
    dropdown.style.minWidth = '220px';
    dropdown.style.maxHeight = '240px';
    dropdown.style.overflowY = 'auto';

    [null, ...ICON_NAMES].forEach((name) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'w-8 h-8 grid place-items-center hover:bg-slate-100 rounded';
        btn.title = name || 'None';
        btn.innerHTML = name ? renderIcon(name, { size: 16 }) : '<span class="text-slate-300 text-[10px]">none</span>';
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            current = name;
            renderTrigger();
            dropdown.classList.add('hidden');
            onChange(current);
        });
        dropdown.appendChild(btn);
    });

    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('hidden');
    });
    document.addEventListener('click', () => dropdown.classList.add('hidden'));

    el.appendChild(trigger);
    el.appendChild(dropdown);

    function renderTrigger() {
        const icon = current ? renderIcon(current, { size: 16 }) : '<span class="text-slate-400">None</span>';
        trigger.innerHTML = `${icon}<span class="ms-auto text-slate-400">▾</span>`;
    }

    return {
        el,
        get: () => current,
        set: (v) => { current = v; renderTrigger(); },
    };
}
