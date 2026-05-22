@extends('layouts.admin')

@section('content')
<div class="bg-white rounded shadow max-w-md p-6">
    <h1 class="text-lg font-semibold mb-4">New User</h1>

    <form method="POST" action="{{ route('admin.users.store') }}" class="space-y-3">
        @csrf
        <div>
            <label class="block text-sm mb-1" for="name">Name</label>
            <input id="name" name="name" required value="{{ old('name') }}" class="w-full border rounded px-3 py-2">
        </div>
        <div>
            <label class="block text-sm mb-1" for="email">Email</label>
            <input id="email" name="email" type="email" required value="{{ old('email') }}" class="w-full border rounded px-3 py-2">
        </div>
        <div>
            <label class="block text-sm mb-1" for="password">Password</label>
            <input id="password" name="password" type="password" required minlength="8" class="w-full border rounded px-3 py-2">
        </div>
        <div>
            <label class="block text-sm mb-1" for="password_confirmation">Confirm password</label>
            <input id="password_confirmation" name="password_confirmation" type="password" required minlength="8" class="w-full border rounded px-3 py-2">
        </div>
        <div>
            <label class="block text-sm mb-1" for="role">Role</label>
            <select id="role" name="role" class="w-full border rounded px-3 py-2">
                <option value="editor" @selected(old('role')==='editor')>Editor</option>
                <option value="developer" @selected(old('role')==='developer')>Developer</option>
                <option value="admin" @selected(old('role')==='admin')>Admin</option>
            </select>
        </div>
        <div class="flex justify-end gap-2 pt-2">
            <a href="{{ route('admin.users.index') }}" class="px-3 py-2 text-sm">Cancel</a>
            <button type="submit" class="bg-slate-900 text-white px-4 py-2 rounded text-sm hover:bg-slate-700">Create</button>
        </div>
    </form>
</div>
@endsection
