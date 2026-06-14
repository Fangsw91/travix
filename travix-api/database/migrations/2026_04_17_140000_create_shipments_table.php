<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shipments', function (Blueprint $table) {
            $table->id();
            $table->string('order_id')->unique(); // TRX-2026-XXXXXX
            $table->foreignId('sender_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('traveler_id')->nullable()->constrained('users')->nullOnDelete();

            // Item info
            $table->string('item_name');
            $table->string('category')->nullable();
            $table->decimal('weight', 8, 2)->default(0);
            $table->decimal('value', 10, 2)->default(0);
            $table->text('description')->nullable();

            // Route
            $table->string('pickup_location');
            $table->string('destination');
            $table->date('pickup_date')->nullable();
            $table->date('delivery_date')->nullable();

            // Receiver
            $table->string('receiver_name')->nullable();
            $table->string('receiver_phone')->nullable();
            $table->string('delivery_address')->nullable();

            // Payment
            $table->decimal('total_amount', 10, 2)->default(0);
            $table->string('payment_method_id')->nullable();
            $table->enum('payment_status', ['pending', 'paid', 'refunded'])->default('pending');

            // Status — this is what the live tracker watches
            $table->enum('status', [
                'requested',
                'accepted',
                'picked_up',
                'in_transit',
                'out_for_delivery',
                'delivered',
                'cancelled',
            ])->default('requested');

            $table->timestamp('status_updated_at')->nullable();
            $table->text('status_note')->nullable(); // e.g. "Departed Dubai airport"

            $table->timestamps();
        });

        // Timeline events log
        Schema::create('shipment_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shipment_id')->constrained()->onDelete('cascade');
            $table->string('status');
            $table->string('title');
            $table->string('description')->nullable();
            $table->string('location')->nullable();
            $table->timestamp('occurred_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shipment_events');
        Schema::dropIfExists('shipments');
    }
};
