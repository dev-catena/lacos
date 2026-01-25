<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\User;
use App\Models\Group;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class MessageController extends Controller
{
    /**
     * Listar mensagens de uma conversa
     * GET /api/messages/conversation/{userId}
     */
    public function getConversation(Request $request, $otherUserId)
    {
        $user = Auth::user();
        
        // Verificar se os usuários estão no mesmo grupo
        $groupIds = DB::table('group_members')
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->pluck('group_id')
            ->toArray();
        
        $otherUserGroupIds = DB::table('group_members')
            ->where('user_id', $otherUserId)
            ->where('is_active', true)
            ->pluck('group_id')
            ->toArray();
        
        $commonGroups = array_intersect($groupIds, $otherUserGroupIds);
        
        if (empty($commonGroups)) {
            return response()->json([
                'success' => false,
                'message' => 'Usuários não estão no mesmo grupo',
            ], 403);
        }
        
        $groupId = reset($commonGroups); // Pegar o primeiro grupo em comum
        
        // Buscar mensagens entre os dois usuários
        $messages = Message::where(function($query) use ($user, $otherUserId) {
                $query->where('sender_id', $user->id)
                      ->where('receiver_id', $otherUserId);
            })
            ->orWhere(function($query) use ($user, $otherUserId) {
                $query->where('sender_id', $otherUserId)
                      ->where('receiver_id', $user->id);
            })
            ->where('group_id', $groupId)
            ->with(['sender', 'receiver'])
            ->orderBy('created_at', 'asc')
            ->get();
        
        // Marcar mensagens como lidas
        Message::where('sender_id', $otherUserId)
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
     * Enviar mensagem de texto
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
        
        // Verificar se os usuários estão no mesmo grupo
        $groupIds = DB::table('group_members')
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->pluck('group_id')
            ->toArray();
        
        $receiverGroupIds = DB::table('group_members')
            ->where('user_id', $receiverId)
            ->where('is_active', true)
            ->pluck('group_id')
            ->toArray();
        
        $commonGroups = array_intersect($groupIds, $receiverGroupIds);
        
        if (empty($commonGroups)) {
            return response()->json([
                'success' => false,
                'message' => 'Usuários não estão no mesmo grupo',
            ], 403);
        }
        
        $groupId = reset($commonGroups);
        
        $imageUrl = null;
        if ($request->type === 'image' && $request->hasFile('image')) {
            $path = $request->file('image')->store('messages', 'public');
            $imageUrl = Storage::url($path);
        }
        
        $message = Message::create([
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
        
        // Buscar últimas mensagens de cada conversa
        $conversations = DB::table('messages')
            ->select([
                DB::raw('CASE 
                    WHEN sender_id = ? THEN receiver_id 
                    ELSE sender_id 
                END as other_user_id'),
                DB::raw('MAX(created_at) as last_message_at'),
                DB::raw('MAX(id) as last_message_id'),
            ])
            ->where(function($query) use ($user) {
                $query->where('sender_id', $user->id)
                      ->orWhere('receiver_id', $user->id);
            })
            ->setBindings([$user->id])
            ->groupBy('other_user_id')
            ->orderBy('last_message_at', 'desc')
            ->get();
        
        $conversationsData = [];
        foreach ($conversations as $conv) {
            $lastMessage = Message::with(['sender', 'receiver'])
                ->find($conv->last_message_id);
            
            $otherUser = $lastMessage->sender_id === $user->id 
                ? $lastMessage->receiver 
                : $lastMessage->sender;
            
            $unreadCount = Message::where('sender_id', $otherUser->id)
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
     * Marcar mensagens como lidas
     * POST /api/messages/{userId}/read
     */
    public function markAsRead($senderId)
    {
        $user = Auth::user();
        
        Message::where('sender_id', $senderId)
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
        $isMember = DB::table('group_members')
            ->where('user_id', $user->id)
            ->where('group_id', $groupId)
            ->where(function($query) {
                $query->where('is_active', true)
                      ->orWhereNull('is_active');
            })
            ->exists();
        
        if (!$isMember) {
            return response()->json([
                'success' => false,
                'message' => 'Você não é membro deste grupo',
            ], 403);
        }
        
        // Buscar mensagens do grupo (receiver_id é null para mensagens de grupo)
        $messages = Message::where('group_id', $groupId)
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
        $isMember = DB::table('group_members')
            ->where('user_id', $user->id)
            ->where('group_id', $groupId)
            ->where(function($query) {
                $query->where('is_active', true)
                      ->orWhereNull('is_active');
            })
            ->exists();
        
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
        $message = Message::create([
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

