<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('warnings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->onDelete('cascade');
            $table->foreignId('issued_by')->constrained('users')->onDelete('cascade');
            $table->foreignId('manager_id')->nullable()->constrained('users')->onDelete('set null');
            $table->enum('warning_type', ['verbal', 'written', 'final_written', 'suspension']);
            $table->enum('severity', ['low', 'medium', 'high', 'critical']);
            $table->date('incident_date');
            $table->date('warning_date');
            $table->text('description');
            $table->text('consequence')->nullable();
            $table->string('attachment_path')->nullable();
            $table->boolean('employee_acknowledged')->default(false);
            $table->date('acknowledgment_date')->nullable();
            $table->text('employee_signature')->nullable();
            $table->date('expiry_date')->nullable();
            $table->enum('status', ['active', 'expired', 'cleared'])->default('active');
            $table->text('resolution_notes')->nullable();
            $table->date('resolved_date')->nullable();
            $table->foreignId('resolved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('warnings');
    }
};
