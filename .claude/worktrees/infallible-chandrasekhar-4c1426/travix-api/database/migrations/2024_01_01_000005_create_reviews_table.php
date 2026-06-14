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
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shipment_id')->constrained('shipments')->onDelete('cascade');
            $table->foreignId('reviewer_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('reviewed_id')->constrained('users')->onDelete('cascade');
            
            $table->integer('rating'); // 1-5 stars
            $table->text('comment')->nullable();
            $table->enum('type', ['sender_to_traveler', 'traveler_to_sender']);
            
            $table->timestamps();
            
            // Indexes
            $table->index('shipment_id');
            $table->index('reviewer_id');
            $table->index('reviewed_id');
            $table->unique(['shipment_id', 'reviewer_id', 'type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};
