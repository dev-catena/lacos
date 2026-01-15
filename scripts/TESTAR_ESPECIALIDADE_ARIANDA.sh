#!/bin/bash

echo "=== Testando especialidade da Ariadna ==="

# Conectar ao banco e verificar
mysql -u lacos -pLacos2025Secure lacos << EOF
SELECT 
    d.id as doctor_id,
    d.name as doctor_name,
    d.medical_specialty_id,
    ms.id as specialty_id,
    ms.name as specialty_name
FROM doctors d
LEFT JOIN medical_specialties ms ON d.medical_specialty_id = ms.id
WHERE d.name LIKE '%Ariadna%'
LIMIT 5;
EOF

echo ""
echo "=== Verificando se especialidade ID 23 existe ==="

mysql -u lacos -pLacos2025Secure lacos << EOF
SELECT id, name FROM medical_specialties WHERE id = 23;
EOF

echo ""
echo "=== Verificando medicamentos da Ariadna ==="

mysql -u lacos -pLacos2025Secure lacos << EOF
SELECT 
    m.id as medication_id,
    m.name as medication_name,
    m.doctor_id,
    d.name as doctor_name,
    d.medical_specialty_id
FROM medications m
JOIN doctors d ON m.doctor_id = d.id
WHERE d.name LIKE '%Ariadna%'
LIMIT 5;
EOF







