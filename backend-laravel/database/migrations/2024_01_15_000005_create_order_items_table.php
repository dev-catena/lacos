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
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->onDelete('cascade');
            $table->foreignId('product_id')->nullable()->constrained('supplier_products')->onDelete('set null');
            $table->string('product_name'); // Nome do produto no momento da compra (snapshot)
            $table->text('product_description')->nullable();
            $table->decimal('price', 10, 2); // Preço no momento da compra
            $table->integer('quantity');
            $table->decimal('subtotal', 10, 2);
            $table->timestamps();
            
            $table->index('order_id');
            $table->index('product_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_items');
    }
};

