<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Add compensation fields to employees (check if not exists)
        Schema::table('employees', function (Blueprint $table) {
            if (!Schema::hasColumn('employees', 'base_salary')) {
                $table->decimal('base_salary', 12, 2)->nullable()->after('position');
            }
            if (!Schema::hasColumn('employees', 'contract_type')) {
                $table->string('contract_type', 50)->default('CDI')->after('base_salary');
            }
            if (!Schema::hasColumn('employees', 'currency')) {
                $table->string('currency', 10)->default('MAD')->after('contract_type');
            }
            if (!Schema::hasColumn('employees', 'transport_allowance')) {
                $table->decimal('transport_allowance', 10, 2)->default(0)->after('currency');
            }
            if (!Schema::hasColumn('employees', 'housing_allowance')) {
                $table->decimal('housing_allowance', 10, 2)->default(0)->after('transport_allowance');
            }
            if (!Schema::hasColumn('employees', 'food_allowance')) {
                $table->decimal('food_allowance', 10, 2)->default(0)->after('housing_allowance');
            }
            if (!Schema::hasColumn('employees', 'other_allowances')) {
                $table->decimal('other_allowances', 10, 2)->default(0)->after('food_allowance');
            }
            if (!Schema::hasColumn('employees', 'seniority_bonus')) {
                $table->decimal('seniority_bonus', 10, 2)->default(0)->after('other_allowances');
            }
            if (!Schema::hasColumn('employees', 'seniority_years')) {
                $table->integer('seniority_years')->default(0)->after('seniority_bonus');
            }
            if (!Schema::hasColumn('employees', 'salary_start_date')) {
                $table->date('salary_start_date')->nullable()->after('seniority_years');
            }
        });

        // Create salary_scales table
        Schema::create('salary_scales', function (Blueprint $table) {
            $table->id();
            $table->string('position')->nullable();
            $table->string('contract_type', 50);
            $table->integer('seniority_level')->default(0);
            $table->decimal('min_salary', 12, 2)->nullable();
            $table->decimal('max_salary', 12, 2)->nullable();
            $table->decimal('mid_salary', 12, 2)->nullable();
            $table->decimal('allowance_transport', 10, 2)->default(0);
            $table->decimal('allowance_housing', 10, 2)->default(0);
            $table->decimal('allowance_food', 10, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Insert default salary scales only if table is empty
        if (DB::table('salary_scales')->count() == 0) {
            $scales = [
                ['position' => 'Développeur', 'contract_type' => 'CDI', 'seniority_level' => 0, 'min_salary' => 6000, 'max_salary' => 8000, 'mid_salary' => 7000, 'allowance_transport' => 500, 'allowance_housing' => 1000, 'allowance_food' => 400],
                ['position' => 'Développeur', 'contract_type' => 'CDI', 'seniority_level' => 3, 'min_salary' => 8000, 'max_salary' => 12000, 'mid_salary' => 10000, 'allowance_transport' => 500, 'allowance_housing' => 1500, 'allowance_food' => 400],
                ['position' => 'Designer', 'contract_type' => 'CDI', 'seniority_level' => 0, 'min_salary' => 5000, 'max_salary' => 7000, 'mid_salary' => 6000, 'allowance_transport' => 500, 'allowance_housing' => 800, 'allowance_food' => 400],
                ['position' => 'Designer', 'contract_type' => 'CDI', 'seniority_level' => 3, 'min_salary' => 7000, 'max_salary' => 10000, 'mid_salary' => 8500, 'allowance_transport' => 500, 'allowance_housing' => 1200, 'allowance_food' => 400],
                ['position' => 'Manager', 'contract_type' => 'CDI', 'seniority_level' => 0, 'min_salary' => 12000, 'max_salary' => 15000, 'mid_salary' => 13500, 'allowance_transport' => 800, 'allowance_housing' => 2000, 'allowance_food' => 500],
                ['position' => 'Stagiaire', 'contract_type' => 'Intern', 'seniority_level' => 0, 'min_salary' => 2000, 'max_salary' => 3500, 'mid_salary' => 2750, 'allowance_transport' => 300, 'allowance_housing' => 0, 'allowance_food' => 300],
                ['position' => 'CDD', 'contract_type' => 'CDD', 'seniority_level' => 0, 'min_salary' => 5000, 'max_salary' => 10000, 'mid_salary' => 7500, 'allowance_transport' => 500, 'allowance_housing' => 1000, 'allowance_food' => 400],
            ];
            DB::table('salary_scales')->insert($scales);
        }

        // Create salary_history table
        Schema::create('salary_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->onDelete('cascade');
            $table->decimal('base_salary', 12, 2);
            $table->decimal('transport_allowance', 10, 2)->default(0);
            $table->decimal('housing_allowance', 10, 2)->default(0);
            $table->decimal('food_allowance', 10, 2)->default(0);
            $table->decimal('other_allowances', 10, 2)->default(0);
            $table->decimal('total_salary', 12, 2);
            $table->string('change_type');
            $table->text('reason')->nullable();
            $table->foreignId('changed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->date('effective_date');
            $table->timestamps();
        });

        // Create merit_increases table
        Schema::create('merit_increases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->onDelete('cascade');
            $table->decimal('current_salary', 12, 2);
            $table->decimal('proposed_increase_percent', 5, 2)->default(0);
            $table->decimal('proposed_increase_amount', 12, 2)->default(0);
            $table->decimal('new_salary', 12, 2);
            $table->string('status')->default('pending');
            $table->text('reason')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->foreignId('requested_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->date('effective_date')->nullable();
            $table->timestamps();
        });

        // Create department_budgets table
        Schema::create('department_budgets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('department_id')->constrained()->onDelete('cascade');
            $table->integer('year');
            $table->decimal('annual_budget', 14, 2);
            $table->decimal('allocated_q1', 14, 2)->default(0);
            $table->decimal('allocated_q2', 14, 2)->default(0);
            $table->decimal('allocated_q3', 14, 2)->default(0);
            $table->decimal('allocated_q4', 14, 2)->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->unique(['department_id', 'year']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('department_budgets');
        Schema::dropIfExists('merit_increases');
        Schema::dropIfExists('salary_histories');
        Schema::dropIfExists('salary_scales');
    }
};
