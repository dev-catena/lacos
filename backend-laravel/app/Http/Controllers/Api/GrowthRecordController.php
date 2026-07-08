<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class GrowthRecordController extends Controller
{
    private function isMember(int $groupId): bool
    {
        $user = Auth::user();
        if (!$user) return false;

        $group = DB::table('groups')->where('id', $groupId)->first();
        if (!$group) return false;

        $createdBy = $group->created_by ?? $group->admin_user_id ?? null;
        if ($createdBy && $createdBy == $user->id) return true;

        if (Schema::hasTable('group_members')) {
            return DB::table('group_members')
                ->where('group_id', $groupId)
                ->where('user_id', $user->id)
                ->exists();
        }

        return false;
    }

    /** GET /groups/{groupId}/growth-records */
    public function index(int $groupId)
    {
        if (!$this->isMember($groupId)) {
            return response()->json(['message' => 'Acesso negado'], 403);
        }

        $records = DB::table('growth_records')
            ->where('group_id', $groupId)
            ->orderBy('date', 'asc')
            ->get()
            ->map(fn($r) => [
                'id'                 => $r->id,
                'date'               => $r->date,
                'age_months'         => $r->age_months,
                'weight'             => $r->weight !== null ? (float) $r->weight : null,
                'height'             => $r->height !== null ? (float) $r->height : null,
                'head_circumference' => $r->head_circumference !== null ? (float) $r->head_circumference : null,
                'notes'              => $r->notes,
                'created_at'         => $r->created_at,
            ]);

        $group = DB::table('groups')->where('id', $groupId)->first();
        $birthDate = null;
        if ($group) {
            $birthDate = $group->accompanied_birth_date ?? null;
        }

        return response()->json([
            'birth_date' => $birthDate,
            'records'    => $records,
        ]);
    }

    /** POST /groups/{groupId}/growth-records */
    public function store(Request $request, int $groupId)
    {
        if (!$this->isMember($groupId)) {
            return response()->json(['message' => 'Acesso negado'], 403);
        }

        $validated = $request->validate([
            'date'               => 'required|date',
            'age_months'         => 'sometimes|nullable|integer|min:0',
            'weight'             => 'sometimes|nullable|numeric|min:0|max:99999',
            'height'             => 'sometimes|nullable|numeric|min:0|max:250',
            'head_circumference' => 'sometimes|nullable|numeric|min:0|max:100',
            'notes'              => 'sometimes|nullable|string|max:1000',
        ]);

        // Converte peso de gramas para kg se o valor for > 30
        // (nenhuma criança de 0-5 anos pesa mais de 30 kg; valores acima indicam entrada em gramas)
        $weight = isset($validated['weight']) ? (float) $validated['weight'] : null;
        if ($weight !== null && $weight > 30) {
            $weight = round($weight / 1000, 3);
        }

        $id = DB::table('growth_records')->insertGetId([
            'group_id'           => $groupId,
            'recorded_by'        => Auth::id(),
            'date'               => $validated['date'],
            'age_months'         => $validated['age_months'] ?? null,
            'weight'             => $weight,
            'height'             => $validated['height'] ?? null,
            'head_circumference' => $validated['head_circumference'] ?? null,
            'notes'              => $validated['notes'] ?? null,
            'created_at'         => now(),
            'updated_at'         => now(),
        ]);

        $record = DB::table('growth_records')->where('id', $id)->first();

        return response()->json([
            'id'                 => $record->id,
            'date'               => $record->date,
            'age_months'         => $record->age_months,
            'weight'             => $record->weight !== null ? (float) $record->weight : null,
            'height'             => $record->height !== null ? (float) $record->height : null,
            'head_circumference' => $record->head_circumference !== null ? (float) $record->head_circumference : null,
            'notes'              => $record->notes,
        ], 201);
    }

    /** DELETE /groups/{groupId}/growth-records/{id} */
    public function destroy(int $groupId, int $id)
    {
        if (!$this->isMember($groupId)) {
            return response()->json(['message' => 'Acesso negado'], 403);
        }

        $deleted = DB::table('growth_records')
            ->where('id', $id)
            ->where('group_id', $groupId)
            ->delete();

        if (!$deleted) {
            return response()->json(['message' => 'Registro não encontrado'], 404);
        }

        return response()->json(['message' => 'Registro excluído com sucesso']);
    }
}
