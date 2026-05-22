<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Language;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\View\View;

class LanguagesController extends Controller
{
    public function index(): View
    {
        $languages = Language::orderBy('sort_order')->orderBy('code')->paginate(25);

        return view('admin.languages.index', ['languages' => $languages]);
    }

    public function create(): View
    {
        return view('admin.languages.create');
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:8', Rule::unique('languages', 'code')],
            'is_default' => ['sometimes'],
            'is_active' => ['sometimes'],
            'sort_order' => ['nullable', 'integer'],
        ]);

        Language::create([
            'name' => $data['name'],
            'code' => strtolower($data['code']),
            'is_default' => $request->boolean('is_default'),
            'is_active' => $request->has('is_active') ? $request->boolean('is_active') : true,
            'sort_order' => (int) ($data['sort_order'] ?? 0),
        ]);

        return redirect()->route('admin.languages.index')->with('status', 'Language created.');
    }

    public function edit(int $id): View
    {
        $language = Language::findOrFail($id);

        return view('admin.languages.edit', ['language' => $language]);
    }

    public function update(int $id, Request $request): RedirectResponse
    {
        $language = Language::findOrFail($id);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:8', Rule::unique('languages', 'code')->ignore($language->id)],
            'is_default' => ['sometimes'],
            'is_active' => ['sometimes'],
            'sort_order' => ['nullable', 'integer'],
        ]);

        $language->update([
            'name' => $data['name'],
            'code' => strtolower($data['code']),
            'is_default' => $request->boolean('is_default'),
            'is_active' => $request->boolean('is_active'),
            'sort_order' => (int) ($data['sort_order'] ?? 0),
        ]);

        return redirect()->route('admin.languages.index')->with('status', 'Language updated.');
    }

    public function destroy(int $id): RedirectResponse
    {
        $language = Language::findOrFail($id);

        if ($language->is_default) {
            return redirect()->route('admin.languages.index')
                ->withErrors(['language' => 'Cannot delete the default language. Set a different default first.']);
        }

        $language->delete();

        return redirect()->route('admin.languages.index')->with('status', 'Language deleted.');
    }
}
