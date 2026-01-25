<?php

namespace App\Http\Controllers\Api;
use AppModelsCaregiverReview;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\CaregiverReview;
use App\Models\Group;
use App\Models\MedicalSpecialty;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class CaregiverController extends Controller
{
    /**
     * Listar cuidadores profissionais e médicos
     */
    public function index(Request $request)
    {
        try {
            // Permitir filtrar por profile (doctor ou professional_caregiver)
            $query = User::query();
            
            if ($request->has('profile')) {
                $profile = $request->profile;
                if ($profile === 'doctor') {
                    $query->where('profile', 'doctor');
                } elseif ($profile === 'professional_caregiver') {
                    $query->where('profile', 'professional_caregiver');
                } else {
                    // Se não especificar, retorna ambos
                    $query->whereIn('profile', ['professional_caregiver', 'doctor']);
                }
            } else {
                // Padrão: apenas cuidadores profissionais (para não quebrar funcionalidade existente)
                $query->where('profile', 'professional_caregiver');
            }
            
            // Filtrar por disponibilidade (is_available)
            if ($request->has('is_available')) {
                $isAvailable = filter_var($request->is_available, FILTER_VALIDATE_BOOLEAN);
                $query->where('is_available', $isAvailable);
            }
            
            // Filtrar por especialidade médica (apenas para médicos)
            if ($request->has('medical_specialty_id')) {
                $query->where('medical_specialty_id', $request->medical_specialty_id);
            }
            
            $query->with(['caregiverCourses', 'caregiverReviews', 'medicalSpecialty']);

            // Filtro por avaliação mínima
            if ($request->has('min_rating')) {
                $minRating = (float) $request->min_rating;
                $query->whereHas('caregiverReviews', function ($q) use ($minRating) {
                    $q->select('caregiver_id', DB::raw('AVG(rating) as avg_rating'))
                        ->groupBy('caregiver_id')
                        ->havingRaw('AVG(rating) >= ?', [$minRating]);
                });
            }

            // Filtro por distância
            if ($request->has('latitude') && $request->has('longitude') && $request->has('max_distance')) {
                $latitude = (float) $request->latitude;
                $longitude = (float) $request->longitude;
                $maxDistance = (float) $request->max_distance;

                $query->selectRaw(
                    '*, (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))) AS distance',
                    [$latitude, $longitude, $latitude]
                )
                    ->havingRaw('distance <= ?', [$maxDistance])
                    ->orderBy('distance');
            }

            // Busca por nome, cidade ou bairro
            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('city', 'like', "%{$search}%")
                        ->orWhere('neighborhood', 'like', "%{$search}%");
                });
            }

            $caregivers = $query->get()->map(function ($caregiver) {
                $avgRating = $caregiver->caregiverReviews->avg('rating');
                
                return [
                    'id' => $caregiver->id,
                    'name' => $caregiver->name,
                    'photo' => $caregiver->photo_url,
                    'city' => $caregiver->city,
                    'neighborhood' => $caregiver->neighborhood,
                    'formation_details' => $caregiver->formation_details,
                    'hourly_rate' => $caregiver->hourly_rate,
                    'availability' => $caregiver->availability,
                    'is_available' => $caregiver->is_available,
                    'average_rating' => $avgRating ? round($avgRating, 1) : null,
                    'total_reviews' => $caregiver->caregiverReviews->count(),
                    'courses' => $caregiver->caregiverCourses,
                    'profile' => $caregiver->profile,
                    // Campos específicos de médico
                    'crm' => $caregiver->crm,
                    'medical_specialty_id' => $caregiver->medical_specialty_id,
                    'medical_specialty' => $caregiver->medicalSpecialty ? [
                        'id' => $caregiver->medicalSpecialty->id,
                        'name' => $caregiver->medicalSpecialty->name,
                    ] : null,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $caregivers,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao listar cuidadores: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Mostrar detalhes de um cuidador profissional ou médico
     */
    public function show(Request $request, $id)
    {
        try {
            $caregiver = User::whereIn('profile', ['professional_caregiver', 'doctor'])
                ->with(['caregiverCourses', 'caregiverReviews', 'medicalSpecialty'])
                ->find($id);

            if (!$caregiver) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cuidador ou médico não encontrado',
                ], 404);
            }

            $avgRating = $caregiver->caregiverReviews->avg('rating');

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $caregiver->id,
                    'name' => $caregiver->name,
                    'photo' => $caregiver->photo_url,
                    'city' => $caregiver->city,
                    'neighborhood' => $caregiver->neighborhood,
                    'formation_details' => $caregiver->formation_details,
                    'hourly_rate' => $caregiver->hourly_rate,
                    'availability' => $caregiver->availability,
                    'is_available' => $caregiver->is_available,
                    'average_rating' => $avgRating ? round($avgRating, 1) : null,
                    'total_reviews' => $caregiver->caregiverReviews->count(),
                    'courses' => $caregiver->caregiverCourses,
                    'profile' => $caregiver->profile,
                    // Campos específicos de médico
                    'crm' => $caregiver->crm,
                    'medical_specialty_id' => $caregiver->medical_specialty_id,
                    'medical_specialty' => $caregiver->medicalSpecialty ? [
                        'id' => $caregiver->medicalSpecialty->id,
                        'name' => $caregiver->medicalSpecialty->name,
                    ] : null,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao buscar cuidador: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Listar clientes (admins dos grupos onde o cuidador profissional é membro)
     * 
     * GET /api/caregivers/clients
     * 
     * @return \Illuminate\Http\JsonResponse
     */

    /**
     * Listar clientes/pacientes
     * Para médicos: retorna pacientes que agendaram consultas
     * Para cuidadores: retorna admins dos grupos
     * 
     * GET /api/caregivers/clients
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

            // Verificar se o usuário é médico (doctor_id nos appointments é o user_id)
            $isDoctor = $user->profile === 'doctor';
            if ($isDoctor) {
                // LÓGICA PARA MÉDICOS: Buscar pacientes que agendaram consultas
                $appointments = DB::table('appointments')
                    ->where('doctor_id', $user->id)
                    ->whereNotNull('group_id')
                    ->select('group_id', DB::raw('MAX(scheduled_at) as last_appointment'))
                    ->groupBy('group_id')
                    ->get();

                if ($appointments->isEmpty()) {
                    return response()->json([
                        'success' => true,
                        'data' => []
                    ]);
                }

                $groupIds = $appointments->pluck('group_id')->toArray();
                $groupLastAppointment = $appointments->pluck('last_appointment', 'group_id')->toArray();

                // Buscar pacientes (membros com role 'patient' ou 'priority_contact') desses grupos
                $patients = DB::table('group_members')
                    ->join('users', 'group_members.user_id', '=', 'users.id')
                    ->whereIn('group_members.group_id', $groupIds)
                    ->whereIn('group_members.role', ['patient', 'priority_contact'])
                    ->select(
                        'users.id',
                        'users.name',
                        'users.birth_date',
                        'users.gender',
                        'group_members.group_id'
                    )
                    ->distinct()
                    ->get()
                    ->map(function ($patient) use ($groupLastAppointment) {
                        // Calcular idade
                        $age = null;
                        if ($patient->birth_date) {
                            $birthDate = new \DateTime($patient->birth_date);
                            $today = new \DateTime();
                            $age = $today->diff($birthDate)->y;
                        }

                        // Data da última consulta do grupo
                        $lastAppointment = $groupLastAppointment[$patient->group_id] ?? null;

                        return [
                            'id' => $patient->id,
                            'name' => $patient->name,
                            'age' => $age,
                            'gender' => $patient->gender === 'male' ? 'Masculino' : ($patient->gender === 'female' ? 'Feminino' : ($patient->gender ?? 'Não informado')),
                            'last_appointment_date' => $lastAppointment,
                            'group_id' => $patient->group_id,
                        ];
                    })
                    ->sortByDesc('last_appointment_date')
                    ->values();

                return response()->json([
                    'success' => true,
                    'data' => $patients
                ]);
            }

            // LÓGICA PARA CUIDADORES: Buscar admins dos grupos
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

            // Construir select dinamicamente baseado nas colunas existentes
            $selectColumns = [
                'users.id',
                'users.name',
                'users.email',
                'users.phone',
            ];
            
            if (Schema::hasColumn('users', 'city')) {
                $selectColumns[] = 'users.city';
            }
            if (Schema::hasColumn('users', 'neighborhood')) {
                $selectColumns[] = 'users.neighborhood';
            }
            if (Schema::hasColumn('users', 'photo')) {
                $selectColumns[] = 'users.photo as photo_url';
            } elseif (Schema::hasColumn('users', 'photo_url')) {
                $selectColumns[] = 'users.photo_url';
            }
            
            $selectColumns[] = 'groups.name as group_name';
            $selectColumns[] = 'groups.id as group_id';
            
            $clients = DB::table('group_members')
                ->join('users', 'group_members.user_id', '=', 'users.id')
                ->join('groups', 'group_members.group_id', '=', 'groups.id')
                ->whereIn('group_members.group_id', $groupIds)
                ->where('group_members.role', 'admin')
                ->where('group_members.user_id', '!=', $user->id)
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
                            ->select('users.id', 'users.name')
                            ->first();
                        
                        if ($patientMember) {
                            $patient = [
                                'id' => $patientMember->id,
                                'name' => $patientMember->name,
                            ];
                        }
                    } catch (\Exception $e) {
                        Log::warning('Erro ao buscar paciente do grupo: ' . $e->getMessage());
                    }
                    
                    // Verificar se a tabela reviews existe antes de buscar avaliações
                    $rating = 0;
                    $reviewsCount = 0;
                    
                    if (Schema::hasTable('reviews')) {
                        try {
                            $rating = DB::table('reviews')
                                ->where('reviewed_user_id', $client->id)
                                ->avg('rating');
                            
                            $reviewsCount = DB::table('reviews')
                                ->where('reviewed_user_id', $client->id)
                                ->count();
                        } catch (\Exception $e) {
                            Log::warning('Erro ao buscar avaliações do cliente: ' . $e->getMessage());
                        }
                    }

                    return [
                        'id' => $client->id,
                        'name' => $client->name,
                        'email' => $client->email,
                        'phone' => $client->phone ?? null,
                        'city' => $client->city ?? null,
                        'neighborhood' => $client->neighborhood ?? null,
                        'photo_url' => $client->photo_url ?? null,
                        'photo' => $client->photo_url ?? null,
                        'group_name' => $client->group_name,
                        'group_id' => $client->group_id,
                        'patient' => $patient, // Adicionar informação do paciente
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
            Log::error('Erro em getClients: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'user_id' => Auth::id(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erro ao buscar clientes',
                'errors' => []
            ], 500);
        }
    }

    /**
     * Criar avaliação de um cliente
     */
    /**
     * Criar avaliação de um cliente
     */
    public function createClientReview(Request $request, $id)
    {
        try {
            $user = $request->user();
            
            $validated = $request->validate([
                "rating" => "required|integer|min:1|max:5",
                "comment" => "required|string|min:10|max:500",
            ]);
            
            $client = User::find($id);
            if (!$client) {
                return response()->json([
                    "success" => false,
                    "message" => "Cliente não encontrado",
                ], 404);
            }
            
            // Verificar se o usuário é médico
            $isDoctor = $user->profile === 'doctor';
            $groupId = null;
            
            if ($isDoctor) {
                // Para médicos: verificar se há consultas com o paciente
                $hasAppointments = DB::table('appointments')
                    ->where('doctor_id', $user->id)
                    ->whereNotNull('group_id')
                    ->whereIn('group_id', function($query) use ($id) {
                        $query->select('group_id')
                            ->from('group_members')
                            ->where('user_id', $id)
                            ->where('role', 'patient');
                    })
                    ->exists();
                
                if (!$hasAppointments) {
                    return response()->json([
                        "success" => false,
                        "message" => "Você não tem permissão para avaliar este cliente. É necessário ter consultas agendadas com este paciente.",
                    ], 403);
                }
                
                // Buscar o group_id da primeira consulta encontrada
                $appointment = DB::table('appointments')
                    ->where('doctor_id', $user->id)
                    ->whereNotNull('group_id')
                    ->whereIn('group_id', function($query) use ($id) {
                        $query->select('group_id')
                            ->from('group_members')
                            ->where('user_id', $id)
                            ->where('role', 'patient');
                    })
                    ->first();
                
                $groupId = $appointment->group_id ?? null;
            } else {
                // Para cuidadores: verificar se estão no mesmo grupo
                $userGroups = $user->groups()->pluck("groups.id")->toArray();
                $clientGroups = $client->groups()->pluck("groups.id")->toArray();
                $commonGroups = array_intersect($userGroups, $clientGroups);
                
                if (empty($commonGroups)) {
                    return response()->json([
                        "success" => false,
                        "message" => "Você não tem permissão para avaliar este cliente",
                    ], 403);
                }
                
                $groupId = $commonGroups[0];
            }
            
            if (!$groupId) {
                return response()->json([
                    "success" => false,
                    "message" => "Não foi possível determinar o grupo para a avaliação",
                ], 500);
            }
            
            // Verificar se já existe uma avaliação deste cuidador/médico para este cliente
            $existingReview = CaregiverReview::where("caregiver_id", $user->id)
                ->where("author_id", $client->id)
                ->where("group_id", $groupId)
                ->first();
            
            if ($existingReview) {
                $existingReview->update([
                    "rating" => $validated["rating"],
                    "comment" => $validated["comment"],
                ]);
                
                return response()->json([
                    "success" => true,
                    "message" => "Avaliação atualizada com sucesso",
                    "review" => $existingReview->load(["caregiver", "author"]),
                ]);
            }
            
            // Criar nova avaliação
            $review = CaregiverReview::create([
                "caregiver_id" => $user->id,
                "author_id" => $client->id,
                "group_id" => $groupId,
                "rating" => $validated["rating"],
                "comment" => $validated["comment"],
            ]);
            
            return response()->json([
                "success" => true,
                "message" => "Avaliação criada com sucesso",
                "review" => $review->load(["caregiver", "author"]),
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                "success" => false,
                "message" => "Dados inválidos",
                "errors" => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            \Log::error("Erro ao criar avaliação de cliente", [
                "error" => $e->getMessage(),
                "trace" => $e->getTraceAsString(),
            ]);
            
            return response()->json([
                "success" => false,
                "message" => "Server Error",
            ], 500);
        }
    }

    /**
     * Obter detalhes de um cliente/paciente específico
     * 
     * GET /api/caregivers/clients/{id}
     */
    public function getClientDetails($id)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuário não autenticado'
                ], 401);
            }

            // Verificar se o usuário é médico
            $isDoctor = $user->profile === 'doctor';

            if ($isDoctor) {
                // Para médicos: buscar paciente que agendou consultas
                $patient = DB::table('users')
                    ->where('id', $id)
                    ->select(
                        'id',
                        'name',
                        'email',
                        'phone',
                        'birth_date',
                        'gender',
                        'city',
                        'neighborhood',
                        'photo'
                    )
                    ->first();

                if (!$patient) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Paciente não encontrado'
                    ], 404);
                }

                // Verificar se o paciente tem consultas com este médico
                $hasAppointments = DB::table('appointments')
                    ->where('doctor_id', $user->id)
                    ->whereNotNull('group_id')
                    ->whereIn('group_id', function($query) use ($id) {
                        $query->select('group_id')
                            ->from('group_members')
                            ->where('user_id', $id)
                            ->where('role', 'patient');
                    })
                    ->exists();

                if (!$hasAppointments) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Paciente não encontrado ou sem consultas com este médico'
                    ], 404);
                }

                // Buscar última consulta
                $lastAppointment = DB::table('appointments')
                    ->where('doctor_id', $user->id)
                    ->whereNotNull('group_id')
                    ->whereIn('group_id', function($query) use ($id) {
                        $query->select('group_id')
                            ->from('group_members')
                            ->where('user_id', $id)
                            ->where('role', 'patient');
                    })
                    ->orderBy('scheduled_at', 'desc')
                    ->select('scheduled_at', 'title', 'type')
                    ->first();

                // Calcular idade
                $age = null;
                if ($patient->birth_date) {
                    $birthDate = new \DateTime($patient->birth_date);
                    $today = new \DateTime();
                    $age = $today->diff($birthDate)->y;
                }

                $patientData = [
                    'id' => $patient->id,
                    'name' => $patient->name,
                    'email' => $patient->email,
                    'phone' => $patient->phone,
                    'age' => $age,
                    'gender' => $patient->gender === 'male' ? 'Masculino' : ($patient->gender === 'female' ? 'Feminino' : ($patient->gender ?? 'Não informado')),
                    'city' => $patient->city,
                    'neighborhood' => $patient->neighborhood,
                    'photo_url' => $patient->photo ? asset('storage/' . $patient->photo) : null,
                    'photo' => $patient->photo ? asset('storage/' . $patient->photo) : null,
                    'last_appointment_date' => $lastAppointment->scheduled_at ?? $lastAppointment->appointment_date ?? null,
                    'last_appointment_title' => $lastAppointment->title ?? null,
                    'reviews' => [],
                ];

                return response()->json([
                    'success' => true,
                    'data' => $patientData
                ]);
            }

            // Para cuidadores: buscar admin do grupo
            $client = DB::table('users')
                ->join('group_members', 'users.id', '=', 'group_members.user_id')
                ->join('groups', 'group_members.group_id', '=', 'groups.id')
                ->where('users.id', $id)
                ->where('group_members.role', 'admin')
                ->whereIn('group_members.group_id', function($query) use ($user) {
                    $query->select('group_id')
                        ->from('group_members')
                        ->where('user_id', $user->id);
                })
                ->select(
                    'users.id',
                    'users.name',
                    'users.email',
                    'users.phone',
                    'users.city',
                    'users.neighborhood',
                    'users.photo',
                    'groups.name as group_name',
                    'groups.id as group_id'
                )
                ->first();

            if (!$client) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cliente não encontrado'
                ], 404);
            }

            // Buscar reviews (se a tabela existir)
            $reviews = collect([]);
            $rating = 0;
            
            try {
                if (DB::getSchemaBuilder()->hasTable('reviews')) {
                    $reviews = DB::table('reviews')
                        ->where('reviewed_user_id', $id)
                        ->select('id', 'rating', 'comment', 'created_at')
                        ->orderBy('created_at', 'desc')
                        ->get();

                    $ratingResult = DB::table('reviews')
                        ->where('reviewed_user_id', $id)
                        ->avg('rating');
                    
                    $rating = $ratingResult ? round($ratingResult, 1) : 0;
                }
            } catch (\Exception $e) {
                // Se a tabela reviews não existir ou houver erro, usar valores padrão
                \Log::warning('Erro ao buscar reviews em getClientDetails: ' . $e->getMessage());
                $reviews = collect([]);
                $rating = 0;
            }

            $clientData = [
                'id' => $client->id,
                'name' => $client->name,
                'email' => $client->email,
                'phone' => $client->phone,
                'city' => $client->city,
                'neighborhood' => $client->neighborhood,
                'photo_url' => $client->photo ? asset('storage/' . $client->photo) : null,
                'photo' => $client->photo ? asset('storage/' . $client->photo) : null,
                'group_name' => $client->group_name,
                'group_id' => $client->group_id,
                'rating' => $rating ? round($rating, 1) : 0,
                'reviews_count' => $reviews->count(),
                'reviews' => $reviews,
            ];

            return response()->json([
                'success' => true,
                'data' => $clientData
            ]);

        } catch (\Exception $e) {
            Log::error('Erro em getClientDetails: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'user_id' => Auth::id(),
                'client_id' => $id,
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erro ao buscar detalhes do cliente',
                'errors' => []
            ], 500);
        }
    }
}

