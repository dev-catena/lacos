#!/bin/bash

echo "=== Teste Simples - Verificar Especialidade da Ariadna ==="
echo ""

# Testar diretamente via SQL
echo "1. Verificando se Ariadna tem medical_specialty_id:"
mysql -u root -p'Lacos2025Secure' lacos -e "
SELECT 
    d.id,
    d.name,
    d.medical_specialty_id,
    ms.name as specialty_name
FROM doctors d
LEFT JOIN medical_specialties ms ON d.medical_specialty_id = ms.id
WHERE d.name LIKE '%Ariadna%'
LIMIT 5;
" 2>/dev/null || echo "Erro ao conectar ao MySQL"

echo ""
echo "2. Verificando se especialidade ID 23 existe:"
mysql -u root -p'Lacos2025Secure' lacos -e "
SELECT id, name FROM medical_specialties WHERE id = 23;
" 2>/dev/null || echo "Erro ao conectar ao MySQL"

echo ""
echo "3. Verificando medicamentos da Ariadna:"
mysql -u root -p'Lacos2025Secure' lacos -e "
SELECT 
    m.id,
    m.name as medication_name,
    m.doctor_id,
    d.name as doctor_name,
    d.medical_specialty_id
FROM medications m
JOIN doctors d ON m.doctor_id = d.id
WHERE d.name LIKE '%Ariadna%'
LIMIT 3;
" 2>/dev/null || echo "Erro ao conectar ao MySQL"





