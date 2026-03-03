#!/bin/bash

# Script para verificar se o usuário ID 50 tem certificado no banco de dados

SSH_USER="darley"
SSH_HOST="192.168.0.20"
SSH_PORT="63022"
SSH_PASS="yhvh77"

echo "🔍 Verificando certificado do usuário ID 50 no banco de dados..."

sshpass -p "$SSH_PASS" ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "sudo mysql -u root lacos_db -e \"SELECT id, name, email, has_certificate, certificate_type, certificate_path, certificate_uploaded_at FROM users WHERE id = 50;\"" 2>/dev/null || echo "❌ Erro ao consultar banco de dados"














