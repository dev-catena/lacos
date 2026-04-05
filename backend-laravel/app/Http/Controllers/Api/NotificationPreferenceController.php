<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserNotificationPreference;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class NotificationPreferenceController extends Controller
{
    /**
     * Obter preferências de notificação do usuário autenticado
     * GET /api/notification-preferences
     */
    public function index()
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuário não autenticado',
                ], 401);
            }

            $preferences = UserNotificationPreference::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'appointment_patient_notification' => true,
                    'vital_signs_basal_change' => true,
                    'medication_reminders' => true,
                    'medication_late_alerts' => true,
                    'medication_running_out' => true,
                    'appointment_reminders' => true,
                    'appointment_confirmation' => true,
                    'appointment_cancellation' => true,
                    'vital_signs_alerts' => true,
                    'vital_signs_abnormal' => true,
                    'vital_signs_reminders' => false,
                    'group_invites' => true,
                    'group_member_added' => true,
                    'group_changes' => false,
                    'system_updates' => true,
                    'news_and_tips' => false,
                    'email_notifications' => true,
                ]
            );

            return response()->json([
                'success' => true,
                'data' => $preferences,
            ]);
        } catch (\Exception $e) {
            Log::error('Erro ao buscar preferências de notificação: ' . $e->getMessage(), [
                'user_id' => Auth::id(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erro ao buscar preferências',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Atualizar preferências de notificação
     * PUT /api/notification-preferences
     */
    public function update(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuário não autenticado',
                ], 401);
            }

            $validated = $request->validate([
                'appointment_patient_notification' => 'sometimes|boolean',
                'vital_signs_basal_change' => 'sometimes|boolean',
                'medication_reminders' => 'sometimes|boolean',
                'medication_late_alerts' => 'sometimes|boolean',
                'medication_running_out' => 'sometimes|boolean',
                'appointment_reminders' => 'sometimes|boolean',
                'appointment_confirmation' => 'sometimes|boolean',
                'appointment_cancellation' => 'sometimes|boolean',
                'vital_signs_alerts' => 'sometimes|boolean',
                'vital_signs_abnormal' => 'sometimes|boolean',
                'vital_signs_reminders' => 'sometimes|boolean',
                'group_invites' => 'sometimes|boolean',
                'group_member_added' => 'sometimes|boolean',
                'group_changes' => 'sometimes|boolean',
                'system_updates' => 'sometimes|boolean',
                'news_and_tips' => 'sometimes|boolean',
                'email_notifications' => 'sometimes|boolean',
            ]);

            $preferences = UserNotificationPreference::updateOrCreate(
                ['user_id' => $user->id],
                $validated
            );

            Log::info('Preferências de notificação atualizadas', [
                'user_id' => $user->id,
                'preferences' => $validated,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Preferências atualizadas com sucesso',
                'data' => $preferences,
            ]);
        } catch (\Exception $e) {
            Log::error('Erro ao atualizar preferências de notificação: ' . $e->getMessage(), [
                'user_id' => Auth::id(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erro ao atualizar preferências',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
}
