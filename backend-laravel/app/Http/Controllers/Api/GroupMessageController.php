<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

class GroupMessageController extends Controller
{
    private function userPhotoSelectColumn(): ?string
    {
        if (Schema::hasColumn('users', 'profile_photo')) {
            return 'users.profile_photo';
        }
        if (Schema::hasColumn('users', 'photo')) {
            return 'users.photo';
        }
        if (Schema::hasColumn('users', 'photo_url')) {
            return 'users.photo_url';
        }

        return null;
    }

    private function resolveAssetUrl(?string $pathOrUrl): ?string
    {
        if (! $pathOrUrl) {
            return null;
        }

        $base = rtrim((string) (config('app.url') ?: url('/')), '/');

        if (filter_var($pathOrUrl, FILTER_VALIDATE_URL)) {
            $host = parse_url($pathOrUrl, PHP_URL_HOST) ?: '';
            if (in_array($host, ['localhost', '127.0.0.1', '0.0.0.0'], true)) {
                $path = parse_url($pathOrUrl, PHP_URL_PATH) ?: '';
                $query = parse_url($pathOrUrl, PHP_URL_QUERY);

                return $base.$path.($query ? '?'.$query : '');
            }

            return $pathOrUrl;
        }

        $path = str_starts_with($pathOrUrl, '/') ? $pathOrUrl : Storage::url($pathOrUrl);

        return $base.$path;
    }

    private function resolvePhotoUrl(?string $photoPath): ?string
    {
        return $this->resolveAssetUrl($photoPath);
    }

    private function userCanAccessGroup(int $groupId, $user): array
    {
        $group = DB::table('groups')->where('id', $groupId)->first();
        if (! $group) {
            return ['allowed' => false, 'status' => 404, 'message' => 'Grupo não encontrado'];
        }

        $createdBy = $group->created_by ?? $group->admin_user_id ?? null;
        $isCreator = $createdBy && (int) $createdBy === (int) $user->id;

        $isMember = false;
        if (Schema::hasTable('group_members')) {
            $query = DB::table('group_members')
                ->where('group_id', $groupId)
                ->where('user_id', $user->id);
            if (Schema::hasColumn('group_members', 'is_active')) {
                $query->where('is_active', true);
            }
            $isMember = $query->exists();
        }

        if (! $isCreator && ! $isMember) {
            return ['allowed' => false, 'status' => 403, 'message' => 'Você não tem acesso a este grupo'];
        }

        return ['allowed' => true, 'group' => $group];
    }

    private function userIsGroupAdmin(int $groupId, $user): bool
    {
        $group = DB::table('groups')->where('id', $groupId)->first();
        if (! $group) {
            return false;
        }

        $createdBy = $group->created_by ?? $group->admin_user_id ?? null;
        if ($createdBy && (int) $createdBy === (int) $user->id) {
            return true;
        }

        if (! Schema::hasTable('group_members')) {
            return false;
        }

        $query = DB::table('group_members')
            ->where('group_id', $groupId)
            ->where('user_id', $user->id)
            ->where('role', 'admin');

        if (Schema::hasColumn('group_members', 'is_active')) {
            $query->where('is_active', true);
        }

        return $query->exists();
    }

    private function deleteMessageImageFile(?string $imageUrl): void
    {
        if (! $imageUrl) {
            return;
        }

        $path = $imageUrl;
        if (filter_var($imageUrl, FILTER_VALIDATE_URL)) {
            $path = parse_url($imageUrl, PHP_URL_PATH) ?: '';
        }

        $path = ltrim((string) preg_replace('#^/?storage/#', '', $path), '/');
        if ($path && Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }
    }

    private function mapGroupMessageRow($message, $user): array
    {
        $imageUrl = $this->resolveAssetUrl($message->image_url ?? null);
        $photoUrl = $this->resolvePhotoUrl($message->sender_photo ?? null);

        $type = $message->type ?? 'text';
        if ($imageUrl && $type === 'text') {
            $type = 'image';
        }

        return [
            'id' => $message->id,
            'group_id' => $message->group_id,
            'sender_id' => $message->sender_id,
            'sender' => [
                'id' => $message->sender_id,
                'name' => $message->sender_name,
                'photo' => $photoUrl,
                'photo_url' => $photoUrl,
            ],
            'message' => $message->message,
            'type' => $type,
            'image_url' => $imageUrl,
            'is_read' => (bool) ($message->is_read ?? false),
            'created_at' => $message->created_at,
        ];
    }
    /**
     * Obter mensagens do grupo
     * GET /api/messages/group/{groupId}
     */
    public function getGroupMessages($groupId)
    {
        try {
            $user = Auth::user();

            if (! $user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuário não autenticado',
                ], 401);
            }

            if (! Schema::hasTable('group_messages')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Módulo de mensagens não instalado no servidor. Execute a migration group_messages.',
                    'data' => [],
                ], 503);
            }

            $access = $this->userCanAccessGroup((int) $groupId, $user);
            if (! $access['allowed']) {
                if (($access['status'] ?? 403) === 403) {
                    Log::warning('Tentativa de acesso negada ao grupo', [
                        'user_id' => $user->id,
                        'group_id' => $groupId,
                    ]);
                }

                return response()->json([
                    'success' => false,
                    'message' => $access['message'],
                ], $access['status'] ?? 403);
            }

            $select = [
                'group_messages.id',
                'group_messages.group_id',
                'group_messages.user_id as sender_id',
                'group_messages.content as message',
                'group_messages.is_read',
                'group_messages.created_at',
                'users.name as sender_name',
            ];

            if (Schema::hasColumn('group_messages', 'type')) {
                $select[] = 'group_messages.type';
            }
            if (Schema::hasColumn('group_messages', 'image_url')) {
                $select[] = 'group_messages.image_url';
            }

            $photoColumn = $this->userPhotoSelectColumn();
            if ($photoColumn) {
                $select[] = DB::raw($photoColumn.' as sender_photo');
            }

            $messages = DB::table('group_messages')
                ->where('group_messages.group_id', $groupId)
                ->join('users', 'group_messages.user_id', '=', 'users.id')
                ->select($select)
                ->orderBy('group_messages.created_at', 'asc')
                ->get()
                ->map(fn ($message) => $this->mapGroupMessageRow($message, $user));

            return response()->json([
                'success' => true,
                'data' => $messages,
            ]);

        } catch (\Exception $e) {
            Log::error('Erro ao buscar mensagens do grupo', [
                'group_id' => $groupId,
                'user_id' => $user->id ?? null,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erro ao carregar mensagens do grupo',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Enviar mensagem para o grupo
     * POST /api/messages/group
     */
    public function sendGroupMessage(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuário não autenticado'
                ], 401);
            }

            $validated = $request->validate([
                'group_id' => 'required|exists:groups,id',
                'message' => 'nullable|string|max:5000',
                'type' => 'nullable|in:text,image',
                'image' => 'nullable|image|max:10240', // 10MB
            ]);
            
            // Validar que pelo menos message ou image foi enviado
            if (empty($validated['message']) && !$request->hasFile('image')) {
                return response()->json([
                    'success' => false,
                    'message' => 'É necessário enviar uma mensagem ou uma imagem'
                ], 400);
            }

            $groupId = $validated['group_id'];

            if (! Schema::hasTable('group_messages')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Módulo de mensagens não instalado no servidor. Execute a migration group_messages.',
                ], 503);
            }

            $access = $this->userCanAccessGroup((int) $groupId, $user);
            if (! $access['allowed']) {
                return response()->json([
                    'success' => false,
                    'message' => $access['message'],
                ], $access['status'] ?? 403);
            }

            $messageType = $validated['type'] ?? 'text';
            $imageUrl = null;

            // Se for imagem, fazer upload
            if ($request->hasFile('image')) {
                $image = $request->file('image');
                $path = $image->store('group-messages', 'public');
                // Caminho relativo — URL absoluta montada na leitura (evita localhost no APP_URL)
                $imageUrl = Storage::url($path);
                $messageType = 'image';
            }

            // Inserir mensagem
            $insert = [
                'group_id' => $groupId,
                'user_id' => $user->id,
                'content' => $validated['message'] ?? '',
                'is_read' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ];
            if (Schema::hasColumn('group_messages', 'type')) {
                $insert['type'] = $messageType;
            }
            if (Schema::hasColumn('group_messages', 'image_url')) {
                $insert['image_url'] = $imageUrl;
            }

            $messageId = DB::table('group_messages')->insertGetId($insert);

            $select = [
                'group_messages.id',
                'group_messages.group_id',
                'group_messages.user_id as sender_id',
                'group_messages.content as message',
                'group_messages.is_read',
                'group_messages.created_at',
                'users.name as sender_name',
            ];
            if (Schema::hasColumn('group_messages', 'type')) {
                $select[] = 'group_messages.type';
            }
            if (Schema::hasColumn('group_messages', 'image_url')) {
                $select[] = 'group_messages.image_url';
            }
            $photoColumn = $this->userPhotoSelectColumn();
            if ($photoColumn) {
                $select[] = DB::raw($photoColumn.' as sender_photo');
            }

            $message = DB::table('group_messages')
                ->where('group_messages.id', $messageId)
                ->join('users', 'group_messages.user_id', '=', 'users.id')
                ->select($select)
                ->first();

            return response()->json([
                'success' => true,
                'data' => $this->mapGroupMessageRow($message, $user),
            ]);

        } catch (\Exception $e) {
            Log::error('Erro ao enviar mensagem do grupo', [
                'group_id' => $request->input('group_id'),
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erro ao enviar mensagem'
            ], 500);
        }
    }

    /**
     * DELETE /api/messages/group/{groupId}/{messageId}
     */
    public function destroy($groupId, $messageId)
    {
        try {
            $user = Auth::user();

            if (! $user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuário não autenticado',
                ], 401);
            }

            if (! Schema::hasTable('group_messages')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Módulo de mensagens não instalado no servidor.',
                ], 503);
            }

            $access = $this->userCanAccessGroup((int) $groupId, $user);
            if (! $access['allowed']) {
                return response()->json([
                    'success' => false,
                    'message' => $access['message'],
                ], $access['status'] ?? 403);
            }

            $message = DB::table('group_messages')
                ->where('group_id', $groupId)
                ->where('id', $messageId)
                ->first();

            if (! $message) {
                return response()->json([
                    'success' => false,
                    'message' => 'Mensagem não encontrada',
                ], 404);
            }

            $isOwner = (int) $message->user_id === (int) $user->id;
            $isAdmin = $this->userIsGroupAdmin((int) $groupId, $user);

            if (! $isOwner && ! $isAdmin) {
                return response()->json([
                    'success' => false,
                    'message' => 'Você só pode excluir suas próprias mensagens',
                ], 403);
            }

            if (! empty($message->image_url)) {
                $this->deleteMessageImageFile($message->image_url);
            }

            DB::table('group_messages')->where('id', $messageId)->delete();

            return response()->json([
                'success' => true,
                'message' => 'Mensagem excluída',
            ]);
        } catch (\Exception $e) {
            Log::error('Erro ao excluir mensagem do grupo', [
                'group_id' => $groupId,
                'message_id' => $messageId,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erro ao excluir mensagem',
            ], 500);
        }
    }
}

