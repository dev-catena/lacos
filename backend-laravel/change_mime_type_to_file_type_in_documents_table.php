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
        // Verificar se a coluna mime_type existe
        if (Schema::hasColumn('documents', 'mime_type')) {
            // Renomear mime_type para file_type
            Schema::table('documents', function (Blueprint $table) {
                $table->renameColumn('mime_type', 'file_type');
            });
        } elseif (!Schema::hasColumn('documents', 'file_type')) {
            // Se não existe nenhuma das duas, criar file_type
            Schema::table('documents', function (Blueprint $table) {
                $table->string('file_type', 100)->after('file_name');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reverter: renomear file_type de volta para mime_type
        if (Schema::hasColumn('documents', 'file_type')) {
            Schema::table('documents', function (Blueprint $table) {
                $table->renameColumn('file_type', 'mime_type');
            });
        }
    }
};







