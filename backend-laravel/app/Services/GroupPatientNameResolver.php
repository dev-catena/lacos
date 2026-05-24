<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class GroupPatientNameResolver
{
    /**
     * Nome civil do paciente/acompanhado do grupo — nunca o nome do grupo.
     */
    public static function resolve(?int $groupId): ?string
    {
        if (! $groupId) {
            return null;
        }

        $group = DB::table('groups')->where('id', $groupId)->first();
        if (! $group) {
            return null;
        }

        $groupName = trim((string) ($group->name ?? ''));
        $accompaniedName = trim((string) ($group->accompanied_name ?? ''));

        $patientMember = DB::table('group_members')
            ->join('users', 'group_members.user_id', '=', 'users.id')
            ->where('group_members.group_id', $groupId)
            ->whereIn('group_members.role', ['patient', 'priority_contact', 'accompanied'])
            ->where(function ($q) {
                $q->where('group_members.is_active', true)->orWhereNull('group_members.is_active');
            })
            ->orderByRaw("CASE WHEN group_members.role = 'patient' THEN 1 WHEN group_members.role = 'priority_contact' THEN 2 ELSE 3 END")
            ->select('users.name')
            ->first();

        if ($patientMember && ! empty(trim((string) $patientMember->name))) {
            return trim((string) $patientMember->name);
        }

        if ($accompaniedName !== '' && strcasecmp($accompaniedName, $groupName) !== 0) {
            return $accompaniedName;
        }

        return null;
    }
}
