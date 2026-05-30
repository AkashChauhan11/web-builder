<?php

namespace App\Mail;

use App\Models\FormSubmission;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class FormSubmissionMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public FormSubmission $submission) {}

    public function envelope(): Envelope
    {
        $name = $this->submission->form_name ?? 'Form';
        return new Envelope(
            subject: "New submission — {$name}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.form-submission',
            with: ['submission' => $this->submission],
        );
    }
}
