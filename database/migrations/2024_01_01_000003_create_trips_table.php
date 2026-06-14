<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('trips', function (Blueprint $table) {
            $table->id();
            $table->foreignId('traveler_id')->constrained('users')->onDelete('cascade');
            
            // Route Details
            $table->string('from_location');
            $table->string('from_country');
            $table->string('from_city');
            $table->string('to_location');
            $table->string('to_country');
            $table->string('to_city');
            
            // Travel Details
            $table->date('departure_date');
            $table->date('arrival_date')->nullable();
            $table->string('flight_number')->nullable();
            
            // Luggage Details
            $table->decimal('available_space', 8, 2); // in kg
            $table->decimal('used_space', 8, 2)->default(0);
            $table->decimal('price_per_kg', 8, 2);
            
            // Categories they can carry
            $table->json('accepted_categories')->nullable();
            
            // Status
            $table->enum('status', [
                'active',      // Available for requests
                'full',        // No more space
                'in_progress', // Currently traveling
                'completed',   // Trip finished
                'cancelled'    // Cancelled
            ])->default('active');
            
            // Verification
            $table->json('verification_documents')->nullable();
            $table->boolean('is_verified')->default(false);
            
            // Notes
            $table->text('notes')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index('traveler_id');
            $table->index('status');
            $table->index(['from_location', 'to_location']);
            $table->index('departure_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('trips');
    }
};
