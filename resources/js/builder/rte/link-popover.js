// Anchor URL/target/rel editor for the RTE link button.
// Opened when the user clicks the "link" action in the RTE toolbar, or when editing an existing anchor.

let activePopover = null;

export function openLinkPopover({ anchorEl, current = {}, onApply, onUnlink }) {
    closeLinkPopover();

    const pop = document.createElement('div');
    pop.id = 'mp-link-popover';
    pop.className = 'mp-link-pop absolute z-[60] bg-white border border-slate-200 rounded-md shadow-xl p-3 text-xs';
    pop.style.minWidth = '280px';

    pop.innerHTML = `
        <div class="space-y-2">
            <div>
                <label class="block text-[10px] uppercase tracking-wide text-slate-500 mb-1">URL</label>
                <input type="url" name="url" class="w-full px-2 py-1 border border-slate-300 rounded" value="${escapeAttr(current.url)}" placeholder="https:// or /relative">
            </div>
            <div>
                <label class="block text-[10px] uppercase tracking-wide text-slate-500 mb-1">Target</label>
                <select name="target" class="w-full px-2 py-1 border border-slate-300 rounded">
                    <option value="_self" ${current.target === '_self' ? 'selected' : ''}>Same window</option>
                    <option value="_blank" ${current.target === '_blank' ? 'selected' : ''}>New tab</option>
                </select>
            </div>
            <label class="flex items-center gap-2">
                <input type="checkbox" name="nofollow" ${(current.rel || '').includes('nofollow') ? 'checked' : ''}>
                <span>Add rel="nofollow"</span>
            </label>
            <div class="flex justify-between pt-1">
                <button type="button" data-act="unlink" class="text-red-600 hover:underline">Remove link</button>
                <div class="flex gap-2">
                    <button type="button" data-act="cancel" class="px-2 py-1">Cancel</button>
                    <button type="button" data-act="apply" class="bg-blue-600 text-white px-3 py-1 rounded">Apply</button>
                </div>
            </div>
        </div>`;

    document.body.appendChild(pop);
    activePopover = pop;

    const rect = anchorEl.getBoundingClientRect();
    pop.style.top = `${rect.bottom + window.scrollY + 4}px`;
    pop.style.left = `${rect.left + window.scrollX}px`;

    pop.addEventListener('click', (e) => {
        const act = e.target.closest('[data-act]')?.dataset.act;
        if (act === 'apply') {
            onApply?.({
                url: pop.querySelector('[name=url]').value,
                target: pop.querySelector('[name=target]').value,
                rel: pop.querySelector('[name=nofollow]').checked ? 'nofollow' : null,
            });
            closeLinkPopover();
        } else if (act === 'cancel') {
            closeLinkPopover();
        } else if (act === 'unlink') {
            onUnlink?.();
            closeLinkPopover();
        }
    });

    setTimeout(() => {
        document.addEventListener('mousedown', closeOnOutside, true);
        document.addEventListener('keydown', closeOnEscape, true);
    }, 0);

    pop.querySelector('[name=url]')?.focus();
}

function closeOnOutside(e) {
    if (!activePopover) return;
    if (activePopover.contains(e.target)) return;
    closeLinkPopover();
}

function closeOnEscape(e) {
    if (e.key === 'Escape') closeLinkPopover();
}

export function closeLinkPopover() {
    if (!activePopover) return;
    document.removeEventListener('mousedown', closeOnOutside, true);
    document.removeEventListener('keydown', closeOnEscape, true);
    activePopover.remove();
    activePopover = null;
}

function escapeAttr(s) { return String(s ?? '').replace(/"/g, '&quot;'); }
