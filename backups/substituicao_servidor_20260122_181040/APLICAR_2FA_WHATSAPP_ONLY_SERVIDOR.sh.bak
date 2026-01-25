#!/bin/bash
set -euo pipefail

# Aplica (de forma idempotente) o fluxo de 2FA via WhatsApp no backend Laravel no servidor.
# - Login vira 2 etapas quando two_factor_enabled=true e method=whatsapp
# - Cria rota pública: POST /api/2fa/login/verify
# - Adiciona rotas autenticadas: /2fa/enable, /2fa/disable, /2fa/send-code, /2fa/verify-code
# - Força enable2FA aceitar apenas method=whatsapp
#
# Uso (no servidor):
#   sudo bash /tmp/APLICAR_2FA_WHATSAPP_ONLY_SERVIDOR.sh
#
# Variáveis opcionais:
#   AUTH_CONTROLLER=/var/www/lacos-backend/app/Http/Controllers/Api/AuthController.php
#   ROUTES_API=/var/www/lacos-backend/routes/api.php

AUTH_CONTROLLER="${AUTH_CONTROLLER:-/var/www/lacos-backend/app/Http/Controllers/Api/AuthController.php}"
ROUTES_API="${ROUTES_API:-/var/www/lacos-backend/routes/api.php}"

echo "🔧 Aplicando patch 2FA WhatsApp-only..."
echo "   AuthController: $AUTH_CONTROLLER"
echo "   routes/api.php: $ROUTES_API"
echo ""

python3 - <<'PY'
from __future__ import annotations

from pathlib import Path
from datetime import datetime
import re

auth_controller = Path(__import__("os").environ.get("AUTH_CONTROLLER", "/var/www/lacos-backend/app/Http/Controllers/Api/AuthController.php"))
routes_api = Path(__import__("os").environ.get("ROUTES_API", "/var/www/lacos-backend/routes/api.php"))

ts = datetime.now().strftime("%Y%m%d-%H%M%S")

def backup(p: Path) -> None:
    b = p.with_suffix(p.suffix + f".bak.{ts}")
    b.write_text(p.read_text(encoding="utf-8"), encoding="utf-8")
    print(f"✅ Backup: {b}")

def replace_once(s: str, old: str, new: str) -> str:
    if old not in s:
        return s
    return s.replace(old, new, 1)

for p in (auth_controller, routes_api):
    if not p.exists():
        raise SystemExit(f"Arquivo não encontrado: {p}")
    backup(p)

# ---------------- routes/api.php ----------------
routes = routes_api.read_text(encoding="utf-8")

# Remover linhas "use" quebradas que quebram o Artisan (já vimos isso acontecer no servidor)
bad_use_patterns = [
    r"^\s*use\s+AppHttpControllersApiAuthController\s*;\s*$",
]
filtered = []
removed = 0
for line in routes.splitlines(True):
    if any(re.match(p, line) for p in bad_use_patterns):
        removed += 1
        continue
    filtered.append(line)
if removed:
    routes = "".join(filtered)
    print(f"✅ Removidas {removed} linha(s) inválida(s) de 'use' em routes/api.php")

if "/2fa/login/verify" not in routes:
    routes = replace_once(
        routes,
        "Route::post('/login', [AuthController::class, 'login']);",
        "Route::post('/login', [AuthController::class, 'login']);\nRoute::post('/2fa/login/verify', [AuthController::class, 'verify2FALogin']);"
    )

if "/2fa/enable" not in routes:
    # adiciona no primeiro bloco autenticado (após change-password)
    marker = "Route::post('/change-password', [AuthController::class, 'changePassword']);"
    insert = (
        marker
        + "\n\n    // 2FA (WhatsApp-only)\n"
        + "    Route::post('/2fa/enable', [AuthController::class, 'enable2FA']);\n"
        + "    Route::post('/2fa/disable', [AuthController::class, 'disable2FA']);\n"
        + "    Route::post('/2fa/send-code', [AuthController::class, 'send2FACode']);\n"
        + "    Route::post('/2fa/verify-code', [AuthController::class, 'verify2FACode']);"
    )
    routes = replace_once(routes, marker, insert)

routes_api.write_text(routes, encoding="utf-8")
print("✅ routes/api.php atualizado")

# ---------------- AuthController.php ----------------
ctl = auth_controller.read_text(encoding="utf-8")

# Sanity guard
if "class AuthController" not in ctl:
    raise SystemExit("Não encontrei 'class AuthController' no arquivo. Abortando por segurança.")

# 1) Inserir bloco 2FA no login (antes do token), se ainda não existir
if "requires_2fa" not in ctl:
    token_marker = "            // Criar token"
    if token_marker not in ctl:
        raise SystemExit("Não encontrei o marcador '// Criar token' no login para inserir o fluxo 2FA.")

    twofa_login_block = r"""            // ==================== 2FA (Somente WhatsApp) ====================
            // Se 2FA estiver ativo, não gerar token aqui.
            // Envia código via WhatsApp e exige validação em /api/2fa/login/verify
            if (!empty($user->two_factor_enabled) && ($user->two_factor_method === 'whatsapp')) {
                $destPhone = $user->two_factor_phone ?? $user->phone;
                if (!$destPhone) {
                    return response()->json([
                        'success' => false,
                        'message' => '2FA via WhatsApp exige um número de telefone cadastrado.'
                    ], 400);
                }

                // Gerar código de 6 dígitos
                $code = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);

                // Salvar código no banco com expiração (5 minutos)
                $user->two_factor_code = Hash::make($code);
                $user->two_factor_expires_at = now()->addMinutes(5);
                $user->save();

                // Enviar via WhatsApp (Evolution API)
                $whatsapp = new \App\Services\WhatsAppService();
                $result = $whatsapp->sendVerificationCode($destPhone, $code);

                if (empty($result['success'])) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Erro ao enviar código via WhatsApp',
                        'error' => $result['error'] ?? 'Erro desconhecido'
                    ], 500);
                }

                return response()->json([
                    'success' => true,
                    'requires_2fa' => true,
                    'two_factor_method' => 'whatsapp',
                    'message' => 'Código enviado via WhatsApp'
                ]);
            }
"""

    ctl = replace_once(ctl, token_marker, twofa_login_block + "\n" + token_marker)
    print("✅ Fluxo 2FA inserido no login")
else:
    print("ℹ️  Login já parece ter fluxo 2FA (requires_2fa encontrado). Pulando inserção.")

# 2) Adicionar método público verify2FALogin (antes do register), se não existir
if "function verify2FALogin" not in ctl:
    marker = "    public function register(Request $request)"
    if marker not in ctl:
        raise SystemExit("Não encontrei 'public function register' para inserir verify2FALogin antes.")

    verify_method = r"""
    /**
     * Verificar código 2FA durante login (rota pública)
     * POST /api/2fa/login/verify
     * Body: { email, code }
     */
    public function verify2FALogin(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'email' => 'required|email',
                'code' => 'required|string|size:6',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dados inválidos',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = User::where('email', $request->email)->first();
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuário não encontrado'
                ], 404);
            }

            if (empty($user->two_factor_enabled) || $user->two_factor_method !== 'whatsapp') {
                return response()->json([
                    'success' => false,
                    'message' => '2FA não está habilitado para este usuário'
                ], 400);
            }

            if (!$user->two_factor_code || !$user->two_factor_expires_at) {
                return response()->json([
                    'success' => false,
                    'message' => 'Código não encontrado ou expirado. Solicite um novo código.'
                ], 400);
            }

            if (now()->greaterThan($user->two_factor_expires_at)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Código expirado. Solicite um novo código.'
                ], 400);
            }

            if (!Hash::check($request->code, $user->two_factor_code)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Código inválido'
                ], 400);
            }

            // Código válido - limpar código usado
            $user->two_factor_code = null;
            $user->two_factor_expires_at = null;
            $user->save();

            // Criar token e finalizar login
            $token = $user->createToken('mobile-token')->plainTextToken;
            return response()->json([
                'success' => true,
                'user' => $user,
                'token' => $token,
                'message' => 'Login realizado com sucesso'
            ]);
        } catch (\Exception $e) {
            \Log::error('Erro ao verificar 2FA no login: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erro ao verificar código',
                'error' => config('app.debug') ? $e->getMessage() : 'Server Error'
            ], 500);
        }
    }

"""
    ctl = replace_once(ctl, marker, verify_method + marker)
    print("✅ Método verify2FALogin adicionado")
else:
    print("ℹ️  verify2FALogin já existe. Pulando.")

# 3) Se já existir enable2FA e ele aceita sms/app, força para WhatsApp-only (replacements seguros)
ctl = ctl.replace("'method' => 'required|in:whatsapp,sms,app',", "'method' => 'required|in:whatsapp',")
ctl = ctl.replace("'phone' => 'required_if:method,whatsapp,sms|string|max:20',", "'phone' => 'required|string|max:20',")
ctl = ctl.replace("$user->two_factor_method = $request->method;", "$user->two_factor_method = 'whatsapp';")
ctl = ctl.replace("if (in_array($request->method, ['whatsapp', 'sms'])) {", "if (in_array($request->method, ['whatsapp'])) {")

auth_controller.write_text(ctl, encoding="utf-8")
print("✅ AuthController.php atualizado")

# 4) Garantir que existam métodos básicos usados pelas rotas (logout + endpoints 2FA)
ctl = auth_controller.read_text(encoding="utf-8")

def ensure_method(name: str, snippet: str) -> str:
    if f"function {name}(" in ctl or f"function {name} (" in ctl:
        print(f"ℹ️  {name} já existe. Pulando.")
        return ""
    print(f"✅ {name} será adicionado")
    return snippet

missing_blocks = []

missing_blocks.append(ensure_method("logout", r"""
    /**
     * Logout (revoga o token atual do Sanctum)
     */
    public function logout(Request $request)
    {
        try {
            $user = $request->user();

            if ($user && $request->user()->currentAccessToken()) {
                $request->user()->currentAccessToken()->delete();
            }

            return response()->json([
                'success' => true,
                'message' => 'Logout realizado com sucesso'
            ]);
        } catch (\Exception $e) {
            \Log::error('Erro no logout: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erro ao fazer logout'
            ], 500);
        }
    }
"""))

missing_blocks.append(ensure_method("enable2FA", r"""
    /**
     * Ativar autenticação de dois fatores (WhatsApp-only)
     */
    public function enable2FA(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'method' => 'required|in:whatsapp',
                'phone' => 'required|string|max:20',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dados inválidos',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = $request->user();
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuário não autenticado'
                ], 401);
            }

            $user->two_factor_enabled = true;
            $user->two_factor_method = 'whatsapp';
            $user->two_factor_phone = $request->phone;
            $user->save();

            \Log::info('2FA ativado', [
                'user_id' => $user->id,
                'method' => 'whatsapp',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Autenticação de dois fatores ativada',
                'method' => 'whatsapp',
            ]);
        } catch (\Exception $e) {
            \Log::error('Erro ao ativar 2FA: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erro ao ativar autenticação de dois fatores',
                'error' => config('app.debug') ? $e->getMessage() : 'Server Error'
            ], 500);
        }
    }
"""))

missing_blocks.append(ensure_method("disable2FA", r"""
    /**
     * Desativar autenticação de dois fatores
     */
    public function disable2FA(Request $request)
    {
        try {
            $user = $request->user();
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuário não autenticado'
                ], 401);
            }

            $user->two_factor_enabled = false;
            $user->two_factor_method = null;
            $user->two_factor_phone = null;
            $user->two_factor_code = null;
            $user->two_factor_expires_at = null;
            $user->two_factor_secret = null;
            $user->save();

            \Log::info('2FA desativado', [
                'user_id' => $user->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Autenticação de dois fatores desativada',
            ]);
        } catch (\Exception $e) {
            \Log::error('Erro ao desativar 2FA: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erro ao desativar autenticação de dois fatores',
                'error' => config('app.debug') ? $e->getMessage() : 'Server Error'
            ], 500);
        }
    }
"""))

missing_blocks.append(ensure_method("send2FACode", r"""
    /**
     * Enviar código de verificação 2FA (WhatsApp)
     */
    public function send2FACode(Request $request)
    {
        try {
            $user = $request->user();
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuário não autenticado'
                ], 401);
            }

            if (!$user->two_factor_enabled || $user->two_factor_method !== 'whatsapp') {
                return response()->json([
                    'success' => false,
                    'message' => 'Autenticação de dois fatores não está ativada'
                ], 400);
            }

            $destPhone = $user->two_factor_phone ?? $user->phone;
            if (!$destPhone) {
                return response()->json([
                    'success' => false,
                    'message' => 'Número de telefone não encontrado'
                ], 400);
            }

            $code = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);
            $user->two_factor_code = Hash::make($code);
            $user->two_factor_expires_at = now()->addMinutes(5);
            $user->save();

            $whatsappService = new \App\Services\WhatsAppService();
            $result = $whatsappService->sendVerificationCode($destPhone, $code);

            if (empty($result['success'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Erro ao enviar código via WhatsApp',
                    'error' => $result['error'] ?? 'Erro desconhecido'
                ], 500);
            }

            return response()->json([
                'success' => true,
                'message' => 'Código enviado via WhatsApp',
            ]);
        } catch (\Exception $e) {
            \Log::error('Erro ao enviar código 2FA: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erro ao enviar código de verificação',
                'error' => config('app.debug') ? $e->getMessage() : 'Server Error'
            ], 500);
        }
    }
"""))

missing_blocks.append(ensure_method("verify2FACode", r"""
    /**
     * Verificar código 2FA (usuário autenticado)
     */
    public function verify2FACode(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'code' => 'required|string|size:6',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Código inválido',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = $request->user();
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuário não autenticado'
                ], 401);
            }

            if (!$user->two_factor_code || !$user->two_factor_expires_at) {
                return response()->json([
                    'success' => false,
                    'message' => 'Código não encontrado ou expirado. Solicite um novo código.',
                ], 400);
            }

            if (now()->greaterThan($user->two_factor_expires_at)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Código expirado. Solicite um novo código.',
                ], 400);
            }

            if (!Hash::check($request->code, $user->two_factor_code)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Código inválido',
                ], 400);
            }

            $user->two_factor_code = null;
            $user->two_factor_expires_at = null;
            $user->save();

            return response()->json([
                'success' => true,
                'message' => 'Código verificado com sucesso',
            ]);
        } catch (\Exception $e) {
            \Log::error('Erro ao verificar código 2FA: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erro ao verificar código',
                'error' => config('app.debug') ? $e->getMessage() : 'Server Error'
            ], 500);
        }
    }
"""))

missing_blocks = [b for b in missing_blocks if b]
if missing_blocks:
    insert = "\n\n".join(missing_blocks) + "\n"
    # Inserir antes do último "}" (fechamento da classe)
    idx = ctl.rfind("\n}")
    if idx == -1:
        raise SystemExit("Não consegui localizar o fechamento da classe para inserir métodos.")
    ctl = ctl[:idx] + insert + ctl[idx:]
    auth_controller.write_text(ctl, encoding="utf-8")
    print("✅ Métodos faltantes adicionados em AuthController.php")
else:
    print("ℹ️  Nenhum método adicional precisou ser inserido.")

print("\n✅ Patch 2FA WhatsApp-only aplicado com sucesso.")
PY

echo ""
echo "🧹 Limpando caches do Laravel..."
cd /var/www/lacos-backend
php -d memory_limit=512M artisan route:clear || true
php -d memory_limit=512M artisan config:clear || true
php -d memory_limit=512M artisan cache:clear || true
php -d memory_limit=512M artisan optimize:clear || true

echo ""
echo "✅ Finalizado."


