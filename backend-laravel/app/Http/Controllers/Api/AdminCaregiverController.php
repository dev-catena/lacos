<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AdminCaregiverController extends Controller
{
    /**
     * Listar todos os cuidadores profissionais (apenas root/admin)
     * GET /api/admin/caregivers
     */
    public function index()
    {
        try {
            $user = Auth::user();

            // Verificar se é root: por campo is_root ou por email root@lacos.com ou admin@lacos.com
            $isRoot = ($user->is_root ?? false) || ($user->email === 'root@lacos.com') || ($user->email === 'admin@lacos.com');

            if (!$user || !$isRoot) {
                return response()->json([
                    'success' => false,
                    'message' => 'Acesso negado. Apenas usuários root podem acessar esta funcionalidade.'
                ], 403);
            }

            $caregivers = User::where('profile', 'professional_caregiver')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($caregiver) {
                    return [
                        'id' => $caregiver->id,
                        'name' => $caregiver->name,
                        'email' => $caregiver->email,
                        'phone' => $caregiver->phone,
                        'created_at' => $caregiver->created_at,
                        'formation_details' => $caregiver->formation_details ?? 'Não informado',
                        'city' => $caregiver->city ?? 'Não informado',
                        'neighborhood' => $caregiver->neighborhood ?? 'Não informado',
                        'is_available' => $caregiver->is_available ?? true,
                        'hourly_rate' => $caregiver->hourly_rate ?? null,
                    ];
                });

            return response()->json([
                'success' => true,
                'caregivers' => $caregivers
            ]);
        } catch (\Exception $e) {
            Log::error('Erro ao listar cuidadores profissionais: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'user_id' => Auth::id()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erro ao listar cuidadores profissionais',
                'error' => 'Server Error'
            ], 500);
        }
    }

    /**
     * Listar pacientes de um cuidador profissional (apenas root/admin)
     * GET /api/admin/caregivers/{id}/patients
     */
    public function getPatients($caregiverId)
    {
        try {
            $user = Auth::user();

            // Verificar se é root: por campo is_root ou por email root@lacos.com ou admin@lacos.com
            $isRoot = ($user->is_root ?? false) || ($user->email === 'root@lacos.com') || ($user->email === 'admin@lacos.com');

            if (!$user || !$isRoot) {
                return response()->json([
                    'success' => false,
                    'message' => 'Acesso negado. Apenas usuários root podem acessar esta funcionalidade.'
                ], 403);
            }

            // Verificar se o cuidador existe
            $caregiver = User::find($caregiverId);
            if (!$caregiver || $caregiver->profile !== 'professional_caregiver') {
                return response()->json([
                    'success' => false,
                    'message' => 'Cuidador profissional não encontrado'
                ], 404);
            }

            // Buscar grupos onde o cuidador é membro
            $groupIds = DB::table('group_members')
                ->where('user_id', $caregiverId)
                ->pluck('group_id')
                ->toArray();

            if (empty($groupIds)) {
                return response()->json([
                    'success' => true,
                    'caregiver' => [
                        'id' => $caregiver->id,
                        'name' => $caregiver->name,
                        'email' => $caregiver->email,
                    ],
                    'patients' => []
                ]);
            }

            // Buscar admins dos grupos (clientes do cuidador)
            $selectColumns = [
                'users.id',
                'users.name',
                'users.email',
                'users.phone',
                'groups.id as group_id',
                'groups.name as group_name',
            ];

            if (Schema::hasColumn('users', 'city')) {
                $selectColumns[] = 'users.city';
            }
            if (Schema::hasColumn('users', 'neighborhood')) {
                $selectColumns[] = 'users.neighborhood';
            }

            $clients = DB::table('group_members')
                ->join('users', 'group_members.user_id', '=', 'users.id')
                ->join('groups', 'group_members.group_id', '=', 'groups.id')
                ->whereIn('group_members.group_id', $groupIds)
                ->where('group_members.role', 'admin')
                ->where('group_members.user_id', '!=', $caregiverId)
                ->select($selectColumns)
                ->distinct()
                ->get()
                ->map(function ($client) {
                    // Buscar o paciente do grupo (priority_contact ou patient)
                    $patient = null;
                    try {
                        $patientMember = DB::table('group_members')
                            ->join('users', 'group_members.user_id', '=', 'users.id')
                            ->where('group_members.group_id', $client->group_id)
                            ->whereIn('group_members.role', ['priority_contact', 'patient'])
                            ->select('users.id', 'users.name', 'users.birth_date')
                            ->first();
                        
                        if ($patientMember) {
                            // Calcular idade
                            $age = null;
                            if ($patientMember->birth_date) {
                                $birthDate = new \DateTime($patientMember->birth_date);
                                $today = new \DateTime();
                                $age = $today->diff($birthDate)->y;
                            }

                            $patient = [
                                'id' => $patientMember->id,
                                'name' => $patientMember->name,
                                'age' => $age,
                            ];
                        }
                    } catch (\Exception $e) {
                        Log::warning('Erro ao buscar paciente do grupo: ' . $e->getMessage());
                    }

                    return [
                        'id' => $client->id,
                        'name' => $client->name,
                        'email' => $client->email,
                        'phone' => $client->phone ?? null,
                        'city' => $client->city ?? null,
                        'neighborhood' => $client->neighborhood ?? null,
                        'group_name' => $client->group_name,
                        'group_id' => $client->group_id,
                        'patient' => $patient,
                    ];
                })
                ->values();

            return response()->json([
                'success' => true,
                'caregiver' => [
                    'id' => $caregiver->id,
                    'name' => $caregiver->name,
                    'email' => $caregiver->email,
                ],
                'patients' => $clients
            ]);
        } catch (\Exception $e) {
            Log::error('Erro ao listar pacientes do cuidador: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'user_id' => Auth::id(),
                'caregiver_id' => $caregiverId
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erro ao listar pacientes do cuidador',
                'error' => 'Server Error'
            ], 500);
        }
    }
}

