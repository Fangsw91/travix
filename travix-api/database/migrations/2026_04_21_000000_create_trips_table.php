<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trips', function (Blueprint $table) {
            $table->id();
            $table->foreignId('traveler_id')->constrained('users')->cascadeOnDelete();
            $table->string('from_location');
            $table->string('from_country')->nullable();
            $table->string('from_city')->nullable();
            $table->string('to_location');
            $table->string('to_country')->nullable();
            $table->string('to_city')->nullable();
            $table->date('departure_date');
            $table->date('arrival_date')->nullable();
            $table->decimal('available_space', 8, 2)->default(0);  // kg
            $table->decimal('price_per_kg', 8, 2)->default(0);
            $table->json('accepted_categories')->nullable();
            $table->text('notes')->nullable();
            $table->enum('status', ['active', 'cancelled', 'completed'])->default('active');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trips');
    }
};
