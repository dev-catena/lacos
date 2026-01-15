<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Group;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class GroupController extends Controller
{
    /**
     * Listar membros de um grupo
     * GET /api/groups/{id}/members
     */
    public function members($id)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuário não autenticado'
                ], 401);
            }

            // Verificar se o grupo existe e se o usuário tem acesso
            $group = Group::find($id);
            
            if (!$group) {
                return response()->json([
                    'success' => false,
                    'message' => 'Grupo não encontrado'
                ], 404);
            }

            // Verificar se o usuário é membro do grupo
            $isMember = DB::table('group_members')
                ->where('group_id', $id)
                ->where('user_id', $user->id)
                ->exists();

            if (!$isMember) {
                return response()->json([
                    'success' => false,
                    'message' => 'Você não tem acesso a este grupo'
                ], 403);
            }

            // Buscar membros do grupo
            // CORREÇÃO: Especificar users.is_active para evitar ambiguidade
            $members = DB::table('group_members')
                ->join('users', 'group_members.user_id', '=', 'users.id')
                ->where('group_members.group_id', $id)
                ->where('users.is_active', 1) // Especificar users.is_active
                ->select(
                    'users.id',
                    'users.name',
                    'users.email',
                    'users.phone',
                    'users.photo',
                    'users.photo_url',
                    'users.profile',
                    'group_members.role',
                    'group_members.joined_at'
                )
                ->get()
                ->map(function ($member) {
                    return [
                        'user_id' => $member->id,
                        'user' => [
                            'id' => $member->id,
                            'name' => $member->name,
                            'email' => $member->email,
                            'phone' => $member->phone,
                            'photo' => $member->photo,
                            'photo_url' => $member->photo_url,
                            'profile' => $member->profile,
                        ],
                        'role' => $member->role,
                        'joined_at' => $member->joined_at,
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $members
            ]);

        } catch (\Exception $e) {
            Log::error('Erro ao buscar membros do grupo: ' . $e->getMessage(), [
                'group_id' => $id,
                'user_id' => Auth::id(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erro ao buscar membros',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display a listing of user's groups
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        Log::info("🔍 GroupController.index - Buscando grupos para usuário ID: {$user->id}, Email: {$user->email}");
        
        // Buscar grupos onde o usuário é membro (via group_members)
        $groupsAsMember = $user->groups()
            ->with(['creator', 'groupMembers.user'])
            ->withCount('groupMembers as members_count')
            ->get();
        
        Log::info("📊 GroupController.index - Grupos como membro: " . $groupsAsMember->count());
        
        // Buscar grupos criados pelo usuário (via created_by)
        $groupsAsCreator = Group::where('created_by', $user->id)
            ->with(['creator', 'groupMembers.user'])
            ->withCount('groupMembers as members_count')
            ->get();
        
        Log::info("📊 GroupController.index - Grupos como criador: " . $groupsAsCreator->count());
        
        // Combinar e remover duplicatas
        $allGroups = $groupsAsMember->merge($groupsAsCreator)->unique('id');
        
        Log::info("📊 GroupController.index - Total de grupos únicos: " . $allGroups->count());
        
        // Adicionar is_admin e is_creator para cada grupo
        $allGroups->each(function ($group) use ($user) {
            $member = $group->groupMembers->firstWhere('user_id', $user->id);
            $group->is_admin = $member && $member->role === 'admin';
            $group->is_creator = $group->created_by === $user->id;
            
            // Log para debug
            Log::info("   - Grupo ID: {$group->id}, Nome: {$group->name}, is_admin: " . ($group->is_admin ? 'true' : 'false') . ", is_creator: " . ($group->is_creator ? 'true' : 'false'));
        });
        
        return response()->json($allGroups->values());
    }

    /**
     * Display the specified group
     */
    public function show($id)
    {
        $group = Group::with(['creator', 'groupMembers.user'])->findOrFail($id);
        return response()->json($group);
    }

    /**
     * Store a newly created group
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:100',
            'description' => 'nullable|string',
        ]);

        $group = Group::create([
            'name' => $request->name,
            'description' => $request->description,
            'created_by' => Auth::id(),
        ]);

        return response()->json($group, 201);
    }

    /**
     * Update the specified group
     */
    public function update(Request $request, $id)
    {
        $group = Group::findOrFail($id);

        $request->validate([
            'name' => 'sometimes|string|max:100',
            'description' => 'sometimes|nullable|string',
        ]);

        $group->update($request->only(['name', 'description']));

        return response()->json($group);
    }

    /**
     * Remove the specified group
     */
    public function destroy($id)
    {
        $group = Group::findOrFail($id);
        $group->delete();

        return response()->json(['message' => 'Grupo removido com sucesso']);
    }
}

