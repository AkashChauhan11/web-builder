// collapsibleGroup({ title, defaultOpen, children: HTMLElement[] })

export function collapsibleGroup({ title = 'Group', defaultOpen = true, children = [] } = {}) {
    const el = document.createElement('div');
    el.className = 'border-b border-slate-200';

    const header = document.createElement('button');
    header.type = 'button';
    header.className = 'w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50';

    const titleEl = document.createElement('span');
    titleEl.textContent = title;
    header.appendChild(titleEl);

    const chevron = document.createElement('span');
    chevron.className = 'text-slate-400 transition-transform';
    chevron.textContent = '▾';
    header.appendChild(chevron);

    const body = document.createElement('div');
    body.className = 'px-3 pb-3 space-y-2';

    let isOpen = defaultOpen;
    function refresh() {
        body.style.display = isOpen ? '' : 'none';
        chevron.style.transform = isOpen ? '' : 'rotate(-90deg)';
    }
    refresh();

    header.addEventListener('click', () => { isOpen = !isOpen; refresh(); });

    children.forEach((c) => body.appendChild(c));

    el.appendChild(header);
    el.appendChild(body);

    return { el, addChild: (c) => body.appendChild(c), setOpen: (b) => { isOpen = b; refresh(); } };
}
