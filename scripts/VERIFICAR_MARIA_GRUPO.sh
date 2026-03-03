#!/bin/bash

# Script para verificar se Maria está no grupo e qual especialidade ela tem
# Servidor: 192.168.0.20
# Usuário: darley
# Senha: yhvh77

echo "🔍 Verificando Maria no banco de dados..."

sshpass -p 'yhvh77' ssh darley@192.168.0.20 << 'ENDSSH'
cd /var/www/lacos-backend

echo "📋 Buscando usuário Maria..."
mysql -u root -p'yhvh77' lacos << 'SQL'
SELECT 
    u.id,
    u.name,
    u.email,
    u.profile,
    u.medical_specialty_id,
    ms.name as specialty_name
FROM users u
LEFT JOIN medical_specialties ms ON u.medical_specialty_id = ms.id
WHERE u.email LIKE '%maria%' OR u.name LIKE '%maria%';
SQL

echo ""
echo "📋 Verificando em qual grupo a Maria está..."
mysql -u root -p'yhvh77' lacos << 'SQL'
SELECT 
    gm.id as membership_id,
    gm.group_id,
    g.name as group_name,
    gm.user_id,
    u.name as user_name,
    u.email,
    u.profile,
    u.medical_specialty_id,
    ms.name as specialty_name
FROM group_members gm
INNER JOIN groups g ON gm.group_id = g.id
INNER JOIN users u ON gm.user_id = u.id
LEFT JOIN medical_specialties ms ON u.medical_specialty_id = ms.id
WHERE u.email LIKE '%maria%' OR u.name LIKE '%maria%';
SQL

echo ""
echo "📋 Verificando especialidade 'Clínica Médica'..."
mysql -u root -p'yhvh77' lacos << 'SQL'
SELECT 
    id,
    name
FROM medical_specialties
WHERE name LIKE '%Clínica%' OR name LIKE '%Clinica%' OR name LIKE '%Médica%' OR name LIKE '%Medica%'
ORDER BY name;
SQL

echo ""
echo "📋 Verificando membros do grupo 13 (Biza Vos)..."
mysql -u root -p'yhvh77' lacos << 'SQL'
SELECT 
    gm.id as membership_id,
    gm.group_id,
    g.name as group_name,
    gm.user_id,
    u.name as user_name,
    u.email,
    u.profile,
    u.medical_specialty_id,
    ms.name as specialty_name
FROM group_members gm
INNER JOIN groups g ON gm.group_id = g.id
INNER JOIN users u ON gm.user_id = u.id
LEFT JOIN medical_specialties ms ON u.medical_specialty_id = ms.id
WHERE gm.group_id = 13;
SQL

ENDSSH

echo "✅ Verificação concluída!"

