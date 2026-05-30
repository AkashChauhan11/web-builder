<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\FormSubmission;
use Illuminate\Http\Request;
use Illuminate\View\View;

class FormSubmissionsController extends Controller
{
    public function index(Request $request): View
    {
        $query = FormSubmission::query()->orderByDesc('created_at');

        if ($formId = $request->query('form_id')) {
            $query->where('form_id', $formId);
        }

        $submissions = $query->paginate(20)->withQueryString();

        $forms = FormSubmission::query()
            ->select('form_id', 'form_name')
            ->groupBy('form_id', 'form_name')
            ->orderBy('form_name')
            ->get();

        return view('admin.forms.submissions', [
            'submissions' => $submissions,
            'forms' => $forms,
            'selectedFormId' => $formId,
        ]);
    }
}
