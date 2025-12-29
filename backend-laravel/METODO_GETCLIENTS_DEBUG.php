<?php
/**
 * VERSÃO DEBUG DO MÉTODO getClients
 * 
 * Esta versão retorna mais informações sobre erros para ajudar no debug.
 * Use apenas em desenvolvimento!
 */

    public function getClients()
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuário não autenticado'
                ], 401);
            }

            // Verificar se tabela existe
            if (!Schema::hasTable('group_members')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tabela group_members não existe no banco de dados',
                    'debug' => 'Verifique se as migrations foram executadas'
                ], 500);
            }

            // Buscar grupos onde o usuário é membro usando query direta na tabela group_members
            $groupIds = DB::table('group_members')
                ->where('user_id', $user->id)
                ->pluck('group_id')
                ->toArray();

            if (empty($groupIds)) {
                return response()->json([
                    'success' => true,
                    'data' => []
                ]);
            }

            // Buscar admins (clientes) desses grupos
            $clients = DB::table('group_members')
                ->join('users', 'group_members.user_id', '=', 'users.id')
                ->join('groups', 'group_members.group_id', '=', 'groups.id')
                ->whereIn('group_members.group_id', $groupIds)
                ->where('group_members.role', 'admin')
                ->where('group_members.user_id', '!=', $user->id) // Excluir o próprio usuário
                ->select(
                    'users.id',
                    'users.name',
                    'users.email',
                    'users.phone',
                    'users.city',
                    'users.neighborhood',
                    'users.photo as photo_url',
                    'groups.name as group_name',
                    'groups.id as group_id'
                )
                ->distinct()
                ->get()
                ->map(function ($client) {
                    // Calcular rating médio (se houver reviews)
                    $rating = DB::table('reviews')
                        ->where('reviewed_user_id', $client->id)
                        ->avg('rating');
                    
                    $reviewsCount = DB::table('reviews')
                        ->where('reviewed_user_id', $client->id)
                        ->count();

                    return [
                        'id' => $client->id,
                        'name' => $client->name,
                        'email' => $client->email,
                        'phone' => $client->phone,
                        'city' => $client->city,
                        'neighborhood' => $client->neighborhood,
                        'photo_url' => $client->photo_url,
                        'photo' => $client->photo_url, // Alias para compatibilidade
                        'group_name' => $client->group_name,
                        'group_id' => $client->group_id,
                        'rating' => $rating ? round($rating, 1) : 0,
                        'reviews_count' => $reviewsCount,
                    ];
                })
                ->values();

            return response()->json([
                'success' => true,
                'data' => $clients
            ]);

        } catch (\Illuminate\Database\QueryException $e) {
            // Erro de banco de dados
            Log::error('Erro de banco de dados em getClients: ' . $e->getMessage(), [
                'sql' => $e->getSql(),
                'bindings' => $e->getBindings(),
                'trace' => $e->getTraceAsString(),
                'user_id' => Auth::id()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erro ao buscar clientes no banco de dados',
                'error' => config('app.debug') ? $e->getMessage() : 'Erro interno',
                'errors' => []
            ], 500);

        } catch (\Exception $e) {
            Log::error('Erro em getClients: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'user_id' => Auth::id(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'class' => get_class($e)
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erro ao buscar clientes',
                'error' => config('app.debug') ? $e->getMessage() : 'Erro interno',
                'errors' => []
            ], 500);
        }
    }


