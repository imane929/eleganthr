<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Role;
use App\Models\Permission;
use App\Models\Department;
use App\Models\Employee;
use App\Models\LeaveRequest;
use App\Models\Absence;
use App\Models\Salary;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Créer les permissions
        $permissions = [
            // Dashboard
            ['name' => 'view_dashboard', 'module' => 'Dashboard', 'description' => 'Voir le tableau de bord'],
            
            // Employés
            ['name' => 'view_employees', 'module' => 'Employees', 'description' => 'Voir la liste des employés'],
            ['name' => 'create_employees', 'module' => 'Employees', 'description' => 'Créer un employé'],
            ['name' => 'edit_employees', 'module' => 'Employees', 'description' => 'Modifier un employé'],
            ['name' => 'delete_employees', 'module' => 'Employees', 'description' => 'Supprimer un employé'],
            ['name' => 'export_employees', 'module' => 'Employees', 'description' => 'Exporter la liste des employés'],
            
            // Congés
            ['name' => 'view_leaves', 'module' => 'Leaves', 'description' => 'Voir les congés'],
            ['name' => 'create_leaves', 'module' => 'Leaves', 'description' => 'Demander un congé'],
            ['name' => 'approve_leaves', 'module' => 'Leaves', 'description' => 'Approuver/Refuser les congés'],
            
            // Absences
            ['name' => 'view_absences', 'module' => 'Absences', 'description' => 'Voir les absences'],
            ['name' => 'create_absences', 'module' => 'Absences', 'description' => 'Enregistrer une absence'],
            
            // Salaires
            ['name' => 'view_salaries', 'module' => 'Salaries', 'description' => 'Voir les salaires'],
            ['name' => 'create_salaries', 'module' => 'Salaries', 'description' => 'Créer des bulletins de salaire'],
            ['name' => 'edit_salaries', 'module' => 'Salaries', 'description' => 'Modifier les salaires'],
            ['name' => 'export_salaries', 'module' => 'Salaries', 'description' => 'Exporter les salaires'],
            
            // Départements
            ['name' => 'view_departments', 'module' => 'Departments', 'description' => 'Voir les départements'],
            ['name' => 'manage_departments', 'module' => 'Departments', 'description' => 'Gérer les départements'],
            
            // Utilisateurs et rôles
            ['name' => 'view_users', 'module' => 'Users', 'description' => 'Voir les utilisateurs'],
            ['name' => 'manage_users', 'module' => 'Users', 'description' => 'Gérer les utilisateurs'],
            ['name' => 'manage_roles', 'module' => 'Roles', 'description' => 'Gérer les rôles et permissions'],
        ];

        foreach ($permissions as $perm) {
            Permission::create([
                'name' => $perm['name'],
                'guard_name' => 'web',
                'module' => $perm['module'],
                'description' => $perm['description']
            ]);
        }

        // 2. Créer les rôles (utilise RoleSeeder)
        $this->call([
            RoleSeeder::class,
        ]);

        $adminRole = Role::where('name', 'Admin')->first();
        $hrRole = Role::where('name', 'HR Manager')->first();
        $employeeRole = Role::where('name', 'Employee')->first();

        // 4. Créer les utilisateurs
        $admin = User::create([
            'name' => 'Admin System',
            'email' => 'admin.system@elegantart.com',
            'password' => Hash::make('admin123'),
            'email_verified_at' => now(),
        ]);
        $admin->roles()->attach($adminRole);

        $hrManager = User::create([
            'name' => 'Siham Housni',
            'email' => 'siham.housni@elegantart.com',
            'password' => Hash::make('siham123'),
            'email_verified_at' => now(),
        ]);
        $hrManager->roles()->attach($hrRole);

        $employee = User::create([
            'name' => 'Nizar Jourchi',
            'email' => 'nizar.jourchi@elegantart.com',
            'password' => Hash::make('nizar123'),
            'email_verified_at' => now(),
        ]);
        $employee->roles()->attach($employeeRole);

        // 5. Créer les départements
        $dept1 = Department::create([
            'name' => 'Creative Studio',
            'description' => 'Équipe créative et design',
            'status' => 'active'
        ]);

        $dept2 = Department::create([
            'name' => 'Digital Marketing',
            'description' => 'Marketing et communication digitale',
            'status' => 'active'
        ]);

        $dept3 = Department::create([
            'name' => 'IT & Infrastructure',
            'description' => 'Support technique et infrastructure',
            'status' => 'active'
        ]);

        $dept4 = Department::create([
            'name' => 'Human Resources',
            'description' => 'Gestion des ressources humaines',
            'status' => 'active'
        ]);

        // 6. Créer les employés
        $employee1 = Employee::create([
            'employee_id' => 'E-4921',
            'user_id' => $employee->id,
            'first_name' => 'Nizar',
            'last_name' => 'Jourchi',
            'email' => 'nizar.jourchi@elegantart.com',
            'phone' => '+212 6 12 34 56 78',
            'position' => 'Senior Art Director',
            'department_id' => $dept1->id,
            'hire_date' => '2021-01-12',
            'salary' => 72500,
            'status' => 'active',
            'contract_type' => 'CDI',
            'nationality' => 'French',
            'birth_date' => '1998-03-14',
            'address' => '42 Rue des Artistes',
            'city' => 'Casablanca',
            'postal_code' => '25000',
            'country' => 'Morocco'
        ]);

        Employee::create([
            'employee_id' => 'E-2031',
            'user_id' => $hrManager->id,
            'first_name' => 'Siham',
            'last_name' => 'Housni',
            'email' => 'siham.housni@elegantart.com',
            'phone' => '+212 6 23 45 67 89',
            'position' => 'HR Manager',
            'department_id' => $dept4->id,
            'hire_date' => '2022-06-15',
            'salary' => 65000,
            'status' => 'active',
            'contract_type' => 'CDI',
            'nationality' => 'French',
            'birth_date' => '1985-09-20',
            'city' => 'Mohammedia',
            'country' => 'Morocco'
        ]);

        Employee::create([
            'employee_id' => 'E-2045',
            'user_id' => null,
            'first_name' => 'Alice',
            'last_name' => 'Johnson',
            'email' => 'alice.johnson@elegantart.com',
            'phone' => '+33 6 34 56 78 90',
            'position' => 'Lead Illustrator',
            'department_id' => $dept1->id,
            'hire_date' => '2022-03-10',
            'salary' => 52000,
            'status' => 'active',
            'contract_type' => 'CDI',
            'birth_date' => '1990-07-12',
            'city' => 'Paris',
            'country' => 'France'
        ]);

        // Mettre à jour le manager du département
        $dept1->manager_id = $employee1->id;
        $dept1->save();

        // 7. Créer des demandes de congés
        LeaveRequest::create([
            'employee_id' => $employee1->id,
            'leave_type' => 'annual',
            'start_date' => '2023-10-24',
            'end_date' => '2023-10-28',
            'total_days' => 5,
            'status' => 'pending',
            'reason' => 'Vacances familiales'
        ]);

        LeaveRequest::create([
            'employee_id' => $employee1->id,
            'leave_type' => 'sick',
            'start_date' => '2023-10-10',
            'end_date' => '2023-10-12',
            'total_days' => 3,
            'status' => 'approved',
            'reason' => 'Maladie',
            'approved_by' => $hrManager->id,
            'approved_at' => now()
        ]);

        // 8. Créer des absences
        Absence::create([
            'employee_id' => 3,
            'date' => '2023-10-23',
            'type' => 'personal',
            'status' => 'unjustified',
            'reason' => 'Raison personnelle',
            'recorded_by' => $hrManager->id
        ]);

        // 9. Créer des salaires
        Salary::create([
            'employee_id' => 1,
            'month' => '2023-10',
            'gross_amount' => 6041.67,
            'net_amount' => 4833.33,
            'tax_amount' => 1208.34,
            'status' => 'paid',
            'payment_date' => '2023-10-31',
            'payment_method' => 'bank_transfer'
        ]);

        Salary::create([
            'employee_id' => 2,
            'month' => '2023-10',
            'gross_amount' => 5416.67,
            'net_amount' => 4333.33,
            'tax_amount' => 1083.34,
            'status' => 'paid',
            'payment_date' => '2023-10-31',
            'payment_method' => 'bank_transfer'
        ]);

        Salary::create([
            'employee_id' => 3,
            'month' => '2023-10',
            'gross_amount' => 4333.33,
            'net_amount' => 3466.67,
            'tax_amount' => 866.66,
            'status' => 'paid',
            'payment_date' => '2023-10-31',
            'payment_method' => 'bank_transfer'
        ]);
    }
}