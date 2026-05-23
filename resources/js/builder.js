import grapesjs from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';

import { initColoris, rebindColorisOnStyleChanges } from './builder/coloris-init.js';
import { registerAllWidgets } from './builder/widgets/index.js';
import { registerSection } from './builder/sections/section.js';
import { registerColumn } from './builder/sections/column.js';
import { openSectionPicker } from './builder/sections/section-picker.js';
import { configureRTE } from './builder/rte/toolbar.js';
import { attachPasteFilter } from './builder/rte/paste-filter.js';
import { mountStylePanel, registerStyleGroup, registerAdvancedGroup } from './builder/style-panel/index.js';
import { typographyGroup } from './builder/style-panel/groups/typography.js';
import { backgroundGroup } from './builder/style-panel/groups/background.js';
import { borderGroup }  from './builder/style-panel/groups/border.js';
import { shadowGroup }  from './builder/style-panel/groups/shadow.js';
import { spacingGroup } from './builder/style-panel/groups/spacing.js';
import { sizingGroup }  from './builder/style-panel/groups/sizing.js';
import { layoutGroup }  from './builder/style-panel/groups/layout.js';
import { fourSideInput } from './builder/controls/four-side-input.js';
import { collapsibleGroup } from './builder/controls/collapsible-group.js';

const SAVE_DEBOUNCE_MS = 5000;

document.addEventListener('DOMContentLoaded', () => {
    const mount = document.getElementById('gjs');
    if (!mount) return;

    const config = JSON.parse(mount.dataset.config ?? '{}');

    const editor = grapesjs.init({
        container: '#gjs',
        height: '100%',
        fromElement: false,
        storageManager: false,
        deviceManager: {
            devices: [
                { id: 'desktop', name: 'Desktop', width: '' },
                { id: 'tablet', name: 'Tablet', width: '768px', widthMedia: '992px' },
                { id: 'mobile', name: 'Mobile', width: '375px', widthMedia: '480px' },
            ],
        },
        canvas: {
            styles: config.canvas_css_url ? [config.canvas_css_url] : [],
            scripts: [], // tailwindcss cdn was here for plan 2; drop it — we now use compiled Tailwind via canvas_css_url
        },
        assetManager: {
            upload: config.urls.upload,
            uploadName: 'files',
            multiUpload: true,
            autoAdd: true,
            credentials: 'same-origin',
            headers: {
                'X-CSRF-TOKEN': config.csrf,
                'Accept': 'application/json',
            },
        },
    });

    registerSection(editor);
    registerColumn(editor);
    registerAllWidgets(editor);
    configureRTE(editor);
    editor.on('load', () => attachPasteFilter(editor.Canvas.getDocument()));
    initColoris();
    rebindColorisOnStyleChanges(editor);
    mountStylePanel(editor, document.getElementById('mp-style-panel'));
    registerStyleGroup(typographyGroup);
    registerStyleGroup(backgroundGroup);
    registerStyleGroup(layoutGroup);
    registerStyleGroup(spacingGroup);
    registerStyleGroup(sizingGroup);
    registerStyleGroup(borderGroup);
    registerStyleGroup(shadowGroup);

    registerAdvancedGroup((component) => {
        const style = component.getStyle();
        const margin = fourSideInput({
            values: {
                top:    parseFloat(style['margin-top']) || 0,
                right:  parseFloat(style['margin-right']) || 0,
                bottom: parseFloat(style['margin-bottom']) || 0,
                left:   parseFloat(style['margin-left']) || 0,
            },
            unit: 'px',
            units: ['px', '%', 'em', 'rem'],
            min: -500,
            linked: false,
            onChange: ({ top, right, bottom, left, unit }) => component.addStyle({
                'margin-top':    `${top}${unit}`,
                'margin-right':  `${right}${unit}`,
                'margin-bottom': `${bottom}${unit}`,
                'margin-left':   `${left}${unit}`,
            }),
        });

        const body = document.createElement('div');
        body.className = 'space-y-3 text-xs';
        const lbl = document.createElement('label');
        lbl.className = 'text-[10px] uppercase tracking-wide text-slate-500';
        lbl.textContent = 'Margin (T/R/B/L)';
        body.appendChild(lbl);
        body.appendChild(margin.el);

        return collapsibleGroup({ title: 'Spacing — margin', defaultOpen: true, children: [body] }).el;
    });

    registerAdvancedGroup((component) => {
        const wrap = document.createElement('div');
        wrap.className = 'p-3 space-y-2 text-xs';
        const lbl = document.createElement('label');
        lbl.className = 'text-[10px] uppercase tracking-wide text-slate-500';
        lbl.textContent = 'Custom CSS (key:value;...)';
        wrap.appendChild(lbl);

        const textarea = document.createElement('textarea');
        textarea.rows = 4;
        textarea.className = 'w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white font-mono';
        textarea.placeholder = 'e.g.  letter-spacing: 0.05em; opacity: 0.9;';
        textarea.addEventListener('blur', () => {
            const css = textarea.value;
            css.split(';').forEach((pair) => {
                const [k, v] = pair.split(':').map((s) => s?.trim());
                if (k && v) component.addStyle({ [k]: v });
            });
        });
        wrap.appendChild(textarea);

        return wrap;
    });

    // Initial content
    if (config.translation?.components) {
        editor.setComponents(config.translation.components);
    } else if (config.translation?.html) {
        editor.setComponents(config.translation.html);
    }
    if (config.translation?.styles) {
        editor.setStyle(config.translation.styles);
    } else if (config.translation?.css) {
        editor.setStyle(config.translation.css);
    }

    // ----- Save state -----
    const state = {
        currentLocale: config.locale,
        currentTitle: config.translation?.title ?? '(untitled)',
        currentSlug: config.page?.slug ?? null,
        currentStatus: config.page?.status ?? 'draft',
        isHomepage: !!config.page?.is_homepage,
        seo: { ...config.seo },
    };

    const indicator = document.getElementById('gjs-save-indicator');
    const statusBadge = document.getElementById('gjs-status-badge');
    const setIndicator = (text) => { if (indicator) indicator.textContent = text; };

    async function save({ statusOverride } = {}) {
        setIndicator('Saving…');
        const html = editor.getHtml();
        const css = editor.getCss();
        const components = editor.getComponents().toJSON();
        const styles = editor.getStyle().toJSON();

        const payload = {
            locale: state.currentLocale,
            title: state.currentTitle,
            slug: state.currentSlug,
            status: statusOverride ?? state.currentStatus,
            is_homepage: state.isHomepage,
            html,
            css,
            components_json: components,
            styles_json: styles,
            seo: state.seo,
        };

        try {
            const resp = await fetch(config.urls.save, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': config.csrf,
                },
                body: JSON.stringify(payload),
            });

            if (!resp.ok) {
                if (resp.status === 422) {
                    const body = await resp.json();
                    setIndicator(`Save failed: ${Object.values(body.errors || {}).flat().join(', ')}`);
                } else {
                    setIndicator(`Save failed (${resp.status})`);
                }
                return false;
            }

            const body = await resp.json();
            setIndicator('Saved ✓');
            window.setTimeout(() => setIndicator(''), 2000);

            if (body.redirect_url) {
                window.location.href = body.redirect_url;
                return true;
            }

            if (statusOverride) {
                state.currentStatus = statusOverride;
                if (statusBadge) {
                    statusBadge.textContent = statusOverride;
                    statusBadge.className = statusBadge.className.replace(/bg-\S+|text-\S+/g, '');
                    statusBadge.classList.add(
                        statusOverride === 'published' ? 'bg-emerald-100' : 'bg-slate-200',
                        statusOverride === 'published' ? 'text-emerald-800' : 'text-slate-700',
                        'px-2', 'py-0.5', 'rounded', 'text-xs',
                    );
                }
            }
            return true;
        } catch (err) {
            console.error('[MiniPress] save failed', err);
            setIndicator('Save failed (network)');
            return false;
        }
    }

    // ----- Auto-save: debounce on any change -----
    let saveTimer = null;
    const queueAutoSave = () => {
        if (saveTimer) window.clearTimeout(saveTimer);
        setIndicator('Unsaved changes');
        saveTimer = window.setTimeout(() => { save(); saveTimer = null; }, SAVE_DEBOUNCE_MS);
    };
    editor.on('component:add component:remove component:update style:update', queueAutoSave);

    // ----- Toolbar buttons -----
    document.getElementById('gjs-save-draft')?.addEventListener('click', () => save());
    document.getElementById('gjs-publish')?.addEventListener('click', async () => {
        const ok = await save({ statusOverride: 'published' });
        if (ok) setIndicator('Published ✓');
    });

    // ----- Locale switcher -----
    document.getElementById('gjs-locale')?.addEventListener('change', async (e) => {
        const newLocale = e.target.value;
        if (newLocale === state.currentLocale) return;
        const ok = await save();
        if (ok) {
            const url = new URL(window.location.href);
            url.searchParams.set('locale', newLocale);
            window.location.href = url.toString();
        }
    });

    // ----- Section picker -----
    document.getElementById('gjs-add-section')?.addEventListener('click', (e) => {
        openSectionPicker(editor, e.currentTarget);
    });

    // ----- Modal helpers -----
    bindModal(editor, state, config);

    // ----- Device switcher buttons -----
    const deviceButtons = document.querySelectorAll('[data-gjs-device]');
    const setActiveDevice = (name) => {
        editor.setDevice(name);
        deviceButtons.forEach((btn) => {
            const active = btn.dataset.gjsDevice === name;
            btn.classList.toggle('bg-slate-900', active);
            btn.classList.toggle('text-white', active);
            btn.classList.toggle('bg-slate-100', !active);
            btn.classList.toggle('text-slate-700', !active);
        });
    };
    deviceButtons.forEach((btn) => {
        btn.addEventListener('click', () => setActiveDevice(btn.dataset.gjsDevice));
    });
    // Start in Desktop mode
    setActiveDevice('Desktop');

    window.gjsEditor = editor;
    console.info('[MiniPress] editor ready', { pageId: config.page?.id, locale: config.locale });
});

function bindModal(editor, state, config) {
    document.querySelectorAll('[data-close]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.close;
            document.getElementById(id)?.classList.add('hidden');
        });
    });

    // Settings modal
    const settingsBtn = document.getElementById('gjs-settings');
    const settingsModal = document.getElementById('gjs-settings-modal');
    const settingsForm = document.getElementById('gjs-settings-form');
    const urlPreview = document.getElementById('gjs-url-preview');

    settingsBtn?.addEventListener('click', () => {
        if (!settingsForm) return;
        settingsForm.title.value = state.currentTitle;
        if (settingsForm.slug) settingsForm.slug.value = state.currentSlug ?? '';
        if (settingsForm.is_homepage) settingsForm.is_homepage.checked = !!state.isHomepage;
        settingsForm.status.value = state.currentStatus;
        updateUrlPreview();
        settingsModal?.classList.remove('hidden');
    });

    settingsForm?.addEventListener('input', () => {
        if (settingsForm.slug) {
            settingsForm.slug.value = slugify(settingsForm.slug.value);
        }
        updateUrlPreview();
    });

    function updateUrlPreview() {
        if (!urlPreview) return;
        const slug = settingsForm?.slug?.value || '';
        const isHome = !!settingsForm?.is_homepage?.checked;
        const locale = state.currentLocale;
        const localePart = locale === config.default_locale ? '' : `/${locale}`;
        const path = isHome ? `${localePart || '/'}` : `${localePart}/${slug}`;
        urlPreview.textContent = `Will be available at: ${window.location.origin}${path}`;
    }

    settingsForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(settingsForm);
        state.currentTitle = String(fd.get('title') || '').trim();
        if (settingsForm.slug) state.currentSlug = String(fd.get('slug') || '').trim() || null;
        state.currentStatus = String(fd.get('status') || 'draft');
        state.isHomepage = !!fd.get('is_homepage');
        settingsModal?.classList.add('hidden');
    });

    // SEO modal
    const seoBtn = document.getElementById('gjs-seo');
    const seoModal = document.getElementById('gjs-seo-modal');
    const seoTabs = document.getElementById('gjs-seo-tabs');
    const seoForm = document.getElementById('gjs-seo-form');
    const seoApply = document.getElementById('gjs-seo-apply');

    seoBtn?.addEventListener('click', () => {
        if (!seoTabs || !seoForm) return;
        seoTabs.innerHTML = '';
        config.locales.forEach((code, idx) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = code.toUpperCase();
            btn.className = 'px-3 py-2 border-b-2 border-transparent text-slate-600 hover:text-slate-900';
            btn.dataset.locale = code;
            if (idx === 0) btn.classList.add('border-slate-900', 'text-slate-900');
            btn.addEventListener('click', () => switchSeoTab(code));
            seoTabs.appendChild(btn);
        });
        switchSeoTab(config.locales[0]);
        seoModal?.classList.remove('hidden');
    });

    function switchSeoTab(locale) {
        if (!seoTabs || !seoForm) return;
        seoTabs.querySelectorAll('button').forEach(b => b.classList.remove('border-slate-900', 'text-slate-900'));
        const active = seoTabs.querySelector(`[data-locale="${locale}"]`);
        active?.classList.add('border-slate-900', 'text-slate-900');
        seoForm.dataset.activeLocale = locale;
        const s = state.seo[locale] || {};
        seoForm.innerHTML = `
            <div><label class="block mb-1">Meta title</label><input name="meta_title" class="w-full border rounded px-2 py-1" value="${escapeAttr(s.meta_title)}"></div>
            <div><label class="block mb-1">Meta description</label><textarea name="meta_description" rows="2" class="w-full border rounded px-2 py-1">${escapeText(s.meta_description)}</textarea></div>
            <div><label class="block mb-1">Meta keywords</label><input name="meta_keywords" class="w-full border rounded px-2 py-1" value="${escapeAttr(s.meta_keywords)}"></div>
            <div><label class="block mb-1">OG title</label><input name="og_title" class="w-full border rounded px-2 py-1" value="${escapeAttr(s.og_title)}"></div>
            <div><label class="block mb-1">OG description</label><textarea name="og_description" rows="2" class="w-full border rounded px-2 py-1">${escapeText(s.og_description)}</textarea></div>
            <div><label class="block mb-1">OG image URL</label><input name="og_image" class="w-full border rounded px-2 py-1" value="${escapeAttr(s.og_image)}"></div>
            <div><label class="block mb-1">Canonical URL</label><input name="canonical_url" class="w-full border rounded px-2 py-1" value="${escapeAttr(s.canonical_url)}"></div>
            <div><label class="block mb-1">Robots</label>
                <select name="robots" class="w-full border rounded px-2 py-1">
                    <option value="index,follow"  ${s.robots === 'index,follow'   ? 'selected' : ''}>index, follow</option>
                    <option value="noindex,follow"${s.robots === 'noindex,follow' ? 'selected' : ''}>noindex, follow</option>
                    <option value="index,nofollow"${s.robots === 'index,nofollow' ? 'selected' : ''}>index, nofollow</option>
                    <option value="noindex,nofollow"${s.robots === 'noindex,nofollow' ? 'selected' : ''}>noindex, nofollow</option>
                </select>
            </div>
            <div><label class="block mb-1">JSON-LD schema</label><textarea name="schema_json" rows="5" class="w-full border rounded px-2 py-1 font-mono text-xs">${escapeText(s.schema_json ? JSON.stringify(s.schema_json, null, 2) : '')}</textarea></div>
        `;
    }

    seoApply?.addEventListener('click', () => {
        if (!seoForm || !seoTabs) return;
        const locale = seoForm.dataset.activeLocale;
        if (!locale) return;
        const fd = new FormData(seoForm);
        const obj = {};
        for (const [k, v] of fd.entries()) obj[k] = v;
        if (obj.schema_json) {
            try { obj.schema_json = JSON.parse(obj.schema_json); }
            catch (e) { alert('JSON-LD schema is invalid JSON: ' + e.message); return; }
        } else {
            obj.schema_json = null;
        }
        state.seo[locale] = { ...(state.seo[locale] || {}), ...obj };
        seoModal?.classList.add('hidden');
    });
}

function slugify(s) {
    return String(s || '')
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

function escapeAttr(s) { return String(s ?? '').replace(/"/g, '&quot;'); }
function escapeText(s) { return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
