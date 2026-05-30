# MiniPress Plan 10: Phase C/2 — Form Builder

> **Continuous execution preferred.** No subagent dispatches, no per-task stops. User commits the whole batch at the end.

**Goal:** Final piece of the Elementor Phase A spec. A form-builder widget pair that lets users drop forms into pages, configure field types + validation + email destinations, and view submissions in the admin. After this plan, the entire Phase A spec (and Plans 5-10) are delivered.

**Architecture:**

- **`mp-form`** is the parent widget — a `<form>` element with a unique `form_id` prop (auto-generated UUID), human-readable `name`, optional `notification_email`, a `submit_url` (defaults to `/forms/submit`), a `success_message`, and a `redirect_url`. Drop rules: only inside `mp-col`.
- **Field widgets** are child components of `mp-form`. Eight field types as a single `mp-form-field` component with a `type` prop:
  - `text`, `email`, `tel`, `url`, `number`, `textarea`, `select`, `checkbox`, `radio`
- Each field has props: `name` (the form-data key — required, must be unique within a form), `label`, `placeholder`, `required` (bool), `default_value`, `options` (for select/radio — array of `{ value, label }`), `min_length`, `max_length`.
- A `mp-form-submit` button is the submit row (a sub-type wrapping a styled button) — placed at the bottom of the form.
- **Server-side submission flow:**
  - Public route `POST /forms/submit` (NOT under admin auth)
  - Payload: `{ form_id, fields: { name: value, ... }, _honeypot: '', _ts: 1701234567 }`
  - Validation: required fields must be present, emails must validate, length constraints checked, honeypot must be empty, `_ts` must be at least 2 seconds before request time
  - On success: insert `FormSubmission` row, send email to `notification_email` (if set) via Laravel Mail, return `{ ok: true, redirect_url, success_message }`
  - On failure: return `{ ok: false, errors: {...} }` with 422
- **Anti-spam:** honeypot field named `_website_url` (hidden but real visible-to-bots input), time-based check (submission must take ≥2s).
- **Admin page** `/admin/forms/submissions`:
  - Paginated list of submissions across all forms
  - Each row shows: form name, page URL, submitted_at, expandable field values
  - Filterable by form_id
- **Public runtime** intercepts form submit, POSTs JSON, shows inline success message OR redirects.

**Tech stack additions:** none.

**Effort estimate:** ~5-7 days (8 tasks).

---

## File Map

### Created (PHP)
- `database/migrations/YYYY_MM_DD_create_form_submissions_table.php`
- `app/Models/FormSubmission.php`
- `app/Http/Controllers/FormSubmissionController.php` (public)
- `app/Http/Controllers/Admin/FormSubmissionsController.php` (admin)
- `app/Mail/FormSubmissionMail.php`
- `resources/views/mail/form-submission.blade.php`
- `resources/views/admin/forms/submissions.blade.php`
- `tests/Feature/FormSubmissionTest.php`

### Created (JS)
- `resources/js/builder/widgets/form.js` — mp-form parent + mp-form-field + mp-form-submit

### Modified
- `routes/web.php` — add `POST /forms/submit` (public) + admin `/forms/submissions` (index)
- `app/Support/WidgetRegistry.php` — add mp-form, mp-form-field, mp-form-submit
- `tests/Unit/WidgetRegistryTest.php` — bump count, add containment assertions
- `resources/views/layouts/admin.blade.php` — add Forms nav link
- `resources/js/builder/widgets/index.js` — register the new widget types + BLOCK_DEFS
- `resources/js/builder-runtime.js` — add form submit handler
- `resources/css/builder-runtime.css` — form widget base CSS

---

## Tasks

1. DB + models + WidgetRegistry types
2. mp-form, mp-form-field, mp-form-submit JS widgets
3. Public submission controller + validation + mail
4. Admin submissions page
5. Public runtime form handler
6. Form widget CSS
7. Feature tests for the submission endpoint
8. Build + final verify

---

## Plan 10 Acceptance Criteria

1. `form_submissions` table exists; `FormSubmission` model + relations work.
2. Three new widget types registered: `mp-form`, `mp-form-field`, `mp-form-submit` (34 total in `ALLOWED_TYPES`).
3. Dropping a Form widget creates a working form with editable fields.
4. Configuring `notification_email` + submitting on a published page sends an email and inserts a row.
5. Server-side validation rejects malformed submissions with field-keyed `errors`.
6. Honeypot trap + time check block obvious bot submissions.
7. `/admin/forms/submissions` shows all submissions paginated.
8. `php artisan test` green; `npm run build` clean.
