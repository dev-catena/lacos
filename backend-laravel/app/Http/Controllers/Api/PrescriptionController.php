<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use App\Models\Document;
use App\Services\PDFService;
use App\Services\DigitalSignatureService;

class PrescriptionController extends Controller
{
    protected $pdfService;
    protected $signatureService;

    public function __construct()
    {
        // Tentar injetar serviços opcionalmente (para métodos antigos que ainda os usam)
        try {
            if (class_exists(\App\Services\PDFService::class)) {
                $this->pdfService = app(\App\Services\PDFService::class);
            }
            if (class_exists(\App\Services\DigitalSignatureService::class)) {
                $this->signatureService = app(\App\Services\DigitalSignatureService::class);
            }
        } catch (\Exception $e) {
            // Serviços não disponíveis, mas não é crítico para os novos métodos
            Log::warning('PrescriptionController - Serviços PDFService/DigitalSignatureService não disponíveis: ' . $e->getMessage());
        }
    }

    /**
     * Gerar receita médica assinada digitalmente
     * POST /api/prescriptions/generate-signed-recipe
     */
    public function generateSignedRecipe(Request $request)
    {
        try {
            // Validação
            $validator = Validator::make($request->all(), [
                'appointment_id' => 'nullable|exists:appointments,id',
                'group_id' => 'required|exists:groups,id',
                'patient_id' => 'required',
                'doctor_id' => 'required',
                'medication' => 'required|string|max:500',
                'concentration' => 'required|string|max:200',
                'pharmaceutical_form' => 'required|string|max:200',
                'dosage' => 'required|string|max:500',
                'treatment_duration' => 'required|string|max:200',
                'notes' => 'nullable|string|max:2000',
                'patient_name' => 'required|string|max:255',
                'patient_cpf' => 'nullable|string|max:14',
                'patient_birth_date' => 'nullable|date',
                'doctor_name' => 'required|string|max:255',
                'doctor_crm' => 'required|string|max:20',
                'doctor_crm_uf' => 'required|string|max:2',
                'doctor_specialty' => 'nullable|string|max:255',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dados inválidos',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $validated = $validator->validated();
            $user = Auth::user();

            // Verificar acesso ao grupo


            $user = Auth::user();


            $isDoctor = $user->profile === 'doctor';



            if ($isDoctor) {


            // Para médicos: verificar se tem consulta com o grupo/paciente


            $hasAppointment = DB::table('appointments')


            ->where('doctor_id', $user->id)


            ->where('group_id', $validated['group_id'])


            ->exists();



            // Se não tem consulta geral, verificar se tem a consulta específica


            if (!$hasAppointment && ($validated['appointment_id'] ?? null)) {


            $appointment = DB::table('appointments')


            ->where('id', $validated['appointment_id'])


            ->where('doctor_id', $user->id)


            ->where('group_id', $validated['group_id'])


            ->first();



            if (!$appointment) {


            return response()->json([


            'success' => false,


            'message' => 'Você não tem permissão para gerar documentos para esta consulta.',


            ], 403);


            }


            } elseif (!$hasAppointment) {


            return response()->json([


            'success' => false,


            'message' => 'Você não tem consultas agendadas com este paciente/grupo.',


            ], 403);


            }


            } else {


            // Para não-médicos (cuidadores): verificar se pertence ao grupo


            $group = $user->groups()->find($validated['group_id']);


            if (!$group) {


            return response()->json([


            'success' => false,


            'message' => 'Você não tem acesso a este grupo',


            ], 403);


            }


            }

            // Gerar PDF da receita
            $pdfPath = $this->pdfService->generateRecipePDF($validated);

            // Assinar digitalmente
            $signedPdfPath = $this->signatureService->signPDF($pdfPath);

            // Gerar hash para validação - VERIFICAR SE ARQUIVO EXISTE PRIMEIRO


            $fullSignedPath = storage_path('app/' . $signedPdfPath);


            if (!file_exists($fullSignedPath)) {


            Log::error('Arquivo PDF assinado não encontrado: ' . $fullSignedPath);


            throw new \Exception('Erro ao gerar atestado: arquivo PDF não foi criado corretamente. Verifique os logs para mais detalhes.');


            }



            $documentHash = hash_file('sha256', $fullSignedPath);



            // Se hash_file falhar, usar hash do conteúdo


            if ($documentHash === false) {


            Log::error('Erro ao calcular hash do PDF: ' . $fullSignedPath);


            $documentHash = hash('sha256', file_get_contents($fullSignedPath));


            }

            // Salvar no storage público
            $publicPath = 'documents/prescriptions/' . date('Y/m') . '/' . $documentHash . '.pdf';
            Storage::disk('public')->put($publicPath, file_get_contents(storage_path('app/' . $signedPdfPath)));

            // Criar registro no banco de dados
            $document = Document::create([
                'group_id' => $validated['group_id'],
                'user_id' => $user->id,
                'doctor_id' => (\Schema::hasTable('doctors') && \DB::table('doctors')->where('id', $validated['doctor_id'])->exists()) ? $validated['doctor_id'] : null,
                'consultation_id' => $validated['appointment_id'] ?? null,
                'type' => 'prescription',
                'title' => 'Receita Médica Digital - ' . $validated['medication'],
                'document_date' => now()->toDateString(),
                'file_path' => $publicPath,
                'file_name' => 'receita_' . $documentHash . '.pdf',
                'file_type' => 'application/pdf',
                'file_size' => Storage::disk('public')->size($publicPath),
                'notes' => $validated['notes'] ?? null,
            ]);

            // Limpar arquivo temporário
            Storage::delete($signedPdfPath);
            Storage::delete($pdfPath);

            return response()->json([
                'success' => true,
                'message' => 'Receita gerada e assinada com sucesso',
                'data' => [
                    'document_id' => $document->id,
                    'hash' => $documentHash,
                    'validation_url' => url("/api/prescriptions/validate/{$documentHash}"),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Erro ao gerar receita assinada: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Erro ao gerar receita: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Gerar atestado médico assinado digitalmente
     * POST /api/prescriptions/generate-signed-certificate
     */
    public function generateSignedCertificate(Request $request)
    {
        try {
            // Validação
            $validator = Validator::make($request->all(), [
                'appointment_id' => 'nullable|exists:appointments,id',
                'group_id' => 'required|exists:groups,id',
                'patient_id' => 'required',
                'doctor_id' => 'required',
                'type' => 'required|in:medical_leave,medical_certificate,health_statement',
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date',
                'days' => 'nullable|integer',
                'description' => 'required|string|max:2000',
                'notes' => 'nullable|string|max:2000',
                'patient_name' => 'required|string|max:255',
                'patient_cpf' => 'nullable|string|max:14',
                'patient_birth_date' => 'nullable|date',
                'doctor_name' => 'required|string|max:255',
                'doctor_crm' => 'required|string|max:20',
                'doctor_crm_uf' => 'required|string|max:2',
                'doctor_specialty' => 'nullable|string|max:255',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dados inválidos',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $validated = $validator->validated();
            $user = Auth::user();

            // Verificar acesso ao grupo


            $user = Auth::user();


            $isDoctor = $user->profile === 'doctor';



            if ($isDoctor) {


            // Para médicos: verificar se tem consulta com o grupo/paciente


            $hasAppointment = DB::table('appointments')


            ->where('doctor_id', $user->id)


            ->where('group_id', $validated['group_id'])


            ->exists();



            // Se não tem consulta geral, verificar se tem a consulta específica


            if (!$hasAppointment && ($validated['appointment_id'] ?? null)) {


            $appointment = DB::table('appointments')


            ->where('id', $validated['appointment_id'])


            ->where('doctor_id', $user->id)


            ->where('group_id', $validated['group_id'])


            ->first();



            if (!$appointment) {


            return response()->json([


            'success' => false,


            'message' => 'Você não tem permissão para gerar documentos para esta consulta.',


            ], 403);


            }


            } elseif (!$hasAppointment) {


            return response()->json([


            'success' => false,


            'message' => 'Você não tem consultas agendadas com este paciente/grupo.',


            ], 403);


            }


            } else {


            // Para não-médicos (cuidadores): verificar se pertence ao grupo


            $group = $user->groups()->find($validated['group_id']);


            if (!$group) {


            return response()->json([


            'success' => false,


            'message' => 'Você não tem acesso a este grupo',


            ], 403);


            }


            }

            // Gerar PDF do atestado
            $pdfPath = $this->pdfService->generateCertificatePDF($validated);
            
            // Log para debug
            Log::info('PDF gerado', ['pdfPath' => $pdfPath, 'exists' => Storage::exists($pdfPath), 'fullPath' => storage_path('app/' . $pdfPath)]);

            // Assinar digitalmente
            $signedPdfPath = $this->signatureService->signPDF($pdfPath);

            // Gerar hash para validação - VERIFICAR SE ARQUIVO EXISTE PRIMEIRO


            $fullSignedPath = storage_path('app/' . $signedPdfPath);


            if (!file_exists($fullSignedPath)) {


            Log::error('Arquivo PDF assinado não encontrado: ' . $fullSignedPath);


            throw new \Exception('Erro ao gerar atestado: arquivo PDF não foi criado corretamente. Verifique os logs para mais detalhes.');


            }



            $documentHash = hash_file('sha256', $fullSignedPath);



            // Se hash_file falhar, usar hash do conteúdo


            if ($documentHash === false) {


            Log::error('Erro ao calcular hash do PDF: ' . $fullSignedPath);


            $documentHash = hash('sha256', file_get_contents($fullSignedPath));


            }

            // Salvar no storage público
            $publicPath = 'documents/certificates/' . date('Y/m') . '/' . $documentHash . '.pdf';
            Storage::disk('public')->put($publicPath, file_get_contents(storage_path('app/' . $signedPdfPath)));

            // Criar registro no banco de dados
            $typeLabels = [
                'medical_leave' => 'Afastamento Médico',
                'medical_certificate' => 'Atestado Médico',
                'health_statement' => 'Declaração de Saúde',
            ];

            $document = Document::create([
                'group_id' => $validated['group_id'],
                'user_id' => $user->id,
                'doctor_id' => (\Schema::hasTable('doctors') && \DB::table('doctors')->where('id', $validated['doctor_id'])->exists()) ? $validated['doctor_id'] : null,
                'consultation_id' => $validated['appointment_id'] ?? null,
                'type' => 'report',
                'title' => $typeLabels[$validated['type']] . ' - ' . $validated['patient_name'],
                'document_date' => now()->toDateString(),
                'file_path' => $publicPath,
                'file_name' => 'atestado_' . $documentHash . '.pdf',
                'file_type' => 'application/pdf',
                'file_size' => Storage::disk('public')->size($publicPath),
                'notes' => $validated['notes'] ?? null,
            ]);

            // Limpar arquivo temporário
            Storage::delete($signedPdfPath);
            Storage::delete($pdfPath);

            return response()->json([
                'success' => true,
                'message' => 'Atestado gerado e assinado com sucesso',
                'data' => [
                    'document_id' => $document->id,
                    'hash' => $documentHash,
                    'validation_url' => url("/api/prescriptions/validate/{$documentHash}"),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Erro ao gerar atestado assinado: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Erro ao gerar atestado: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Validar documento assinado
     * GET /api/prescriptions/validate/{hash}
     */
    public function validateDocument($hash)
    {
        try {
            // Buscar documento pelo hash (precisa adicionar coluna hash na tabela documents)
            // Por enquanto, buscar pelo nome do arquivo
            $document = Document::where('file_name', 'like', "%{$hash}%")->first();

            if (!$document) {
                return response()->json([
                    'success' => false,
                    'message' => 'Documento não encontrado',
                ], 404);
            }

            // Verificar se arquivo existe
            if (!Storage::disk('public')->exists($document->file_path)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Arquivo não encontrado',
                ], 404);
            }

            // Validar assinatura digital
            $isValid = $this->signatureService->validateSignature(
                Storage::disk('public')->path($document->file_path)
            );

            return response()->json([
                'success' => true,
                'valid' => $isValid,
                'data' => [
                    'document_id' => $document->id,
                    'title' => $document->title,
                    'document_date' => $document->document_date,
                    'doctor_name' => $document->doctor->name ?? 'Não informado',
                    'signed_at' => $document->created_at,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Erro ao validar documento: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erro ao validar documento: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Listar receitas de um grupo
     * GET /api/prescriptions?group_id={groupId}
     */
    public function index(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['success' => false, 'message' => 'Usuário não autenticado'], 401);
            }

            $groupId = $request->input('group_id');
            if (!$groupId) {
                return response()->json(['success' => false, 'message' => 'group_id é obrigatório'], 422);
            }

            // Verificar acesso ao grupo
            $hasAccess = DB::table('group_members')
                ->where('user_id', $user->id)
                ->where('group_id', $groupId)
                ->exists();

            if (!$hasAccess) {
                return response()->json(['success' => false, 'message' => 'Você não tem acesso a este grupo'], 403);
            }

            $prescriptions = \App\Models\Prescription::where('group_id', $groupId)
                ->with(['medications' => function($query) {
                    $query->where('is_active', true);
                }])
                ->orderBy('prescription_date', 'desc')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function($prescription) {
                    $doctor = $prescription->doctor;
                    return [
                        'id' => $prescription->id,
                        'group_id' => $prescription->group_id,
                        'doctor_id' => $prescription->doctor_id,
                        'doctor_name' => $prescription->doctor_name ?? $doctor->name ?? 'Médico não informado',
                        'doctor_specialty' => $prescription->doctor_specialty ?? $doctor->specialty ?? null,
                        'doctor_crm' => $prescription->doctor_crm ?? $doctor->crm ?? null,
                        'prescription_date' => $prescription->prescription_date->format('Y-m-d'),
                        'notes' => $prescription->notes,
                        'medication_count' => $prescription->medications->count(),
                        'medications' => $prescription->medications->map(function($med) {
                            return [
                                'id' => $med->id,
                                'name' => $med->name,
                                'dosage' => $med->dosage,
                                'is_active' => $med->is_active,
                            ];
                        }),
                        'created_at' => $prescription->created_at->format('Y-m-d H:i:s'),
                    ];
                });

            return response()->json(['success' => true, 'data' => $prescriptions]);
        } catch (\Exception $e) {
            Log::error('Erro ao listar receitas: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Erro ao listar receitas'], 500);
        }
    }

    /**
     * Mostrar detalhes de uma receita
     * GET /api/prescriptions/{id}
     */
    public function show($id)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['success' => false, 'message' => 'Usuário não autenticado'], 401);
            }

            $prescription = \App\Models\Prescription::with('medications')->find($id);
            if (!$prescription) {
                return response()->json(['success' => false, 'message' => 'Receita não encontrada'], 404);
            }

            // Verificar acesso ao grupo
            $hasAccess = DB::table('group_members')
                ->where('user_id', $user->id)
                ->where('group_id', $prescription->group_id)
                ->exists();

            if (!$hasAccess) {
                return response()->json(['success' => false, 'message' => 'Você não tem acesso a esta receita'], 403);
            }

            // Tentar obter dados do médico via relacionamento, mas usar dados salvos como fallback
            $doctor = $prescription->doctor;
            
            // Construir URL completa da imagem se existir
            $imageUrl = null;
            if ($prescription->image_url) {
                if (filter_var($prescription->image_url, FILTER_VALIDATE_URL)) {
                    // Já é uma URL completa
                    $imageUrl = $prescription->image_url;
                } else {
                    // Se for um caminho relativo, construir URL completa
                    // Verificar se começa com /storage/ ou se precisa adicionar
                    if (strpos($prescription->image_url, 'storage/') === 0) {
                        $imageUrl = url($prescription->image_url);
                    } else {
                        $imageUrl = url('storage/' . $prescription->image_url);
                    }
                }
            }
            
            // Usar dados do relacionamento se disponível, senão usar dados salvos diretamente
            $doctorName = $prescription->doctor_name;
            $doctorSpecialty = $prescription->doctor_specialty;
            $doctorCrm = $prescription->doctor_crm;
            
            if ($doctor) {
                // Se o relacionamento retornou dados, usar eles (podem ser mais atualizados)
                $doctorName = $doctorName ?: $doctor->name;
                $doctorSpecialty = $doctorSpecialty ?: $doctor->specialty;
                $doctorCrm = $doctorCrm ?: $doctor->crm;
            }
            
            // Garantir que doctor_id seja sempre retornado, mesmo se for null
            $doctorId = $prescription->doctor_id;
            
            Log::info('PrescriptionController.show - Dados da receita:', [
                'prescription_id' => $prescription->id,
                'doctor_id' => $doctorId,
                'doctor_id_type' => gettype($doctorId),
                'doctor_name' => $doctorName,
                'doctor_specialty' => $doctorSpecialty,
                'doctor_crm' => $doctorCrm,
                'image_url' => $imageUrl,
                'image_url_raw' => $prescription->image_url,
                'has_doctor_relation' => $doctor !== null,
            ]);
            
            $prescriptionData = [
                'id' => $prescription->id,
                'group_id' => $prescription->group_id,
                'doctor_id' => $doctorId, // Sempre incluir, mesmo se for null
                'doctor_name' => $doctorName ?: null, // Retornar null em vez de string vazia
                'doctor_specialty' => $doctorSpecialty,
                'doctor_crm' => $doctorCrm,
                'prescription_date' => $prescription->prescription_date->format('Y-m-d'),
                'notes' => $prescription->notes,
                'image_url' => $imageUrl, // Pode ser null se não houver imagem
                'medications' => $prescription->medications->map(function($med) {
                    $frequency = is_string($med->frequency) ? json_decode($med->frequency, true) : $med->frequency;
                    $mapped = [
                        'id' => $med->id,
                        'name' => $med->name,
                        'pharmaceutical_form' => $med->pharmaceutical_form,
                        'dosage' => $med->dosage,
                        'unit' => $med->unit,
                        'administration_route' => $med->administration_route,
                        'dose_quantity' => $med->dose_quantity,
                        'dose_quantity_unit' => $med->dose_quantity_unit,
                        'frequency' => $frequency,
                        'time' => $med->time,
                        'start_date' => $med->start_date ? $med->start_date->format('Y-m-d') : null,
                        'end_date' => $med->end_date ? $med->end_date->format('Y-m-d') : null,
                        'instructions' => $med->instructions,
                        'notes' => $med->notes,
                        'is_active' => $med->is_active,
                    ];
                    Log::info('PrescriptionController.show - Medicamento mapeado:', [
                        'medication_id' => $med->id,
                        'name' => $med->name,
                        'has_pharmaceutical_form' => !empty($med->pharmaceutical_form),
                        'has_dosage' => !empty($med->dosage),
                    ]);
                    return $mapped;
                }),
                'created_at' => $prescription->created_at->format('Y-m-d H:i:s'),
            ];

            return response()->json(['success' => true, 'data' => $prescriptionData]);
        } catch (\Exception $e) {
            Log::error('Erro ao buscar receita: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Erro ao buscar receita'], 500);
        }
    }

    /**
     * Criar nova receita com medicamentos
     * POST /api/prescriptions
     */
    public function store(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['success' => false, 'message' => 'Usuário não autenticado'], 401);
            }

            $validated = $request->validate([
                'group_id' => 'required|exists:groups,id',
                'doctor_id' => 'nullable|integer',
                'doctor_name' => 'nullable|string|max:255',
                'doctor_specialty' => 'nullable|string|max:255',
                'doctor_crm' => 'nullable|string|max:20',
                'prescription_date' => 'required|date',
                'notes' => 'nullable|string',
                'image_url' => 'nullable|string|max:500',
                'medications' => 'required|array|min:1',
                'medications.*.name' => 'required|string|max:200',
                'medications.*.pharmaceutical_form' => 'nullable|string|max:50',
                'medications.*.dosage' => 'nullable|string|max:50',
                'medications.*.unit' => 'nullable|string|max:20',
                'medications.*.administration_route' => 'nullable|string|max:50',
                'medications.*.dose_quantity' => 'nullable|string|max:20',
                'medications.*.dose_quantity_unit' => 'nullable|string|max:20',
                'medications.*.frequency' => 'required|array',
                'medications.*.time' => 'nullable|string',
                'medications.*.start_date' => 'nullable|date',
                'medications.*.end_date' => 'nullable|date',
                'medications.*.instructions' => 'nullable|string',
                'medications.*.notes' => 'nullable|string',
            ]);

            // Verificar acesso ao grupo
            $hasAccess = DB::table('group_members')
                ->where('user_id', $user->id)
                ->where('group_id', $validated['group_id'])
                ->exists();

            if (!$hasAccess) {
                return response()->json(['success' => false, 'message' => 'Você não tem acesso a este grupo'], 403);
            }

            // Validar doctor_id se fornecido
            if ($validated['doctor_id']) {
                $doctorExists = false;
                if (Schema::hasTable('doctors')) {
                    $doctorExists = DB::table('doctors')->where('id', $validated['doctor_id'])->exists();
                }
                if (!$doctorExists && Schema::hasTable('users')) {
                    $doctorExists = DB::table('users')
                        ->where('id', $validated['doctor_id'])
                        ->where('profile', 'doctor')
                        ->exists();
                }
                if (!$doctorExists) {
                    return response()->json(['success' => false, 'message' => 'Médico não encontrado'], 422);
                }
            }

            // Processar imagem se fornecida
            Log::info('PrescriptionController.store - Processando image_url:', [
                'has_image_url' => $request->has('image_url'),
                'image_url_value' => $request->input('image_url'),
                'image_url_type' => gettype($request->input('image_url')),
            ]);
            
            $imageUrl = null;
            if ($request->has('image_url') && $request->input('image_url')) {
                $imageUrl = $request->input('image_url');
                Log::info('PrescriptionController.store - image_url recebido:', [
                    'image_url' => $imageUrl,
                    'starts_with_file' => strpos($imageUrl, 'file://') === 0,
                    'starts_with_content' => strpos($imageUrl, 'content://') === 0,
                ]);
                // Se for uma URL local (file://), tentar fazer upload
                if (strpos($imageUrl, 'file://') === 0 || strpos($imageUrl, 'content://') === 0) {
                    // Não processar URLs locais do dispositivo - o frontend deve fazer upload primeiro
                    Log::warning('PrescriptionController.store - URL local detectada, ignorando:', $imageUrl);
                    $imageUrl = null;
                } else {
                    Log::info('PrescriptionController.store - image_url válido, será salvo:', $imageUrl);
                }
            } else {
                Log::info('PrescriptionController.store - Nenhum image_url fornecido ou está vazio');
            }
            
            // Criar receita
            Log::info('PrescriptionController.store - Criando receita com image_url:', [
                'image_url' => $imageUrl,
                'image_url_is_null' => is_null($imageUrl),
            ]);
            
            $prescription = \App\Models\Prescription::create([
                'group_id' => $validated['group_id'],
                'doctor_id' => $validated['doctor_id'] ?? null,
                'doctor_name' => $validated['doctor_name'] ?? null,
                'doctor_specialty' => $validated['doctor_specialty'] ?? null,
                'doctor_crm' => $validated['doctor_crm'] ?? null,
                'prescription_date' => $validated['prescription_date'],
                'notes' => $validated['notes'] ?? null,
                'image_url' => $imageUrl,
                'created_by' => $user->id,
            ]);
            
            Log::info('PrescriptionController.store - Receita criada:', [
                'prescription_id' => $prescription->id,
                'image_url_salvo' => $prescription->image_url,
            ]);

            // Registrar atividade de criação de receita
            if (class_exists('App\Models\GroupActivity')) {
                try {
                    \App\Models\GroupActivity::logPrescriptionCreated(
                        $validated['group_id'],
                        $user->id,
                        $user->name,
                        $prescription->id
                    );
                } catch (\Exception $e) {
                    Log::warning("Erro ao registrar atividade de receita: " . $e->getMessage());
                }
            }

            // Criar medicamentos
            Log::info('PrescriptionController.store - Iniciando criação de medicamentos:', [
                'prescription_id' => $prescription->id,
                'medications_count' => count($validated['medications']),
            ]);
            
            foreach ($validated['medications'] as $index => $medData) {
                Log::info("PrescriptionController.store - Processando medicamento {$index}:", [
                    'name' => $medData['name'] ?? 'sem nome',
                    'has_all_fields' => isset($medData['name']) && isset($medData['frequency']),
                ]);
                
                // Determinar accompanied_person_id (mesma lógica do MedicationController)
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
                    Log::warning("PrescriptionController.store - Não foi possível determinar accompanied_person_id para medicamento {$index}, mas continuando mesmo assim", [
                        'medication_name' => $medData['name'] ?? 'sem nome',
                        'group_id' => $validated['group_id'],
                    ]);
                    // Para receitas, accompanied_person_id pode ser null
                    // Não pular o medicamento - salvar mesmo sem accompanied_person_id
                }

                Log::info("PrescriptionController.store - Criando medicamento {$index}:", [
                    'name' => $medData['name'],
                    'accompanied_person_id' => $accompaniedPersonId,
                    'prescription_id' => $prescription->id,
                ]);

                $medication = \App\Models\Medication::create([
                    'group_id' => $validated['group_id'],
                    'prescription_id' => $prescription->id,
                    'accompanied_person_id' => $accompaniedPersonId, // Pode ser null para receitas
                    'name' => $medData['name'],
                    'pharmaceutical_form' => $medData['pharmaceutical_form'] ?? null,
                    'dosage' => $medData['dosage'] ?? null,
                    'unit' => $medData['unit'] ?? null,
                    'administration_route' => $medData['administration_route'] ?? null,
                    'dose_quantity' => $medData['dose_quantity'] ?? null,
                    'dose_quantity_unit' => $medData['dose_quantity_unit'] ?? null,
                    'frequency' => json_encode($medData['frequency']),
                    'time' => $medData['time'] ?? null,
                    'start_date' => $medData['start_date'] ?? now(),
                    'end_date' => $medData['end_date'] ?? null,
                    'instructions' => $medData['instructions'] ?? null,
                    'notes' => $medData['notes'] ?? null,
                    'is_active' => true,
                    'registered_by_user_id' => $user->id,
                ]);
                
                Log::info("PrescriptionController.store - Medicamento {$index} criado com sucesso:", [
                    'medication_id' => $medication->id,
                    'name' => $medication->name,
                ]);
            }

            // Verificar quantos medicamentos foram realmente criados
            $createdCount = DB::table('medications')
                ->where('prescription_id', $prescription->id)
                ->count();
            
            Log::info('PrescriptionController.store - Resumo da criação:', [
                'prescription_id' => $prescription->id,
                'medications_requested' => count($validated['medications']),
                'medications_created' => $createdCount,
            ]);

            // Carregar receita com medicamentos
            $prescription->load('medications');

            return response()->json([
                'success' => true,
                'message' => 'Receita criada com sucesso',
                'data' => $prescription,
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['success' => false, 'message' => 'Dados inválidos', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('Erro ao criar receita: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Erro ao criar receita: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Atualizar receita existente
     * PUT /api/prescriptions/{id}
     */
    public function update(Request $request, $id)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['success' => false, 'message' => 'Usuário não autenticado'], 401);
            }

            $prescription = \App\Models\Prescription::findOrFail($id);

            // Verificar acesso ao grupo
            $hasAccess = DB::table('group_members')
                ->where('user_id', $user->id)
                ->where('group_id', $prescription->group_id)
                ->exists();

            if (!$hasAccess) {
                return response()->json(['success' => false, 'message' => 'Você não tem acesso a esta receita'], 403);
            }

            $validated = $request->validate([
                'doctor_id' => 'nullable|integer',
                'doctor_name' => 'nullable|string|max:255',
                'doctor_specialty' => 'nullable|string|max:255',
                'doctor_crm' => 'nullable|string|max:20',
                'prescription_date' => 'required|date',
                'notes' => 'nullable|string',
                'image_url' => 'nullable|string|max:500',
                'medications' => 'required|array|min:1',
                'medications.*.name' => 'required|string|max:200',
                'medications.*.pharmaceutical_form' => 'nullable|string|max:50',
                'medications.*.dosage' => 'nullable|string|max:50',
                'medications.*.unit' => 'nullable|string|max:20',
                'medications.*.administration_route' => 'nullable|string|max:50',
                'medications.*.dose_quantity' => 'nullable|string|max:20',
                'medications.*.dose_quantity_unit' => 'nullable|string|max:20',
                'medications.*.frequency' => 'required|array',
                'medications.*.time' => 'nullable|string',
                'medications.*.start_date' => 'nullable|date',
                'medications.*.end_date' => 'nullable|date',
                'medications.*.instructions' => 'nullable|string',
                'medications.*.notes' => 'nullable|string',
            ]);

            // Validar doctor_id se fornecido
            if (isset($validated['doctor_id']) && $validated['doctor_id']) {
                $doctorExists = false;
                if (Schema::hasTable('doctors')) {
                    $doctorExists = DB::table('doctors')->where('id', $validated['doctor_id'])->exists();
                }
                if (!$doctorExists && Schema::hasTable('users')) {
                    $doctorExists = DB::table('users')
                        ->where('id', $validated['doctor_id'])
                        ->where('profile', 'doctor')
                        ->exists();
                }
                if (!$doctorExists) {
                    return response()->json(['success' => false, 'message' => 'Médico não encontrado'], 422);
                }
            }

            // Processar imagem se fornecida
            $imageUrl = $prescription->image_url; // Manter imagem existente por padrão
            if ($request->has('image_url')) {
                if ($request->input('image_url')) {
                    $imageUrl = $request->input('image_url');
                    // Se for uma URL local (file://), não processar
                    if (strpos($imageUrl, 'file://') === 0 || strpos($imageUrl, 'content://') === 0) {
                        $imageUrl = $prescription->image_url; // Manter a existente
                    }
                } else {
                    $imageUrl = null; // Remover imagem se enviado vazio
                }
            }
            
            // Atualizar receita
            $prescription->update([
                'doctor_id' => $validated['doctor_id'] ?? $prescription->doctor_id,
                'doctor_name' => $validated['doctor_name'] ?? $prescription->doctor_name,
                'doctor_specialty' => $validated['doctor_specialty'] ?? $prescription->doctor_specialty,
                'doctor_crm' => $validated['doctor_crm'] ?? $prescription->doctor_crm,
                'prescription_date' => $validated['prescription_date'],
                'notes' => $validated['notes'] ?? null,
                'image_url' => $imageUrl,
            ]);

            // Deletar medicamentos antigos
            \App\Models\Medication::where('prescription_id', $prescription->id)->delete();

            // Criar novos medicamentos
            foreach ($validated['medications'] as $medData) {
                // Determinar accompanied_person_id
                $accompaniedPersonId = null;
                $patientMember = DB::table('group_members')
                    ->where('group_id', $prescription->group_id)
                    ->whereIn('role', ['priority_contact', 'patient'])
                    ->first();
                
                if ($patientMember) {
                    $accompaniedPerson = DB::table('accompanied_people')
                        ->where('group_id', $prescription->group_id)
                        ->where('user_id', $patientMember->user_id)
                        ->first();
                    
                    if ($accompaniedPerson) {
                        $accompaniedPersonId = $accompaniedPerson->id;
                    } else {
                        $firstAccompanied = DB::table('accompanied_people')
                            ->where('group_id', $prescription->group_id)
                            ->first();
                        if ($firstAccompanied) {
                            $accompaniedPersonId = $firstAccompanied->id;
                        }
                    }
                }

                if (!$accompaniedPersonId) {
                    $firstAccompanied = DB::table('accompanied_people')
                        ->where('group_id', $prescription->group_id)
                        ->first();
                    if ($firstAccompanied) {
                        $accompaniedPersonId = $firstAccompanied->id;
                    }
                }

                if (!$accompaniedPersonId) {
                    Log::warning('PrescriptionController.update - Não foi possível determinar accompanied_person_id para medicamento, mas continuando mesmo assim');
                    // Para receitas, accompanied_person_id pode ser null
                    // Não pular o medicamento - salvar mesmo sem accompanied_person_id
                }

                \App\Models\Medication::create([
                    'group_id' => $prescription->group_id,
                    'prescription_id' => $prescription->id,
                    'accompanied_person_id' => $accompaniedPersonId,
                    'name' => $medData['name'],
                    'pharmaceutical_form' => $medData['pharmaceutical_form'] ?? null,
                    'dosage' => $medData['dosage'] ?? null,
                    'unit' => $medData['unit'] ?? null,
                    'administration_route' => $medData['administration_route'] ?? null,
                    'dose_quantity' => $medData['dose_quantity'] ?? null,
                    'dose_quantity_unit' => $medData['dose_quantity_unit'] ?? null,
                    'frequency' => json_encode($medData['frequency']),
                    'time' => $medData['time'] ?? null,
                    'start_date' => $medData['start_date'] ?? now(),
                    'end_date' => $medData['end_date'] ?? null,
                    'instructions' => $medData['instructions'] ?? null,
                    'notes' => $medData['notes'] ?? null,
                    'is_active' => true,
                    'registered_by_user_id' => $user->id,
                ]);
            }

            // Carregar receita com medicamentos atualizados
            $prescription->load('medications');

            return response()->json([
                'success' => true,
                'message' => 'Receita atualizada com sucesso',
                'data' => $prescription,
            ], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['success' => false, 'message' => 'Dados inválidos', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('Erro ao atualizar receita: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Erro ao atualizar receita: ' . $e->getMessage()], 500);
        }
    }
}
