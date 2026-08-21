<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\VitalSign;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class VitalSignController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        try {
            $groupId = $request->query('group_id');
            $type = $request->query('type');
            $startDate = $request->query('start_date');
            $endDate = $request->query('end_date');

            $query = VitalSign::query();

            if ($groupId) {
                $query->where('group_id', $groupId);
            }

            if ($type) {
                $query->where('type', $type);
            }

            if ($startDate) {
                $query->where('measured_at', '>=', $startDate);
            }

            if ($endDate) {
                $query->where('measured_at', '<=', $endDate);
            }

            $vitalSigns = $query->orderBy('measured_at', 'desc')->get();

            if ($vitalSigns->isNotEmpty()) {
                try {
                    $vitalSigns->load('recorder');
                } catch (\Throwable $e) {
                    \Log::warning('VitalSignController::index - Falha ao carregar recorder: '.$e->getMessage());
                }
            }

            $vitalSignsArray = $vitalSigns->map(function ($vitalSign) {
                $data = $vitalSign->toArray();

                if ($vitalSign->relationLoaded('recorder') && $vitalSign->recorder) {
                    $data['measured_by_name'] = $vitalSign->recorder->name;
                }

                if ($vitalSign->notes) {
                    $notesLower = strtolower($vitalSign->notes);
                    if (strpos($notesLower, 'wearable') !== false) {
                        preg_match('/wearable[:\s]+([^\n]+)/i', $vitalSign->notes, $matches);
                        if (! empty($matches[1])) {
                            $data['wearable_name'] = trim($matches[1]);
                        }
                    }
                }

                return $data;
            });

            return response()->json($vitalSignsArray);
        } catch (\Throwable $e) {
            \Log::error('VitalSignController::index - Erro: '.$e->getMessage(), [
                'group_id' => $request->query('group_id'),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erro ao carregar sinais vitais',
                'data' => [],
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            \Log::info('VitalSignController::store - Dados recebidos:', $request->all());
            
            $validated = $request->validate([
                'group_id' => 'required|exists:groups,id',
                'type' => 'required|string',
                'value' => 'required',
                'unit' => 'nullable|string',
                'measured_at' => 'nullable|date',
                'notes' => 'nullable|string',
            ]);

            $user = Auth::user();
            
            \Log::info('VitalSignController::store - Dados validados:', $validated);
            \Log::info('VitalSignController::store - User ID:', ['user_id' => $user->id]);
            
            // O campo value é JSON no banco, pode ser objeto, array ou número
            $valueToStore = $validated['value'];
            
            // Se for objeto (vindo do JSON do frontend), manter como objeto (ex: pressão arterial)
            if (is_object($valueToStore)) {
                $valueToStore = (array) $valueToStore;
            }
            // Se for string, tentar fazer decode JSON primeiro
            elseif (is_string($valueToStore)) {
                $decoded = json_decode($valueToStore, true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    $valueToStore = $decoded;
                } else {
                    // Se não for JSON válido, converter para array com um elemento
                    $valueToStore = [$valueToStore];
                }
            }
            // Se for número, manter como número (será salvo como JSON)
            // Se for array, manter como array
            // Qualquer outro tipo, manter como está
            
            \Log::info('VitalSignController::store - Value a ser salvo:', ['value' => $valueToStore, 'type' => gettype($valueToStore)]);
            
            // Determinar accompanied_person_id (mesma lógica do PrescriptionController)
            $accompaniedPersonId = null;
            $patientMember = DB::table('group_members')
                ->where('group_id', $validated['group_id'])
                ->whereIn('role', ['priority_contact', 'patient'])
                ->first();
            
            if ($patientMember) {
                $accompaniedPerson = DB::table('accompanied_people')
                    ->where('group_id', $validated['group_id'])
                    ->where('user_id', $patientMember->user_id)
                    ->first();
                
                if ($accompaniedPerson) {
                    $accompaniedPersonId = $accompaniedPerson->id;
                } else {
                    $firstAccompanied = DB::table('accompanied_people')
                        ->where('group_id', $validated['group_id'])
                        ->first();
                    if ($firstAccompanied) {
                        $accompaniedPersonId = $firstAccompanied->id;
                    }
                }
            }

            if (!$accompaniedPersonId) {
                $firstAccompanied = DB::table('accompanied_people')
                    ->where('group_id', $validated['group_id'])
                    ->first();
                if ($firstAccompanied) {
                    $accompaniedPersonId = $firstAccompanied->id;
                }
            }

            if (!$accompaniedPersonId) {
                \Log::warning('VitalSignController::store - Não foi possível determinar accompanied_person_id, salvando com NULL', [
                    'group_id' => $validated['group_id'],
                ]);
                // Para sinais vitais, accompanied_person_id pode ser null
            }
            
            \Log::info('VitalSignController::store - Criando sinal vital:', [
                'accompanied_person_id' => $accompaniedPersonId,
                'group_id' => $validated['group_id'],
            ]);
            
            $vitalSign = VitalSign::create([
                'group_id' => $validated['group_id'],
                'accompanied_person_id' => $accompaniedPersonId, // Pode ser null
                'type' => $validated['type'],
                'value' => $valueToStore,
                'unit' => $validated['unit'] ?? null,
                'measured_at' => $validated['measured_at'] ?? now(),
                'notes' => $validated['notes'] ?? null,
                'recorded_by' => $user->id,
            ]);

            \Log::info('VitalSignController::store - Sinal vital criado com sucesso:', ['id' => $vitalSign->id]);
            
            // Registrar atividade de registro de sinal vital (agrupando múltiplos sinais salvos em um período curto)
            if (class_exists('App\Models\GroupActivity')) {
                try {
                    // Verificar se há uma atividade de sinal vital criada recentemente (últimos 5 segundos) pelo mesmo usuário no mesmo grupo
                    $recentActivity = \App\Models\GroupActivity::where('group_id', $validated['group_id'])
                        ->where('user_id', $user->id)
                        ->where('action_type', 'vital_sign_recorded')
                        ->where('created_at', '>=', now()->subSeconds(5))
                        ->orderBy('created_at', 'desc')
                        ->first();
                    
                    if ($recentActivity) {
                        // Atualizar atividade existente para incluir este novo sinal vital
                        $metadata = $recentActivity->metadata ?? [];
                        $vitalSignTypes = $metadata['vital_sign_types'] ?? [];
                        $vitalSignIds = $metadata['vital_sign_ids'] ?? [];
                        
                        // Adicionar novo tipo se ainda não estiver na lista
                        if (!in_array($validated['type'], $vitalSignTypes)) {
                            $vitalSignTypes[] = $validated['type'];
                        }
                        $vitalSignIds[] = $vitalSign->id;
                        
                        $typeLabels = [
                            'blood_pressure' => 'pressão arterial',
                            'heart_rate' => 'frequência cardíaca',
                            'oxygen_saturation' => 'saturação de oxigênio',
                            'blood_glucose' => 'glicemia',
                            'temperature' => 'temperatura',
                            'respiratory_rate' => 'frequência respiratória',
                        ];
                        
                        $typeLabelsList = array_map(function($type) use ($typeLabels) {
                            return $typeLabels[$type] ?? $type;
                        }, $vitalSignTypes);
                        
                        $description = count($vitalSignTypes) > 1 
                            ? "{$user->name} registrou " . implode(', ', array_slice($typeLabelsList, 0, -1)) . " e " . end($typeLabelsList)
                            : "{$user->name} registrou " . ($typeLabels[$validated['type']] ?? $validated['type']);
                        
                        $recentActivity->update([
                            'description' => $description,
                            'metadata' => array_merge($metadata, [
                                'vital_sign_types' => $vitalSignTypes,
                                'vital_sign_ids' => $vitalSignIds,
                            ]),
                        ]);
                    } else {
                        // Criar nova atividade
                        \App\Models\GroupActivity::logVitalSignRecorded(
                            $validated['group_id'],
                            $user->id,
                            $user->name,
                            $validated['type'],
                            $vitalSign->id
                        );
                    }
                } catch (\Exception $e) {
                    \Log::warning("Erro ao registrar atividade de sinal vital: " . $e->getMessage());
                }
            }
            
            // Alerta basal ≥50%: demais membros do grupo (não o acompanhado)
            try {
                app(\App\Services\VitalSignBasalService::class)
                    ->notifyGroupIfBasalExceeded($vitalSign);
            } catch (\Exception $e) {
                \Log::warning('VitalSignController::store - Erro no alerta basal', [
                    'vital_sign_id' => $vitalSign->id,
                    'error' => $e->getMessage(),
                ]);
            }

            // Notificação de "novo registro" só para medição manual (evita spam do auto 5min)
            $notes = (string) ($validated['notes'] ?? '');
            $isAutoWearable = str_contains($notes, 'auto:5min') || str_contains($notes, 'wearable:');

            if (! $isAutoWearable) {
                try {
                    $notificationService = app(\App\Services\NotificationService::class);
                    $group = \App\Models\Group::find($validated['group_id']);

                    if ($group) {
                        $members = $group->members()->where('user_id', '!=', $user->id)->get();

                        $typeLabels = [
                            'blood_pressure' => 'pressão arterial',
                            'heart_rate' => 'frequência cardíaca',
                            'oxygen_saturation' => 'saturação de oxigênio',
                            'blood_glucose' => 'glicemia',
                            'temperature' => 'temperatura',
                            'respiratory_rate' => 'frequência respiratória',
                        ];

                        $typeLabel = $typeLabels[$validated['type']] ?? $validated['type'];

                        foreach ($members as $member) {
                            $memberUser = \App\Models\User::find($member->user_id);

                            if (! $memberUser) {
                                continue;
                            }

                            if (! $notificationService->hasNotificationPreference($memberUser, 'vital_signs_alerts')) {
                                continue;
                            }

                            $title = 'Novo Sinal Vital Registrado';
                            $message = "{$user->name} registrou {$typeLabel}";

                            $valueDisplay = '';
                            if (is_array($vitalSign->value)) {
                                if (isset($vitalSign->value['systolic']) && isset($vitalSign->value['diastolic'])) {
                                    $valueDisplay = $vitalSign->value['systolic'].'/'.$vitalSign->value['diastolic'];
                                } else {
                                    $valueDisplay = is_array($vitalSign->value) ? reset($vitalSign->value) : $vitalSign->value;
                                }
                            } else {
                                $valueDisplay = $vitalSign->value;
                            }

                            if ($valueDisplay) {
                                $message .= ": {$valueDisplay}";
                                if (! empty($validated['unit'])) {
                                    $message .= " {$validated['unit']}";
                                }
                            }

                            $notificationService->sendNotification(
                                $memberUser,
                                'vital_sign',
                                $title,
                                $message,
                                [
                                    'vital_sign_id' => $vitalSign->id,
                                    'group_id' => $validated['group_id'],
                                    'vital_sign_type' => $validated['type'],
                                    'action_type' => 'vital_sign_recorded',
                                ],
                                false,
                                $validated['group_id']
                            );
                        }
                    }
                } catch (\Exception $e) {
                    \Log::error('VitalSignController::store - Erro ao enviar notificações de sinal vital', [
                        'vital_sign_id' => $vitalSign->id,
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString(),
                    ]);
                }
            }
            
            return response()->json($vitalSign, 201);
        } catch (\Exception $e) {
            \Log::error('VitalSignController::store - Erro:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'error' => 'Erro ao salvar sinal vital',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $vitalSign = VitalSign::findOrFail($id);
        return response()->json($vitalSign);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $vitalSign = VitalSign::findOrFail($id);

        $validated = $request->validate([
            'type' => 'sometimes|string',
            'value' => 'sometimes',
            'unit' => 'nullable|string',
            'measured_at' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        $vitalSign->update($validated);

        return response()->json($vitalSign);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $vitalSign = VitalSign::findOrFail($id);
        $vitalSign->delete();

        return response()->json(['message' => 'Vital sign deleted successfully']);
    }
}


