import Coloris from '@melloware/coloris';
import '@melloware/coloris/dist/coloris.css';

let initialized = false;

export function initColoris() {
    if (initialized) return;
    initialized = true;
    Coloris.init();
    Coloris({
        themeMode: 'dark',
        theme: 'pill',
        format: 'hex',
        alpha: false,
        swatches: [
            '#0f172a', '#1e293b', '#475569', '#64748b', '#cbd5e1', '#ffffff',
            '#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#0891b2', '#2563eb', '#7c3aed', '#db2777',
        ],
    });
}

// Re-bind Coloris to any newly-added color inputs whenever GrapesJS re-renders the style panel
export function rebindColorisOnStyleChanges(editor) {
    const apply = () => {
        document.querySelectorAll('.gjs-field input[type="color"]').forEach((input) => {
            if (input.dataset.colorisBound) return;
            input.dataset.colorisBound = '1';
            input.setAttribute('data-coloris', '');
        });
    };

    editor.on('style:property:update style:target', () => window.setTimeout(apply, 50));
    editor.on('load', () => window.setTimeout(apply, 100));
}
