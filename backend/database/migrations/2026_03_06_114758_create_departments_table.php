<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('departments', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->unsignedBigInteger('manager_id')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();

            // Foreign key removed - will be added later after employees table exists
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('departments');
    }
};
