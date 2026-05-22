import { numberWithUnit } from '../../controls/number-with-unit.js';
import { presetChips } from '../../controls/preset-chips.js';
import { slider } from '../../controls/slider.js';
import { collapsibleGroup } from '../../controls/collapsible-group.js';

// This group only renders for mp-section and mp-column. For other types it returns an empty fragment.
export function layoutGroup(component) {
    const type = component.get('type');
    if (type === 'mp-section') return sectionLayout(component);
    if (type === 'mp-column')  return columnLayout(component);
    return document.createDocumentFragment();
}

function sectionLayout(component) {
    const props = component.get('props') || {};

    const widthChips = presetChips({
        options: [{ value: 'boxed', label: 'Boxed' }, { value: 'full', label: 'Full' }],
        value: props.width || 'boxed',
        onChange: (v) => component.set('props', { ...component.get('props'), width: v }),
    });

    const maxInner = numberWithUnit({
        value: props.max_inner_width || 1200,
        unit: 'px',
        units: ['px'],
        min: 320,
        max: 2560,
        onChange: ({ value }) => component.set('props', { ...component.get('props'), max_inner_width: value }),
    });

    const valign = presetChips({
        options: [
            { value: 'top',    label: 'Top' },
            { value: 'middle', label: 'Mid' },
            { value: 'bottom', label: 'Bot' },
        ],
        value: props.vertical_align || 'top',
        onChange: (v) => component.set('props', { ...component.get('props'), vertical_align: v }),
    });

    const heightMode = presetChips({
        options: [
            { value: 'default', label: 'Auto' },
            { value: 'fixed',   label: 'Fixed' },
            { value: 'screen',  label: 'Screen' },
        ],
        value: props.min_height_mode || 'default',
        onChange: (v) => component.set('props', { ...component.get('props'), min_height_mode: v }),
    });

    const minHeight = numberWithUnit({
        value: props.min_height || 0,
        unit: 'px',
        units: ['px', 'vh'],
        min: 0,
        max: 2000,
        onChange: ({ value }) => component.set('props', { ...component.get('props'), min_height: value }),
    });

    const body = document.createElement('div');
    body.className = 'space-y-3 text-xs';
    body.appendChild(row('Width mode', widthChips.el));
    body.appendChild(row('Max inner width', maxInner.el));
    body.appendChild(row('Vertical align', valign.el));
    body.appendChild(row('Height mode', heightMode.el));
    body.appendChild(row('Min height', minHeight.el));

    return collapsibleGroup({ title: 'Layout', defaultOpen: true, children: [body] }).el;
}

function columnLayout(component) {
    const props = component.get('props') || {};

    const sizeSlider = slider({
        min: 8.33,
        max: 100,
        step: 0.01,
        value: props.size_pct || 100,
        onChange: (v) => component.set('props', { ...component.get('props'), size_pct: v }),
    });

    const contentPos = presetChips({
        options: [
            { value: 'start',  label: 'Start' },
            { value: 'center', label: 'Center' },
            { value: 'end',    label: 'End' },
        ],
        value: props.content_position || 'start',
        onChange: (v) => component.set('props', { ...component.get('props'), content_position: v }),
    });

    const valign = presetChips({
        options: [
            { value: 'top',    label: 'Top' },
            { value: 'middle', label: 'Mid' },
            { value: 'bottom', label: 'Bot' },
        ],
        value: props.vertical_align || 'top',
        onChange: (v) => component.set('props', { ...component.get('props'), vertical_align: v }),
    });

    const body = document.createElement('div');
    body.className = 'space-y-3 text-xs';
    body.appendChild(row('Width %', sizeSlider.el));
    body.appendChild(row('Content position', contentPos.el));
    body.appendChild(row('Vertical align', valign.el));

    return collapsibleGroup({ title: 'Layout', defaultOpen: true, children: [body] }).el;
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
