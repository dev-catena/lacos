<?php

namespace App\Services;

use App\Models\GroupMember;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class AccompaniedPersonResolver
{
    /**
     * Resolve (busca ou cria) o accompanied_person_id de um grupo.
     */
    public static function resolveForGroup(int $groupId, ?int $fallbackUserId = null): ?int
    {
        if (! Schema::hasTable('accompanied_people')) {
            return null;
        }

        $existing = DB::table('accompanied_people')
            ->where('group_id', $groupId)
            ->when(
                Schema::hasColumn('accompanied_people', 'deleted_at'),
                fn ($q) => $q->whereNull('deleted_at')
            )
            ->orderBy('id')
            ->first();

        if ($existing) {
            return (int) $existing->id;
        }

        $patientMember = self::findPatientMember($groupId);
        if ($patientMember) {
            $created = self::createRecord(
                $groupId,
                (int) $patientMember->user_id,
                $patientMember->name ?? null
            );
            if ($created) {
                return $created;
            }
        }

        $group = DB::table('groups')->where('id', $groupId)->first();
        if (! $group) {
            return null;
        }

        $userId = $fallbackUserId
            ?: (int) ($group->created_by ?? $group->admin_user_id ?? 0);

        if (! $userId && Auth::id()) {
            $userId = (int) Auth::id();
        }

        if (! $userId) {
            return null;
        }

        $groupName = trim((string) ($group->name ?? ''));
        $accompaniedName = trim((string) ($group->accompanied_name ?? ''));

        $name = ($accompaniedName !== '' && strcasecmp($accompaniedName, $groupName) !== 0)
            ? $accompaniedName
            : null;

        return self::createRecord($groupId, $userId, $name);
    }

    private static function findPatientMember(int $groupId): ?object
    {
        if (! Schema::hasTable('group_members')) {
            return null;
        }

        $query = DB::table('group_members')
            ->join('users', 'group_members.user_id', '=', 'users.id')
            ->where('group_members.group_id', $groupId)
            ->whereIn('group_members.role', GroupMember::accompaniedPersonRoles());

        if (Schema::hasColumn('group_members', 'is_active')) {
            $query->where(function ($q) {
                $q->where('group_members.is_active', true)->orWhereNull('group_members.is_active');
            });
        }

        return $query
            ->orderByRaw("CASE WHEN group_members.role = 'patient' THEN 1 WHEN group_members.role = 'priority_contact' THEN 2 ELSE 3 END")
            ->select('group_members.user_id', 'users.name', 'users.email', 'users.phone')
            ->first();
    }

    private static function createRecord(int $groupId, int $userId, ?string $name): ?int
    {
        try {
            $userData = DB::table('users')->where('id', $userId)->first();

            $insert = [
                'group_id' => $groupId,
                'user_id' => $userId,
                'name' => $name ?: ($userData->name ?? 'Paciente'),
                'created_at' => now(),
                'updated_at' => now(),
            ];

            if (Schema::hasColumn('accompanied_people', 'email')) {
                $insert['email'] = $userData->email ?? null;
            }
            if (Schema::hasColumn('accompanied_people', 'phone')) {
                $insert['phone'] = $userData->phone ?? null;
            }

            $id = DB::table('accompanied_people')->insertGetId($insert);

            Log::info('AccompaniedPersonResolver - registro criado', [
                'accompanied_person_id' => $id,
                'group_id' => $groupId,
                'user_id' => $userId,
            ]);

            return (int) $id;
        } catch (\Throwable $e) {
            Log::error('AccompaniedPersonResolver - falha ao criar registro', [
                'group_id' => $groupId,
                'user_id' => $userId,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }
}
