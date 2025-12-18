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
        Schema::table('users', function (Blueprint $table) {
            // Campos para 2FA
            $table->boolean('two_factor_enabled')->default(false)->after('is_blocked');
            $table->string('two_factor_method')->nullable()->after('two_factor_enabled'); // 'whatsapp', 'sms', 'app'
            $table->string('two_factor_phone')->nullable()->after('two_factor_method');
            $table->string('two_factor_code')->nullable()->after('two_factor_phone');
            $table->timestamp('two_factor_expires_at')->nullable()->after('two_factor_code');
            $table->string('two_factor_secret')->nullable()->after('two_factor_expires_at'); // Para app autenticador
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'two_factor_enabled',
                'two_factor_method',
                'two_factor_phone',
                'two_factor_code',
                'two_factor_expires_at',
                'two_factor_secret',
            ]);
        });
    }
};

