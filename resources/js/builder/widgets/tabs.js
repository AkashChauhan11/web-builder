// mp-tabs + mp-tab — tabbed content panels.

import { registerContentGroup } from '../style-panel/index.js';
import { presetChips } from '../controls/preset-chips.js';
import { numberWithUnit } from '../controls/number-with-unit.js';

const ORIENT_CLASSES = ['mp-tabs--horizontal', 'mp-tabs--vertical'];

const TAB_DEFAULTS = (active = false) => ({
    type: 'mp-tab',
    props: { active },
});

export function registerTabs(editor) {
    editor.DomComponents.addType('mp-tabs', {
        isComponent: (el) => el.classList?.contains('mp-tabs'),
        model: {
            defaults: {
                tagName: 'div',
                name: 'Tabs',
                draggable: '.mp-col',
                droppable: '[data-mp-widget="tab"]',
                attributes: { class: 'mp-tabs mp-tabs--horizontal', 'data-mp-widget': 'tabs' },
                props: { orientation: 'horizontal', default_tab_index: 0 },
                components: [
                    TAB_DEFAULTS(true),
                    TAB_DEFAULTS(false),
                    TAB_DEFAULTS(false),
                ],
            },
            init() {
                this.on('change:props', this.handlePropsChange);
                this.handlePropsChange();
            },
            handlePropsChange() {
                const props = this.get('props') || {};
                this.removeClass(ORIENT_CLASSES);
                this.addClass(`mp-tabs--${props.orientation || 'horizontal'}`);
                this.addAttributes({ 'data-mp-default': String(parseInt(props.default_tab_index, 10) || 0) });
            },
        },
    });

    editor.DomComponents.addType('mp-tab', {
        isComponent: (el) => el.classList?.contains('mp-tab'),
        model: {
            defaults: {
                tagName: 'div',
                name: 'Tab',
                draggable: '.mp-tabs',
                droppable: false,
                attributes: { class: 'mp-tab', 'data-mp-widget': 'tab', 'data-mp-active': '0' },
                props: { active: false },
                components: [
                    {
                        tagName: 'button',
                        attributes: { class: 'mp-tab__label', type: 'button' },
                        components: 'Tab label',
                        editable: true, rte_profile: 'inline',
                        draggable: false, droppable: false,
                    },
                    {
                        tagName: 'div',
                        attributes: { class: 'mp-tab__panel' },
                        components: [{ type: 'textnode', content: 'Panel content. Rich text with formatting.' }],
                        editable: true, rte_profile: 'text',
                        draggable: false, droppable: false,
                    },
                ],
            },
            init() {
                this.on('change:props', this.handlePropsChange);
                this.handlePropsChange();
            },
            handlePropsChange() {
                const props = this.get('props') || {};
                this.addAttributes({ 'data-mp-active': props.active ? '1' : '0' });
            },
        },
    });

    registerContentGroup('mp-tabs', renderTabsContent);
    registerContentGroup('mp-tab', renderTabContent);
}

function renderTabsContent(component) {
    const body = document.createElement('div');
    body.className = 'p-3 space-y-3 text-xs';

    const props = component.get('props') || {};

    const orient = presetChips({
        options: [
            { value: 'horizontal', label: 'Horizontal' },
            { value: 'vertical', label: 'Vertical' },
        ],
        value: props.orientation || 'horizontal',
        onChange: (v) => component.set('props', { ...component.get('props'), orientation: v }),
    });
    body.appendChild(labeled('Orientation', orient.el));

    const def = numberWithUnit({
        value: props.default_tab_index ?? 0,
        unit: '', units: [''],
        min: 0, max: 50,
        onChange: ({ value }) => component.set('props', { ...component.get('props'), default_tab_index: value }),
    });
    body.appendChild(labeled('Default tab index (0-based)', def.el));

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'w-full px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded';
    addBtn.textContent = '+ Add tab';
    addBtn.addEventListener('click', () => component.append(TAB_DEFAULTS(false)));
    body.appendChild(addBtn);

    return body;
}

function renderTabContent(component) {
    const body = document.createElement('div');
    body.className = 'p-3 space-y-3 text-xs';

    const props = component.get('props') || {};

    const cb = document.createElement('label');
    cb.className = 'flex items-center gap-2';
    const i = document.createElement('input');
    i.type = 'checkbox';
    i.checked = !!props.active;
    i.addEventListener('change', () => component.set('props', { ...component.get('props'), active: i.checked }));
    cb.appendChild(i);
    const sp = document.createElement('span');
    sp.textContent = 'Active in editor preview';
    cb.appendChild(sp);
    body.appendChild(cb);

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'w-full px-2 py-1 text-xs bg-red-50 text-red-700 hover:bg-red-100 rounded';
    del.textContent = 'Remove tab';
    del.addEventListener('click', () => component.remove());
    body.appendChild(del);

    return body;
}

function labeled(label, control) {
    const w = document.createElement('div');
    w.className = 'flex flex-col gap-1';
    const l = document.createElement('label');
    l.className = 'text-[10px] uppercase tracking-wide text-slate-500';
    l.textContent = label;
    w.appendChild(l);
    w.appendChild(control);
    return w;
}
