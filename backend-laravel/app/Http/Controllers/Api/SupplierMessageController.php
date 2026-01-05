<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class SupplierMessageController extends Controller
{
    /**
     * Listar conversas do fornecedor
     * GET /api/suppliers/conversations
     */
    public function index(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['success' => false, 'message' => 'Não autenticado'], 401);
            }

            $supplier = Supplier::where('user_id', $user->id)->first();
            if (!$supplier) {
                return response()->json(['success' => false, 'message' => 'Fornecedor não encontrado'], 404);
            }

            if ($supplier->status !== 'approved') {
                return response()->json(['success' => false, 'message' => 'Fornecedor não aprovado'], 403);
            }

            $conversations = Conversation::where('supplier_id', $supplier->id)
                ->with(['user', 'order'])
                ->orderBy('last_message_at', 'desc')
                ->get();

            $formattedConversations = $conversations->map(function ($conversation) {
                return [
                    'id' => $conversation->id,
                    'customer' => [
                        'id' => $conversation->user->id,
                        'name' => $conversation->user->name,
                        'email' => $conversation->user->email,
                    ],
                    'last_message' => $conversation->last_message,
                    'last_message_at' => $conversation->last_message_at,
                    'unread_count' => $conversation->unread_count_supplier,
                    'order_id' => $conversation->order_id,
                ];
            });

            return response()->json([
                'success' => true,
                'conversations' => $formattedConversations
            ], 200);
        } catch (\Exception $e) {
            Log::error('Erro ao listar conversas: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Erro ao listar conversas'], 500);
        }
    }

    /**
     * Obter mensagens de uma conversa
     * GET /api/suppliers/conversations/{id}/messages
     */
    public function getMessages($id)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['success' => false, 'message' => 'Não autenticado'], 401);
            }

            $supplier = Supplier::where('user_id', $user->id)->first();
            if (!$supplier) {
                return response()->json(['success' => false, 'message' => 'Fornecedor não encontrado'], 404);
            }

            $conversation = Conversation::where('id', $id)
                ->where('supplier_id', $supplier->id)
                ->first();

            if (!$conversation) {
                return response()->json(['success' => false, 'message' => 'Conversa não encontrada'], 404);
            }

            // Marcar mensagens como lidas
            Message::where('conversation_id', $conversation->id)
                ->where('sender_type', 'user')
                ->where('is_read', false)
                ->update(['is_read' => true]);

            // Atualizar contador de não lidas
            $conversation->unread_count_supplier = 0;
            $conversation->save();

            $messages = Message::where('conversation_id', $conversation->id)
                ->orderBy('created_at', 'asc')
                ->get();

            return response()->json([
                'success' => true,
                'messages' => $messages
            ], 200);
        } catch (\Exception $e) {
            Log::error('Erro ao buscar mensagens: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Erro ao buscar mensagens'], 500);
        }
    }

    /**
     * Enviar mensagem
     * POST /api/suppliers/conversations/{id}/messages
     */
    public function sendMessage(Request $request, $id)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['success' => false, 'message' => 'Não autenticado'], 401);
            }

            $supplier = Supplier::where('user_id', $user->id)->first();
            if (!$supplier) {
                return response()->json(['success' => false, 'message' => 'Fornecedor não encontrado'], 404);
            }

            $request->validate([
                'content' => 'required|string|max:5000',
            ], [
                'content.required' => 'A mensagem é obrigatória',
                'content.max' => 'A mensagem não pode exceder 5000 caracteres',
            ]);

            $conversation = Conversation::where('id', $id)
                ->where('supplier_id', $supplier->id)
                ->first();

            if (!$conversation) {
                return response()->json(['success' => false, 'message' => 'Conversa não encontrada'], 404);
            }

            $message = Message::create([
                'conversation_id' => $conversation->id,
                'sender_type' => 'supplier',
                'content' => $request->content,
                'is_read' => false,
            ]);

            // Atualizar última mensagem da conversa
            $conversation->last_message = substr($request->content, 0, 200);
            $conversation->last_message_at = now();
            $conversation->unread_count_user += 1;
            $conversation->save();

            Log::info('Mensagem enviada', [
                'message_id' => $message->id,
                'conversation_id' => $conversation->id,
                'supplier_id' => $supplier->id
            ]);

            return response()->json([
                'success' => true,
                'message' => $message
            ], 201);
        } catch (\Exception $e) {
            Log::error('Erro ao enviar mensagem: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Erro ao enviar mensagem'], 500);
        }
    }
}




