// mp-alert — info/success/warning/error alert with optional dismiss button.

import { registerContentGroup } from '../style-panel/index.js';
import { presetChips } from '../controls/preset-chips.js';
import { iconPicker } from '../controls/icon-picker.js';
import { renderIcon } from '../icons/lucide-sprite.js';

const VARIANT_CLASSES = ['mp-alert--info', 'mp-alert--success', 'mp-alert--warning', 'mp-alert--error'];
const DEFAULT_ICON = { info: 'info', success: 'check-circle', warning: 'alert', error: 'alert-circle' };

export function registerAlert(editor) {
    editor.DomComponents.addType('mp-alert', {
        isComponent: (el) => el.classList?.contains('mp-alert'),
        model: {
            defaults: {
                tagName: 'div',
                name: 'Alert',
                draggable: '.mp-col',
                droppable: false,
                attributes: { class: 'mp-alert mp-alert--info', 'data-mp-widget': 'alert', 'data-mp-dismissible': '0' },
                props: {
                    variant: 'info',
                    dismissible: false,
                    icon_enabled: true,
                    icon_name: 'info',
                },
                components: [
                    {
                        tagName: 'span',
                        attributes: { class: 'mp-alert__icon' },
                        selectable: false, hoverable: false, draggable: false, droppable: false,
                    },
                    {
                        tagName: 'div',
                        attributes: { class: 'mp-alert__body' },
                        selectable: false, draggable: false, droppable: false,
                        components: [
                            {
                                tagName: 'h4',
                                attributes: { class: 'mp-alert__title' },
                                components: 'Alert title',
                                editable: true, rte_profile: 'heading',
                                draggable: false, droppable: false,
                            },
                            {
                                tagName: 'div',
                                attributes: { class: 'mp-alert__message' },
                                components: [{ type: 'textnode', content: 'Optional supporting message.' }],
                                editable: true, rte_profile: 'inline',
                                draggable: false, droppable: false,
                            },
                        ],
                    },
                ],
            },
            init() {
                this.on('change:props', this.handlePropsChange);
                this.handlePropsChange();
            },
            handlePropsChange() {
                const props = this.get('props') || {};

                this.removeClass(VARIANT_CLASSES);
                this.addClass(`mp-alert--${props.variant || 'info'}`);

                this.addAttributes({ 'data-mp-dismissible': props.dismissible ? '1' : '0' });

                // Manage close button
                const el = this.getEl();
                if (el) {
                    let close = el.querySelector('.mp-alert__close');
                    if (props.dismissible && !close) {
                        close = document.createElement('button');
                        close.type = 'button';
                        close.className = 'mp-alert__close';
                        close.setAttribute('aria-label', 'Dismiss');
                        close.contentEditable = 'false';
                        close.textContent = '×';
                        el.appendChild(close);
                    } else if (!props.dismissible && close) {
                        close.remove();
                    }

                    // Icon
                    const iconWrap = el.querySelector('.mp-alert__icon');
                    if (iconWrap) {
                        if (props.icon_enabled && props.icon_name) {
                            iconWrap.style.display = '';
                            iconWrap.innerHTML = renderIcon(props.icon_name, { size: 20 });
                        } else {
                            iconWrap.style.display = 'none';
                            iconWrap.innerHTML = '';
                        }
                    }
                }
            },
        },
    });

    registerContentGroup('mp-alert', renderContentTab);
}

function renderContentTab(component) {
    const body = document.createElement('div');
    body.className = 'p-3 space-y-3 text-xs';

    const props = component.get('props') || {};

    const variant = presetChips({
        options: [
            { value: 'info', label: 'Info' },
            { value: 'success', label: 'Success' },
            { value: 'warning', label: 'Warning' },
            { value: 'error', label: 'Error' },
        ],
        value: props.variant || 'info',
        onChange: (v) => component.set('props', {
            ...component.get('props'),
            variant: v,
            icon_name: component.get('props')?.icon_name || DEFAULT_ICON[v],
        }),
    });
    body.appendChild(labeled('Variant', variant.el));

    const dismiss = checkbox('Dismissible', !!props.dismissible, (checked) =>
        component.set('props', { ...component.get('props'), dismissible: checked }));
    body.appendChild(dismiss);

    const iconEn = checkbox('Show icon', !!props.icon_enabled, (checked) =>
        component.set('props', { ...component.get('props'), icon_enabled: checked }));
    body.appendChild(iconEn);

    const picker = iconPicker({
        value: props.icon_name,
        onChange: (v) => component.set('props', { ...component.get('props'), icon_name: v }),
    });
    body.appendChild(labeled('Icon', picker.el));

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
