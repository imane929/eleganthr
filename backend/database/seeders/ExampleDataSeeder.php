<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Employee;
use App\Models\Department;
use App\Models\LeaveRequest;
use App\Models\Absence;
use App\Models\Salary;
use App\Models\Warning;
use App\Models\BonusType;
use App\Models\EmployeeBonus;
use App\Models\Intern;
use Carbon\Carbon;

class ExampleDataSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('Adding example data for all forms...');

        $departments = Department::all()->keyBy('name');

        // ============================================
        // BONUS TYPES (Types de primes)
        // ============================================
        $bonusTypes = [
            [
                'name' => 'Prime de performance',
                'code' => 'PERFORMANCE',
                'description' => 'Prime basée sur les performances individuelles et objectives',
                'calculation_type' => 'percentage',
                'default_value' => 0,
                'percentage_value' => 10,
                'is_taxable' => true,
                'payment_frequency' => 'quarterly',
            ],
            [
                'name' => 'Prime de transport',
                'code' => 'TRANSPORT',
                'description' => 'Allocation mensuelle de transport',
                'calculation_type' => 'fixed',
                'default_value' => 500,
                'is_taxable' => false,
                'payment_frequency' => 'monthly',
            ],
            [
                'name' => 'Prime de présence',
                'code' => 'PRESENCE',
                'description' => 'Prime pour présence régulière et ponctualité',
                'calculation_type' => 'fixed',
                'default_value' => 200,
                'is_taxable' => true,
                'payment_frequency' => 'monthly',
            ],
            [
                'name' => "Prime d'ancienneté",
                'code' => 'SENIORITY',
                'description' => 'Prime basée sur les années dexperience',
                'calculation_type' => 'tiered',
                'default_value' => 100,
                'is_taxable' => true,
                'payment_frequency' => 'monthly',
            ],
            [
                'name' => "Prime de fin d'année",
                'code' => 'YEAR_END',
                'description' => 'Prime annuelle de fin année',
                'calculation_type' => 'percentage',
                'default_value' => 0,
                'percentage_value' => 50,
                'is_taxable' => true,
                'payment_frequency' => 'annual',
            ],
            [
                'name' => "Prime d'inovation",
                'code' => 'INNOVATION',
                'description' => 'Prime pour idées innovantes et améliorations',
                'calculation_type' => 'fixed',
                'default_value' => 1000,
                'is_taxable' => true,
                'payment_frequency' => 'event_based',
            ],
            [
                'name' => 'Prime naissance',
                'code' => 'BIRTH',
                'description' => 'Prime pour événements familiaux (naissance)',
                'calculation_type' => 'fixed',
                'default_value' => 2000,
                'is_taxable' => false,
                'payment_frequency' => 'event_based',
            ],
            [
                'name' => 'Prime mariage',
                'code' => 'MARRIAGE',
                'description' => 'Prime pour mariage',
                'calculation_type' => 'fixed',
                'default_value' => 3000,
                'is_taxable' => false,
                'payment_frequency' => 'event_based',
            ],
        ];

        // Only create bonus types if none exist
        if (BonusType::count() == 0) {
            foreach ($bonusTypes as $type) {
                BonusType::create($type);
            }
            $this->command->info('Bonus types created: ' . count($bonusTypes));
        } else {
            $this->command->info('Bonus types already exist, skipping...');
        }

        // ============================================
        // EMPLOYEES (Employés)
        // ============================================
        if (Employee::count() > 0) {
            $this->command->info('Employees already exist, skipping...');
        } else {
            $employees = [
            [
                'employee_id' => 'E-1001',
                'first_name' => 'Ahmed',
                'last_name' => 'Benali',
                'email' => 'ahmed.benali@elegantart.ma',
                'phone' => '+212 6 11 22 33 44',
                'position' => 'Directeur Commercial',
                'department_id' => $departments['Commercial']->id ?? 1,
                'hire_date' => '2020-01-15',
                'salary' => 25000,
                'base_salary' => 25000,
                'currency' => 'MAD',
                'status' => 'active',
                'contract_type' => 'CDI',
                'nationality' => 'Marocaine',
                'birth_date' => '1985-05-10',
                'city' => 'Casablanca',
                'country' => 'Maroc',
                'transport_allowance' => 500,
                'housing_allowance' => 2000,
                'food_allowance' => 400,
                'seniority_years' => 4,
            ],
            [
                'employee_id' => 'E-1002',
                'first_name' => 'Fatima',
                'last_name' => 'Zahra',
                'email' => 'fatima.zahra@elegantart.ma',
                'phone' => '+212 6 22 33 44 55',
                'position' => 'Designer Graphique Senior',
                'department_id' => $departments['Graphique']->id ?? 5,
                'hire_date' => '2019-06-01',
                'salary' => 18000,
                'base_salary' => 18000,
                'currency' => 'MAD',
                'status' => 'active',
                'contract_type' => 'CDI',
                'nationality' => 'Marocaine',
                'birth_date' => '1990-08-22',
                'city' => 'Casablanca',
                'country' => 'Maroc',
                'transport_allowance' => 500,
                'housing_allowance' => 1500,
                'food_allowance' => 400,
                'seniority_years' => 5,
            ],
            [
                'employee_id' => 'E-1003',
                'first_name' => 'Youssef',
                'last_name' => 'Amrani',
                'email' => 'youssef.amrani@elegantart.ma',
                'phone' => '+212 6 33 44 55 66',
                'position' => 'Développeur Full Stack',
                'department_id' => $departments['Développement']->id ?? 2,
                'hire_date' => '2021-03-15',
                'salary' => 22000,
                'base_salary' => 22000,
                'currency' => 'MAD',
                'status' => 'active',
                'contract_type' => 'CDI',
                'nationality' => 'Marocaine',
                'birth_date' => '1992-11-05',
                'city' => 'Rabat',
                'country' => 'Maroc',
                'transport_allowance' => 600,
                'housing_allowance' => 1800,
                'food_allowance' => 400,
                'seniority_years' => 3,
            ],
            [
                'employee_id' => 'E-1004',
                'first_name' => 'Sara',
                'last_name' => 'Idrissi',
                'email' => 'sara.idrissi@elegantart.ma',
                'phone' => '+212 6 44 55 66 77',
                'position' => 'Responsable RH',
                'department_id' => $departments['RH']->id ?? 6,
                'hire_date' => '2018-09-01',
                'salary' => 20000,
                'base_salary' => 20000,
                'currency' => 'MAD',
                'status' => 'active',
                'contract_type' => 'CDI',
                'nationality' => 'Marocaine',
                'birth_date' => '1988-03-15',
                'city' => 'Casablanca',
                'country' => 'Maroc',
                'transport_allowance' => 500,
                'housing_allowance' => 1700,
                'food_allowance' => 400,
                'seniority_years' => 6,
            ],
            [
                'employee_id' => 'E-1005',
                'first_name' => 'Karim',
                'last_name' => 'El Fassi',
                'email' => 'karim.elfassi@elegantart.ma',
                'phone' => '+212 6 55 66 77 88',
                'position' => 'Technicien Print',
                'department_id' => $departments['Print']->id ?? 4,
                'hire_date' => '2022-01-10',
                'salary' => 12000,
                'base_salary' => 12000,
                'currency' => 'MAD',
                'status' => 'active',
                'contract_type' => 'CDI',
                'nationality' => 'Marocaine',
                'birth_date' => '1995-07-20',
                'city' => 'Casablanca',
                'country' => 'Maroc',
                'transport_allowance' => 400,
                'housing_allowance' => 1000,
                'food_allowance' => 400,
                'seniority_years' => 2,
            ],
            [
                'employee_id' => 'E-1006',
                'first_name' => 'Nadia',
                'last_name' => 'Mrani',
                'email' => 'nadia.mrani@elegantart.ma',
                'phone' => '+212 6 66 77 88 99',
                'position' => 'Expert Cybersécurité',
                'department_id' => $departments['Cybersecurity']->id ?? 3,
                'hire_date' => '2021-08-15',
                'salary' => 28000,
                'base_salary' => 28000,
                'currency' => 'MAD',
                'status' => 'active',
                'contract_type' => 'CDI',
                'nationality' => 'Marocaine',
                'birth_date' => '1987-12-03',
                'city' => 'Casablanca',
                'country' => 'Maroc',
                'transport_allowance' => 600,
                'housing_allowance' => 2200,
                'food_allowance' => 400,
                'seniority_years' => 3,
            ],
            [
                'employee_id' => 'E-1007',
                'first_name' => 'Omar',
                'last_name' => 'Benhaddou',
                'email' => 'omar.benhaddou@elegantart.ma',
                'phone' => '+212 6 77 88 99 00',
                'position' => 'Comptable',
                'department_id' => $departments['Administration']->id ?? 7,
                'hire_date' => '2020-05-20',
                'salary' => 15000,
                'base_salary' => 15000,
                'currency' => 'MAD',
                'status' => 'active',
                'contract_type' => 'CDI',
                'nationality' => 'Marocaine',
                'birth_date' => '1990-02-14',
                'city' => 'Casablanca',
                'country' => 'Maroc',
                'transport_allowance' => 500,
                'housing_allowance' => 1200,
                'food_allowance' => 400,
                'seniority_years' => 4,
            ],
            [
                'employee_id' => 'E-1008',
                'first_name' => 'Lina',
                'last_name' => 'Kettani',
                'email' => 'lina.kettani@elegantart.ma',
                'phone' => '+212 6 88 99 00 11',
                'position' => 'Graphiste',
                'department_id' => $departments['Graphique']->id ?? 5,
                'hire_date' => '2023-02-01',
                'salary' => 12000,
                'base_salary' => 12000,
                'currency' => 'MAD',
                'status' => 'active',
                'contract_type' => 'CDI',
                'nationality' => 'Marocaine',
                'birth_date' => '1998-06-25',
                'city' => 'Casablanca',
                'country' => 'Maroc',
                'transport_allowance' => 400,
                'housing_allowance' => 1000,
                'food_allowance' => 400,
                'seniority_years' => 1,
            ],
        ];

            foreach ($employees as $empData) {
                Employee::create($empData);
            }
            $this->command->info('Employees created: ' . count($employees));
        }

        $empList = Employee::all();

        // ============================================
        // LEAVE REQUESTS (Demandes de congés)
        // ============================================
        $leaveRequests = [
            [
                'employee_id' => $empList[0]->id,
                'leave_type' => 'annual',
                'start_date' => '2026-04-01',
                'end_date' => '2026-04-05',
                'total_days' => 5,
                'status' => 'approved',
                'reason' => 'Vacances de printemps',
                'approved_by' => 1,
                'approved_at' => Carbon::now()->subDays(5),
            ],
            [
                'employee_id' => $empList[1]->id,
                'leave_type' => 'sick',
                'start_date' => '2026-03-10',
                'end_date' => '2026-03-12',
                'total_days' => 3,
                'status' => 'approved',
                'reason' => 'Rendez-vous médical',
                'approved_by' => 1,
                'approved_at' => Carbon::now()->subDays(10),
            ],
            [
                'employee_id' => $empList[2]->id,
                'leave_type' => 'annual',
                'start_date' => '2026-04-15',
                'end_date' => '2026-04-25',
                'total_days' => 10,
                'status' => 'pending',
                'reason' => 'Voyage familial',
            ],
            [
                'employee_id' => $empList[3]->id,
                'leave_type' => 'personal',
                'start_date' => '2026-03-20',
                'end_date' => '2026-03-21',
                'total_days' => 2,
                'status' => 'approved',
                'reason' => 'Affaires personnelles urgentes',
                'approved_by' => 1,
                'approved_at' => Carbon::now()->subDays(3),
            ],
            [
                'employee_id' => $empList[4]->id,
                'leave_type' => 'sick',
                'start_date' => '2026-03-05',
                'end_date' => '2026-03-06',
                'total_days' => 2,
                'status' => 'approved',
                'reason' => 'Grippe',
                'approved_by' => 1,
                'approved_at' => Carbon::now()->subDays(15),
            ],
            [
                'employee_id' => $empList[5]->id,
                'leave_type' => 'annual',
                'start_date' => '2026-05-01',
                'end_date' => '2026-05-15',
                'total_days' => 12,
                'status' => 'pending',
                'reason' => "Vacances d'été",
            ],
            [
                'employee_id' => $empList[6]->id,
                'leave_type' => 'paternity',
                'start_date' => '2026-03-25',
                'end_date' => '2026-04-05',
                'total_days' => 10,
                'status' => 'approved',
                'reason' => 'Congé paternité',
                'approved_by' => 1,
                'approved_at' => Carbon::now()->subDays(2),
            ],
        ];

        foreach ($leaveRequests as $leave) {
            LeaveRequest::create($leave);
        }
        $this->command->info('Leave requests created: ' . count($leaveRequests));

        // ============================================
        // ABSENCES
        // ============================================
        $absences = [
            [
                'employee_id' => $empList[0]->id,
                'date' => '2026-03-15',
                'type' => 'absence',
                'reason' => 'Absence injustifiée',
                'status' => 'unjustified',
            ],
            [
                'employee_id' => $empList[1]->id,
                'date' => '2026-03-08',
                'type' => 'retard',
                'reason' => 'Retard exceptionnel',
                'status' => 'justified',
            ],
            [
                'employee_id' => $empList[3]->id,
                'date' => '2026-03-12',
                'type' => 'formation',
                'reason' => 'Formation externe',
                'status' => 'justified',
            ],
        ];

        foreach ($absences as $absence) {
            Absence::create($absence);
        }
        $this->command->info('Absences created: ' . count($absences));

        // ============================================
        // WARNINGS (Avertissements)
        // ============================================
        $warnings = [
            [
                'employee_id' => $empList[0]->id,
                'issued_by' => 1,
                'warning_type' => 'verbal',
                'incident_date' => Carbon::now()->subDays(32),
                'description' => 'Retards répétés',
                'warning_date' => Carbon::now()->subDays(30),
                'status' => 'active',
                'acknowledgment_date' => Carbon::now()->subDays(28),
            ],
            [
                'employee_id' => $empList[2]->id,
                'issued_by' => 1,
                'warning_type' => 'written',
                'incident_date' => Carbon::now()->subDays(17),
                'description' => 'Non-respect des délais de projet',
                'warning_date' => Carbon::now()->subDays(15),
                'status' => 'active',
                'acknowledgment_date' => Carbon::now()->subDays(12),
            ],
        ];

        foreach ($warnings as $warning) {
            Warning::create($warning);
        }
        $this->command->info('Warnings created: ' . count($warnings));

        // ============================================
        // SALARIES (Salaires - mois actuel)
        // ============================================
        $currentMonth = Carbon::now()->format('Y-m');
        
        if (Salary::count() == 0) {
            foreach ($empList as $emp) {
                $grossAmount = $emp->base_salary + $emp->transport_allowance + $emp->housing_allowance + $emp->food_allowance;
                $deductions = ($emp->base_salary * 0.0667) + ($emp->base_salary * 0.03) + ($emp->base_salary * 0.02);
                $taxAmount = ($emp->base_salary - ($emp->base_salary * 0.0667)) * 0.1;
                
                Salary::create([
                    'employee_id' => $emp->id,
                    'month' => $currentMonth,
                    'gross_amount' => $grossAmount,
                    'net_amount' => $grossAmount - $deductions - $taxAmount,
                    'tax_amount' => $taxAmount,
                    'bonus' => 0,
                    'deductions' => $deductions,
                    'status' => 'pending',
                ]);
            }
            $this->command->info('Salaries created for current month: ' . $empList->count());
        } else {
            $this->command->info('Salaries already exist, skipping...');
        }

        // ============================================
        // INTERNS (Stagiaires)
        // ============================================
        if (Intern::count() == 0) {
            $interns = [
                [
                    'first_name' => 'Mehdi',
                    'last_name' => 'Benjelloun',
                    'email' => 'mehdi.benjelloun@email.com',
                    'phone' => '+212 6 99 88 77 66',
                    'department_id' => $departments['Graphique']->id ?? 5,
                    'school_university' => 'ESMAD',
                    'study_level' => 'Bac+5',
                    'study_field' => 'Design Graphique',
                    'internship_start_date' => '2026-02-01',
                    'internship_end_date' => '2026-05-31',
                    'status' => 'active',
                    'monthly_stipend' => 3000,
                ],
                [
                    'first_name' => 'Houda',
                    'last_name' => 'Sqalli',
                    'email' => 'houda.sqalli@email.com',
                    'phone' => '+212 6 11 22 33 55',
                    'department_id' => $departments['Commercial']->id ?? 1,
                    'school_university' => 'ISGA',
                    'study_level' => 'Bac+3',
                    'study_field' => 'Marketing Digital',
                    'internship_start_date' => '2026-01-15',
                    'internship_end_date' => '2026-04-15',
                    'status' => 'active',
                    'monthly_stipend' => 2500,
                ],
                [
                    'first_name' => 'Taha',
                    'last_name' => 'Idrissi',
                    'email' => 'taha.idrissi@email.com',
                    'phone' => '+212 6 22 33 44 66',
                    'department_id' => $departments['Développement']->id ?? 2,
                    'school_university' => '1337',
                    'study_level' => 'Bac+4',
                    'study_field' => 'Développement Web',
                    'internship_start_date' => '2026-03-01',
                    'internship_end_date' => '2026-06-30',
                    'status' => 'active',
                    'monthly_stipend' => 3500,
                ],
            ];

            foreach ($interns as $internData) {
                Intern::create($internData);
            }
            $this->command->info('Interns created: ' . count($interns));
        } else {
            $this->command->info('Interns already exist, skipping...');
        }

        // ============================================
        // EMPLOYEE BONUSES (Primes attribuées)
        // ============================================
        $bonusTypeList = BonusType::all();
        
        $bonuses = [
            [
                'employee_id' => $empList[0]->id,
                'bonus_type_id' => $bonusTypeList->where('code', 'PERFORMANCE')->first()->id,
                'amount' => 2500,
                'effective_date' => Carbon::now()->startOfQuarter(),
                'end_date' => Carbon::now()->endOfQuarter(),
                'status' => 'approved',
                'justification' => 'Atteinte des objectifs commerciaux Q1',
                'approved_by' => 1,
                'approved_at' => Carbon::now()->subDays(10),
            ],
            [
                'employee_id' => $empList[1]->id,
                'bonus_type_id' => $bonusTypeList->where('code', 'PRESENCE')->first()->id,
                'amount' => 200,
                'effective_date' => Carbon::now()->startOfMonth(),
                'status' => 'approved',
                'justification' => 'Présence régulière en février',
                'approved_by' => 1,
                'approved_at' => Carbon::now()->subDays(5),
                'payment_status' => 'paid',
                'payment_date' => Carbon::now()->subDays(3),
            ],
            [
                'employee_id' => $empList[2]->id,
                'bonus_type_id' => $bonusTypeList->where('code', 'INNOVATION')->first()->id,
                'amount' => 1000,
                'effective_date' => Carbon::now()->subDays(20),
                'status' => 'pending',
                'justification' => 'Proposition architecture microservices',
            ],
            [
                'employee_id' => $empList[3]->id,
                'bonus_type_id' => $bonusTypeList->where('code', 'SENIORITY')->first()->id,
                'amount' => 300,
                'effective_date' => Carbon::now()->startOfMonth(),
                'status' => 'approved',
                'justification' => 'Prime ancienneté - 6 ans',
                'approved_by' => 1,
                'approved_at' => Carbon::now()->subDays(2),
            ],
        ];

        foreach ($bonuses as $bonus) {
            EmployeeBonus::create($bonus);
        }
        $this->command->info('Employee bonuses created: ' . count($bonuses));

        $this->command->info('All example data seeded successfully!');
    }
}
