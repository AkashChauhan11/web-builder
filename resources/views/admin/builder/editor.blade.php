@extends('layouts.editor')

@section('content')
<div class="h-screen flex flex-col">
    <div class="bg-white border-b px-4 py-2 flex items-center gap-2 text-sm shrink-0">
        <a href="{{ $config['urls']['index'] }}" class="text-slate-600 hover:underline">← Back to {{ ucfirst($page->type) }}s</a>
        <span class="mx-2 text-slate-300">|</span>
        <span class="font-mono text-slate-700">{{ $page->slug ?? '(' . $page->type . ')' }}</span>
        <span class="ms-2 text-xs px-2 py-0.5 rounded {{ $page->status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700' }}" id="gjs-status-badge">
            {{ $page->status }}
        </span>

        <div class="ms-auto flex items-center gap-2">
            <button id="gjs-add-section" type="button"
                class="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded font-semibold">
                + Section
            </button>

            <div class="flex items-center gap-1 mr-2">
                <button type="button" data-gjs-device="Desktop"
                    class="text-xs px-2 py-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-200"
                    title="Desktop view">Desktop</button>
                <button type="button" data-gjs-device="Tablet"
                    class="text-xs px-2 py-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-200"
                    title="Tablet view (768px)">Tablet</button>
                <button type="button" data-gjs-device="Mobile"
                    class="text-xs px-2 py-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-200"
                    title="Mobile view (375px)">Mobile</button>
            </div>

            <span id="gjs-save-indicator" class="text-xs text-slate-500"></span>

            <select id="gjs-locale" class="border rounded text-xs px-2 py-1">
                @foreach ($config['locales'] as $code)
                    <option value="{{ $code }}" @selected($code === $config['locale'])>{{ strtoupper($code) }}</option>
                @endforeach
            </select>

            <button id="gjs-settings" type="button" class="text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded">Settings</button>
            <button id="gjs-seo" type="button" class="text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded">SEO</button>

            <button id="gjs-save-draft" type="button" class="text-xs bg-slate-800 text-white hover:bg-slate-700 px-3 py-1 rounded">Save Draft</button>
            <button id="gjs-publish" type="button" class="text-xs bg-emerald-600 text-white hover:bg-emerald-500 px-3 py-1 rounded">Publish</button>
        </div>
    </div>

    <div id="gjs" class="flex-1 overflow-hidden" data-config='@json($config)'></div>
</div>

{{-- Settings modal --}}
<div id="gjs-settings-modal" class="hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
    <div class="bg-white rounded shadow-xl w-full max-w-md">
        <div class="px-4 py-3 border-b flex items-center justify-between">
            <h3 class="font-semibold">Page Settings</h3>
            <button data-close="gjs-settings-modal" class="text-slate-400 hover:text-slate-700">&times;</button>
        </div>
        <form id="gjs-settings-form" class="p-4 space-y-3 text-sm">
            <div>
                <label class="block mb-1">Title</label>
                <input type="text" name="title" required class="w-full border rounded px-2 py-1">
            </div>
            @if ($page->type === 'page')
                <div>
                    <label class="block mb-1">Slug</label>
                    <input type="text" name="slug" required pattern="^[a-z0-9][a-z0-9-]*$" class="w-full border rounded px-2 py-1 font-mono">
                </div>
                <label class="flex items-center gap-2">
                    <input type="checkbox" name="is_homepage"> Use as homepage
                </label>
            @endif
            <div>
                <label class="block mb-1">Status</label>
                <select name="status" class="w-full border rounded px-2 py-1">
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                </select>
            </div>
            <div class="text-xs text-slate-500" id="gjs-url-preview"></div>
            <div class="flex justify-end gap-2 pt-2">
                <button type="button" data-close="gjs-settings-modal" class="px-3 py-1">Cancel</button>
                <button type="submit" class="bg-slate-900 text-white px-3 py-1 rounded">Apply</button>
            </div>
        </form>
    </div>
</div>

{{-- SEO modal --}}
<div id="gjs-seo-modal" class="hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
    <div class="bg-white rounded shadow-xl w-full max-w-2xl">
        <div class="px-4 py-3 border-b flex items-center justify-between">
            <h3 class="font-semibold">SEO</h3>
            <button data-close="gjs-seo-modal" class="text-slate-400 hover:text-slate-700">&times;</button>
        </div>
        <div class="border-b">
            <nav id="gjs-seo-tabs" class="flex text-sm px-4"></nav>
        </div>
        <form id="gjs-seo-form" class="p-4 space-y-3 text-sm max-h-[60vh] overflow-y-auto">
            {{-- Body is rendered by JS --}}
        </form>
        <div class="px-4 py-3 border-t flex justify-end gap-2">
            <button type="button" data-close="gjs-seo-modal" class="px-3 py-1">Cancel</button>
            <button type="button" id="gjs-seo-apply" class="bg-slate-900 text-white px-3 py-1 rounded">Apply</button>
        </div>
    </div>
</div>
@endsection
