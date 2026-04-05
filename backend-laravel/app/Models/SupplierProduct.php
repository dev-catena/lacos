<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SupplierProduct extends Model
{
    use HasFactory;

    protected $fillable = [
        'supplier_id',
        'name',
        'description',
        'price',
        'stock',
        'category',
        'image_url',
        'images',
        'payment_methods',
        'delivery_methods',
        'delivery_fee',
        'delivery_days',
        'free_delivery_above',
        'free_delivery_threshold',
        'weight',
        'length',
        'width',
        'height',
        'is_active',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'stock' => 'integer',
        'is_active' => 'boolean',
        'images' => 'array',
        'payment_methods' => 'array',
        'delivery_methods' => 'array',
        'delivery_fee' => 'decimal:2',
        'delivery_days' => 'integer',
        'free_delivery_above' => 'boolean',
        'free_delivery_threshold' => 'decimal:2',
        'weight' => 'decimal:2',
        'length' => 'decimal:2',
        'width' => 'decimal:2',
        'height' => 'decimal:2',
    ];

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }
}


