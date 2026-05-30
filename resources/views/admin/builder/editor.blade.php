@extends('layouts.editor')

@section('content')
@isset($globalStyle)
    @include('partials.global-styles-vars', ['globalStyle' => $globalStyle])
@endisset
<div class="h-screen flex flex-col bg-slate-950">
    <div class="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center gap-2 text-sm shrink-0 text-slate-200">
        <button id="mp-toggle-left" type="button"
            class="text-slate-400 hover:text-slate-100 transition p-1 -ml-1 rounded"
            title="Toggle widget panel" aria-pressed="true" aria-controls="mp-left-sidebar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <line x1="9" y1="3" x2="9" y2="21"/>
            </svg>
        </button>
        <a href="{{ $config['urls']['index'] }}" class="text-slate-400 hover:text-slate-100 transition">← Back to {{ ucfirst($page->type) }}s</a>
        <span class="mx-2 text-slate-700">|</span>
        <span class="font-mono text-slate-300">{{ $page->slug ?? '(' . $page->type . ')' }}</span>
        <span class="ms-2 text-xs px-2 py-0.5 rounded {{ $page->status === 'published' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-300' }}" id="gjs-status-badge">
            {{ $page->status }}
        </span>

        <div class="ms-auto flex items-center gap-2">
            <button id="gjs-add-section" type="button"
                aria-haspopup="dialog"
                aria-expanded="false"
                aria-controls="mp-section-picker"
                class="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded font-semibold transition">
                + Section
            </button>

            <div class="flex items-center gap-1 mr-2 bg-slate-800 rounded p-0.5">
                <button type="button" data-gjs-device="Desktop"
                    class="text-xs px-2 py-1 rounded text-slate-300 hover:bg-slate-700 transition"
                    title="Desktop view">Desktop</button>
                <button type="button" data-gjs-device="Tablet"
                    class="text-xs px-2 py-1 rounded text-slate-300 hover:bg-slate-700 transition"
                    title="Tablet view (768px)">Tablet</button>
                <button type="button" data-gjs-device="Mobile"
                    class="text-xs px-2 py-1 rounded text-slate-300 hover:bg-slate-700 transition"
                    title="Mobile view (375px)">Mobile</button>
            </div>

            <span id="gjs-save-indicator" class="text-xs text-slate-400 min-w-[80px] text-right"></span>

            <select id="gjs-locale" class="bg-slate-800 border border-slate-700 text-slate-200 rounded text-xs px-2 py-1 focus:border-blue-500 focus:outline-none">
                @foreach ($config['locales'] as $code)
                    <option value="{{ $code }}" @selected($code === $config['locale'])>{{ strtoupper($code) }}</option>
                @endforeach
            </select>

            <button id="gjs-settings" type="button" class="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-1 rounded transition">Settings</button>
            <button id="gjs-seo" type="button" class="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-1 rounded transition">SEO</button>

            <button id="gjs-save-draft" type="button" class="text-xs bg-slate-700 text-white hover:bg-slate-600 px-3 py-1.5 rounded transition">Save Draft</button>
            <button id="gjs-publish" type="button" class="text-xs bg-emerald-600 text-white hover:bg-emerald-500 px-3 py-1.5 rounded font-semibold transition">Publish</button>
        </div>
    </div>

    <div class="flex-1 flex min-h-0">
        <aside id="mp-left-sidebar" class="w-72 shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col min-h-0">
            <nav id="mp-left-tabs" class="flex border-b border-slate-800 shrink-0 text-xs font-medium">
                <button type="button" data-pane="widgets" class="flex-1 px-3 py-2 border-b-2 border-blue-500 text-blue-400 bg-slate-900 transition">Widgets</button>
                <button type="button" data-pane="layers"  class="flex-1 px-3 py-2 border-b-2 border-transparent text-slate-400 hover:text-slate-100 transition">Layers</button>
            </nav>
            <div id="mp-widget-panel" data-pane="widgets" class="flex-1 min-h-0 overflow-y-auto"></div>
            <div id="mp-layers-panel" data-pane="layers"  class="flex-1 min-h-0 overflow-y-auto hidden"></div>
        </aside>
        <div id="gjs" class="flex-1 min-w-0 overflow-hidden" data-config='@json($config)'></div>
        <aside id="mp-style-panel" class="w-80 shrink-0 bg-slate-900 border-l border-slate-800 overflow-y-auto">
            <div class="p-4 text-xs text-slate-400">
                Select an element on the canvas to edit its style.
            </div>
        </aside>
    </div>
</div>

<style>
    /* ===== GrapesJS default panel suppression ===== */
    .gjs-pn-views-container,
    .gjs-pn-views,
    .gjs-pn-options,
    .gjs-pn-devices-c,
    .gjs-pn-commands,
    .gjs-pn-panels {
        display: none !important;
    }
    .gjs-cv-canvas {
        width: 100% !important;
        right: 0 !important;
        top: 0 !important;
        height: 100% !important;
        background: rgb(15 23 42) !important;
    }
    .gjs-editor {
        height: 100% !important;
        background: rgb(15 23 42) !important;
    }
    .gjs-frame-wrapper {
        background: white !important;
    }

    /* ===== Left widget panel — dark theme ===== */
    #mp-widget-panel .gjs-blocks-c {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
        padding: 10px;
    }
    #mp-widget-panel .gjs-block {
        width: 100%;
        background: rgb(30 41 59);
        border: 1px solid rgb(51 65 85);
        border-radius: 6px;
        cursor: grab;
        padding: 14px 8px;
        text-align: center;
        font-size: 12px;
        color: rgb(203 213 225);
        min-height: 80px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        align-items: center;
        justify-content: center;
        transition: all .15s;
        box-sizing: border-box;
    }
    #mp-widget-panel .gjs-block:hover {
        border-color: rgb(59 130 246);
        background: rgb(51 65 85);
        color: white;
        transform: translateY(-1px);
    }
    #mp-widget-panel .gjs-block:active { cursor: grabbing; }
    #mp-widget-panel .gjs-block-label {
        font-size: 12px;
        font-weight: 500;
        line-height: 1.2;
    }
    #mp-widget-panel .gjs-block-category {
        background: rgb(15 23 42);
    }
    #mp-widget-panel .gjs-title {
        padding: 10px 14px;
        font-weight: 600;
        font-size: 10px;
        background: rgb(15 23 42);
        color: rgb(148 163 184);
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        text-transform: uppercase;
        letter-spacing: .08em;
        border-top: 1px solid rgb(30 41 59);
    }
    #mp-widget-panel .gjs-title::before {
        content: '▾';
        font-size: 9px;
        color: rgb(100 116 139);
    }
    #mp-widget-panel .gjs-block-categories {
        display: block;
    }
    #mp-widget-panel ::-webkit-scrollbar { width: 8px; }
    #mp-widget-panel ::-webkit-scrollbar-track { background: rgb(15 23 42); }
    #mp-widget-panel ::-webkit-scrollbar-thumb { background: rgb(51 65 85); border-radius: 4px; }

    /* ===== Layers (component tree) — dark theme ===== */
    #mp-layers-panel { color: rgb(203 213 225); font-size: 12px; }
    #mp-layers-panel ::-webkit-scrollbar { width: 8px; }
    #mp-layers-panel ::-webkit-scrollbar-track { background: rgb(15 23 42); }
    #mp-layers-panel ::-webkit-scrollbar-thumb { background: rgb(51 65 85); border-radius: 4px; }
    #mp-layers-panel .gjs-layer {
        background: transparent !important;
        color: rgb(203 213 225) !important;
        border-color: rgb(30 41 59) !important;
    }
    #mp-layers-panel .gjs-layer-item {
        background: transparent !important;
        color: rgb(203 213 225) !important;
        border-bottom: 1px solid rgb(30 41 59) !important;
    }
    #mp-layers-panel .gjs-layer-item:hover { background: rgb(30 41 59) !important; }
    #mp-layers-panel .gjs-layer.gjs-selected > .gjs-layer-item,
    #mp-layers-panel .gjs-layer-item.gjs-selected {
        background: rgb(37 99 235) !important;
        color: white !important;
    }
    #mp-layers-panel .gjs-layer-name { color: inherit !important; }
    #mp-layers-panel .gjs-layer-vis,
    #mp-layers-panel .gjs-layer-caret { color: rgb(148 163 184) !important; }
    #mp-layers-panel .gjs-layer-children { background: transparent !important; }
    #mp-layers-panel .gjs-layer-no-chld .gjs-layer-caret { visibility: hidden; }

    /* Left sidebar tab buttons */
    #mp-left-tabs button { background: rgb(15 23 42); }
    #mp-left-tabs button:hover:not(.border-blue-500) { background: rgb(30 41 59); }

    /* ===== Right style panel — dark theme ===== */
    #mp-style-panel { color: rgb(203 213 225); }
    #mp-style-panel ::-webkit-scrollbar { width: 8px; }
    #mp-style-panel ::-webkit-scrollbar-track { background: rgb(15 23 42); }
    #mp-style-panel ::-webkit-scrollbar-thumb { background: rgb(51 65 85); border-radius: 4px; }

    /* Header */
    #mp-style-panel > div.bg-white { background: rgb(30 41 59) !important; border-color: rgb(51 65 85) !important; }
    #mp-style-panel .text-slate-700 { color: rgb(226 232 240) !important; }
    #mp-style-panel .text-slate-400 { color: rgb(100 116 139) !important; }
    #mp-style-panel .text-slate-500 { color: rgb(148 163 184) !important; }
    #mp-style-panel .text-slate-600 { color: rgb(148 163 184) !important; }
    #mp-style-panel .text-slate-900 { color: rgb(241 245 249) !important; }

    /* Tab bar */
    #mp-style-panel nav.bg-white { background: rgb(30 41 59) !important; border-color: rgb(51 65 85) !important; }
    #mp-style-panel nav button { color: rgb(148 163 184) !important; }
    #mp-style-panel nav button.text-blue-600 { color: rgb(96 165 250) !important; }
    #mp-style-panel nav button:hover { background: rgb(51 65 85) !important; color: white !important; }

    /* Collapsible group borders */
    #mp-style-panel .border-b.border-slate-200,
    #mp-style-panel .border-slate-200 { border-color: rgb(51 65 85) !important; }

    /* Group header hover */
    #mp-style-panel button.hover\:bg-slate-50:hover { background: rgb(51 65 85) !important; }

    /* Form controls — inputs, selects, textareas */
    #mp-style-panel input[type="text"],
    #mp-style-panel input[type="number"],
    #mp-style-panel input[type="url"],
    #mp-style-panel select,
    #mp-style-panel textarea {
        background: rgb(15 23 42) !important;
        border-color: rgb(51 65 85) !important;
        color: rgb(226 232 240) !important;
    }
    #mp-style-panel input::placeholder,
    #mp-style-panel textarea::placeholder { color: rgb(100 116 139) !important; }
    #mp-style-panel input:focus,
    #mp-style-panel select:focus,
    #mp-style-panel textarea:focus { border-color: rgb(59 130 246) !important; outline: none; }

    /* Preset chips */
    #mp-style-panel .bg-white.text-slate-700 {
        background: rgb(30 41 59) !important;
        color: rgb(203 213 225) !important;
        border-color: rgb(51 65 85) !important;
    }
    #mp-style-panel button.bg-blue-500.text-white {
        background: rgb(37 99 235) !important;
        color: white !important;
        border-color: rgb(37 99 235) !important;
    }
    #mp-style-panel button.border-slate-300 { border-color: rgb(51 65 85) !important; }
    #mp-style-panel button.hover\:bg-slate-50:hover { background: rgb(51 65 85) !important; }

    /* Slider range — dark thumb */
    #mp-style-panel input[type="range"] { accent-color: rgb(59 130 246); }

    /* Color picker swatch border in dark theme */
    #mp-style-panel .border-slate-300 { border-color: rgb(51 65 85) !important; }

    /* Checkbox accent */
    #mp-style-panel input[type="checkbox"] { accent-color: rgb(59 130 246); }

    /* ===== Section picker popover — dark theme ===== */
    #mp-section-picker {
        background: rgb(30 41 59) !important;
        border-color: rgb(51 65 85) !important;
        color: rgb(226 232 240);
    }
    #mp-section-picker .text-slate-500,
    #mp-section-picker .text-slate-600,
    #mp-section-picker .text-slate-700 { color: rgb(203 213 225) !important; }
    #mp-section-picker button {
        background: rgb(15 23 42) !important;
        border-color: rgb(51 65 85) !important;
        color: rgb(203 213 225) !important;
    }
    #mp-section-picker button:hover {
        border-color: rgb(96 165 250) !important;
        background: rgb(30 41 59) !important;
    }
    #mp-section-picker button.border-blue-500 {
        border-color: rgb(59 130 246) !important;
        color: rgb(96 165 250) !important;
        background: transparent !important;
    }
    #mp-section-picker button.border-transparent {
        background: transparent !important;
        border-color: transparent !important;
    }

    /* ===== Link popover — dark theme ===== */
    #mp-link-popover {
        background: rgb(30 41 59) !important;
        border-color: rgb(51 65 85) !important;
        color: rgb(226 232 240);
    }
    #mp-link-popover input,
    #mp-link-popover select {
        background: rgb(15 23 42) !important;
        border-color: rgb(51 65 85) !important;
        color: rgb(226 232 240) !important;
    }
    #mp-link-popover .text-slate-500 { color: rgb(148 163 184) !important; }

    /* ===== Icon picker dropdown ===== */
    #mp-style-panel .bg-white.border-slate-200 {
        background: rgb(30 41 59) !important;
        border-color: rgb(51 65 85) !important;
    }

    /* ===== Lucide SVG color in dark panels ===== */
    #mp-widget-panel svg,
    #mp-style-panel .gjs-rte-action svg { color: currentColor; }

    /* ===== Editor canvas — improve component selection visibility on dark canvas-frame ===== */
    .gjs-selected { outline: 2px solid rgb(59 130 246) !important; outline-offset: -2px !important; }
    .gjs-hovered  { outline: 1px dashed rgb(96 165 250) !important; outline-offset: -1px !important; }

    /* Floating component toolbar */
    .gjs-toolbar {
        background: rgb(30 41 59) !important;
        border-radius: 4px !important;
    }
    .gjs-toolbar-item { color: rgb(203 213 225) !important; }
    .gjs-toolbar-item:hover { background: rgb(51 65 85) !important; }

    /* RTE toolbar restyle (dark) */
    .gjs-rte-actionbar {
        background: rgb(30 41 59) !important;
        border: 1px solid rgb(51 65 85) !important;
        border-radius: 6px !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, .4) !important;
        padding: 2px !important;
        gap: 0 !important;
    }
    .gjs-rte-action {
        color: rgb(203 213 225) !important;
        border-radius: 4px !important;
        min-width: 28px !important;
        height: 28px !important;
        padding: 0 6px !important;
        font-size: 12px !important;
        background: transparent !important;
    }
    .gjs-rte-action:hover { background: rgb(51 65 85) !important; color: white !important; }
    .gjs-rte-active { background: rgb(59 130 246) !important; color: white !important; }

    /* ===== Modals — keep light since they're focused content ===== */
    /* (settings + seo modals stay light by design) */
</style>

{{-- Settings modal --}}
<div id="gjs-settings-modal" class="hidden fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
    <div class="bg-slate-900 border border-slate-800 rounded-lg shadow-2xl w-full max-w-md text-slate-200">
        <div class="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
            <h3 class="font-semibold text-slate-100">Page Settings</h3>
            <button data-close="gjs-settings-modal" class="text-slate-500 hover:text-slate-200 text-xl leading-none">&times;</button>
        </div>
        <form id="gjs-settings-form" class="p-5 space-y-3 text-sm">
            <div>
                <label class="block mb-1 text-xs uppercase tracking-wide text-slate-400">Title</label>
                <input type="text" name="title" required class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-slate-200 focus:border-blue-500 focus:outline-none">
            </div>
            @if ($page->type === 'page')
                <div>
                    <label class="block mb-1 text-xs uppercase tracking-wide text-slate-400">Slug</label>
                    <input type="text" name="slug" required pattern="^[a-z0-9][a-z0-9-]*$" class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 font-mono text-slate-200 focus:border-blue-500 focus:outline-none">
                </div>
                <label class="flex items-center gap-2 text-slate-300">
                    <input type="checkbox" name="is_homepage" class="accent-blue-500"> Use as homepage
                </label>
            @endif
            <div>
                <label class="block mb-1 text-xs uppercase tracking-wide text-slate-400">Status</label>
                <select name="status" class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-slate-200 focus:border-blue-500 focus:outline-none">
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                </select>
            </div>
            <div class="text-xs text-slate-500" id="gjs-url-preview"></div>
            <div class="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button type="button" data-close="gjs-settings-modal" class="px-3 py-1.5 text-slate-300 hover:text-white">Cancel</button>
                <button type="submit" class="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded font-semibold transition">Apply</button>
            </div>
        </form>
    </div>
</div>

{{-- SEO modal --}}
<div id="gjs-seo-modal" class="hidden fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
    <div class="bg-slate-900 border border-slate-800 rounded-lg shadow-2xl w-full max-w-2xl text-slate-200">
        <div class="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
            <h3 class="font-semibold text-slate-100">SEO</h3>
            <button data-close="gjs-seo-modal" class="text-slate-500 hover:text-slate-200 text-xl leading-none">&times;</button>
        </div>
        <div class="border-b border-slate-800">
            <nav id="gjs-seo-tabs" class="flex text-sm px-4"></nav>
        </div>
        <form id="gjs-seo-form" class="p-5 space-y-3 text-sm max-h-[60vh] overflow-y-auto">
            {{-- Body is rendered by JS --}}
        </form>
        <div class="px-5 py-3 border-t border-slate-800 flex justify-end gap-2">
            <button type="button" data-close="gjs-seo-modal" class="px-3 py-1.5 text-slate-300 hover:text-white">Cancel</button>
            <button type="button" id="gjs-seo-apply" class="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded font-semibold transition">Apply</button>
        </div>
    </div>
</div>

<style>
    /* SEO modal inputs — match dark theme */
    #gjs-seo-form input,
    #gjs-seo-form textarea,
    #gjs-seo-form select {
        background: rgb(2 6 23) !important;
        border: 1px solid rgb(51 65 85) !important;
        color: rgb(226 232 240) !important;
    }
    #gjs-seo-form input:focus,
    #gjs-seo-form textarea:focus,
    #gjs-seo-form select:focus { border-color: rgb(59 130 246) !important; outline: none; }
    #gjs-seo-form label { color: rgb(148 163 184); }
    #gjs-seo-tabs button { color: rgb(148 163 184) !important; }
    #gjs-seo-tabs button.border-slate-900 {
        color: rgb(96 165 250) !important;
        border-color: rgb(59 130 246) !important;
    }
</style>
@endsection
