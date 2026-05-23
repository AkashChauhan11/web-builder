// mp-video — YouTube / Vimeo / direct URL embed.

import { registerContentGroup } from '../style-panel/index.js';
import { presetChips } from '../controls/preset-chips.js';

const RATIO_CLASSES = ['mp-video--16-9', 'mp-video--4-3', 'mp-video--1-1', 'mp-video--21-9'];

export function registerVideo(editor) {
    editor.DomComponents.addType('mp-video', {
        isComponent: (el) => el.classList?.contains('mp-video'),
        model: {
            defaults: {
                tagName: 'div',
                name: 'Video',
                draggable: '.mp-col',
                droppable: false,
                attributes: { class: 'mp-video mp-video--16-9', 'data-mp-widget': 'video' },
                props: {
                    source: 'youtube',
                    video_id_or_url: 'dQw4w9WgXcQ',
                    autoplay: false,
                    loop: false,
                    muted: false,
                    controls: true,
                    aspect_ratio: '16-9',
                },
                components: [],
            },
            init() {
                this.on('change:props', this.handlePropsChange);
                this.handlePropsChange();
            },
            handlePropsChange() {
                const props = this.get('props') || {};

                this.removeClass(RATIO_CLASSES);
                this.addClass(`mp-video--${props.aspect_ratio || '16-9'}`);

                const el = this.getEl();
                if (!el) return;
                el.innerHTML = buildEmbed(props);
            },
            toHTML() {
                const props = this.get('props') || {};
                return `<div class="mp-video mp-video--${props.aspect_ratio || '16-9'}" data-mp-widget="video">${buildEmbed(props)}</div>`;
            },
        },
    });

    registerContentGroup('mp-video', renderContentTab);
}

function buildEmbed(props) {
    const id = parseId(props);
    const auto = props.autoplay ? 1 : 0;
    const loop = props.loop ? 1 : 0;
    const muted = props.muted ? 1 : 0;
    const ctrl = props.controls ? 1 : 0;

    if (props.source === 'youtube' && id) {
        const params = `autoplay=${auto}&loop=${loop}&mute=${muted}&controls=${ctrl}${loop ? `&playlist=${id}` : ''}`;
        return `<iframe src="https://www.youtube.com/embed/${id}?${params}" loading="lazy" frameborder="0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
    }
    if (props.source === 'vimeo' && id) {
        const params = `autoplay=${auto}&loop=${loop}&muted=${muted}&controls=${ctrl}`;
        return `<iframe src="https://player.vimeo.com/video/${id}?${params}" loading="lazy" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
    }
    if (props.source === 'url' && props.video_id_or_url) {
        const attrs = [
            props.controls ? 'controls' : '',
            props.autoplay ? 'autoplay' : '',
            props.loop ? 'loop' : '',
            props.muted ? 'muted' : '',
        ].filter(Boolean).join(' ');
        return `<video src="${escapeAttr(props.video_id_or_url)}" ${attrs}></video>`;
    }
    return '<div style="display:grid;place-items:center;background:#1e293b;color:white;height:100%">Video</div>';
}

function parseId(props) {
    const v = String(props.video_id_or_url || '').trim();
    if (!v) return '';
    if (props.source === 'youtube') {
        const m = v.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
        return m ? m[1] : v;
    }
    if (props.source === 'vimeo') {
        const m = v.match(/vimeo\.com\/(\d+)/);
        return m ? m[1] : v;
    }
    return v;
}

function renderContentTab(component) {
    const body = document.createElement('div');
    body.className = 'p-3 space-y-3 text-xs';

    const props = component.get('props') || {};

    const source = presetChips({
        options: [
            { value: 'youtube', label: 'YouTube' },
            { value: 'vimeo', label: 'Vimeo' },
            { value: 'url', label: 'Direct URL' },
        ],
        value: props.source || 'youtube',
        onChange: (v) => component.set('props', { ...component.get('props'), source: v }),
    });
    body.appendChild(labeled('Source', source.el));

    const idIn = document.createElement('input');
    idIn.type = 'text';
    idIn.className = 'w-full px-2 py-1 border border-slate-300 rounded';
    idIn.value = props.video_id_or_url || '';
    idIn.placeholder = 'YT ID, vimeo.com URL, or .mp4 URL';
    idIn.addEventListener('input', () => component.set('props', { ...component.get('props'), video_id_or_url: idIn.value }));
    body.appendChild(labeled('Video ID or URL', idIn));

    const ratio = presetChips({
        options: [
            { value: '16-9', label: '16:9' },
            { value: '4-3', label: '4:3' },
            { value: '1-1', label: '1:1' },
            { value: '21-9', label: '21:9' },
        ],
        value: props.aspect_ratio || '16-9',
        onChange: (v) => component.set('props', { ...component.get('props'), aspect_ratio: v }),
    });
    body.appendChild(labeled('Aspect ratio', ratio.el));

    ['controls', 'autoplay', 'loop', 'muted'].forEach((key) => {
        body.appendChild(checkbox(capitalize(key), !!props[key], (checked) =>
            component.set('props', { ...component.get('props'), [key]: checked })));
    });

    return body;
}

function checkbox(text, checked, onChange) {
    const lbl = document.createElement('label');
    lbl.className = 'flex items-center gap-2';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = checked;
    cb.addEventListener('change', () => onChange(cb.checked));
    lbl.appendChild(cb);
    const sp = document.createElement('span');
    sp.textContent = text;
    lbl.appendChild(sp);
    return lbl;
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

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function escapeAttr(s) { return String(s ?? '').replace(/"/g, '&quot;'); }
