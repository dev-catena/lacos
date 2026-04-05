<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class NotificationController extends Controller
{
    /**
     * Buscar notificações do usuário autenticado
     * GET /api/notifications
     */
    public function index(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuário não autenticado',
                ], 401);
            }

            $read = $request->query('read'); // null, true, false
            $limit = $request->query('limit', 50);

            $query = Notification::where('user_id', $user->id)
                ->orderBy('created_at', 'desc');

            // Filtrar por status de leitura se fornecido
            if ($read !== null) {
                $query->where('read', filter_var($read, FILTER_VALIDATE_BOOLEAN));
            }

            $notifications = $query->limit($limit)->get();

            return response()->json([
                'success' => true,
                'data' => $notifications,
                'count' => $notifications->count(),
                'unread_count' => Notification::where('user_id', $user->id)
                    ->where('read', false)
                    ->count(),
            ]);
        } catch (\Exception $e) {
            Log::error('Erro ao buscar notificações: ' . $e->getMessage(), [
                'user_id' => Auth::id(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erro ao buscar notificações',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Marcar notificação como lida
     * PUT /api/notifications/{id}/read
     */
    public function markAsRead($id)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuário não autenticado',
                ], 401);
            }

            $notification = Notification::where('id', $id)
                ->where('user_id', $user->id)
                ->firstOrFail();

            $notification->markAsRead();

            return response()->json([
                'success' => true,
                'message' => 'Notificação marcada como lida',
                'data' => $notification,
            ]);
        } catch (\Exception $e) {
            Log::error('Erro ao marcar notificação como lida: ' . $e->getMessage(), [
                'user_id' => Auth::id(),
                'notification_id' => $id,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erro ao marcar notificação como lida',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Marcar todas as notificações como lidas
     * PUT /api/notifications/mark-all-read
     */
    public function markAllAsRead()
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuário não autenticado',
                ], 401);
            }

            $updated = Notification::where('user_id', $user->id)
                ->where('read', false)
                ->update([
                    'read' => true,
                    'read_at' => now(),
                ]);

            return response()->json([
                'success' => true,
                'message' => "{$updated} notificação(ões) marcada(s) como lida(s)",
                'count' => $updated,
            ]);
        } catch (\Exception $e) {
            Log::error('Erro ao marcar todas as notificações como lidas: ' . $e->getMessage(), [
                'user_id' => Auth::id(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erro ao marcar notificações como lidas',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Obter contador de notificações não lidas
     * GET /api/notifications/unread-count
     */
    public function unreadCount()
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuário não autenticado',
                ], 401);
            }

            $count = Notification::where('user_id', $user->id)
                ->where('read', false)
                ->count();

            Log::info('NotificationController::unreadCount', [
                'user_id' => $user->id,
                'user_name' => $user->name,
                'count' => $count,
            ]);

            return response()->json([
                'success' => true,
                'count' => $count,
            ]);
        } catch (\Exception $e) {
            Log::error('Erro ao contar notificações não lidas: ' . $e->getMessage(), [
                'user_id' => Auth::id(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erro ao contar notificações',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Deletar notificação individual
     * DELETE /api/notifications/{id}
     */
    public function destroy($id)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuário não autenticado',
                ], 401);
            }

            $notification = Notification::where('id', $id)
                ->where('user_id', $user->id)
                ->firstOrFail();

            $notification->delete();

            return response()->json([
                'success' => true,
                'message' => 'Notificação excluída com sucesso',
            ]);
        } catch (\Exception $e) {
            Log::error('Erro ao deletar notificação: ' . $e->getMessage(), [
                'user_id' => Auth::id(),
                'notification_id' => $id,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erro ao deletar notificação',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Deletar todas as notificações
     * DELETE /api/notifications
     */
    public function destroyAll()
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuário não autenticado',
                ], 401);
            }

            $deleted = Notification::where('user_id', $user->id)->delete();

            return response()->json([
                'success' => true,
                'message' => "{$deleted} notificação(ões) excluída(s)",
                'count' => $deleted,
            ]);
        } catch (\Exception $e) {
            Log::error('Erro ao deletar todas as notificações: ' . $e->getMessage(), [
                'user_id' => Auth::id(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erro ao deletar notificações',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
}
