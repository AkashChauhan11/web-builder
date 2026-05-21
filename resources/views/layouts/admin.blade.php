<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ $title ?? 'MiniPress Admin' }}</title>
    @vite(['resources/css/app.css'])
</head>
<body class="bg-slate-100 text-slate-800 min-h-screen">
@auth
    <div class="flex min-h-screen">
        <aside class="w-56 bg-slate-900 text-slate-100 flex flex-col">
            <div class="p-4 text-xl font-bold border-b border-slate-800">MiniPress</div>
            <nav class="flex-1 p-2 space-y-1 text-sm">
                <a href="{{ route('admin.builder.index', ['type' => 'page']) }}" class="block px-3 py-2 rounded hover:bg-slate-800">Pages</a>
                <a href="{{ route('admin.builder.index', ['type' => 'header']) }}" class="block px-3 py-2 rounded hover:bg-slate-800">Headers</a>
                <a href="{{ route('admin.builder.index', ['type' => 'footer']) }}" class="block px-3 py-2 rounded hover:bg-slate-800">Footers</a>
                <div class="border-t border-slate-800 my-2"></div>
                <a href="#" class="block px-3 py-2 rounded text-slate-500 cursor-not-allowed" title="Coming in Plan 3">Media</a>
                <a href="#" class="block px-3 py-2 rounded text-slate-500 cursor-not-allowed" title="Coming in Plan 3">Languages</a>
                <a href="#" class="block px-3 py-2 rounded text-slate-500 cursor-not-allowed" title="Coming in Plan 3">Users</a>
            </nav>
            <div class="p-3 border-t border-slate-800 text-xs text-slate-400">
                <div class="mb-2 truncate">{{ auth()->user()->email }}</div>
                <form method="POST" action="{{ route('admin.logout') }}">
                    @csrf
                    <button type="submit" class="text-slate-200 hover:text-white underline">Log out</button>
                </form>
            </div>
        </aside>

        <main class="flex-1 p-6">
            @if (session('status'))
                <div class="mb-4 rounded bg-green-100 text-green-800 p-3 text-sm">{{ session('status') }}</div>
            @endif
            @if ($errors->any())
                <div class="mb-4 rounded bg-red-100 text-red-800 p-3 text-sm">
                    <ul class="list-disc ms-5">
                        @foreach ($errors->all() as $err)
                            <li>{{ $err }}</li>
                        @endforeach
                    </ul>
                </div>
            @endif

            {{ $slot ?? '' }}
            @yield('content')
        </main>
    </div>
@else
    <div class="min-h-screen flex items-center justify-center p-4">
        {{ $slot ?? '' }}
        @yield('content')
    </div>
@endauth
</body>
</html>
