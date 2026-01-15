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
            // Status de pagamento
            if (!Schema::hasColumn('appointments', 'payment_status')) {
                $table->enum('payment_status', ['pending', 'paid_held', 'released', 'refunded'])->default('pending')->after('status');
            }
            
            // Valor da consulta
            if (!Schema::hasColumn('appointments', 'amount')) {
                $table->decimal('amount', 10, 2)->nullable()->after('payment_status');
            }
            
            // IDs do gateway
            if (!Schema::hasColumn('appointments', 'payment_id')) {
                $table->string('payment_id', 255)->nullable()->after('amount');
            }
            if (!Schema::hasColumn('appointments', 'payment_hold_id')) {
                $table->string('payment_hold_id', 255)->nullable()->after('payment_id');
            }
            if (!Schema::hasColumn('appointments', 'refund_id')) {
                $table->string('refund_id', 255)->nullable()->after('payment_hold_id');
            }
            
            // Timestamps de pagamento
            if (!Schema::hasColumn('appointments', 'paid_at')) {
                $table->datetime('paid_at')->nullable()->after('refund_id');
            }
            if (!Schema::hasColumn('appointments', 'held_at')) {
                $table->datetime('held_at')->nullable()->after('paid_at');
            }
            if (!Schema::hasColumn('appointments', 'released_at')) {
                $table->datetime('released_at')->nullable()->after('held_at');
            }
            if (!Schema::hasColumn('appointments', 'refunded_at')) {
                $table->datetime('refunded_at')->nullable()->after('released_at');
            }
            if (!Schema::hasColumn('appointments', 'confirmed_at')) {
                $table->datetime('confirmed_at')->nullable()->after('refunded_at');
            }
            
            // Metadados
            if (!Schema::hasColumn('appointments', 'confirmed_by')) {
                $table->enum('confirmed_by', ['patient', 'system_auto', 'system_doctor_absence', 'system_patient_absence'])->nullable()->after('confirmed_at');
            }
            if (!Schema::hasColumn('appointments', 'cancelled_by')) {
                $table->enum('cancelled_by', ['doctor', 'patient', 'system_doctor_absence', 'system_patient_absence'])->nullable()->after('confirmed_by');
            }
            
            // Divisão de valores
            if (!Schema::hasColumn('appointments', 'doctor_amount')) {
                $table->decimal('doctor_amount', 10, 2)->nullable()->after('cancelled_by');
            }
            if (!Schema::hasColumn('appointments', 'platform_amount')) {
                $table->decimal('platform_amount', 10, 2)->nullable()->after('doctor_amount');
            }
            
            // Índices
            $table->index('payment_status', 'idx_payment_status');
            $table->index('scheduled_at', 'idx_scheduled_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropIndex('idx_payment_status');
            $table->dropIndex('idx_scheduled_at');
            
            $columns = [
                'payment_status', 'amount', 'payment_id', 'payment_hold_id', 'refund_id',
                'paid_at', 'held_at', 'released_at', 'refunded_at', 'confirmed_at',
                'confirmed_by', 'cancelled_by', 'doctor_amount', 'platform_amount'
            ];
            
            foreach ($columns as $column) {
                if (Schema::hasColumn('appointments', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};

