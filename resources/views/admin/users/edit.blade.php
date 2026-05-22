@extends('layouts.admin')

@section('content')
<div class="bg-white rounded shadow max-w-md p-6">
    <h1 class="text-lg font-semibold mb-4">Edit User</h1>

    <form method="POST" action="{{ route('admin.users.update', $user->id) }}" class="space-y-3">
        @csrf @method('PUT')
        <div>
            <label class="block text-sm mb-1" for="name">Name</label>
            <input id="name" name="name" required value="{{ old('name', $user->name) }}" class="w-full border rounded px-3 py-2">
        </div>
        <div>
            <label class="block text-sm mb-1" for="email">Email</label>
            <input id="email" name="email" type="email" required value="{{ old('email', $user->email) }}" class="w-full border rounded px-3 py-2">
        </div>
        <div>
            <label class="block text-sm mb-1" for="password">New password (optional)</label>
            <input id="password" name="password" type="password" minlength="8" class="w-full border rounded px-3 py-2">
        </div>
        <div>
            <label class="block text-sm mb-1" for="password_confirmation">Confirm new password</label>
            <input id="password_confirmation" name="password_confirmation" type="password" minlength="8" class="w-full border rounded px-3 py-2">
        </div>
        <div>
            <label class="block text-sm mb-1" for="role">Role</label>
            <select id="role" name="role" class="w-full border rounded px-3 py-2">
                <option value="editor" @selected(old('role', $user->role)==='editor')>Editor</option>
                <option value="developer" @selected(old('role', $user->role)==='developer')>Developer</option>
                <option value="admin" @selected(old('role', $user->role)==='admin')>Admin</option>
            </select>
        </div>
        <div class="flex justify-end gap-2 pt-2">
            <a href="{{ route('admin.users.index') }}" class="px-3 py-2 text-sm">Cancel</a>
            <button type="submit" class="bg-slate-900 text-white px-4 py-2 rounded text-sm hover:bg-slate-700">Save</button>
        </div>
    </form>
</div>
@endsection
