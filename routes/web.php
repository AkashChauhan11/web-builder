<?php

use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\BuilderPagesController;
use App\Http\Controllers\Admin\LanguagesController;
use App\Http\Controllers\Admin\MediaController;
use App\Http\Controllers\Admin\UsersController;
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
        Route::get('/builder/{id}/edit', [BuilderPagesController::class, 'edit'])->name('builder.edit');
        Route::delete('/builder/{id}', [BuilderPagesController::class, 'destroy'])->name('builder.destroy');
        Route::post('/builder/assets', [BuilderPagesController::class, 'uploadAsset'])->name('builder.upload_asset');
        Route::put('/builder/{id}', [BuilderPagesController::class, 'update'])->name('builder.update');
        Route::post('/builder/{id}/publish', [BuilderPagesController::class, 'publish'])->name('builder.publish');
        Route::get('/media/picker', [MediaController::class, 'picker'])->name('media.picker');
        Route::resource('media', MediaController::class)->only(['index', 'store', 'update', 'destroy']);
        Route::resource('users', UsersController::class)->except(['show']);
        Route::resource('languages', LanguagesController::class)->except(['show']);
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
