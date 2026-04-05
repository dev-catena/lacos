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
        Schema::table('groups', function (Blueprint $table) {
            // Determinar a última coluna existente para adicionar após ela
            $lastColumn = 'is_active';
            if (Schema::hasColumn('groups', 'photo')) {
                $lastColumn = 'photo';
            } elseif (Schema::hasColumn('groups', 'description')) {
                $lastColumn = 'description';
            }
            
            // Sinais vitais a monitorar
            if (!Schema::hasColumn('groups', 'monitor_blood_pressure')) {
                $table->boolean('monitor_blood_pressure')->default(false)->after($lastColumn);
                $lastColumn = 'monitor_blood_pressure';
            }
            if (!Schema::hasColumn('groups', 'monitor_heart_rate')) {
                $table->boolean('monitor_heart_rate')->default(false)->after($lastColumn);
                $lastColumn = 'monitor_heart_rate';
            }
            if (!Schema::hasColumn('groups', 'monitor_oxygen_saturation')) {
                $table->boolean('monitor_oxygen_saturation')->default(false)->after($lastColumn);
                $lastColumn = 'monitor_oxygen_saturation';
            }
            if (!Schema::hasColumn('groups', 'monitor_blood_glucose')) {
                $table->boolean('monitor_blood_glucose')->default(false)->after($lastColumn);
                $lastColumn = 'monitor_blood_glucose';
            }
            if (!Schema::hasColumn('groups', 'monitor_temperature')) {
                $table->boolean('monitor_temperature')->default(false)->after($lastColumn);
                $lastColumn = 'monitor_temperature';
            }
            if (!Schema::hasColumn('groups', 'monitor_respiratory_rate')) {
                $table->boolean('monitor_respiratory_rate')->default(false)->after($lastColumn);
                $lastColumn = 'monitor_respiratory_rate';
            }
            
            // Permissões do acompanhado
            if (!Schema::hasColumn('groups', 'accompanied_notify_medication')) {
                $table->boolean('accompanied_notify_medication')->default(true)->after($lastColumn);
                $lastColumn = 'accompanied_notify_medication';
            }
            if (!Schema::hasColumn('groups', 'accompanied_notify_appointment')) {
                $table->boolean('accompanied_notify_appointment')->default(true)->after($lastColumn);
                $lastColumn = 'accompanied_notify_appointment';
            }
            if (!Schema::hasColumn('groups', 'accompanied_access_history')) {
                $table->boolean('accompanied_access_history')->default(true)->after($lastColumn);
                $lastColumn = 'accompanied_access_history';
            }
            if (!Schema::hasColumn('groups', 'accompanied_access_medication')) {
                $table->boolean('accompanied_access_medication')->default(true)->after($lastColumn);
                $lastColumn = 'accompanied_access_medication';
            }
            if (!Schema::hasColumn('groups', 'accompanied_access_schedule')) {
                $table->boolean('accompanied_access_schedule')->default(true)->after($lastColumn);
                $lastColumn = 'accompanied_access_schedule';
            }
            if (!Schema::hasColumn('groups', 'accompanied_access_chat')) {
                $table->boolean('accompanied_access_chat')->default(false)->after($lastColumn);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('groups', function (Blueprint $table) {
            $columns = [
                'monitor_blood_pressure',
                'monitor_heart_rate',
                'monitor_oxygen_saturation',
                'monitor_blood_glucose',
                'monitor_temperature',
                'monitor_respiratory_rate',
                'accompanied_notify_medication',
                'accompanied_notify_appointment',
                'accompanied_access_history',
                'accompanied_access_medication',
                'accompanied_access_schedule',
                'accompanied_access_chat',
            ];
            
            foreach ($columns as $column) {
                if (Schema::hasColumn('groups', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};

