import { colorPicker } from '../../controls/color-picker.js';
import { presetChips } from '../../controls/preset-chips.js';
import { collapsibleGroup } from '../../controls/collapsible-group.js';
import { slider } from '../../controls/slider.js';

const BG_TYPES = [
    { value: 'none',     label: 'None' },
    { value: 'color',    label: 'Color' },
    { value: 'gradient', label: 'Gradient' },
    { value: 'image',    label: 'Image' },
];

export function backgroundGroup(component, editor) {
    const style = component.getStyle();

    const typeChips = presetChips({
        options: BG_TYPES,
        value: detectBgType(style),
        onChange: (v) => { applyBgType(component, v); rerenderBody(); },
    });

    const body = document.createElement('div');
    body.className = 'space-y-3 text-xs';

    const dynamicArea = document.createElement('div');
    dynamicArea.className = 'space-y-3';

    body.appendChild(row('Type', typeChips.el));
    body.appendChild(dynamicArea);

    function rerenderBody() {
        dynamicArea.innerHTML = '';
        const type = typeChips.get();
        if (type === 'color') {
            const c = colorPicker({
                value: style['background-color'] || '#ffffff',
                onChange: (v) => component.addStyle({ 'background-color': v, 'background-image': '' }),
            });
            dynamicArea.appendChild(row('Color', c.el));
        } else if (type === 'gradient') {
            const stop1 = colorPicker({
                value: '#3b82f6',
                onChange: () => updateGradient(),
            });
            const stop2 = colorPicker({
                value: '#1e293b',
                onChange: () => updateGradient(),
            });
            const angle = slider({
                min: 0, max: 360, step: 5, value: 135,
                onChange: () => updateGradient(),
            });
            dynamicArea.appendChild(row('Stop 1', stop1.el));
            dynamicArea.appendChild(row('Stop 2', stop2.el));
            dynamicArea.appendChild(row('Angle', angle.el));
            function updateGradient() {
                const grad = `linear-gradient(${angle.get()}deg, ${stop1.get()}, ${stop2.get()})`;
                component.addStyle({ 'background-image': grad, 'background-color': '' });
            }
            updateGradient();
        } else if (type === 'image') {
            const srcRow = document.createElement('div');
            srcRow.className = 'flex gap-2';

            const url = document.createElement('input');
            url.type = 'text';
            url.placeholder = '/storage/builder-assets/...';
            url.className = 'flex-1 min-w-0 px-2 py-1 text-xs border border-slate-300 rounded';
            url.value = extractImageUrl(style['background-image']) || '';
            const applyUrl = (v) => component.addStyle({ 'background-image': v ? `url(${v})` : '' });
            url.addEventListener('input', () => applyUrl(url.value));
            srcRow.appendChild(url);

            const pickBtn = document.createElement('button');
            pickBtn.type = 'button';
            pickBtn.className = 'px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded';
            pickBtn.textContent = 'Pick';
            pickBtn.addEventListener('click', () => {
                if (!editor?.AssetManager) return;
                editor.AssetManager.open({
                    select: (asset) => {
                        const src = asset.getSrc();
                        url.value = src;
                        applyUrl(src);
                        editor.AssetManager.close();
                    },
                });
            });
            srcRow.appendChild(pickBtn);

            dynamicArea.appendChild(row('Image', srcRow));

            const size = presetChips({
                options: [
                    { value: 'cover', label: 'Cover' },
                    { value: 'contain', label: 'Contain' },
                    { value: 'auto', label: 'Auto' },
                ],
                value: style['background-size'] || 'cover',
                onChange: (v) => component.addStyle({ 'background-size': v }),
            });
            dynamicArea.appendChild(row('Size', size.el));

            const repeat = presetChips({
                options: [
                    { value: 'no-repeat', label: 'No' },
                    { value: 'repeat',    label: 'Tile' },
                    { value: 'repeat-x',  label: 'X' },
                    { value: 'repeat-y',  label: 'Y' },
                ],
                value: style['background-repeat'] || 'no-repeat',
                onChange: (v) => component.addStyle({ 'background-repeat': v }),
            });
            dynamicArea.appendChild(row('Repeat', repeat.el));
        } else {
            component.addStyle({ 'background-color': '', 'background-image': '' });
        }
    }
    rerenderBody();

    return collapsibleGroup({ title: 'Background', defaultOpen: false, children: [body] }).el;
}

function row(label, control) {
    const r = document.createElement('div');
    r.className = 'flex flex-col gap-1';
    const lbl = document.createElement('label');
    lbl.className = 'text-[10px] uppercase tracking-wide text-slate-500';
    lbl.textContent = label;
    r.appendChild(lbl);
    r.appendChild(control);
    return r;
}

function detectBgType(style) {
    if (!style['background-color'] && !style['background-image']) return 'none';
    if (style['background-image']?.startsWith('linear-gradient')) return 'gradient';
    if (style['background-image']?.startsWith('url(')) return 'image';
    if (style['background-color']) return 'color';
    return 'none';
}

function applyBgType(component, type) {
    if (type === 'none') {
        component.addStyle({ 'background-color': '', 'background-image': '' });
    }
}

function extractImageUrl(bgImage) {
    if (!bgImage || typeof bgImage !== 'string') return null;
    const match = bgImage.match(/url\(\s*['"]?([^'")]+)['"]?\s*\)/);
    return match ? match[1] : null;
}
