// mp-form + mp-form-field + mp-form-submit
// A composed form widget. The parent <form> handles submit via the public runtime;
// fields are typed children with `name` / `label` / `required` / `validation` props.

import { registerContentGroup } from '../style-panel/index.js';
import { presetChips } from '../controls/preset-chips.js';
import { numberWithUnit } from '../controls/number-with-unit.js';

const FIELD_TYPES = [
    { value: 'text',     label: 'Text' },
    { value: 'email',    label: 'Email' },
    { value: 'tel',      label: 'Phone' },
    { value: 'url',      label: 'URL' },
    { value: 'number',   label: 'Number' },
    { value: 'textarea', label: 'Textarea' },
    { value: 'select',   label: 'Select' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'radio',    label: 'Radio' },
];

function genFormId() {
    return 'f' + Math.random().toString(36).slice(2, 10);
}

const DEFAULT_FIELDS = () => ([
    { type: 'mp-form-field', props: { type: 'text',  name: 'name',    label: 'Name',    required: true } },
    { type: 'mp-form-field', props: { type: 'email', name: 'email',   label: 'Email',   required: true } },
    { type: 'mp-form-field', props: { type: 'textarea', name: 'message', label: 'Message', required: true } },
    { type: 'mp-form-submit' },
]);

export function registerForm(editor) {
    // ----- mp-form (parent) -----
    editor.DomComponents.addType('mp-form', {
        isComponent: (el) => el.tagName === 'FORM' && el.classList?.contains('mp-form'),
        model: {
            defaults: {
                tagName: 'form',
                name: 'Form',
                draggable: '.mp-col',
                droppable: '[data-mp-widget="form-field"], [data-mp-widget="form-submit"]',
                attributes: {
                    class: 'mp-form',
                    'data-mp-widget': 'form',
                    method: 'POST',
                    novalidate: 'novalidate',
                },
                props: {
                    form_id: '',
                    name: 'Contact form',
                    notification_email: '',
                    success_message: 'Thanks — we received your message.',
                    redirect_url: '',
                },
                components: DEFAULT_FIELDS(),
            },
            init() {
                const props = this.get('props') || {};
                if (!props.form_id) {
                    this.set('props', { ...props, form_id: genFormId() });
                }
                this.on('change:props', this.handlePropsChange);
                this.handlePropsChange();
            },
            handlePropsChange() {
                const props = this.get('props') || {};
                this.addAttributes({
                    'data-mp-form-id': props.form_id || '',
                    'data-mp-form-name': props.name || '',
                    'data-mp-redirect': props.redirect_url || '',
                    'data-mp-success-message': props.success_message || '',
                    'data-mp-notification': props.notification_email || '',
                });
            },
        },
    });

    // ----- mp-form-field -----
    editor.DomComponents.addType('mp-form-field', {
        isComponent: (el) => el.classList?.contains('mp-form-field'),
        model: {
            defaults: {
                tagName: 'div',
                name: 'Field',
                draggable: '.mp-form',
                droppable: false,
                attributes: { class: 'mp-form-field', 'data-mp-widget': 'form-field' },
                props: {
                    type: 'text',
                    name: 'field_1',
                    label: 'Field',
                    placeholder: '',
                    required: false,
                    default_value: '',
                    options: [
                        { value: 'option_1', label: 'Option 1' },
                        { value: 'option_2', label: 'Option 2' },
                    ],
                    min_length: 0,
                    max_length: 0,
                },
                components: [],
            },
            init() {
                this.on('change:props', this.handlePropsChange);
                this.handlePropsChange();
            },
            handlePropsChange() {
                const props = this.get('props') || {};
                const el = this.getEl();
                if (!el) return;
                el.innerHTML = renderField(props);
            },
            toHTML() {
                const props = this.get('props') || {};
                return `<div class="mp-form-field" data-mp-widget="form-field">${renderField(props)}</div>`;
            },
        },
    });

    // ----- mp-form-submit -----
    editor.DomComponents.addType('mp-form-submit', {
        isComponent: (el) => el.classList?.contains('mp-form-submit'),
        model: {
            defaults: {
                tagName: 'div',
                name: 'Submit',
                draggable: '.mp-form',
                droppable: false,
                attributes: { class: 'mp-form-submit', 'data-mp-widget': 'form-submit' },
                props: {
                    label: 'Send',
                    full_width: false,
                    align: 'left',
                },
                components: [],
            },
            init() {
                this.on('change:props', this.handlePropsChange);
                this.handlePropsChange();
            },
            handlePropsChange() {
                const props = this.get('props') || {};
                const el = this.getEl();
                if (!el) return;
                el.style.textAlign = props.align || 'left';
                const btnClass = `mp-btn ${props.full_width ? 'mp-btn--full' : ''}`;
                el.innerHTML = `<button type="submit" class="${btnClass}">${escapeText(props.label || 'Send')}</button>`;
            },
            toHTML() {
                const props = this.get('props') || {};
                const btnClass = `mp-btn ${props.full_width ? 'mp-btn--full' : ''}`;
                return `<div class="mp-form-submit" data-mp-widget="form-submit" style="text-align:${escapeAttr(props.align || 'left')}"><button type="submit" class="${btnClass}">${escapeText(props.label || 'Send')}</button></div>`;
            },
        },
    });

    registerContentGroup('mp-form', renderFormContent);
    registerContentGroup('mp-form-field', renderFieldContent);
    registerContentGroup('mp-form-submit', renderSubmitContent);
}

function renderField(props) {
    const id = `mp-f-${props.name || 'x'}-${Math.random().toString(36).slice(2, 6)}`;
    const required = props.required ? ' required' : '';
    const name = escapeAttr(props.name || '');
    const label = escapeText(props.label || '');
    const ph = escapeAttr(props.placeholder || '');
    const defVal = escapeAttr(props.default_value || '');

    const labelHtml = `<label for="${id}" class="mp-form-field__label">${label}${props.required ? ' <span class="mp-form-field__req">*</span>' : ''}</label>`;

    let input;
    switch (props.type) {
        case 'textarea':
            input = `<textarea id="${id}" name="${name}" placeholder="${ph}" class="mp-form-field__input"${required} rows="4">${defVal}</textarea>`;
            break;
        case 'select':
            input = `<select id="${id}" name="${name}" class="mp-form-field__input"${required}>` +
                (props.options || []).map((o) => `<option value="${escapeAttr(o.value)}">${escapeText(o.label)}</option>`).join('') +
                '</select>';
            break;
        case 'checkbox':
            input = `<label class="mp-form-field__check"><input type="checkbox" name="${name}" value="1"${required}> <span>${label}</span></label>`;
            return `<div class="mp-form-field__wrap">${input}</div>`;
        case 'radio':
            input = (props.options || []).map((o, i) =>
                `<label class="mp-form-field__check"><input type="radio" name="${name}" value="${escapeAttr(o.value)}"${required && i === 0 ? ' required' : ''}> <span>${escapeText(o.label)}</span></label>`
            ).join('');
            return `<div class="mp-form-field__wrap"><div class="mp-form-field__label">${label}${props.required ? ' <span class="mp-form-field__req">*</span>' : ''}</div>${input}</div>`;
        default:
            input = `<input id="${id}" type="${escapeAttr(props.type || 'text')}" name="${name}" placeholder="${ph}" value="${defVal}" class="mp-form-field__input"${required}>`;
    }

    return `<div class="mp-form-field__wrap">${labelHtml}${input}</div>`;
}

function renderFormContent(component) {
    const body = document.createElement('div');
    body.className = 'p-3 space-y-3 text-xs';
    const props = component.get('props') || {};

    body.appendChild(labeled('Form name', textInput(props.name || '', (v) =>
        component.set('props', { ...component.get('props'), name: v }))));

    body.appendChild(labeled('Notification email', textInput(props.notification_email || '', (v) =>
        component.set('props', { ...component.get('props'), notification_email: v }), 'email@example.com')));

    body.appendChild(labeled('Success message', textInput(props.success_message || '', (v) =>
        component.set('props', { ...component.get('props'), success_message: v }))));

    body.appendChild(labeled('Redirect URL (optional)', textInput(props.redirect_url || '', (v) =>
        component.set('props', { ...component.get('props'), redirect_url: v }), '/thanks')));

    const idLine = document.createElement('p');
    idLine.className = 'text-[10px] text-slate-500 font-mono';
    idLine.textContent = `Form ID: ${props.form_id || '(pending)'}`;
    body.appendChild(idLine);

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'w-full px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded';
    addBtn.textContent = '+ Add field';
    addBtn.addEventListener('click', () => {
        component.append({
            type: 'mp-form-field',
            props: {
                type: 'text',
                name: `field_${component.findType('mp-form-field').length + 1}`,
                label: 'Field',
                required: false,
            },
        }, { at: component.components().length - 1 }); // insert before submit button
    });
    body.appendChild(addBtn);

    return body;
}

function renderFieldContent(component) {
    const body = document.createElement('div');
    body.className = 'p-3 space-y-3 text-xs';
    const props = component.get('props') || {};

    const type = presetChips({
        options: FIELD_TYPES,
        value: props.type || 'text',
        onChange: (v) => component.set('props', { ...component.get('props'), type: v }),
    });
    body.appendChild(labeled('Type', type.el));

    body.appendChild(labeled('Name (form data key)', textInput(props.name || '', (v) =>
        component.set('props', { ...component.get('props'), name: v.replace(/[^a-z0-9_]/gi, '_').toLowerCase() }))));

    body.appendChild(labeled('Label', textInput(props.label || '', (v) =>
        component.set('props', { ...component.get('props'), label: v }))));

    body.appendChild(labeled('Placeholder', textInput(props.placeholder || '', (v) =>
        component.set('props', { ...component.get('props'), placeholder: v }))));

    body.appendChild(labeled('Default value', textInput(props.default_value || '', (v) =>
        component.set('props', { ...component.get('props'), default_value: v }))));

    body.appendChild(checkbox('Required', !!props.required, (c) =>
        component.set('props', { ...component.get('props'), required: c })));

    if (props.type === 'select' || props.type === 'radio') {
        const listLabel = document.createElement('label');
        listLabel.className = 'text-[10px] uppercase tracking-wide text-slate-500 pt-2 block';
        listLabel.textContent = 'Options';
        body.appendChild(listLabel);
        renderOptionsList(body, component);
    }

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'w-full px-2 py-1 text-xs bg-red-50 text-red-700 hover:bg-red-100 rounded mt-2';
    del.textContent = 'Remove field';
    del.addEventListener('click', () => component.remove());
    body.appendChild(del);

    return body;
}

function renderOptionsList(body, component) {
    const list = document.createElement('div');
    list.className = 'space-y-2';
    body.appendChild(list);

    function refresh() {
        list.innerHTML = '';
        const opts = component.get('props')?.options || [];
        opts.forEach((opt, idx) => {
            const row = document.createElement('div');
            row.className = 'flex gap-2';
            const lbl = document.createElement('input');
            lbl.type = 'text';
            lbl.className = 'flex-1 px-2 py-1 text-xs border border-slate-300 rounded';
            lbl.placeholder = 'Label';
            lbl.value = opt.label || '';
            lbl.addEventListener('input', () => updateOpt(idx, { label: lbl.value }));
            const val = document.createElement('input');
            val.type = 'text';
            val.className = 'flex-1 px-2 py-1 text-xs border border-slate-300 rounded font-mono';
            val.placeholder = 'value';
            val.value = opt.value || '';
            val.addEventListener('input', () => updateOpt(idx, { value: val.value }));
            const del = document.createElement('button');
            del.type = 'button';
            del.className = 'px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded';
            del.textContent = '×';
            del.addEventListener('click', () => removeOpt(idx));
            row.appendChild(lbl);
            row.appendChild(val);
            row.appendChild(del);
            list.appendChild(row);
        });

        const add = document.createElement('button');
        add.type = 'button';
        add.className = 'w-full px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded';
        add.textContent = '+ Add option';
        add.addEventListener('click', () => {
            const opts = [...(component.get('props')?.options || []), { value: 'option_x', label: 'Option X' }];
            component.set('props', { ...component.get('props'), options: opts });
            refresh();
        });
        list.appendChild(add);
    }
    function updateOpt(idx, patch) {
        const opts = [...(component.get('props')?.options || [])];
        opts[idx] = { ...opts[idx], ...patch };
        component.set('props', { ...component.get('props'), options: opts });
        refresh();
    }
    function removeOpt(idx) {
        const opts = [...(component.get('props')?.options || [])];
        opts.splice(idx, 1);
        component.set('props', { ...component.get('props'), options: opts });
        refresh();
    }
    refresh();
}

function renderSubmitContent(component) {
    const body = document.createElement('div');
    body.className = 'p-3 space-y-3 text-xs';
    const props = component.get('props') || {};

    body.appendChild(labeled('Button label', textInput(props.label || 'Send', (v) =>
        component.set('props', { ...component.get('props'), label: v }))));

    const align = presetChips({
        options: [
            { value: 'left',   label: 'Left' },
            { value: 'center', label: 'Center' },
            { value: 'right',  label: 'Right' },
        ],
        value: props.align || 'left',
        onChange: (v) => component.set('props', { ...component.get('props'), align: v }),
    });
    body.appendChild(labeled('Alignment', align.el));

    body.appendChild(checkbox('Full width', !!props.full_width, (c) =>
        component.set('props', { ...component.get('props'), full_width: c })));

    return body;
}

function textInput(value, onChange, placeholder = '') {
    const i = document.createElement('input');
    i.type = 'text';
    i.value = value;
    i.placeholder = placeholder;
    i.className = 'w-full px-2 py-1 border border-slate-300 rounded';
    i.addEventListener('input', () => onChange(i.value));
    return i;
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
function escapeAttr(s) { return String(s ?? '').replace(/"/g, '&quot;'); }
function escapeText(s) { return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
