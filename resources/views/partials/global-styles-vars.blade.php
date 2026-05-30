{{-- Emits CSS custom properties from the GlobalStyle singleton.
     Used by both the public layout and the editor canvas. --}}
@php
    $c = $globalStyle->colors ?? [];
    $t = $globalStyle->typography ?? [];
    $tH1 = $t['h1'] ?? [];
    $tH2 = $t['h2'] ?? [];
    $tH3 = $t['h3'] ?? [];
    $tBody = $t['body'] ?? [];
@endphp
<style>
    :root {
        --mp-color-primary:    {{ $c['primary']    ?? '#3b82f6' }};
        --mp-color-secondary:  {{ $c['secondary']  ?? '#1e293b' }};
        --mp-color-accent:     {{ $c['accent']     ?? '#10b981' }};
        --mp-color-text:       {{ $c['text']       ?? '#0f172a' }};
        --mp-color-bg:         {{ $c['background'] ?? '#ffffff' }};
        --mp-color-muted:      {{ $c['muted']      ?? '#64748b' }};

        --mp-h1-family: {{ $tH1['font_family'] ?? 'system-ui, sans-serif' }};
        --mp-h1-size:   {{ ($tH1['font_size'] ?? 48) }}px;
        --mp-h1-weight: {{ $tH1['font_weight'] ?? 700 }};
        --mp-h1-line:   {{ $tH1['line_height'] ?? 1.2 }};

        --mp-h2-family: {{ $tH2['font_family'] ?? 'system-ui, sans-serif' }};
        --mp-h2-size:   {{ ($tH2['font_size'] ?? 36) }}px;
        --mp-h2-weight: {{ $tH2['font_weight'] ?? 700 }};
        --mp-h2-line:   {{ $tH2['line_height'] ?? 1.25 }};

        --mp-h3-family: {{ $tH3['font_family'] ?? 'system-ui, sans-serif' }};
        --mp-h3-size:   {{ ($tH3['font_size'] ?? 24) }}px;
        --mp-h3-weight: {{ $tH3['font_weight'] ?? 600 }};
        --mp-h3-line:   {{ $tH3['line_height'] ?? 1.3 }};

        --mp-body-family: {{ $tBody['font_family'] ?? 'system-ui, sans-serif' }};
        --mp-body-size:   {{ ($tBody['font_size'] ?? 16) }}px;
        --mp-body-weight: {{ $tBody['font_weight'] ?? 400 }};
        --mp-body-line:   {{ $tBody['line_height'] ?? 1.6 }};
    }
</style>
