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
        Schema::table('supplier_products', function (Blueprint $table) {
            // Múltiplas fotos (JSON)
            $table->json('images')->nullable()->after('image_url');
            
            // Formas de pagamento aceitas (JSON: ['credit_card', 'debit_card', 'pix', 'boleto'])
            $table->json('payment_methods')->nullable()->after('images');
            
            // Formas de entrega (JSON: ['delivery', 'pickup', 'both'])
            $table->json('delivery_methods')->nullable()->after('payment_methods');
            
            // Informações de entrega
            $table->decimal('delivery_fee', 10, 2)->nullable()->after('delivery_methods');
            $table->integer('delivery_days')->nullable()->after('delivery_fee'); // Prazo em dias
            $table->boolean('free_delivery_above')->nullable()->after('delivery_days');
            $table->decimal('free_delivery_threshold', 10, 2)->nullable()->after('free_delivery_above');
            
            // Dimensões e peso (para cálculo de frete)
            $table->decimal('weight', 8, 2)->nullable()->after('free_delivery_threshold'); // em kg
            $table->decimal('length', 8, 2)->nullable()->after('weight'); // em cm
            $table->decimal('width', 8, 2)->nullable()->after('length'); // em cm
            $table->decimal('height', 8, 2)->nullable()->after('width'); // em cm
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('supplier_products', function (Blueprint $table) {
            $table->dropColumn([
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
            ]);
        });
    }
};

