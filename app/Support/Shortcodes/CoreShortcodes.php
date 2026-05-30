<?php

namespace App\Support\Shortcodes;

use App\Support\ShortcodeRenderer;
use Illuminate\Support\Facades\Auth;

class CoreShortcodes
{
    public static function register(): void
    {
        ShortcodeRenderer::register('site_name', function () {
            return e(config('app.name', 'MiniPress'));
        });

        ShortcodeRenderer::register('year', function () {
            return (string) now()->year;
        });

        ShortcodeRenderer::register('today', function (string $params = '') {
            $format = match (trim($params)) {
                'short' => 'M j, Y',
                'long' => 'F j, Y',
                'iso' => 'Y-m-d',
                '' => 'F j, Y',
                default => trim($params),
            };
            return now()->format($format);
        });

        ShortcodeRenderer::register('user_email', function () {
            return e(Auth::user()?->email ?? '');
        });
    }
}
