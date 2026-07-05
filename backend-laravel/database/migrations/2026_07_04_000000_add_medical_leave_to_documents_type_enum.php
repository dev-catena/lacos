<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE documents MODIFY COLUMN type ENUM('exam_lab','exam_image','prescription','medical_leave','medical_certificate','report','other') NOT NULL");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE documents MODIFY COLUMN type ENUM('exam_lab','exam_image','prescription','report','other') NOT NULL");
    }
};
