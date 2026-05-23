// mp-progress — progress / skill bar.

import { registerContentGroup } from '../style-panel/index.js';
import { slider } from '../controls/slider.js';
import { numberWithUnit } from '../controls/number-with-unit.js';

export function registerProgress(editor) {
    editor.DomComponents.addType('mp-progress', {
        isComponent: (el) => el.classList?.contains('mp-progress'),
        model: {
            defaults: {
                tagName: 'div',
                name: 'Progress',
                draggable: '.mp-col',
                droppable: false,
                attributes: { class: 'mp-progress', 'data-mp-widget': 'progress' },
                props: {
                    value: 75,
                    max: 100,
                    show_label: true,
                    label_format: '{value}%',
                    label_text: 'Skill',
                    animated: true,
                },
                components: [],
            },
            init() {
                this.on('change:props', this.handlePropsChange);
                this.handlePropsChange();
            },
            handlePropsChange() {
                const props = this.get('props') || {};

                this.addAttributes({
                    'data-mp-value': String(props.value ?? 0),
                    'data-mp-max': String(props.max ?? 100),
                    'data-mp-animated': props.animated ? '1' : '0',
                });

                const el = this.getEl();
                if (!el) return;
                const pct = Math.max(0, Math.min(100, (props.value / props.max) * 100));
                el.innerHTML = renderInner(props, pct);
            },
            toHTML() {
                const props = this.get('props') || {};
                const pct = Math.max(0, Math.min(100, (props.value / props.max) * 100));
                return `<div class="mp-progress" data-mp-widget="progress" data-mp-value="${props.value}" data-mp-max="${props.max}" data-mp-animated="${props.animated ? 1 : 0}">${renderInner(props, pct)}</div>`;
            },
        },
    });

    registerContentGroup('mp-progress', renderContentTab);
}

function renderInner(props, pct) {
    const label = props.show_label
        ? `<div class="mp-progress__label"><span>${escapeText(props.label_text || '')}</span><span>${formatLabel(props.label_format || '{value}%', props.value, pct)}</span></div>`
        : '';
    return `${label}<div class="mp-progress__track"><div class="mp-progress__fill" style="width:${pct}%"></div></div>`;
}

function formatLabel(format, value, pct) {
    return String(format)
        .replace('{value}', String(value))
        .replace('{pct}', String(Math.round(pct)));
}

function renderContentTab(component) {
    const body = document.createElement('div');
    body.className = 'p-3 space-y-3 text-xs';

    const props = component.get('props') || {};

    const value = slider({
        min: 0, max: 100, step: 1,
        value: props.value || 0,
        onChange: (v) => component.set('props', { ...component.get('props'), value: v }),
    });
    body.appendChild(labeled('Value', value.el));

    const max = numberWithUnit({
        value: props.max || 100,
        unit: '',
        units: [''],
        min: 1, max: 10000,
        onChange: ({ value: v }) => component.set('props', { ...component.get('props'), max: v }),
    });
    body.appendChild(labeled('Max', max.el));

    const lblTxt = document.createElement('input');
    lblTxt.type = 'text';
    lblTxt.className = 'w-full px-2 py-1 border border-slate-300 rounded';
    lblTxt.value = props.label_text || '';
    lblTxt.addEventListener('input', () => component.set('props', { ...component.get('props'), label_text: lblTxt.value }));
    body.appendChild(labeled('Label text', lblTxt));

    const fmt = document.createElement('input');
    fmt.type = 'text';
    fmt.className = 'w-full px-2 py-1 border border-slate-300 rounded';
    fmt.value = props.label_format || '{value}%';
    fmt.placeholder = '{value} or {pct}';
    fmt.addEventListener('input', () => component.set('props', { ...component.get('props'), label_format: fmt.value }));
    body.appendChild(labeled('Label format', fmt));

    body.appendChild(checkbox('Show label', !!props.show_label, (c) => component.set('props', { ...component.get('props'), show_label: c })));
    body.appendChild(checkbox('Animate on scroll', !!props.animated, (c) => component.set('props', { ...component.get('props'), animated: c })));

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

function escapeText(s) { return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
