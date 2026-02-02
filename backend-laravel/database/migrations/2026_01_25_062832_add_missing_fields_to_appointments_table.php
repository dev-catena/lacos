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
        Schema::table('appointments', function (Blueprint $table) {
            // Adicionar appointment_date se não existir (coluna principal da data do compromisso)
            if (!Schema::hasColumn('appointments', 'appointment_date')) {
                $table->timestamp('appointment_date')->nullable()->after('description');
            }
            
            // Adicionar scheduled_at se não existir (data/hora agendada)
            if (!Schema::hasColumn('appointments', 'scheduled_at')) {
                $table->timestamp('scheduled_at')->nullable()->after('appointment_date');
            }
            
            // Adicionar medical_specialty_id se não existir
            if (!Schema::hasColumn('appointments', 'medical_specialty_id')) {
                $table->foreignId('medical_specialty_id')->nullable()->constrained('medical_specialties')->onDelete('set null')->after('doctor_id');
            }
            
            // Adicionar is_teleconsultation se não existir
            if (!Schema::hasColumn('appointments', 'is_teleconsultation')) {
                $table->boolean('is_teleconsultation')->default(false)->after('medical_specialty_id');
            }
            
            // Adicionar campos de recorrência se não existirem
            if (!Schema::hasColumn('appointments', 'recurrence_type')) {
                $table->enum('recurrence_type', ['none', 'daily', 'weekdays', 'custom'])->default('none')->after('notes');
            }
            
            if (!Schema::hasColumn('appointments', 'recurrence_days')) {
                $table->string('recurrence_days')->nullable()->after('recurrence_type');
            }
            
            if (!Schema::hasColumn('appointments', 'recurrence_start')) {
                $table->timestamp('recurrence_start')->nullable()->after('recurrence_days');
            }
            
            if (!Schema::hasColumn('appointments', 'recurrence_end')) {
                $table->timestamp('recurrence_end')->nullable()->after('recurrence_start');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            // Remover colunas adicionadas
            if (Schema::hasColumn('appointments', 'recurrence_end')) {
                $table->dropColumn('recurrence_end');
            }
            
            if (Schema::hasColumn('appointments', 'recurrence_start')) {
                $table->dropColumn('recurrence_start');
            }
            
            if (Schema::hasColumn('appointments', 'recurrence_days')) {
                $table->dropColumn('recurrence_days');
            }
            
            if (Schema::hasColumn('appointments', 'recurrence_type')) {
                $table->dropColumn('recurrence_type');
            }
            
            if (Schema::hasColumn('appointments', 'is_teleconsultation')) {
                $table->dropColumn('is_teleconsultation');
            }
            
            if (Schema::hasColumn('appointments', 'medical_specialty_id')) {
                $table->dropForeign(['medical_specialty_id']);
                $table->dropColumn('medical_specialty_id');
            }
            
            if (Schema::hasColumn('appointments', 'scheduled_at')) {
                $table->dropColumn('scheduled_at');
            }
            
            // Não removemos appointment_date pois pode ser necessário
            // if (Schema::hasColumn('appointments', 'appointment_date')) {
            //     $table->dropColumn('appointment_date');
            // }
        });
    }
};
