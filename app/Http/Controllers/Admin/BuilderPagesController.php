<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BuilderPage;
use App\Models\MediaItem;
use App\Support\HtmlSanitizer;
use App\Support\LocaleResolver;
use App\Support\WidgetRegistry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Vite;
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

    public function edit(int $id, Request $request): View
    {
        $page = BuilderPage::query()
            ->with(['translations', 'seo'])
            ->findOrFail($id);

        $defaultLocale = LocaleResolver::defaultCode();
        $locale = $request->query('locale', $defaultLocale);

        $activeCodes = LocaleResolver::activeCodes();
        if (! in_array($locale, $activeCodes, true)) {
            $locale = $defaultLocale;
        }

        $translation = $page->translationFor($locale)
            ?? $page->translations()->create([
                'locale' => $locale,
                'title' => $page->translations->first()?->title ?? '(untitled)',
                'html' => '',
                'css' => '',
            ]);

        // Ensure each active locale has at least an SEO row stub
        foreach ($activeCodes as $code) {
            if (! $page->seo->firstWhere('locale', $code)) {
                $page->seo()->create(['locale' => $code]);
            }
        }
        $page->load('seo');

        $config = [
            'csrf' => csrf_token(),
            'canvas_css_url' => Vite::asset('resources/css/app.css'),
            'page' => [
                'id' => $page->id,
                'type' => $page->type,
                'slug' => $page->slug,
                'status' => $page->status,
                'is_homepage' => $page->is_homepage,
            ],
            'locale' => $locale,
            'locales' => $activeCodes,
            'default_locale' => $defaultLocale,
            'translation' => [
                'title' => $translation->title,
                'html' => $translation->html,
                'css' => $translation->css,
                'components' => $translation->components_json,
                'styles' => $translation->styles_json,
            ],
            'seo' => $page->seo->keyBy('locale')->map(fn ($s) => [
                'meta_title' => $s->meta_title,
                'meta_description' => $s->meta_description,
                'meta_keywords' => $s->meta_keywords,
                'og_title' => $s->og_title,
                'og_description' => $s->og_description,
                'og_image' => $s->og_image,
                'canonical_url' => $s->canonical_url,
                'robots' => $s->robots,
                'schema_json' => $s->schema_json,
            ])->toArray(),
            'urls' => [
                // The save/publish/upload routes are added in Plan 2 Tasks 4 and 5. The edit
                // view will reference them via JSON config — if the user clicks Save before
                // those tasks ship, the JS will request a non-existent route and 404. That's
                // expected for the interim state.
                'save' => url('/admin/builder/' . $page->id),
                'publish' => url('/admin/builder/' . $page->id . '/publish'),
                'upload' => url('/admin/builder/assets'),
                'index' => route('admin.builder.index', ['type' => $page->type]),
            ],
        ];

        return view('admin.builder.editor', [
            'page' => $page,
            'config' => $config,
        ]);
    }

    public function update(int $id, Request $request): JsonResponse
    {
        $page = BuilderPage::findOrFail($id);

        $data = $request->validate([
            'locale' => ['required', 'string', 'max:8'],
            'title' => ['required', 'string', 'max:255'],
            'slug' => [
                Rule::requiredIf(fn () => $page->type === BuilderPage::TYPE_PAGE),
                'nullable',
                'string',
                'max:255',
                'regex:/^[a-z0-9][a-z0-9-]*$/',
                Rule::unique('builder_pages', 'slug')->ignore($page->id),
            ],
            'status' => ['required', Rule::in([BuilderPage::STATUS_DRAFT, BuilderPage::STATUS_PUBLISHED])],
            'is_homepage' => ['sometimes', 'boolean'],
            'html' => ['nullable', 'string'],
            'css' => ['nullable', 'string'],
            'components_json' => [
                'nullable',
                'array',
                function (string $attribute, mixed $value, \Closure $fail) {
                    if (! is_array($value)) {
                        return;
                    }
                    if (WidgetRegistry::hasInvalidRoots($value)) {
                        $fail('Page root must contain only mp-section components.');
                        return;
                    }
                    $unknown = WidgetRegistry::unknownTypesIn($value);
                    if (! empty($unknown)) {
                        $fail('Unknown component types: ' . implode(', ', $unknown));
                    }
                },
            ],
            'styles_json' => ['nullable', 'array'],
            'seo' => ['sometimes', 'array'],
            'seo.*.meta_title' => ['nullable', 'string', 'max:255'],
            'seo.*.meta_description' => ['nullable', 'string'],
            'seo.*.meta_keywords' => ['nullable', 'string', 'max:255'],
            'seo.*.og_title' => ['nullable', 'string', 'max:255'],
            'seo.*.og_description' => ['nullable', 'string'],
            'seo.*.og_image' => ['nullable', 'string', 'max:1024'],
            'seo.*.canonical_url' => ['nullable', 'string', 'max:1024'],
            'seo.*.robots' => ['nullable', 'string', 'max:64'],
            'seo.*.schema_json' => ['nullable', 'array'],
        ]);

        $slugChanged = ($page->type === BuilderPage::TYPE_PAGE)
            && array_key_exists('slug', $data)
            && $data['slug'] !== $page->slug;

        DB::transaction(function () use ($page, $data) {
            $page->update([
                'slug' => $page->type === BuilderPage::TYPE_PAGE ? ($data['slug'] ?? null) : null,
                'status' => $data['status'],
                'is_homepage' => $data['is_homepage'] ?? false,
                'published_at' => ($data['status'] === BuilderPage::STATUS_PUBLISHED && $page->published_at === null)
                    ? now()
                    : $page->published_at,
            ]);

            $sanitizedHtml = HtmlSanitizer::stripDocumentWrappers($data['html'] ?? '');

            $page->translations()->updateOrCreate(
                ['locale' => $data['locale']],
                [
                    'title' => $data['title'],
                    'html' => $sanitizedHtml,
                    'css' => $data['css'] ?? '',
                    'components_json' => $data['components_json'] ?? null,
                    'styles_json' => $data['styles_json'] ?? null,
                ],
            );

            foreach ($data['seo'] ?? [] as $locale => $seoData) {
                $page->seo()->updateOrCreate(
                    ['locale' => $locale],
                    array_merge(
                        ['robots' => 'index,follow'],
                        array_intersect_key($seoData, array_flip([
                            'meta_title', 'meta_description', 'meta_keywords',
                            'og_title', 'og_description', 'og_image',
                            'canonical_url', 'robots', 'schema_json',
                        ])),
                    ),
                );
            }
        });

        $response = [
            'ok' => true,
            'page' => [
                'id' => $page->id,
                'slug' => $page->slug,
                'status' => $page->status,
            ],
        ];

        if ($slugChanged) {
            $response['redirect_url'] = route('admin.builder.edit', $page->id) . '?locale=' . urlencode($data['locale']);
        }

        return response()->json($response);
    }

    public function publish(int $id): JsonResponse
    {
        $page = BuilderPage::findOrFail($id);

        $next = $page->status === BuilderPage::STATUS_PUBLISHED
            ? BuilderPage::STATUS_DRAFT
            : BuilderPage::STATUS_PUBLISHED;

        $update = ['status' => $next];
        if ($next === BuilderPage::STATUS_PUBLISHED && $page->published_at === null) {
            $update['published_at'] = now();
        }

        $page->update($update);

        return response()->json([
            'ok' => true,
            'status' => $page->status,
            'published_at' => $page->published_at?->toIso8601String(),
        ]);
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

    public function uploadAsset(Request $request): JsonResponse
    {
        $request->validate([
            'files'   => ['required', 'array'],
            'files.*' => ['file', 'image', 'max:10240'], // 10 MB
        ]);

        $assets = [];
        foreach ($request->file('files', []) as $file) {
            $path = $file->store('builder-assets', 'public');
            $url = url('/storage/' . $path);

            MediaItem::create([
                'filename' => $file->getClientOriginalName(),
                'mime_type' => $file->getMimeType(),
                'size' => $file->getSize(),
                'path' => $path,
                'url' => $url,
                'uploaded_by' => $request->user()?->id,
            ]);

            $assets[] = [
                'src' => $url,
                'name' => $file->getClientOriginalName(),
                'type' => 'image',
            ];
        }

        return response()->json(['data' => $assets]);
    }
}
