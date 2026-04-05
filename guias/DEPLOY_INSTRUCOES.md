# 📦 Instruções de Deploy - Alterações de Produtos

## Arquivos Alterados

1. `website/src/components/ProductsManagement.jsx` - Componente de gerenciamento de produtos
2. `website/src/services/supplierService.js` - Serviço de fornecedor com suporte a upload de imagens

## Opção 1: Deploy Automático (Recomendado)

Execute o script de deploy:

```bash
cd /Users/darley/lacos
./deploy-produtos.sh
```

Você será solicitado a inserir a senha: `yhvh77`

## Opção 2: Deploy Manual

### Passo 1: Copiar arquivos para o servidor

```bash
# Copiar ProductsManagement.jsx
scp -P 63022 website/src/components/ProductsManagement.jsx darley@192.168.0.20:/var/www/lacos-website/src/components/ProductsManagement.jsx

# Copiar supplierService.js
scp -P 63022 website/src/services/supplierService.js darley@192.168.0.20:/var/www/lacos-website/src/services/supplierService.js
```

Senha: `yhvh77`

### Passo 2: Conectar ao servidor e fazer build

```bash
ssh -p 63022 darley@192.168.0.20
cd /var/www/lacos-website
npm install  # Se necessário
npm run build  # ou o comando de build que você usa
```

### Passo 3: Reiniciar o serviço (se necessário)

Dependendo de como o site está rodando (PM2, systemd, etc.), você pode precisar reiniciar:

```bash
# Se usar PM2
pm2 restart lacos-website

# Se usar systemd
sudo systemctl restart lacos-website

# Ou apenas reiniciar o servidor web (nginx/apache)
sudo systemctl restart nginx
# ou
sudo systemctl restart apache2
```

## Alterações Implementadas

✅ Campo de preço com máscara para Real (R$)  
✅ Campo de categoria como select/combo com mesmas categorias do cadastro  
✅ Upload de imagens (até 8 imagens)  
✅ Remoção do campo de URL de imagem  
✅ Validação: pelo menos 1 imagem obrigatória  
✅ Serviço atualizado para suportar FormData no upload

## Verificação

Após o deploy, acesse a tela de criação de produtos e verifique:
- Campo de preço mostra máscara R$
- Campo de categoria é um select
- Upload de imagens funciona (até 8)
- Não há campo de URL de imagem
- Validação exige pelo menos 1 imagem

