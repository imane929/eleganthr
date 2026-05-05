<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\Permission;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Créer les rôles
        $adminRole = Role::firstOrCreate(['name' => 'Admin', 'guard_name' => 'web']);
        $hrRole = Role::firstOrCreate(['name' => 'HR Manager', 'guard_name' => 'web']);
        $responsableRole = Role::firstOrCreate(['name' => 'Responsable', 'guard_name' => 'web']);
        $employeeRole = Role::firstOrCreate(['name' => 'Employee', 'guard_name' => 'web']);

        // 2. Assigner les permissions aux rôles
        
        // Admin : toutes les permissions
        $adminRole->permissions()->sync(Permission::all());

        // RH : presque toutes sauf gestion des rôles
        $hrPermissions = Permission::whereNotIn('name', ['manage_roles'])->pluck('id');
        $hrRole->permissions()->sync($hrPermissions);

        // Responsable : permissions limitées au département
        $responsablePermissions = Permission::whereIn('name', [
            'view_dashboard',
            'view_employees',
            'view_departments',
            'view_leaves',
            'create_leaves',
            'view_absences',
            'view_leave_requests'
        ])->pluck('id');
        $responsableRole->permissions()->sync($responsablePermissions);

        // Employé : permissions limitées
        $employeePermissions = Permission::whereIn('name', [
            'view_dashboard',
            'view_employees',
            'view_leaves',
            'create_leaves',
            'view_absences'
        ])->pluck('id');
        $employeeRole->permissions()->sync($employeePermissions);
    }
}

