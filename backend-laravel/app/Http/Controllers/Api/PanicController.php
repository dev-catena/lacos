<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class PanicController extends Controller
{
    /**
     * Acionar botão de pânico
     * POST /api/panic/trigger
     */
    public function trigger(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuário não autenticado'
                ], 401);
            }

            $request->validate([
                'group_id' => 'required|integer|exists:groups,id',
                'trigger_type' => 'required|in:manual,voice',
                'latitude' => 'nullable|numeric',
                'longitude' => 'nullable|numeric',
                'location_address' => 'nullable|string|max:500',
            ]);

            $groupId = $request->group_id;

            // Verificar se o botão de pânico está habilitado para o grupo
            $group = DB::table('groups')->where('id', $groupId)->first();
            if (!$group) {
                return response()->json([
                    'success' => false,
                    'message' => 'Grupo não encontrado'
                ], 404);
            }

            // Verificar se panic_enabled existe na tabela groups
            $panicEnabled = true; // Padrão: habilitado
            if (Schema::hasColumn('groups', 'panic_enabled')) {
                $panicEnabled = $group->panic_enabled ?? true;
            }

            if (!$panicEnabled) {
                return response()->json([
                    'success' => false,
                    'message' => 'Botão de pânico não está habilitado para este grupo'
                ], 403);
            }

            // Verificar se a tabela panic_events existe
            if (!Schema::hasTable('panic_events')) {
                // Criar tabela se não existir
                $this->createPanicEventsTable();
            }

            // Criar evento de pânico
            $panicEventId = DB::table('panic_events')->insertGetId([
                'group_id' => $groupId,
                'user_id' => $user->id,
                'trigger_type' => $request->trigger_type,
                'latitude' => $request->latitude,
                'longitude' => $request->longitude,
                'location_address' => $request->location_address,
                'call_status' => 'ongoing',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Buscar contatos de emergência do grupo
            // PRIORIDADE: Contatos SOS da tabela emergency_contacts (is_primary=true ou relationship='SOS')
            $emergencyContacts = [];
            
            // 1. Buscar contatos SOS da tabela emergency_contacts
            if (Schema::hasTable('emergency_contacts')) {
                $sosContacts = DB::table('emergency_contacts')
                    ->where('group_id', $groupId)
                    ->where(function($q) {
                        $q->where('is_primary', true)
                          ->orWhere('relationship', 'SOS')
                          ->orWhere('relationship', 'sos');
                    })
                    ->orderBy('is_primary', 'desc')
                    ->orderBy('created_at', 'asc')
                    ->get()
                    ->map(function ($contact) {
                        return [
                            'id' => $contact->id,
                            'type' => 'emergency_contact',
                            'is_emergency_contact' => true,
                            'user' => [
                                'id' => null,
                                'name' => $contact->name,
                                'phone' => $contact->phone,
                                'email' => null,
                            ],
                            'emergency_contact' => [
                                'id' => $contact->id,
                                'name' => $contact->name,
                                'phone' => $contact->phone,
                                'relationship' => $contact->relationship,
                                'is_primary' => $contact->is_primary,
                            ],
                        ];
                    });
                
                $emergencyContacts = $sosContacts->toArray();
                
                Log::info('Contatos SOS encontrados', [
                    'group_id' => $groupId,
                    'count' => count($emergencyContacts)
                ]);
            }
            
            // 2. Se não houver contatos SOS, buscar membros do grupo como fallback
            if (empty($emergencyContacts) && Schema::hasTable('group_members')) {
                $query = DB::table('group_members')
                    ->join('users', 'group_members.user_id', '=', 'users.id')
                    ->where('group_members.group_id', $groupId)
                    ->where(function($q) {
                        // Se a coluna is_emergency_contact existe, usar ela
                        if (Schema::hasColumn('group_members', 'is_emergency_contact')) {
                            $q->where('group_members.is_emergency_contact', true)
                              ->orWhere('group_members.role', 'admin');
                        } else {
                            // Caso contrário, usar apenas admins
                            $q->where('group_members.role', 'admin');
                        }
                    });
                
                // Verificar se a coluna is_active existe antes de usar
                if (Schema::hasColumn('users', 'is_active')) {
                    $query->where('users.is_active', 1);
                }
                
                $memberContacts = $query
                    ->select(
                        'group_members.id',
                        'group_members.user_id',
                        'group_members.role',
                        'users.id as user_id',
                        'users.name',
                        'users.phone',
                        'users.email'
                    );
                
                // Ordenar apenas se a coluna existir
                if (Schema::hasColumn('group_members', 'is_emergency_contact')) {
                    $memberContacts = $memberContacts->orderBy('group_members.is_emergency_contact', 'desc');
                }
                
                $memberContacts = $memberContacts
                    ->orderBy('group_members.role', 'desc')
                    ->get()
                    ->map(function ($contact) {
                        return [
                            'id' => $contact->id,
                            'type' => 'group_member',
                            'user_id' => $contact->user_id,
                            'is_emergency_contact' => true,
                            'user' => [
                                'id' => $contact->user_id,
                                'name' => $contact->name,
                                'phone' => $contact->phone,
                                'email' => $contact->email,
                            ],
                        ];
                    });
                
                $emergencyContacts = $memberContacts->toArray();
                
                Log::info('Contatos de membros do grupo usados como fallback', [
                    'group_id' => $groupId,
                    'count' => count($emergencyContacts)
                ]);
            }

            // Buscar evento criado
            $panicEvent = DB::table('panic_events')->where('id', $panicEventId)->first();

            Log::info('Pânico acionado', [
                'event_id' => $panicEventId,
                'group_id' => $groupId,
                'user_id' => $user->id,
                'contacts_count' => count($emergencyContacts)
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Pânico acionado com sucesso',
                'data' => [
                    'panic_event' => $panicEvent,
                    'emergency_contacts' => $emergencyContacts,
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Erro ao acionar pânico: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erro ao acionar pânico',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Finalizar chamada de emergência
     * PUT /api/panic/{eventId}/end-call
     */
    public function endCall(Request $request, $eventId)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuário não autenticado'
                ], 401);
            }

            $request->validate([
                'status' => 'required|in:completed,cancelled',
                'duration' => 'nullable|integer|min:0',
                'notes' => 'nullable|string|max:1000',
            ]);

            if (!Schema::hasTable('panic_events')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tabela panic_events não existe'
                ], 404);
            }

            $panicEvent = DB::table('panic_events')->where('id', $eventId)->first();

            if (!$panicEvent) {
                return response()->json([
                    'success' => false,
                    'message' => 'Evento de pânico não encontrado'
                ], 404);
            }

            // Atualizar evento
            DB::table('panic_events')
                ->where('id', $eventId)
                ->update([
                    'call_status' => $request->status,
                    'call_duration' => $request->duration ?? 0,
                    'notes' => $request->notes,
                    'updated_at' => now(),
                ]);

            $updatedEvent = DB::table('panic_events')->where('id', $eventId)->first();

            Log::info('Chamada de pânico finalizada', [
                'event_id' => $eventId,
                'status' => $request->status,
                'duration' => $request->duration
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Chamada finalizada com sucesso',
                'data' => [
                    'panic_event' => $updatedEvent
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Erro ao finalizar chamada: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Erro ao finalizar chamada',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Listar eventos de pânico
     * GET /api/panic?group_id={groupId}
     */
    public function index(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuário não autenticado'
                ], 401);
            }

            if (!Schema::hasTable('panic_events')) {
                return response()->json([
                    'success' => true,
                    'data' => []
                ]);
            }

            $groupId = $request->query('group_id');

            $query = DB::table('panic_events')
                ->join('users', 'panic_events.user_id', '=', 'users.id')
                ->select(
                    'panic_events.*',
                    'users.name as user_name',
                    'users.email as user_email'
                );

            if ($groupId) {
                $query->where('panic_events.group_id', $groupId);
            } else {
                // Se não especificar grupo, buscar apenas eventos dos grupos do usuário
                $userGroups = DB::table('group_members')
                    ->where('user_id', $user->id)
                    ->pluck('group_id')
                    ->toArray();
                
                if (!empty($userGroups)) {
                    $query->whereIn('panic_events.group_id', $userGroups);
                } else {
                    return response()->json([
                        'success' => true,
                        'data' => []
                    ]);
                }
            }

            $events = $query->orderBy('panic_events.created_at', 'desc')->get();

            return response()->json([
                'success' => true,
                'data' => $events
            ]);

        } catch (\Exception $e) {
            Log::error('Erro ao listar eventos de pânico: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Erro ao listar eventos',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Verificar configuração do botão de pânico
     * GET /api/panic/config/{groupId}
     */
    public function checkConfig($groupId)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuário não autenticado'
                ], 401);
            }

            $group = DB::table('groups')->where('id', $groupId)->first();

            if (!$group) {
                return response()->json([
                    'success' => false,
                    'message' => 'Grupo não encontrado'
                ], 404);
            }

            $panicEnabled = true; // Padrão
            if (Schema::hasColumn('groups', 'panic_enabled')) {
                $panicEnabled = $group->panic_enabled ?? true;
            }

            // Contar contatos de emergência
            $emergencyContactsCount = 0;
            if (Schema::hasTable('group_members')) {
                $query = DB::table('group_members')
                    ->join('users', 'group_members.user_id', '=', 'users.id')
                    ->where('group_members.group_id', $groupId)
                    ->where(function($q) {
                        if (Schema::hasColumn('group_members', 'is_emergency_contact')) {
                            $q->where('group_members.is_emergency_contact', true)
                              ->orWhere('group_members.role', 'admin');
                        } else {
                            $q->where('group_members.role', 'admin');
                        }
                    });
                
                // Verificar se a coluna is_active existe antes de usar
                if (Schema::hasColumn('users', 'is_active')) {
                    $query->where('users.is_active', 1);
                }
                
                $emergencyContactsCount = $query->count();
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'panic_enabled' => $panicEnabled,
                    'emergency_contacts_count' => $emergencyContactsCount,
                    'is_configured' => $panicEnabled && $emergencyContactsCount > 0,
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Erro ao verificar configuração: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Erro ao verificar configuração',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Criar tabela panic_events se não existir
     */
    private function createPanicEventsTable()
    {
        try {
            DB::statement("
                CREATE TABLE IF NOT EXISTS panic_events (
                    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                    group_id BIGINT UNSIGNED NOT NULL,
                    user_id BIGINT UNSIGNED NOT NULL,
                    trigger_type VARCHAR(20) NOT NULL DEFAULT 'manual',
                    latitude DECIMAL(10, 8) NULL,
                    longitude DECIMAL(11, 8) NULL,
                    location_address VARCHAR(500) NULL,
                    call_duration INT UNSIGNED NULL DEFAULT 0,
                    call_status VARCHAR(20) NOT NULL DEFAULT 'ongoing',
                    notes TEXT NULL,
                    created_at TIMESTAMP NULL,
                    updated_at TIMESTAMP NULL,
                    INDEX idx_group_id (group_id),
                    INDEX idx_user_id (user_id),
                    INDEX idx_created_at (created_at)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            ");
        } catch (\Exception $e) {
            Log::error('Erro ao criar tabela panic_events: ' . $e->getMessage());
        }
    }
}

