// mp-map — embedded Google Map (with API key) or fallback maps.google.com iframe.

import { registerContentGroup } from '../style-panel/index.js';
import { numberWithUnit } from '../controls/number-with-unit.js';

export function registerMap(editor) {
    editor.DomComponents.addType('mp-map', {
        isComponent: (el) => el.classList?.contains('mp-map'),
        model: {
            defaults: {
                tagName: 'div',
                name: 'Map',
                draggable: '.mp-col',
                droppable: false,
                attributes: { class: 'mp-map', 'data-mp-widget': 'map' },
                props: {
                    address: 'Empire State Building, New York',
                    zoom: 14,
                    height_px: 320,
                    api_key: '',
                },
                components: [],
            },
            init() {
                this.on('change:props', this.handlePropsChange);
                this.handlePropsChange();
            },
            handlePropsChange() {
                const props = this.get('props') || {};
                const el = this.getEl();
                if (!el) return;
                el.innerHTML = buildIframe(props);
            },
            toHTML() {
                const props = this.get('props') || {};
                return `<div class="mp-map" data-mp-widget="map" style="height:${parseInt(props.height_px, 10) || 320}px">${buildIframe(props)}</div>`;
            },
        },
    });

    registerContentGroup('mp-map', renderContentTab);
}

function buildIframe(props) {
    const address = String(props.address || '').trim();
    const zoom = Math.max(1, Math.min(20, parseInt(props.zoom, 10) || 14));
    const heightPx = parseInt(props.height_px, 10) || 320;

    if (!address) {
        return `<div style="display:grid;place-items:center;height:${heightPx}px;background:#f1f5f9;color:#64748b">Enter an address in the Content tab</div>`;
    }

    let src;
    if (props.api_key) {
        const params = new URLSearchParams({ key: props.api_key, q: address, zoom: String(zoom) });
        src = `https://www.google.com/maps/embed/v1/place?${params.toString()}`;
    } else {
        const params = new URLSearchParams({ q: address, z: String(zoom), output: 'embed' });
        src = `https://maps.google.com/maps?${params.toString()}`;
    }

    return `<iframe src="${escapeAttr(src)}" loading="lazy" allowfullscreen style="height:${heightPx}px" referrerpolicy="no-referrer-when-downgrade"></iframe>`;
}

function renderContentTab(component) {
    const body = document.createElement('div');
    body.className = 'p-3 space-y-3 text-xs';

    const props = component.get('props') || {};

    const address = document.createElement('input');
    address.type = 'text';
    address.className = 'w-full px-2 py-1 border border-slate-300 rounded';
    address.placeholder = 'Address or place name';
    address.value = props.address || '';
    address.addEventListener('input', () => component.set('props', { ...component.get('props'), address: address.value }));
    body.appendChild(labeled('Address', address));

    const zoom = numberWithUnit({
        value: props.zoom || 14, unit: '', units: [''],
        min: 1, max: 20,
        onChange: ({ value }) => component.set('props', { ...component.get('props'), zoom: value }),
    });
    body.appendChild(labeled('Zoom (1-20)', zoom.el));

    const height = numberWithUnit({
        value: props.height_px || 320, unit: 'px', units: ['px'],
        min: 100, max: 1200,
        onChange: ({ value }) => component.set('props', { ...component.get('props'), height_px: value }),
    });
    body.appendChild(labeled('Height', height.el));

    const apiKey = document.createElement('input');
    apiKey.type = 'text';
    apiKey.className = 'w-full px-2 py-1 border border-slate-300 rounded font-mono text-[11px]';
    apiKey.placeholder = 'Optional Google Maps API key';
    apiKey.value = props.api_key || '';
    apiKey.addEventListener('input', () => component.set('props', { ...component.get('props'), api_key: apiKey.value }));
    body.appendChild(labeled('API key (optional)', apiKey));

    const note = document.createElement('p');
    note.className = 'text-[10px] text-slate-500';
    note.textContent = 'Without an API key, falls back to maps.google.com embed (no analytics, no styling control).';
    body.appendChild(note);

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

function escapeAttr(s) { return String(s ?? '').replace(/"/g, '&quot;'); }
