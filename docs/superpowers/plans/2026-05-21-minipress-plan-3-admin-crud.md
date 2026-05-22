# MiniPress Plan 3: Media Library + Users CRUD + Languages CRUD

> **For agentic workers:** Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax. **Git note:** The user handles git themselves — do NOT run `git add` or `git commit`. Stop after tests pass.

**Goal:** Build the three remaining admin areas: a Media library (grid + upload + alt-text + deletion + JSON picker endpoint for the editor), a Users CRUD (admin-only — 403 to non-admins), and a Languages CRUD (rename + toggle active + set default + reorder).

**Architecture:**
- Each area is a single resource controller with its own views.
- Media library reuses the `MediaItem` model + `media` table created in Plan 1; the upload endpoint from Plan 2 already creates rows here.
- Users routes are gated by an explicit `abort_unless(auth()->user()->isAdmin(), 403)` in each action — not by a separate middleware, since only this one controller needs the extra restriction.
- Languages CRUD relies on `LanguageObserver` (Plan 1) for default-uniqueness; the controller only writes plain fields.

**Tech stack additions:** none — uses existing Laravel + Tailwind.

---

## Scope of Plan 3

Implements **spec milestones 8-10**:
8. Media library (upload + grid + picker endpoint + editor integration)
9. User management CRUD (admin-only — 403 otherwise)
10. Language admin CRUD

**Out of scope:**
- Test hardening sweep (Plan 4)
- README + final polish (Plan 4)

---

## What Plans 1+2 Already Did

These are dependencies you can rely on:

- `MediaItem` model + `media` table exist. `uploadAsset` (Plan 2) creates rows.
- `User` model with `role` + `isAdmin/isDeveloper/isEditor/isAdminOrDeveloper` helpers.
- `Language` model + `LanguageObserver` enforcing single default.
- `EnsureUserIsAdmin` middleware gates `/admin/*`.
- Admin layout (`layouts.admin`) with sidebar nav. The Media/Users/Languages nav items are currently disabled placeholders — this plan wires them up.
- `BuilderPagesController@uploadAsset` already accepts uploads and writes a MediaItem row. The Media library inherits those rows.

---

## File Map

### Created
- `app/Http/Controllers/Admin/MediaController.php`
- `app/Http/Controllers/Admin/UsersController.php`
- `app/Http/Controllers/Admin/LanguagesController.php`
- `resources/views/admin/media/index.blade.php`
- `resources/views/admin/users/index.blade.php`
- `resources/views/admin/users/create.blade.php`
- `resources/views/admin/users/edit.blade.php`
- `resources/views/admin/languages/index.blade.php`
- `resources/views/admin/languages/create.blade.php`
- `resources/views/admin/languages/edit.blade.php`
- `tests/Feature/MediaCrudTest.php`
- `tests/Feature/UsersCrudTest.php`
- `tests/Feature/LanguagesCrudTest.php`

### Modified
- `routes/web.php` (add the three resources + the picker endpoint)
- `resources/views/layouts/admin.blade.php` (replace placeholder Media/Users/Languages nav items with real links)

---

## Task 1: Media library — `MediaController` + index/destroy/picker + tests

**Files:**
- Create: `app/Http/Controllers/Admin/MediaController.php`
- Create: `resources/views/admin/media/index.blade.php`
- Create: `tests/Feature/MediaCrudTest.php`
- Create: `database/factories/MediaItemFactory.php`
- Modify: `app/Models/MediaItem.php` (add HasFactory)
- Modify: `routes/web.php`

The upload endpoint exists already (`BuilderPagesController@uploadAsset`). This task adds:
- `GET  /admin/media` → grid view (paginated)
- `POST /admin/media` → upload from the library UI (separate from the editor's `uploadAsset`)
- `DELETE /admin/media/{id}` → delete file + row
- `GET  /admin/media/picker` → JSON list for use by the editor or any picker UI
- `PATCH /admin/media/{id}` → update alt text inline

### Step 1: Add HasFactory to MediaItem

Open `app/Models/MediaItem.php`. Add import at top:

```php
use Illuminate\Database\Eloquent\Factories\HasFactory;
```

Add trait inside the class:

```php
/** @use HasFactory<\Database\Factories\MediaItemFactory> */
use HasFactory;
```

### Step 2: Create the factory

Create `database/factories/MediaItemFactory.php`:

```php
<?php

namespace Database\Factories;

use App\Models\MediaItem;
use Illuminate\Database\Eloquent\Factories\Factory;

class MediaItemFactory extends Factory
{
    protected $model = MediaItem::class;

    public function definition(): array
    {
        $name = $this->faker->slug(2) . '.png';
        return [
            'filename' => $name,
            'mime_type' => 'image/png',
            'size' => $this->faker->numberBetween(1000, 500000),
            'path' => "builder-assets/{$name}",
            'url' => "/storage/builder-assets/{$name}",
            'alt_text' => null,
            'uploaded_by' => null,
        ];
    }
}
```

### Step 3: Write the failing test

Create `tests/Feature/MediaCrudTest.php`:

```php
<?php

use App\Models\MediaItem;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->admin = User::factory()->create(['role' => 'admin']);
    Storage::fake('public');
});

it('index lists media items as an authenticated admin', function () {
    MediaItem::factory()->count(3)->create();

    $resp = $this->actingAs($this->admin)->get(route('admin.media.index'));
    $resp->assertOk();
    // We expect the URL of at least one item to appear in the response
    expect($resp->getContent())->toContain('/storage/builder-assets/');
});

it('index requires admin auth', function () {
    $this->get(route('admin.media.index'))->assertRedirect('/admin/login');
});

it('store accepts an image upload', function () {
    $file = UploadedFile::fake()->image('logo.png', 100, 100);

    $resp = $this->actingAs($this->admin)
        ->post(route('admin.media.store'), ['file' => $file]);

    $resp->assertRedirect(route('admin.media.index'));
    expect(MediaItem::count())->toBe(1);

    $item = MediaItem::first();
    expect($item->mime_type)->toStartWith('image/');
    Storage::disk('public')->assertExists($item->path);
});

it('store rejects oversized file (> 10 MB)', function () {
    $file = UploadedFile::fake()->image('huge.png')->size(11 * 1024);

    $this->actingAs($this->admin)
        ->post(route('admin.media.store'), ['file' => $file])
        ->assertSessionHasErrors('file');
});

it('update sets alt_text', function () {
    $item = MediaItem::factory()->create(['alt_text' => null]);

    $this->actingAs($this->admin)
        ->patch(route('admin.media.update', $item->id), ['alt_text' => 'Company logo'])
        ->assertRedirect();

    expect($item->fresh()->alt_text)->toBe('Company logo');
});

it('destroy removes file from disk and row from db', function () {
    $file = UploadedFile::fake()->image('to-delete.png');
    $path = $file->store('builder-assets', 'public');
    $item = MediaItem::create([
        'filename' => 'to-delete.png',
        'mime_type' => 'image/png',
        'size' => 1024,
        'path' => $path,
        'url' => "/storage/{$path}",
    ]);

    $this->actingAs($this->admin)
        ->delete(route('admin.media.destroy', $item->id))
        ->assertRedirect(route('admin.media.index'));

    expect(MediaItem::find($item->id))->toBeNull();
    Storage::disk('public')->assertMissing($path);
});

it('picker returns paginated JSON of media items', function () {
    MediaItem::factory()->count(5)->create();

    $resp = $this->actingAs($this->admin)
        ->get(route('admin.media.picker'), ['Accept' => 'application/json']);

    $resp->assertOk()
        ->assertJsonStructure(['data' => [['id', 'url', 'filename', 'alt_text']]]);
    expect($resp->json('data'))->toHaveCount(5);
});

it('picker supports search by filename', function () {
    MediaItem::factory()->create(['filename' => 'hero-banner.png']);
    MediaItem::factory()->create(['filename' => 'footer-logo.png']);

    $resp = $this->actingAs($this->admin)
        ->get(route('admin.media.picker', ['q' => 'hero']));

    $resp->assertOk();
    expect($resp->json('data'))->toHaveCount(1);
    expect($resp->json('data.0.filename'))->toContain('hero');
});
```

Run:
```
php artisan test --filter=MediaCrudTest
```

Expected: 8 failures (routes/controller don't exist).

### Step 4: Add routes

In `routes/web.php`, inside the existing admin group, add:

```php
Route::get('/media/picker', [MediaController::class, 'picker'])->name('media.picker');
Route::resource('media', MediaController::class)->only(['index', 'store', 'update', 'destroy']);
```

Important: the `picker` route MUST be registered BEFORE the resource route, otherwise `/admin/media/picker` would be parsed as `media/{id}` and try to load a MediaItem with id "picker".

Also import the controller at the top of `routes/web.php`:

```php
use App\Http\Controllers\Admin\MediaController;
```

### Step 5: Create the controller

Create `app/Http/Controllers/Admin/MediaController.php`:

```php
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
```

### Step 6: Create the index view

Create `resources/views/admin/media/index.blade.php`:

```blade
@extends('layouts.admin')

@section('content')
<div class="bg-white rounded shadow">
    <div class="p-4 border-b flex items-center gap-3">
        <h1 class="text-lg font-semibold flex-1">Media Library</h1>
        <form method="POST" action="{{ route('admin.media.store') }}" enctype="multipart/form-data" class="flex items-center gap-2">
            @csrf
            <input type="file" name="file" required accept="image/*" class="text-sm">
            <button type="submit" class="bg-emerald-600 text-white px-3 py-1.5 rounded text-sm hover:bg-emerald-500">Upload</button>
        </form>
    </div>

    @if ($items->isEmpty())
        <div class="p-10 text-center text-slate-500">No media yet. Upload your first image above.</div>
    @else
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4">
            @foreach ($items as $item)
                <div class="border rounded overflow-hidden">
                    <a href="{{ $item->url }}" target="_blank" class="block aspect-square bg-slate-100 overflow-hidden">
                        <img src="{{ $item->url }}" alt="{{ $item->alt_text ?? $item->filename }}" class="object-cover w-full h-full">
                    </a>
                    <div class="p-2 text-xs">
                        <div class="font-mono truncate" title="{{ $item->filename }}">{{ $item->filename }}</div>
                        <form method="POST" action="{{ route('admin.media.update', $item->id) }}" class="mt-1">
                            @csrf
                            @method('PATCH')
                            <input type="text" name="alt_text" value="{{ $item->alt_text }}" placeholder="Alt text"
                                class="w-full border rounded px-1 py-0.5 text-xs"
                                onblur="this.form.requestSubmit()">
                        </form>
                        <form method="POST" action="{{ route('admin.media.destroy', $item->id) }}" class="mt-1"
                              onsubmit="return confirm('Delete this asset?');">
                            @csrf
                            @method('DELETE')
                            <button type="submit" class="text-red-600 hover:underline">Delete</button>
                        </form>
                    </div>
                </div>
            @endforeach
        </div>
        <div class="p-3">{{ $items->links() }}</div>
    @endif
</div>
@endsection
```

### Step 7: Wire up the sidebar Media link

In `resources/views/layouts/admin.blade.php`, find the line:

```blade
<a href="#" class="block px-3 py-2 rounded text-slate-500 cursor-not-allowed" title="Coming in Plan 3">Media</a>
```

Replace with:

```blade
<a href="{{ route('admin.media.index') }}" class="block px-3 py-2 rounded hover:bg-slate-800">Media</a>
```

### Step 8: Run tests

```
php artisan test --filter=MediaCrudTest
```

Expected: 8 passed.

Full suite:
```
php artisan test
```

Expected: 65 passing (57 prior + 8 new).

**Stop here.**

---

## Task 2: Users CRUD (admin-only) + tests

**Files:**
- Create: `app/Http/Controllers/Admin/UsersController.php`
- Create: `resources/views/admin/users/index.blade.php`
- Create: `resources/views/admin/users/create.blade.php`
- Create: `resources/views/admin/users/edit.blade.php`
- Create: `tests/Feature/UsersCrudTest.php`
- Modify: `routes/web.php`

### Step 1: Write the failing test

Create `tests/Feature/UsersCrudTest.php`:

```php
<?php

use App\Models\User;

uses(Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->admin = User::factory()->create(['role' => 'admin']);
    $this->editor = User::factory()->create(['role' => 'editor']);
});

it('index requires admin role (editor gets 403)', function () {
    $this->actingAs($this->editor)
        ->get(route('admin.users.index'))
        ->assertForbidden();
});

it('index shows users to admin', function () {
    $this->actingAs($this->admin)
        ->get(route('admin.users.index'))
        ->assertOk()
        ->assertSee($this->admin->email)
        ->assertSee($this->editor->email);
});

it('store creates a user with role and hashed password', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.users.store'), [
            'name' => 'Jane',
            'email' => 'jane@example.test',
            'password' => 'secret-pass',
            'password_confirmation' => 'secret-pass',
            'role' => 'editor',
        ])->assertRedirect(route('admin.users.index'));

    $u = User::where('email', 'jane@example.test')->first();
    expect($u)->not->toBeNull();
    expect($u->role)->toBe('editor');
    expect($u->password)->not->toBe('secret-pass'); // hashed
});

it('store rejects duplicate email', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.users.store'), [
            'name' => 'Dup',
            'email' => $this->editor->email,
            'password' => 'pass1234',
            'password_confirmation' => 'pass1234',
            'role' => 'editor',
        ])->assertSessionHasErrors('email');
});

it('store rejects invalid role', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.users.store'), [
            'name' => 'X',
            'email' => 'x@example.test',
            'password' => 'pass1234',
            'password_confirmation' => 'pass1234',
            'role' => 'superadmin',
        ])->assertSessionHasErrors('role');
});

it('update changes name, email, role; password optional', function () {
    $resp = $this->actingAs($this->admin)
        ->put(route('admin.users.update', $this->editor->id), [
            'name' => 'Editor Renamed',
            'email' => 'renamed@example.test',
            'role' => 'developer',
        ]);

    $resp->assertRedirect();
    $u = $this->editor->fresh();
    expect($u->name)->toBe('Editor Renamed');
    expect($u->email)->toBe('renamed@example.test');
    expect($u->role)->toBe('developer');
});

it('update with password+confirmation rehashes', function () {
    $oldHash = $this->editor->password;

    $this->actingAs($this->admin)
        ->put(route('admin.users.update', $this->editor->id), [
            'name' => $this->editor->name,
            'email' => $this->editor->email,
            'role' => 'editor',
            'password' => 'newpass123',
            'password_confirmation' => 'newpass123',
        ])->assertRedirect();

    expect($this->editor->fresh()->password)->not->toBe($oldHash);
});

it('destroy blocks self-deletion', function () {
    $this->actingAs($this->admin)
        ->delete(route('admin.users.destroy', $this->admin->id))
        ->assertSessionHasErrors();

    expect(User::find($this->admin->id))->not->toBeNull();
});

it('destroy removes another user', function () {
    $this->actingAs($this->admin)
        ->delete(route('admin.users.destroy', $this->editor->id))
        ->assertRedirect(route('admin.users.index'));

    expect(User::find($this->editor->id))->toBeNull();
});

it('non-admin developer gets 403 on store', function () {
    $dev = User::factory()->create(['role' => 'developer']);

    $this->actingAs($dev)
        ->post(route('admin.users.store'), [
            'name' => 'Y',
            'email' => 'y@example.test',
            'password' => 'pass1234',
            'password_confirmation' => 'pass1234',
            'role' => 'editor',
        ])->assertForbidden();
});
```

### Step 2: Confirm failure

```
php artisan test --filter=UsersCrudTest
```

Expected: 10 failures.

### Step 3: Add routes

In `routes/web.php`, inside the admin group:

```php
Route::resource('users', UsersController::class)
    ->except(['show']);
```

Import:

```php
use App\Http\Controllers\Admin\UsersController;
```

### Step 4: Create the controller

Create `app/Http/Controllers/Admin/UsersController.php`:

```php
<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\View\View;

class UsersController extends Controller
{
    private function authorizeAdmin(Request $request): void
    {
        abort_unless($request->user()?->isAdmin(), 403);
    }

    public function index(Request $request): View
    {
        $this->authorizeAdmin($request);

        $users = User::query()->orderBy('email')->paginate(25);

        return view('admin.users.index', ['users' => $users]);
    }

    public function create(Request $request): View
    {
        $this->authorizeAdmin($request);

        return view('admin.users.create');
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorizeAdmin($request);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'role' => ['required', Rule::in(['admin', 'developer', 'editor'])],
        ]);

        User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'role' => $data['role'],
            'email_verified_at' => now(),
        ]);

        return redirect()->route('admin.users.index')->with('status', 'User created.');
    }

    public function edit(int $id, Request $request): View
    {
        $this->authorizeAdmin($request);

        $user = User::findOrFail($id);

        return view('admin.users.edit', ['user' => $user]);
    }

    public function update(int $id, Request $request): RedirectResponse
    {
        $this->authorizeAdmin($request);

        $user = User::findOrFail($id);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
            'role' => ['required', Rule::in(['admin', 'developer', 'editor'])],
        ]);

        $update = [
            'name' => $data['name'],
            'email' => $data['email'],
            'role' => $data['role'],
        ];
        if (! empty($data['password'])) {
            $update['password'] = Hash::make($data['password']);
        }

        $user->update($update);

        return redirect()->route('admin.users.index')->with('status', 'User updated.');
    }

    public function destroy(int $id, Request $request): RedirectResponse
    {
        $this->authorizeAdmin($request);

        if ($request->user()->id === $id) {
            return redirect()->route('admin.users.index')
                ->withErrors(['user' => 'You cannot delete your own account.']);
        }

        $user = User::findOrFail($id);
        $user->delete();

        return redirect()->route('admin.users.index')->with('status', 'User deleted.');
    }
}
```

### Step 5: Create the views

`resources/views/admin/users/index.blade.php`:

```blade
@extends('layouts.admin')

@section('content')
<div class="bg-white rounded shadow">
    <div class="p-4 border-b flex items-center">
        <h1 class="text-lg font-semibold flex-1">Users</h1>
        <a href="{{ route('admin.users.create') }}" class="bg-emerald-600 text-white px-3 py-1.5 rounded text-sm hover:bg-emerald-500">New User</a>
    </div>

    <table class="w-full text-sm">
        <thead class="bg-slate-50 text-left">
            <tr>
                <th class="p-3">Email</th>
                <th class="p-3">Name</th>
                <th class="p-3">Role</th>
                <th class="p-3 text-right">Actions</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($users as $user)
                <tr class="border-t">
                    <td class="p-3 font-mono text-xs">{{ $user->email }}</td>
                    <td class="p-3">{{ $user->name }}</td>
                    <td class="p-3">
                        <span class="text-xs px-2 py-0.5 rounded
                            {{ $user->role === 'admin' ? 'bg-red-100 text-red-800'
                              : ($user->role === 'developer' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700') }}">
                            {{ $user->role }}
                        </span>
                    </td>
                    <td class="p-3 text-right space-x-2 text-xs">
                        <a href="{{ route('admin.users.edit', $user->id) }}" class="text-slate-700 hover:underline">Edit</a>
                        @if (auth()->id() !== $user->id)
                            <form method="POST" action="{{ route('admin.users.destroy', $user->id) }}" class="inline"
                                  onsubmit="return confirm('Delete this user?');">
                                @csrf @method('DELETE')
                                <button type="submit" class="text-red-600 hover:underline">Delete</button>
                            </form>
                        @endif
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>
    <div class="p-3">{{ $users->links() }}</div>
</div>
@endsection
```

`resources/views/admin/users/create.blade.php`:

```blade
@extends('layouts.admin')

@section('content')
<div class="bg-white rounded shadow max-w-md p-6">
    <h1 class="text-lg font-semibold mb-4">New User</h1>

    <form method="POST" action="{{ route('admin.users.store') }}" class="space-y-3">
        @csrf
        <div>
            <label class="block text-sm mb-1" for="name">Name</label>
            <input id="name" name="name" required value="{{ old('name') }}" class="w-full border rounded px-3 py-2">
        </div>
        <div>
            <label class="block text-sm mb-1" for="email">Email</label>
            <input id="email" name="email" type="email" required value="{{ old('email') }}" class="w-full border rounded px-3 py-2">
        </div>
        <div>
            <label class="block text-sm mb-1" for="password">Password</label>
            <input id="password" name="password" type="password" required minlength="8" class="w-full border rounded px-3 py-2">
        </div>
        <div>
            <label class="block text-sm mb-1" for="password_confirmation">Confirm password</label>
            <input id="password_confirmation" name="password_confirmation" type="password" required minlength="8" class="w-full border rounded px-3 py-2">
        </div>
        <div>
            <label class="block text-sm mb-1" for="role">Role</label>
            <select id="role" name="role" class="w-full border rounded px-3 py-2">
                <option value="editor" @selected(old('role')==='editor')>Editor</option>
                <option value="developer" @selected(old('role')==='developer')>Developer</option>
                <option value="admin" @selected(old('role')==='admin')>Admin</option>
            </select>
        </div>
        <div class="flex justify-end gap-2 pt-2">
            <a href="{{ route('admin.users.index') }}" class="px-3 py-2 text-sm">Cancel</a>
            <button type="submit" class="bg-slate-900 text-white px-4 py-2 rounded text-sm hover:bg-slate-700">Create</button>
        </div>
    </form>
</div>
@endsection
```

`resources/views/admin/users/edit.blade.php`:

```blade
@extends('layouts.admin')

@section('content')
<div class="bg-white rounded shadow max-w-md p-6">
    <h1 class="text-lg font-semibold mb-4">Edit User</h1>

    <form method="POST" action="{{ route('admin.users.update', $user->id) }}" class="space-y-3">
        @csrf @method('PUT')
        <div>
            <label class="block text-sm mb-1" for="name">Name</label>
            <input id="name" name="name" required value="{{ old('name', $user->name) }}" class="w-full border rounded px-3 py-2">
        </div>
        <div>
            <label class="block text-sm mb-1" for="email">Email</label>
            <input id="email" name="email" type="email" required value="{{ old('email', $user->email) }}" class="w-full border rounded px-3 py-2">
        </div>
        <div>
            <label class="block text-sm mb-1" for="password">New password (optional)</label>
            <input id="password" name="password" type="password" minlength="8" class="w-full border rounded px-3 py-2">
        </div>
        <div>
            <label class="block text-sm mb-1" for="password_confirmation">Confirm new password</label>
            <input id="password_confirmation" name="password_confirmation" type="password" minlength="8" class="w-full border rounded px-3 py-2">
        </div>
        <div>
            <label class="block text-sm mb-1" for="role">Role</label>
            <select id="role" name="role" class="w-full border rounded px-3 py-2">
                <option value="editor" @selected(old('role', $user->role)==='editor')>Editor</option>
                <option value="developer" @selected(old('role', $user->role)==='developer')>Developer</option>
                <option value="admin" @selected(old('role', $user->role)==='admin')>Admin</option>
            </select>
        </div>
        <div class="flex justify-end gap-2 pt-2">
            <a href="{{ route('admin.users.index') }}" class="px-3 py-2 text-sm">Cancel</a>
            <button type="submit" class="bg-slate-900 text-white px-4 py-2 rounded text-sm hover:bg-slate-700">Save</button>
        </div>
    </form>
</div>
@endsection
```

### Step 6: Wire the sidebar Users link

In `layouts/admin.blade.php`, replace:

```blade
<a href="#" class="block px-3 py-2 rounded text-slate-500 cursor-not-allowed" title="Coming in Plan 3">Users</a>
```

with:

```blade
<a href="{{ route('admin.users.index') }}" class="block px-3 py-2 rounded hover:bg-slate-800">Users</a>
```

### Step 7: Run tests

```
php artisan test --filter=UsersCrudTest
```

Expected: 10 passed.

Full suite:
```
php artisan test
```

Expected: 75 passing (65 prior + 10 new).

**Stop here.**

---

## Task 3: Languages CRUD + tests

**Files:**
- Create: `app/Http/Controllers/Admin/LanguagesController.php`
- Create: `resources/views/admin/languages/index.blade.php`
- Create: `resources/views/admin/languages/create.blade.php`
- Create: `resources/views/admin/languages/edit.blade.php`
- Create: `tests/Feature/LanguagesCrudTest.php`
- Modify: `routes/web.php`

### Step 1: Write the failing test

Create `tests/Feature/LanguagesCrudTest.php`:

```php
<?php

use App\Models\Language;
use App\Models\User;
use App\Support\LocaleResolver;

uses(Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->admin = User::factory()->create(['role' => 'admin']);
    LocaleResolver::bustCache();
});

it('index lists languages', function () {
    Language::create(['name' => 'English', 'code' => 'en', 'is_default' => true]);
    Language::create(['name' => 'Spanish', 'code' => 'es']);

    $this->actingAs($this->admin)
        ->get(route('admin.languages.index'))
        ->assertOk()
        ->assertSee('English')
        ->assertSee('Spanish');
});

it('store creates language', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.languages.store'), [
            'name' => 'French',
            'code' => 'fr',
            'is_active' => '1',
            'sort_order' => 2,
        ])->assertRedirect(route('admin.languages.index'));

    expect(Language::where('code', 'fr')->exists())->toBeTrue();
});

it('store rejects duplicate code', function () {
    Language::create(['name' => 'English', 'code' => 'en']);

    $this->actingAs($this->admin)
        ->post(route('admin.languages.store'), [
            'name' => 'Other English',
            'code' => 'en',
        ])->assertSessionHasErrors('code');
});

it('update renames and toggles active', function () {
    $en = Language::create(['name' => 'English', 'code' => 'en', 'is_active' => true]);

    $this->actingAs($this->admin)
        ->put(route('admin.languages.update', $en->id), [
            'name' => 'British English',
            'code' => 'en',
            'is_active' => '0',
            'sort_order' => 5,
        ])->assertRedirect();

    $fresh = $en->fresh();
    expect($fresh->name)->toBe('British English');
    expect($fresh->is_active)->toBeFalse();
    expect($fresh->sort_order)->toBe(5);
});

it('setting is_default clears other defaults (observer)', function () {
    $en = Language::create(['name' => 'English', 'code' => 'en', 'is_default' => true]);
    $es = Language::create(['name' => 'Spanish', 'code' => 'es', 'is_default' => false]);

    $this->actingAs($this->admin)
        ->put(route('admin.languages.update', $es->id), [
            'name' => 'Spanish',
            'code' => 'es',
            'is_default' => '1',
            'is_active' => '1',
            'sort_order' => 0,
        ])->assertRedirect();

    expect($en->fresh()->is_default)->toBeFalse();
    expect($es->fresh()->is_default)->toBeTrue();
});

it('destroy blocks deletion of default language', function () {
    $en = Language::create(['name' => 'English', 'code' => 'en', 'is_default' => true]);

    $this->actingAs($this->admin)
        ->delete(route('admin.languages.destroy', $en->id))
        ->assertSessionHasErrors();

    expect(Language::find($en->id))->not->toBeNull();
});

it('destroy removes a non-default language', function () {
    Language::create(['name' => 'English', 'code' => 'en', 'is_default' => true]);
    $fr = Language::create(['name' => 'French', 'code' => 'fr']);

    $this->actingAs($this->admin)
        ->delete(route('admin.languages.destroy', $fr->id))
        ->assertRedirect(route('admin.languages.index'));

    expect(Language::find($fr->id))->toBeNull();
});

it('requires admin auth for index', function () {
    $this->get(route('admin.languages.index'))->assertRedirect('/admin/login');
});
```

### Step 2: Confirm failure

```
php artisan test --filter=LanguagesCrudTest
```

Expected: 8 failures.

### Step 3: Add routes

In `routes/web.php`:

```php
Route::resource('languages', LanguagesController::class)->except(['show']);
```

Import:

```php
use App\Http\Controllers\Admin\LanguagesController;
```

### Step 4: Create the controller

Create `app/Http/Controllers/Admin/LanguagesController.php`:

```php
<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Language;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\View\View;

class LanguagesController extends Controller
{
    public function index(): View
    {
        $languages = Language::orderBy('sort_order')->orderBy('code')->paginate(25);

        return view('admin.languages.index', ['languages' => $languages]);
    }

    public function create(): View
    {
        return view('admin.languages.create');
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:8', Rule::unique('languages', 'code')],
            'is_default' => ['sometimes'],
            'is_active' => ['sometimes'],
            'sort_order' => ['nullable', 'integer'],
        ]);

        Language::create([
            'name' => $data['name'],
            'code' => strtolower($data['code']),
            'is_default' => $request->boolean('is_default'),
            'is_active' => $request->has('is_active') ? $request->boolean('is_active') : true,
            'sort_order' => (int) ($data['sort_order'] ?? 0),
        ]);

        return redirect()->route('admin.languages.index')->with('status', 'Language created.');
    }

    public function edit(int $id): View
    {
        $language = Language::findOrFail($id);

        return view('admin.languages.edit', ['language' => $language]);
    }

    public function update(int $id, Request $request): RedirectResponse
    {
        $language = Language::findOrFail($id);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:8', Rule::unique('languages', 'code')->ignore($language->id)],
            'is_default' => ['sometimes'],
            'is_active' => ['sometimes'],
            'sort_order' => ['nullable', 'integer'],
        ]);

        $language->update([
            'name' => $data['name'],
            'code' => strtolower($data['code']),
            'is_default' => $request->boolean('is_default'),
            'is_active' => $request->boolean('is_active'),
            'sort_order' => (int) ($data['sort_order'] ?? 0),
        ]);

        return redirect()->route('admin.languages.index')->with('status', 'Language updated.');
    }

    public function destroy(int $id): RedirectResponse
    {
        $language = Language::findOrFail($id);

        if ($language->is_default) {
            return redirect()->route('admin.languages.index')
                ->withErrors(['language' => 'Cannot delete the default language. Set a different default first.']);
        }

        $language->delete();

        return redirect()->route('admin.languages.index')->with('status', 'Language deleted.');
    }
}
```

### Step 5: Create the views

`resources/views/admin/languages/index.blade.php`:

```blade
@extends('layouts.admin')

@section('content')
<div class="bg-white rounded shadow">
    <div class="p-4 border-b flex items-center">
        <h1 class="text-lg font-semibold flex-1">Languages</h1>
        <a href="{{ route('admin.languages.create') }}" class="bg-emerald-600 text-white px-3 py-1.5 rounded text-sm hover:bg-emerald-500">New Language</a>
    </div>

    <table class="w-full text-sm">
        <thead class="bg-slate-50 text-left">
            <tr>
                <th class="p-3">Code</th>
                <th class="p-3">Name</th>
                <th class="p-3">Default</th>
                <th class="p-3">Active</th>
                <th class="p-3">Order</th>
                <th class="p-3 text-right">Actions</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($languages as $lang)
                <tr class="border-t">
                    <td class="p-3 font-mono">{{ $lang->code }}</td>
                    <td class="p-3">{{ $lang->name }}</td>
                    <td class="p-3">
                        @if ($lang->is_default)
                            <span class="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded">default</span>
                        @endif
                    </td>
                    <td class="p-3">
                        @if ($lang->is_active)
                            <span class="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">active</span>
                        @else
                            <span class="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded">inactive</span>
                        @endif
                    </td>
                    <td class="p-3 text-slate-500">{{ $lang->sort_order }}</td>
                    <td class="p-3 text-right space-x-2 text-xs">
                        <a href="{{ route('admin.languages.edit', $lang->id) }}" class="text-slate-700 hover:underline">Edit</a>
                        @if (! $lang->is_default)
                            <form method="POST" action="{{ route('admin.languages.destroy', $lang->id) }}" class="inline"
                                  onsubmit="return confirm('Delete this language?');">
                                @csrf @method('DELETE')
                                <button type="submit" class="text-red-600 hover:underline">Delete</button>
                            </form>
                        @endif
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>
    <div class="p-3">{{ $languages->links() }}</div>
</div>
@endsection
```

`resources/views/admin/languages/create.blade.php` and `edit.blade.php` share the same form. Create `create.blade.php`:

```blade
@extends('layouts.admin')

@section('content')
<div class="bg-white rounded shadow max-w-md p-6">
    <h1 class="text-lg font-semibold mb-4">New Language</h1>

    <form method="POST" action="{{ route('admin.languages.store') }}" class="space-y-3">
        @csrf
        @include('admin.languages._fields', ['language' => null])
        <div class="flex justify-end gap-2 pt-2">
            <a href="{{ route('admin.languages.index') }}" class="px-3 py-2 text-sm">Cancel</a>
            <button type="submit" class="bg-slate-900 text-white px-4 py-2 rounded text-sm hover:bg-slate-700">Create</button>
        </div>
    </form>
</div>
@endsection
```

`resources/views/admin/languages/edit.blade.php`:

```blade
@extends('layouts.admin')

@section('content')
<div class="bg-white rounded shadow max-w-md p-6">
    <h1 class="text-lg font-semibold mb-4">Edit Language</h1>

    <form method="POST" action="{{ route('admin.languages.update', $language->id) }}" class="space-y-3">
        @csrf @method('PUT')
        @include('admin.languages._fields', ['language' => $language])
        <div class="flex justify-end gap-2 pt-2">
            <a href="{{ route('admin.languages.index') }}" class="px-3 py-2 text-sm">Cancel</a>
            <button type="submit" class="bg-slate-900 text-white px-4 py-2 rounded text-sm hover:bg-slate-700">Save</button>
        </div>
    </form>
</div>
@endsection
```

`resources/views/admin/languages/_fields.blade.php` (shared partial):

```blade
<div>
    <label class="block text-sm mb-1" for="name">Name</label>
    <input id="name" name="name" required value="{{ old('name', $language?->name) }}" class="w-full border rounded px-3 py-2">
</div>
<div>
    <label class="block text-sm mb-1" for="code">Code (e.g. en, es, fr, pt-br)</label>
    <input id="code" name="code" required maxlength="8" value="{{ old('code', $language?->code) }}" class="w-full border rounded px-3 py-2 font-mono">
</div>
<label class="flex items-center gap-2 text-sm">
    <input type="checkbox" name="is_default" value="1" @checked(old('is_default', $language?->is_default))> Default language
</label>
<label class="flex items-center gap-2 text-sm">
    <input type="checkbox" name="is_active" value="1" @checked(old('is_active', $language?->is_active ?? true))> Active
</label>
<div>
    <label class="block text-sm mb-1" for="sort_order">Sort order</label>
    <input id="sort_order" name="sort_order" type="number" value="{{ old('sort_order', $language?->sort_order ?? 0) }}" class="w-full border rounded px-3 py-2">
</div>
```

### Step 6: Wire the sidebar Languages link

In `layouts/admin.blade.php`, replace:

```blade
<a href="#" class="block px-3 py-2 rounded text-slate-500 cursor-not-allowed" title="Coming in Plan 3">Languages</a>
```

with:

```blade
<a href="{{ route('admin.languages.index') }}" class="block px-3 py-2 rounded hover:bg-slate-800">Languages</a>
```

### Step 7: Run tests

```
php artisan test --filter=LanguagesCrudTest
```

Expected: 8 passed.

Full suite:
```
php artisan test
```

Expected: 83 passing (75 prior + 8 new).

**Stop here.**

---

## Task 4: Final verification

**Files:** none — verification only.

- [ ] **Step 1:** `php artisan migrate:fresh --seed`. Capture admin password.

- [ ] **Step 2:** `php artisan test`. Expected: 83 passing.

- [ ] **Step 3:** `npm run build`. Expected: succeeds.

- [ ] **Step 4: Smoke test (curl/auth-cookie or live browser):**
  - `/admin/media` shows the grid (empty initially)
  - Upload an image via the form — appears in grid; file lands in `storage/app/public/builder-assets/`
  - Click Delete on a media item — vanishes
  - `/admin/users` lists admin@example.test
  - Create a new user with role `editor` — succeeds; appears in list
  - Log in as the new editor — `/admin/users` returns 403
  - `/admin/languages` shows English (default) and Spanish
  - Edit Spanish → uncheck Active → save; sitemap should now exclude Spanish (test manually: visit `/sitemap.xml` and confirm only English URLs appear; un-check active again to undo)

- [ ] **Step 5:** Report `git status` for the user.

## Plan 3 Acceptance Criteria

- `php artisan test` is green (83 tests)
- `npm run build` succeeds
- `/admin/media` works: index/upload/delete/alt-text edit; picker JSON endpoint returns paginated results
- `/admin/users` admin-only: 403 for editor/developer; CRUD works; self-deletion blocked
- `/admin/languages` works: index/create/edit/delete; default toggle works; default language cannot be deleted

## Handoff to Plan 4

Plan 4 is the final polish:
- Test hardening sweep — add any missing edge-case tests, verify all routes covered
- README with setup instructions + screenshots/architecture notes
- `composer setup` script verification end-to-end
- Optional: linting/CI configuration
