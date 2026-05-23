// mp-icon — single icon from the Lucide sprite, optionally wrapped in a link.

import { registerContentGroup } from '../style-panel/index.js';
import { presetChips } from '../controls/preset-chips.js';
import { iconPicker } from '../controls/icon-picker.js';
import { renderIcon } from '../icons/lucide-sprite.js';

const SHAPE_CLASSES = ['mp-icon--square', 'mp-icon--circle'];

export function registerIcon(editor) {
    editor.DomComponents.addType('mp-icon', {
        isComponent: (el) => el.classList?.contains('mp-icon'),
        model: {
            defaults: {
                tagName: 'span',
                name: 'Icon',
                draggable: '.mp-col',
                droppable: false,
                attributes: { class: 'mp-icon', 'data-mp-widget': 'icon' },
                props: {
                    icon_name: 'star',
                    shape: 'none',
                    link: null,
                },
                components: [],
            },
            init() {
                this.on('change:props', this.handlePropsChange);
                this.handlePropsChange();
            },
            handlePropsChange() {
                const props = this.get('props') || {};

                this.removeClass(SHAPE_CLASSES);
                if (props.shape === 'square') this.addClass('mp-icon--square');
                else if (props.shape === 'circle') this.addClass('mp-icon--circle');

                if (props.link?.url) {
                    this.set('tagName', 'a');
                    this.addAttributes({ href: props.link.url, target: props.link.target || '_self' });
                } else {
                    this.set('tagName', 'span');
                    this.removeAttributes(['href', 'target']);
                }

                // Replace innerHTML with the icon SVG
                const el = this.getEl();
                if (el && props.icon_name) {
                    el.innerHTML = renderIcon(props.icon_name, { size: 20 });
                }
            },
        },
    });

    registerContentGroup('mp-icon', renderContentTab);
}

function renderContentTab(component) {
    const body = document.createElement('div');
    body.className = 'p-3 space-y-3 text-xs';

    const props = component.get('props') || {};

    const picker = iconPicker({
        value: props.icon_name,
        onChange: (v) => component.set('props', { ...component.get('props'), icon_name: v }),
    });
    body.appendChild(labeled('Icon', picker.el));

    const shape = presetChips({
        options: [
            { value: 'none', label: 'None' },
            { value: 'square', label: 'Square' },
            { value: 'circle', label: 'Circle' },
        ],
        value: props.shape || 'none',
        onChange: (v) => component.set('props', { ...component.get('props'), shape: v }),
    });
    body.appendChild(labeled('Shape', shape.el));

    const url = document.createElement('input');
    url.type = 'url';
    url.className = 'w-full px-2 py-1 border border-slate-300 rounded';
    url.placeholder = 'https:// (optional)';
    url.value = props.link?.url || '';
    url.addEventListener('input', () => {
        const next = url.value ? { url: url.value, target: '_self' } : null;
        component.set('props', { ...component.get('props'), link: next });
    });
    body.appendChild(labeled('Link', url));

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
