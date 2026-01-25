<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AdminAuthController extends Controller
{
    /**
     * Login para usuários root/admin
     * POST /api/admin/login
     */
    public function login(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'email' => 'required|email',
                'password' => 'required|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Dados inválidos',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = User::where('email', $request->email)->first();

            if (!$user) {
                return response()->json([
                    'message' => 'Credenciais inválidas'
                ], 401);
            }

            // Verificar se está bloqueado (considerando diferentes formatos)
            $isBlocked = false;
            if ($user->is_blocked === true || $user->is_blocked === 1 || 
                $user->is_blocked === '1' || $user->is_blocked === 'true' ||
                (is_string($user->is_blocked) && strtolower($user->is_blocked) === 'true')) {
                $isBlocked = true;
            }
            
            if ($isBlocked) {
                return response()->json([
                    'message' => 'Acesso negado. Sua conta foi bloqueada.',
                    'error' => 'account_blocked'
                ], 403);
            }

            // Verificar senha
            if (!Hash::check($request->password, $user->password)) {
                return response()->json([
                    'message' => 'Credenciais inválidas'
                ], 401);
            }

            // Verificar se é root/admin (você pode adicionar uma coluna is_root ou verificar por email específico)
            // Por enquanto, vamos permitir qualquer usuário não bloqueado
            // Você pode adicionar uma verificação específica aqui:
            // if (!$user->is_root && $user->email !== 'root@lacos.com') {
            //     return response()->json(['message' => 'Acesso negado. Apenas usuários root podem acessar.'], 403);
            // }

            // Criar token
            $token = $user->createToken('admin-token')->plainTextToken;

            return response()->json([
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'profile' => $user->profile,
                ],
                'token' => $token,
                'message' => 'Login realizado com sucesso'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erro ao fazer login',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Logout
     * POST /api/admin/logout
     */
    public function logout(Request $request)
    {
        try {
            $request->user()->currentAccessToken()->delete();

            return response()->json([
                'message' => 'Logout realizado com sucesso'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erro ao fazer logout',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

