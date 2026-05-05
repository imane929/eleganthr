<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employee_bonuses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->onDelete('cascade');
            $table->foreignId('bonus_type_id')->constrained('bonus_types')->onDelete('cascade');
            $table->decimal('amount', 12, 2);
            $table->decimal('calculated_amount', 12, 2)->nullable();
            $table->date('effective_date');
            $table->date('end_date')->nullable();
            $table->enum('status', ['active', 'pending', 'approved', 'rejected', 'expired', 'cancelled'])->default('pending');
            $table->enum('payment_status', ['unpaid', 'paid'])->default('unpaid');
            $table->date('payment_date')->nullable();
            $table->string('event_type')->nullable();
            $table->text('justification')->nullable();
            $table->string('attachment')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('requested_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->date('approved_at')->nullable();
            $table->string('rejection_reason')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employee_bonuses');
    }
};
