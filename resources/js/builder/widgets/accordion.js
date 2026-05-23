// mp-accordion + mp-accordion-item — collapsible Q&A list.

import { registerContentGroup } from '../style-panel/index.js';
import { numberWithUnit } from '../controls/number-with-unit.js';

const ITEM_DEFAULTS = (open = false) => ({
    type: 'mp-accordion-item',
    props: { open },
});

export function registerAccordion(editor) {
    editor.DomComponents.addType('mp-accordion', {
        isComponent: (el) => el.classList?.contains('mp-accordion'),
        model: {
            defaults: {
                tagName: 'div',
                name: 'Accordion',
                draggable: '.mp-col',
                droppable: '[data-mp-widget="accordion-item"]',
                attributes: { class: 'mp-accordion', 'data-mp-widget': 'accordion' },
                props: { allow_multiple_open: false, default_open_index: 0 },
                components: [
                    ITEM_DEFAULTS(true),
                    ITEM_DEFAULTS(false),
                    ITEM_DEFAULTS(false),
                ],
            },
            init() {
                this.on('change:props', this.handlePropsChange);
                this.handlePropsChange();
            },
            handlePropsChange() {
                const props = this.get('props') || {};
                this.addAttributes({
                    'data-mp-multiple': props.allow_multiple_open ? '1' : '0',
                    'data-mp-default-open': String(parseInt(props.default_open_index, 10) || 0),
                });
            },
        },
    });

    editor.DomComponents.addType('mp-accordion-item', {
        isComponent: (el) => el.classList?.contains('mp-accordion__item'),
        model: {
            defaults: {
                tagName: 'div',
                name: 'Accordion item',
                draggable: '.mp-accordion',
                droppable: false,
                attributes: { class: 'mp-accordion__item', 'data-mp-widget': 'accordion-item', 'data-mp-open': '0' },
                props: { open: false },
                components: [
                    {
                        tagName: 'button',
                        attributes: { class: 'mp-accordion__title', type: 'button' },
                        components: 'Question text',
                        editable: true,
                        rte_profile: 'inline',
                        draggable: false,
                        droppable: false,
                    },
                    {
                        tagName: 'div',
                        attributes: { class: 'mp-accordion__body' },
                        components: [{ type: 'textnode', content: 'Answer body. Add details, lists, formatting here.' }],
                        editable: true,
                        rte_profile: 'text',
                        draggable: false,
                        droppable: false,
                    },
                ],
            },
            init() {
                this.on('change:props', this.handlePropsChange);
                this.handlePropsChange();
            },
            handlePropsChange() {
                const props = this.get('props') || {};
                this.addAttributes({ 'data-mp-open': props.open ? '1' : '0' });
            },
        },
    });

    registerContentGroup('mp-accordion', renderAccordionContent);
    registerContentGroup('mp-accordion-item', renderItemContent);
}

function renderAccordionContent(component) {
    const body = document.createElement('div');
    body.className = 'p-3 space-y-3 text-xs';

    const props = component.get('props') || {};

    body.appendChild(checkbox('Allow multiple open', !!props.allow_multiple_open, (c) =>
        component.set('props', { ...component.get('props'), allow_multiple_open: c })));

    const def = numberWithUnit({
        value: props.default_open_index ?? 0,
        unit: '', units: [''],
        min: 0, max: 50,
        onChange: ({ value }) => component.set('props', { ...component.get('props'), default_open_index: value }),
    });
    body.appendChild(labeled('Default open index (0-based)', def.el));

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'w-full px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded';
    addBtn.textContent = '+ Add item';
    addBtn.addEventListener('click', () => {
        component.append(ITEM_DEFAULTS(false));
    });
    body.appendChild(addBtn);

    return body;
}

function renderItemContent(component) {
    const body = document.createElement('div');
    body.className = 'p-3 space-y-3 text-xs';

    const props = component.get('props') || {};

    body.appendChild(checkbox('Open by default (in editor preview)', !!props.open, (c) =>
        component.set('props', { ...component.get('props'), open: c })));

    const actions = document.createElement('div');
    actions.className = 'flex gap-2';

    const dup = document.createElement('button');
    dup.type = 'button';
    dup.className = 'flex-1 px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded';
    dup.textContent = 'Duplicate';
    dup.addEventListener('click', () => {
        const parent = component.parent();
        const idx = parent?.components().indexOf(component);
        parent?.components().add({ type: 'mp-accordion-item', props: { open: false } }, { at: idx + 1 });
    });
    actions.appendChild(dup);

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'flex-1 px-2 py-1 text-xs bg-red-50 text-red-700 hover:bg-red-100 rounded';
    del.textContent = 'Remove';
    del.addEventListener('click', () => component.remove());
    actions.appendChild(del);

    body.appendChild(actions);

    return body;
}

function checkbox(text, checked, onChange) {
    const lbl = document.createElement('label');
    lbl.className = 'flex items-center gap-2';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = checked;
    cb.addEventListener('change', () => onChange(cb.checked));
    lbl.appendChild(cb);
    const sp = document.createElement('span');
    sp.textContent = text;
    lbl.appendChild(sp);
    return lbl;
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
