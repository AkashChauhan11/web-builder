// presetChips({ options: [{value, label}], value, onChange })

export function presetChips({ options = [], value = null, onChange = () => {} } = {}) {
    const el = document.createElement('div');
    el.className = 'flex gap-1 flex-wrap';

    const buttons = new Map();
    let current = value;

    options.forEach((opt) => {
        const o = typeof opt === 'string' ? { value: opt, label: opt } : opt;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.dataset.value = o.value;
        btn.className = 'px-2 py-1 text-xs border border-slate-300 rounded hover:bg-slate-50 transition';
        btn.textContent = o.label;
        btn.addEventListener('click', () => {
            current = o.value;
            refresh();
            onChange(o.value);
        });
        buttons.set(o.value, btn);
        el.appendChild(btn);
    });

    function refresh() {
        buttons.forEach((btn, val) => {
            if (val === current) {
                btn.classList.add('bg-blue-500', 'text-white', 'border-blue-500');
                btn.classList.remove('bg-white', 'text-slate-700');
            } else {
                btn.classList.remove('bg-blue-500', 'text-white', 'border-blue-500');
                btn.classList.add('bg-white', 'text-slate-700');
            }
        });
    }
    refresh();

    return {
        el,
        get: () => current,
        set: (v) => { current = v; refresh(); },
    };
}
