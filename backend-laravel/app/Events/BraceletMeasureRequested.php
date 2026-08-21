<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Cuidador pediu medição sob demanda → app do paciente (conectado à pulseira) executa.
 */
class BraceletMeasureRequested implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $groupId;

    /** @var string all|ecg */
    public string $measureType;

    public int $requestedBy;

    public string $requestId;

    public function __construct(int $groupId, string $measureType, int $requestedBy, string $requestId)
    {
        $this->groupId = $groupId;
        $this->measureType = $measureType;
        $this->requestedBy = $requestedBy;
        $this->requestId = $requestId;
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('group.'.$this->groupId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'bracelet.measure';
    }

    public function broadcastWith(): array
    {
        return [
            'group_id' => $this->groupId,
            'type' => $this->measureType,
            'requested_by' => $this->requestedBy,
            'request_id' => $this->requestId,
        ];
    }
}
