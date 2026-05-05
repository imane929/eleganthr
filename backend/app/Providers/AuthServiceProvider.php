<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [];

    public function boot(): void
    {
        $this->registerPolicies();

        // Définir les gates pour les rôles
        Gate::define('admin', function ($user) {
            return $user->hasRole('Admin');
        });

        Gate::define('hr', function ($user) {
            return $user->hasRole('HR Manager');
        });

        Gate::define('employee', function ($user) {
            return $user->hasRole('Employee');
        });

        // Gates pour les permissions spécifiques
        Gate::define('manage-employees', function ($user) {
            return $user->hasPermission('edit_employees') || $user->hasRole('Admin');
        });

        Gate::define('approve-leaves', function ($user) {
            return $user->hasPermission('approve_leaves') || $user->hasRole('Admin');
        });
    }
}