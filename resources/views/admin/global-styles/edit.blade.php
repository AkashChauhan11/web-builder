@extends('layouts.admin')

@section('content')
<div class="max-w-3xl">
    <div class="flex items-center justify-between mb-6">
        <div>
            <h1 class="text-2xl font-bold">Global Styles</h1>
            <p class="text-sm text-slate-600">Site-wide colors and typography. Widgets reference these by default.</p>
        </div>
    </div>

    <form method="POST" action="{{ route('admin.global-styles.update') }}" class="space-y-8 bg-white rounded-lg shadow border border-slate-200 p-6">
        @csrf
        @method('PUT')

        {{-- COLORS --}}
        <section>
            <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">Colors</h2>
            <div class="grid grid-cols-2 gap-4">
                @foreach (['primary' => 'Primary', 'secondary' => 'Secondary', 'accent' => 'Accent', 'text' => 'Text', 'background' => 'Background', 'muted' => 'Muted'] as $key => $label)
                    <div>
                        <label class="block text-xs font-medium text-slate-700 mb-1">{{ $label }}</label>
                        <div class="flex items-center gap-2">
                            <span class="w-8 h-8 rounded border border-slate-300 shrink-0" style="background: {{ $style->colors[$key] ?? '#000000' }}" data-swatch-for="colors[{{ $key }}]"></span>
                            <input type="text" name="colors[{{ $key }}]" value="{{ old('colors.' . $key, $style->colors[$key] ?? '#000000') }}" data-coloris pattern="^#[0-9a-fA-F]{6}$" required class="flex-1 min-w-0 px-2 py-1 text-sm border border-slate-300 rounded font-mono">
                        </div>
                    </div>
                @endforeach
            </div>
        </section>

        {{-- TYPOGRAPHY --}}
        <section>
            <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">Typography</h2>
            <div class="space-y-5">
                @foreach (['h1' => 'Heading 1', 'h2' => 'Heading 2', 'h3' => 'Heading 3', 'body' => 'Body'] as $key => $label)
                    @php($preset = $style->typography[$key] ?? ['font_family' => 'system-ui, -apple-system, sans-serif', 'font_size' => 16, 'font_weight' => 400, 'line_height' => 1.5])
                    <div class="border border-slate-200 rounded p-4">
                        <h3 class="font-semibold mb-3 text-slate-800">{{ $label }}</h3>
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block text-xs text-slate-600 mb-1">Font family</label>
                                <input type="text" name="typography[{{ $key }}][font_family]" value="{{ old('typography.' . $key . '.font_family', $preset['font_family']) }}" required class="w-full px-2 py-1 text-sm border border-slate-300 rounded">
                            </div>
                            <div>
                                <label class="block text-xs text-slate-600 mb-1">Font size (px)</label>
                                <input type="number" name="typography[{{ $key }}][font_size]" value="{{ old('typography.' . $key . '.font_size', $preset['font_size']) }}" min="8" max="200" required class="w-full px-2 py-1 text-sm border border-slate-300 rounded">
                            </div>
                            <div>
                                <label class="block text-xs text-slate-600 mb-1">Font weight</label>
                                <select name="typography[{{ $key }}][font_weight]" required class="w-full px-2 py-1 text-sm border border-slate-300 rounded">
                                    @foreach ([300, 400, 500, 600, 700, 800, 900] as $w)
                                        <option value="{{ $w }}" @selected((int) old('typography.' . $key . '.font_weight', $preset['font_weight']) === $w)>{{ $w }}</option>
                                    @endforeach
                                </select>
                            </div>
                            <div>
                                <label class="block text-xs text-slate-600 mb-1">Line height</label>
                                <input type="number" step="0.05" name="typography[{{ $key }}][line_height]" value="{{ old('typography.' . $key . '.line_height', $preset['line_height']) }}" min="0.5" max="5" required class="w-full px-2 py-1 text-sm border border-slate-300 rounded">
                            </div>
                        </div>
                    </div>
                @endforeach
            </div>
        </section>

        <div class="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <button type="submit" class="bg-slate-900 hover:bg-slate-700 text-white px-4 py-2 rounded font-semibold">Save Changes</button>
        </div>
    </form>
</div>

@push('head')
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/mdbassit/Coloris@latest/dist/coloris.min.css">
<script src="https://cdn.jsdelivr.net/gh/mdbassit/Coloris@latest/dist/coloris.min.js" defer></script>
<script defer>
document.addEventListener('DOMContentLoaded', () => {
    if (typeof Coloris !== 'undefined') {
        Coloris({ themeMode: 'light', format: 'hex', alpha: false });
    }
    // Live preview of color swatches
    document.querySelectorAll('input[data-coloris]').forEach((input) => {
        input.addEventListener('input', () => {
            const target = document.querySelector(`[data-swatch-for="${input.name}"]`);
            if (target) target.style.background = input.value;
        });
    });
});
</script>
@endpush
@endsection
