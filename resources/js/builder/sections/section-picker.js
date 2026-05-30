// Section structure picker — a popover with 8 preset column layouts + DB-backed templates.

import { TEMPLATES } from '../templates/index.js';
import { fetchTemplates } from '../templates/library.js';
import { positionPopover } from '../controls/popover-position.js';
import { trapFocus } from '../controls/focus-trap.js';

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

    let closed = false;

    const popover = document.createElement('div');
    popover.id = 'mp-section-picker';
    popover.className = 'mp-picker absolute z-50 bg-white border border-slate-200 rounded-md shadow-xl p-3 text-sm';
    popover.style.minWidth = '260px';
    popover.setAttribute('role', 'dialog');
    popover.setAttribute('aria-label', 'Choose section structure or template');

    anchorButton?.setAttribute('aria-expanded', 'true');

    const tabBar = document.createElement('div');
    tabBar.className = 'flex border-b border-slate-200 mb-2';
    tabBar.innerHTML = `
        <button type="button" data-pick-tab="structures" class="flex-1 px-3 py-1 text-xs font-medium border-b-2 border-blue-500 text-blue-600">Structures</button>
        <button type="button" data-pick-tab="templates" class="flex-1 px-3 py-1 text-xs font-medium border-b-2 border-transparent text-slate-600">Templates</button>
    `;
    popover.appendChild(tabBar);

    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-4 gap-2';
    popover.appendChild(grid);

    const templatesArea = document.createElement('div');
    templatesArea.className = 'grid grid-cols-2 gap-2';
    templatesArea.style.display = 'none';
    popover.appendChild(templatesArea);

    // Bundled (JS-shipped) templates first
    TEMPLATES.forEach((tpl) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'flex flex-col items-center gap-1 p-3 rounded border border-slate-200 hover:border-slate-400 hover:bg-slate-50 text-xs';
        btn.innerHTML = `<span style="font-size:24px">${tpl.thumb}</span><span>${tpl.label}</span>`;
        btn.addEventListener('click', () => {
            editor.addComponents([tpl.build()]);
            closeExistingPicker();
        });
        templatesArea.appendChild(btn);
    });

    // DB-backed user templates (fetched async, appended when ready)
    fetchTemplates().then((dbTemplates) => {
        dbTemplates.forEach((tpl) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'flex flex-col items-center gap-1 p-3 rounded border border-slate-200 hover:border-slate-400 hover:bg-slate-50 text-xs relative';
            const thumb = tpl.thumbnail_url
                ? `<img src="${tpl.thumbnail_url}" alt="" class="w-full h-12 object-cover rounded">`
                : '<span style="font-size:24px">⭐</span>';
            const badge = tpl.is_bundled ? '' : '<span class="absolute top-1 right-1 text-[9px] uppercase bg-emerald-500 text-white px-1 rounded">Saved</span>';
            btn.innerHTML = `${badge}${thumb}<span>${escapeHtml(tpl.name)}</span>`;
            btn.addEventListener('click', () => {
                const tree = Array.isArray(tpl.components_json) ? tpl.components_json : [tpl.components_json];
                editor.addComponents(tree);
                closeExistingPicker();
            });
            templatesArea.appendChild(btn);
        });
    });

    tabBar.addEventListener('click', (e) => {
        const tab = e.target.closest('[data-pick-tab]')?.dataset.pickTab;
        if (!tab) return;
        tabBar.querySelectorAll('[data-pick-tab]').forEach((b) => {
            const active = b.dataset.pickTab === tab;
            b.classList.toggle('border-blue-500', active);
            b.classList.toggle('text-blue-600', active);
            b.classList.toggle('border-transparent', !active);
            b.classList.toggle('text-slate-600', !active);
        });
        grid.style.display = tab === 'structures' ? '' : 'none';
        templatesArea.style.display = tab === 'templates' ? '' : 'none';
    });

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

    // Position the popover under the anchor, clamped to viewport
    document.body.appendChild(popover);
    positionPopover(popover, anchorButton);

    // Reposition on scroll / resize while the popover is open
    const reposition = () => positionPopover(popover, anchorButton);
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);

    // Trap focus within the popover and restore on close
    popover.setAttribute('aria-modal', 'true');
    const releaseFocusTrap = trapFocus(popover);

    // Close on outside click / Escape — schedule listeners after this tick so the
    // current click doesn't immediately close the popover. The `closed` flag
    // ensures we don't attach listeners if the popover was already closed in-between.
    setTimeout(() => {
        if (closed) return;
        document.addEventListener('mousedown', onOutsideClick, true);
        document.addEventListener('keydown', onEscape, true);
    }, 0);

    function onOutsideClick(e) {
        if (popover.contains(e.target) || anchorButton?.contains?.(e.target)) return;
        closeExistingPicker();
    }
    function onEscape(e) { if (e.key === 'Escape') closeExistingPicker(); }

    popover._cleanup = () => {
        closed = true;
        document.removeEventListener('mousedown', onOutsideClick, true);
        document.removeEventListener('keydown', onEscape, true);
        window.removeEventListener('scroll', reposition, true);
        window.removeEventListener('resize', reposition);
        anchorButton?.setAttribute('aria-expanded', 'false');
        // Release the focus trap (also restores focus to previously-focused element)
        releaseFocusTrap?.();
    };
}

function closeExistingPicker() {
    const existing = document.getElementById('mp-section-picker');
    if (existing) {
        existing._cleanup?.();
        existing.remove();
    }
}

function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
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
