<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use App\Services\WhatsAppService;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    protected $whatsappService;

    public function __construct()
    {
        $this->whatsappService = new WhatsAppService();
    }

    /**
     * Enviar notificação para um usuário
     */
    public function sendNotification(User $user, string $type, string $title, string $message, array $data = [], bool $sendWhatsApp = false, $groupId = null)
    {
        try {
            // Criar notificação no banco
            $notification = Notification::create([
                'user_id' => $user->id,
                'group_id' => $groupId ?? ($data['group_id'] ?? null),
                'type' => $type,
                'title' => $title,
                'message' => $message,
                'data' => $data,
                'read' => false,
            ]);

            Log::info('Notificação criada', [
                'user_id' => $user->id,
                'type' => $type,
                'notification_id' => $notification->id,
            ]);

            // Enviar via WhatsApp se solicitado e se o usuário tiver telefone
            // NOTA: Por padrão, não enviar via WhatsApp - apenas criar notificação no banco
            if ($sendWhatsApp && $user->phone) {
                try {
                    $whatsappMessage = "🔔 *{$title}*\n\n{$message}";
                    $result = $this->whatsappService->sendMessage($user->phone, $whatsappMessage);
                    
                    if ($result['success']) {
                        Log::info('Notificação enviada via WhatsApp', [
                            'user_id' => $user->id,
                            'notification_id' => $notification->id,
                        ]);
                    }
                } catch (\Exception $e) {
                    Log::warning('Erro ao enviar notificação via WhatsApp', [
                        'user_id' => $user->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            return $notification;
        } catch (\Exception $e) {
            Log::error('Erro ao criar notificação: ' . $e->getMessage(), [
                'user_id' => $user->id ?? null,
                'type' => $type,
                'trace' => $e->getTraceAsString(),
            ]);

            return null;
        }
    }

    /**
     * Verificar se usuário tem preferência de notificação habilitada
     */
    public function hasNotificationPreference(User $user, string $preferenceKey): bool
    {
        $preferences = $user->notificationPreferences;
        
        if (!$preferences) {
            // Se não tem preferências, retornar true (padrão)
            return true;
        }

        return $preferences->$preferenceKey ?? true;
    }

    /**
     * Aviso de novo agendamento criado no grupo (por outro membro).
     * Não usar só appointment_reminders: no app é "Lembretes de consultas" (antes do horário).
     * Considera também group_changes e group_member_added (atividade no grupo).
     */
    public function shouldNotifyNewGroupAppointment(User $user): bool
    {
        $preferences = $user->notificationPreferences;
        if (!$preferences) {
            return true;
        }

        $memberAdded = $preferences->group_member_added ?? true;
        $groupUpdates = $preferences->group_changes ?? false;
        $reminders = $preferences->appointment_reminders ?? true;

        return $memberAdded || $groupUpdates || $reminders;
    }
}

