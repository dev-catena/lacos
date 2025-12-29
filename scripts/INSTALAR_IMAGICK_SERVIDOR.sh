#!/bin/bash

# Script para instalar extensão imagick no servidor
# Execute este script NO SERVIDOR onde está o backend Laravel

set -e

echo "🔧 Instalando extensão imagick (ImageMagick) para PHP..."
echo ""

# Detectar versão do PHP
PHP_VERSION=$(php -r "echo PHP_MAJOR_VERSION.'.'.PHP_MINOR_VERSION;" 2>/dev/null || php -v | head -1 | awk '{print $2}' | cut -d. -f1,2)
echo "📌 Versão do PHP detectada: $PHP_VERSION"

# Detectar distribuição Linux
if [ -f /etc/os-release ]; then
    . /etc/os-release
    DISTRO=$ID
else
    echo "⚠️  Não foi possível detectar a distribuição Linux"
    exit 1
fi

echo "📌 Distribuição detectada: $DISTRO"
echo ""

# Instalar dependências do sistema
echo "📦 Instalando dependências do sistema..."
if [ "$DISTRO" = "ubuntu" ] || [ "$DISTRO" = "debian" ]; then
    sudo apt-get update
    sudo apt-get install -y \
        libmagickwand-dev \
        imagemagick \
        php${PHP_VERSION}-imagick 2>/dev/null || \
        sudo apt-get install -y php-imagick
elif [ "$DISTRO" = "centos" ] || [ "$DISTRO" = "rhel" ] || [ "$DISTRO" = "fedora" ]; then
    sudo yum install -y ImageMagick-devel php-imagick || \
        sudo dnf install -y ImageMagick-devel php-imagick
else
    echo "⚠️  Distribuição não suportada automaticamente: $DISTRO"
    echo "📝 Por favor, instale manualmente:"
    echo "   - libmagickwand-dev ou ImageMagick-devel"
    echo "   - imagemagick"
    echo "   - php-imagick ou php${PHP_VERSION}-imagick"
    exit 1
fi

echo ""
echo "✅ Dependências instaladas"
echo ""

# Verificar se a extensão foi instalada
echo "🔍 Verificando se a extensão imagick foi instalada..."
if php -m | grep -i imagick > /dev/null; then
    echo "✅ Extensão imagick está instalada!"
    php -m | grep -i imagick
else
    echo "⚠️  Extensão imagick não está listada nos módulos do PHP"
    echo "📝 Tentando habilitar manualmente..."
    
    # Tentar encontrar o arquivo de configuração
    PHP_INI_DIR=$(php --ini | grep "Scan for additional .ini files" | awk '{print $NF}')
    
    if [ -d "$PHP_INI_DIR" ]; then
        # Criar arquivo de configuração se não existir
        if [ ! -f "$PHP_INI_DIR/imagick.ini" ]; then
            echo "extension=imagick.so" | sudo tee "$PHP_INI_DIR/imagick.ini" > /dev/null
            echo "✅ Arquivo de configuração criado: $PHP_INI_DIR/imagick.ini"
        fi
    fi
fi

echo ""
echo "🔄 Reiniciando serviços PHP..."
# Tentar reiniciar serviços PHP (pode variar conforme configuração)
if systemctl list-units | grep -q php; then
    sudo systemctl restart php*-fpm 2>/dev/null || true
    sudo systemctl restart php-fpm 2>/dev/null || true
fi

# Se usar Apache
if systemctl is-active --quiet apache2 || systemctl is-active --quiet httpd; then
    echo "🔄 Reiniciando Apache..."
    sudo systemctl restart apache2 2>/dev/null || sudo systemctl restart httpd 2>/dev/null || true
fi

# Se usar Nginx com PHP-FPM
if systemctl is-active --quiet nginx; then
    echo "🔄 Reiniciando PHP-FPM..."
    sudo systemctl restart php*-fpm 2>/dev/null || sudo systemctl restart php-fpm 2>/dev/null || true
fi

echo ""
echo "🔍 Verificação final..."
echo ""

# Verificar novamente
if php -m | grep -i imagick > /dev/null; then
    echo "✅ SUCESSO! Extensão imagick está instalada e funcionando"
    echo ""
    echo "📋 Informações da extensão:"
    php -i | grep -i imagick | head -10
else
    echo "❌ A extensão imagick ainda não está disponível"
    echo ""
    echo "📝 Tente executar:"
    echo "   1. Verificar se o pacote foi instalado: dpkg -l | grep imagick (Debian/Ubuntu)"
    echo "   2. Verificar módulos PHP: php -m"
    echo "   3. Reiniciar PHP-FPM/Apache manualmente"
    echo "   4. Verificar logs do PHP: tail -f /var/log/php*.log"
    exit 1
fi

echo ""
echo "✅ Instalação concluída!"
echo ""
echo "🧪 Para testar:"
echo "   1. Tente gerar um atestado novamente"
echo "   2. O erro 'you need to install the imagick extension' não deve mais aparecer"

