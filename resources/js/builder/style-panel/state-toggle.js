// Normal / Hover state toggle. Switches the editor's SelectorManager state — subsequent
// addStyle() writes from any control will route to that state's CSS rule (`.cls:hover { ... }`).
// Uses inline styles so the dark-theme CSS overrides can't accidentally hide the toggle.

export function stateToggle({ editor, onChange }) {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;align-items:center;gap:2px;background:#020617;border:1px solid #334155;border-radius:6px;padding:2px;font-size:11px';

    const current = editor.SelectorManager.getState() || '';

    [
        { value: '',      label: 'Normal' },
        { value: 'hover', label: 'Hover' },
    ].forEach(({ value, label }) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        const active = current === value;
        btn.style.cssText = active
            ? `flex:1;padding:5px 12px;border-radius:4px;font-weight:600;cursor:pointer;border:0;color:white;background:${value === 'hover' ? '#f59e0b' : '#3b82f6'};transition:background .15s`
            : 'flex:1;padding:5px 12px;border-radius:4px;font-weight:500;cursor:pointer;border:0;color:#cbd5e1;background:transparent;transition:background .15s';
        if (!active) {
            btn.addEventListener('mouseenter', () => { btn.style.background = '#1e293b'; });
            btn.addEventListener('mouseleave', () => { btn.style.background = 'transparent'; });
        }
        btn.textContent = label;
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (editor.SelectorManager.getState() === value) return;
            editor.SelectorManager.setState(value);
            onChange?.(value);
        });
        wrap.appendChild(btn);
    });

    return wrap;
}
