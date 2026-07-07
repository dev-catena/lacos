<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class ExternalMailController extends Controller
{
    /**
     * Envia e-mail de convite para o Lacos a pedido do spec-hospital-backend.
     * Protegido pela mesma API Key usada nos demais endpoints externos.
     *
     * POST /api/external/send-invite-email
     * Body: { to, to_name, baby_name, invite_url, expires_at }
     */
    public function sendInviteEmail(Request $request)
    {
        $request->validate([
            'to'         => 'required|email|max:255',
            'to_name'    => 'nullable|string|max:255',
            'baby_name'  => 'required|string|max:255',
            'invite_url' => 'required|url|max:2048',
            'expires_at' => 'nullable|string|max:60',
        ]);

        $to        = $request->input('to');
        $toName    = $request->input('to_name', 'Mae');
        $babyName  = $request->input('baby_name');
        $inviteUrl = $request->input('invite_url');
        $expiresAt = $request->input('expires_at', '48 horas');

        try {
            Mail::send('emails.spec-invite-link', [
                'motherName' => $toName,
                'babyName'   => $babyName,
                'inviteUrl'  => $inviteUrl,
                'expiresAt'  => $expiresAt,
            ], function ($msg) use ($to, $toName, $babyName) {
                $msg->to($to, $toName)
                    ->subject('Convite: acompanhe ' . $babyName . ' no Lacos Kids');
            });

            return response()->json(['message' => 'E-mail enviado com sucesso.']);
        } catch (\Throwable $e) {
            \Log::error('ExternalMailController: falha ao enviar e-mail para ' . $to . ': ' . $e->getMessage());
            return response()->json([
                'message' => 'Falha ao enviar e-mail.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }
}
