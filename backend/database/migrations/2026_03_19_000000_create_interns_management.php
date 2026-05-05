<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Create interns table
        Schema::create('interns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->nullable()->constrained('employees')->onDelete('set null');
            $table->string('first_name');
            $table->string('last_name');
            $table->string('email')->unique();
            $table->string('phone')->nullable();
            $table->string('school_university')->nullable();
            $table->string('study_level')->nullable(); // BAC+2, BAC+3, BAC+4, BAC+5
            $table->string('study_field')->nullable(); // Computer Science, Engineering, etc.
            $table->date('internship_start_date');
            $table->date('internship_end_date');
            $table->string('academic_supervisor_name')->nullable();
            $table->string('academic_supervisor_email')->nullable();
            $table->string('academic_supervisor_phone')->nullable();
            $table->decimal('monthly_stipend', 10, 2)->default(0);
            $table->string('agreement_document')->nullable();
            $table->string('status')->default('active'); // active, completed, terminated, converted
            $table->text('termination_reason')->nullable();
            $table->date('termination_date')->nullable();
            $table->foreignId('department_id')->nullable()->constrained()->onDelete('set null');
            $table->string('position')->nullable();
            $table->unsignedBigInteger('supervisor_id')->nullable();
            $table->foreign('supervisor_id')->references('id')->on('users')->onDelete('set null');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // Create intern_evaluations table
        Schema::create('intern_evaluations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('intern_id')->constrained('interns')->onDelete('cascade');
            $table->unsignedBigInteger('evaluated_by')->nullable();
            $table->foreign('evaluated_by')->references('id')->on('users')->onDelete('set null');
            $table->integer('month_number'); // 1, 2, 3, etc.
            $table->integer('technical_skills')->default(0); // 1-10
            $table->integer('communication')->default(0);
            $table->integer('teamwork')->default(0);
            $table->integer('initiative')->default(0);
            $table->integer('professionalism')->default(0);
            $table->decimal('overall_score', 3, 1)->default(0);
            $table->text('strengths')->nullable();
            $table->text('areas_for_improvement')->nullable();
            $table->text('comments')->nullable();
            $table->string('status')->default('draft'); // draft, submitted
            $table->date('evaluation_date');
            $table->timestamps();
        });

        // Add intern category to leave_policies
        Schema::table('leave_policies', function (Blueprint $table) {
            // Update existing or insert intern-specific policies
        });

        // Insert intern-specific leave policies
        $internPolicies = [
            ['leave_type' => 'intern_sick', 'notice_period_days' => 0, 'max_days' => 2, 'requires_approval' => true, 'description' => 'Congé maladie (Stagiaire)'],
            ['leave_type' => 'intern_unpaid', 'notice_period_days' => 0, 'max_days' => 5, 'requires_approval' => true, 'description' => 'Congé sans solde (Stagiaire)'],
        ];
        
        foreach ($internPolicies as $policy) {
            DB::table('leave_policies')->updateOrInsert(
                ['leave_type' => $policy['leave_type']],
                $policy
            );
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('intern_evaluations');
        Schema::dropIfExists('interns');
    }
};
