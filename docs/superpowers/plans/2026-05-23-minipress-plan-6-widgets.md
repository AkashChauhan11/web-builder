# MiniPress Plan 6: Elementor Phase A — Widgets, RTE, Templates

> **For agentic workers:** Use superpowers:subagent-driven-development OR direct implementation (per project preference). Steps use checkbox (`- [ ]`) syntax. **Git note:** User handles git themselves — do NOT run `git add` or `git commit`. Stop after each task's checks pass so the user can stage.

**Goal:** Populate the Elementor Phase A editor with the 20 widget catalogue, the custom RTE floating toolbar (so click-and-type works on every text-bearing widget), and the 4 starter Section templates that replace the legacy raw-HTML blocks. After Plan 6, an editor user can: drop any of the 20 widgets into a column, edit text inline, configure widget-specific props via the right panel's Content tab, and style them via the existing Style tab from Plan 5.

**Architecture:**
- All widgets live in `resources/js/builder/widgets/{name}.js`. Each exports `register(editor)` which calls `editor.DomComponents.addType('mp-{name}', { ... })` AND `registerContentGroup('mp-{name}', renderContentTab)` from the style panel.
- A central `resources/js/builder/widgets/index.js` imports all 20 widget modules and exposes a single `registerAllWidgets(editor)` function called from `builder.js`.
- The RTE lives in `resources/js/builder/rte/` — three small modules: `toolbar.js` (floating bar UI), `link-popover.js` (URL/target/rel editor), `paste-filter.js` (strips non-allowed tags from clipboard).
- The Lucide icon sprite at `resources/js/builder/icons/lucide-sprite.js` is a curated 30-icon SVG sprite. Each widget that needs icons imports a tiny helper (`renderIcon(name)`) that returns an inline `<svg>` string.
- Each widget that uses inline editing flags specific child component types as `editable: true` (GrapesJS's built-in RTE applies our custom toolbar through the editor's RTE config).
- 4 starter Section templates live in `resources/js/builder/templates/` — JSON-tree snippets the user drops via a "Templates" tab in the section picker (Task 14).
- The legacy `resources/js/builder/blocks.js` is deleted in Task 14.

**Tech stack additions:**
- `embla-carousel` (~5kb gzipped) — used by `mp-carousel`
- `lucide` (build-time only — we tree-shake icons at build into the inline sprite)

**Effort estimate:** ~5 weeks (15 tasks, 1-3 days each).

---

## Scope of Plan 6

Implements **spec sections:** Widget catalog, Inline editing UX, Starter Section templates.

**Out of scope (Plan 7):**
- `builder-runtime.js` — public-page interactive runtime (carousel init, accordion handlers, counter animation, etc.)
- `PlaceholderPagesSeeder` rewrite
- Snapshot tests
- Final smoke checklist + Lighthouse

The interactive widget behaviors (accordion expand, carousel swipe, counter animation, gallery lightbox) are scaffolded in the widget HTML output (data attributes, class hooks) but the actual JavaScript that wires them up on PUBLIC pages comes in Plan 7. Inside the editor canvas they're static.

---

## What Plan 5 Already Did

These are dependencies we rely on:

- `builder-runtime.css` ships base structural CSS for `.mp-sec`, `.mp-col`, etc. (Plan 5 Task 1). Plan 6 extends it with widget-specific base classes (`.mp-btn`, `.mp-card`, `.mp-accordion`, `.mp-tabs`, etc.) but keeps the same "structural-only" discipline.
- `mp-section` and `mp-column` GrapesJS component types are registered. Widgets drop into `.mp-col`.
- The custom style panel mounts on `#mp-style-panel`, fires `component:select` listener via `editor.getSelected()`, and exposes `registerContentGroup(type, renderer)`, `registerStyleGroup(renderer)`, `registerAdvancedGroup(renderer)` from `resources/js/builder/style-panel/index.js`.
- The 6 reusable control primitives (`numberWithUnit`, `fourSideInput`, `colorPicker`, `presetChips`, `slider`, `collapsibleGroup`) are available at `resources/js/builder/controls/*`.
- `WidgetRegistry::ALLOWED_TYPES` (PHP) already pre-enumerates all 20 widget types. The server-side validator accepts them.
- The build pipeline (Vite + Tailwind v4) is wired and the canvas iframe loads compiled `app.css` (which includes runtime + Tailwind).

---

## File Map for Plan 6

### Created (JS)

**RTE (Task 1):**
- `resources/js/builder/rte/toolbar.js`
- `resources/js/builder/rte/link-popover.js`
- `resources/js/builder/rte/paste-filter.js`

**Icons (Task 2):**
- `resources/js/builder/icons/lucide-sprite.js`

**Widgets (Tasks 3-13) — 20 files:**
- `resources/js/builder/widgets/index.js` (registers all 20)
- `resources/js/builder/widgets/heading.js`
- `resources/js/builder/widgets/text.js`
- `resources/js/builder/widgets/button.js`
- `resources/js/builder/widgets/icon.js`
- `resources/js/builder/widgets/icon-box.js`
- `resources/js/builder/widgets/divider.js`
- `resources/js/builder/widgets/spacer.js`
- `resources/js/builder/widgets/html.js`
- `resources/js/builder/widgets/alert.js`
- `resources/js/builder/widgets/image.js`
- `resources/js/builder/widgets/gallery.js`
- `resources/js/builder/widgets/video.js`
- `resources/js/builder/widgets/social.js`
- `resources/js/builder/widgets/progress.js`
- `resources/js/builder/widgets/counter.js`
- `resources/js/builder/widgets/accordion.js`
- `resources/js/builder/widgets/tabs.js`
- `resources/js/builder/widgets/carousel.js`
- `resources/js/builder/widgets/testimonial.js`
- `resources/js/builder/widgets/pricing.js`

**Templates (Task 14):**
- `resources/js/builder/templates/index.js`
- `resources/js/builder/templates/hero.js`
- `resources/js/builder/templates/two-column.js`
- `resources/js/builder/templates/cta-banner.js`
- `resources/js/builder/templates/feature-grid.js`

### Modified
- `resources/js/builder.js` — register RTE config, import widgets/index.js + templates/index.js
- `resources/js/builder/sections/section-picker.js` — add "Templates" tab alongside "Structures"
- `resources/css/builder-runtime.css` — extend with widget base classes (`.mp-btn`, `.mp-card`, `.mp-accordion`, etc.)
- `package.json` — add `embla-carousel` + `lucide` (build-time)
- `vite.config.js` — no change expected; widgets are bundled into existing `builder.js` entry

### Deleted
- `resources/js/builder/blocks.js` (Task 14)

### Untouched (per spec — handed off to Plan 7)
- `database/seeders/PlaceholderPagesSeeder.php` — Plan 7
- `resources/js/builder-runtime.js` — Plan 7 (new file)
- All Pest test files — Plan 7 adds snapshot tests; Plan 6 adds zero tests (the editor JS is hard to TDD and the public-page tests come in Plan 7 once the runtime exists)

---

## Conventions for This Plan

- **No git commits from subagents.** User stages.
- **No new tests.** Plan 6 is pure feature implementation. Plan 7 adds the snapshot tests + final smoke.
- **JS:** plain ES modules. Each widget file ~50-150 lines. Long widgets (pricing, accordion) may reach 200.
- **Custom Component Type pattern** (corrected from Plan 5 Task 3 review): use surgical `addClass`/`removeClass`/`addAttributes`/`removeAttributes` in `handlePropsChange`, use `removeStyle(prop)` to clear (not `addStyle({prop: ''})`), and call `this.handlePropsChange()` once at the end of `init()` so derived attrs/styles sync on JSON load.
- **Inline editing pattern:** mark text-bearing child components with `editable: true` and `name: 'Title'` (or similar). The RTE config (set up in Task 1) constrains which buttons appear per-region via the editor's `rte` setup.
- **Content tab renderer signature:** `(component, editor) => HTMLElement`. Uses the existing control primitives. Calls `component.set('props', { ...current, key: value })` to update props.
- **No public-page JS in this plan.** Each widget's `toHTML()` outputs static markup with `data-mp-widget="{type}"` and other data attributes that Plan 7's `builder-runtime.js` will hook into.
- **Each widget file follows the same skeleton:**

```js
// resources/js/builder/widgets/{name}.js
import { registerContentGroup } from '../style-panel/index.js';
// + control primitive imports as needed

export function registerHeading(editor) {  // exported name is `register{Name}` PascalCase
    editor.DomComponents.addType('mp-{name}', {
        isComponent: (el) => /* match condition */,
        model: {
            defaults: { /* tagName, name, draggable, droppable, attributes, props, components */ },
            init() { /* on('change:props'); this.handlePropsChange(); */ },
            handlePropsChange() { /* surgical attrs + addStyle */ },
            toHTML() { /* optional override — default works for most */ },
        },
        view: { /* usually empty */ },
    });

    registerContentGroup('mp-{name}', renderContentTab);
}

function renderContentTab(component, editor) {
    // Form fields for widget props using control primitives
}
```

---

## Task 1: Custom RTE foundation

**Files:**
- Create: `resources/js/builder/rte/toolbar.js`
- Create: `resources/js/builder/rte/link-popover.js`
- Create: `resources/js/builder/rte/paste-filter.js`
- Modify: `resources/js/builder.js` — add RTE config to `grapesjs.init({...})` AND import + wire the 3 RTE modules

The plan is to replace GrapesJS's default RTE actions list (`rte: { actions: ['bold', 'italic', ...] }` config). GrapesJS exposes each action as an `{ name, icon, attributes, result }` object. Each "action" gets a button in the floating toolbar (which GrapesJS renders automatically — we customize its CSS via Tailwind classes injected into the canvas iframe).

- [ ] **Step 1: `paste-filter.js` — strip non-allowed tags on paste**

The default RTE accepts pasted HTML wholesale. We constrain via a `paste` event listener that runs `DOMParser` on `e.clipboardData.getData('text/html')`, removes everything except `b/i/u/s/a/ul/ol/li/blockquote/code/br/p/h2/h3/h4`, and inserts the cleaned HTML via `document.execCommand('insertHTML', ...)`.

```js
// paste-filter.js
const ALLOWED = new Set(['B','I','U','S','A','UL','OL','LI','BLOCKQUOTE','CODE','BR','P','H2','H3','H4','SPAN','STRONG','EM']);
const ALLOWED_ATTR = { A: ['href','target','rel'] };

export function attachPasteFilter(canvasDoc) {
    canvasDoc.addEventListener('paste', (e) => {
        const target = canvasDoc.activeElement;
        if (!target?.isContentEditable) return;
        const html = e.clipboardData?.getData('text/html');
        const text = e.clipboardData?.getData('text/plain');
        e.preventDefault();
        if (html) {
            const clean = sanitize(html);
            canvasDoc.execCommand('insertHTML', false, clean);
        } else if (text) {
            canvasDoc.execCommand('insertText', false, text);
        }
    });
}

function sanitize(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    walk(doc.body);
    return doc.body.innerHTML;
}

function walk(node) {
    for (const child of Array.from(node.children)) {
        if (!ALLOWED.has(child.tagName)) {
            // Unwrap: replace with its children
            while (child.firstChild) child.parentNode.insertBefore(child.firstChild, child);
            child.remove();
            continue;
        }
        // Strip disallowed attributes
        const allowedAttrs = ALLOWED_ATTR[child.tagName] || [];
        for (const attr of Array.from(child.attributes)) {
            if (!allowedAttrs.includes(attr.name)) child.removeAttribute(attr.name);
        }
        walk(child);
    }
}
```

- [ ] **Step 2: `link-popover.js` — anchor URL/target/rel editor**

A small popover that opens when the user clicks the "link" button in the RTE toolbar (or clicks an existing `<a>` inside an editable region). Reuses the Plan 4 popover pattern (anchored via `getBoundingClientRect`, closes on outside-click / Escape).

```js
// link-popover.js
let activePopover = null;

export function openLinkPopover({ anchorEl, current = {}, onApply, onUnlink }) {
    closeLinkPopover();

    const pop = document.createElement('div');
    pop.id = 'mp-link-popover';
    pop.className = 'mp-link-pop absolute z-[60] bg-white border border-slate-200 rounded-md shadow-xl p-3 text-xs';
    pop.style.minWidth = '280px';

    pop.innerHTML = `
        <div class="space-y-2">
            <div>
                <label class="block text-[10px] uppercase tracking-wide text-slate-500 mb-1">URL</label>
                <input type="url" name="url" class="w-full px-2 py-1 border border-slate-300 rounded" value="${escapeAttr(current.url)}" placeholder="https:// or /relative">
            </div>
            <div>
                <label class="block text-[10px] uppercase tracking-wide text-slate-500 mb-1">Target</label>
                <select name="target" class="w-full px-2 py-1 border border-slate-300 rounded">
                    <option value="_self" ${current.target === '_self' ? 'selected' : ''}>Same window</option>
                    <option value="_blank" ${current.target === '_blank' ? 'selected' : ''}>New tab</option>
                </select>
            </div>
            <label class="flex items-center gap-2">
                <input type="checkbox" name="nofollow" ${(current.rel || '').includes('nofollow') ? 'checked' : ''}>
                <span>Add rel="nofollow"</span>
            </label>
            <div class="flex justify-between pt-1">
                <button type="button" data-act="unlink" class="text-red-600 hover:underline">Remove link</button>
                <div class="flex gap-2">
                    <button type="button" data-act="cancel" class="px-2 py-1">Cancel</button>
                    <button type="button" data-act="apply" class="bg-blue-600 text-white px-3 py-1 rounded">Apply</button>
                </div>
            </div>
        </div>`;

    document.body.appendChild(pop);
    activePopover = pop;
    const rect = anchorEl.getBoundingClientRect();
    pop.style.top = `${rect.bottom + window.scrollY + 4}px`;
    pop.style.left = `${rect.left + window.scrollX}px`;

    pop.addEventListener('click', (e) => {
        const act = e.target.closest('[data-act]')?.dataset.act;
        if (act === 'apply') {
            onApply?.({
                url: pop.querySelector('[name=url]').value,
                target: pop.querySelector('[name=target]').value,
                rel: pop.querySelector('[name=nofollow]').checked ? 'nofollow' : null,
            });
            closeLinkPopover();
        } else if (act === 'cancel') closeLinkPopover();
        else if (act === 'unlink') { onUnlink?.(); closeLinkPopover(); }
    });

    setTimeout(() => {
        document.addEventListener('mousedown', closeOnOutside, true);
        document.addEventListener('keydown', closeOnEscape, true);
    }, 0);
}

function closeOnOutside(e) {
    if (!activePopover) return;
    if (activePopover.contains(e.target)) return;
    closeLinkPopover();
}
function closeOnEscape(e) { if (e.key === 'Escape') closeLinkPopover(); }

export function closeLinkPopover() {
    if (!activePopover) return;
    document.removeEventListener('mousedown', closeOnOutside, true);
    document.removeEventListener('keydown', closeOnEscape, true);
    activePopover.remove();
    activePopover = null;
}

function escapeAttr(s) { return String(s ?? '').replace(/"/g, '&quot;'); }
```

- [ ] **Step 3: `toolbar.js` — RTE action factory**

GrapesJS's RTE is configured via `editor.RichTextEditor.add(name, actionDef)`. We provide custom action definitions for: `bold`, `italic`, `underline`, `strikethrough`, `link`, `h2`, `h3`, `h4`, `ul`, `ol`, `blockquote`, `code`, `clear`.

Each action has `{ name, icon, attributes, result(rte) }`. The `result` function manipulates the selection via `document.execCommand` or `rte.exec(command)`.

```js
// toolbar.js
import { openLinkPopover, closeLinkPopover } from './link-popover.js';

export function configureRTE(editor) {
    const rte = editor.RichTextEditor;

    // Remove default actions we don't want, then add our own
    ['bold','italic','underline','strikethrough','link'].forEach(n => { try { rte.remove(n); } catch {} });

    rte.add('bold',          { icon: '<b>B</b>',   attributes: { title: 'Bold (Ctrl+B)' },          result: r => r.exec('bold') });
    rte.add('italic',        { icon: '<i>I</i>',   attributes: { title: 'Italic (Ctrl+I)' },        result: r => r.exec('italic') });
    rte.add('underline',     { icon: '<u>U</u>',   attributes: { title: 'Underline (Ctrl+U)' },     result: r => r.exec('underline') });
    rte.add('strikethrough', { icon: '<s>S</s>',   attributes: { title: 'Strikethrough' },          result: r => r.exec('strikeThrough') });
    rte.add('h2', { icon: 'H2', attributes: { title: 'Heading 2' }, result: r => r.exec('formatBlock', '<h2>') });
    rte.add('h3', { icon: 'H3', attributes: { title: 'Heading 3' }, result: r => r.exec('formatBlock', '<h3>') });
    rte.add('h4', { icon: 'H4', attributes: { title: 'Heading 4' }, result: r => r.exec('formatBlock', '<h4>') });
    rte.add('ul', { icon: '&bull;', attributes: { title: 'Bulleted list' }, result: r => r.exec('insertUnorderedList') });
    rte.add('ol', { icon: '1.', attributes: { title: 'Numbered list' }, result: r => r.exec('insertOrderedList') });
    rte.add('blockquote', { icon: '&ldquo;', attributes: { title: 'Blockquote' }, result: r => r.exec('formatBlock', '<blockquote>') });
    rte.add('code', { icon: '&lt;/&gt;', attributes: { title: 'Inline code' }, result: r => r.exec('formatBlock', '<code>') });
    rte.add('clear', { icon: '&times;', attributes: { title: 'Clear formatting' }, result: r => r.exec('removeFormat') });

    rte.add('link', {
        icon: '🔗',
        attributes: { title: 'Link' },
        result: (r) => {
            const sel = r.selection();
            const anchor = sel?.focusNode?.parentElement?.closest?.('a');
            const button = r.editor.RichTextEditor.el.querySelector('[data-action=link]') || document.body;
            openLinkPopover({
                anchorEl: button,
                current: anchor ? { url: anchor.href, target: anchor.target, rel: anchor.rel } : {},
                onApply: ({ url, target, rel }) => {
                    if (!url) return;
                    r.exec('createLink', url);
                    // Apply target/rel to the just-created anchor
                    const newAnchor = r.selection().focusNode?.parentElement?.closest('a');
                    if (newAnchor) {
                        if (target) newAnchor.target = target;
                        if (rel) newAnchor.rel = rel;
                    }
                },
                onUnlink: () => r.exec('unlink'),
            });
        },
    });

    // Style the RTE toolbar via CSS injected into the canvas iframe (Plan 5 runtime CSS extension in Task 1 includes these rules)
}

// Per-widget allowed-actions filter — heading uses minimal set, text-editor uses full set, button label even smaller
export const RTE_PROFILES = {
    heading:  ['bold', 'italic', 'link', 'clear'],
    button:   ['bold', 'italic'],
    text:     ['bold','italic','underline','strikethrough','link','h2','h3','h4','ul','ol','blockquote','code','clear'],
    inline:   ['bold','italic','link','clear'],  // for testimonial quote, alert body, etc.
};
```

GrapesJS doesn't natively support per-component RTE action filtering, but we can implement it by listening to `rte:enable` and showing/hiding buttons by `data-action`:

```js
// Add after the action registrations:
editor.on('rte:enable', (view) => {
    const profile = view?.model?.get('rte_profile') || 'text';
    const allowed = new Set(RTE_PROFILES[profile] || RTE_PROFILES.text);
    document.querySelectorAll('.gjs-rte-actionbar [data-action]').forEach((btn) => {
        btn.style.display = allowed.has(btn.dataset.action) ? '' : 'none';
    });
});
```

Each widget that uses RTE sets `rte_profile: 'heading'` (or `button`, `text`, `inline`) on its editable child component.

- [ ] **Step 4: Wire RTE config in `builder.js`**

```js
import { configureRTE } from './builder/rte/toolbar.js';
import { attachPasteFilter } from './builder/rte/paste-filter.js';

// ... after grapesjs.init returns the editor:
configureRTE(editor);
editor.on('load', () => {
    attachPasteFilter(editor.Canvas.getDocument());
});
```

- [ ] **Step 5: Extend `builder-runtime.css` with RTE toolbar styling**

Add to `resources/css/builder-runtime.css`:

```css
/* RTE floating toolbar — restyle GrapesJS default to match the rest of the panel */
.gjs-rte-actionbar {
    background: white !important;
    border: 1px solid rgb(226 232 240) !important;
    border-radius: 6px !important;
    box-shadow: 0 4px 12px rgba(15,23,42,.12) !important;
    padding: 2px !important;
    gap: 0 !important;
}
.gjs-rte-action {
    color: rgb(51 65 85) !important;
    border-radius: 4px !important;
    min-width: 28px !important;
    height: 28px !important;
    padding: 0 6px !important;
    font-size: 12px !important;
    background: transparent !important;
}
.gjs-rte-action:hover { background: rgb(241 245 249) !important; }
.gjs-rte-active { background: rgb(59 130 246) !important; color: white !important; }
```

**Stop here. The user will stage/commit.**

---

## Task 2: Lucide icon sprite

**Files:**
- Create: `resources/js/builder/icons/lucide-sprite.js`
- Modify: `package.json` — add `lucide` as a devDependency

We bundle ~30 curated Lucide icons inline as an SVG sprite. Each icon is a small string template returning an `<svg>` element. The sprite module exports `renderIcon(name, attrs)` used by Icon, Icon Box, Social, Alert, and the Button icon prop.

- [ ] **Step 1: Install Lucide**

```bash
npm install --save-dev lucide
```

- [ ] **Step 2: Curated icon list (30)**

Pick a sensible default set. Lucide names:
- Arrows: `arrow-right`, `arrow-left`, `arrow-up`, `arrow-down`, `chevron-right`, `chevron-left`, `chevron-up`, `chevron-down`
- UI: `check`, `x`, `plus`, `minus`, `menu`, `more-horizontal`, `search`
- Status: `info`, `alert-triangle`, `alert-circle`, `check-circle`
- Content: `star`, `heart`, `mail`, `phone`, `map-pin`, `calendar`, `clock`, `home`, `user`
- Social: `facebook`, `twitter`, `instagram`, `linkedin`, `youtube`, `github`

- [ ] **Step 3: Create `lucide-sprite.js`**

At build time we import these specific icons from `lucide/dist/esm/icons/` and inline them as a sprite. Each icon is a path data string we render into a known `<svg viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{path}</svg>` wrapper.

```js
// lucide-sprite.js
import { ArrowRight, ArrowLeft, ChevronRight, /* ... 30 imports ... */ } from 'lucide';

const ICONS = {
    'arrow-right': ArrowRight,
    'arrow-left':  ArrowLeft,
    // ... 30 entries
};

export function renderIcon(name, { size = 20, className = '' } = {}) {
    const def = ICONS[name];
    if (!def) return '';
    // lucide icon defs are arrays of [tag, attrs, children]; we serialize manually
    const paths = def[2].map(([tag, attrs]) => {
        const a = Object.entries(attrs).map(([k,v]) => `${k}="${v}"`).join(' ');
        return `<${tag} ${a} />`;
    }).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${className}">${paths}</svg>`;
}

export const ICON_NAMES = Object.keys(ICONS);
```

- [ ] **Step 4: Icon picker control**

A new control primitive at `resources/js/builder/controls/icon-picker.js` — a grid of 30 icons in a dropdown, returns the selected name.

```js
// icon-picker.js
import { ICON_NAMES, renderIcon } from '../icons/lucide-sprite.js';

export function iconPicker({ value = null, onChange = () => {} } = {}) {
    const el = document.createElement('div');
    el.className = 'relative';

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'w-full flex items-center gap-2 px-2 py-1 text-xs border border-slate-300 rounded bg-white hover:bg-slate-50';
    trigger.innerHTML = (value ? renderIcon(value, { size: 16 }) : '<span class="text-slate-400">None</span>') + ' <span class="ms-auto text-slate-400">▾</span>';

    const dropdown = document.createElement('div');
    dropdown.className = 'absolute z-50 mt-1 bg-white border border-slate-200 rounded shadow-lg p-2 grid grid-cols-6 gap-1 hidden';
    dropdown.style.minWidth = '220px';

    [null, ...ICON_NAMES].forEach((name) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'w-8 h-8 grid place-items-center hover:bg-slate-100 rounded';
        btn.title = name || 'None';
        btn.innerHTML = name ? renderIcon(name, { size: 16 }) : '<span class="text-slate-300 text-[10px]">none</span>';
        btn.addEventListener('click', () => {
            value = name;
            trigger.innerHTML = (value ? renderIcon(value, { size: 16 }) : '<span class="text-slate-400">None</span>') + ' <span class="ms-auto text-slate-400">▾</span>';
            dropdown.classList.add('hidden');
            onChange(value);
        });
        dropdown.appendChild(btn);
    });

    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('hidden');
    });
    document.addEventListener('click', () => dropdown.classList.add('hidden'));

    el.appendChild(trigger);
    el.appendChild(dropdown);

    return {
        el,
        get: () => value,
        set: (v) => {
            value = v;
            trigger.innerHTML = (value ? renderIcon(value, { size: 16 }) : '<span class="text-slate-400">None</span>') + ' <span class="ms-auto text-slate-400">▾</span>';
        },
    };
}
```

**Stop here.**

---

## Task 3: Tier-1 widgets — Heading, Text, Button

**Files:**
- Create: `resources/js/builder/widgets/heading.js`
- Create: `resources/js/builder/widgets/text.js`
- Create: `resources/js/builder/widgets/button.js`

Three text-bearing widgets — the most common building blocks. All three use inline RTE.

- [ ] **Step 1: `heading.js`** — inline text + level select (h1-h6) + link

Component type `mp-heading`. Inline-editable text. Content tab fields: level (h1-h6), html_tag, link object.

The `defaults.components` is a single `textnode` child with `editable: true` and `rte_profile: 'heading'`. The widget's HTML tag follows the `level` prop (h1, h2, etc.) — implemented in `handlePropsChange` via `this.set('tagName', `h${level}`)`.

```js
// heading.js skeleton
import { registerContentGroup } from '../style-panel/index.js';
import { presetChips } from '../controls/preset-chips.js';

export function registerHeading(editor) {
    editor.DomComponents.addType('mp-heading', {
        isComponent: (el) => /^H[1-6]$/.test(el.tagName) && el.dataset?.mpWidget === 'heading',
        model: {
            defaults: {
                tagName: 'h2',
                name: 'Heading',
                draggable: '.mp-col',
                droppable: false,
                attributes: { class: 'mp-heading', 'data-mp-widget': 'heading' },
                props: { level: 2, link: null },
                components: 'Heading text',  // string sets a single textnode child
                editable: true,
                'rte_profile': 'heading',
            },
            init() {
                this.on('change:props', this.handlePropsChange);
                this.handlePropsChange();
            },
            handlePropsChange() {
                const { level } = this.get('props') || {};
                if (level >= 1 && level <= 6) this.set('tagName', `h${level}`);
            },
        },
    });

    registerContentGroup('mp-heading', renderHeadingContent);
}

function renderHeadingContent(component) {
    const body = document.createElement('div');
    body.className = 'p-3 space-y-3 text-xs';

    const props = component.get('props') || {};
    const levelChips = presetChips({
        options: [1,2,3,4,5,6].map(n => ({ value: n, label: `H${n}` })),
        value: props.level || 2,
        onChange: (v) => component.set('props', { ...component.get('props'), level: v }),
    });
    body.appendChild(labeled('Level', levelChips.el));

    // Link controls — URL input + target + rel
    const linkUrl = document.createElement('input');
    linkUrl.type = 'url';
    linkUrl.placeholder = 'https:// (optional)';
    linkUrl.className = 'w-full px-2 py-1 border border-slate-300 rounded';
    linkUrl.value = props.link?.url || '';
    linkUrl.addEventListener('input', () => {
        const next = linkUrl.value ? { url: linkUrl.value, target: '_self' } : null;
        component.set('props', { ...component.get('props'), link: next });
    });
    body.appendChild(labeled('Link URL', linkUrl));

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
```

When the heading has a non-null `link.url`, `toHTML()` should wrap the heading in an `<a>`. We override `toHTML` to handle this.

- [ ] **Step 2: `text.js`** — rich text container with full RTE

Component type `mp-text`. Renders as `<div class="mp-text">` with `editable: true` and `rte_profile: 'text'`. Default content is `<p>Edit this text...</p>`.

```js
// text.js skeleton
export function registerText(editor) {
    editor.DomComponents.addType('mp-text', {
        isComponent: (el) => el.classList?.contains('mp-text'),
        model: {
            defaults: {
                tagName: 'div',
                name: 'Text',
                draggable: '.mp-col',
                droppable: false,
                attributes: { class: 'mp-text', 'data-mp-widget': 'text' },
                props: {},
                components: [{ type: 'textnode', content: 'Edit this text. Use the toolbar to format with bold, italic, lists, and more.' }],
                editable: true,
                'rte_profile': 'text',
            },
        },
    });

    // No Content tab fields beyond what's in Style — Text is purely WYSIWYG
    registerContentGroup('mp-text', () => {
        const d = document.createElement('div');
        d.className = 'p-3 text-xs text-slate-500';
        d.textContent = 'Click into the text on canvas to edit. Use the floating toolbar for formatting.';
        return d;
    });
}
```

- [ ] **Step 3: `button.js`** — inline label + link + size + icon + full-width

Component type `mp-button`. Renders as `<a class="mp-btn mp-btn--{size}">`. Inline-editable label with `rte_profile: 'button'`.

Content tab: link URL, target, rel-nofollow toggle, size preset (sm/md/lg), full-width toggle, icon picker, icon position (before/after).

The icon is rendered inline in the button via `renderIcon(name)` from the Lucide sprite.

`handlePropsChange` rewrites the button's classes (`mp-btn`, `mp-btn--{size}`, `mp-btn--full` when full_width), updates the `href`/`target`/`rel` attrs, and updates the icon HTML by manipulating the button's first/last child to be the icon SVG.

- [ ] **Step 4: Extend `builder-runtime.css` with widget base classes**

```css
.mp-heading { margin: 0; }
.mp-text { line-height: 1.6; }
.mp-text p:not(:last-child) { margin: 0 0 12px; }
.mp-btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 10px 20px; border-radius: 6px;
    background: #1e293b; color: white;
    font-weight: 600; text-decoration: none;
    transition: background .15s;
}
.mp-btn:hover { background: #334155; }
.mp-btn--sm { padding: 6px 14px; font-size: 13px; }
.mp-btn--lg { padding: 14px 28px; font-size: 16px; }
.mp-btn--full { width: 100%; justify-content: center; }
```

- [ ] **Step 5: Register in `widgets/index.js` + `builder.js`**

Create `widgets/index.js` (will grow as more widgets are added):

```js
import { registerHeading } from './heading.js';
import { registerText } from './text.js';
import { registerButton } from './button.js';

export function registerAllWidgets(editor) {
    registerHeading(editor);
    registerText(editor);
    registerButton(editor);
}
```

In `builder.js`, import and call:

```js
import { registerAllWidgets } from './builder/widgets/index.js';
// ...
registerAllWidgets(editor);  // after registerColumn(editor)
```

**Stop here.**

---

## Task 4: Tier-1 widgets — Icon, Icon Box, Divider, Spacer

**Files:**
- Create: `resources/js/builder/widgets/icon.js`
- Create: `resources/js/builder/widgets/icon-box.js`
- Create: `resources/js/builder/widgets/divider.js`
- Create: `resources/js/builder/widgets/spacer.js`

- [ ] **Step 1: `icon.js`** — single icon from the sprite

Renders as `<span class="mp-icon mp-icon--{shape}">{svg}</span>` or wrapped in `<a>` if link is set. Content tab: icon picker, shape (none/square/circle), link URL/target.

- [ ] **Step 2: `icon-box.js`** — composite of icon + heading + text

Renders as `<div class="mp-iconbox mp-iconbox--{title_position}"><span class="mp-iconbox__icon">{svg}</span><h3 class="mp-iconbox__title">Title</h3><p class="mp-iconbox__desc">Description</p></div>`.

Inline editing on title (rte_profile: heading) and desc (rte_profile: inline). The icon's name is a prop (icon picker).

Content tab: icon picker, title tag (h2-h6), title position (top/left/right), alignment (left/center/right).

- [ ] **Step 3: `divider.js`** — decorative HR

Renders as `<hr class="mp-divider mp-divider--{style}">`. Content tab: style (solid/dashed/dotted), width % (slider 10-100), alignment (left/center/right), gap above (numberWithUnit).

- [ ] **Step 4: `spacer.js`** — vertical empty space

Renders as `<div class="mp-spacer" style="height:{height}px"></div>`. Default height 50px. Set via Style tab → Sizing → height. No Content tab fields (Plan 5's empty-state placeholder is fine).

- [ ] **Step 5: Extend runtime CSS**

```css
.mp-icon { display: inline-flex; align-items: center; justify-content: center; }
.mp-icon--square,
.mp-icon--circle { width: 48px; height: 48px; padding: 12px; background: rgb(241 245 249); }
.mp-icon--circle { border-radius: 50%; }
.mp-icon--square { border-radius: 8px; }

.mp-iconbox { display: flex; gap: 12px; }
.mp-iconbox--top { flex-direction: column; align-items: flex-start; }
.mp-iconbox--left  { flex-direction: row; align-items: flex-start; }
.mp-iconbox--right { flex-direction: row-reverse; align-items: flex-start; }
.mp-iconbox__title { margin: 0; font-size: 1.125rem; }
.mp-iconbox__desc  { margin: 0; color: rgb(71 85 105); }

.mp-divider { border: 0; border-top: 1px solid rgb(203 213 225); width: 100%; }
.mp-divider--dashed { border-top-style: dashed; }
.mp-divider--dotted { border-top-style: dotted; }

.mp-spacer { display: block; width: 100%; }
```

- [ ] **Step 6: Add to `widgets/index.js`**

```js
import { registerIcon } from './icon.js';
import { registerIconBox } from './icon-box.js';
import { registerDivider } from './divider.js';
import { registerSpacer } from './spacer.js';

// in registerAllWidgets():
registerIcon(editor);
registerIconBox(editor);
registerDivider(editor);
registerSpacer(editor);
```

**Stop here.**

---

## Task 5: Tier-1 widgets — HTML, Alert

**Files:**
- Create: `resources/js/builder/widgets/html.js`
- Create: `resources/js/builder/widgets/alert.js`

- [ ] **Step 1: `html.js`** — raw HTML escape hatch

Renders as `<div class="mp-html">{raw_html}</div>`. The `raw_html` is a prop set via a textarea in the Content tab. On the public side, the HTML is rendered as-is BUT sanitized server-side (the existing `HtmlSanitizer::stripDocumentWrappers` covers it; we don't need to extend it for Plan 6 — Plan 7 has the deeper sanitizer work).

Inside the editor canvas: the content is rendered live as innerHTML. Watch out for selection: clicking inside the raw HTML should select the mp-html parent, not anything inside. Set `selectable: false` on auto-typed descendants by not registering any types for them.

Content tab: a single textarea with raw HTML input. Updates on blur.

- [ ] **Step 2: `alert.js`** — variant + title + dismissible + icon

Renders as:

```html
<div class="mp-alert mp-alert--{variant}" data-mp-widget="alert" data-mp-dismissible="{1|0}">
  {iconSvg}
  <div class="mp-alert__body">
    <h4 class="mp-alert__title">{title}</h4>
    <div class="mp-alert__message">{rich text}</div>
  </div>
  <button class="mp-alert__close" type="button" aria-label="Dismiss">×</button>
</div>
```

Inline editing on title (rte_profile: heading) and message (rte_profile: inline). Content tab: variant chips (info/success/warning/error), dismissible toggle, icon-enabled toggle, icon picker (default per-variant: info/check-circle/alert-triangle/x).

Plan 7 wires up the close button on public pages.

- [ ] **Step 3: Extend runtime CSS**

```css
.mp-html { display: block; width: 100%; }

.mp-alert {
    display: flex; gap: 12px; align-items: flex-start;
    padding: 14px 16px; border-radius: 6px;
    border: 1px solid;
    position: relative;
}
.mp-alert--info    { background: rgb(239 246 255); border-color: rgb(147 197 253); color: rgb(30 58 138); }
.mp-alert--success { background: rgb(240 253 244); border-color: rgb(134 239 172); color: rgb(20 83 45); }
.mp-alert--warning { background: rgb(255 251 235); border-color: rgb(252 211 77); color: rgb(120 53 15); }
.mp-alert--error   { background: rgb(254 242 242); border-color: rgb(252 165 165); color: rgb(127 29 29); }
.mp-alert__title { margin: 0 0 4px; font-size: 14px; font-weight: 600; }
.mp-alert__close { position: absolute; top: 8px; right: 8px; background: transparent; border: 0; cursor: pointer; padding: 4px; font-size: 18px; line-height: 1; color: inherit; opacity: .6; }
.mp-alert__close:hover { opacity: 1; }
```

- [ ] **Step 4: Register**

```js
import { registerHtml } from './html.js';
import { registerAlert } from './alert.js';

// in registerAllWidgets():
registerHtml(editor);
registerAlert(editor);
```

**Stop here.**

---

## Task 6: Tier-2 widgets — Image, Gallery

**Files:**
- Create: `resources/js/builder/widgets/image.js`
- Create: `resources/js/builder/widgets/gallery.js`

- [ ] **Step 1: `image.js`** — single image with optional caption + link + lightbox

Renders as `<figure class="mp-image"><a href="..."><img src alt loading="lazy"></a><figcaption>...</figcaption></figure>` or with `data-mp-lightbox="1"` data-attr in place of the `<a>` when lightbox is enabled (Plan 7 wires the lightbox JS).

Content tab: src (asset picker — open GrapesJS AssetManager and bind selection), alt text, caption (inline editable on the canvas — set via textnode in the figcaption), link URL/target, lightbox toggle.

- [ ] **Step 2: `gallery.js`** — grid of images with optional lightbox

Renders as:
```html
<div class="mp-gallery mp-gallery--cols-{N}" data-mp-widget="gallery" data-mp-lightbox="{1|0}">
  <figure class="mp-gallery__item">
    <img src alt loading="lazy">
    <figcaption>Caption</figcaption>
  </figure>
  ...
</div>
```

Content tab: columns (slider 2-6), gap (numberWithUnit), lightbox toggle, list of images. The list editor is a stack of rows showing thumb + alt input + caption input + "remove" button + an "Add image" button that opens the asset picker.

The image list is stored as a prop array: `images: [{ src, alt, caption }, ...]`. The widget's `toHTML()` renders the list.

- [ ] **Step 3: Extend runtime CSS**

```css
.mp-image { margin: 0; }
.mp-image img { display: block; width: 100%; height: auto; }
.mp-image figcaption { padding-top: 8px; font-size: 13px; color: rgb(71 85 105); text-align: center; }

.mp-gallery { display: grid; gap: 12px; }
.mp-gallery--cols-2 { grid-template-columns: repeat(2, 1fr); }
.mp-gallery--cols-3 { grid-template-columns: repeat(3, 1fr); }
.mp-gallery--cols-4 { grid-template-columns: repeat(4, 1fr); }
.mp-gallery--cols-5 { grid-template-columns: repeat(5, 1fr); }
.mp-gallery--cols-6 { grid-template-columns: repeat(6, 1fr); }
.mp-gallery__item { margin: 0; cursor: pointer; }
.mp-gallery__item img { display: block; width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 4px; }
```

- [ ] **Step 4: Register**

```js
import { registerImage } from './image.js';
import { registerGallery } from './gallery.js';

// in registerAllWidgets():
registerImage(editor);
registerGallery(editor);
```

**Stop here.**

---

## Task 7: Tier-2 widgets — Video, Social

**Files:**
- Create: `resources/js/builder/widgets/video.js`
- Create: `resources/js/builder/widgets/social.js`

- [ ] **Step 1: `video.js`** — YouTube / Vimeo / direct URL

Content tab: source provider (youtube/vimeo/url), video URL or ID, autoplay toggle, loop toggle, muted toggle, controls toggle, aspect ratio (16:9/4:3/1:1/21:9).

Renders as `<div class="mp-video mp-video--{ratio}" data-mp-widget="video"><iframe loading="lazy" src="..." ...></iframe></div>` for YouTube/Vimeo, or `<video controls>...</video>` for direct URLs.

URL parser: youtube.com/watch?v=ID, youtu.be/ID, vimeo.com/ID, direct mp4. The parser produces the right embed URL.

- [ ] **Step 2: `social.js`** — row of platform icons linking to URLs

Content tab: list of `{ platform, url }` (add/remove rows; platform dropdown supports facebook/twitter/instagram/linkedin/youtube/github/email/phone). Shape preset (none/square/circle), size (sm/md/lg), gap.

Renders as:
```html
<div class="mp-social mp-social--{shape} mp-social--{size}" data-mp-widget="social">
  <a href="..." class="mp-social__link" target="_blank" rel="noopener noreferrer">
    {iconSvg}
  </a>
  ...
</div>
```

For `email` the URL is `mailto:`, for `phone` it's `tel:`. No `target=_blank` on those.

- [ ] **Step 3: Extend runtime CSS**

```css
.mp-video { position: relative; width: 100%; overflow: hidden; }
.mp-video--16-9 { aspect-ratio: 16/9; }
.mp-video--4-3 { aspect-ratio: 4/3; }
.mp-video--1-1 { aspect-ratio: 1/1; }
.mp-video--21-9 { aspect-ratio: 21/9; }
.mp-video iframe,
.mp-video video { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }

.mp-social { display: flex; gap: 8px; align-items: center; }
.mp-social__link { display: grid; place-items: center; color: currentColor; text-decoration: none; }
.mp-social--square .mp-social__link,
.mp-social--circle .mp-social__link {
    width: 36px; height: 36px;
    background: rgb(15 23 42); color: white;
}
.mp-social--circle .mp-social__link { border-radius: 50%; }
.mp-social--square .mp-social__link { border-radius: 6px; }
.mp-social--sm .mp-social__link { width: 28px; height: 28px; }
.mp-social--lg .mp-social__link { width: 44px; height: 44px; }
```

- [ ] **Step 4: Register**

```js
import { registerVideo } from './video.js';
import { registerSocial } from './social.js';

// in registerAllWidgets():
registerVideo(editor);
registerSocial(editor);
```

**Stop here.**

---

## Task 8: Tier-2 widgets — Progress, Counter

**Files:**
- Create: `resources/js/builder/widgets/progress.js`
- Create: `resources/js/builder/widgets/counter.js`

Both are static in the editor canvas (just show the final state) and animate on the public page via Plan 7's runtime JS (IntersectionObserver triggers).

- [ ] **Step 1: `progress.js`** — progress / skill bar

Content tab: value (0-100), max (default 100), show label toggle, label format ("{value}%" or custom string with `{value}` placeholder), animated toggle.

Renders as:
```html
<div class="mp-progress" data-mp-widget="progress" data-mp-value="{value}" data-mp-max="{max}" data-mp-animated="{1|0}">
  <div class="mp-progress__label">{labelFormatted}</div>
  <div class="mp-progress__track">
    <div class="mp-progress__fill" style="width: {value/max * 100}%"></div>
  </div>
</div>
```

- [ ] **Step 2: `counter.js`** — animated number

Content tab: start (default 0), end (default 100), duration ms (default 2000), prefix string, suffix string, separator (comma/space/none).

Renders as `<div class="mp-counter" data-mp-widget="counter" data-mp-start="0" data-mp-end="100" data-mp-duration="2000" data-mp-prefix="" data-mp-suffix="" data-mp-separator=","><span class="mp-counter__value">100</span></div>` — the canvas shows the END value as a static number.

- [ ] **Step 3: Extend runtime CSS**

```css
.mp-progress { width: 100%; }
.mp-progress__label { font-size: 13px; margin-bottom: 4px; display: flex; justify-content: space-between; }
.mp-progress__track { height: 8px; background: rgb(226 232 240); border-radius: 999px; overflow: hidden; }
.mp-progress__fill { height: 100%; background: rgb(59 130 246); border-radius: 999px; transition: width .6s ease; }

.mp-counter { font-size: 2.5rem; font-weight: 700; }
.mp-counter__value { font-variant-numeric: tabular-nums; }
```

- [ ] **Step 4: Register**

```js
import { registerProgress } from './progress.js';
import { registerCounter } from './counter.js';

// in registerAllWidgets():
registerProgress(editor);
registerCounter(editor);
```

**Stop here.**

---

## Task 9: Tier-3 widget — Accordion

**Files:**
- Create: `resources/js/builder/widgets/accordion.js`

Complex widget. Items are child sub-components. Each item has a title (inline editable) and a body (inline editable rich text).

- [ ] **Step 1: Component types**

Two types: `mp-accordion` (the wrapper) and `mp-accordion-item` (each Q&A row).

`mp-accordion` defaults:
- `components`: 3 default `mp-accordion-item` children
- Props: `allow_multiple_open` (bool), `default_open_index` (number)
- Drop rules: accepts only `mp-accordion-item`

`mp-accordion-item` defaults:
- Renders as `<div class="mp-accordion__item" data-mp-open="{0|1}">`
- `components`: two child sub-components — a title (`<button class="mp-accordion__title" editable=true rte_profile=inline>`) and a body (`<div class="mp-accordion__body" editable=true rte_profile=text>`)
- Drop rules: only inside `mp-accordion`; accepts only the two named child types

- [ ] **Step 2: Content tab UI**

For `mp-accordion`: toggle (allow multiple open), numberWithUnit (default open index, 0-based).

For `mp-accordion-item`: button "Add item after" + button "Remove this item" + button "Move up" / "Move down".

- [ ] **Step 3: Extend runtime CSS**

```css
.mp-accordion { display: block; }
.mp-accordion__item { border-bottom: 1px solid rgb(226 232 240); }
.mp-accordion__title {
    width: 100%; text-align: left; padding: 14px 16px; padding-right: 40px;
    background: transparent; border: 0; cursor: pointer;
    font-weight: 600; font-size: 15px;
    position: relative;
}
.mp-accordion__title::after {
    content: '+'; position: absolute; right: 16px; top: 50%; transform: translateY(-50%);
    font-size: 20px; color: rgb(100 116 139);
}
.mp-accordion__item[data-mp-open="1"] .mp-accordion__title::after { content: '−'; }
.mp-accordion__body {
    padding: 0 16px; height: 0; overflow: hidden; transition: height .25s, padding .25s;
}
.mp-accordion__item[data-mp-open="1"] .mp-accordion__body { padding: 0 16px 16px; height: auto; }
```

- [ ] **Step 4: Register**

```js
import { registerAccordion } from './accordion.js';

// in registerAllWidgets():
registerAccordion(editor);
```

**Stop here.**

---

## Task 10: Tier-3 widget — Tabs

**Files:**
- Create: `resources/js/builder/widgets/tabs.js`

Same pattern as Accordion. `mp-tabs` parent + `mp-tab` children. Each `mp-tab` has a label (inline) and a panel (inline rich text).

The editor visually shows all tabs' panels stacked (so each is editable). The public page shows one at a time via Plan 7's runtime.

- [ ] **Step 1: Component types**

`mp-tabs` with props `orientation` (horizontal/vertical), `default_tab_index`. Renders as `<div class="mp-tabs mp-tabs--{orientation}"><div class="mp-tabs__nav">{tab labels}</div><div class="mp-tabs__panels">{tab panels}</div></div>`.

In the editor canvas, the nav and panels share the data flow: each `mp-tab` provides a label (mirrored into nav) and a panel (rendered in panels). Implementing this two-way render in GrapesJS without re-renders fighting is tricky. Simpler approach: the nav buttons are rendered by `mp-tabs`'s own logic in `toHTML()` by reading children's labels.

Easier: just render `<div class="mp-tabs">{tab children, each rendering its OWN label and panel as two siblings}</div>`. Then runtime JS in Plan 7 shows/hides panels.

- [ ] **Step 2: Content tab UI**

Same as accordion — add/remove/reorder tab items + the parent's `orientation` and `default_tab_index`.

- [ ] **Step 3: Runtime CSS**

```css
.mp-tabs__nav { display: flex; border-bottom: 2px solid rgb(226 232 240); }
.mp-tabs--vertical { display: flex; }
.mp-tabs--vertical .mp-tabs__nav { flex-direction: column; border-bottom: 0; border-right: 2px solid rgb(226 232 240); }
.mp-tab__label {
    padding: 10px 16px; cursor: pointer; background: transparent; border: 0;
    font-weight: 500; color: rgb(71 85 105);
    border-bottom: 2px solid transparent; margin-bottom: -2px;
}
.mp-tab__label[data-mp-active="1"] { color: rgb(15 23 42); border-bottom-color: rgb(59 130 246); }
.mp-tab__panel { padding: 16px 0; }
.mp-tab__panel[data-mp-active="0"] { display: none; }
```

- [ ] **Step 4: Register**

**Stop here.**

---

## Task 11: Tier-3 widget — Carousel

**Files:**
- Create: `resources/js/builder/widgets/carousel.js`
- Modify: `package.json` — add `embla-carousel` runtime dep

The most complex widget. Slides are child sub-components, each containing an image + optional caption (inline editable).

The editor canvas shows all slides side-by-side (`overflow-x: auto` for scrolling preview) rather than running the actual carousel — running Embla inside the editor canvas iframe risks bugs. Plan 7 initializes Embla on the public page only.

- [ ] **Step 1: Install Embla**

```bash
npm install embla-carousel
```

- [ ] **Step 2: Component types**

`mp-carousel` parent with props: autoplay_ms (0 = off), loop bool, show_arrows bool, show_dots bool, slides_per_view (1-6). Renders as `<div class="mp-carousel" data-mp-widget="carousel" data-mp-autoplay="{ms}" data-mp-loop="{0|1}" data-mp-arrows="{0|1}" data-mp-dots="{0|1}" data-mp-slides="{N}"><div class="mp-carousel__viewport"><div class="mp-carousel__container">{slides}</div></div><button class="mp-carousel__prev">‹</button><button class="mp-carousel__next">›</button><div class="mp-carousel__dots"></div></div>`.

`mp-carousel-slide` child: image + optional inline-editable caption. Drop rules: only inside `mp-carousel`.

- [ ] **Step 3: Content tab UI**

List of slides (add/remove/reorder + per-slide image picker) + parent props (autoplay/loop/etc.).

- [ ] **Step 4: Runtime CSS**

```css
.mp-carousel { position: relative; }
.mp-carousel__viewport { overflow: hidden; }
.mp-carousel__container { display: flex; }
.mp-carousel__slide { flex: 0 0 100%; min-width: 0; }
.mp-carousel--slides-2 .mp-carousel__slide { flex-basis: 50%; }
.mp-carousel--slides-3 .mp-carousel__slide { flex-basis: 33.33%; }
.mp-carousel--slides-4 .mp-carousel__slide { flex-basis: 25%; }
.mp-carousel__slide img { width: 100%; height: auto; display: block; }
.mp-carousel__prev,
.mp-carousel__next {
    position: absolute; top: 50%; transform: translateY(-50%);
    width: 36px; height: 36px; border-radius: 50%;
    background: rgba(15,23,42,.7); color: white; border: 0;
    display: grid; place-items: center; cursor: pointer;
}
.mp-carousel__prev { left: 12px; }
.mp-carousel__next { right: 12px; }
.mp-carousel__dots {
    position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%);
    display: flex; gap: 6px;
}
.mp-carousel__dot { width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,.5); }
.mp-carousel__dot[data-active="1"] { background: white; }

/* Editor-only — show slides side-by-side as a scrollable strip instead of using Embla */
.gjs-editor .mp-carousel__viewport { overflow-x: auto; }
.gjs-editor .mp-carousel__prev,
.gjs-editor .mp-carousel__next,
.gjs-editor .mp-carousel__dots { display: none; }
```

**Stop here.**

---

## Task 12: Tier-3 widget — Testimonial

**Files:**
- Create: `resources/js/builder/widgets/testimonial.js`

Quote + author + role + avatar image + star rating.

- [ ] **Step 1: Component type**

`mp-testimonial`. Default child layout:
```html
<div class="mp-testimonial mp-testimonial--{layout}">
  <img class="mp-testimonial__avatar" src="..." alt="">
  <blockquote class="mp-testimonial__quote" editable rte_profile="inline">"Great product, really helped our team."</blockquote>
  <cite class="mp-testimonial__author" editable rte_profile="inline">Jane Doe</cite>
  <span class="mp-testimonial__role" editable rte_profile="inline">CEO, Example Co.</span>
  <div class="mp-testimonial__stars">{5 star svgs}</div>
</div>
```

Props: layout (image-top/image-left/image-right), star_rating (0-5).

- [ ] **Step 2: Content tab**

Layout chips, avatar image picker, star rating slider 0-5.

- [ ] **Step 3: Runtime CSS**

```css
.mp-testimonial { display: flex; gap: 16px; padding: 24px; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(15,23,42,.06); }
.mp-testimonial--image-top { flex-direction: column; align-items: center; text-align: center; }
.mp-testimonial--image-left { flex-direction: row; align-items: flex-start; }
.mp-testimonial--image-right { flex-direction: row-reverse; align-items: flex-start; }
.mp-testimonial__avatar { width: 64px; height: 64px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
.mp-testimonial__quote { margin: 0; font-style: italic; color: rgb(51 65 85); }
.mp-testimonial__author { display: block; font-weight: 600; margin-top: 8px; font-style: normal; }
.mp-testimonial__role { display: block; font-size: 13px; color: rgb(100 116 139); }
.mp-testimonial__stars { display: flex; gap: 2px; color: rgb(245 158 11); margin-top: 8px; }
```

**Stop here.**

---

## Task 13: Tier-3 widget — Pricing

**Files:**
- Create: `resources/js/builder/widgets/pricing.js`

The most complex of the simple widgets. Plan card with title, price, period, feature list, and CTA button.

- [ ] **Step 1: Component type**

`mp-pricing`. Renders as:
```html
<div class="mp-pricing mp-pricing--{highlighted ? 'featured' : ''}">
  <h3 class="mp-pricing__name" editable>Pro</h3>
  <div class="mp-pricing__price-row">
    <span class="mp-pricing__currency">$</span>
    <span class="mp-pricing__price" editable>29</span>
    <span class="mp-pricing__period">/month</span>
  </div>
  <ul class="mp-pricing__features">
    <li data-included="1">10 projects</li>
    <li data-included="1">Email support</li>
    <li data-included="0">Phone support</li>
  </ul>
  <a class="mp-btn mp-btn--lg mp-btn--full" href="...">Get started</a>
</div>
```

Features stored as `features: [{ text, included }, ...]`. Each rendered with a check or x icon depending on `included`.

- [ ] **Step 2: Content tab**

Currency symbol input, period label input, highlighted toggle, button URL/label inputs, features list editor (add/remove/reorder rows + each row: text input + included checkbox).

- [ ] **Step 3: Runtime CSS**

```css
.mp-pricing {
    padding: 32px 24px; background: white; border: 1px solid rgb(226 232 240); border-radius: 12px;
    text-align: center;
}
.mp-pricing--featured {
    border-color: rgb(59 130 246); border-width: 2px;
    box-shadow: 0 10px 30px rgba(15,23,42,.08);
    transform: scale(1.02);
}
.mp-pricing__name { font-size: 1.25rem; margin: 0 0 16px; }
.mp-pricing__price-row { display: flex; align-items: baseline; justify-content: center; gap: 4px; margin-bottom: 24px; }
.mp-pricing__currency { font-size: 1.5rem; color: rgb(71 85 105); }
.mp-pricing__price { font-size: 3rem; font-weight: 700; }
.mp-pricing__period { font-size: 1rem; color: rgb(71 85 105); }
.mp-pricing__features { list-style: none; padding: 0; margin: 0 0 24px; text-align: left; }
.mp-pricing__features li { padding: 6px 0; display: flex; align-items: center; gap: 8px; }
.mp-pricing__features li[data-included="0"] { color: rgb(148 163 184); text-decoration: line-through; }
.mp-pricing__features li::before {
    content: '✓'; color: rgb(34 197 94); font-weight: 700;
    width: 18px; height: 18px; display: grid; place-items: center;
}
.mp-pricing__features li[data-included="0"]::before {
    content: '×'; color: rgb(148 163 184);
}
```

**Stop here.**

---

## Task 14: Starter Section templates + delete `blocks.js`

**Files:**
- Create: `resources/js/builder/templates/index.js`
- Create: `resources/js/builder/templates/hero.js`
- Create: `resources/js/builder/templates/two-column.js`
- Create: `resources/js/builder/templates/cta-banner.js`
- Create: `resources/js/builder/templates/feature-grid.js`
- Modify: `resources/js/builder/sections/section-picker.js` — add a "Templates" tab alongside "Structures"
- Modify: `resources/js/builder.js` — remove the `registerBlocks(editor)` call and remove the legacy `import { plugins, registerBlocks } from './builder/blocks.js'`
- Delete: `resources/js/builder/blocks.js`

- [ ] **Step 1: Template JSON-tree snippets**

Each template exports a function `getTemplate()` returning a JSON tree compatible with `editor.addComponents([...])`. Example for Hero:

```js
// hero.js
export function getHeroTemplate() {
    return {
        type: 'mp-section',
        attributes: { id: genId() },
        props: { width: 'full', max_inner_width: 1200, vertical_align: 'middle', min_height_mode: 'fixed', min_height: 480 },
        components: [{
            tagName: 'div',
            attributes: { class: 'mp-sec__inner' },
            selectable: false,
            droppable: '.mp-col',
            components: [
                { type: 'mp-column', props: { size_pct: 50, vertical_align: 'middle' }, components: [
                    { type: 'mp-heading', props: { level: 1 }, components: [{ type: 'textnode', content: 'Welcome to MiniPress' }] },
                    { type: 'mp-text', components: [{ type: 'textnode', content: 'Build pages visually in minutes — no code required.' }] },
                    { type: 'mp-button', props: { link: { url: '/get-started', target: '_self' }, size: 'lg' }, components: [{ type: 'textnode', content: 'Get Started' }] },
                ]},
                { type: 'mp-column', props: { size_pct: 50 }, components: [
                    { type: 'mp-image', props: { src: '/images/hero-placeholder.png', alt: 'Hero illustration' } },
                ]},
            ],
        }],
    };
}

function genId() { return 'i' + Math.random().toString(36).slice(2, 8); }
```

Similar shapes for two-column.js, cta-banner.js, feature-grid.js.

- [ ] **Step 2: `templates/index.js`** — central exports

```js
import { getHeroTemplate } from './hero.js';
import { getTwoColumnTemplate } from './two-column.js';
import { getCtaBannerTemplate } from './cta-banner.js';
import { getFeatureGridTemplate } from './feature-grid.js';

export const TEMPLATES = [
    { id: 'hero',         label: 'Hero',         build: getHeroTemplate,         thumb: '🎯' },
    { id: 'two-column',   label: 'Two Column',   build: getTwoColumnTemplate,   thumb: '⫶⫶' },
    { id: 'cta-banner',   label: 'CTA Banner',   build: getCtaBannerTemplate,   thumb: '📣' },
    { id: 'feature-grid', label: 'Feature Grid', build: getFeatureGridTemplate, thumb: '⊞' },
];
```

- [ ] **Step 3: Extend `section-picker.js` with a "Templates" tab**

Convert the popover from a single grid to a two-tab UI: "Structures" (current 8 column-presets) and "Templates" (4 starter templates).

```js
// inside openSectionPicker, after creating the popover:
const tabBar = document.createElement('div');
tabBar.className = 'flex border-b border-slate-200 mb-2';
tabBar.innerHTML = `
    <button type="button" data-pick-tab="structures" class="flex-1 px-3 py-1 text-xs font-medium border-b-2 border-blue-500 text-blue-600">Structures</button>
    <button type="button" data-pick-tab="templates" class="flex-1 px-3 py-1 text-xs font-medium border-b-2 border-transparent text-slate-600">Templates</button>
`;
popover.insertBefore(tabBar, title);
title.style.display = 'none';

const structuresArea = grid;
const templatesArea = renderTemplatesArea(editor);
templatesArea.style.display = 'none';
popover.appendChild(templatesArea);

tabBar.addEventListener('click', (e) => {
    const tab = e.target.closest('[data-pick-tab]')?.dataset.pickTab;
    if (!tab) return;
    tabBar.querySelectorAll('[data-pick-tab]').forEach(b => {
        const active = b.dataset.pickTab === tab;
        b.classList.toggle('border-blue-500', active);
        b.classList.toggle('text-blue-600', active);
        b.classList.toggle('border-transparent', !active);
        b.classList.toggle('text-slate-600', !active);
    });
    structuresArea.style.display = tab === 'structures' ? '' : 'none';
    templatesArea.style.display = tab === 'templates' ? '' : 'none';
});
```

And `renderTemplatesArea` builds a similar grid of 4 cards showing thumb + label; clicking a card calls `editor.addComponents([TEMPLATES.find(t => t.id === id).build()])` and closes the popover.

- [ ] **Step 4: Remove legacy blocks**

In `resources/js/builder.js`:
- Remove the line `import { plugins, registerBlocks } from './builder/blocks.js';`
- Remove `plugins: plugins(),` from `grapesjs.init({...})` (and the `pluginsOpts` for `grapesjs-preset-webpage` and `grapesjs-blocks-basic`)
- Remove the `registerBlocks(editor);` call

In `package.json`:
- Remove `grapesjs-preset-webpage`, `grapesjs-blocks-basic`, `grapesjs-custom-code`, `grapesjs-style-bg` dependencies (they were used only by the old blocks.js plugins config)

Run `npm install` to update the lockfile.

- [ ] **Step 5: Delete `resources/js/builder/blocks.js`**

```bash
rm resources/js/builder/blocks.js
```

**Stop here.**

---

## Task 15: Wrap-up — Plan 6 build + sanity

**Files:** none (verification only)

- [ ] **Step 1: Build**

```bash
npm run build
```

Expected: clean build. The `builder-*.js` chunk grows substantially (now ~1.5MB unminified due to 20 widgets + RTE + icons + embla — still acceptable for an admin-only bundle that's lazy-loaded per edit session).

- [ ] **Step 2: Verify all 20 widget types appear in the GrapesJS Block Manager (manual browser smoke)**

Plan 6 doesn't yet add a UI to drag widgets onto columns (that's a separate concern — for now widgets are inserted programmatically or via the structure picker for templates). The user verifies widgets via:
1. Open editor → click "+ Section" → choose any structure → Section + columns appear.
2. In DevTools console: `window.gjsEditor.addComponents([{ type: 'mp-heading' }], { at: window.gjsEditor.getWrapper().findType('mp-column')[0].components() })` — adds a heading widget to the first column. Verify:
   - Inline edit works (click the heading on canvas, type, see text update).
   - Right panel Content tab shows level chips + link URL input.
   - Right panel Style tab shows all 7 groups.
3. Repeat for all 20 widget types (just spot-check 3-5; full UI for dragging widgets in is Plan 7's nicer story or Phase B's left sidebar).

- [ ] **Step 3: Verify template insertion**

1. Click "+ Section" → switch to "Templates" tab → 4 templates visible (Hero / Two-Column / CTA Banner / Feature Grid).
2. Click Hero → Section + 2 columns + heading/text/button/image widgets all appear pre-populated.
3. Inline-edit the heading text → updates.
4. Save Draft → reload → all state restored.

- [ ] **Step 4: Verify Coloris still works**

The legacy blocks.js had Coloris init wiring — confirm we kept `initColoris()` and `rebindColorisOnStyleChanges(editor)` in builder.js (these are from Plan 2, not the deleted blocks.js — they live in `resources/js/builder/coloris-init.js`). Style panel color pickers should still open.

- [ ] **Step 5: Save tests pass**

```bash
php artisan test --filter=BuilderAdminTest
```

Expected: 14 passing (no regressions from the new widget types — they all live within `WidgetRegistry::ALLOWED_TYPES` which already accepts them).

**Stop here.**

---

## Plan 6 Acceptance Criteria

Plan 6 is complete when:

1. All 20 widget types are registered as GrapesJS custom component types (`mp-heading`, `mp-text`, `mp-button`, `mp-icon`, `mp-icon-box`, `mp-divider`, `mp-spacer`, `mp-html`, `mp-alert`, `mp-image`, `mp-gallery`, `mp-video`, `mp-social`, `mp-progress`, `mp-counter`, `mp-accordion`, `mp-tabs`, `mp-carousel`, `mp-testimonial`, `mp-pricing`).
2. Each widget has a Content tab renderer registered via `registerContentGroup`.
3. The custom RTE floating toolbar renders for any text-bearing widget when an editable region is clicked.
4. Inline editing works on every text-bearing widget per the spec's Pattern 1 / 2 / 3.
5. 4 starter Section templates are available via the "Templates" tab in the section picker popover.
6. Dropping any template inserts a fully-composed Section + Columns + Widgets that the user can immediately customize.
7. The legacy `resources/js/builder/blocks.js` is deleted; no references remain in `builder.js` or `package.json`.
8. `npm run build` succeeds; the manifest still has the `builder` chunk.
9. `php artisan test` is still green (no test regressions; Plan 6 adds zero tests).

---

## Handoff to Plan 7

Plan 7 picks up by:
- Creating `resources/js/builder-runtime.js` — public-page runtime that initializes the interactive widgets (carousel via Embla, accordion expand/collapse, tabs swap, alert dismiss, counter animation, progress bar animation, gallery lightbox).
- Adding a new Vite input entry for `builder-runtime.js` and wiring it via `@vite([...])` in `resources/views/layouts/app.blade.php`.
- Rewriting `database/seeders/PlaceholderPagesSeeder.php` so the seeded pages use the new Section/Column/Widget JSON trees instead of raw HTML.
- Adding snapshot tests in `tests/Feature/BuilderRenderingTest.php` covering: empty section, section with mixed widgets, nested Inner Section, all 20 widgets in isolation.
- Final manual smoke checklist (15 items) + Lighthouse performance check on the seeded Welcome page.
- Addressing the Plan 7 backlog accumulated during Plans 5+6: WidgetRegistry malformed-node hardening, popover accessibility (aria-haspopup/aria-controls, focus trap, keyboard nav), viewport clamping for popovers, scroll/resize reposition, listener-leak edge in section picker.

Plan 7 is the final phase of the Phase A spec — after it ships, the editor has all the features the spec promised: 20 widgets, inline editing, full style panel, 4 starter templates, working public-page rendering with interactive runtime, and snapshot+e2e test coverage.
