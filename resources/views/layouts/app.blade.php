<!doctype html>
<html lang="{{ $locale }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>{{ $seo?->meta_title ?? $translation->title }}</title>

    @if ($seo?->meta_description)
        <meta name="description" content="{{ $seo?->meta_description }}">
    @endif
    @if ($seo?->meta_keywords)
        <meta name="keywords" content="{{ $seo?->meta_keywords }}">
    @endif
    <meta name="robots" content="{{ $seo?->robots ?? 'index,follow' }}">

    <link rel="canonical" href="{{ $seo?->canonical_url ?? url()->current() }}">

    @foreach ($alternates as $alt)
        <link rel="alternate" hreflang="{{ $alt['locale'] }}" href="{{ $alt['url'] }}">
    @endforeach

    <meta property="og:title" content="{{ $seo?->og_title ?? $seo?->meta_title ?? $translation->title }}">
    <meta property="og:description" content="{{ $seo?->og_description ?? $seo?->meta_description }}">
    @if ($seo?->og_image)
        <meta property="og:image" content="{{ $seo?->og_image }}">
    @endif
    <meta property="og:url" content="{{ url()->current() }}">

    @if ($seo?->schema_json)
        <script type="application/ld+json">@json($seo->schema_json)</script>
    @endif

    @vite(['resources/css/app.css', 'resources/js/builder-runtime.js'])

    @isset($globalStyle)
        @include('partials.global-styles-vars', ['globalStyle' => $globalStyle])
    @endisset

    <style>{!! $translation->css ?? '' !!}</style>
    @if ($header)
        <style>{!! $header->css ?? '' !!}</style>
    @endif
    @if ($footer)
        <style>{!! $footer->css ?? '' !!}</style>
    @endif
</head>
<body>
    @if ($header)
        {!! \App\Support\ShortcodeRenderer::replace(str_replace('{{LOCALE_PREFIX}}', $localePrefix ?? '', $header->html ?? '')) !!}
    @endif

    <main>
        {!! \App\Support\ShortcodeRenderer::replace(str_replace('{{LOCALE_PREFIX}}', $localePrefix ?? '', $translation->html ?? '')) !!}
    </main>

    @if ($footer)
        {!! \App\Support\ShortcodeRenderer::replace(str_replace('{{LOCALE_PREFIX}}', $localePrefix ?? '', $footer->html ?? '')) !!}
    @endif
</body>
</html>
