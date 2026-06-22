<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class StreamCameraStatusService
{
    public function normalizeStreamApi(string $streamApi): string
    {
        return rtrim(trim($streamApi), '/');
    }

    public function isCameraActive(string $streamApi, string $cameraId): bool
    {
        $base = $this->normalizeStreamApi($streamApi);
        $cameraId = trim($cameraId);

        if ($base === '' || $cameraId === '') {
            return false;
        }

        $url = $base.'/snapshots/latest/'.rawurlencode($cameraId);

        try {
            $response = Http::timeout(4)->get($url);

            return $response->successful();
        } catch (\Throwable $e) {
            Log::debug('StreamCameraStatusService::isCameraActive failed', [
                'url' => $url,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * @param  array<int, array{id?: string, nome?: string}>  $cameras
     * @return array{total: int, active: int}
     */
    public function countCameras(array $cameras, string $streamApi): array
    {
        $total = 0;
        $active = 0;

        foreach ($cameras as $camera) {
            $cameraId = trim((string) ($camera['id'] ?? ''));
            if ($cameraId === '') {
                continue;
            }

            $total++;
            if ($this->isCameraActive($streamApi, $cameraId)) {
                $active++;
            }
        }

        return [
            'total' => $total,
            'active' => $active,
        ];
    }
}
