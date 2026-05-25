<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ThalamusSmartwatchClient
{
    protected function baseUrl(): string
    {
        return rtrim((string) config('services.thalamus_smartwatch.base_url'), '/');
    }

    /** Base da API Thalamus (ex.: …/api), usada para montar URLs e proxy. */
    public function mediaBaseUrl(): string
    {
        return $this->baseUrl();
    }

    public function getAccessToken(bool $forceRefresh = false): string
    {
        $cacheKey = 'thalamus_sw_access_token';
        if (!$forceRefresh && Cache::has($cacheKey)) {
            return (string) Cache::get($cacheKey);
        }

        $user = config('services.thalamus_smartwatch.username');
        $pass = config('services.thalamus_smartwatch.password');
        if (!is_string($user) || $user === '' || !is_string($pass)) {
            throw new \RuntimeException('Credenciais Thalamus não configuradas (THALAMUS_SW_USERNAME / THALAMUS_SW_PASSWORD).');
        }

        $loginUrl = config('services.thalamus_smartwatch.login_url');
        $url = is_string($loginUrl) && trim($loginUrl) !== ''
            ? trim($loginUrl)
            : ($this->baseUrl().'/auth/token');

        $response = Http::timeout(30)
            ->acceptJson()
            ->asJson()
            ->post($url, [
                'username' => $user,
                'password' => $pass,
            ]);

        if (!$response->successful()) {
            Log::warning('Thalamus login falhou', [
                'status' => $response->status(),
                'body' => $response->body(),
                'url' => $url,
            ]);
            throw new \RuntimeException('Falha ao autenticar na API Thalamus: HTTP '.$response->status());
        }

        $data = $response->json();
        $token = $this->extractTokenFromLoginResponse($data, $response->body());

        $ttlSeconds = (int) config('services.thalamus_smartwatch.token_cache_ttl', 3300);
        Cache::put($cacheKey, $token, now()->addSeconds(max(60, $ttlSeconds)));

        return $token;
    }

    /**
     * Extrai JWT ou token string da resposta de /auth/token.
     *
     * @param  mixed  $data
     */
    protected function extractTokenFromLoginResponse($data, string $rawBody): string
    {
        $candidates = [];
        if (is_array($data)) {
            $candidates[] = data_get($data, 'access_token');
            $candidates[] = data_get($data, 'accessToken');
            $candidates[] = data_get($data, 'token');
            $candidates[] = data_get($data, 'jwt');
            $candidates[] = data_get($data, 'data.access_token');
            $candidates[] = data_get($data, 'data.accessToken');
            $candidates[] = data_get($data, 'data.token');
        }

        foreach ($candidates as $candidate) {
            if (is_string($candidate) && $candidate !== '') {
                return trim($candidate);
            }
        }

        $trimmed = trim($rawBody);
        if ($trimmed !== '' && str_starts_with($trimmed, 'ey')) {
            return $trimmed;
        }

        Log::warning('Thalamus login: resposta sem token reconhecido', ['body' => $rawBody]);

        throw new \RuntimeException('Resposta de login Thalamus sem token (JWT). Verifique o formato JSON da API.');
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function getAuthorizedDevices(): array
    {
        $token = $this->getAccessToken();
        $path = trim((string) config('services.thalamus_smartwatch.authorized_devices_path', 'authorized-devices'), '/');
        $url = $this->baseUrl().'/'.$path;

        $response = Http::timeout(30)
            ->acceptJson()
            ->withToken($token)
            ->get($url);

        if ($response->status() === 401) {
            $token = $this->getAccessToken(true);
            $response = Http::timeout(30)
                ->acceptJson()
                ->withToken($token)
                ->get($url);
        }

        if (!$response->successful()) {
            Log::warning('Thalamus authorized-devices falhou', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            throw new \RuntimeException('Falha ao listar dispositivos Thalamus: HTTP '.$response->status());
        }

        $data = $response->json();
        $list = $this->unwrapDeviceList($data);

        return array_values(array_filter($list, 'is_array'));
    }

    /**
     * Mapa imei (string) => linha bruta da API, para enriquecer dispositivos locais na listagem.
     *
     * @return array<string, array<string, mixed>>
     */
    public function authorizedDevicesByImei(): array
    {
        $byImei = [];
        foreach ($this->getAuthorizedDevices() as $row) {
            if (!is_array($row)) {
                continue;
            }
            $imei = data_get($row, 'imei');
            if ($imei === null || $imei === '') {
                continue;
            }
            $byImei[(string) $imei] = $row;
        }

        return $byImei;
    }

    /**
     * Percentagem de bateria mais recente (chave lastBatteryPercentage em authorized-devices).
     */
    public function getLastBatteryPercentageForImei(string $imei): ?int
    {
        $imei = trim($imei);
        if ($imei === '') {
            return null;
        }

        try {
            $byImei = $this->authorizedDevicesByImei();
            $row = $byImei[$imei] ?? null;
            if (! is_array($row)) {
                return null;
            }
            $raw = data_get($row, 'lastBatteryPercentage');
            if ($raw === null || $raw === '') {
                return null;
            }
            if (! is_numeric($raw)) {
                return null;
            }
            $n = (int) round((float) $raw);

            return max(0, min(100, $n));
        } catch (\Throwable $e) {
            Log::debug('Thalamus: lastBatteryPercentage indisponível', [
                'imei' => $imei,
                'message' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Chama a API Thalamus para vincular o dispositivo (id numérico na plataforma) ao grupo,
     * quando THALAMUS_SW_ASSOCIATE_ENABLED=true e THALAMUS_SW_ASSOCIATE_PATH estiver definido.
     *
     * @throws \RuntimeException
     */
    public function associateDeviceWithGroupIfConfigured(int $thalamusDeviceId, string $groupIdentifierForApi): void
    {
        if (!config('services.thalamus_smartwatch.associate_enabled')) {
            return;
        }

        $pathTemplate = config('services.thalamus_smartwatch.associate_path');
        if (!is_string($pathTemplate) || trim($pathTemplate) === '') {
            Log::info('Thalamus: associação ignorada — configure THALAMUS_SW_ASSOCIATE_PATH.');

            return;
        }

        if ($thalamusDeviceId < 1) {
            throw new \RuntimeException('ID do dispositivo na API Thalamus inválido.');
        }

        $path = strtr(trim($pathTemplate), [
            '{deviceId}' => (string) $thalamusDeviceId,
            '{device_id}' => (string) $thalamusDeviceId,
        ]);
        $url = $this->baseUrl().'/'.ltrim($path, '/');
        $method = strtoupper((string) config('services.thalamus_smartwatch.associate_method', 'POST'));
        $key = (string) config('services.thalamus_smartwatch.associate_group_json_key', 'groupId');
        $token = $this->getAccessToken();
        $body = [$key => $groupIdentifierForApi];

        $pending = Http::timeout(45)->acceptJson()->asJson()->withToken($token);
        $response = match ($method) {
            'PUT' => $pending->put($url, $body),
            'PATCH' => $pending->patch($url, $body),
            default => $pending->post($url, $body),
        };

        if (!$response->successful()) {
            Log::warning('Thalamus: falha ao associar dispositivo ao grupo', [
                'status' => $response->status(),
                'body' => $response->body(),
                'url' => $url,
            ]);
            throw new \RuntimeException('Falha ao associar dispositivo ao grupo na API Thalamus: HTTP '.$response->status());
        }
    }

    /**
     * @param  mixed  $data
     * @return list<array<string, mixed>>
     */
    protected function unwrapDeviceList($data): array
    {
        if (!is_array($data)) {
            return [];
        }

        if (isset($data['data']) && is_array($data['data'])) {
            $inner = $data['data'];
            if ($this->looksLikeDeviceRow($inner)) {
                return [$inner];
            }

            return $inner;
        }

        if ($this->looksLikeDeviceRow($data)) {
            return [$data];
        }

        return $data;
    }

    /**
     * @param  array<string, mixed>  $row
     */
    protected function looksLikeDeviceRow(array $row): bool
    {
        return array_key_exists('imei', $row) || array_key_exists('description', $row);
    }

    /**
     * @param  array<string, mixed>  $row
     * @return array<string, string|null>
     */
    public function mapDeviceRow(array $row): array
    {
        $description = data_get($row, 'description');
        $imei = data_get($row, 'imei');
        $status = data_get($row, 'status');
        $parserModel = data_get($row, 'parserModel') ?? data_get($row, 'parser_model');

        $descStr = $description !== null ? (string) $description : null;
        $imeiStr = $imei !== null ? (string) $imei : null;
        $statusStr = $status !== null ? (string) $status : null;
        $modelStr = $parserModel !== null ? (string) $parserModel : null;

        return [
            'description' => $descStr,
            'imei' => $imeiStr,
            'status' => $statusStr,
            'parser_model' => $modelStr,
            'nickname' => $descStr,
            'identifier' => $imeiStr,
            'modelo' => $modelStr,
            'thalamus_id' => data_get($row, 'id') !== null ? (int) data_get($row, 'id') : null,
        ];
    }

    /**
     * Alertas SOS recentes do relógio: GET /api/health/{imei}/sos-alerts
     *
     * @return array{ok: bool, status: int, data: mixed|null, body: string}
     */
    public function getSosAlerts(string $imei): array
    {
        $imei = trim($imei);
        if ($imei === '') {
            throw new \InvalidArgumentException('IMEI do relógio vazio.');
        }

        $escaped = rawurlencode($imei);

        return $this->getAuthenticated("health/{$escaped}/sos-alerts");
    }

    /**
     * Envia comando semântico ao relógio: POST /api/devices/{imei}/command
     *
     * @param  array<string, mixed>  $command
     * @return array{ok: bool, status: int, data: mixed|null, body: string}
     */
    public function sendDeviceCommand(string $imei, array $command): array
    {
        $imei = trim($imei);
        if ($imei === '') {
            throw new \InvalidArgumentException('IMEI do relógio vazio.');
        }

        $escaped = rawurlencode($imei);
        $url = $this->baseUrl().'/devices/'.$escaped.'/command';

        $post = function (string $token) use ($url, $command) {
            return Http::timeout(45)
                ->acceptJson()
                ->asJson()
                ->withToken($token)
                ->post($url, $command);
        };

        $token = $this->getAccessToken();
        $response = $post($token);

        if ($response->status() === 401) {
            $token = $this->getAccessToken(true);
            $response = $post($token);
        }

        return [
            'ok' => $response->successful(),
            'status' => $response->status(),
            'data' => $response->json(),
            'body' => $response->body(),
        ];
    }

    /**
     * Cancela SOS no relógio via comando RAW configurável (THALAMUS_SW_SOS_DISARM_PAYLOAD).
     */
    public function disarmWatchSos(string $imei): array
    {
        $payload = config('services.thalamus_smartwatch.sos_disarm_payload');
        if (! is_array($payload) || empty($payload)) {
            return [
                'ok' => false,
                'status' => 0,
                'data' => null,
                'body' => 'Comando de desarme não configurado (THALAMUS_SW_SOS_DISARM_PAYLOAD).',
            ];
        }

        return $this->sendDeviceCommand($imei, $payload);
    }

    /**
     * Solicita leitura imediata de sinais vitais no relógio (Thalamus sendCommand).
     *
     * @return array{ok: bool, parser_model: string|null, commands: list<array<string, mixed>>}
     */
    public function requestImmediateHealthReading(string $imei, ?string $parserModel = null): array
    {
        $imei = trim($imei);
        if ($imei === '') {
            throw new \InvalidArgumentException('IMEI do relógio vazio.');
        }

        if ($parserModel === null || trim($parserModel) === '') {
            try {
                $row = $this->authorizedDevicesByImei()[$imei] ?? null;
                if (is_array($row)) {
                    $parserModel = data_get($row, 'parserModel') ?? data_get($row, 'parser_model');
                }
            } catch (\Throwable $e) {
                Log::debug('Thalamus: parser_model indisponível para measure-now', [
                    'imei' => $imei,
                    'message' => $e->getMessage(),
                ]);
            }
        }

        $commands = $this->healthMeasureNowCommandsForModel(
            is_string($parserModel) ? $parserModel : null
        );

        $results = [];
        $anyOk = false;

        foreach ($commands as $command) {
            if (! is_array($command) || empty($command['action'])) {
                continue;
            }

            $r = $this->sendDeviceCommand($imei, $command);
            $results[] = [
                'command' => $command,
                'ok' => $r['ok'] ?? false,
                'status' => $r['status'] ?? 0,
                'body' => mb_substr((string) ($r['body'] ?? ''), 0, 500),
            ];

            if ($r['ok'] ?? false) {
                $anyOk = true;
            }

            if (($r['status'] ?? 0) === 404) {
                break;
            }
        }

        return [
            'ok' => $anyOk,
            'parser_model' => is_string($parserModel) ? $parserModel : null,
            'commands' => $results,
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    protected function healthMeasureNowCommandsForModel(?string $parserModel): array
    {
        $map = config('services.thalamus_smartwatch.health_measure_now_commands');
        if (! is_array($map)) {
            $map = [];
        }

        $default = $map['default'] ?? [['action' => 'RAW', 'payload' => 'CR']];
        if (! is_array($default)) {
            $default = [['action' => 'RAW', 'payload' => 'CR']];
        }

        if ($parserModel === null || trim($parserModel) === '') {
            return $default;
        }

        $needle = strtolower(trim($parserModel));
        foreach ($map as $key => $commands) {
            if ($key === 'default' || ! is_string($key)) {
                continue;
            }
            if (str_contains($needle, strtolower($key))) {
                return is_array($commands) ? $commands : $default;
            }
        }

        return $default;
    }

    /**
     * GET autenticado na API Thalamus com retry de token em 401.
     *
     * @return array{ok: bool, status: int, data: mixed|null, body: string}
     */
    public function getAuthenticated(string $relativePath): array
    {
        $relativePath = ltrim((string) $relativePath, '/');
        $url = $this->baseUrl().'/'.$relativePath;

        $do = function (string $token) use ($url) {
            return Http::timeout(45)
                ->acceptJson()
                ->withToken($token)
                ->get($url);
        };

        $token = $this->getAccessToken();
        $response = $do($token);

        if ($response->status() === 401) {
            $token = $this->getAccessToken(true);
            $response = $do($token);
        }

        return [
            'ok' => $response->successful(),
            'status' => $response->status(),
            'data' => $response->json(),
            'body' => $response->body(),
        ];
    }

    /**
     * Agrega os endpoints /health/{imei}/… usados no app (proxy Laravel).
     *
     * @return array<string, mixed>
     */
    public function getHealthBundleForImei(string $imei): array
    {
        $imei = trim($imei);
        if ($imei === '') {
            throw new \InvalidArgumentException('IMEI do relógio vazio.');
        }

        $escaped = rawurlencode($imei);
        $paths = [
            'comprehensive_health' => "health/{$escaped}/comprehensive-health",
            'heart_rates' => "health/{$escaped}/heart-rates",
            'blood_pressures' => "health/{$escaped}/blood-pressures",
            'heartbeats' => "health/{$escaped}/heartbeats",
            'oxygen_levels' => "health/{$escaped}/oxygen-levels",
            'body_temperatures' => "health/{$escaped}/body-temperatures",
            'fall_down_alerts' => "health/{$escaped}/fall-down-alerts",
            'ecg_data' => "health/{$escaped}/ecg-data",
            'sleep_sessions' => "health/{$escaped}/sleep-sessions",
            'sleep_entries' => "health/{$escaped}/sleep-entries",
        ];

        $out = [];
        foreach ($paths as $key => $path) {
            try {
                $r = $this->getAuthenticated($path);
                $out[$key] = [
                    'ok' => $r['ok'],
                    'status' => $r['status'],
                    'data' => $r['data'],
                ];
                if (! $r['ok']) {
                    Log::warning('Thalamus health endpoint falhou', [
                        'key' => $key,
                        'path' => $path,
                        'status' => $r['status'],
                        'snippet' => mb_substr($r['body'], 0, 500),
                    ]);
                }
            } catch (\Throwable $e) {
                Log::error('Thalamus health endpoint exceção', [
                    'key' => $key,
                    'path' => $path,
                    'message' => $e->getMessage(),
                ]);
                $out[$key] = [
                    'ok' => false,
                    'status' => 0,
                    'data' => null,
                    'error' => $e->getMessage(),
                ];
            }
        }

        return $out;
    }

    /**
     * Lista áudios do dispositivo (Thalamus): GET /api/devices/{imei}/audios?limit=...
     *
     * @return array{ok: bool, status: int, data: mixed|null, body: string}
     */
    public function getDeviceAudios(string $imei, int $limit = 20): array
    {
        $imei = trim($imei);
        if ($imei === '') {
            throw new \InvalidArgumentException('IMEI do relógio vazio.');
        }
        $limit = max(1, min(100, $limit));
        $escaped = rawurlencode($imei);
        $path = 'devices/'.$escaped.'/audios?limit='.$limit;

        return $this->getAuthenticated($path);
    }

    /**
     * Localização do dispositivo (Thalamus). Padrão: GET health/{imei}/locations (= {{baseUrl}}/api/health/{imei}/locations).
     *
     * @return array{ok: bool, status: int, data: mixed|null, body: string}
     */
    public function getDeviceLocations(string $imei, int $limit = 11): array
    {
        $imei = trim($imei);
        if ($imei === '') {
            throw new \InvalidArgumentException('IMEI do relógio vazio.');
        }
        $limit = max(1, min(50, $limit));
        $escaped = rawurlencode($imei);
        $custom = config('services.thalamus_smartwatch.locations_path');
        if (is_string($custom) && trim($custom) !== '') {
            $path = strtr(trim($custom), [
                '{imei}' => $escaped,
                '{limit}' => (string) $limit,
            ]);
        } else {
            $path = 'health/'.$escaped.'/locations';
        }

        return $this->getAuthenticated($path);
    }

    /**
     * Envia arquivo de áudio ao relógio (Thalamus): POST /api/devices/{imei}/audios/send (multipart, campo "file").
     *
     * @return array{ok: bool, status: int, data: mixed|null, body: string}
     */
    public function sendDeviceAudio(string $imei, string $absoluteFilePath, string $originalName, ?string $mime): array
    {
        $imei = trim($imei);
        if ($imei === '' || ! is_readable($absoluteFilePath)) {
            throw new \InvalidArgumentException('IMEI ou arquivo de áudio inválido.');
        }

        $escaped = rawurlencode($imei);
        $path = 'devices/'.$escaped.'/audios/send';
        $url = $this->baseUrl().'/'.ltrim($path, '/');
        $mime = (is_string($mime) && $mime !== '') ? $mime : 'application/octet-stream';
        $basename = (is_string($originalName) && $originalName !== '') ? $originalName : 'audio.amr';

        $post = function (string $token) use ($url, $absoluteFilePath, $basename, $mime) {
            $contents = file_get_contents($absoluteFilePath);
            if ($contents === false) {
                throw new \RuntimeException('Não foi possível ler o arquivo de áudio.');
            }

            return Http::timeout(120)
                ->withToken($token)
                ->attach('file', $contents, $basename, ['Content-Type' => $mime])
                ->post($url);
        };

        $token = $this->getAccessToken();
        $response = $post($token);

        if ($response->status() === 401) {
            $token = $this->getAccessToken(true);
            $response = $post($token);
        }

        return [
            'ok' => $response->successful(),
            'status' => $response->status(),
            'data' => $response->json(),
            'body' => $response->body(),
        ];
    }

    /**
     * Baixa recurso de mídia na Thalamus com Bearer (path relativo à base ou URL absoluta).
     */
    public function fetchMedia(string $relativePathOrAbsoluteUrl): \Illuminate\Http\Client\Response
    {
        $trimmed = trim($relativePathOrAbsoluteUrl);
        if ($trimmed === '') {
            throw new \InvalidArgumentException('URL de mídia vazia.');
        }

        $isAbsolute = preg_match('#^https?://#i', $trimmed) === 1;
        $url = $isAbsolute ? $trimmed : ($this->baseUrl().'/'.ltrim($trimmed, '/'));

        $request = function (string $token) use ($url) {
            return Http::timeout(180)
                ->withHeaders([
                    // Evita Accept: application/json implícito — alguns gateways devolvem 406/JSON em stream.
                    'Accept' => 'audio/*, application/octet-stream, */*;q=0.8',
                ])
                ->withToken($token)
                ->get($url);
        };

        $token = $this->getAccessToken();
        $response = $request($token);

        if ($response->status() === 401) {
            $token = $this->getAccessToken(true);
            $response = $request($token);
        }

        return $response;
    }

    /**
     * Stream binário de um áudio por id (Thalamus): GET …/device-audios/{audioId}/stream
     * Template opcional em config: placeholders {audioId}, {id}, {imei}.
     */
    public function streamDeviceAudioById(string $audioId, ?string $deviceImei = null): \Illuminate\Http\Client\Response
    {
        $audioId = trim($audioId);
        if ($audioId === '') {
            throw new \InvalidArgumentException('audioId vazio.');
        }

        $tpl = config('services.thalamus_smartwatch.device_audio_stream_path');
        if (! is_string($tpl) || trim($tpl) === '') {
            $tpl = 'device-audios/{audioId}/stream';
        }
        // Segmento de path: só codificar se houver caracteres não seguros (alguns servidores falham com UUID %codificado).
        $segment = preg_match('/^[a-zA-Z0-9._~-]+$/', $audioId) === 1 ? $audioId : rawurlencode($audioId);
        $imeiSeg = '';
        if (is_string($deviceImei) && trim($deviceImei) !== '') {
            $im = trim($deviceImei);
            $imeiSeg = preg_match('/^[a-zA-Z0-9._~-]+$/', $im) === 1 ? $im : rawurlencode($im);
        }
        $path = strtr(trim($tpl), [
            '{audioId}' => $segment,
            '{id}' => $segment,
            '{imei}' => $imeiSeg,
        ]);

        return $this->fetchMedia($path);
    }

    /**
     * Converte URL de mídia relativa da API Thalamus em absoluta.
     */
    public function absolutizeMediaUrl(?string $url): ?string
    {
        if (! is_string($url) || $url === '') {
            return $url;
        }
        if (preg_match('#^https?://#i', $url)) {
            return $url;
        }
        $base = rtrim($this->baseUrl(), '/');

        return $base.'/'.ltrim($url, '/');
    }
}
