<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Log;
use App\Models\User;

class DoctorController extends Controller
{
    /**
     * Listar médicos de um grupo
     * GET /api/doctors?group_id={groupId}
     */
    public function index(Request $request)
    {
        try {
            $groupId = $request->query('group_id');
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuário não autenticado',
                ], 401);
            }
            
            // Verificar se o usuário tem acesso ao grupo
            if ($groupId) {
                $hasAccess = false;
                if (Schema::hasTable('group_user')) {
                    $hasAccess = DB::table('group_user')
                        ->where('user_id', $user->id)
                        ->where('group_id', $groupId)
                        ->exists();
                } else {
                    // Fallback: verificar se é criador do grupo
                    $hasAccess = DB::table('groups')
                        ->where('id', $groupId)
                        ->where('created_by', $user->id)
                        ->exists();
                }
                
                if (!$hasAccess) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Você não tem acesso a este grupo',
                    ], 403);
                }
            }
            
            $doctors = [];
            
            if ($groupId) {
                // Buscar médicos associados ao grupo:
                // 1. Médicos que têm medicamentos no grupo
                // 2. Médicos que têm documentos no grupo
                // 3. Médicos que têm consultas no grupo
                // 4. Médicos que são membros do grupo (role='doctor')
                
                $doctorIds = collect();
                
                // Médicos via medicamentos
                if (Schema::hasTable('medications')) {
                    $medicationDoctors = DB::table('medications')
                        ->where('group_id', $groupId)
                        ->whereNotNull('doctor_id')
                        ->distinct()
                        ->pluck('doctor_id');
                    $doctorIds = $doctorIds->merge($medicationDoctors);
                }
                
                // Médicos via documentos
                if (Schema::hasTable('documents')) {
                    $documentDoctors = DB::table('documents')
                        ->where('group_id', $groupId)
                        ->whereNotNull('doctor_id')
                        ->distinct()
                        ->pluck('doctor_id');
                    $doctorIds = $doctorIds->merge($documentDoctors);
                }
                
                // Médicos via consultas
                if (Schema::hasTable('appointments')) {
                    $appointmentDoctors = DB::table('appointments')
                        ->where('group_id', $groupId)
                        ->whereNotNull('doctor_id')
                        ->distinct()
                        ->pluck('doctor_id');
                    $doctorIds = $doctorIds->merge($appointmentDoctors);
                }
                
                // Médicos que são membros do grupo
                if (Schema::hasTable('group_user')) {
                    $memberDoctors = DB::table('group_user')
                        ->where('group_id', $groupId)
                        ->join('users', 'group_user.user_id', '=', 'users.id')
                        ->where('users.profile', 'doctor')
                        ->pluck('users.id');
                    $doctorIds = $doctorIds->merge($memberDoctors);
                }
                
                // Remover duplicatas e buscar dados dos médicos
                $uniqueDoctorIds = $doctorIds->unique()->values();
                
                if ($uniqueDoctorIds->isNotEmpty()) {
                    // Buscar médicos da tabela doctors
                    $doctorsFromTable = [];
                    if (Schema::hasTable('doctors')) {
                        $doctorsFromTable = DB::table('doctors')
                            ->whereIn('id', $uniqueDoctorIds)
                            ->get()
                            ->map(function ($doctor) {
                                // Buscar especialidade
                                $specialty = null;
                                if ($doctor->medical_specialty_id) {
                                    $specialtyData = DB::table('medical_specialties')
                                        ->where('id', $doctor->medical_specialty_id)
                                        ->select('id', 'name')
                                        ->first();
                                    if ($specialtyData) {
                                        $specialty = [
                                            'id' => $specialtyData->id,
                                            'name' => $specialtyData->name,
                                        ];
                                    }
                                }
                                
                                return [
                                    'id' => $doctor->id,
                                    'name' => $doctor->name,
                                    'crm' => $doctor->crm ?? null,
                                    'medical_specialty' => $specialty,
                                    'medical_specialty_id' => $doctor->medical_specialty_id,
                                    'is_primary' => (bool) ($doctor->is_primary ?? false),
                                ];
                            })
                            ->toArray();
                    }
                    
                    // Buscar médicos da tabela users (se não encontrados na tabela doctors)
                    $foundIds = collect($doctorsFromTable)->pluck('id');
                    $missingIds = $uniqueDoctorIds->diff($foundIds);
                    
                    if ($missingIds->isNotEmpty()) {
                        $doctorsFromUsers = DB::table('users')
                            ->whereIn('id', $missingIds)
                            ->where('profile', 'doctor')
                            ->get()
                            ->map(function ($user) {
                                // Buscar especialidade
                                $specialty = null;
                                if ($user->medical_specialty_id) {
                                    $specialtyData = DB::table('medical_specialties')
                                        ->where('id', $user->medical_specialty_id)
                                        ->select('id', 'name')
                                        ->first();
                                    if ($specialtyData) {
                                        $specialty = [
                                            'id' => $specialtyData->id,
                                            'name' => $specialtyData->name,
                                        ];
                                    }
                                }
                                
                                return [
                                    'id' => $user->id,
                                    'name' => $user->name,
                                    'email' => $user->email,
                                    'crm' => $user->crm ?? null,
                                    'medical_specialty' => $specialty,
                                    'medical_specialty_id' => $user->medical_specialty_id,
                                    'is_primary' => false,
                                    'is_platform_doctor' => true,
                                ];
                            })
                            ->toArray();
                        
                        $doctors = array_merge($doctorsFromTable, $doctorsFromUsers);
                    } else {
                        $doctors = $doctorsFromTable;
                    }
                }
            }
            
            return response()->json([
                'success' => true,
                'data' => $doctors,
            ]);
        } catch (\Exception $e) {
            Log::error('Erro ao buscar médicos: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erro ao buscar médicos',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Buscar agenda disponível de um médico
     * GET /api/doctors/{id}/availability
     */
    public function getAvailability($id)
    {
        try {
            $doctor = User::where("id", $id)->where("profile", "doctor")->firstOrFail();
            $availability = json_decode($doctor->availability ?? "{}", true);
            if (!$availability || !is_array($availability)) {
                $availability = ["availableDays" => [], "daySchedules" => []];
            }
            return response()->json(["success" => true, "data" => $availability]);
        } catch (\Exception $e) {
            \Log::error("Erro ao buscar agenda: " . $e->getMessage());
            return response()->json(["success" => false, "message" => "Erro ao buscar agenda"], 500);
        }
    }

    /**
     * Salvar agenda disponível de um médico
     * POST /api/doctors/{id}/availability
     */
    public function saveAvailability(Request $request, $id)
    {
        try {
            $doctor = User::where("id", $id)->where("profile", "doctor")->firstOrFail();
            $validated = $request->validate(["availableDays" => "nullable|array", "daySchedules" => "nullable|array"]);
            $availabilityData = ["availableDays" => $validated["availableDays"] ?? [], "daySchedules" => $validated["daySchedules"] ?? []];
            $doctor->availability = json_encode($availabilityData);
            $doctor->save();
            return response()->json(["success" => true, "message" => "Agenda salva", "data" => $availabilityData]);
        } catch (\Exception $e) {
            \Log::error("Erro ao salvar agenda: " . $e->getMessage());
            return response()->json(["success" => false, "message" => "Erro ao salvar agenda"], 500);
        }
    }
}
