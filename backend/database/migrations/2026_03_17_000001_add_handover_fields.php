<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Add handover fields to leave_requests
        Schema::table('leave_requests', function (Blueprint $table) {
            $table->boolean('handover_required')->default(false)->after('notice_warning');
            $table->string('handover_recipient')->nullable()->after('handover_required');
            $table->boolean('handover_completed')->default(false)->after('handover_recipient');
            $table->datetime('handover_completed_at')->nullable()->after('handover_completed');
            $table->text('handover_notes')->nullable()->after('handover_completed_at');
        });

        // Update leave_policies to add handover threshold
        Schema::table('leave_policies', function (Blueprint $table) {
            $table->integer('handover_threshold_days')->default(5)->after('notice_period_days');
        });

        // Update default policies
        DB::table('leave_policies')
            ->where('leave_type', 'annual')
            ->update(['handover_threshold_days' => 5]);

        DB::table('leave_policies')
            ->where('leave_type', 'preavis')
            ->update(['handover_threshold_days' => 0]);
    }

    public function down(): void
    {
        Schema::table('leave_requests', function (Blueprint $table) {
            $table->dropColumn([
                'handover_required',
                'handover_recipient',
                'handover_completed',
                'handover_completed_at',
                'handover_notes'
            ]);
        });

        Schema::table('leave_policies', function (Blueprint $table) {
            $table->dropColumn('handover_threshold_days');
        });
    }
};
