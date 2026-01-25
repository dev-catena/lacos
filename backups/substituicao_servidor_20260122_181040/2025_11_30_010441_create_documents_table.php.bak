<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
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
            $table->string('mime_type', 100);
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

