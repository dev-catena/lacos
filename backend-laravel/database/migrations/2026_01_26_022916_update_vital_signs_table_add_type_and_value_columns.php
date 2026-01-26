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
        Schema::table('vital_signs', function (Blueprint $table) {
            // Adicionar coluna 'type' se não existir
            if (!Schema::hasColumn('vital_signs', 'type')) {
                $table->string('type')->nullable()->after('measured_at');
            }
            
            // Adicionar coluna 'value' (JSON) se não existir
            if (!Schema::hasColumn('vital_signs', 'value')) {
                $table->json('value')->nullable()->after('type');
            }
            
            // Adicionar coluna 'unit' se não existir
            if (!Schema::hasColumn('vital_signs', 'unit')) {
                $table->string('unit')->nullable()->after('value');
            }
            
            // Adicionar coluna 'recorded_by' se não existir (renomear de registered_by_user_id se necessário)
            if (!Schema::hasColumn('vital_signs', 'recorded_by')) {
                if (Schema::hasColumn('vital_signs', 'registered_by_user_id')) {
                    // Renomear a coluna existente
                    $table->renameColumn('registered_by_user_id', 'recorded_by');
                } else {
                    // Criar nova coluna
                    $table->foreignId('recorded_by')->nullable()->constrained('users')->onDelete('cascade')->after('notes');
                }
            }
            
            // Adicionar índice se não existir
            if (!$this->indexExists('vital_signs', 'vital_signs_group_id_type_measured_at_index')) {
                $table->index(['group_id', 'type', 'measured_at'], 'vital_signs_group_id_type_measured_at_index');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('vital_signs', function (Blueprint $table) {
            // Remover índice
            if ($this->indexExists('vital_signs', 'vital_signs_group_id_type_measured_at_index')) {
                $table->dropIndex('vital_signs_group_id_type_measured_at_index');
            }
            
            // Não removemos as colunas para preservar dados
            // Se necessário, criar migração separada para remover
        });
    }
    
    /**
     * Verificar se um índice existe
     */
    private function indexExists($table, $indexName)
    {
        $connection = Schema::getConnection();
        $databaseName = $connection->getDatabaseName();
        
        $result = $connection->select(
            "SELECT COUNT(*) as count 
             FROM information_schema.statistics 
             WHERE table_schema = ? 
             AND table_name = ? 
             AND index_name = ?",
            [$databaseName, $table, $indexName]
        );
        
        return $result[0]->count > 0;
    }
};
