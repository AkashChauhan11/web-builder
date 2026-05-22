<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $existing = User::where('email', 'admin@example.test')->first();
        if ($existing) {
            $this->command?->warn('Admin user already exists; skipping.');
            return;
        }

        $password = 'password'; // You can change this to a more secure password or generate one dynamically
        User::create([
            'name' => 'Admin',
            'email' => 'admin@example.test',
            'password' => Hash::make($password),
            'role' => 'admin',
            'email_verified_at' => now(),
        ]);

        $this->command?->info('=========================================');
        $this->command?->info('Admin user created.');
        $this->command?->info('  Email:    admin@example.test');
        $this->command?->info('  Password: ' . $password);
        $this->command?->info('=========================================');
    }
}
