# 🧹 LIMPAR CACHE COMPLETO DO APP

## Quando usar:
- Após atualizar banco de dados
- Após mudar estrutura de usuário
- Quando o app não reconhece mudanças

## 1️⃣ NO APP (Primeiro):

```
1. Abrir app
2. Ir em Perfil
3. Sair (Logout)
4. FECHAR o app completamente
```

## 2️⃣ NO TERMINAL (Local):

```bash
cd /home/darley/lacos

# Parar o Expo (Ctrl+C)

# Limpar caches
rm -rf .expo .metro node_modules/.cache
watchman watch-del-all 2>/dev/null || true

# Reiniciar
npx expo start -c
```

## 3️⃣ NO DISPOSITIVO:

### Android:
```
1. Abrir Configurações do Android
2. Apps > Expo Go
3. Armazenamento > Limpar dados
4. Limpar cache
5. Forçar parada
6. Reabrir Expo Go
```

### iOS:
```
1. Fechar app completamente
2. Reabrir Expo Go
3. Shake > Reload
```

## 4️⃣ FAZER LOGIN NOVAMENTE:

```
1. Abrir app no Expo
2. Fazer login com: doente@gmail.com
3. Verificar console:
   👤 AppNavigator - Is Patient: true ✅
4. Deve cair na PatientHomeScreen
```

## ✅ RESULTADO ESPERADO:

**PatientHomeScreen:**
- Nome: "Doente  Dodoi"
- Grupo: (nome do grupo único)
- 3 Cards de contatos
- Botão de Pânico vermelho
- Alertas de medicamentos/consultas
- Apenas 2 abas no menu: Início + Perfil

**NÃO deve aparecer:**
- Lista de grupos
- Abas "Meus Grupos" / "Participo"
- Menu inferior com 4 ícones
- Tela de "Criar Grupo"

