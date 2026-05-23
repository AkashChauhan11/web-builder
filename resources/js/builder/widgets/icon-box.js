// mp-icon-box — composite icon + inline-editable title + inline-editable description.

import { registerContentGroup } from '../style-panel/index.js';
import { presetChips } from '../controls/preset-chips.js';
import { iconPicker } from '../controls/icon-picker.js';
import { renderIcon } from '../icons/lucide-sprite.js';

const POSITION_CLASSES = ['mp-iconbox--top', 'mp-iconbox--left', 'mp-iconbox--right'];

export function registerIconBox(editor) {
    editor.DomComponents.addType('mp-icon-box', {
        isComponent: (el) => el.classList?.contains('mp-iconbox'),
        model: {
            defaults: {
                tagName: 'div',
                name: 'Icon Box',
                draggable: '.mp-col',
                droppable: false,
                attributes: { class: 'mp-iconbox mp-iconbox--top', 'data-mp-widget': 'icon-box' },
                props: {
                    icon_name: 'star',
                    title_tag: 'h3',
                    title_position: 'top',
                    alignment: 'left',
                },
                components: [
                    {
                        tagName: 'span',
                        attributes: { class: 'mp-iconbox__icon' },
                        selectable: false,
                        hoverable: false,
                        draggable: false,
                        droppable: false,
                    },
                    {
                        tagName: 'h3',
                        attributes: { class: 'mp-iconbox__title' },
                        components: 'Feature title',
                        editable: true,
                        rte_profile: 'heading',
                        draggable: false,
                        droppable: false,
                    },
                    {
                        tagName: 'div',
                        attributes: { class: 'mp-iconbox__desc' },
                        components: [{ type: 'textnode', content: 'A short description of this feature.' }],
                        editable: true,
                        rte_profile: 'inline',
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

                this.removeClass(POSITION_CLASSES);
                this.addClass([`mp-iconbox--${props.title_position || 'top'}`]);

                this.addAttributes({ 'data-align': props.alignment || 'left' });

                // Update title tag
                const title = this.find('.mp-iconbox__title')[0];
                if (title && /^h[1-6]$/.test(props.title_tag || '')) {
                    title.set('tagName', props.title_tag);
                }

                // Replace icon HTML
                const iconWrap = this.getEl()?.querySelector('.mp-iconbox__icon');
                if (iconWrap && props.icon_name) {
                    iconWrap.innerHTML = renderIcon(props.icon_name, { size: 32 });
                }
            },
        },
    });

    registerContentGroup('mp-icon-box', renderContentTab);
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

    const titleTag = presetChips({
        options: ['h2', 'h3', 'h4', 'h5'].map((v) => ({ value: v, label: v.toUpperCase() })),
        value: props.title_tag || 'h3',
        onChange: (v) => component.set('props', { ...component.get('props'), title_tag: v }),
    });
    body.appendChild(labeled('Title tag', titleTag.el));

    const position = presetChips({
        options: [
            { value: 'top', label: 'Top' },
            { value: 'left', label: 'Left' },
            { value: 'right', label: 'Right' },
        ],
        value: props.title_position || 'top',
        onChange: (v) => component.set('props', { ...component.get('props'), title_position: v }),
    });
    body.appendChild(labeled('Icon position', position.el));

    const align = presetChips({
        options: [
            { value: 'left', label: 'Left' },
            { value: 'center', label: 'Center' },
            { value: 'right', label: 'Right' },
        ],
        value: props.alignment || 'left',
        onChange: (v) => component.set('props', { ...component.get('props'), alignment: v }),
    });
    body.appendChild(labeled('Alignment', align.el));

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
