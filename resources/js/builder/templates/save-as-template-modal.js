// Modal that opens when the user clicks the ★ "Save as Template" toolbar button on a Section.
// Asks for a name and POSTs to /admin/templates with the section's components_json + css.

import { trapFocus } from '../controls/focus-trap.js';

let activeReleaseFocusTrap = null;

export function openSaveAsTemplateModal(editor, component, config) {
    if (!component) return;

    closeExisting();

    const overlay = document.createElement('div');
    overlay.id = 'mp-save-tpl-modal';
    overlay.className = 'fixed inset-0 bg-black/70 z-[100] flex items-center justify-center';

    overlay.innerHTML = `
        <div class="bg-slate-900 border border-slate-800 rounded-lg shadow-2xl w-full max-w-md text-slate-200">
            <div class="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
                <h3 class="font-semibold text-slate-100">Save as Template</h3>
                <button type="button" data-close class="text-slate-500 hover:text-slate-200 text-xl leading-none">&times;</button>
            </div>
            <form class="p-5 space-y-3 text-sm">
                <div>
                    <label class="block mb-1 text-xs uppercase tracking-wide text-slate-400">Template name</label>
                    <input type="text" name="name" required maxlength="255" class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-slate-200 focus:border-blue-500 focus:outline-none" placeholder="e.g. Hero with image">
                </div>
                <div class="text-xs text-slate-500">
                    Saves the current section, its columns, and all widgets inside.
                </div>
                <div id="mp-save-tpl-error" class="hidden text-xs text-red-400"></div>
                <div class="flex justify-end gap-2 pt-2 border-t border-slate-800">
                    <button type="button" data-close class="px-3 py-1.5 text-slate-300 hover:text-white">Cancel</button>
                    <button type="submit" class="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded font-semibold transition">Save Template</button>
                </div>
            </form>
        </div>
    `;

    const dialog = overlay.firstElementChild;
    dialog?.setAttribute('role', 'dialog');
    dialog?.setAttribute('aria-modal', 'true');
    dialog?.setAttribute('aria-label', 'Save as Template');

    document.body.appendChild(overlay);

    overlay.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', closeExisting));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeExisting(); });

    // Trap focus inside the modal and restore on close
    activeReleaseFocusTrap = trapFocus(overlay);

    // Close on Escape
    document.addEventListener('keydown', onEscape);

    const form = overlay.querySelector('form');
    const errorEl = overlay.querySelector('#mp-save-tpl-error');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = form.name.value.trim();
        if (!name) return;

        const componentsJson = [component.toJSON()];
        const css = editor.getCss({ component });

        try {
            const resp = await fetch('/admin/templates', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': config.csrf,
                },
                body: JSON.stringify({
                    name,
                    type: 'section',
                    components_json: componentsJson,
                    css,
                }),
            });
            if (!resp.ok) {
                const body = await resp.json().catch(() => ({}));
                const msg = body.message || body.error || `Save failed (${resp.status})`;
                errorEl.textContent = msg;
                errorEl.classList.remove('hidden');
                return;
            }
            closeExisting();
        } catch (err) {
            errorEl.textContent = 'Network error: ' + err.message;
            errorEl.classList.remove('hidden');
        }
    });

    // (Focus is already moved into the modal by trapFocus.)
}

function onEscape(e) {
    if (e.key === 'Escape') closeExisting();
}

function closeExisting() {
    document.getElementById('mp-save-tpl-modal')?.remove();
}
