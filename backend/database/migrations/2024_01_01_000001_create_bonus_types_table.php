<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bonus_types', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->text('description')->nullable();
            $table->enum('calculation_type', ['fixed', 'percentage', 'formula', 'tiered'])->default('fixed');
            $table->decimal('default_value', 12, 2)->default(0);
            $table->decimal('percentage_value', 5, 2)->nullable();
            $table->string('formula')->nullable();
            $table->boolean('is_taxable')->default(true);
            $table->enum('payment_frequency', ['one_time', 'monthly', 'quarterly', 'annual', 'event_based'])->default('monthly');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bonus_types');
    }
};
