#!/bin/bash

# Script para configurar Android SDK

set -e

echo "🤖 CONFIGURANDO ANDROID SDK"
echo "==========================="
echo ""

# Verificar se Android Studio está instalado
echo "1️⃣ Verificando Android Studio..."
if command -v android-studio &> /dev/null || [ -d "/opt/android-studio" ] || [ -d "$HOME/android-studio" ]; then
    echo "✅ Android Studio encontrado"
    HAS_ANDROID_STUDIO=true
else
    echo "❌ Android Studio NÃO encontrado"
    HAS_ANDROID_STUDIO=false
fi
echo ""

# Verificar ANDROID_HOME
echo "2️⃣ Verificando ANDROID_HOME..."
if [ -n "$ANDROID_HOME" ]; then
    echo "✅ ANDROID_HOME está definido: $ANDROID_HOME"
    if [ -d "$ANDROID_HOME" ]; then
        echo "✅ Diretório existe"
        SDK_PATH="$ANDROID_HOME"
    else
        echo "⚠️  Diretório não existe"
        SDK_PATH=""
    fi
else
    echo "❌ ANDROID_HOME não está definido"
    SDK_PATH=""
fi
echo ""

# Procurar SDK em locais comuns
echo "3️⃣ Procurando Android SDK..."
POSSIBLE_PATHS=(
    "$HOME/Android/Sdk"
    "$HOME/.android/sdk"
    "$HOME/Library/Android/sdk"
    "/opt/android-sdk"
    "/usr/local/android-sdk"
    "$ANDROID_HOME"
)

FOUND_SDK=""
for path in "${POSSIBLE_PATHS[@]}"; do
    if [ -d "$path" ] && [ -f "$path/platform-tools/adb" ]; then
        FOUND_SDK="$path"
        echo "✅ SDK encontrado em: $path"
        break
    fi
done

if [ -z "$FOUND_SDK" ]; then
    echo "❌ Android SDK não encontrado"
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo "📋 OPÇÕES:"
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    echo "1. Instalar Android Studio (Recomendado)"
    echo "   - Baixe: https://developer.android.com/studio"
    echo "   - Instale e abra"
    echo "   - Vá em: Tools > SDK Manager"
    echo "   - Instale Android SDK"
    echo ""
    echo "2. Instalar apenas Android SDK (Command Line Tools)"
    echo "   - Execute: ./INSTALAR_ANDROID_SDK_CLI.sh"
    echo ""
    echo "3. Usar alternativa sem Android SDK:"
    echo "   - Desenvolvimento Web: ./DESENVOLVER_WEB.sh"
    echo "   - Expo Web: npx expo start --web"
    echo ""
    read -p "Escolha uma opção (1, 2 ou 3) [1]: " OPCAO
    OPCAO=${OPCAO:-1}
    
    case $OPCAO in
        1)
            echo ""
            echo "📥 Instale Android Studio:"
            echo "   https://developer.android.com/studio"
            echo ""
            echo "Depois execute este script novamente."
            exit 0
            ;;
        2)
            if [ -f "./INSTALAR_ANDROID_SDK_CLI.sh" ]; then
                ./INSTALAR_ANDROID_SDK_CLI.sh
            else
                echo "❌ Script não encontrado. Criando..."
                # Criar script básico
                cat > INSTALAR_ANDROID_SDK_CLI.sh << 'EOF'
#!/bin/bash
echo "Instalando Android SDK Command Line Tools..."
mkdir -p ~/Android/Sdk
cd ~/Android/Sdk
wget https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip
unzip commandlinetools-linux-9477386_latest.zip
mkdir -p cmdline-tools/latest
mv cmdline-tools/* cmdline-tools/latest/ 2>/dev/null || true
./cmdline-tools/latest/bin/sdkmanager "platform-tools" "platforms;android-33" "build-tools;33.0.0"
EOF
                chmod +x INSTALAR_ANDROID_SDK_CLI.sh
                echo "✅ Script criado. Execute: ./INSTALAR_ANDROID_SDK_CLI.sh"
            fi
            exit 0
            ;;
        3)
            echo ""
            echo "🌐 Usando desenvolvimento web..."
            ./DESENVOLVER_WEB.sh
            exit 0
            ;;
    esac
else
    SDK_PATH="$FOUND_SDK"
fi

# Configurar variáveis de ambiente
echo ""
echo "4️⃣ Configurando variáveis de ambiente..."

# Adicionar ao .bashrc se não estiver
if ! grep -q "ANDROID_HOME" ~/.bashrc 2>/dev/null; then
    echo "" >> ~/.bashrc
    echo "# Android SDK" >> ~/.bashrc
    echo "export ANDROID_HOME=\"$SDK_PATH\"" >> ~/.bashrc
    echo "export PATH=\"\$PATH:\$ANDROID_HOME/platform-tools\"" >> ~/.bashrc
    echo "export PATH=\"\$PATH:\$ANDROID_HOME/tools\"" >> ~/.bashrc
    echo "export PATH=\"\$PATH:\$ANDROID_HOME/tools/bin\"" >> ~/.bashrc
    echo "✅ Adicionado ao ~/.bashrc"
else
    echo "✅ Já está no ~/.bashrc"
fi

# Exportar para sessão atual
export ANDROID_HOME="$SDK_PATH"
export PATH="$PATH:$ANDROID_HOME/platform-tools"
export PATH="$PATH:$ANDROID_HOME/tools"
export PATH="$PATH:$ANDROID_HOME/tools/bin"

echo "✅ Variáveis configuradas"
echo ""

# Verificar adb
echo "5️⃣ Verificando adb..."
if command -v adb &> /dev/null; then
    echo "✅ adb encontrado"
    adb version
else
    echo "⚠️  adb não encontrado no PATH"
    echo "   Execute: source ~/.bashrc"
fi
echo ""

# Verificar emulador
echo "6️⃣ Verificando emulador..."
if [ -f "$SDK_PATH/emulator/emulator" ]; then
    echo "✅ Emulador encontrado"
else
    echo "⚠️  Emulador não encontrado"
    echo "   Instale via Android Studio: Tools > SDK Manager > SDK Tools > Android Emulator"
fi
echo ""

echo "═══════════════════════════════════════════════════════════"
echo "✅ CONFIGURAÇÃO CONCLUÍDA!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo ""
echo "1. Recarregar variáveis:"
echo "   source ~/.bashrc"
echo ""
echo "2. Criar AVD (Android Virtual Device):"
echo "   - Abra Android Studio"
echo "   - Tools > Device Manager"
echo "   - Create Device"
echo ""
echo "3. Ou usar dispositivo físico:"
echo "   - Ative USB Debugging no celular"
echo "   - Conecte via USB"
echo "   - Execute: adb devices"
echo ""
echo "4. Rodar app:"
echo "   ./SOLUCAO_RAPIDA_DEV_LOCAL.sh"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""

