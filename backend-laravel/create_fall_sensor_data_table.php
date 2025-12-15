<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('fall_sensor_data', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('group_id');
            $table->unsignedBigInteger('user_id');
            $table->string('sensor_mac', 17)->nullable(); // MAC address format: XX:XX:XX:XX:XX:XX
            $table->enum('posture', [
                'standing',
                'sitting',
                'lying_ventral',
                'lying_dorsal',
                'lying_lateral_right',
                'lying_lateral_left',
                'fall'
            ])->default('standing');
            $table->string('posture_pt', 50)->nullable(); // Nome em português
            $table->decimal('acceleration_x', 10, 6)->nullable();
            $table->decimal('acceleration_y', 10, 6)->nullable();
            $table->decimal('acceleration_z', 10, 6)->nullable();
            $table->decimal('gyro_x', 10, 6)->nullable();
            $table->decimal('gyro_y', 10, 6)->nullable();
            $table->decimal('gyro_z', 10, 6)->nullable();
            $table->decimal('magnitude', 10, 6)->nullable(); // Magnitude da aceleração
            $table->boolean('is_fall_detected')->default(false);
            $table->decimal('confidence', 5, 2)->nullable(); // Confiança da classificação (0-100)
            $table->timestamp('sensor_timestamp')->nullable(); // Timestamp do sensor
            $table->timestamps();

            // Foreign keys
            $table->foreign('group_id')->references('id')->on('groups')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');

            // Indexes para melhor performance
            $table->index('group_id');
            $table->index('user_id');
            $table->index('posture');
            $table->index('is_fall_detected');
            $table->index('sensor_timestamp');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fall_sensor_data');
    }
};

