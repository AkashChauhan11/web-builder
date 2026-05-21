<?php

namespace App\Http\Controllers\Frontend;

use App\Http\Controllers\Controller;
use App\Models\BuilderPage;
use App\Support\LocaleResolver;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Cache;

class SitemapController extends Controller
{
    public function index(): Response
    {
        $xml = Cache::remember('builder.sitemap.xml', 3600, fn () => $this->buildXml());

        return response($xml, 200, ['Content-Type' => 'application/xml; charset=UTF-8']);
    }

    private function buildXml(): string
    {
        $default = LocaleResolver::defaultCode();

        $pages = BuilderPage::query()
            ->where('type', BuilderPage::TYPE_PAGE)
            ->published()
            ->with('translations')
            ->get();

        $lines = [];
        $lines[] = '<?xml version="1.0" encoding="UTF-8"?>';
        $lines[] = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">';

        foreach ($pages as $page) {
            $siblings = [];
            foreach ($page->translations as $t) {
                $siblings[] = [
                    'locale' => $t->locale,
                    'url' => $this->urlFor($t->locale, $page->slug, $default),
                ];
            }

            foreach ($page->translations as $t) {
                $loc = $this->urlFor($t->locale, $page->slug, $default);
                $lastmod = $t->updated_at?->toIso8601String() ?? now()->toIso8601String();
                $lines[] = '  <url>';
                $lines[] = '    <loc>'.htmlspecialchars($loc).'</loc>';
                $lines[] = '    <lastmod>'.htmlspecialchars($lastmod).'</lastmod>';
                foreach ($siblings as $sib) {
                    $lines[] = sprintf(
                        '    <xhtml:link rel="alternate" hreflang="%s" href="%s"/>',
                        htmlspecialchars($sib['locale']),
                        htmlspecialchars($sib['url']),
                    );
                }
                $lines[] = '  </url>';
            }
        }

        $lines[] = '</urlset>';
        return implode("\n", $lines);
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
