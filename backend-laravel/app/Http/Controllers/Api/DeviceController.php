<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Device;
use App\Models\Group;
use App\Services\ThalamusSmartwatchClient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;

class DeviceController extends Controller
{
    protected function deviceIdentifierRules(?int $ignoreId = null, bool $required = true): array
    {
        $unique = 'unique:devices,identifier';
        if ($ignoreId !== null) {
            $unique .= ','.$ignoreId;
        }

        $rules = ['string', 'max:128', $unique];
        if ($required) {
            array_unshift($rules, 'required');
        } else {
            array_unshift($rules, 'sometimes');
        }

        return $rules;
    }

    /**
     * Mescla nome, status e modelo exibidos com a API Thalamus quando o identificador local = imei cadastrado lá.
     *
     * @param  array<string, array<string, mixed>>  $thalamusByImei
     * @return array{nickname: string, status: string|null, parser_model: string|null}
     */
    protected function overlaySmartwatchFromThalamus(Device $device, array $thalamusByImei): array
    {
        $out = [
            'nickname' => $device->nickname,
            'status' => $device->status,
            'parser_model' => $device->parser_model,
        ];

        if ($device->type !== 'smartwatch') {
            return $out;
        }

        $imei = (string) $device->identifier;
        if ($imei === '' || !isset($thalamusByImei[$imei])) {
            return $out;
        }

        $t = $thalamusByImei[$imei];
        $desc = data_get($t, 'description');
        if ($desc !== null && (string) $desc !== '') {
            $out['nickname'] = (string) $desc;
        }
        $st = data_get($t, 'status');
        if ($st !== null) {
            $out['status'] = (string) $st;
        }
        $pm = data_get($t, 'parserModel') ?? data_get($t, 'parser_model');
        if ($pm !== null) {
            $out['parser_model'] = (string) $pm;
        }

        return $out;
    }

    /**
     * Lista dispositivos autorizados na API Thalamus (proxy para o web-admin).
     * GET /api/admin/thalamus/authorized-devices
     */
    public function thalamusAuthorizedDevices(ThalamusSmartwatchClient $thalamus)
    {
        try {
            $user = Auth::user();
            $isRoot = ($user->is_root ?? false) || ($user->email === 'root@lacos.com') || ($user->email === 'admin@lacos.com');

            if (!$user || !$isRoot) {
                return response()->json([
                    'success' => false,
                    'message' => 'Acesso negado. Apenas usuários root podem acessar esta funcionalidade.',
                ], 403);
            }

            $raw = $thalamus->getAuthorizedDevices();
            $devices = array_map(
                fn ($row) => $thalamus->mapDeviceRow(is_array($row) ? $row : []),
                $raw
            );

            return response()->json([
                'success' => true,
                'devices' => $devices,
            ]);
        } catch (\Throwable $e) {
            Log::error('Erro ao listar dispositivos Thalamus: '.$e->getMessage());

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 502);
        }
    }

    /**
     * Lista todos os grupos (ativos) para o modal “vincular dispositivo Thalamus” no web-admin.
     * GET /api/admin/groups/device-assignment-options
     */
    public function deviceAssignmentGroups()
    {
        try {
            $user = Auth::user();
            $isRoot = ($user->is_root ?? false) || ($user->email === 'root@lacos.com') || ($user->email === 'admin@lacos.com');

            if (!$user || !$isRoot) {
                return response()->json([
                    'success' => false,
                    'message' => 'Acesso negado. Apenas usuários root podem acessar esta funcionalidade.',
                ], 403);
            }

            $q = Group::query()->with('creator')->orderBy('name');
            if (Schema::hasColumn('groups', 'is_active')) {
                $q->where('is_active', true);
            }

            $groups = $q->get()->map(function ($g) {
                return [
                    'id' => $g->id,
                    'name' => $g->name,
                    'admin_email' => $g->creator ? $g->creator->email : null,
                    'admin_name' => $g->creator ? $g->creator->name : null,
                    'patient_name' => $g->accompanied_name,
                    'thalamus_group_external_id' => $g->thalamus_group_external_id,
                ];
            });

            return response()->json([
                'success' => true,
                'groups' => $groups,
            ]);
        } catch (\Throwable $e) {
            Log::error('Erro ao listar grupos para dispositivos: '.$e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Erro ao listar grupos',
            ], 500);
        }
    }

    /**
     * Listar todos os dispositivos (admin)
     * GET /api/admin/devices
     */
    public function index()
    {
        try {
            $user = Auth::user();

            // Verificar se é root: por campo is_root ou por email root@lacos.com ou admin@lacos.com
            $isRoot = ($user->is_root ?? false) || ($user->email === 'root@lacos.com') || ($user->email === 'admin@lacos.com');

            if (!$user || !$isRoot) {
                return response()->json([
                    'success' => false,
                    'message' => 'Acesso negado. Apenas usuários root podem acessar esta funcionalidade.'
                ], 403);
            }

            $thalamusByImei = [];
            try {
                $thalamusByImei = app(ThalamusSmartwatchClient::class)->authorizedDevicesByImei();
            } catch (\Throwable $e) {
                Log::debug('Thalamus: listagem admin sem enriquecimento', ['message' => $e->getMessage()]);
            }

            $devices = Device::with(['user', 'group.creator'])
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($device) use ($thalamusByImei) {
                    $o = $this->overlaySmartwatchFromThalamus($device, $thalamusByImei);

                    return [
                        'id' => $device->id,
                        'nickname' => $o['nickname'],
                        'type' => $device->type,
                        'type_label' => $device->type_label,
                        'identifier' => $device->identifier,
                        'status' => $o['status'],
                        'parser_model' => $o['parser_model'],
                        'thalamus_device_id' => $device->thalamus_device_id,
                        'admin_email' => $device->group && $device->group->creator ? $device->group->creator->email : null,
                        'admin_name' => $device->group && $device->group->creator ? $device->group->creator->name : null,
                        'patient_name' => $device->group ? $device->group->accompanied_name : null,
                        'user_id' => $device->user_id,
                        'user_name' => $device->user ? $device->user->name : null,
                        'user_email' => $device->user ? $device->user->email : null,
                        'group_id' => $device->group_id,
                        'group_name' => $device->group ? $device->group->name : null,
                        'created_at' => $device->created_at,
                    ];
                });

            return response()->json($devices);
        } catch (\Exception $e) {
            Log::error('Erro ao listar dispositivos: ' . $e->getMessage());
            return response()->json([
                'error' => 'Erro ao buscar dispositivos',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Listar dispositivos de um grupo
     * GET /api/groups/{groupId}/devices
     */
    public function getGroupDevices($groupId)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'error' => 'Usuário não autenticado',
                    'message' => 'É necessário estar autenticado para acessar esta funcionalidade'
                ], 401);
            }
            
            // Verificar se o usuário tem acesso ao grupo
            $group = \App\Models\Group::find($groupId);
            if (!$group) {
                return response()->json([
                    'error' => 'Grupo não encontrado',
                    'message' => 'O grupo informado não existe'
                ], 404);
            }
            
            // Verificar se o usuário é membro do grupo
            $isMember = $group->members()->where('user_id', $user->id)->where('is_active', true)->exists();
            if (!$isMember) {
                return response()->json([
                    'error' => 'Acesso negado',
                    'message' => 'Você não tem permissão para acessar os dispositivos deste grupo'
                ], 403);
            }

            $thalamusByImei = [];
            try {
                $thalamusByImei = app(ThalamusSmartwatchClient::class)->authorizedDevicesByImei();
            } catch (\Throwable $e) {
                Log::debug('Thalamus: listagem grupo sem enriquecimento', ['message' => $e->getMessage()]);
            }

            $devices = Device::where('group_id', $groupId)
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($device) use ($thalamusByImei) {
                    $o = $this->overlaySmartwatchFromThalamus($device, $thalamusByImei);

                    return [
                        'id' => $device->id,
                        'nickname' => $o['nickname'],
                        'type' => $device->type,
                        'type_label' => $device->type_label,
                        'identifier' => $device->identifier,
                        'status' => $o['status'],
                        'parser_model' => $o['parser_model'],
                        'created_at' => $device->created_at,
                    ];
                });

            return response()->json($devices);
        } catch (\Exception $e) {
            Log::error('Erro ao listar dispositivos do grupo: ' . $e->getMessage());
            return response()->json([
                'error' => 'Erro ao buscar dispositivos',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Dados de saúde do relógio (API Thalamus), proxy autenticado.
     * GET /api/groups/{groupId}/smartwatch-health
     */
    public function getGroupSmartwatchHealth($groupId, ThalamusSmartwatchClient $thalamus)
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'error' => 'Usuário não autenticado',
                    'message' => 'É necessário estar autenticado para acessar esta funcionalidade',
                ], 401);
            }

            $group = Group::find($groupId);
            if (!$group) {
                return response()->json([
                    'error' => 'Grupo não encontrado',
                    'message' => 'O grupo informado não existe',
                ], 404);
            }

            $isMember = $group->members()->where('user_id', $user->id)->where('is_active', true)->exists();
            if (!$isMember) {
                return response()->json([
                    'error' => 'Acesso negado',
                    'message' => 'Você não tem permissão para acessar os dados deste grupo',
                ], 403);
            }

            $device = Device::where('group_id', $groupId)
                ->where('type', 'smartwatch')
                ->whereNotNull('identifier')
                ->where('identifier', '!=', '')
                ->orderByDesc('created_at')
                ->first();

            if (!$device) {
                return response()->json([
                    'has_smartwatch' => false,
                    'imei' => null,
                    'device_nickname' => null,
                    'health' => null,
                    'message' => 'Nenhum smartwatch com IMEI cadastrado neste grupo.',
                ]);
            }

            $imei = (string) $device->identifier;
            $bundle = $thalamus->getHealthBundleForImei($imei);
            $lastBatteryPercentage = $thalamus->getLastBatteryPercentageForImei($imei);

            return response()->json([
                'has_smartwatch' => true,
                'imei' => $imei,
                'device_nickname' => $device->nickname,
                'last_battery_percentage' => $lastBatteryPercentage,
                'health' => $bundle,
            ]);
        } catch (\Throwable $e) {
            Log::error('Erro smartwatch-health: '.$e->getMessage(), ['trace' => $e->getTraceAsString()]);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 502);
        }
    }

    /**
     * Lista de áudios do relógio (proxy Thalamus). GET /api/groups/{groupId}/smartwatch-audios?limit=20
     */
    public function getGroupSmartwatchAudios(Request $request, $groupId, ThalamusSmartwatchClient $thalamus)
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'error' => 'Usuário não autenticado',
                    'message' => 'É necessário estar autenticado para acessar esta funcionalidade',
                ], 401);
            }

            $group = Group::find($groupId);
            if (!$group) {
                return response()->json([
                    'error' => 'Grupo não encontrado',
                    'message' => 'O grupo informado não existe',
                ], 404);
            }

            $isMember = $group->members()->where('user_id', $user->id)->where('is_active', true)->exists();
            if (!$isMember) {
                return response()->json([
                    'error' => 'Acesso negado',
                    'message' => 'Você não tem permissão para acessar os dados deste grupo',
                ], 403);
            }

            $limit = (int) $request->query('limit', 20);

            $device = Device::where('group_id', $groupId)
                ->where('type', 'smartwatch')
                ->whereNotNull('identifier')
                ->where('identifier', '!=', '')
                ->orderByDesc('created_at')
                ->first();

            if (!$device) {
                return response()->json([
                    'has_smartwatch' => false,
                    'imei' => null,
                    'limit' => $limit,
                    'ok' => false,
                    'items' => [],
                    'message' => 'Nenhum smartwatch com IMEI cadastrado neste grupo.',
                ]);
            }

            $imei = (string) $device->identifier;
            $r = $thalamus->getDeviceAudios($imei, $limit);
            $items = $this->normalizeWatchAudioFeed($r['data'] ?? null, $thalamus, $imei);

            return response()->json([
                'has_smartwatch' => true,
                'imei' => $imei,
                'device_nickname' => $device->nickname,
                'limit' => max(1, min(100, $limit)),
                'ok' => $r['ok'],
                'status' => $r['status'],
                'items' => $items,
            ]);
        } catch (\Throwable $e) {
            Log::error('Erro smartwatch-audios: '.$e->getMessage(), ['trace' => $e->getTraceAsString()]);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 502);
        }
    }

    /**
     * Localização do relógio (Thalamus GET …/health/{imei}/locations). GET …/smartwatch-locations?limit=11
     */
    public function getGroupSmartwatchLocations(Request $request, $groupId, ThalamusSmartwatchClient $thalamus)
    {
        try {
            $user = Auth::user();

            if (! $user) {
                return response()->json([
                    'error' => 'Usuário não autenticado',
                    'message' => 'É necessário estar autenticado para acessar esta funcionalidade',
                ], 401);
            }

            $group = Group::find($groupId);
            if (! $group) {
                return response()->json([
                    'error' => 'Grupo não encontrado',
                    'message' => 'O grupo informado não existe',
                ], 404);
            }

            $isMember = $group->members()->where('user_id', $user->id)->where('is_active', true)->exists();
            if (! $isMember) {
                return response()->json([
                    'error' => 'Acesso negado',
                    'message' => 'Você não tem permissão para acessar os dados deste grupo',
                ], 403);
            }

            $limit = (int) $request->query('limit', 11);
            $limit = max(1, min(50, $limit));

            $device = Device::where('group_id', $groupId)
                ->where('type', 'smartwatch')
                ->whereNotNull('identifier')
                ->where('identifier', '!=', '')
                ->orderByDesc('created_at')
                ->first();

            if (! $device) {
                return response()->json([
                    'has_smartwatch' => false,
                    'imei' => null,
                    'current' => null,
                    'points' => [],
                    'message' => 'Nenhum smartwatch com IMEI cadastrado neste grupo.',
                ]);
            }

            $imei = (string) $device->identifier;
            $r = $thalamus->getDeviceLocations($imei, $limit);
            $points = array_slice($this->normalizeThalamusLocationPoints($r['data'] ?? null), 0, $limit);
            $current = count($points) > 0 ? $points[0] : null;

            return response()->json([
                'has_smartwatch' => true,
                'imei' => $imei,
                'device_nickname' => $device->nickname,
                'limit' => $limit,
                'ok' => $r['ok'],
                'thalamus_status' => $r['status'],
                'current' => $current,
                'points' => $points,
                'thalamus_message' => ! $r['ok'] ? mb_substr($r['body'] ?? '', 0, 300) : null,
            ]);
        } catch (\Throwable $e) {
            Log::error('Erro smartwatch-locations: '.$e->getMessage(), ['trace' => $e->getTraceAsString()]);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 502);
        }
    }

    /**
     * Envia áudio gravado para o relógio do grupo (proxy Thalamus: POST …/devices/{imei}/audios/send).
     */
    public function postGroupSmartwatchAudiosSend(Request $request, $groupId, ThalamusSmartwatchClient $thalamus)
    {
        try {
            $user = Auth::user();
            if (! $user) {
                return response()->json([
                    'error' => 'Usuário não autenticado',
                    'message' => 'É necessário estar autenticado para acessar esta funcionalidade',
                ], 401);
            }

            $request->validate([
                'file' => 'required|file|max:51200',
            ]);

            $group = Group::find($groupId);
            if (! $group) {
                return response()->json([
                    'error' => 'Grupo não encontrado',
                    'message' => 'O grupo informado não existe',
                ], 404);
            }

            $isMember = $group->members()->where('user_id', $user->id)->where('is_active', true)->exists();
            if (! $isMember) {
                return response()->json([
                    'error' => 'Acesso negado',
                    'message' => 'Você não tem permissão para acessar os dados deste grupo',
                ], 403);
            }

            $device = Device::where('group_id', $groupId)
                ->where('type', 'smartwatch')
                ->whereNotNull('identifier')
                ->where('identifier', '!=', '')
                ->orderByDesc('created_at')
                ->first();

            if (! $device) {
                return response()->json([
                    'success' => false,
                    'message' => 'Nenhum smartwatch com IMEI cadastrado neste grupo.',
                ], 422);
            }

            $imei = (string) $device->identifier;
            $uploaded = $request->file('file');
            $r = $thalamus->sendDeviceAudio(
                $imei,
                $uploaded->getRealPath(),
                $uploaded->getClientOriginalName() ?: 'audio.amr',
                $uploaded->getMimeType()
            );

            if (! $r['ok']) {
                $msg = is_array($r['data']) ? (data_get($r['data'], 'message') ?? data_get($r['data'], 'error')) : null;
                if (! is_string($msg) || $msg === '') {
                    $msg = mb_substr($r['body'], 0, 500) ?: 'Falha ao enviar áudio para a API Thalamus.';
                }

                return response()->json([
                    'success' => false,
                    'message' => $msg,
                    'thalamus_status' => $r['status'],
                ], $r['status'] >= 400 && $r['status'] < 600 ? $r['status'] : 502);
            }

            return response()->json([
                'success' => true,
                'imei' => $imei,
                'data' => $r['data'],
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            Log::error('Erro smartwatch-audios-send: '.$e->getMessage(), ['trace' => $e->getTraceAsString()]);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 502);
        }
    }

    /**
     * Stream de áudio para o app (proxy Thalamus com token do servidor).
     * Query: audio_id (recomendado, Thalamus GET …/device-audios/{id}/stream) ou path ou src (legado).
     */
    public function streamGroupSmartwatchAudio(Request $request, $groupId, ThalamusSmartwatchClient $thalamus)
    {
        try {
            $user = Auth::user();
            if (! $user) {
                return response()->json([
                    'error' => 'Usuário não autenticado',
                    'message' => 'É necessário estar autenticado para acessar esta funcionalidade',
                ], 401);
            }

            $group = Group::find($groupId);
            if (! $group) {
                return response()->json([
                    'error' => 'Grupo não encontrado',
                    'message' => 'O grupo informado não existe',
                ], 404);
            }

            $isMember = $group->members()->where('user_id', $user->id)->where('is_active', true)->exists();
            if (! $isMember) {
                return response()->json([
                    'error' => 'Acesso negado',
                    'message' => 'Você não tem permissão para acessar os dados deste grupo',
                ], 403);
            }

            $device = Device::where('group_id', $groupId)
                ->where('type', 'smartwatch')
                ->whereNotNull('identifier')
                ->where('identifier', '!=', '')
                ->orderByDesc('created_at')
                ->first();

            if (! $device) {
                return response()->json([
                    'success' => false,
                    'message' => 'Nenhum smartwatch com IMEI cadastrado neste grupo.',
                ], 422);
            }

            $audioIdRaw = $request->query('audio_id') ?? $request->query('audioId');
            if (is_string($audioIdRaw) && trim($audioIdRaw) !== '') {
                $audioId = trim($audioIdRaw);
                $groupImei = (string) $device->identifier;
                try {
                    $response = $thalamus->streamDeviceAudioById($audioId, $groupImei);
                } catch (\InvalidArgumentException $e) {
                    return response()->json([
                        'success' => false,
                        'message' => $e->getMessage(),
                    ], 400);
                }

                if (! $response->successful()) {
                    $status = $response->status();
                    Log::warning('Thalamus stream device-audio falhou', [
                        'audio_id' => $audioId,
                        'imei' => $groupImei,
                        'status' => $status,
                        'snippet' => mb_substr($response->body(), 0, 500),
                    ]);

                    $escaped = rawurlencode($groupImei);
                    $seg = preg_match('/^[a-zA-Z0-9._~-]+$/', $audioId) === 1 ? $audioId : rawurlencode($audioId);
                    $legacyPath = 'devices/'.$escaped.'/audios/'.$seg;
                    $response = $thalamus->fetchMedia($legacyPath);
                }

                if (! $response->successful()) {
                    $status = $response->status();
                    $body = $response->body();

                    return response()->json([
                        'success' => false,
                        'message' => 'Não foi possível obter o áudio na Thalamus (HTTP '.$status.').',
                        'thalamus_status' => $status,
                        'detail' => mb_substr($body, 0, 2500),
                    ], 502);
                }

                $contentType = $response->header('Content-Type');
                if (! is_string($contentType) || trim($contentType) === '') {
                    $contentType = 'audio/amr';
                }

                return response($response->body(), 200)
                    ->header('Content-Type', $contentType)
                    ->header('Cache-Control', 'private, max-age=300');
            }

            $path = $request->query('path');
            $src = $request->query('src');
            $target = null;
            if (is_string($path) && trim($path) !== '') {
                $target = ltrim(trim($path), '/');
            } elseif (is_string($src) && trim($src) !== '') {
                $target = trim($src);
            }

            if ($target === null || $target === '') {
                return response()->json([
                    'success' => false,
                    'message' => 'Informe audio_id (recomendado), path ou src.',
                ], 400);
            }

            $groupImei = (string) $device->identifier;
            $pathImei = $this->extractThalamusPathImei($target);
            if ($pathImei === null || $pathImei !== $groupImei) {
                return response()->json([
                    'success' => false,
                    'message' => 'Áudio não corresponde ao dispositivo deste grupo.',
                ], 403);
            }

            $response = $thalamus->fetchMedia($target);

            if (! $response->successful()) {
                Log::warning('Thalamus stream áudio falhou', [
                    'status' => $response->status(),
                    'snippet' => mb_substr($response->body(), 0, 300),
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Não foi possível obter o áudio na Thalamus (HTTP '.$response->status().').',
                    'thalamus_status' => $response->status(),
                    'detail' => mb_substr($response->body(), 0, 2500),
                ], 502);
            }

            $contentType = $response->header('Content-Type');
            if (! is_string($contentType) || trim($contentType) === '') {
                $contentType = 'audio/amr';
            }

            return response($response->body(), 200)
                ->header('Content-Type', $contentType)
                ->header('Cache-Control', 'private, max-age=300');
        } catch (\Throwable $e) {
            Log::error('Erro smartwatch-audios-stream: '.$e->getMessage(), ['trace' => $e->getTraceAsString()]);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 502);
        }
    }

    /**
     * IMEI na URL/path Thalamus (segmento após devices/).
     */
    protected function extractThalamusPathImei(string $pathOrUrl): ?string
    {
        $path = $pathOrUrl;
        if (preg_match('#^https?://#i', $pathOrUrl)) {
            $path = (string) (parse_url($pathOrUrl, PHP_URL_PATH) ?? '');
        }
        $path = ltrim($path, '/');
        if (str_starts_with($path, 'api/')) {
            $path = substr($path, 4);
        }
        if (preg_match('#^devices/([^/]+)/#', $path, $m)) {
            return rawurldecode($m[1]);
        }

        return null;
    }

    /**
     * Extrai id numérico/uuid do path …/device-audios/{id}/stream (URL ou relativo).
     */
    protected function extractThalamusDeviceAudioStreamId(?string $urlOrPath): ?string
    {
        if (! is_string($urlOrPath) || trim($urlOrPath) === '') {
            return null;
        }
        $path = $urlOrPath;
        if (preg_match('#^https?://#i', $urlOrPath)) {
            $path = (string) (parse_url($urlOrPath, PHP_URL_PATH) ?? '');
        }
        $path = urldecode($path);
        $path = ltrim($path, '/');
        if (str_starts_with($path, 'api/')) {
            $path = substr($path, 4);
        }
        if (preg_match('#device-audios/([^/]+)/stream#i', $path, $m)) {
            return $m[1];
        }

        return null;
    }

    /**
     * @param  mixed  $data
     * @return list<array<string, mixed>>
     */
    protected function normalizeWatchAudioFeed($data, ThalamusSmartwatchClient $thalamus, ?string $deviceImei = null): array
    {
        $rows = [];
        if ($data === null) {
            return [];
        }
        if (is_array($data)) {
            if (isset($data['data']) && is_array($data['data'])) {
                $inner = $data['data'];
                $rows = array_is_list($inner) ? $inner : [$inner];
            } elseif (isset($data['items']) && is_array($data['items'])) {
                $rows = $data['items'];
            } elseif (isset($data['audios']) && is_array($data['audios'])) {
                $rows = $data['audios'];
            } elseif (array_is_list($data)) {
                $rows = $data;
            } elseif ($this->rowLooksLikeThalamusAudio($data)) {
                $rows = [$data];
            }
        }

        $out = [];
        foreach ($rows as $row) {
            if (! is_array($row)) {
                continue;
            }
            $rawUrl = data_get($row, 'url')
                ?? data_get($row, 'audioUrl')
                ?? data_get($row, 'audio_url')
                ?? data_get($row, 'fileUrl')
                ?? data_get($row, 'file_url')
                ?? data_get($row, 'downloadUrl')
                ?? data_get($row, 'download_url')
                ?? data_get($row, 'mediaUrl')
                ?? data_get($row, 'media_url')
                ?? data_get($row, 'playbackUrl')
                ?? data_get($row, 'playback_url')
                ?? data_get($row, 'src')
                ?? data_get($row, 'link')
                ?? data_get($row, 'href')
                ?? data_get($row, 'resource')
                ?? data_get($row, 'storagePath')
                ?? data_get($row, 'storage_path')
                ?? data_get($row, 'key')
                ?? data_get($row, 'media.url')
                ?? data_get($row, 'audio.path')
                ?? data_get($row, 'file.path')
                ?? data_get($row, 'content.url')
                ?? data_get($row, 'data.url')
                ?? data_get($row, 'path')
                ?? data_get($row, 'file');

            if (! is_string($rawUrl) || trim($rawUrl) === '') {
                $rawUrl = null;
            } else {
                $rawUrl = trim($rawUrl);
            }

            if ($rawUrl === null && is_string($deviceImei) && $deviceImei !== '') {
                $escapedImei = rawurlencode($deviceImei);
                $fileOnly = data_get($row, 'filename')
                    ?? data_get($row, 'fileName')
                    ?? data_get($row, 'file_name')
                    ?? data_get($row, 'storedName')
                    ?? data_get($row, 'stored_name');
                if (is_string($fileOnly) && $fileOnly !== '') {
                    $rawUrl = 'devices/'.$escapedImei.'/audios/'.ltrim($fileOnly, '/');
                } else {
                    $audioId = data_get($row, 'audioId')
                        ?? data_get($row, 'audio_id')
                        ?? data_get($row, 'fileId')
                        ?? data_get($row, 'file_id');
                    if ($audioId === null || $audioId === '') {
                        $audioId = data_get($row, 'id');
                    }
                    if (is_scalar($audioId) && (string) $audioId !== '') {
                        $rawUrl = 'devices/'.$escapedImei.'/audios/'.rawurlencode((string) $audioId);
                    }
                }
            }

            $url = is_string($rawUrl) ? $thalamus->absolutizeMediaUrl($rawUrl) : null;

            $streamPath = null;
            if (is_string($url) && $url !== '') {
                $base = rtrim($thalamus->mediaBaseUrl(), '/');
                if (str_starts_with($url, $base.'/')) {
                    $streamPath = substr($url, strlen($base) + 1);
                }
            }
            if ($streamPath === null && is_string($rawUrl) && $rawUrl !== '' && ! preg_match('#^https?://#i', $rawUrl)) {
                $p = ltrim($rawUrl, '/');
                if (str_starts_with($p, 'api/')) {
                    $p = substr($p, 4);
                }
                $streamPath = $p;
            }

            $created = data_get($row, 'createdAt')
                ?? data_get($row, 'created_at')
                ?? data_get($row, 'timestamp')
                ?? data_get($row, 'time')
                ?? data_get($row, 'date');

            $streamAudioId = data_get($row, 'audioId')
                ?? data_get($row, 'audio_id')
                ?? data_get($row, 'streamAudioId')
                ?? data_get($row, 'deviceAudioId');
            $audioIdOut = (is_scalar($streamAudioId) && trim((string) $streamAudioId) !== '')
                ? trim((string) $streamAudioId)
                : null;
            if ($audioIdOut === null || $audioIdOut === '') {
                $audioIdOut = data_get($row, 'id') !== null && data_get($row, 'id') !== ''
                    ? trim((string) data_get($row, 'id'))
                    : null;
            }
            $fromDeviceAudiosUrl = $this->extractThalamusDeviceAudioStreamId(is_string($url) ? $url : null)
                ?? $this->extractThalamusDeviceAudioStreamId(is_string($rawUrl) ? $rawUrl : null)
                ?? $this->extractThalamusDeviceAudioStreamId(data_get($row, 'streamUrl'))
                ?? $this->extractThalamusDeviceAudioStreamId(data_get($row, 'stream_url'));
            if (is_string($fromDeviceAudiosUrl) && $fromDeviceAudiosUrl !== '') {
                $audioIdOut = $fromDeviceAudiosUrl;
            }

            $out[] = [
                'id' => data_get($row, 'id'),
                'audio_id' => $audioIdOut,
                'playback_url' => $url,
                'stream_path' => $streamPath,
                'created_at' => $created,
                'direction' => data_get($row, 'direction')
                    ?? data_get($row, 'type')
                    ?? data_get($row, 'flow')
                    ?? data_get($row, 'source'),
                'duration_ms' => data_get($row, 'durationMs')
                    ?? data_get($row, 'duration')
                    ?? data_get($row, 'length'),
                'label' => data_get($row, 'description')
                    ?? data_get($row, 'title')
                    ?? data_get($row, 'name'),
            ];
        }

        usort($out, function (array $a, array $b): int {
            $ta = is_numeric($a['created_at'] ?? null)
                ? (int) $a['created_at']
                : (strtotime((string) ($a['created_at'] ?? '')) ?: 0);
            $tb = is_numeric($b['created_at'] ?? null)
                ? (int) $b['created_at']
                : (strtotime((string) ($b['created_at'] ?? '')) ?: 0);
            if ($ta > 1_000_000_000_000) {
                $ta = (int) ($ta / 1000);
            }
            if ($tb > 1_000_000_000_000) {
                $tb = (int) ($tb / 1000);
            }

            return $tb <=> $ta;
        });

        return $out;
    }

    /**
     * @param  array<string, mixed>  $row
     */
    protected function rowLooksLikeThalamusAudio(array $row): bool
    {
        return data_get($row, 'url') || data_get($row, 'audioUrl') || data_get($row, 'fileUrl')
            || data_get($row, 'media_url') || data_get($row, 'filename') || data_get($row, 'fileName')
            || data_get($row, 'createdAt') || data_get($row, 'id');
    }

    /**
     * @param  mixed  $data
     * @return list<array{latitude: float, longitude: float, at: mixed}>
     */
    protected function normalizeThalamusLocationPoints($data): array
    {
        $rows = [];
        if ($data === null) {
            return [];
        }
        if (is_array($data)) {
            if (isset($data['data']) && is_array($data['data'])) {
                $inner = $data['data'];
                $rows = array_is_list($inner) ? $inner : [$inner];
            } elseif (isset($data['items']) && is_array($data['items'])) {
                $rows = $data['items'];
            } elseif (isset($data['locations']) && is_array($data['locations'])) {
                $rows = $data['locations'];
            } elseif (isset($data['points']) && is_array($data['points'])) {
                $rows = $data['points'];
            } elseif (array_is_list($data)) {
                $rows = $data;
            }
        }

        $out = [];
        foreach ($rows as $row) {
            if (! is_array($row)) {
                continue;
            }
            $lat = data_get($row, 'latitude') ?? data_get($row, 'lat') ?? data_get($row, 'Latitude');
            $lng = data_get($row, 'longitude') ?? data_get($row, 'lng') ?? data_get($row, 'lon') ?? data_get($row, 'Longitude');
            if ($lat === null || $lng === null) {
                continue;
            }
            $out[] = [
                'latitude' => round((float) $lat, 7),
                'longitude' => round((float) $lng, 7),
                'at' => data_get($row, 'createdAt')
                    ?? data_get($row, 'created_at')
                    ?? data_get($row, 'timestamp')
                    ?? data_get($row, 'time')
                    ?? data_get($row, 'date'),
            ];
        }

        usort($out, function (array $a, array $b): int {
            return $this->locationPointTime($b['at'] ?? null) <=> $this->locationPointTime($a['at'] ?? null);
        });

        return $out;
    }

    protected function locationPointTime($at): int
    {
        if ($at === null || $at === '') {
            return 0;
        }
        if (is_numeric($at)) {
            $n = (int) $at;
            if ($n > 1_000_000_000_000) {
                $n = (int) ($n / 1000);
            }

            return $n;
        }
        $t = strtotime((string) $at);

        return $t !== false ? $t : 0;
    }

    /**
     * Criar dispositivo para um grupo
     * POST /api/groups/{groupId}/devices
     */
    public function createGroupDevice(Request $request, $groupId)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'error' => 'Usuário não autenticado',
                    'message' => 'É necessário estar autenticado para acessar esta funcionalidade'
                ], 401);
            }
            
            // Verificar se o usuário tem acesso ao grupo
            $group = \App\Models\Group::find($groupId);
            if (!$group) {
                return response()->json([
                    'error' => 'Grupo não encontrado',
                    'message' => 'O grupo informado não existe'
                ], 404);
            }
            
            // Verificar se o usuário é membro do grupo
            $isMember = $group->members()->where('user_id', $user->id)->where('is_active', true)->exists();
            if (!$isMember) {
                return response()->json([
                    'error' => 'Acesso negado',
                    'message' => 'Você não tem permissão para criar dispositivos neste grupo'
                ], 403);
            }
            
            $validator = Validator::make($request->all(), [
                'nickname' => 'required|string|max:255',
                'type' => 'required|in:smartwatch,sensor',
                'identifier' => $this->deviceIdentifierRules(),
                'status' => 'nullable|string|max:255',
                'parser_model' => 'nullable|string|max:255',
                'thalamus_device_id' => 'nullable|integer|min:1',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => 'Dados inválidos',
                    'errors' => $validator->errors()
                ], 422);
            }

            $device = Device::create([
                'nickname' => $request->nickname,
                'type' => $request->type,
                'identifier' => $request->identifier,
                'status' => $request->input('status'),
                'parser_model' => $request->input('parser_model'),
                'thalamus_device_id' => $request->input('thalamus_device_id'),
                'group_id' => $groupId,
                'user_id' => $user->id,
            ]);

            // Registrar atividade de registro de smartwatch (apenas se for smartwatch)
            if ($request->type === 'smartwatch' && class_exists('App\Models\GroupActivity')) {
                try {
                    $user = Auth::user();
                    \App\Models\GroupActivity::logSmartwatchRegistered(
                        $groupId,
                        $user->id,
                        $user->name,
                        $request->nickname,
                        $device->id
                    );
                } catch (\Exception $e) {
                    Log::warning("Erro ao registrar atividade de smartwatch: " . $e->getMessage());
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Dispositivo criado com sucesso',
                'device' => [
                    'id' => $device->id,
                    'nickname' => $device->nickname,
                    'type' => $device->type,
                    'type_label' => $device->type_label,
                    'identifier' => $device->identifier,
                    'status' => $device->status,
                    'parser_model' => $device->parser_model,
                    'thalamus_device_id' => $device->thalamus_device_id,
                    'created_at' => $device->created_at,
                ]
            ], 201);
        } catch (\Exception $e) {
            Log::error('Erro ao criar dispositivo: ' . $e->getMessage());
            return response()->json([
                'error' => 'Erro ao criar dispositivo',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obter detalhes de um dispositivo
     * GET /api/admin/devices/{id}
     */
    public function show($id)
    {
        try {
            $user = Auth::user();

            // Verificar se é root: por campo is_root ou por email root@lacos.com ou admin@lacos.com
            $isRoot = ($user->is_root ?? false) || ($user->email === 'root@lacos.com') || ($user->email === 'admin@lacos.com');

            if (!$user || !$isRoot) {
                return response()->json([
                    'success' => false,
                    'message' => 'Acesso negado. Apenas usuários root podem acessar esta funcionalidade.'
                ], 403);
            }

            $device = Device::with(['user', 'group.creator'])->findOrFail($id);

            return response()->json([
                'success' => true,
                'device' => [
                    'id' => $device->id,
                    'nickname' => $device->nickname,
                    'type' => $device->type,
                    'type_label' => $device->type_label,
                    'identifier' => $device->identifier,
                    'status' => $device->status,
                    'parser_model' => $device->parser_model,
                    'thalamus_device_id' => $device->thalamus_device_id,
                    'user_id' => $device->user_id,
                    'user_name' => $device->user ? $device->user->name : null,
                    'user_email' => $device->user ? $device->user->email : null,
                    'group_id' => $device->group_id,
                    'group_name' => $device->group ? $device->group->name : null,
                    'admin_email' => $device->group && $device->group->creator ? $device->group->creator->email : null,
                    'patient_name' => $device->group ? $device->group->accompanied_name : null,
                    'created_at' => $device->created_at,
                ]
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Dispositivo não encontrado'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Erro ao buscar dispositivo: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erro ao buscar dispositivo',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Atualizar dispositivo
     * PUT /api/admin/devices/{id}
     */
    public function update(Request $request, $id)
    {
        try {
            $user = Auth::user();

            // Verificar se é root: por campo is_root ou por email root@lacos.com ou admin@lacos.com
            $isRoot = ($user->is_root ?? false) || ($user->email === 'root@lacos.com') || ($user->email === 'admin@lacos.com');

            if (!$user || !$isRoot) {
                return response()->json([
                    'success' => false,
                    'message' => 'Acesso negado. Apenas usuários root podem acessar esta funcionalidade.'
                ], 403);
            }

            $device = Device::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'nickname' => 'sometimes|string|max:255',
                'type' => 'sometimes|in:smartwatch,sensor',
                'identifier' => $this->deviceIdentifierRules((int) $id, false),
                'status' => 'nullable|string|max:255',
                'parser_model' => 'nullable|string|max:255',
                'user_id' => 'nullable|exists:users,id',
                'group_id' => 'nullable|exists:groups,id',
                'thalamus_device_id' => 'nullable|integer|min:1',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'error' => 'Dados inválidos',
                    'errors' => $validator->errors()
                ], 422);
            }

            $device->update($request->only(['nickname', 'type', 'identifier', 'status', 'parser_model', 'user_id', 'group_id', 'thalamus_device_id']));

            return response()->json([
                'success' => true,
                'message' => 'Dispositivo atualizado com sucesso',
                'device' => $device->load(['user', 'group'])
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Dispositivo não encontrado'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Erro ao atualizar dispositivo: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erro ao atualizar dispositivo',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Criar novo dispositivo
     * POST /api/admin/devices
     */
    public function store(Request $request)
    {
        try {
            $user = Auth::user();

            // Verificar se é root: por campo is_root ou por email root@lacos.com ou admin@lacos.com
            $isRoot = ($user->is_root ?? false) || ($user->email === 'root@lacos.com') || ($user->email === 'admin@lacos.com');

            if (!$user || !$isRoot) {
                return response()->json([
                    'success' => false,
                    'message' => 'Acesso negado. Apenas usuários root podem acessar esta funcionalidade.'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'nickname' => 'required|string|max:255',
                'type' => 'required|in:smartwatch,sensor',
                'identifier' => $this->deviceIdentifierRules(),
                'status' => 'nullable|string|max:255',
                'parser_model' => 'nullable|string|max:255',
                'group_id' => 'required|exists:groups,id',
                'user_id' => 'nullable|exists:users,id',
                'thalamus_device_id' => 'nullable|integer|min:1',
            ]);

            $validator->after(function ($v) use ($request) {
                if ($request->input('type') !== 'smartwatch') {
                    return;
                }
                if (!config('services.thalamus_smartwatch.associate_enabled')) {
                    return;
                }
                if (!filled(config('services.thalamus_smartwatch.associate_path'))) {
                    return;
                }
                if (!$request->filled('thalamus_device_id')) {
                    $v->errors()->add(
                        'thalamus_device_id',
                        'Selecione o dispositivo na lista Thalamus. A API está configurada para exigir a associação ao grupo.'
                    );
                }
            });

            if ($validator->fails()) {
                return response()->json([
                    'error' => 'Dados inválidos',
                    'errors' => $validator->errors()
                ], 422);
            }

            $thalamus = app(ThalamusSmartwatchClient::class);

            $device = DB::transaction(function () use ($request, $thalamus) {
                $group = Group::findOrFail($request->group_id);

                $device = Device::create([
                    'nickname' => $request->nickname,
                    'type' => $request->type,
                    'identifier' => $request->identifier,
                    'status' => $request->input('status'),
                    'parser_model' => $request->input('parser_model'),
                    'user_id' => $request->user_id ?? null,
                    'group_id' => $request->group_id,
                    'thalamus_device_id' => $request->input('thalamus_device_id'),
                ]);

                if ($request->type === 'smartwatch'
                    && $request->filled('thalamus_device_id')
                    && config('services.thalamus_smartwatch.associate_enabled')
                    && filled(config('services.thalamus_smartwatch.associate_path'))) {
                    $groupKey = $group->thalamus_group_external_id ?? (string) $group->id;
                    $thalamus->associateDeviceWithGroupIfConfigured(
                        (int) $request->thalamus_device_id,
                        (string) $groupKey
                    );
                }

                return $device;
            });

            $device->load(['group.creator', 'user']);

            return response()->json([
                'success' => true,
                'message' => 'Dispositivo criado com sucesso',
                'device' => [
                    'id' => $device->id,
                    'nickname' => $device->nickname,
                    'type' => $device->type,
                    'type_label' => $device->type_label,
                    'identifier' => $device->identifier,
                    'status' => $device->status,
                    'parser_model' => $device->parser_model,
                    'thalamus_device_id' => $device->thalamus_device_id,
                    'group_id' => $device->group_id,
                    'group_name' => $device->group ? $device->group->name : null,
                    'admin_email' => $device->group && $device->group->creator ? $device->group->creator->email : null,
                    'patient_name' => $device->group ? $device->group->accompanied_name : null,
                    'created_at' => $device->created_at,
                ]
            ], 201);
        } catch (\Exception $e) {
            Log::error('Erro ao criar dispositivo: ' . $e->getMessage());
            return response()->json([
                'error' => 'Erro ao criar dispositivo',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Excluir dispositivo
     * DELETE /api/admin/devices/{id}
     * DELETE /api/groups/{groupId}/devices/{deviceId}
     */
    public function destroy($groupId = null, $deviceId = null)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'error' => 'Usuário não autenticado',
                    'message' => 'É necessário estar autenticado para acessar esta funcionalidade'
                ], 401);
            }

            // Se deviceId não foi passado, então $groupId é o ID do dispositivo (rota admin)
            // Nesse caso, verificar se é root
            if (!$deviceId) {
                // Verificar se é root: por campo is_root ou por email root@lacos.com ou admin@lacos.com
                $isRoot = ($user->is_root ?? false) || ($user->email === 'root@lacos.com') || ($user->email === 'admin@lacos.com');

                if (!$isRoot) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Acesso negado. Apenas usuários root podem acessar esta funcionalidade.'
                    ], 403);
                }
            }

            $id = $deviceId ?? $groupId;
            
            $device = Device::findOrFail($id);
            
            // Se foi passado groupId, verificar se o dispositivo pertence ao grupo e se o usuário tem acesso
            if ($groupId && $deviceId) {
                if ($device->group_id != $groupId) {
                    return response()->json([
                        'error' => 'Dispositivo não pertence a este grupo',
                        'message' => 'O dispositivo não está vinculado ao grupo informado'
                    ], 403);
                }
                
                // Verificar se o usuário tem acesso ao grupo
                $group = \App\Models\Group::find($groupId);
                if ($group) {
                    $isMember = $group->members()->where('user_id', $user->id)->where('is_active', true)->exists();
                    if (!$isMember) {
                        return response()->json([
                            'error' => 'Acesso negado',
                            'message' => 'Você não tem permissão para excluir dispositivos deste grupo'
                        ], 403);
                    }
                }
            }
            
            $device->delete();

            return response()->json([
                'success' => true,
                'message' => 'Dispositivo excluído com sucesso'
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'error' => 'Dispositivo não encontrado',
                'message' => 'O dispositivo com o ID informado não existe'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Erro ao excluir dispositivo: ' . $e->getMessage());
            return response()->json([
                'error' => 'Erro ao excluir dispositivo',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
