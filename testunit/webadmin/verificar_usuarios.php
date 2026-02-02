<?php
/**
 * Script para verificar usuários admin no banco de dados
 */

// Configurações do banco (ajuste conforme necessário)
$host = 'localhost';
$database = 'lacos';
$username = 'lacos';
$password = 'Lacos2025Secure';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$database;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "🔍 Verificando usuários admin no banco de dados...\n\n";
    
    // Buscar usuários que podem ser admin (root@lacos.com, admin@lacos.com, ou com is_root)
    $query = "SELECT id, name, email, profile, is_blocked, is_root, created_at 
              FROM users 
              WHERE email IN ('root@lacos.com', 'admin@lacos.com') 
                 OR is_root = 1 
              ORDER BY email";
    
    $stmt = $pdo->query($query);
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($users)) {
        echo "❌ Nenhum usuário admin encontrado no banco de dados.\n";
        echo "\n💡 Você pode criar um usuário admin usando:\n";
        echo "   cd backend-laravel\n";
        echo "   php artisan tinker\n";
        echo "   # Depois execute o código para criar o usuário\n";
    } else {
        echo "✅ Usuários admin encontrados:\n\n";
        foreach ($users as $user) {
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
            echo "ID: " . $user['id'] . "\n";
            echo "Nome: " . ($user['name'] ?? 'N/A') . "\n";
            echo "Email: " . $user['email'] . "\n";
            echo "Profile: " . ($user['profile'] ?? 'N/A') . "\n";
            echo "Is Root: " . ($user['is_root'] ?? '0') . "\n";
            echo "Bloqueado: " . ($user['is_blocked'] ? 'Sim' : 'Não') . "\n";
            echo "Criado em: " . ($user['created_at'] ?? 'N/A') . "\n";
            echo "\n";
        }
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
        echo "\n💡 Para testar a senha, você pode usar o script:\n";
        echo "   php scripts/TESTAR_SENHA_USUARIO.php\n";
    }
    
} catch (PDOException $e) {
    echo "❌ Erro ao conectar ao banco de dados: " . $e->getMessage() . "\n";
    echo "\n💡 Verifique as credenciais do banco no arquivo.\n";
}


