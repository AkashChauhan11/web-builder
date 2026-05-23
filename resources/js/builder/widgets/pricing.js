// mp-pricing — plan card with name, price, period, features list, and CTA button.

import { registerContentGroup } from '../style-panel/index.js';

export function registerPricing(editor) {
    editor.DomComponents.addType('mp-pricing', {
        isComponent: (el) => el.classList?.contains('mp-pricing'),
        model: {
            defaults: {
                tagName: 'div',
                name: 'Pricing',
                draggable: '.mp-col',
                droppable: false,
                attributes: { class: 'mp-pricing', 'data-mp-widget': 'pricing' },
                props: {
                    currency_symbol: '$',
                    period_label: '/month',
                    highlighted: false,
                    button: { url: '/get-started', label: 'Get started', target: '_self' },
                    features: [
                        { text: '10 projects', included: true },
                        { text: 'Email support', included: true },
                        { text: 'Phone support', included: false },
                    ],
                },
                components: [
                    {
                        tagName: 'h3',
                        attributes: { class: 'mp-pricing__name' },
                        components: 'Pro',
                        editable: true, rte_profile: 'heading',
                        draggable: false, droppable: false,
                    },
                    {
                        tagName: 'div',
                        attributes: { class: 'mp-pricing__price-row' },
                        selectable: false, draggable: false, droppable: false,
                        components: [
                            { tagName: 'span', attributes: { class: 'mp-pricing__currency' }, components: '$', selectable: false, draggable: false, droppable: false },
                            {
                                tagName: 'span',
                                attributes: { class: 'mp-pricing__price' },
                                components: '29',
                                editable: true, rte_profile: 'inline',
                                draggable: false, droppable: false,
                            },
                            { tagName: 'span', attributes: { class: 'mp-pricing__period' }, components: '/month', selectable: false, draggable: false, droppable: false },
                        ],
                    },
                    {
                        tagName: 'ul',
                        attributes: { class: 'mp-pricing__features' },
                        selectable: false, draggable: false, droppable: false,
                        components: [],
                    },
                    {
                        tagName: 'a',
                        attributes: { class: 'mp-btn mp-btn--lg mp-btn--full', href: '/get-started' },
                        components: 'Get started',
                        editable: true, rte_profile: 'button',
                        draggable: false, droppable: false,
                    },
                ],
            },
            init() {
                this.on('change:props', this.handlePropsChange);
                this.handlePropsChange();
            },
            handlePropsChange() {
                const props = this.get('props') || {};

                if (props.highlighted) this.addClass('mp-pricing--featured');
                else this.removeClass('mp-pricing--featured');

                const el = this.getEl();
                if (!el) return;

                const cur = el.querySelector('.mp-pricing__currency');
                if (cur) cur.textContent = props.currency_symbol || '$';

                const per = el.querySelector('.mp-pricing__period');
                if (per) per.textContent = props.period_label || '/month';

                const list = el.querySelector('.mp-pricing__features');
                if (list) {
                    list.innerHTML = (props.features || []).map((f) =>
                        `<li data-included="${f.included ? '1' : '0'}">${escapeText(f.text)}</li>`
                    ).join('');
                }

                const btn = el.querySelector('.mp-btn');
                if (btn && props.button) {
                    btn.setAttribute('href', props.button.url || '#');
                    if (props.button.target) btn.setAttribute('target', props.button.target);
                    btn.textContent = props.button.label || 'Get started';
                }
            },
        },
    });

    registerContentGroup('mp-pricing', renderContentTab);
}

function renderContentTab(component) {
    const body = document.createElement('div');
    body.className = 'p-3 space-y-3 text-xs';

    const props = component.get('props') || {};

    body.appendChild(labeled('Currency symbol', textInput(props.currency_symbol || '$', (v) =>
        component.set('props', { ...component.get('props'), currency_symbol: v }))));

    body.appendChild(labeled('Period label', textInput(props.period_label || '/month', (v) =>
        component.set('props', { ...component.get('props'), period_label: v }))));

    body.appendChild(checkbox('Highlighted (featured plan)', !!props.highlighted, (c) =>
        component.set('props', { ...component.get('props'), highlighted: c })));

    body.appendChild(labeled('Button URL', textInput(props.button?.url || '', (v) =>
        component.set('props', { ...component.get('props'), button: { ...(component.get('props')?.button || {}), url: v } }))));

    body.appendChild(labeled('Button label', textInput(props.button?.label || '', (v) =>
        component.set('props', { ...component.get('props'), button: { ...(component.get('props')?.button || {}), label: v } }))));

    const listLabel = document.createElement('label');
    listLabel.className = 'text-[10px] uppercase tracking-wide text-slate-500 pt-2 block';
    listLabel.textContent = 'Features';
    body.appendChild(listLabel);

    const list = document.createElement('div');
    list.className = 'space-y-2';
    body.appendChild(list);

    function renderList() {
        list.innerHTML = '';
        const features = component.get('props')?.features || [];
        features.forEach((f, idx) => {
            const row = document.createElement('div');
            row.className = 'flex gap-2 items-center';

            const inc = document.createElement('input');
            inc.type = 'checkbox';
            inc.checked = !!f.included;
            inc.addEventListener('change', () => update(idx, { included: inc.checked }));
            row.appendChild(inc);

            const txt = document.createElement('input');
            txt.type = 'text';
            txt.className = 'flex-1 min-w-0 px-2 py-1 text-xs border border-slate-300 rounded';
            txt.value = f.text || '';
            txt.addEventListener('input', () => update(idx, { text: txt.value }));
            row.appendChild(txt);

            const del = document.createElement('button');
            del.type = 'button';
            del.className = 'px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded';
            del.textContent = '×';
            del.addEventListener('click', () => remove(idx));
            row.appendChild(del);

            list.appendChild(row);
        });

        const add = document.createElement('button');
        add.type = 'button';
        add.className = 'w-full px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded';
        add.textContent = '+ Add feature';
        add.addEventListener('click', () => {
            const features = [...(component.get('props')?.features || []), { text: 'New feature', included: true }];
            component.set('props', { ...component.get('props'), features });
            renderList();
        });
        list.appendChild(add);
    }

    function update(idx, patch) {
        const features = [...(component.get('props')?.features || [])];
        features[idx] = { ...features[idx], ...patch };
        component.set('props', { ...component.get('props'), features });
        renderList();
    }
    function remove(idx) {
        const features = [...(component.get('props')?.features || [])];
        features.splice(idx, 1);
        component.set('props', { ...component.get('props'), features });
        renderList();
    }

    renderList();
    return body;
}

function textInput(value, onChange) {
    const i = document.createElement('input');
    i.type = 'text';
    i.value = value;
    i.className = 'w-full px-2 py-1 border border-slate-300 rounded';
    i.addEventListener('input', () => onChange(i.value));
    return i;
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

function escapeText(s) { return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
