# ✅ Deploy de Produção - Resumo Final

## ✅ O que foi feito:

1. **Build local concluído com sucesso!**
   - Arquivos buildados em: `/Users/darley/lacos/website/dist/`
   - Contém: `index.html`, `assets/`, e arquivos SVG

2. **Arquivos preparados para deploy**
   - Os arquivos buildados estão prontos para serem enviados ao servidor

## 📤 Como fazer o deploy:

### Opção 1: Script Automático (Recomendado)

```bash
cd /Users/darley/lacos
./deploy-simples.sh
```

Você será solicitado a inserir a senha: `yhvh77`

### Opção 2: Manual

```bash
# 1. Enviar arquivos buildados
cd /Users/darley/lacos/website
scp -P 63022 -r dist/* darley@193.203.182.22:~/deploy-dist/

# Senha: yhvh77
```

### Opção 3: Usando rsync (mais eficiente)

```bash
cd /Users/darley/lacos/website
rsync -avz --delete -e "ssh -p 63022" dist/ darley@193.203.182.22:~/deploy-dist/
```

## 🔧 Finalizar no Servidor:

Após enviar os arquivos, conecte ao servidor e execute:

```bash
# Conectar
ssh -p 63022 darley@193.203.182.22
# Senha: yhvh77

# Mover arquivos para produção
sudo rm -rf /var/www/lacos-website/*
sudo cp -r ~/deploy-dist/* /var/www/lacos-website/
sudo chown -R www-data:www-data /var/www/lacos-website

# Reiniciar nginx
sudo systemctl restart nginx
```

## 📋 Alterações Implementadas:

✅ Campo de preço com máscara para Real (R$)  
✅ Campo de categoria como select/combo  
✅ Upload de imagens (até 8 imagens)  
✅ Remoção do campo de URL de imagem  
✅ Validação: pelo menos 1 imagem obrigatória  
✅ Serviço atualizado para suportar FormData

## ✨ Status:

- ✅ Build local: **CONCLUÍDO**
- ⏳ Envio para servidor: **PENDENTE** (execute o script acima)
- ⏳ Deploy no servidor: **PENDENTE** (execute os comandos no servidor)

## 📝 Notas:

- O build foi feito localmente conforme solicitado
- Os arquivos estão prontos em `website/dist/`
- O deploy envia apenas os arquivos buildados (estáticos) para o nginx
- Não é necessário fazer build no servidor, apenas copiar os arquivos

