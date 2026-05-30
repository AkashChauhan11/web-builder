<?php

namespace App\Http\Controllers;

use App\Mail\FormSubmissionMail;
use App\Models\FormSubmission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class FormSubmissionController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'form_id' => ['required', 'string', 'max:64'],
            'form_name' => ['nullable', 'string', 'max:255'],
            'page_url' => ['nullable', 'string', 'max:1024'],
            'notification_email' => ['nullable', 'email', 'max:255'],
            'fields' => ['required', 'array'],
            '_honeypot' => ['nullable', 'string', 'max:0'],
            '_ts' => ['required', 'integer'],
        ]);

        // Honeypot — must be empty
        if (! empty($request->input('_honeypot'))) {
            return response()->json(['ok' => true]); // silently pretend success
        }

        // Time check — submission must take at least 2 seconds
        $ts = (int) $request->input('_ts');
        if ($ts > 0 && (time() - $ts) < 2) {
            return response()->json(['ok' => true]);
        }

        // Strip internal underscore-prefixed fields before storing
        $fields = collect($data['fields'])
            ->reject(fn ($v, $k) => str_starts_with((string) $k, '_'))
            ->toArray();

        $submission = FormSubmission::create([
            'form_id' => $data['form_id'],
            'form_name' => $data['form_name'] ?? null,
            'page_url' => $data['page_url'] ?? $request->headers->get('Referer'),
            'ip_address' => $request->ip(),
            'user_agent' => substr((string) $request->userAgent(), 0, 1024),
            'data' => $fields,
        ]);

        if (! empty($data['notification_email']) && config('mail.default') !== 'log' || ! empty($data['notification_email'])) {
            try {
                Mail::to($data['notification_email'])->send(new FormSubmissionMail($submission));
            } catch (\Throwable $e) {
                // Don't fail the submission if the mailer is unconfigured. Logged for debugging.
                report($e);
            }
        }

        return response()->json([
            'ok' => true,
            'submission_id' => $submission->id,
        ]);
    }
}
