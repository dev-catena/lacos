# 🏪 Sistema de Fornecedores e Shopping - Backend

## 📋 Estrutura Necessária

### 1. Tabela `suppliers` (Fornecedores)

```sql
CREATE TABLE suppliers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    company_type ENUM('pessoa_fisica', 'pessoa_juridica') NOT NULL,
    cnpj VARCHAR(18) NULL,
    cpf VARCHAR(14) NULL,
    
    -- Endereço
    address VARCHAR(255),
    address_number VARCHAR(20),
    address_complement VARCHAR(255),
    neighborhood VARCHAR(100),
    city VARCHAR(100),
    state VARCHAR(2),
    zip_code VARCHAR(10),
    
    -- Dados bancários
    bank_name VARCHAR(100),
    bank_code VARCHAR(10),
    agency VARCHAR(20),
    account VARCHAR(50),
    account_type ENUM('checking', 'savings'),
    account_holder_name VARCHAR(255),
    account_holder_document VARCHAR(20),
    pix_key VARCHAR(255),
    pix_key_type VARCHAR(20),
    
    -- Stripe
    stripe_account_id VARCHAR(255) NULL,
    stripe_onboarding_completed BOOLEAN DEFAULT FALSE,
    
    -- Informações do negócio
    business_description TEXT,
    website VARCHAR(255),
    instagram VARCHAR(255),
    facebook VARCHAR(255),
    
    -- Status
    status ENUM('pending', 'approved', 'rejected', 'suspended') DEFAULT 'pending',
    approved_at TIMESTAMP NULL,
    rejected_reason TEXT NULL,
    
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_supplier (user_id)
);
```

### 2. Tabela `supplier_categories` (Categorias do Fornecedor)

```sql
CREATE TABLE supplier_categories (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    supplier_id BIGINT UNSIGNED NOT NULL,
    category VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NULL,
    
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
    INDEX idx_supplier_category (supplier_id, category)
);
```

### 3. Tabela `products` (Produtos)

```sql
CREATE TABLE products (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    supplier_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INT DEFAULT 0,
    sku VARCHAR(100),
    image_url VARCHAR(500),
    images JSON, -- Array de URLs de imagens
    
    -- Status
    status ENUM('draft', 'active', 'inactive', 'out_of_stock') DEFAULT 'draft',
    
    -- Informações adicionais
    weight DECIMAL(8, 2),
    dimensions VARCHAR(100),
    brand VARCHAR(100),
    
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
    INDEX idx_supplier (supplier_id),
    INDEX idx_category (category),
    INDEX idx_status (status)
);
```

### 4. Tabela `orders` (Pedidos)

```sql
CREATE TABLE orders (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL, -- Cliente que comprou
    supplier_id BIGINT UNSIGNED NOT NULL,
    
    -- Dados do pedido
    order_number VARCHAR(50) UNIQUE,
    total_amount DECIMAL(10, 2) NOT NULL,
    shipping_cost DECIMAL(10, 2) DEFAULT 0,
    status ENUM('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    
    -- Endereço de entrega
    shipping_address TEXT,
    shipping_city VARCHAR(100),
    shipping_state VARCHAR(2),
    shipping_zip_code VARCHAR(10),
    
    -- Pagamento
    payment_method VARCHAR(50),
    payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    payment_intent_id VARCHAR(255), -- Stripe Payment Intent ID
    transaction_id VARCHAR(255),
    
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    INDEX idx_user (user_id),
    INDEX idx_supplier (supplier_id),
    INDEX idx_status (status)
);
```

### 5. Tabela `order_items` (Itens do Pedido)

```sql
CREATE TABLE order_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT UNSIGNED NOT NULL,
    product_id BIGINT UNSIGNED NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    
    created_at TIMESTAMP NULL,
    
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    INDEX idx_order (order_id)
);
```

## 🔧 Controllers Necessários

### 1. SupplierController

```php
// app/Http/Controllers/Api/SupplierController.php

- register() - Cadastrar fornecedor
- update() - Atualizar dados do fornecedor
- getMySupplier() - Obter dados do fornecedor logado
- approve() - Aprovar fornecedor (admin)
- reject() - Rejeitar fornecedor (admin)
```

### 2. ProductController

```php
// app/Http/Controllers/Api/ProductController.php

- index() - Listar produtos (público)
- show() - Detalhes do produto
- store() - Criar produto (fornecedor)
- update() - Atualizar produto (fornecedor)
- destroy() - Deletar produto (fornecedor)
- search() - Buscar produtos
```

### 3. OrderController

```php
// app/Http/Controllers/Api/OrderController.php

- store() - Criar pedido
- index() - Listar pedidos do usuário
- show() - Detalhes do pedido
- updateStatus() - Atualizar status (fornecedor)
- processPayment() - Processar pagamento via Stripe
```

## 🔗 Rotas Necessárias

```php
// Rotas públicas
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{id}', [ProductController::class, 'show']);
Route::get('/products/search', [ProductController::class, 'search']);

// Rotas autenticadas - Fornecedor
Route::middleware('auth:sanctum')->group(function () {
    // Fornecedor
    Route::post('/suppliers/register', [SupplierController::class, 'register']);
    Route::get('/suppliers/me', [SupplierController::class, 'getMySupplier']);
    Route::put('/suppliers/me', [SupplierController::class, 'update']);
    
    // Produtos (fornecedor)
    Route::post('/products', [ProductController::class, 'store']);
    Route::put('/products/{id}', [ProductController::class, 'update']);
    Route::delete('/products/{id}', [ProductController::class, 'destroy']);
    
    // Pedidos
    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/orders', [OrderController::class, 'index']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);
    Route::post('/orders/{id}/payment', [OrderController::class, 'processPayment']);
});
```

## 💳 Integração com Stripe

### Para Fornecedores (Stripe Connect)

1. **Criar Conta Stripe Connect** quando fornecedor for aprovado
2. **Onboarding** - Link para fornecedor completar cadastro no Stripe
3. **Recebimento** - Stripe transfere automaticamente para conta do fornecedor

### Para Clientes (Checkout)

1. **Criar Payment Intent** quando cliente adiciona ao carrinho
2. **Processar Pagamento** via Stripe
3. **Dividir Pagamento** - Parte para LaçosApp (taxa) + Parte para Fornecedor

## 📝 Próximos Passos

1. Criar migrations para as tabelas
2. Criar Models (Supplier, Product, Order, OrderItem)
3. Criar Controllers
4. Adicionar rotas
5. Implementar integração com Stripe Connect
6. Criar sistema de aprovação de fornecedores

