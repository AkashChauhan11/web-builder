@extends('layouts.admin')

@section('content')
<div class="bg-white rounded shadow max-w-lg p-6">
    <h1 class="text-lg font-semibold mb-4">New {{ ucfirst($type) }}</h1>

    <form method="POST" action="{{ route('admin.builder.store') }}" class="space-y-3">
        @csrf
        <input type="hidden" name="type" value="{{ $type }}">

        <div>
            <label class="block text-sm mb-1" for="title">Title</label>
            <input id="title" name="title" required value="{{ old('title') }}"
                class="w-full border rounded px-3 py-2">
        </div>

        @if ($type === 'page')
            <div>
                <label class="block text-sm mb-1" for="slug">Slug</label>
                <input id="slug" name="slug" required value="{{ old('slug') }}"
                    pattern="^[a-z0-9][a-z0-9-]*$"
                    class="w-full border rounded px-3 py-2 font-mono">
                <p class="text-xs text-slate-500 mt-1">Lowercase letters, digits, and hyphens. Must start with a letter or digit.</p>
            </div>
        @endif

        <div class="flex justify-end gap-2 pt-2">
            <a href="{{ route('admin.builder.index', ['type' => $type]) }}" class="px-3 py-2 text-sm">Cancel</a>
            <button type="submit" class="bg-slate-900 text-white px-4 py-2 rounded text-sm hover:bg-slate-700">Create</button>
        </div>
    </form>
</div>
@endsection
