<?php
/**
 * Método getClients para CaregiverController
 * 
 * Este método busca os clientes (admins dos grupos) onde o cuidador profissional é membro.
 * Usa query direta na tabela group_members conforme documentação.
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

    } catch (\Exception $e) {
        \Log::error('Erro em getClients: ' . $e->getMessage(), [
            'trace' => $e->getTraceAsString(),
            'user_id' => Auth::id()
        ]);

        return response()->json([
            'success' => false,
            'message' => 'Erro ao buscar clientes: ' . $e->getMessage()
        ], 500);
    }
}


