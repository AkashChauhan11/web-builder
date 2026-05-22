<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MediaItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\View\View;

class MediaController extends Controller
{
    public function index(): View
    {
        $items = MediaItem::query()
            ->orderByDesc('created_at')
            ->paginate(24);

        return view('admin.media.index', ['items' => $items]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'image', 'max:10240'],
        ]);

        $file = $request->file('file');
        $path = $file->store('builder-assets', 'public');
        $url = Storage::disk('public')->url($path);

        MediaItem::create([
            'filename' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
            'path' => $path,
            'url' => $url,
            'uploaded_by' => $request->user()?->id,
        ]);

        return redirect()->route('admin.media.index')->with('status', 'Uploaded.');
    }

    public function update(int $id, Request $request): RedirectResponse
    {
        $item = MediaItem::findOrFail($id);
        $data = $request->validate([
            'alt_text' => ['nullable', 'string', 'max:255'],
        ]);
        $item->update($data);

        return redirect()->back()->with('status', 'Alt text saved.');
    }

    public function destroy(int $id): RedirectResponse
    {
        $item = MediaItem::findOrFail($id);

        if ($item->path) {
            Storage::disk('public')->delete($item->path);
        }
        $item->delete();

        return redirect()->route('admin.media.index')->with('status', 'Deleted.');
    }

    public function picker(Request $request): JsonResponse
    {
        $q = $request->query('q');

        $query = MediaItem::query()->orderByDesc('created_at');
        if ($q) {
            $query->where('filename', 'like', '%' . $q . '%');
        }

        $items = $query->limit(50)->get(['id', 'url', 'filename', 'alt_text']);

        return response()->json([
            'data' => $items->all(),
        ]);
    }
}
