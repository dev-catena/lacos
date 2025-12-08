<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\CaregiverReview;
use App\Models\Group;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CaregiverController extends Controller
{
    /**
     * Listar cuidadores profissionais e médicos
     */
    public function index(Request $request)
    {
        try {
            $query = User::whereIn('profile', ['professional_caregiver', 'doctor'])
                ->with(['caregiverCourses', 'caregiverReviews']);

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
                ->with(['caregiverCourses', 'caregiverReviews'])
                ->find($id);

            if (!$caregiver) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cuidador não encontrado',
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
                    'reviews' => $caregiver->caregiverReviews,
                    'profile' => $caregiver->profile,
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
     * Criar avaliação de um cuidador profissional ou médico
     */
    public function createReview(Request $request, $id)
    {
        try {
            $user = $request->user();
            
            // Validar dados
            $validated = $request->validate([
                'rating' => 'required|integer|min:1|max:5',
                'comment' => 'required|string|min:10|max:500',
            ]);
            
            // Buscar cuidador
            $caregiver = User::whereIn('profile', ['professional_caregiver', 'doctor'])->find($id);
            if (!$caregiver) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cuidador não encontrado',
                ], 404);
            }
            
            // Verificar se o usuário e o cuidador estão no mesmo grupo
            $userGroups = $user->groups()->pluck('groups.id')->toArray();
            $caregiverGroups = $caregiver->groups()->pluck('groups.id')->toArray();
            $commonGroups = array_intersect($userGroups, $caregiverGroups);
            
            if (empty($commonGroups)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Você não tem permissão para avaliar este cuidador',
                ], 403);
            }
            
            $groupId = $commonGroups[0]; // Usar o primeiro grupo em comum
            
            // Verificar se já existe uma avaliação deste usuário para este cuidador
            $existingReview = CaregiverReview::where('caregiver_id', $caregiver->id)
                ->where('author_id', $user->id)
                ->where('group_id', $groupId)
                ->first();
            
            if ($existingReview) {
                // Atualizar avaliação existente
                $existingReview->update([
                    'rating' => $validated['rating'],
                    'comment' => $validated['comment'],
                ]);
                
                return response()->json([
                    'success' => true,
                    'message' => 'Avaliação atualizada com sucesso',
                    'review' => $existingReview->load(['caregiver', 'author']),
                ]);
            }
            
            // Criar nova avaliação
            $review = CaregiverReview::create([
                'caregiver_id' => $caregiver->id,
                'author_id' => $user->id,
                'group_id' => $groupId,
                'rating' => $validated['rating'],
                'comment' => $validated['comment'],
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Avaliação criada com sucesso',
                'review' => $review->load(['caregiver', 'author']),
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Dados inválidos',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao criar avaliação: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Listar clientes do cuidador profissional ou médico
     */
    public function getClients(Request $request)
    {
        try {
            $user = $request->user();

            // Verificar se é cuidador profissional ou médico (usando campo profile)
            if ($user->profile !== 'professional_caregiver' && $user->profile !== 'doctor') {
                // Tentar verificar novamente no banco
                $user = User::find($user->id);
                if (!$user || ($user->profile !== 'professional_caregiver' && $user->profile !== 'doctor')) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Acesso negado. Você não é um cuidador profissional ou médico.',
                    ], 403);
                }
            }

            // Buscar grupos do cuidador usando a tabela group_members
            $caregiverGroups = DB::table('group_members')
                ->where('user_id', $user->id)
                ->pluck('group_id')
                ->toArray();

            if (empty($caregiverGroups)) {
                return response()->json([
                    'success' => true,
                    'data' => [],
                ]);
            }

            // Buscar IDs de usuários que são cuidadores profissionais ou médicos para excluir
            $professionalCaregiverIds = User::whereIn('profile', ['professional_caregiver', 'doctor'])
                ->pluck('id')
                ->toArray();

            // Buscar clientes que estão nos mesmos grupos (excluindo o próprio cuidador e outros cuidadores profissionais/médicos)
            $clientIds = DB::table('group_members')
                ->whereIn('group_id', $caregiverGroups)
                ->where('user_id', '!=', $user->id)
                ->whereNotIn('user_id', $professionalCaregiverIds)
                ->distinct()
                ->pluck('user_id')
                ->toArray();

            if (empty($clientIds)) {
                return response()->json([
                    'success' => true,
                    'data' => [],
                ]);
            }

            // Buscar clientes com suas avaliações
            $clients = User::whereIn('id', $clientIds)
                ->with(['caregiverReviews' => function ($query) use ($user) {
                    $query->where('caregiver_id', $user->id);
                }])
                ->get()
                ->map(function ($client) use ($user) {
                    $avgRating = $client->caregiverReviews->avg('rating');
                    
                    // Garantir que o accessor photo_url seja chamado
                    $photoUrl = $client->getAttribute('photo_url');
                    
                    // Se o accessor não retornou nada, tentar construir manualmente
                    if (!$photoUrl && $client->photo) {
                        $photoUrl = asset('storage/' . $client->photo);
                    }

                    return [
                        'id' => $client->id,
                        'name' => $client->name,
                        'photo' => $photoUrl,
                        'photo_url' => $photoUrl,
                        'city' => $client->city,
                        'neighborhood' => $client->neighborhood,
                        'average_rating' => $avgRating ? round($avgRating, 1) : null,
                        'total_reviews' => $client->caregiverReviews->count(),
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $clients,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao listar clientes: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Mostrar detalhes de um cliente
     */
    public function getClientDetails(Request $request, $id)
    {
        try {
            $user = $request->user();

            // Verificar se é cuidador profissional ou médico (usando campo profile)
            if ($user->profile !== 'professional_caregiver' && $user->profile !== 'doctor') {
                // Tentar verificar novamente no banco
                $user = User::find($user->id);
                if (!$user || ($user->profile !== 'professional_caregiver' && $user->profile !== 'doctor')) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Acesso negado. Você não é um cuidador profissional ou médico.',
                    ], 403);
                }
            }

            // Buscar cliente
            $client = User::find($id);
            if (!$client) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cliente não encontrado',
                ], 404);
            }

            // Verificar se estão no mesmo grupo
            $userGroups = $user->groups()->pluck('groups.id')->toArray();
            $clientGroups = $client->groups()->pluck('groups.id')->toArray();
            $commonGroups = array_intersect($userGroups, $clientGroups);

            if (empty($commonGroups)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Você não tem acesso a este cliente',
                ], 403);
            }

            // Buscar avaliações do cuidador sobre este cliente
            $reviews = CaregiverReview::where('caregiver_id', $user->id)
                ->where('author_id', $client->id)
                ->with('group')
                ->get()
                ->map(function ($review) {
                    return [
                        'id' => $review->id,
                        'rating' => $review->rating,
                        'comment' => $review->comment,
                        'group' => [
                            'id' => $review->group->id,
                            'name' => $review->group->name,
                        ],
                        'created_at' => $review->created_at->format('Y-m-d H:i:s'),
                    ];
                });

            $avgRating = $reviews->avg('rating');
            
            // Garantir que o accessor photo_url seja chamado
            $photoUrl = $client->getAttribute('photo_url');
            
            // Se o accessor não retornou nada, tentar construir manualmente
            if (!$photoUrl && $client->photo) {
                $photoUrl = asset('storage/' . $client->photo);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $client->id,
                    'name' => $client->name,
                    'photo' => $photoUrl,
                    'photo_url' => $photoUrl,
                    'city' => $client->city,
                    'neighborhood' => $client->neighborhood,
                    'average_rating' => $avgRating ? round($avgRating, 1) : null,
                    'total_reviews' => $reviews->count(),
                    'reviews' => $reviews,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao buscar cliente: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Criar avaliação de um cliente
     */
    public function createClientReview(Request $request, $id)
    {
        try {
            $user = $request->user();
            
            // Validar dados
            $validated = $request->validate([
                'rating' => 'required|integer|min:1|max:5',
                'comment' => 'required|string|min:10|max:500',
            ]);
            
            // Buscar cliente
            $client = User::find($id);
            if (!$client) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cliente não encontrado',
                ], 404);
            }
            
            // Verificar se o usuário e o cliente estão no mesmo grupo
            $userGroups = $user->groups()->pluck('groups.id')->toArray();
            $clientGroups = $client->groups()->pluck('groups.id')->toArray();
            $commonGroups = array_intersect($userGroups, $clientGroups);
            
            if (empty($commonGroups)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Você não tem permissão para avaliar este cliente',
                ], 403);
            }
            
            $groupId = $commonGroups[0]; // Usar o primeiro grupo em comum
            
            // Verificar se já existe uma avaliação deste cuidador para este cliente
            $existingReview = CaregiverReview::where('caregiver_id', $user->id)
                ->where('author_id', $client->id)
                ->where('group_id', $groupId)
                ->first();
            
            if ($existingReview) {
                // Atualizar avaliação existente
                $existingReview->update([
                    'rating' => $validated['rating'],
                    'comment' => $validated['comment'],
                ]);
                
                return response()->json([
                    'success' => true,
                    'message' => 'Avaliação atualizada com sucesso',
                    'review' => $existingReview->load(['caregiver', 'author']),
                ]);
            }
            
            // Criar nova avaliação
            $review = CaregiverReview::create([
                'caregiver_id' => $user->id,
                'author_id' => $client->id,
                'group_id' => $groupId,
                'rating' => $validated['rating'],
                'comment' => $validated['comment'],
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Avaliação criada com sucesso',
                'review' => $review->load(['caregiver', 'author']),
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Dados inválidos',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao criar avaliação: ' . $e->getMessage(),
            ], 500);
        }
    }
}

