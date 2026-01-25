<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // Verificar se a tabela já existe
        if (Schema::hasTable('documents')) {
            // Se a tabela já existe, apenas garantir que file_type existe
            if (!Schema::hasColumn('documents', 'file_type')) {
                Schema::table('documents', function (Blueprint $table) {
                    // Se mime_type existe, renomear para file_type
                    if (Schema::hasColumn('documents', 'mime_type')) {
                        // MySQL não suporta renameColumn diretamente, então precisamos fazer via SQL
                        DB::statement('ALTER TABLE documents CHANGE mime_type file_type VARCHAR(100)');
                    } else {
                        // Se não existe nenhuma das duas, criar file_type
                        $table->string('file_type', 100)->after('file_name');
                    }
                });
            }
            return; // Não criar a tabela se já existe
        }
        
        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Quem fez upload
            $table->foreignId('doctor_id')->nullable()->constrained('doctors')->onDelete('set null');
            // consultation_id pode não existir ainda, então usar unsignedBigInteger
            $table->unsignedBigInteger('consultation_id')->nullable();
            $table->enum('type', ['exam_lab', 'exam_image', 'prescription', 'report', 'other']);
            $table->string('title', 200);
            $table->date('document_date');
            $table->text('file_path');
            $table->string('file_name', 500);
            $table->string('file_type', 100); // Tipo MIME do arquivo
            $table->integer('file_size')->nullable(); // em bytes
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
            
            // Índices
            $table->index(['group_id', 'type']);
            $table->index(['group_id', 'document_date']);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('documents');
    }
};

