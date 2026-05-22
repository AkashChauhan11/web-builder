// Section structure picker — a popover with 8 preset column layouts.
// Clicking a preset inserts a new mp-section with the right number of mp-col children.

export const STRUCTURE_PRESETS = [
    { id: 'one',      label: '1',             cols: [100] },
    { id: 'two',      label: '1/2 + 1/2',     cols: [50, 50] },
    { id: 'three',    label: '1/3 + 1/3 + 1/3', cols: [33.33, 33.33, 33.34] },
    { id: 'four',     label: '1/4 ×4',         cols: [25, 25, 25, 25] },
    { id: '13-23',    label: '1/3 + 2/3',     cols: [33.33, 66.67] },
    { id: '23-13',    label: '2/3 + 1/3',     cols: [66.67, 33.33] },
    { id: '14-12-14', label: '1/4 + 1/2 + 1/4', cols: [25, 50, 25] },
    { id: 'six',      label: '1/6 ×6',         cols: [16.66, 16.66, 16.66, 16.66, 16.66, 16.70] },
];

export function openSectionPicker(editor, anchorButton) {
    closeExistingPicker();

    const popover = document.createElement('div');
    popover.id = 'mp-section-picker';
    popover.className = 'mp-picker absolute z-50 bg-white border border-slate-200 rounded-md shadow-xl p-3 text-sm';
    popover.style.minWidth = '260px';

    const title = document.createElement('div');
    title.className = 'text-xs font-semibold text-slate-500 mb-2';
    title.textContent = 'Choose section structure';
    popover.appendChild(title);

    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-4 gap-2';
    popover.appendChild(grid);

    STRUCTURE_PRESETS.forEach((preset) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'flex flex-col items-center gap-1 p-2 rounded border border-slate-200 hover:border-slate-400 hover:bg-slate-50';

        // Mini preview — N flex children proportional to cols[]
        const preview = document.createElement('div');
        preview.style.cssText = 'display:flex;gap:2px;width:100%;height:24px;';
        preset.cols.forEach((w) => {
            const cell = document.createElement('div');
            cell.style.cssText = `flex-basis:${w}%;background:#3b82f6;border-radius:2px`;
            preview.appendChild(cell);
        });
        btn.appendChild(preview);

        const label = document.createElement('span');
        label.className = 'text-xs text-slate-700';
        label.textContent = preset.label;
        btn.appendChild(label);

        btn.addEventListener('click', () => {
            insertSection(editor, preset.cols);
            closeExistingPicker();
        });

        grid.appendChild(btn);
    });

    // Position the popover under the anchor
    const rect = anchorButton.getBoundingClientRect();
    document.body.appendChild(popover);
    const popRect = popover.getBoundingClientRect();
    popover.style.top = `${rect.bottom + window.scrollY + 4}px`;
    popover.style.left = `${rect.right + window.scrollX - popRect.width}px`;

    // Close on outside click / Escape
    setTimeout(() => {
        document.addEventListener('mousedown', onOutsideClick, true);
        document.addEventListener('keydown', onEscape, true);
    }, 0);

    function onOutsideClick(e) {
        if (popover.contains(e.target) || anchorButton.contains(e.target)) return;
        closeExistingPicker();
    }
    function onEscape(e) { if (e.key === 'Escape') closeExistingPicker(); }
    popover._cleanup = () => {
        document.removeEventListener('mousedown', onOutsideClick, true);
        document.removeEventListener('keydown', onEscape, true);
    };
}

function closeExistingPicker() {
    const existing = document.getElementById('mp-section-picker');
    if (existing) {
        existing._cleanup?.();
        existing.remove();
    }
}

function insertSection(editor, columnWidths) {
    const columns = columnWidths.map((widthPct) => ({
        tagName: 'div',
        attributes: {
            class: 'mp-col',
            'data-mp-widget': 'column',
            style: `flex-basis:${widthPct}%`,
        },
        // The `type: 'mp-column'` is set automatically by isComponent() once Task 5 runs.
        // For Plan 5 task 4 alone, these render as plain divs with .mp-col class.
        components: [],
    }));

    const sectionDef = {
        type: 'mp-section',
        components: [{
            tagName: 'div',
            attributes: { class: 'mp-sec__inner' },
            selectable: false,
            hoverable: false,
            droppable: '.mp-col',
            components: columns,
        }],
    };

    editor.addComponents([sectionDef]);
}
