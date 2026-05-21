<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BuilderPage;
use App\Support\LocaleResolver;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\View\View;

class BuilderPagesController extends Controller
{
    public function index(Request $request): View
    {
        $type = $request->query('type', BuilderPage::TYPE_PAGE);
        if (! in_array($type, BuilderPage::TYPES, true)) {
            $type = BuilderPage::TYPE_PAGE;
        }

        $pages = BuilderPage::type($type)
            ->with('translations')
            ->orderByDesc('updated_at')
            ->paginate(25)
            ->withQueryString();

        return view('admin.builder.index', [
            'pages' => $pages,
            'type' => $type,
        ]);
    }

    public function create(Request $request): View
    {
        $type = $request->query('type', BuilderPage::TYPE_PAGE);
        if (! in_array($type, BuilderPage::TYPES, true)) {
            $type = BuilderPage::TYPE_PAGE;
        }

        return view('admin.builder.create', ['type' => $type]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'type' => ['required', Rule::in(BuilderPage::TYPES)],
            'title' => ['required', 'string', 'max:255'],
            'slug' => [
                Rule::requiredIf(fn () => $request->input('type') === BuilderPage::TYPE_PAGE),
                'nullable',
                'string',
                'max:255',
                'regex:/^[a-z0-9][a-z0-9-]*$/',
                Rule::unique('builder_pages', 'slug'),
            ],
        ]);

        $locale = LocaleResolver::defaultCode();

        $page = DB::transaction(function () use ($data, $locale) {
            $page = BuilderPage::create([
                'type' => $data['type'],
                'slug' => $data['type'] === BuilderPage::TYPE_PAGE ? $data['slug'] : null,
                'status' => BuilderPage::STATUS_DRAFT,
            ]);

            $page->translations()->create([
                'locale' => $locale,
                'title' => $data['title'],
                'html' => '',
                'css' => '',
            ]);

            $page->seo()->create([
                'locale' => $locale,
            ]);

            return $page;
        });

        return redirect()
            ->route('admin.builder.index', ['type' => $data['type']])
            ->with('status', "Created \"{$data['title']}\". Open it from the list to edit.");
    }

    public function destroy(int $id): RedirectResponse
    {
        $page = BuilderPage::findOrFail($id);
        $type = $page->type;
        $page->delete();

        return redirect()
            ->route('admin.builder.index', ['type' => $type])
            ->with('status', 'Deleted.');
    }
}
