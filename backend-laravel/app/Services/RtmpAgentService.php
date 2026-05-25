<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RtmpAgentService
{
    public function baseUrl(): string
    {
        return rtrim((string) config('services.rtmp_agent.url', 'http://177.104.165.210:8000'), '/');
    }

    protected function client()
    {
        $username = config('services.rtmp_agent.username');
        $password = config('services.rtmp_agent.password');

        $request = Http::timeout((int) config('services.rtmp_agent.timeout', 10))
            ->acceptJson();

        if ($username && $password) {
            $request = $request->withBasicAuth($username, $password);
        }

        return $request;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function listCameras(): array
    {
        $response = $this->client()->get($this->baseUrl().'/cameras');
        if (! $response->successful()) {
            Log::warning('RtmpAgent listCameras failed', ['status' => $response->status()]);

            return [];
        }

        return $response->json() ?? [];
    }

    /**
     * @return array<string, mixed>|null
     */
    public function getStreamStatus(string $cameraId): ?array
    {
        $response = $this->client()->get($this->baseUrl().'/streams/status');
        if (! $response->successful()) {
            return null;
        }

        $items = $response->json() ?? [];
        foreach ($items as $item) {
            if (($item['camera_id'] ?? null) === $cameraId) {
                return $item;
            }
        }

        return null;
    }

    /**
     * @return array{play_url: string, expires_at: int|null, stream_path: string|null}|null
     */
    public function getSecurePlayUrl(string $cameraId): ?array
    {
        $response = $this->client()->get(
            $this->baseUrl().'/streams/secure-play-url/'.urlencode($cameraId)
        );

        if (! $response->successful()) {
            Log::warning('RtmpAgent secure-play-url failed', [
                'camera_id' => $cameraId,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return null;
        }

        $data = $response->json();
        if (empty($data['play_url'])) {
            return null;
        }

        return [
            'play_url' => $data['play_url'],
            'expires_at' => isset($data['expires_at']) ? (int) $data['expires_at'] : null,
            'stream_path' => $data['stream_path'] ?? null,
        ];
    }

    /**
     * Último snapshot JPEG da câmera (corpo binário).
     */
    public function fetchLatestSnapshot(string $cameraId): ?\Illuminate\Http\Client\Response
    {
        $response = $this->client()
            ->withHeaders(['Accept' => 'image/jpeg, image/*, */*'])
            ->get($this->baseUrl().'/snapshots/latest/'.urlencode($cameraId));

        return $response->successful() ? $response : null;
    }
}
