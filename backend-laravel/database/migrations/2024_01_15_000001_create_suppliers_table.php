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
        Schema::create('suppliers', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            
            // Dados da empresa
            $table->string('company_name');
            $table->enum('company_type', ['pessoa_fisica', 'pessoa_juridica']);
            $table->string('cnpj', 18)->nullable();
            $table->string('cpf', 14)->nullable();
            
            // Endereço
            $table->string('address')->nullable();
            $table->string('address_number', 20)->nullable();
            $table->string('address_complement')->nullable();
            $table->string('neighborhood', 100)->nullable();
            $table->string('city', 100)->nullable();
            $table->string('state', 2)->nullable();
            $table->string('zip_code', 10)->nullable();
            
            // Dados bancários
            $table->string('bank_name', 100)->nullable();
            $table->string('bank_code', 10)->nullable();
            $table->string('agency', 20)->nullable();
            $table->string('account', 50)->nullable();
            $table->enum('account_type', ['checking', 'savings'])->nullable();
            $table->string('account_holder_name')->nullable();
            $table->string('account_holder_document', 20)->nullable();
            $table->string('pix_key')->nullable();
            $table->string('pix_key_type', 20)->nullable();
            
            // Stripe (gateway de pagamento)
            $table->string('stripe_account_id')->nullable();
            $table->boolean('stripe_onboarding_completed')->default(false);
            
            // Informações do negócio
            $table->text('business_description')->nullable();
            $table->string('website')->nullable();
            $table->string('instagram')->nullable();
            $table->string('facebook')->nullable();
            
            // Status
            $table->enum('status', ['pending', 'approved', 'rejected', 'suspended'])->default('pending');
            $table->timestamp('approved_at')->nullable();
            $table->text('rejected_reason')->nullable();
            
            $table->timestamps();
            
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->unique('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('suppliers');
    }
};

