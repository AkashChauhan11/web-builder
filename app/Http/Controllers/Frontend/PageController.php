<?php

namespace App\Http\Controllers\Frontend;

use App\Http\Controllers\Controller;
use App\Models\BuilderPage;
use App\Support\LocaleResolver;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\View\View;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class PageController extends Controller
{
    /**
     * @return array{0:string,1:?string}
     */
    public function resolve(?string $first, ?string $second): array
    {
        $default = LocaleResolver::defaultCode();
        $altLocales = LocaleResolver::nonDefaultActiveCodes();

        if ($first === null && $second === null) {
            return [$default, null];
        }

        if ($second === null) {
            if (in_array($first, $altLocales, true)) {
                return [$first, null];
            }
            return [$default, $first];
        }

        if (in_array($first, $altLocales, true)) {
            return [$first, $second];
        }

        throw new NotFoundHttpException();
    }

    public function show(Request $request, ?string $first = null, ?string $second = null): View
    {
        [$locale, $slug] = $this->resolve($first, $second);

        $query = BuilderPage::query()
            ->where('type', BuilderPage::TYPE_PAGE)
            ->with(['translations', 'seo']);

        if ($slug === null) {
            $query->where('is_homepage', true);
        } else {
            $query->where('slug', $slug);
        }

        if (! Auth::check()) {
            $query->where('status', BuilderPage::STATUS_PUBLISHED);
        }

        $page = $query->first();
        if (! $page) {
            throw new NotFoundHttpException();
        }

        $default = LocaleResolver::defaultCode();
        $translation = $page->translationFor($locale, $default);
        $seo = $page->seoFor($locale, $default);

        if (! $translation) {
            throw new NotFoundHttpException();
        }

        // Latest published header + footer (with translations for this locale, falling back to default)
        $headerPage = BuilderPage::query()
            ->where('type', BuilderPage::TYPE_HEADER)
            ->published()
            ->with('translations')
            ->orderByDesc('updated_at')
            ->first();
        $header = $headerPage?->translationFor($locale, $default);

        $footerPage = BuilderPage::query()
            ->where('type', BuilderPage::TYPE_FOOTER)
            ->published()
            ->with('translations')
            ->orderByDesc('updated_at')
            ->first();
        $footer = $footerPage?->translationFor($locale, $default);

        // Build hreflang alternates
        $alternates = [];
        foreach ($page->translations as $t) {
            $alternates[] = [
                'locale' => $t->locale,
                'url' => $this->urlFor($t->locale, $page->slug, $default),
            ];
        }

        return view('layouts.app', [
            'page' => $page,
            'translation' => $translation,
            'seo' => $seo,
            'header' => $header,
            'footer' => $footer,
            'locale' => $locale,
            'alternates' => $alternates,
        ]);
    }

    private function urlFor(string $locale, ?string $slug, string $defaultLocale): string
    {
        $segments = [];
        if ($locale !== $defaultLocale) {
            $segments[] = $locale;
        }
        if ($slug !== null) {
            $segments[] = $slug;
        }
        return url('/' . implode('/', $segments));
    }
}
