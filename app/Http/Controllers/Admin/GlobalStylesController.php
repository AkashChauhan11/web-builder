<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\GlobalStyle;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class GlobalStylesController extends Controller
{
    public function edit(): View
    {
        return view('admin.global-styles.edit', [
            'style' => GlobalStyle::current(),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'colors' => ['required', 'array'],
            'colors.primary'    => ['required', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'colors.secondary'  => ['required', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'colors.accent'     => ['required', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'colors.text'       => ['required', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'colors.background' => ['required', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'colors.muted'      => ['required', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],

            'typography' => ['required', 'array'],
            'typography.h1.font_family' => ['required', 'string', 'max:255'],
            'typography.h1.font_size'   => ['required', 'integer', 'min:8', 'max:200'],
            'typography.h1.font_weight' => ['required', 'integer', 'min:100', 'max:900'],
            'typography.h1.line_height' => ['required', 'numeric', 'min:0.5', 'max:5'],
            'typography.h2.font_family' => ['required', 'string', 'max:255'],
            'typography.h2.font_size'   => ['required', 'integer', 'min:8', 'max:200'],
            'typography.h2.font_weight' => ['required', 'integer', 'min:100', 'max:900'],
            'typography.h2.line_height' => ['required', 'numeric', 'min:0.5', 'max:5'],
            'typography.h3.font_family' => ['required', 'string', 'max:255'],
            'typography.h3.font_size'   => ['required', 'integer', 'min:8', 'max:200'],
            'typography.h3.font_weight' => ['required', 'integer', 'min:100', 'max:900'],
            'typography.h3.line_height' => ['required', 'numeric', 'min:0.5', 'max:5'],
            'typography.body.font_family' => ['required', 'string', 'max:255'],
            'typography.body.font_size'   => ['required', 'integer', 'min:8', 'max:200'],
            'typography.body.font_weight' => ['required', 'integer', 'min:100', 'max:900'],
            'typography.body.line_height' => ['required', 'numeric', 'min:0.5', 'max:5'],
        ]);

        $style = GlobalStyle::current();
        $style->update([
            'colors' => $data['colors'],
            'typography' => $data['typography'],
        ]);

        return redirect()
            ->route('admin.global-styles.edit')
            ->with('status', 'Global styles updated.');
    }
}
