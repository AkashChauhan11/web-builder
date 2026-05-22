@extends('layouts.admin')

@section('content')
<div class="bg-white rounded shadow">
    <div class="p-4 border-b flex items-center">
        <h1 class="text-lg font-semibold flex-1">Users</h1>
        <a href="{{ route('admin.users.create') }}" class="bg-emerald-600 text-white px-3 py-1.5 rounded text-sm hover:bg-emerald-500">New User</a>
    </div>

    <table class="w-full text-sm">
        <thead class="bg-slate-50 text-left">
            <tr>
                <th class="p-3">Email</th>
                <th class="p-3">Name</th>
                <th class="p-3">Role</th>
                <th class="p-3 text-right">Actions</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($users as $user)
                <tr class="border-t">
                    <td class="p-3 font-mono text-xs">{{ $user->email }}</td>
                    <td class="p-3">{{ $user->name }}</td>
                    <td class="p-3">
                        <span class="text-xs px-2 py-0.5 rounded
                            {{ $user->role === 'admin' ? 'bg-red-100 text-red-800'
                              : ($user->role === 'developer' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700') }}">
                            {{ $user->role }}
                        </span>
                    </td>
                    <td class="p-3 text-right space-x-2 text-xs">
                        <a href="{{ route('admin.users.edit', $user->id) }}" class="text-slate-700 hover:underline">Edit</a>
                        @if (auth()->id() !== $user->id)
                            <form method="POST" action="{{ route('admin.users.destroy', $user->id) }}" class="inline"
                                  onsubmit="return confirm('Delete this user?');">
                                @csrf @method('DELETE')
                                <button type="submit" class="text-red-600 hover:underline">Delete</button>
                            </form>
                        @endif
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>
    <div class="p-3">{{ $users->links() }}</div>
</div>
@endsection
