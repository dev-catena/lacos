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
            // Campos de localização (adicionar apenas se não existirem)
            if (!Schema::hasColumn('users', 'latitude')) {
                $table->decimal('latitude', 10, 8)->nullable()->after('profile');
            }
            if (!Schema::hasColumn('users', 'longitude')) {
                $table->decimal('longitude', 11, 8)->nullable()->after('latitude');
            }
            if (!Schema::hasColumn('users', 'city')) {
                $table->string('city', 100)->nullable()->after('longitude');
            }
            if (!Schema::hasColumn('users', 'neighborhood')) {
                $table->string('neighborhood', 100)->nullable()->after('city');
            }
            
            // Campos específicos de cuidador profissional (adicionar apenas se não existirem)
            if (!Schema::hasColumn('users', 'formation_details')) {
                $table->text('formation_details')->nullable()->after('neighborhood');
            }
            if (!Schema::hasColumn('users', 'hourly_rate')) {
                $table->decimal('hourly_rate', 8, 2)->nullable()->after('formation_details');
            }
            if (!Schema::hasColumn('users', 'availability')) {
                $table->text('availability')->nullable()->after('hourly_rate');
            }
            if (!Schema::hasColumn('users', 'is_available')) {
                $table->boolean('is_available')->default(true)->after('availability');
            }
            // gender já existe, não adicionar novamente
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $columns = ['latitude', 'longitude', 'city', 'neighborhood', 'formation_details', 'hourly_rate', 'availability', 'is_available'];
            foreach ($columns as $column) {
                if (Schema::hasColumn('users', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};

