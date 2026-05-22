@extends('layouts.admin')

@section('content')
<div class="bg-white rounded shadow">
    <div class="p-4 border-b flex items-center gap-3">
        <h1 class="text-lg font-semibold flex-1">Media Library</h1>
        <form method="POST" action="{{ route('admin.media.store') }}" enctype="multipart/form-data" class="flex items-center gap-2">
            @csrf
            <input type="file" name="file" required accept="image/*" class="text-sm">
            <button type="submit" class="bg-emerald-600 text-white px-3 py-1.5 rounded text-sm hover:bg-emerald-500">Upload</button>
        </form>
    </div>

    @if ($items->isEmpty())
        <div class="p-10 text-center text-slate-500">No media yet. Upload your first image above.</div>
    @else
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4">
            @foreach ($items as $item)
                <div class="border rounded overflow-hidden">
                    <a href="{{ $item->url }}" target="_blank" class="block aspect-square bg-slate-100 overflow-hidden">
                        <img src="{{ $item->url }}" alt="{{ $item->alt_text ?? $item->filename }}" class="object-cover w-full h-full">
                    </a>
                    <div class="p-2 text-xs">
                        <div class="font-mono truncate" title="{{ $item->filename }}">{{ $item->filename }}</div>
                        <form method="POST" action="{{ route('admin.media.update', $item->id) }}" class="mt-1">
                            @csrf
                            @method('PATCH')
                            <input type="text" name="alt_text" value="{{ $item->alt_text }}" placeholder="Alt text"
                                class="w-full border rounded px-1 py-0.5 text-xs"
                                onblur="this.form.requestSubmit()">
                        </form>
                        <form method="POST" action="{{ route('admin.media.destroy', $item->id) }}" class="mt-1"
                              onsubmit="return confirm('Delete this asset?');">
                            @csrf
                            @method('DELETE')
                            <button type="submit" class="text-red-600 hover:underline">Delete</button>
                        </form>
                    </div>
                </div>
            @endforeach
        </div>
        <div class="p-3">{{ $items->links() }}</div>
    @endif
</div>
@endsection
