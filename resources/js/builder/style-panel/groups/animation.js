// Animation group — writes data-mp-animation + duration/delay vars.
// The public runtime (builder-runtime.js) adds .is-revealed via IntersectionObserver.

import { presetChips } from '../../controls/preset-chips.js';
import { numberWithUnit } from '../../controls/number-with-unit.js';
import { collapsibleGroup } from '../../controls/collapsible-group.js';

const ANIM_OPTIONS = [
    { value: 'none',       label: 'None' },
    { value: 'fade',       label: 'Fade' },
    { value: 'fade-up',    label: 'Fade Up' },
    { value: 'fade-down',  label: 'Fade Down' },
    { value: 'fade-left',  label: 'Fade Left' },
    { value: 'fade-right', label: 'Fade Right' },
    { value: 'zoom-in',    label: 'Zoom In' },
    { value: 'zoom-out',   label: 'Zoom Out' },
];

export function animationGroup(component) {
    const attrs = component.getAttributes() || {};
    const style = component.getStyle() || {};

    const current = attrs['data-mp-animation'] || 'none';
    const durRaw = String(style['--mp-anim-duration'] ?? '600ms');
    const delayRaw = String(style['--mp-anim-delay'] ?? '0ms');
    const dur = parseInt(durRaw, 10) || 600;
    const delay = parseInt(delayRaw, 10) || 0;

    const typeChips = presetChips({
        options: ANIM_OPTIONS,
        value: current,
        onChange: (v) => {
            if (v === 'none') {
                component.removeAttributes('data-mp-animation');
                component.removeStyle('--mp-anim-duration');
                component.removeStyle('--mp-anim-delay');
            } else {
                component.addAttributes({ 'data-mp-animation': v });
            }
        },
    });

    const duration = numberWithUnit({
        value: dur, unit: 'ms', units: ['ms'],
        min: 100, max: 3000, step: 50,
        onChange: ({ value }) => component.addStyle({ '--mp-anim-duration': `${value}ms` }),
    });

    const delayCtrl = numberWithUnit({
        value: delay, unit: 'ms', units: ['ms'],
        min: 0, max: 3000, step: 50,
        onChange: ({ value }) => component.addStyle({ '--mp-anim-delay': `${value}ms` }),
    });

    const body = document.createElement('div');
    body.className = 'space-y-3 text-xs';
    body.appendChild(row('Type', typeChips.el));
    body.appendChild(row('Duration', duration.el));
    body.appendChild(row('Delay', delayCtrl.el));

    return collapsibleGroup({ title: 'Animation', defaultOpen: false, children: [body] }).el;
}

function row(label, control) {
    const r = document.createElement('div');
    r.className = 'flex flex-col gap-1';
    const l = document.createElement('label');
    l.className = 'text-[10px] uppercase tracking-wide text-slate-500';
    l.textContent = label;
    r.appendChild(l);
    r.appendChild(control);
    return r;
}
