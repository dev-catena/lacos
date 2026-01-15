<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class GroupMessageController extends Controller
{
    /**
     * Obter mensagens do grupo
     * GET /api/messages/group/{groupId}
     */
    public function getGroupMessages($groupId)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuário não autenticado'
                ], 401);
            }

            // Verificar se o usuário é membro do grupo
            $isMember = DB::table('group_members')
                ->where('group_id', $groupId)
                ->where('user_id', $user->id)
                ->exists();

            if (!$isMember) {
                return response()->json([
                    'success' => false,
                    'message' => 'Você não tem acesso a este grupo'
                ], 403);
            }

            // Buscar mensagens do grupo
            $messages = DB::table('group_messages')
                ->where('group_id', $groupId)
                ->join('users', 'group_messages.user_id', '=', 'users.id')
                ->select(
                    'group_messages.id',
                    'group_messages.group_id',
                    'group_messages.user_id as sender_id',
                    'group_messages.content as message',
                    'group_messages.type',
                    'group_messages.image_url',
                    'group_messages.is_read',
                    'group_messages.created_at',
                    'users.name as sender_name',
                    'users.photo as sender_photo',
                    'users.photo_url as sender_photo_url'
                )
                ->orderBy('group_messages.created_at', 'asc')
                ->get()
                ->map(function ($message) use ($user) {
                    // Converter URL relativa em URL completa se necessário
                    $imageUrl = $message->image_url;
                    if ($imageUrl && !filter_var($imageUrl, FILTER_VALIDATE_URL)) {
                        // Se for URL relativa, converter para URL completa
                        $imageUrl = url($imageUrl);
                    }
                    
                    return [
                        'id' => $message->id,
                        'group_id' => $message->group_id,
                        'sender_id' => $message->sender_id,
                        'sender' => [
                            'id' => $message->sender_id,
                            'name' => $message->sender_name,
                            'photo' => $message->sender_photo,
                            'photo_url' => $message->sender_photo_url,
                        ],
                        'message' => $message->message,
                        'type' => $message->type ?? 'text',
                        'image_url' => $imageUrl,
                        'is_read' => $message->is_read,
                        'created_at' => $message->created_at,
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $messages,
            ]);

        } catch (\Exception $e) {
            Log::error('Erro ao buscar mensagens do grupo', [
                'group_id' => $groupId,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erro ao carregar mensagens do grupo'
            ], 500);
        }
    }

    /**
     * Enviar mensagem para o grupo
     * POST /api/messages/group
     */
    public function sendGroupMessage(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuário não autenticado'
                ], 401);
            }

            $validated = $request->validate([
                'group_id' => 'required|exists:groups,id',
                'message' => 'nullable|string|max:5000',
                'type' => 'nullable|in:text,image',
                'image' => 'nullable|image|max:10240', // 10MB
            ]);
            
            // Validar que pelo menos message ou image foi enviado
            if (empty($validated['message']) && !$request->hasFile('image')) {
                return response()->json([
                    'success' => false,
                    'message' => 'É necessário enviar uma mensagem ou uma imagem'
                ], 400);
            }

            $groupId = $validated['group_id'];

            // Verificar se o usuário é membro do grupo
            $isMember = DB::table('group_members')
                ->where('group_id', $groupId)
                ->where('user_id', $user->id)
                ->exists();

            if (!$isMember) {
                return response()->json([
                    'success' => false,
                    'message' => 'Você não tem acesso a este grupo'
                ], 403);
            }

            $messageType = $validated['type'] ?? 'text';
            $imageUrl = null;

            // Se for imagem, fazer upload
            if ($request->hasFile('image')) {
                $image = $request->file('image');
                $path = $image->store('group-messages', 'public');
                $imageUrl = url(Storage::url($path)); // URL completa com domínio
                $messageType = 'image';
            }

            // Inserir mensagem
            $messageId = DB::table('group_messages')->insertGetId([
                'group_id' => $groupId,
                'user_id' => $user->id,
                'content' => $validated['message'] ?? '',
                'type' => $messageType,
                'image_url' => $imageUrl,
                'is_read' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Buscar mensagem criada com dados do usuário
            $message = DB::table('group_messages')
                ->where('group_messages.id', $messageId)
                ->join('users', 'group_messages.user_id', '=', 'users.id')
                ->select(
                    'group_messages.id',
                    'group_messages.group_id',
                    'group_messages.user_id as sender_id',
                    'group_messages.content as message',
                    'group_messages.type',
                    'group_messages.image_url',
                    'group_messages.is_read',
                    'group_messages.created_at',
                    'users.name as sender_name',
                    'users.photo as sender_photo',
                    'users.photo_url as sender_photo_url'
                )
                ->first();

            // Converter URL relativa em URL completa se necessário
            $imageUrl = $message->image_url;
            if ($imageUrl && !filter_var($imageUrl, FILTER_VALIDATE_URL)) {
                // Se for URL relativa, converter para URL completa
                $imageUrl = url($imageUrl);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $message->id,
                    'group_id' => $message->group_id,
                    'sender_id' => $message->sender_id,
                    'sender' => [
                        'id' => $message->sender_id,
                        'name' => $message->sender_name,
                        'photo' => $message->sender_photo,
                        'photo_url' => $message->sender_photo_url,
                    ],
                    'message' => $message->message,
                    'type' => $message->type,
                    'image_url' => $imageUrl,
                    'is_read' => $message->is_read,
                    'created_at' => $message->created_at,
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('Erro ao enviar mensagem do grupo', [
                'group_id' => $request->input('group_id'),
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erro ao enviar mensagem'
            ], 500);
        }
    }
}

