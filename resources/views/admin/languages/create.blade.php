@extends('layouts.admin')

@section('content')
<div class="bg-white rounded shadow max-w-md p-6">
    <h1 class="text-lg font-semibold mb-4">New Language</h1>

    <form method="POST" action="{{ route('admin.languages.store') }}" class="space-y-3">
        @csrf
        @include('admin.languages._fields', ['language' => null])
        <div class="flex justify-end gap-2 pt-2">
            <a href="{{ route('admin.languages.index') }}" class="px-3 py-2 text-sm">Cancel</a>
            <button type="submit" class="bg-slate-900 text-white px-4 py-2 rounded text-sm hover:bg-slate-700">Create</button>
        </div>
    </form>
</div>
@endsection
