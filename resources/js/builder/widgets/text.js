// mp-text — rich-text container with full RTE toolbar.

import { registerContentGroup } from '../style-panel/index.js';

export function registerText(editor) {
    editor.DomComponents.addType('mp-text', {
        isComponent: (el) => el.tagName === 'DIV' && el.classList?.contains('mp-text'),
        model: {
            defaults: {
                tagName: 'div',
                name: 'Text',
                draggable: '.mp-col',
                droppable: false,
                attributes: { class: 'mp-text', 'data-mp-widget': 'text' },
                props: {},
                components: [{
                    type: 'textnode',
                    content: 'Edit this text. Use the toolbar to format with bold, italic, lists, and more.',
                }],
                editable: true,
                rte_profile: 'text',
            },
        },
    });

    registerContentGroup('mp-text', () => {
        const d = document.createElement('div');
        d.className = 'p-3 text-xs text-slate-500';
        d.textContent = 'Click into the text on the canvas to edit. Use the floating toolbar for formatting.';
        return d;
    });
}
