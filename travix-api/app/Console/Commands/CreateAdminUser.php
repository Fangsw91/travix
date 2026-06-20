<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class CreateAdminUser extends Command
{
    protected $signature = 'admin:create {email} {password} {name=Admin}';
    protected $description = 'Create an admin user for the Travix dashboard';

    public function handle()
    {
        $email    = $this->argument('email');
        $password = $this->argument('password');
        $name     = $this->argument('name');

        $existing = User::where('email', $email)->first();
        if ($existing) {
            $existing->update([
                'role'     => 'admin',
                'password' => $password, // model casts 'hashed' — always sync password too
            ]);
            $this->info("✅ Existing user '{$email}' promoted to admin and password updated.");
            return self::SUCCESS;
        }

        User::create([
            'name'     => $name,
            'email'    => $email,
            'password' => $password, // model casts 'hashed'
            'role'     => 'admin',
        ]);

        $this->info("✅ Admin user created: {$email}");
        return self::SUCCESS;
    }
}
