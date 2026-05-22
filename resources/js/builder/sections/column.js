// mp-column — column inside an mp-section. Holds widgets or Inner Sections.

export function registerColumn(editor) {
    editor.DomComponents.addType('mp-column', {
        isComponent: (el) => el.tagName === 'DIV' && el.classList?.contains('mp-col'),

        model: {
            defaults: {
                tagName: 'div',
                name: 'Column',
                draggable: '.mp-sec__inner',
                droppable: '[data-mp-widget], .mp-sec',
                attributes: {
                    class: 'mp-col',
                    'data-mp-widget': 'column',
                },
                props: {
                    size_pct: 100,
                    vertical_align: 'top',
                    content_position: 'start',
                },
                'custom-name': 'Column',
            },

            init() {
                // Read size_pct from inline style if present (when loaded from saved JSON or picker)
                const style = this.getStyle();
                if (style['flex-basis']) {
                    const pct = parseFloat(style['flex-basis']);
                    if (!isNaN(pct)) {
                        this.set('props', { ...(this.get('props') || {}), size_pct: pct });
                    }
                }
                this.on('change:props', this.handlePropsChange);
                this.handlePropsChange();
            },

            handlePropsChange() {
                const props = this.get('props') || {};
                this.addStyle({ 'flex-basis': `${props.size_pct}%` });

                // data-content-pos attribute — surgical add/remove instead of setAttributes
                if (props.content_position && props.content_position !== 'start') {
                    this.addAttributes({ 'data-content-pos': props.content_position });
                } else {
                    this.removeAttributes('data-content-pos');
                }

                // data-valign attribute
                if (props.vertical_align && props.vertical_align !== 'top') {
                    this.addAttributes({ 'data-valign': props.vertical_align });
                } else {
                    this.removeAttributes('data-valign');
                }
            },
        },
    });

    enableColumnResize(editor);
}

// Drag-to-resize: hovering the left edge of a non-first column (the gap area) shows a col-resize cursor;
// dragging adjusts size_pct on this column AND the previous-sibling column (they trade percentage).
function enableColumnResize(editor) {
    let dragging = null; // { rightCol, leftCol, startX, startRightPct, startLeftPct, parentWidth }

    editor.on('load', () => {
        const canvasDoc = editor.Canvas.getDocument();
        const canvasBody = canvasDoc.body;

        canvasBody.addEventListener('mousedown', (e) => {
            // Detect a click in the gap area on the left of a non-first column.
            const target = e.target.closest('.mp-col');
            if (!target) return;

            const prev = target.previousElementSibling;
            if (!prev || !prev.classList.contains('mp-col')) return;

            const rect = target.getBoundingClientRect();
            const hitZone = 8; // px from left edge
            if (e.clientX - rect.left > hitZone) return;

            e.preventDefault();
            const inner = target.parentElement;
            const innerRect = inner.getBoundingClientRect();

            const allColumns = editor.getWrapper().findType('mp-column');
            const rightComponent = allColumns.find(c => c.getEl() === target);
            const leftComponent  = allColumns.find(c => c.getEl() === prev);
            if (!rightComponent || !leftComponent) return;

            dragging = {
                rightCol: rightComponent,
                leftCol: leftComponent,
                startX: e.clientX,
                startRightPct: rightComponent.get('props').size_pct,
                startLeftPct: leftComponent.get('props').size_pct,
                parentWidth: innerRect.width,
            };

            canvasDoc.body.style.cursor = 'col-resize';
            canvasDoc.body.style.userSelect = 'none';
        });

        canvasBody.addEventListener('mousemove', (e) => {
            if (!dragging) return;
            const dxPct = ((e.clientX - dragging.startX) / dragging.parentWidth) * 100;
            const min = 8.33;
            const max = 91.67;

            const newLeft  = clamp(dragging.startLeftPct  + dxPct, min, max);
            const newRight = clamp(dragging.startRightPct - dxPct, min, max);

            dragging.leftCol.set('props',  { ...dragging.leftCol.get('props'),  size_pct: round2(newLeft) });
            dragging.rightCol.set('props', { ...dragging.rightCol.get('props'), size_pct: round2(newRight) });
        });

        const endDrag = () => {
            if (!dragging) return;
            dragging = null;
            const doc = editor.Canvas.getDocument();
            doc.body.style.cursor = '';
            doc.body.style.userSelect = '';
        };
        canvasBody.addEventListener('mouseup', endDrag);
        canvasBody.addEventListener('mouseleave', endDrag);
    });
}

function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
function round2(n) { return Math.round(n * 100) / 100; }
