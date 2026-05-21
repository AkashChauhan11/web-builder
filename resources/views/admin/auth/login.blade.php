@extends('layouts.admin')

@section('content')
<div class="w-full max-w-sm bg-white rounded shadow p-6">
    <h1 class="text-xl font-semibold mb-4">MiniPress Sign In</h1>

    @if ($errors->any())
        <div class="mb-3 rounded bg-red-100 text-red-800 p-2 text-sm">
            @foreach ($errors->all() as $err)
                <div>{{ $err }}</div>
            @endforeach
        </div>
    @endif

    <form method="POST" action="{{ route('admin.login.submit') }}" class="space-y-3">
        @csrf
        <div>
            <label class="block text-sm mb-1" for="email">Email</label>
            <input id="email" name="email" type="email" required autofocus
                value="{{ old('email') }}"
                class="w-full border rounded px-3 py-2">
        </div>
        <div>
            <label class="block text-sm mb-1" for="password">Password</label>
            <input id="password" name="password" type="password" required
                class="w-full border rounded px-3 py-2">
        </div>
        <label class="flex items-center gap-2 text-sm">
            <input type="checkbox" name="remember" value="1"> Remember me
        </label>
        <button type="submit" class="w-full bg-slate-900 text-white py-2 rounded hover:bg-slate-700">Sign in</button>
    </form>
</div>
@endsection
