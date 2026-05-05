<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leave_policies', function (Blueprint $table) {
            $table->id();
            $table->string('leave_type')->unique(); // annual, sick, preavis, etc.
            $table->integer('notice_period_days')->default(0);
            $table->integer('max_days')->nullable();
            $table->boolean('requires_approval')->default(true);
            $table->text('description')->nullable();
            $table->timestamps();
        });

        // Insert default policies
        DB::table('leave_policies')->insert([
            ['leave_type' => 'annual', 'notice_period_days' => 7, 'max_days' => 22, 'requires_approval' => true, 'description' => 'Congé annuel'],
            ['leave_type' => 'sick', 'notice_period_days' => 0, 'max_days' => null, 'requires_approval' => true, 'description' => 'Congé maladie'],
            ['leave_type' => 'personal', 'notice_period_days' => 3, 'max_days' => 5, 'requires_approval' => true, 'description' => 'Congé personnel'],
            ['leave_type' => 'maternity', 'notice_period_days' => 0, 'max_days' => 98, 'requires_approval' => true, 'description' => 'Congé maternité'],
            ['leave_type' => 'paternity', 'notice_period_days' => 0, 'max_days' => 15, 'requires_approval' => true, 'description' => 'Congé paternité'],
            ['leave_type' => 'unpaid', 'notice_period_days' => 5, 'max_days' => null, 'requires_approval' => true, 'description' => 'Congé sans solde'],
            ['leave_type' => 'preavis', 'notice_period_days' => 0, 'max_days' => null, 'requires_approval' => true, 'description' => 'Préavis + Passation'],
        ]);

        Schema::table('leave_requests', function (Blueprint $table) {
            $table->integer('notice_period_days')->nullable()->after('total_days');
            $table->boolean('notice_period_met')->nullable()->after('notice_period_days');
            $table->boolean('manager_override')->default(false)->after('notice_period_met');
            $table->text('notice_warning')->nullable()->after('manager_override');
        });
    }

    public function down(): void
    {
        Schema::table('leave_requests', function (Blueprint $table) {
            $table->dropColumn(['notice_period_days', 'notice_period_met', 'manager_override', 'notice_warning']);
        });
        Schema::dropIfExists('leave_policies');
    }
};
