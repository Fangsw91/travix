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
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shipment_id')->constrained('shipments')->onDelete('cascade');
            $table->foreignId('sender_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('traveler_id')->nullable()->constrained('users')->onDelete('set null');
            
            // Payment Details
            $table->decimal('amount', 10, 2);
            $table->decimal('platform_fee', 10, 2)->default(0);
            $table->decimal('traveler_amount', 10, 2)->nullable();
            $table->string('currency', 3)->default('USD');
            
            // Payment Gateway
            $table->enum('payment_method', ['stripe', 'paypal', 'card', 'bank_transfer']);
            $table->string('payment_gateway_id')->nullable(); // Stripe/PayPal transaction ID
            $table->string('payment_intent_id')->nullable();
            
            // Status
            $table->enum('status', [
                'pending',
                'processing',
                'completed',
                'failed',
                'refunded',
                'held' // Held until delivery confirmation
            ])->default('pending');
            
            // Timestamps
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('released_at')->nullable(); // When released to traveler
            $table->timestamp('refunded_at')->nullable();
            
            // Additional Info
            $table->text('notes')->nullable();
            $table->text('failure_reason')->nullable();
            
            $table->timestamps();
            
            // Indexes
            $table->index('shipment_id');
            $table->index('sender_id');
            $table->index('traveler_id');
            $table->index('status');
            $table->index('payment_gateway_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
