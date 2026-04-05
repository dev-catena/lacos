<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserMessage;
use App\Models\User;
use App\Models\Group;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class MessageController extends Controller
{
    /**
     * Listar mensagens de uma conversa
     * GET /api/messages/conversation/{userId}
     */
    public function getConversation(Request $request, $otherUserId)
    {
        $user = Auth::user();
        
        // Verificar se os usuários estão no mesmo grupo (para conversas em grupo)
        $groupIdsQuery = DB::table('group_members')
            ->where('user_id', $user->id);
        
        if (Schema::hasColumn('group_members', 'is_active')) {
            $groupIdsQuery->where('is_active', true);
        }
        
        $groupIds = $groupIdsQuery->pluck('group_id')->toArray();
        
        $otherUserGroupIdsQuery = DB::table('group_members')
            ->where('user_id', $otherUserId);
        
        if (Schema::hasColumn('group_members', 'is_active')) {
            $otherUserGroupIdsQuery->where('is_active', true);
        }
        
        $otherUserGroupIds = $otherUserGroupIdsQuery->pluck('group_id')->toArray();
        
        $commonGroups = array_intersect($groupIds, $otherUserGroupIds);
        $groupId = !empty($commonGroups) ? reset($commonGroups) : null;
        
        // Buscar mensagens entre os dois usuários
        // Se há grupo em comum: filtrar por group_id
        // Se não há (ex: usuário contatou cuidador pela busca): filtrar por group_id null
        $messages = UserMessage::where(function($query) use ($user, $otherUserId) {
                $query->where('sender_id', $user->id)
                      ->where('receiver_id', $otherUserId);
            })
            ->orWhere(function($query) use ($user, $otherUserId) {
                $query->where('sender_id', $otherUserId)
                      ->where('receiver_id', $user->id);
            })
            ->where(function($query) use ($groupId) {
                if ($groupId) {
                    $query->where('group_id', $groupId);
                } else {
                    $query->whereNull('group_id');
                }
            })
            ->with(['sender', 'receiver'])
            ->orderBy('created_at', 'asc')
            ->get();
        
        // Marcar mensagens como lidas
        UserMessage::where('sender_id', $otherUserId)
            ->where('receiver_id', $user->id)
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);
        
        return response()->json([
            'success' => true,
            'data' => $messages,
            'group_id' => $groupId,
        ]);
    }

    /**
     * Enviar mensagem de texto (1:1)
     * Permite envio entre usuários no mesmo grupo OU entre usuário e cuidador (busca de cuidadores)
     * POST /api/messages
     */
    public function sendMessage(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'receiver_id' => 'required|exists:users,id',
            'message' => 'required_without:image|string|max:1000',
            'type' => 'required|in:text,image',
            'image' => 'required_if:type,image|image|mimes:jpeg,png,jpg,gif|max:5120', // 5MB
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
                'message' => 'Dados inválidos',
            ], 422);
        }

        $user = Auth::user();
        $receiverId = $request->receiver_id;
        
        // Verificar se os usuários estão no mesmo grupo (para conversas em grupo)
        $groupIdsQuery = DB::table('group_members')
            ->where('user_id', $user->id);
        
        if (Schema::hasColumn('group_members', 'is_active')) {
            $groupIdsQuery->where('is_active', true);
        }
        
        $groupIds = $groupIdsQuery->pluck('group_id')->toArray();
        
        $receiverGroupIdsQuery = DB::table('group_members')
            ->where('user_id', $receiverId);
        
        if (Schema::hasColumn('group_members', 'is_active')) {
            $receiverGroupIdsQuery->where('is_active', true);
        }
        
        $receiverGroupIds = $receiverGroupIdsQuery->pluck('group_id')->toArray();
        
        $commonGroups = array_intersect($groupIds, $receiverGroupIds);
        // Se há grupo em comum: usar. Senão (ex: usuário contatou cuidador pela busca): group_id null
        $groupId = !empty($commonGroups) ? reset($commonGroups) : null;
        
        $imageUrl = null;
        if ($request->type === 'image' && $request->hasFile('image')) {
            $path = $request->file('image')->store('messages', 'public');
            $imageUrl = Storage::url($path);
        }
        
        $message = UserMessage::create([
            'sender_id' => $user->id,
            'receiver_id' => $receiverId,
            'group_id' => $groupId,
            'message' => $request->message ?? '',
            'type' => $request->type,
            'image_url' => $imageUrl,
        ]);
        
        $message->load(['sender', 'receiver']);
        
        return response()->json([
            'success' => true,
            'data' => $message,
        ], 201);
    }

    /**
     * Listar conversas do usuário
     * GET /api/messages/conversations
     */
    public function getConversations(Request $request)
    {
        $user = Auth::user();
        $userId = $user->id;

        // Buscar últimas mensagens de cada conversa (apenas 1:1, excluir mensagens de grupo)
        // Usar MAX() nas colunas para compatibilidade com sql_mode=ONLY_FULL_GROUP_BY
        $conversations = DB::select("
            SELECT 
                MAX(CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END) as other_user_id,
                MAX(created_at) as last_message_at,
                MAX(id) as last_message_id
            FROM messages
            WHERE receiver_id IS NOT NULL
              AND (sender_id = ? OR receiver_id = ?)
            GROUP BY CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END
            ORDER BY last_message_at DESC
        ", [$userId, $userId, $userId, $userId]);
        
        $conversationsData = [];
        foreach ($conversations as $conv) {
            $lastMessage = UserMessage::with(['sender', 'receiver'])
                ->find($conv->last_message_id);
            
            if (!$lastMessage) {
                continue; // Pular se mensagem não existir
            }
            
            $otherUser = $lastMessage->sender_id === $user->id 
                ? $lastMessage->receiver 
                : $lastMessage->sender;
            
            if (!$otherUser) {
                continue; // Pular se usuário não existir
            }
            
            $unreadCount = UserMessage::where('sender_id', $otherUser->id)
                ->where('receiver_id', $user->id)
                ->where('is_read', false)
                ->count();
            
            $conversationsData[] = [
                'other_user' => $otherUser,
                'last_message' => $lastMessage,
                'unread_count' => $unreadCount,
                'last_message_at' => $lastMessage->created_at,
            ];
        }
        
        return response()->json([
            'success' => true,
            'data' => $conversationsData,
        ]);
    }

    /**
     * Contador de mensagens não lidas (1:1)
     * GET /api/messages/unread-count
     */
    public function unreadCount(Request $request)
    {
        $user = Auth::user();

        $count = UserMessage::where('receiver_id', $user->id)
            ->where('is_read', false)
            ->count();

        return response()->json([
            'success' => true,
            'unread_count' => $count,
        ]);
    }

    /**
     * Marcar mensagens como lidas
     * POST /api/messages/{userId}/read
     */
    public function markAsRead($senderId)
    {
        $user = Auth::user();
        
        UserMessage::where('sender_id', $senderId)
            ->where('receiver_id', $user->id)
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);
        
        return response()->json([
            'success' => true,
            'message' => 'Mensagens marcadas como lidas',
        ]);
    }

    /**
     * Listar mensagens de um grupo
     * GET /api/messages/group/{groupId}
     */
    public function getGroupMessages(Request $request, $groupId)
    {
        $user = Auth::user();
        
        // Verificar se o usuário é membro do grupo
        $isMemberQuery = DB::table('group_members')
            ->where('user_id', $user->id)
            ->where('group_id', $groupId);
        
        if (Schema::hasColumn('group_members', 'is_active')) {
            $isMemberQuery->where(function($query) {
                $query->where('is_active', true)
                      ->orWhereNull('is_active');
            });
        }
        
        $isMember = $isMemberQuery->exists();
        
        if (!$isMember) {
            return response()->json([
                'success' => false,
                'message' => 'Você não é membro deste grupo',
            ], 403);
        }
        
        // Buscar mensagens do grupo (receiver_id é null para mensagens de grupo)
        // Usar GroupMessage se existir, senão usar UserMessage com receiver_id null
        $messages = UserMessage::where('group_id', $groupId)
            ->whereNull('receiver_id')
            ->with(['sender'])
            ->orderBy('created_at', 'asc')
            ->get();
        
        return response()->json([
            'success' => true,
            'data' => $messages,
        ]);
    }

    /**
     * Enviar mensagem para o grupo
     * POST /api/messages/group
     */
    public function sendGroupMessage(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'group_id' => 'required|exists:groups,id',
            'message' => 'required_without:image|string|max:1000',
            'type' => 'required|in:text,image',
            'image' => 'required_if:type,image|image|mimes:jpeg,png,jpg,gif|max:5120', // 5MB
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
                'message' => 'Dados inválidos',
            ], 422);
        }

        $user = Auth::user();
        $groupId = $request->group_id;
        
        // Verificar se o usuário é membro do grupo
        $isMemberQuery = DB::table('group_members')
            ->where('user_id', $user->id)
            ->where('group_id', $groupId);
        
        if (Schema::hasColumn('group_members', 'is_active')) {
            $isMemberQuery->where(function($query) {
                $query->where('is_active', true)
                      ->orWhereNull('is_active');
            });
        }
        
        $isMember = $isMemberQuery->exists();
        
        if (!$isMember) {
            return response()->json([
                'success' => false,
                'message' => 'Você não é membro deste grupo',
            ], 403);
        }
        
        $imageUrl = null;
        if ($request->type === 'image' && $request->hasFile('image')) {
            $path = $request->file('image')->store('messages', 'public');
            $imageUrl = Storage::url($path);
        }
        
        // Criar mensagem de grupo (receiver_id é null)
        $message = UserMessage::create([
            'sender_id' => $user->id,
            'receiver_id' => null, // null para mensagens de grupo
            'group_id' => $groupId,
            'message' => $request->message ?? '',
            'type' => $request->type,
            'image_url' => $imageUrl,
        ]);
        
        $message->load(['sender']);
        
        return response()->json([
            'success' => true,
            'data' => $message,
        ], 201);
    }
}

