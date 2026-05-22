// mp-section — top-level layout container. Width: boxed | full. Holds mp-column children only.
// Drop rules: root or inside an mp-column (Inner Section). Never inside another mp-section directly.

const TAG_OPTIONS = ['section', 'header', 'footer', 'div', 'aside'];

export function registerSection(editor) {
    editor.DomComponents.addType('mp-section', {
        isComponent: (el) => el.tagName && el.classList?.contains('mp-sec'),

        model: {
            defaults: {
                tagName: 'section',
                name: 'Section',
                draggable: 'body, .mp-col',
                droppable: '.mp-col',
                attributes: {
                    class: 'mp-sec mp-sec--boxed',
                    'data-mp-widget': 'section',
                },
                props: {
                    width: 'boxed',
                    max_inner_width: 1200,
                    vertical_align: 'top',
                    min_height_mode: 'default',
                    min_height: 0,
                    html_tag: 'section',
                },
                components: [{
                    tagName: 'div',
                    attributes: { class: 'mp-sec__inner' },
                    selectable: false,
                    hoverable: false,
                    droppable: '.mp-col',
                    draggable: false,
                    components: [],
                }],
                'custom-name': 'Section',
            },

            init() {
                this.on('change:props', this.handlePropsChange);
                this.handlePropsChange();
            },

            handlePropsChange() {
                const props = this.get('props') || {};

                // Class management — only touch the mp-sec/mp-sec--{width} variants, preserve any user-added classes
                this.removeClass(['mp-sec--boxed', 'mp-sec--full']);
                this.addClass(['mp-sec', `mp-sec--${props.width || 'boxed'}`]);

                // data-valign attribute — set when non-default, remove when default
                if (props.vertical_align && props.vertical_align !== 'top') {
                    this.addAttributes({ 'data-valign': props.vertical_align });
                } else {
                    this.removeAttributes('data-valign');
                }

                // data-mp-widget is set in defaults.attributes; no need to re-set it here

                if (TAG_OPTIONS.includes(props.html_tag)) {
                    this.set('tagName', props.html_tag);
                }

                // Sync inner max-width via CSS variable on the section element
                const innerWidth = parseInt(props.max_inner_width ?? 1200, 10);
                this.addStyle({ '--mp-sec-inner': `${innerWidth}px` });

                // Sync min-height
                if (props.min_height_mode === 'fixed' && props.min_height > 0) {
                    this.addStyle({ 'min-height': `${parseInt(props.min_height, 10)}px` });
                } else if (props.min_height_mode === 'screen') {
                    this.addStyle({ 'min-height': '100vh' });
                } else if (props.min_height_mode === 'fit') {
                    this.addStyle({ 'min-height': 'auto' });
                } else {
                    this.removeStyle('min-height');
                }
            },
        },

        view: {
            // Default GrapesJS view is fine; we rely on CSS for layout.
        },
    });
}

export const SECTION_PROP_SCHEMA = {
    width: { type: 'select', options: ['boxed', 'full'], default: 'boxed' },
    max_inner_width: { type: 'number', min: 320, max: 2560, default: 1200 },
    vertical_align: { type: 'select', options: ['top', 'middle', 'bottom'], default: 'top' },
    min_height_mode: { type: 'select', options: ['default', 'fit', 'fixed', 'screen'], default: 'default' },
    min_height: { type: 'number', min: 0, max: 2000, default: 0 },
    html_tag: { type: 'select', options: TAG_OPTIONS, default: 'section' },
};
