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
            // Verificar se as colunas já existem antes de adicionar
            if (!Schema::hasColumn('users', 'last_name')) {
                $table->string('last_name', 255)->nullable()->after('name');
            }
            if (!Schema::hasColumn('users', 'cpf')) {
                $table->string('cpf', 14)->nullable()->after('birth_date');
            }
            if (!Schema::hasColumn('users', 'address')) {
                $table->string('address', 255)->nullable()->after('cpf');
            }
            if (!Schema::hasColumn('users', 'address_number')) {
                $table->string('address_number', 20)->nullable()->after('address');
            }
            if (!Schema::hasColumn('users', 'address_complement')) {
                $table->string('address_complement', 255)->nullable()->after('address_number');
            }
            if (!Schema::hasColumn('users', 'state')) {
                $table->string('state', 2)->nullable()->after('city');
            }
            if (!Schema::hasColumn('users', 'zip_code')) {
                $table->string('zip_code', 10)->nullable()->after('state');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'last_name',
                'cpf',
                'address',
                'address_number',
                'address_complement',
                'state',
                'zip_code',
            ]);
        });
    }
};

