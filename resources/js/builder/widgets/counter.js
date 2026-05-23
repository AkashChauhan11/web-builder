// mp-counter — animated number counter (animates on the public page; canvas shows the end value).

import { registerContentGroup } from '../style-panel/index.js';
import { numberWithUnit } from '../controls/number-with-unit.js';
import { presetChips } from '../controls/preset-chips.js';

const SEP_LABELS = { 'none': 'None', ',': 'Comma', ' ': 'Space' };

export function registerCounter(editor) {
    editor.DomComponents.addType('mp-counter', {
        isComponent: (el) => el.classList?.contains('mp-counter'),
        model: {
            defaults: {
                tagName: 'div',
                name: 'Counter',
                draggable: '.mp-col',
                droppable: false,
                attributes: { class: 'mp-counter', 'data-mp-widget': 'counter' },
                props: {
                    start: 0,
                    end: 100,
                    duration_ms: 2000,
                    prefix: '',
                    suffix: '',
                    separator: ',',
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
                    'data-mp-start': String(props.start ?? 0),
                    'data-mp-end': String(props.end ?? 100),
                    'data-mp-duration': String(props.duration_ms ?? 2000),
                    'data-mp-prefix': String(props.prefix ?? ''),
                    'data-mp-suffix': String(props.suffix ?? ''),
                    'data-mp-separator': props.separator === 'none' ? '' : (props.separator ?? ','),
                });

                const el = this.getEl();
                if (!el) return;
                const formatted = formatNumber(props.end ?? 100, props.separator);
                el.innerHTML = `<span class="mp-counter__value">${escapeText(props.prefix || '')}${formatted}${escapeText(props.suffix || '')}</span>`;
            },
            toHTML() {
                const props = this.get('props') || {};
                const formatted = formatNumber(props.end ?? 100, props.separator);
                return `<div class="mp-counter" data-mp-widget="counter" data-mp-start="${props.start ?? 0}" data-mp-end="${props.end ?? 100}" data-mp-duration="${props.duration_ms ?? 2000}" data-mp-prefix="${escapeAttr(props.prefix || '')}" data-mp-suffix="${escapeAttr(props.suffix || '')}" data-mp-separator="${props.separator === 'none' ? '' : (props.separator ?? ',')}"><span class="mp-counter__value">${escapeText(props.prefix || '')}${formatted}${escapeText(props.suffix || '')}</span></div>`;
            },
        },
    });

    registerContentGroup('mp-counter', renderContentTab);
}

function formatNumber(n, separator) {
    if (separator === 'none') return String(n);
    const sep = separator || ',';
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, sep);
}

function renderContentTab(component) {
    const body = document.createElement('div');
    body.className = 'p-3 space-y-3 text-xs';

    const props = component.get('props') || {};

    body.appendChild(labeled('Start', numericInput(props.start ?? 0, (v) =>
        component.set('props', { ...component.get('props'), start: v }))));

    body.appendChild(labeled('End', numericInput(props.end ?? 100, (v) =>
        component.set('props', { ...component.get('props'), end: v }))));

    const dur = numberWithUnit({
        value: props.duration_ms ?? 2000,
        unit: 'ms',
        units: ['ms'],
        min: 100, max: 10000, step: 100,
        onChange: ({ value }) => component.set('props', { ...component.get('props'), duration_ms: value }),
    });
    body.appendChild(labeled('Duration', dur.el));

    body.appendChild(labeled('Prefix', textInput(props.prefix || '', (v) =>
        component.set('props', { ...component.get('props'), prefix: v }))));

    body.appendChild(labeled('Suffix', textInput(props.suffix || '', (v) =>
        component.set('props', { ...component.get('props'), suffix: v }))));

    const sep = presetChips({
        options: [
            { value: 'none', label: 'None' },
            { value: ',', label: ',' },
            { value: ' ', label: 'Space' },
        ],
        value: props.separator || ',',
        onChange: (v) => component.set('props', { ...component.get('props'), separator: v }),
    });
    body.appendChild(labeled('Separator', sep.el));

    return body;
}

function numericInput(value, onChange) {
    const i = document.createElement('input');
    i.type = 'number';
    i.value = String(value);
    i.className = 'w-full px-2 py-1 border border-slate-300 rounded';
    i.addEventListener('input', () => onChange(parseFloat(i.value) || 0));
    return i;
}
function textInput(value, onChange) {
    const i = document.createElement('input');
    i.type = 'text';
    i.value = value;
    i.className = 'w-full px-2 py-1 border border-slate-300 rounded';
    i.addEventListener('input', () => onChange(i.value));
    return i;
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

function escapeAttr(s) { return String(s ?? '').replace(/"/g, '&quot;'); }
function escapeText(s) { return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
