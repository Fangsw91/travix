<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Location pings log
        Schema::create('shipment_locations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shipment_id')->constrained()->onDelete('cascade');
            $table->decimal('lat', 10, 7);
            $table->decimal('lng', 10, 7);
            $table->string('address')->nullable();
            $table->timestamp('recorded_at');
            $table->timestamps();
        });

        // Add current coords to shipments
        Schema::table('shipments', function (Blueprint $table) {
            $table->decimal('current_lat', 10, 7)->nullable()->after('status_note');
            $table->decimal('current_lng', 10, 7)->nullable()->after('current_lat');
            $table->string('current_address')->nullable()->after('current_lng');
            $table->timestamp('location_updated_at')->nullable()->after('current_address');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shipment_locations');
        Schema::table('shipments', function (Blueprint $table) {
            $table->dropColumn(['current_lat','current_lng','current_address','location_updated_at']);
        });
    }
};
