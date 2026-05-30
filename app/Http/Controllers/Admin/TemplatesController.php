<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BuilderTemplate;
use App\Support\WidgetRegistry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class TemplatesController extends Controller
{
    public function index(): View
    {
        $templates = BuilderTemplate::query()
            ->orderByDesc('is_bundled')
            ->orderBy('name')
            ->with('creator:id,name,email')
            ->paginate(30);

        return view('admin.templates.index', [
            'templates' => $templates,
        ]);
    }

    /**
     * Returns a JSON list of templates, used by the editor's section picker Templates tab.
     */
    public function list(): JsonResponse
    {
        $templates = BuilderTemplate::query()
            ->orderByDesc('is_bundled')
            ->orderBy('name')
            ->get(['id', 'name', 'type', 'thumbnail_url', 'components_json', 'css', 'is_bundled']);

        return response()->json(['data' => $templates]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'in:section,page'],
            'thumbnail_url' => ['nullable', 'string', 'max:1024'],
            'components_json' => [
                'required',
                'array',
                function (string $attribute, mixed $value, \Closure $fail) {
                    if (! is_array($value)) {
                        return;
                    }
                    if (WidgetRegistry::hasMalformedNodes($value)) {
                        $fail('Template contains malformed component nodes.');
                        return;
                    }
                    $unknown = WidgetRegistry::unknownTypesIn($value);
                    if (! empty($unknown)) {
                        $fail('Unknown component types: ' . implode(', ', $unknown));
                    }
                },
            ],
            'css' => ['nullable', 'string'],
        ]);

        $template = BuilderTemplate::create([
            'name' => $data['name'],
            'type' => $data['type'],
            'thumbnail_url' => $data['thumbnail_url'] ?? null,
            'components_json' => $data['components_json'],
            'css' => $data['css'] ?? null,
            'created_by' => $request->user()?->id,
            'is_bundled' => false,
        ]);

        return response()->json([
            'ok' => true,
            'template' => $template,
        ]);
    }

    public function destroy(int $id): RedirectResponse|JsonResponse
    {
        $template = BuilderTemplate::findOrFail($id);

        if ($template->is_bundled) {
            $msg = 'Bundled templates cannot be deleted.';
            return request()->wantsJson()
                ? response()->json(['ok' => false, 'error' => $msg], 422)
                : redirect()->route('admin.templates.index')->withErrors(['template' => $msg]);
        }

        $template->delete();

        return request()->wantsJson()
            ? response()->json(['ok' => true])
            : redirect()->route('admin.templates.index')->with('status', 'Template deleted.');
    }
}
