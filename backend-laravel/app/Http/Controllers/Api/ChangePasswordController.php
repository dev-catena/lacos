<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class ChangePasswordController extends Controller
{
    /**
     * Alterar senha do usuário autenticado
     * POST /api/change-password
     */
    public function changePassword(Request $request)
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuário não autenticado',
                    'error' => 'Unauthorized'
                ], 401);
            }

            $validator = Validator::make($request->all(), [
                'current_password' => 'required|string',
                'new_password' => 'required|string|min:6|confirmed',
            ], [
                'current_password.required' => 'A senha atual é obrigatória',
                'new_password.required' => 'A nova senha é obrigatória',
                'new_password.min' => 'A nova senha deve ter pelo menos 6 caracteres',
                'new_password.confirmed' => 'A confirmação da senha não confere',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dados inválidos',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Verificar senha atual
            if (!Hash::check($request->current_password, $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Senha atual incorreta',
                    'errors' => [
                        'current_password' => ['A senha atual está incorreta']
                    ]
                ], 422);
            }

            // Verificar se a nova senha é diferente da atual
            if (Hash::check($request->new_password, $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'A nova senha deve ser diferente da senha atual',
                    'errors' => [
                        'new_password' => ['A nova senha deve ser diferente da senha atual']
                    ]
                ], 422);
            }

            // Atualizar senha
            $user->password = Hash::make($request->new_password);
            $user->save();

            return response()->json([
                'success' => true,
                'message' => 'Senha alterada com sucesso'
            ]);
        } catch (\Exception $e) {
            Log::error('Erro ao alterar senha: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'user_id' => Auth::id()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erro ao alterar senha',
                'error' => 'Server Error',
                'details' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }
}

