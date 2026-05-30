@php
    $fields = $submission->data ?? [];
@endphp
<!doctype html>
<html>
<body style="font-family: system-ui, -apple-system, sans-serif; color: #0f172a; line-height: 1.5;">
    <h2 style="margin-top: 0">New form submission</h2>
    <p style="color: #64748b">Form: <strong>{{ $submission->form_name ?? $submission->form_id }}</strong></p>
    <p style="color: #64748b">Page: {{ $submission->page_url ?? 'unknown' }}</p>
    <p style="color: #64748b">Received: {{ $submission->created_at->toDayDateTimeString() }}</p>

    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 16px 0;">

    <table cellpadding="6" cellspacing="0" style="border-collapse: collapse; width: 100%;">
        @foreach ($fields as $key => $value)
            <tr>
                <td style="vertical-align: top; padding: 6px; background: #f8fafc; font-weight: 600; width: 30%; border-bottom: 1px solid #e2e8f0;">{{ $key }}</td>
                <td style="vertical-align: top; padding: 6px; border-bottom: 1px solid #e2e8f0;">{{ is_array($value) ? json_encode($value) : (string) $value }}</td>
            </tr>
        @endforeach
    </table>

    <p style="color: #94a3b8; font-size: 12px; margin-top: 16px;">
        IP: {{ $submission->ip_address ?? '—' }}<br>
        User agent: {{ \Illuminate\Support\Str::limit($submission->user_agent ?? '', 100) }}
    </p>
</body>
</html>
