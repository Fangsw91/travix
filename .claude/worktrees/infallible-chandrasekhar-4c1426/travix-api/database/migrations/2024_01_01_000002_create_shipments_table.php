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
        Schema::create('shipments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sender_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('traveler_id')->nullable()->constrained('users')->onDelete('set null');
            
            // Item Details
            $table->string('item_name');
            $table->text('description')->nullable();
            $table->enum('category', ['electronics', 'documents', 'clothing', 'gifts', 'food', 'medicines', 'other']);
            $table->decimal('weight', 8, 2); // in kg
            $table->decimal('value', 10, 2)->nullable(); // item value in USD
            
            // Location Details
            $table->string('pickup_location');
            $table->string('pickup_country');
            $table->string('pickup_city');
            $table->string('pickup_address')->nullable();
            $table->string('destination');
            $table->string('destination_country');
            $table->string('destination_city');
            $table->string('destination_address')->nullable();
            
            // Receiver Details
            $table->string('receiver_name');
            $table->string('receiver_phone');
            $table->string('receiver_email')->nullable();
            
            // Dates
            $table->date('pickup_date');
            $table->date('delivery_date')->nullable();
            $table->timestamp('accepted_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            
            // Pricing
            $table->decimal('price', 10, 2); // total price
            $table->decimal('platform_fee', 10, 2)->default(0);
            $table->decimal('traveler_earnings', 10, 2)->nullable();
            
            // Status
            $table->enum('status', [
                'pending',      // Waiting for traveler
                'matched',      // Traveler found
                'accepted',     // Traveler accepted
                'in_transit',   // Being delivered
                'delivered',    // Completed
                'cancelled',    // Cancelled
                'disputed'      // Issue reported
            ])->default('pending');
            
            // Files
            $table->json('item_images')->nullable();
            $table->json('documents')->nullable();
            
            // Notes
            $table->text('special_instructions')->nullable();
            $table->text('cancellation_reason')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index('sender_id');
            $table->index('traveler_id');
            $table->index('status');
            $table->index(['pickup_location', 'destination']);
            $table->index('pickup_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shipments');
    }
};
