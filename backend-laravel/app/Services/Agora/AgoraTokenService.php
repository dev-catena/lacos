<?php

namespace App\Services\Agora;

class AgoraTokenService
{
    private static bool $loaded = false;

    public function __construct()
    {
        self::loadSdk();
    }

    private static function loadSdk(): void
    {
        if (self::$loaded) {
            return;
        }

        $base = app_path('Services/Agora');
        require_once $base.'/Util.php';
        require_once $base.'/AccessToken2.php';
        require_once $base.'/RtcTokenBuilder2.php';
        self::$loaded = true;
    }

    public function getChannelName(int $appointmentId): string
    {
        return 'consulta-'.$appointmentId;
    }

    public function toAgoraUid(int $userId): int
    {
        if ($userId <= 0) {
            return random_int(100000, 999999);
        }

        $n = $userId % 2147483647;

        return $n ?: 1;
    }

    /**
     * Token RTC v2. Retorna string vazia se AGORA_APP_CERTIFICATE não estiver configurado (modo teste).
     */
    public function buildRtcToken(string $channelName, int $uid, int $expireSeconds = 3600): string
    {
        $appId = config('services.agora.app_id');
        $certificate = config('services.agora.app_certificate');

        if (empty($certificate)) {
            return '';
        }

        return \RtcTokenBuilder2::buildTokenWithUid(
            $appId,
            $certificate,
            $channelName,
            $uid,
            \RtcTokenBuilder2::ROLE_PUBLISHER,
            $expireSeconds,
            $expireSeconds
        );
    }
}
