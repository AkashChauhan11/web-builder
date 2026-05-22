import { numberWithUnit } from './number-with-unit.js';

// fourSideInput({ values: {top,right,bottom,left}, unit, units, linked, onChange })
// onChange receives { top, right, bottom, left, unit }

export function fourSideInput({
    values = { top: 0, right: 0, bottom: 0, left: 0 },
    unit = 'px',
    units = ['px', 'em', 'rem', '%'],
    min = 0,
    max = 999,
    linked = true,
    onChange = () => {},
} = {}) {
    const el = document.createElement('div');
    el.className = 'flex flex-col gap-1';

    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-[1fr_1fr_24px] gap-1 items-center';
    el.appendChild(grid);

    const linkBtn = document.createElement('button');
    linkBtn.type = 'button';
    linkBtn.className = 'text-xs border border-slate-300 rounded h-7 grid place-items-center hover:bg-slate-50';
    linkBtn.title = linked ? 'Unlink sides' : 'Link sides';
    linkBtn.textContent = linked ? '\u{1F517}' : '\u{1F494}';
    linkBtn.style.gridRow = '1 / span 2';
    linkBtn.style.gridColumn = '3';

    const inputs = {};
    const sides = ['top', 'right', 'bottom', 'left'];
    const positions = { top: '1 / 1', right: '1 / 2', bottom: '2 / 1', left: '2 / 2' };

    sides.forEach((side) => {
        const wrap = document.createElement('div');
        wrap.style.gridArea = positions[side];
        const labelRow = document.createElement('div');
        labelRow.className = 'text-[10px] uppercase tracking-wide text-slate-500';
        labelRow.textContent = side;
        wrap.appendChild(labelRow);

        const ctrl = numberWithUnit({
            value: values[side] ?? 0,
            unit,
            units,
            min,
            max,
            onChange: ({ value, unit: u }) => {
                if (linked) {
                    sides.forEach((s) => inputs[s].set({ value, unit: u }));
                }
                emit();
            },
        });
        wrap.appendChild(ctrl.el);
        grid.appendChild(wrap);
        inputs[side] = ctrl;
    });

    grid.appendChild(linkBtn);

    linkBtn.addEventListener('click', () => {
        linked = !linked;
        linkBtn.textContent = linked ? '\u{1F517}' : '\u{1F494}';
        linkBtn.title = linked ? 'Unlink sides' : 'Link sides';
        if (linked) {
            const topVal = inputs.top.get();
            sides.forEach((s) => inputs[s].set({ value: topVal.value, unit: topVal.unit }));
            emit();
        }
    });

    function emit() {
        const top = inputs.top.get();
        onChange({
            top: top.value,
            right: inputs.right.get().value,
            bottom: inputs.bottom.get().value,
            left: inputs.left.get().value,
            unit: top.unit,
        });
    }

    return {
        el,
        get: () => ({
            top: inputs.top.get().value,
            right: inputs.right.get().value,
            bottom: inputs.bottom.get().value,
            left: inputs.left.get().value,
            unit: inputs.top.get().unit,
        }),
        set: ({ top, right, bottom, left, unit: u }) => {
            if (top    !== undefined) inputs.top.set({ value: top,    unit: u });
            if (right  !== undefined) inputs.right.set({ value: right,  unit: u });
            if (bottom !== undefined) inputs.bottom.set({ value: bottom, unit: u });
            if (left   !== undefined) inputs.left.set({ value: left,    unit: u });
        },
    };
}
