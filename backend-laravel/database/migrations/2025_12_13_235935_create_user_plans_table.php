<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create("user_plans", function (Blueprint $table) {
            $table->id();
            $table->foreignId("user_id")->constrained()->onDelete("cascade");
            $table->foreignId("plan_id")->constrained()->onDelete("cascade");
            $table->boolean("is_active")->default(true);
            $table->timestamp("started_at")->nullable();
            $table->timestamp("expires_at")->nullable();
            $table->timestamps();
            $table->index(["user_id", "is_active"]);
        });

        $defaultPlan = DB::table("plans")->where("is_default", true)->first();
        if ($defaultPlan) {
            $users = DB::table("users")->get();
            foreach ($users as $user) {
                DB::table("user_plans")->insert([
                    "user_id" => $user->id,
                    "plan_id" => $defaultPlan->id,
                    "is_active" => true,
                    "started_at" => now(),
                    "created_at" => now(),
                    "updated_at" => now(),
                ]);
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists("user_plans");
    }
};
