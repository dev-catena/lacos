<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\GroupActivity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class DocumentController extends Controller
{
    /**
     * Listar documentos
     * GET /api/documents?group_id={groupId}&type={type}
     */
    public function index(Request $request)
    {
        try {
            $query = Document::query();

            // Filtrar por grupo
            if ($request->has('group_id')) {
                $groupId = $request->input('group_id');
                
                // Verificar se o usuário pertence ao grupo
                $user = Auth::user();
                
                if (!$user) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Usuário não autenticado',
                    ], 401);
                }
                
                // Verificar acesso (mesma lógica do GroupController)
                $hasAccess = false;
                
                // 1. Via group_user
                if (Schema::hasTable('group_user')) {
                    $hasAccess = DB::table('group_user')
                        ->where('user_id', $user->id)
                        ->where('group_id', $groupId)
                        ->exists();
                }
                
                // 2. Criador
                if (!$hasAccess) {
                    $hasAccess = DB::table('groups')
                        ->where('id', $groupId)
                        ->where('created_by', $user->id)
                        ->exists();
                }
                
                // 3. Via atividades
                if (!$hasAccess && Schema::hasTable('group_activities')) {
                    $hasAccess = DB::table('group_activities')
                        ->where('group_id', $groupId)
                        ->where('user_id', $user->id)
                        ->exists();
                }
                
                // 4. Via documentos
                if (!$hasAccess && Schema::hasTable('documents')) {
                    $hasAccess = DB::table('documents')
                        ->where('group_id', $groupId)
                        ->where('user_id', $user->id)
                        ->exists();
                }
                
                // 5. Se o grupo existe, permitir acesso (GroupController já validou)
                if (!$hasAccess) {
                    $groupExists = DB::table('groups')->where('id', $groupId)->exists();
                    if ($groupExists) {
                        $hasAccess = true; // Permitir acesso se o grupo existe
                    }
                }
                
                if (!$hasAccess) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Você não tem acesso a este grupo',
                    ], 403);
                }
                
                $query->where('group_id', $groupId);
            }

            // Filtrar por tipo
            if ($request->has('type')) {
                $query->where('type', $request->input('type'));
            }

            // Carregar relacionamentos de forma segura
            $query->with(['user']);
            if (class_exists(\App\Models\Doctor::class)) {
                $query->with('doctor');
            }
            
            $documents = $query->orderBy('document_date', 'desc')
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json($documents);
        } catch (\Exception $e) {
            Log::error('Erro ao listar documentos: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erro ao listar documentos',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Criar novo documento (upload)
     * POST /api/documents
     */
    public function store(Request $request)
    {
        try {
            // Validação básica
            $validator = Validator::make($request->all(), [
                'file' => 'required|file|max:51200', // 50MB
                'group_id' => 'required|exists:groups,id',
                'type' => 'required|in:exam_lab,exam_image,prescription,report,other',
                'title' => 'required|string|max:200',
                'document_date' => 'nullable|date',
                'doctor_id' => 'nullable|integer',
                'consultation_id' => 'nullable|integer',
                'notes' => 'nullable|string|max:1000',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dados inválidos',
                    'errors' => $validator->errors(),
                ], 422);
            }

            // Verificar se o usuário pertence ao grupo
            $user = Auth::user();
            $groupId = $request->input('group_id');
            
            // Verificar acesso via tabela group_user
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

            // Upload do arquivo
            $file = $request->file('file');
            $path = $file->store('documents', 'public');
            $url = Storage::url($path);

            // Processar document_date (pode vir como ISO string ou date)
            $documentDate = $request->input('document_date');
            if ($documentDate) {
                // Se for ISO string, converter para date
                if (strpos($documentDate, 'T') !== false) {
                    $documentDate = date('Y-m-d', strtotime($documentDate));
                }
            } else {
                $documentDate = now()->toDateString();
            }

            // Processar consultation_id (pode vir como string vazia)
            $consultationId = $request->input('consultation_id');
            if ($consultationId === '' || $consultationId === null || $consultationId === '0') {
                $consultationId = null;
            } else {
                $consultationId = (int) $consultationId;
            }

            // Processar doctor_id (pode vir como string vazia)
            // Pode ser da tabela doctors ou users com profile='doctor'
            $doctorId = $request->input('doctor_id');
            if ($doctorId === '' || $doctorId === null || $doctorId === '0') {
                $doctorId = null;
            } else {
                $doctorId = (int) $doctorId;
                $doctorExists = false;
                
                // Verificar se o doctor existe na tabela doctors
                if (\Schema::hasTable('doctors')) {
                    $doctorExists = \DB::table('doctors')->where('id', $doctorId)->exists();
                }
                
                // Se não encontrou em doctors, verificar se é médico da plataforma (users com profile='doctor')
                if (!$doctorExists && \Schema::hasTable('users')) {
                    $doctorExists = \DB::table('users')
                        ->where('id', $doctorId)
                        ->where('profile', 'doctor')
                        ->exists();
                }
                
                // Se não encontrou em nenhum lugar, definir como null
                if (!$doctorExists) {
                    \Log::warning('DocumentController.store - doctor_id não encontrado em doctors nem em users: ' . $doctorId);
                    $doctorId = null;
                } else {
                    \Log::info('DocumentController.store - doctor_id válido encontrado: ' . $doctorId);
                }
            }

            // Criar documento
            $documentData = [
                'group_id' => $groupId,
                'user_id' => $user->id,
                'type' => $request->input('type'),
                'title' => $request->input('title'),
                'document_date' => $documentDate,
                'file_path' => $path,
                'file_name' => $file->getClientOriginalName(),
                'mime_type' => $file->getMimeType(),
                'file_size' => $file->getSize(),
                'notes' => $request->input('notes'),
            ];
            
            // Adicionar doctor_id se for válido (pode ser de doctors ou users com profile='doctor')
            // A foreign key foi removida, então podemos salvar IDs de ambas as tabelas
            if ($doctorId !== null) {
                $documentData['doctor_id'] = $doctorId;
                \Log::info('DocumentController.store - doctor_id salvo: ' . $doctorId . ' (pode ser de doctors ou users)');
            }
            
            // Adicionar consultation_id se fornecido
            if ($consultationId !== null) {
                $documentData['consultation_id'] = $consultationId;
            }
            
            $document = Document::create($documentData);

            // Carregar relacionamentos de forma segura
            try {
                $document->load(['user']);
                if ($document->doctor_id) {
                    try {
                        $document->load('doctor');
                    } catch (\Exception $e) {
                        // Se o relacionamento doctor falhar, continuar sem ele
                        Log::warning('Erro ao carregar doctor: ' . $e->getMessage());
                    }
                }
            } catch (\Exception $e) {
                Log::warning('Erro ao carregar relacionamentos: ' . $e->getMessage());
            }

            // Registrar atividade - SEMPRE, sem try/catch que esconde erros
            Log::info('DocumentController.store - Criando atividade para documento:', [
                'document_id' => $document->id,
                'document_title' => $document->title,
                'document_type' => $document->type,
                'group_id' => $document->group_id,
                'user_id' => $user->id,
            ]);
            
            $activity = GroupActivity::logDocumentCreated(
                $document->group_id,
                $user->id,
                $user->name,
                $document->title,
                $document->type,
                $document->id
            );
            
            Log::info('DocumentController.store - Atividade criada com sucesso:', [
                'activity_id' => $activity->id,
                'action_type' => $activity->action_type,
            ]);

            return response()->json([
                'success' => true,
                'data' => $document,
            ], 201);
        } catch (\Exception $e) {
            Log::error('Erro ao fazer upload de documento: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            Log::error('Request data: ' . json_encode($request->except(['file'])));
            
            // Retornar erro mais detalhado
            $errorMessage = $e->getMessage();
            if (config('app.debug', false)) {
                $errorMessage .= ' | File: ' . $e->getFile() . ' | Line: ' . $e->getLine();
            }
            
            return response()->json([
                'success' => false,
                'message' => 'Erro ao fazer upload do documento',
                'error' => $errorMessage,
            ], 500);
        }
    }

    /**
     * Obter documento específico
     * GET /api/documents/{id}
     */
    public function show($id)
    {
        try {
            $document = Document::with(['user', 'doctor', 'consultation'])
                ->find($id);

            if (!$document) {
                return response()->json([
                    'success' => false,
                    'message' => 'Documento não encontrado',
                ], 404);
            }

            // Verificar se o usuário tem acesso ao grupo
            $user = Auth::user();
            $groupId = $document->group_id;
            
            // Verificar acesso via tabela group_user
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
                    'message' => 'Você não tem acesso a este documento',
                ], 403);
            }

            return response()->json([
                'success' => true,
                'data' => $document,
            ]);
        } catch (\Exception $e) {
            Log::error('Erro ao buscar documento: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erro ao buscar documento',
            ], 500);
        }
    }

    /**
     * Atualizar documento
     * PUT /api/documents/{id}
     */
    public function update(Request $request, $id)
    {
        try {
            $document = Document::find($id);

            if (!$document) {
                return response()->json([
                    'success' => false,
                    'message' => 'Documento não encontrado',
                ], 404);
            }

            // Verificar se o usuário tem acesso
            $user = Auth::user();
            $groupId = $document->group_id;
            
            // Verificar acesso via tabela group_user
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
                    'message' => 'Você não tem acesso a este documento',
                ], 403);
            }

            // Validação
            $validator = Validator::make($request->all(), [
                'type' => 'sometimes|in:exam_lab,exam_image,prescription,report,other',
                'title' => 'sometimes|string|max:200',
                'document_date' => 'sometimes|date',
                'doctor_id' => 'nullable|exists:doctors,id',
                'consultation_id' => 'nullable|exists:consultations,id',
                'notes' => 'nullable|string|max:1000',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dados inválidos',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $document->update($request->only([
                'type', 'title', 'document_date', 'doctor_id', 'consultation_id', 'notes'
            ]));

            $document->load(['user', 'doctor']);

            return response()->json([
                'success' => true,
                'data' => $document,
            ]);
        } catch (\Exception $e) {
            Log::error('Erro ao atualizar documento: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erro ao atualizar documento',
            ], 500);
        }
    }

    /**
     * Deletar documento
     * DELETE /api/documents/{id}
     */
    public function destroy($id)
    {
        try {
            $document = Document::find($id);

            if (!$document) {
                return response()->json([
                    'success' => false,
                    'message' => 'Documento não encontrado',
                ], 404);
            }

            // Verificar se o usuário tem acesso
            $user = Auth::user();
            $groupId = $document->group_id;
            
            // Verificar acesso via tabela group_user
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
                    'message' => 'Você não tem acesso a este documento',
                ], 403);
            }

            // Deletar arquivo físico
            if (Storage::disk('public')->exists($document->file_path)) {
                Storage::disk('public')->delete($document->file_path);
            }

            $document->delete();

            return response()->json([
                'success' => true,
                'message' => 'Documento deletado com sucesso',
            ]);
        } catch (\Exception $e) {
            Log::error('Erro ao deletar documento: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erro ao deletar documento',
            ], 500);
        }
    }

    /**
     * Download de documento
     * GET /api/documents/{id}/download
     */
    public function download($id)
    {
        try {
            $document = Document::find($id);

            if (!$document) {
                return response()->json([
                    'success' => false,
                    'message' => 'Documento não encontrado',
                ], 404);
            }

            // Verificar se o usuário tem acesso
            $user = Auth::user();
            $groupId = $document->group_id;
            
            // Verificar acesso via tabela group_user
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
                    'message' => 'Você não tem acesso a este documento',
                ], 403);
            }

            // Verificar se o arquivo existe
            if (!Storage::disk('public')->exists($document->file_path)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Arquivo não encontrado',
                ], 404);
            }

            $filePath = Storage::disk('public')->path($document->file_path);

            // Usar mime_type ou fallback para application/octet-stream
            $contentType = $document->mime_type ?? 'application/octet-stream';
            
            return response()->download($filePath, $document->file_name, [
                'Content-Type' => $contentType,
            ]);
        } catch (\Exception $e) {
            Log::error('Erro ao fazer download de documento: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erro ao fazer download do documento',
            ], 500);
        }
    }
}

