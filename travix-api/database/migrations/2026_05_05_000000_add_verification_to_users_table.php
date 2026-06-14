<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('id_front_photo')->nullable()->after('avatar');
            $table->string('id_back_photo')->nullable()->after('id_front_photo');
            $table->string('id_selfie_photo')->nullable()->after('id_back_photo');
            $table->string('passport_photo')->nullable()->after('id_selfie_photo');
            // pending | approved | rejected
            $table->enum('verification_status', ['unverified','pending','approved','rejected'])
                  ->default('unverified')->after('passport_photo');
            $table->timestamp('verification_submitted_at')->nullable()->after('verification_status');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'id_front_photo','id_back_photo','id_selfie_photo',
                'passport_photo','verification_status','verification_submitted_at',
            ]);
        });
    }
};
