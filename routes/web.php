<?php

use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\BuilderPagesController;
use App\Http\Controllers\Frontend\PageController;
use App\Http\Controllers\Frontend\SitemapController;
use Illuminate\Support\Facades\Route;

// ---- Admin auth ----
Route::middleware('guest')->group(function () {
    Route::get('/admin/login', [AuthController::class, 'showLoginForm'])->name('admin.login');
    Route::post('/admin/login', [AuthController::class, 'login'])->name('admin.login.submit');
});

Route::post('/admin/logout', [AuthController::class, 'logout'])
    ->middleware('auth')
    ->name('admin.logout');

// ---- Admin (protected) ----
Route::middleware(['auth', 'admin'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get('/', fn () => redirect()->route('admin.builder.index'));
        Route::get('/builder', [BuilderPagesController::class, 'index'])->name('builder.index');
        Route::get('/builder/create', [BuilderPagesController::class, 'create'])->name('builder.create');
        Route::post('/builder', [BuilderPagesController::class, 'store'])->name('builder.store');
        Route::delete('/builder/{id}', [BuilderPagesController::class, 'destroy'])->name('builder.destroy');
        // edit/update/publish/uploadAsset are added in Plan 2
    });

// ---- Frontend ----
Route::get('/sitemap.xml', [SitemapController::class, 'index'])->name('sitemap');
Route::get('/', [PageController::class, 'show'])->name('home');
Route::get('/{first}', [PageController::class, 'show'])
    ->where('first', '[a-z0-9][a-z0-9-]*')
    ->name('page.one');
Route::get('/{first}/{second}', [PageController::class, 'show'])
    ->where(['first' => '[a-z0-9][a-z0-9-]*', 'second' => '[a-z0-9][a-z0-9-]*'])
    ->name('page.two');
