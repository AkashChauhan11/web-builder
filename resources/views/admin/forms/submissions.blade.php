@extends('layouts.admin')

@section('content')
<div class="max-w-6xl">
    <div class="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
            <h1 class="text-2xl font-bold">Form Submissions</h1>
            <p class="text-sm text-slate-600">All submissions across forms on your site.</p>
        </div>

        @if ($forms->isNotEmpty())
            <form method="GET" class="flex items-center gap-2 text-sm">
                <label class="text-slate-600">Filter:</label>
                <select name="form_id" onchange="this.form.submit()" class="border border-slate-300 rounded px-2 py-1">
                    <option value="">All forms</option>
                    @foreach ($forms as $form)
                        <option value="{{ $form->form_id }}" @selected($selectedFormId === $form->form_id)>
                            {{ $form->form_name ?? $form->form_id }}
                        </option>
                    @endforeach
                </select>
            </form>
        @endif
    </div>

    @if ($submissions->isEmpty())
        <div class="bg-white border border-slate-200 rounded p-8 text-center text-slate-500">
            No submissions yet. Publish a page with a Form widget and submit it to see results here.
        </div>
    @else
        <div class="bg-white border border-slate-200 rounded-lg divide-y divide-slate-200">
            @foreach ($submissions as $submission)
                <details class="group">
                    <summary class="px-4 py-3 cursor-pointer hover:bg-slate-50 flex items-center gap-3">
                        <span class="font-semibold text-slate-800">{{ $submission->form_name ?? $submission->form_id }}</span>
                        <span class="text-xs text-slate-500 truncate flex-1">{{ $submission->page_url }}</span>
                        <span class="text-xs text-slate-500 shrink-0">{{ $submission->created_at->diffForHumans() }}</span>
                    </summary>
                    <div class="px-4 pb-4 text-sm">
                        <table class="w-full">
                            @foreach ($submission->data ?? [] as $key => $value)
                                <tr>
                                    <td class="py-1 pr-3 font-medium text-slate-600 align-top w-1/4">{{ $key }}</td>
                                    <td class="py-1 text-slate-800 whitespace-pre-wrap break-words">{{ is_array($value) ? json_encode($value) : (string) $value }}</td>
                                </tr>
                            @endforeach
                        </table>
                        <div class="mt-3 text-xs text-slate-400">
                            IP: {{ $submission->ip_address ?? '—' }} · received {{ $submission->created_at->toDayDateTimeString() }}
                        </div>
                    </div>
                </details>
            @endforeach
        </div>

        <div class="mt-6">
            {{ $submissions->links() }}
        </div>
    @endif
</div>
@endsection
