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
