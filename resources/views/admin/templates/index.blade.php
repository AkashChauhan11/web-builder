@extends('layouts.admin')

@section('content')
<div class="max-w-6xl">
    <div class="flex items-center justify-between mb-6">
        <div>
            <h1 class="text-2xl font-bold">Templates</h1>
            <p class="text-sm text-slate-600">Reusable page and section templates. Save from the editor with the ★ button on any section.</p>
        </div>
    </div>

    @if ($templates->isEmpty())
        <div class="bg-white border border-slate-200 rounded p-8 text-center text-slate-500">
            No templates yet. Open the editor, build a section, and click the ★ button to save it as a template.
        </div>
    @else
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            @foreach ($templates as $template)
                <div class="bg-white border border-slate-200 rounded-lg overflow-hidden">
                    <div class="aspect-video bg-slate-100 grid place-items-center text-slate-400 text-sm">
                        @if ($template->thumbnail_url)
                            <img src="{{ $template->thumbnail_url }}" alt="{{ $template->name }}" class="w-full h-full object-cover">
                        @else
                            <span class="text-3xl">📄</span>
                        @endif
                    </div>
                    <div class="p-4">
                        <div class="flex items-start justify-between gap-2 mb-1">
                            <h3 class="font-semibold text-slate-800 truncate">{{ $template->name }}</h3>
                            @if ($template->is_bundled)
                                <span class="text-[10px] uppercase tracking-wide bg-blue-100 text-blue-800 px-2 py-0.5 rounded shrink-0">Bundled</span>
                            @endif
                        </div>
                        <div class="text-xs text-slate-500 mb-3">
                            {{ ucfirst($template->type) }}
                            @if ($template->creator)
                                · by {{ $template->creator->name ?? $template->creator->email }}
                            @endif
                        </div>
                        @if (! $template->is_bundled)
                            <form method="POST" action="{{ route('admin.templates.destroy', $template->id) }}" onsubmit="return confirm('Delete this template?');">
                                @csrf
                                @method('DELETE')
                                <button type="submit" class="text-xs text-red-600 hover:text-red-800">Delete</button>
                            </form>
                        @endif
                    </div>
                </div>
            @endforeach
        </div>

        <div class="mt-6">
            {{ $templates->links() }}
        </div>
    @endif
</div>
@endsection
