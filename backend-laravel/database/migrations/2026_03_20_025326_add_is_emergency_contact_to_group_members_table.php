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
        Schema::table('group_members', function (Blueprint $table) {
            if (!Schema::hasColumn('group_members', 'is_emergency_contact')) {
                $table->boolean('is_emergency_contact')->default(false)->after('role');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('group_members', function (Blueprint $table) {
            if (Schema::hasColumn('group_members', 'is_emergency_contact')) {
                $table->dropColumn('is_emergency_contact');
            }
        });
    }
};
