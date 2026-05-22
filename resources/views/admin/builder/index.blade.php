@extends('layouts.admin')

@php
    $labels = ['page' => 'Pages', 'header' => 'Headers', 'footer' => 'Footers'];
@endphp

@section('content')
<div class="bg-white rounded shadow">
    <div class="p-4 border-b flex items-center gap-2">
        <div class="flex gap-1 text-sm">
            @foreach ($labels as $key => $label)
                <a href="{{ route('admin.builder.index', ['type' => $key]) }}"
                    class="px-3 py-1 rounded {{ $type === $key ? 'bg-slate-900 text-white' : 'bg-slate-100 hover:bg-slate-200' }}">
                    {{ $label }}
                </a>
            @endforeach
        </div>
        <div class="ml-auto">
            <a href="{{ route('admin.builder.create', ['type' => $type]) }}"
                class="bg-emerald-600 text-white px-3 py-1.5 rounded text-sm hover:bg-emerald-500">
                New {{ rtrim($labels[$type], 's') }}
            </a>
        </div>
    </div>

    <table class="w-full text-sm">
        <thead class="bg-slate-50 text-left">
            <tr>
                <th class="p-3">Title</th>
                <th class="p-3">Slug</th>
                <th class="p-3">Status</th>
                <th class="p-3">Updated</th>
                <th class="p-3 text-right">Actions</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($pages as $page)
                <tr class="border-t">
                    <td class="p-3">
                        {{ optional($page->translations->first())->title ?? '(no title)' }}
                        @if ($page->is_homepage)
                            <span class="ms-2 text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">homepage</span>
                        @endif
                    </td>
                    <td class="p-3 font-mono text-xs">{{ $page->slug ?? '—' }}</td>
                    <td class="p-3">
                        <span class="text-xs px-2 py-0.5 rounded {{ $page->status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700' }}">
                            {{ $page->status }}
                        </span>
                    </td>
                    <td class="p-3 text-slate-500">{{ $page->updated_at?->diffForHumans() }}</td>
                    <td class="p-3 text-right space-x-2">
                        <a href="{{ route('admin.builder.edit', $page->id) }}" class="text-slate-700 hover:underline text-xs">Edit</a>
                        <form method="POST" action="{{ route('admin.builder.destroy', $page->id) }}" class="inline"
                              onsubmit="return confirm('Delete this {{ $page->type }}? This cascades translations and SEO.');">
                            @csrf
                            @method('DELETE')
                            <button type="submit" class="text-red-600 hover:underline text-xs">Delete</button>
                        </form>
                    </td>
                </tr>
            @empty
                <tr><td colspan="5" class="p-6 text-center text-slate-500">Nothing here yet.</td></tr>
            @endforelse
        </tbody>
    </table>
    <div class="p-3">{{ $pages->links() }}</div>
</div>
@endsection
