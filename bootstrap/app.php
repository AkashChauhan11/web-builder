<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->redirectGuestsTo(fn () => route('admin.login'));
        $middleware->alias([
            'admin' => \App\Http\Middleware\EnsureUserIsAdmin::class,
        ]);
        // Public form submissions don't have a CSRF token (they're submitted from any visitor).
        // Anti-spam is handled via the honeypot field + minimum-time check in the controller.
        $middleware->validateCsrfTokens(except: [
            'forms/submit',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
