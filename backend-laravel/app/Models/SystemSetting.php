<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SystemSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'value',
        'type',
        'description',
        'category',
    ];

    /**
     * Obter valor tipado da configuração
     */
    public function getTypedValue()
    {
        switch ($this->type) {
            case 'integer':
                return (int) $this->value;
            case 'boolean':
                return filter_var($this->value, FILTER_VALIDATE_BOOLEAN);
            case 'json':
                return json_decode($this->value, true);
            default:
                return $this->value;
        }
    }

    /**
     * Buscar configuração por chave
     */
    public static function getValue($key, $default = null)
    {
        $setting = self::where('key', $key)->first();
        return $setting ? $setting->getTypedValue() : $default;
    }

    /**
     * Definir valor de configuração
     */
    public static function setValue($key, $value, $type = 'string', $description = null, $category = 'general')
    {
        $setting = self::firstOrNew(['key' => $key]);
        $setting->value = is_array($value) ? json_encode($value) : (string) $value;
        $setting->type = $type;
        if ($description) {
            $setting->description = $description;
        }
        if ($category) {
            $setting->category = $category;
        }
        $setting->save();
        return $setting;
    }
}
