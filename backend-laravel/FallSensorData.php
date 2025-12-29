<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FallSensorData extends Model
{
    use HasFactory;

    protected $table = 'fall_sensor_data';

    protected $fillable = [
        'group_id',
        'user_id',
        'sensor_mac',
        'posture',
        'posture_pt',
        'acceleration_x',
        'acceleration_y',
        'acceleration_z',
        'gyro_x',
        'gyro_y',
        'gyro_z',
        'magnitude',
        'is_fall_detected',
        'confidence',
        'sensor_timestamp',
    ];

    protected $casts = [
        'acceleration_x' => 'decimal:6',
        'acceleration_y' => 'decimal:6',
        'acceleration_z' => 'decimal:6',
        'gyro_x' => 'decimal:6',
        'gyro_y' => 'decimal:6',
        'gyro_z' => 'decimal:6',
        'magnitude' => 'decimal:6',
        'is_fall_detected' => 'boolean',
        'confidence' => 'decimal:2',
        'sensor_timestamp' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relacionamento com User
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relacionamento com Group
     */
    public function group()
    {
        return $this->belongsTo(Group::class);
    }

    /**
     * Mapeamento de posturas para português
     */
    public static function getPostureNames()
    {
        return [
            'standing' => 'Em Pé',
            'sitting' => 'Sentado',
            'lying_ventral' => 'Deitado - Decúbito Ventral',
            'lying_dorsal' => 'Deitado - Decúbito Dorsal',
            'lying_lateral_right' => 'Deitado - Decúbito Lateral Direito',
            'lying_lateral_left' => 'Deitado - Decúbito Lateral Esquerdo',
            'fall' => 'Queda Detectada',
        ];
    }

    /**
     * Obter nome da postura em português
     */
    public function getPostureNameAttribute()
    {
        $names = self::getPostureNames();
        return $names[$this->posture] ?? $this->posture;
    }
}

