// Motion group — parallax (bg-attachment) + sticky positioning.

import { numberWithUnit } from '../../controls/number-with-unit.js';
import { collapsibleGroup } from '../../controls/collapsible-group.js';

export function motionGroup(component) {
    const style = component.getStyle() || {};
    const isParallax = style['background-attachment'] === 'fixed';
    const isSticky = style['position'] === 'sticky';
    const stickyTop = parseInt(style['top'], 10) || 0;

    const body = document.createElement('div');
    body.className = 'space-y-3 text-xs';

    // Parallax checkbox
    const parallaxLabel = document.createElement('label');
    parallaxLabel.className = 'flex items-center gap-2';
    const parallaxCb = document.createElement('input');
    parallaxCb.type = 'checkbox';
    parallaxCb.checked = isParallax;
    parallaxCb.addEventListener('change', () => {
        if (parallaxCb.checked) {
            component.addStyle({ 'background-attachment': 'fixed' });
        } else {
            component.removeStyle('background-attachment');
        }
    });
    parallaxLabel.appendChild(parallaxCb);
    const parallaxSpan = document.createElement('span');
    parallaxSpan.textContent = 'Parallax (fixed background on scroll)';
    parallaxLabel.appendChild(parallaxSpan);
    body.appendChild(parallaxLabel);

    // Sticky toggle
    const stickyLabel = document.createElement('label');
    stickyLabel.className = 'flex items-center gap-2';
    const stickyCb = document.createElement('input');
    stickyCb.type = 'checkbox';
    stickyCb.checked = isSticky;
    stickyCb.addEventListener('change', () => {
        if (stickyCb.checked) {
            component.addStyle({ position: 'sticky', top: '0px' });
            stickyTopWrap.style.display = '';
        } else {
            component.removeStyle('position');
            component.removeStyle('top');
            stickyTopWrap.style.display = 'none';
        }
    });
    stickyLabel.appendChild(stickyCb);
    const stickySpan = document.createElement('span');
    stickySpan.textContent = 'Sticky on scroll';
    stickyLabel.appendChild(stickySpan);
    body.appendChild(stickyLabel);

    // Sticky top offset
    const stickyTopCtrl = numberWithUnit({
        value: stickyTop, unit: 'px', units: ['px'],
        min: 0, max: 500,
        onChange: ({ value }) => component.addStyle({ top: `${value}px` }),
    });
    const stickyTopWrap = document.createElement('div');
    stickyTopWrap.className = 'flex flex-col gap-1';
    stickyTopWrap.style.display = isSticky ? '' : 'none';
    const stickyTopLabel = document.createElement('label');
    stickyTopLabel.className = 'text-[10px] uppercase tracking-wide text-slate-500';
    stickyTopLabel.textContent = 'Sticky offset top';
    stickyTopWrap.appendChild(stickyTopLabel);
    stickyTopWrap.appendChild(stickyTopCtrl.el);
    body.appendChild(stickyTopWrap);

    return collapsibleGroup({ title: 'Motion', defaultOpen: false, children: [body] }).el;
}
