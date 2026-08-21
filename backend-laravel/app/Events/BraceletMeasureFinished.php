<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/** Resultado da medição remota (sucesso/falha) para o cuidador atualizar a UI. */
class BraceletMeasureFinished implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $groupId;

    public string $measureType;

    public string $requestId;

    public bool $success;

    public ?string $message;

    public function __construct(
        int $groupId,
        string $measureType,
        string $requestId,
        bool $success,
        ?string $message = null
    ) {
        $this->groupId = $groupId;
        $this->measureType = $measureType;
        $this->requestId = $requestId;
        $this->success = $success;
        $this->message = $message;
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('group.'.$this->groupId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'bracelet.measure.finished';
    }

    public function broadcastWith(): array
    {
        return [
            'group_id' => $this->groupId,
            'type' => $this->measureType,
            'request_id' => $this->requestId,
            'success' => $this->success,
            'message' => $this->message,
        ];
    }
}
