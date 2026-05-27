<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'whatsapp' => [
        'url' => env('WHATSAPP_API_URL', 'http://localhost:8080'),
        'api_key' => env('WHATSAPP_API_KEY'),
        'instance_name' => env('WHATSAPP_INSTANCE_NAME', 'lacos-2fa'),
    ],

    'twilio' => [
        'sid' => env('TWILIO_SID'),
        'token' => env('TWILIO_AUTH_TOKEN'),
        'whatsapp_from' => env('TWILIO_WHATSAPP_FROM'),
    ],

    'agora' => [
        'app_id' => env('AGORA_APP_ID', '75ae244af79944a18a059d2fcb18c1dc'),
        'app_certificate' => env('AGORA_APP_CERTIFICATE'),
    ],

    'rtmp_agent' => [
        'url' => env('RTMP_AGENT_URL', 'http://177.104.165.210:8000'),
        'username' => env('RTMP_AGENT_USERNAME'),
        'password' => env('RTMP_AGENT_PASSWORD'),
        'timeout' => (int) env('RTMP_AGENT_TIMEOUT', 10),
        /** Proxy HTTPS no gateway → MediaMTX WHEP (porta 8890). */
        'whep_public_url' => env('RTMP_AGENT_WHEP_PUBLIC_URL', 'https://gateway.lacosapp.com/rtmp-whep'),
    ],

    'thalamus_smartwatch' => [
        'base_url' => env('THALAMUS_SW_BASE_URL', 'https://smartwatchwebserver.thalamus.ind.br/api'),
        /** POST JSON { username, password } — padrão {base_url}/auth/token */
        'login_url' => env('THALAMUS_SW_LOGIN_URL', 'https://smartwatchwebserver.thalamus.ind.br/api/auth/token'),
        'username' => env('THALAMUS_SW_USERNAME'),
        'password' => env('THALAMUS_SW_PASSWORD'),
        'authorized_devices_path' => env('THALAMUS_SW_DEVICES_PATH', 'authorized-devices'),
        'token_cache_ttl' => (int) env('THALAMUS_SW_TOKEN_CACHE_TTL', 3300),
        /** Associação dispositivo → grupo na API Thalamus (configure path conforme documentação) */
        'associate_enabled' => filter_var(env('THALAMUS_SW_ASSOCIATE_ENABLED', false), FILTER_VALIDATE_BOOLEAN),
        'associate_method' => env('THALAMUS_SW_ASSOCIATE_METHOD', 'POST'),
        /** Path relativo à base, ex.: devices/{deviceId}/groups — use {deviceId} */
        'associate_path' => env('THALAMUS_SW_ASSOCIATE_PATH'),
        /** Chave JSON do corpo, ex.: groupId */
        'associate_group_json_key' => env('THALAMUS_SW_ASSOCIATE_GROUP_KEY', 'groupId'),
        /** Path rel. à base para stream de áudio: placeholder {audioId} — ex.: device-audios/{audioId}/stream */
        'device_audio_stream_path' => env('THALAMUS_SW_DEVICE_AUDIO_STREAM_PATH', 'device-audios/{audioId}/stream'),
        /** Path rel. à base para localização: placeholders {imei}, {limit}. Vazio = GET health/{imei}/locations */
        'locations_path' => env('THALAMUS_SW_LOCATIONS_PATH'),
        /**
         * Comando JSON para desarmar SOS no relógio (POST devices/{imei}/command).
         * Ex.: {"action":"RAW","payload":"SOSOFF"} — ajuste conforme modelo/parser.
         */
        'health_measure_now_commands' => json_decode(
            (string) env('THALAMUS_SW_HEALTH_MEASURE_NOW_COMMANDS', ''),
            true
        ) ?: [
            'default' => [
                ['action' => 'RAW', 'payload' => 'CR'],
            ],
            'GPSWatch' => [
                ['action' => 'RAW', 'payload' => 'BP16'],
            ],
            '4PTouch' => [
                ['action' => 'RAW', 'payload' => 'CR'],
            ],
            'TOUCH_4P' => [
                ['action' => 'RAW', 'payload' => 'CR'],
            ],
        ],
    ],

];


