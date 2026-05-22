<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ $title ?? 'MiniPress Editor' }}</title>
    @vite(['resources/css/app.css', 'resources/js/builder.js'])
    @stack('head')
</head>
<body class="bg-slate-100 h-screen overflow-hidden">
    @if ($errors->any())
        <div class="fixed top-4 right-4 z-50 rounded bg-red-100 text-red-800 p-3 text-sm shadow max-w-sm">
            <ul class="list-disc ms-5">
                @foreach ($errors->all() as $err)
                    <li>{{ $err }}</li>
                @endforeach
            </ul>
        </div>
    @endif

    @yield('content')
</body>
</html>
