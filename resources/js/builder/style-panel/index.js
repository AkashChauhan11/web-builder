// Custom style panel — three tabs (Content / Style / Advanced) mounted in #mp-style-panel.
// Renders for the currently selected GrapesJS component.

import { currentDeviceName } from '../responsive/device-style.js';
import { stateToggle } from './state-toggle.js';

const TAB_DEFS = [
    { id: 'content',  label: 'Content' },
    { id: 'style',    label: 'Style' },
    { id: 'advanced', label: 'Advanced' },
];

let groupRegistry = {
    content: {},
    style: [],
    advanced: [],
};

export function mountStylePanel(editor, rootEl) {
    if (!rootEl) return;

    let currentTab = 'style';
    let currentComponent = null;

    function render() {
        rootEl.innerHTML = '';

        if (!currentComponent) {
            const empty = document.createElement('div');
            empty.className = 'p-4 text-xs text-slate-500';
            empty.textContent = 'Select an element on the canvas to edit its style.';
            rootEl.appendChild(empty);
            return;
        }

        const header = makeHeader(currentComponent, editor);
        rootEl.appendChild(header);

        const tabs = makeTabs(currentTab, (tabId) => { currentTab = tabId; render(); });
        rootEl.appendChild(tabs);

        const body = document.createElement('div');
        body.className = 'pb-6';
        rootEl.appendChild(body);

        renderTabBody(body, currentTab, currentComponent, editor);
    }

    const syncSelection = () => {
        currentComponent = editor.getSelected() || null;
        render();
    };

    // GrapesJS fires `component:select` (verb form) when a component is selected.
    // The `component:selected` past-participle constant exists in the source but is never triggered.
    editor.on('component:select', syncSelection);
    editor.on('component:deselected', syncSelection);

    // Re-render when the active device changes so the header's device pill + controls reflect the new device.
    editor.on('change:device', render);

    // Re-render when the user switches Normal/Hover state from the panel header
    document.addEventListener('mp:panel-state-change', render);

    render();
}

function makeHeader(component, editor) {
    const wrap = document.createElement('div');
    wrap.className = 'px-3 py-2 border-b border-slate-200 bg-white';

    const topRow = document.createElement('div');
    topRow.className = 'flex items-center justify-between gap-2';

    const left = document.createElement('div');
    left.className = 'min-w-0';
    const name = document.createElement('div');
    name.className = 'text-xs font-semibold text-slate-700 truncate';
    name.textContent = component.get('name') || component.get('type');
    left.appendChild(name);
    const typeBadge = document.createElement('div');
    typeBadge.className = 'text-[10px] uppercase tracking-wide text-slate-400 font-mono truncate';
    typeBadge.textContent = component.get('type');
    left.appendChild(typeBadge);
    topRow.appendChild(left);

    // Device pill — shows which device the style edits will write to
    const device = currentDeviceName(editor);
    const pill = document.createElement('span');
    pill.className = 'text-[10px] uppercase tracking-wide px-2 py-0.5 rounded font-semibold shrink-0 ' +
        (device === 'Desktop' ? 'bg-blue-500 text-white' : 'bg-amber-500 text-white');
    pill.textContent = device;
    pill.title = `Editing styles for: ${device}. Use the device buttons in the top toolbar to switch.`;
    topRow.appendChild(pill);

    wrap.appendChild(topRow);

    // Normal / Hover state toggle — writes route to the active state's CSS rule
    const stateRow = document.createElement('div');
    stateRow.className = 'mt-2';
    stateRow.appendChild(stateToggle({
        editor,
        onChange: () => {
            // Re-render the panel so the toggle reflects the active state
            window.requestAnimationFrame(() => {
                const evt = new CustomEvent('mp:panel-state-change');
                document.dispatchEvent(evt);
            });
        },
    }));
    wrap.appendChild(stateRow);

    return wrap;
}

function makeTabs(activeTab, onTab) {
    const nav = document.createElement('nav');
    nav.className = 'flex border-b border-slate-200 bg-white';
    TAB_DEFS.forEach(({ id, label }) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'flex-1 px-3 py-2 text-xs font-medium border-b-2 transition ' +
            (id === activeTab
                ? 'border-blue-500 text-blue-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50');
        btn.textContent = label;
        btn.addEventListener('click', () => onTab(id));
        nav.appendChild(btn);
    });
    return nav;
}

function renderTabBody(body, tabId, component, editor) {
    if (tabId === 'content') {
        const reg = groupRegistry.content[component.get('type')];
        if (typeof reg === 'function') {
            body.appendChild(reg(component, editor));
        } else {
            body.appendChild(placeholder(`No Content controls for ${component.get('type')} in Plan 5.`));
        }
    } else if (tabId === 'style') {
        if (groupRegistry.style.length === 0) {
            body.appendChild(placeholder('Style groups not registered yet (Plan 5 tasks 8-9 add them).'));
            return;
        }
        groupRegistry.style.forEach((renderer) => body.appendChild(renderer(component, editor)));
    } else if (tabId === 'advanced') {
        if (groupRegistry.advanced.length === 0) {
            body.appendChild(placeholder('Advanced controls not registered yet (Plan 5 task 9 adds them).'));
            return;
        }
        groupRegistry.advanced.forEach((renderer) => body.appendChild(renderer(component, editor)));
    }
}

function placeholder(text) {
    const d = document.createElement('div');
    d.className = 'p-4 text-xs text-slate-400';
    d.textContent = text;
    return d;
}

export function registerStyleGroup(renderer) {
    groupRegistry.style.push(renderer);
}
export function registerAdvancedGroup(renderer) {
    groupRegistry.advanced.push(renderer);
}
export function registerContentGroup(componentType, renderer) {
    groupRegistry.content[componentType] = renderer;
}
