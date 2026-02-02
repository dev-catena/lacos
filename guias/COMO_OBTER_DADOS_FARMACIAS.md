# 📥 Como Obter e Importar Dados de Farmácias Populares

## 1. Baixar o Arquivo Oficial

O Ministério da Saúde disponibiliza a lista oficial de farmácias credenciadas:

**Link:** https://www.gov.br/saude/pt-br/composicao/sectics/farmacia-popular/publicacoes/farmacias_credenciadas_pfpb_atualizada.xlsx

## 2. Converter Excel para CSV

### Opção A: Usando LibreOffice (no servidor)

```bash
# Instalar LibreOffice (se não tiver)
sudo apt-get update
sudo apt-get install -y libreoffice

# Converter Excel para CSV
libreoffice --headless --convert-to csv --outdir /var/www/lacos-backend \
  /caminho/para/farmacias_credenciadas_pfpb_atualizada.xlsx

# Renomear para farmacias_populares.csv
mv /var/www/lacos-backend/farmacias_credenciadas_pfpb_atualizada.csv \
   /var/www/lacos-backend/farmacias_populares.csv
```

### Opção B: Usando Python (se tiver pandas)

```python
import pandas as pd

# Ler Excel
df = pd.read_excel('farmacias_credenciadas_pfpb_atualizada.xlsx')

# Salvar como CSV
df.to_csv('farmacias_populares.csv', index=False, encoding='utf-8')
```

### Opção C: Usando Google Sheets

1. Fazer upload do Excel no Google Sheets
2. Arquivo → Download → Valores separados por vírgula (.csv)
3. Renomear para `farmacias_populares.csv`
4. Fazer upload para o servidor

## 3. Verificar Formato do CSV

O CSV deve ter colunas similares a:

```
Nome da Farmácia,Endereço,Bairro,Cidade,Estado,CEP,Telefone
```

**Importante:** A ordem das colunas pode variar. O script de debug mostrará quais colunas foram detectadas.

## 4. Ajustar Script de Importação

Após verificar o formato do CSV, você pode precisar ajustar os índices no script:

```php
// Exemplo: se o CSV tiver formato diferente
$name = trim($data[0] ?? '');        // Coluna 0 = Nome
$address = trim($data[1] ?? '');     // Coluna 1 = Endereço
$city = trim($data[2] ?? '');        // Coluna 2 = Cidade
$state = trim($data[3] ?? '');       // Coluna 3 = Estado
// etc...
```

## 5. Executar Importação com Debug

```bash
cd /var/www/lacos-backend
php importador_farmacias_debug.php
```

O script de debug mostrará:
- Tamanho do arquivo
- Delimitador detectado
- Cabeçalho e primeiras linhas
- Erros detalhados

## 6. Upload do Arquivo para o Servidor

Se você baixou o arquivo localmente:

```bash
# Do seu computador local
scp farmacias_populares.csv darley@10.102.0.103:/var/www/lacos-backend/
```

Ou via SFTP/FTP.

## 7. Verificar Dados Importados

```bash
cd /var/www/lacos-backend
php artisan tinker

# No tinker:
App\Models\PopularPharmacy::count();
App\Models\PopularPharmacy::first();
```

## ⚠️ Problemas Comuns

### Arquivo vazio ou muito pequeno
- Verifique se o download foi completo
- Confirme que o arquivo não está corrompido

### Encoding incorreto
- Use UTF-8
- Se tiver caracteres estranhos, converta: `iconv -f ISO-8859-1 -t UTF-8 input.csv > output.csv`

### Delimitador errado
- O script detecta automaticamente `,`, `;` ou `TAB`
- Se usar outro, ajuste o script

### Colunas em ordem diferente
- Use o script de debug para ver a ordem real
- Ajuste os índices no script de importação







