<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shipment_id')->constrained()->onDelete('cascade');
            $table->foreignId('sender_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('traveler_id')->nullable()->constrained('users')->onDelete('set null');
            $table->decimal('amount', 10, 2);
            $table->decimal('platform_fee', 10, 2)->default(0);
            $table->decimal('traveler_amount', 10, 2)->default(0);
            $table->string('currency', 3)->default('usd');
            $table->string('payment_method')->nullable();
            $table->string('payment_gateway_id')->nullable();
            $table->string('payment_intent_id')->nullable();
            // escrow = held, released = paid out to traveler, refunded = returned to sender
            $table->enum('status', ['escrow', 'released', 'refunded', 'failed'])->default('escrow');
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('released_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
