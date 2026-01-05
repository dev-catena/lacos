<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GroupMedia;
use App\Events\MediaDeleted;
use App\Events\MediaCreated;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class MediaController extends Controller
{
    /**
     * Listar mídias de um grupo (últimas 24h)
     * 
     * GET /api/groups/{groupId}/media
     */
    public function index($groupId)
    {
        try {
            // Verificar se usuário tem acesso ao grupo
            $group = Auth::user()->groups()->find($groupId);
            
            if (!$group) {
                return response()->json([
                    'message' => 'Grupo não encontrado ou você não tem acesso'
                ], 403);
            }

            // Buscar mídias das últimas 24 horas
            $media = GroupMedia::where('group_id', $groupId)
                ->where('created_at', '>=', Carbon::now()->subHours(24))
                ->with('postedBy:id,name') // Eager load user name
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get()
                ->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'group_id' => $item->group_id,
                        'type' => $item->type,
                        'url' => $item->url,
                        'media_url' => $item->url,
                        'thumbnail_url' => $item->thumbnail_url,
                        'description' => $item->description,
                        'posted_by_user_id' => $item->posted_by_user_id,
                        'posted_by_name' => $item->postedBy->name ?? 'Usuário',
                        'created_at' => $item->created_at->toIso8601String(),
                        'updated_at' => $item->updated_at->toIso8601String(),
                    ];
                });

            return response()->json($media);
            
        } catch (\Exception $e) {
            \Log::error('Erro ao buscar mídias: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Erro ao buscar mídias',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Postar nova mídia
     * 
     * POST /api/groups/{groupId}/media
     */
    public function store(Request $request, $groupId)
    {
        try {
            // Verificar se usuário é admin do grupo
            $group = Auth::user()->groups()
                ->wherePivot('role', 'admin')
                ->find($groupId);
            
            if (!$group) {
                return response()->json([
                    'message' => 'Você precisa ser administrador do grupo para postar mídias'
                ], 403);
            }

            // Validação
            $validator = Validator::make($request->all(), [
                'file' => 'required|file',
                'type' => 'required|in:image,video',
                'description' => 'nullable|string|max:500',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Dados inválidos',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Validar tamanho e tipo específico
            $file = $request->file('file');
            $type = $request->input('type');
            
            if ($type === 'image') {
                $validator = Validator::make(['file' => $file], [
                    'file' => 'mimes:jpg,jpeg,png,gif|max:51200' // 50MB
                ]);
            } else { // video
                $validator = Validator::make(['file' => $file], [
                    'file' => 'mimes:mp4,mov,avi|max:102400' // 100MB
                ]);
            }

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Arquivo inválido',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Upload do arquivo
            $path = $file->store('group-media', 'public');
            $url = Storage::url($path);

            // Gerar thumbnail para vídeos (opcional)
            $thumbnailUrl = null;
            if ($type === 'video') {
                // TODO: Implementar geração de thumbnail
                // $thumbnailUrl = $this->generateVideoThumbnail($path);
            }

            // Salvar no banco
            $media = GroupMedia::create([
                'group_id' => $groupId,
                'posted_by_user_id' => Auth::id(),
                'type' => $type,
                'file_path' => $path,
                'url' => $url,
                'thumbnail_url' => $thumbnailUrl,
                'description' => $request->input('description'),
            ]);

            // Preparar dados da mídia para retorno e broadcasting
            $mediaData = [
                'id' => $media->id,
                'group_id' => $media->group_id,
                'type' => $media->type,
                'url' => $media->url,
                'media_url' => $media->url,
                'thumbnail_url' => $media->thumbnail_url,
                'description' => $media->description,
                'posted_by_user_id' => $media->posted_by_user_id,
                'posted_by_name' => Auth::user()->name,
                'created_at' => $media->created_at->toIso8601String(),
                'updated_at' => $media->updated_at->toIso8601String(),
            ];

            // Disparar evento de broadcasting para atualizar clientes em tempo real
            // Usar try-catch para não quebrar o upload se o broadcasting falhar
            try {
                event(new MediaCreated($groupId, $mediaData));
            } catch (\Exception $broadcastError) {
                \Log::warning('Erro ao fazer broadcast de mídia criada: ' . $broadcastError->getMessage());
                // Continuar mesmo se o broadcasting falhar
            }

            // Retornar com dados completos
            return response()->json($mediaData, 201);
            
        } catch (\Exception $e) {
            \Log::error('Erro ao postar mídia: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Erro ao postar mídia',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Deletar mídia
     * 
     * DELETE /api/media/{mediaId}
     */
    public function destroy($mediaId)
    {
        try {
            $media = GroupMedia::findOrFail($mediaId);
            
            // Verificar se usuário é admin do grupo ou criador da mídia
            $group = Auth::user()->groups()
                ->wherePivot('role', 'admin')
                ->find($media->group_id);
            
            $isCreator = $media->posted_by_user_id === Auth::id();
            
            if (!$group && !$isCreator) {
                return response()->json([
                    'message' => 'Você não tem permissão para deletar esta mídia'
                ], 403);
            }

            // Deletar arquivo do storage
            if (Storage::disk('public')->exists($media->file_path)) {
                Storage::disk('public')->delete($media->file_path);
            }

            // Deletar thumbnail se existir
            if ($media->thumbnail_path && Storage::disk('public')->exists($media->thumbnail_path)) {
                Storage::disk('public')->delete($media->thumbnail_path);
            }

            // Salvar group_id antes de deletar
            $groupId = $media->group_id;
            $deletedMediaId = $media->id;

            // Deletar registro
            $media->delete();

            // Disparar evento de broadcasting para atualizar clientes em tempo real
            // Usar try-catch para não quebrar a deleção se o broadcasting falhar
            try {
                event(new MediaDeleted($groupId, $deletedMediaId));
            } catch (\Exception $broadcastError) {
                \Log::warning('Erro ao fazer broadcast de mídia deletada: ' . $broadcastError->getMessage());
                // Continuar mesmo se o broadcasting falhar
            }

            return response()->json([
                'message' => 'Mídia removida com sucesso'
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Erro ao deletar mídia: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Erro ao deletar mídia',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Limpar mídias antigas (cron job)
     * Rodar a cada hora
     */
    public function cleanOldMedia()
    {
        try {
            $oldMedia = GroupMedia::where('created_at', '<', Carbon::now()->subHours(24))
                ->get();

            foreach ($oldMedia as $media) {
                // Deletar arquivos
                if (Storage::disk('public')->exists($media->file_path)) {
                    Storage::disk('public')->delete($media->file_path);
                }
                
                if ($media->thumbnail_url && Storage::disk('public')->exists($media->thumbnail_path)) {
                    Storage::disk('public')->delete($media->thumbnail_path);
                }
                
                // Deletar registro
                $media->delete();
            }

            \Log::info('Limpeza de mídias antigas: ' . $oldMedia->count() . ' mídia(s) removida(s)');
            
            return response()->json([
                'message' => 'Limpeza concluída',
                'removed' => $oldMedia->count()
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Erro na limpeza de mídias: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Erro na limpeza',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

