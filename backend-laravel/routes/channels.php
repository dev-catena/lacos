<?php

use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the event broadcasting channels that your
| application supports. The given channel authorization callbacks are
| used to check if an authenticated user can listen to the channel.
|
*/

// Canal público para grupos (qualquer membro do grupo pode escutar)
Broadcast::channel('group.{groupId}', function ($user, $groupId) {
    // Verificar se o usuário é membro do grupo
    $group = $user->groups()->find($groupId);
    
    if ($group) {
        return [
            'id' => $user->id,
            'name' => $user->name,
        ];
    }
    
    return false;
});


