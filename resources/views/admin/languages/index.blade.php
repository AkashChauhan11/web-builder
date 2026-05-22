@extends('layouts.admin')

@section('content')
<div class="bg-white rounded shadow">
    <div class="p-4 border-b flex items-center">
        <h1 class="text-lg font-semibold flex-1">Languages</h1>
        <a href="{{ route('admin.languages.create') }}" class="bg-emerald-600 text-white px-3 py-1.5 rounded text-sm hover:bg-emerald-500">New Language</a>
    </div>

    <table class="w-full text-sm">
        <thead class="bg-slate-50 text-left">
            <tr>
                <th class="p-3">Code</th>
                <th class="p-3">Name</th>
                <th class="p-3">Default</th>
                <th class="p-3">Active</th>
                <th class="p-3">Order</th>
                <th class="p-3 text-right">Actions</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($languages as $lang)
                <tr class="border-t">
                    <td class="p-3 font-mono">{{ $lang->code }}</td>
                    <td class="p-3">{{ $lang->name }}</td>
                    <td class="p-3">
                        @if ($lang->is_default)
                            <span class="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded">default</span>
                        @endif
                    </td>
                    <td class="p-3">
                        @if ($lang->is_active)
                            <span class="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">active</span>
                        @else
                            <span class="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded">inactive</span>
                        @endif
                    </td>
                    <td class="p-3 text-slate-500">{{ $lang->sort_order }}</td>
                    <td class="p-3 text-right space-x-2 text-xs">
                        <a href="{{ route('admin.languages.edit', $lang->id) }}" class="text-slate-700 hover:underline">Edit</a>
                        @if (! $lang->is_default)
                            <form method="POST" action="{{ route('admin.languages.destroy', $lang->id) }}" class="inline"
                                  onsubmit="return confirm('Delete this language?');">
                                @csrf @method('DELETE')
                                <button type="submit" class="text-red-600 hover:underline">Delete</button>
                            </form>
                        @endif
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>
    <div class="p-3">{{ $languages->links() }}</div>
</div>
@endsection
