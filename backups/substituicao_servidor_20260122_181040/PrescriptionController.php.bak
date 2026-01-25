<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use App\Models\Document;
use App\Services\PDFService;
use App\Services\DigitalSignatureService;

class PrescriptionController extends Controller
{
    protected $pdfService;
    protected $signatureService;

    public function __construct(PDFService $pdfService, DigitalSignatureService $signatureService)
    {
        $this->pdfService = $pdfService;
        $this->signatureService = $signatureService;
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
}
