<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\NotificationService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

class VaccinationController extends Controller
{
    protected NotificationService $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/groups/{groupId}/vaccination-schedule
    // Retorna o calendário PNI com status calculado pela data de nascimento
    // ─────────────────────────────────────────────────────────────────────────
    public function schedule(int $groupId)
    {
        try {
            $user = Auth::user();

            if (!$this->isMember($user->id, $groupId)) {
                // Retorna vazio em vez de 403 para não quebrar o app
                return response()->json(['birth_date' => null, 'schedule' => []]);
            }

            if (!Schema::hasTable('vaccine_schedules')) {
                return response()->json(['birth_date' => null, 'schedule' => []]);
            }

            $birthDate = $this->getBirthDate($groupId);

            $schedules = DB::table('vaccine_schedules')
                ->orderBy('order')
                ->orderBy('age_months')
                ->get();

            $records = Schema::hasTable('vaccination_records')
                ? DB::table('vaccination_records')
                    ->where('group_id', $groupId)
                    ->whereNotNull('vaccine_schedule_id')
                    ->pluck('applied_at', 'vaccine_schedule_id')
                    ->toArray()
                : [];

            $result = $schedules->map(function ($item) use ($birthDate, $records) {
                $dueDate = null;
                $status  = 'pending';

                if ($birthDate) {
                    $dueDate = Carbon::parse($birthDate)->addMonths($item->age_months)->toDateString();
                    $isApplied = array_key_exists($item->id, $records);

                    if ($isApplied) {
                        $status = 'applied';
                    } elseif (Carbon::parse($dueDate)->isPast()) {
                        $status = 'overdue';
                    } else {
                        $status = 'pending';
                    }
                }

                return [
                    'id'           => $item->id,
                    'vaccine_name' => $item->vaccine_name,
                    'dose'         => $item->dose,
                    'age_months'   => $item->age_months,
                    'age_label'    => $item->age_label,
                    'description'  => $item->description,
                    'notes'        => $item->notes,
                    'due_date'     => $dueDate,
                    'applied_at'   => $records[$item->id] ?? null,
                    'status'       => $status,
                ];
            });

            return response()->json([
                'birth_date' => $birthDate,
                'schedule'   => $result,
            ]);

        } catch (\Exception $e) {
            Log::error('VaccinationController::schedule - ' . $e->getMessage(), [
                'group_id' => $groupId,
                'trace'    => $e->getTraceAsString(),
            ]);
            // Retorna vazio para não quebrar o app
            return response()->json(['birth_date' => null, 'schedule' => []]);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/groups/{groupId}/vaccinations
    // Lista todos os registros aplicados do grupo
    // ─────────────────────────────────────────────────────────────────────────
    public function index(int $groupId)
    {
        $user = Auth::user();

        if (!$this->isMember($user->id, $groupId)) {
            return response()->json(['message' => 'Acesso negado.'], 403);
        }

        if (!Schema::hasTable('vaccination_records')) {
            return response()->json([]);
        }

        $records = DB::table('vaccination_records as vr')
            ->leftJoin('users as u', 'u.id', '=', 'vr.created_by')
            ->where('vr.group_id', $groupId)
            ->orderByDesc('vr.applied_at')
            ->select(
                'vr.*',
                'u.name as created_by_name'
            )
            ->get()
            ->map(fn ($r) => $this->formatRecord($r));

        return response()->json($records);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/groups/{groupId}/vaccinations
    // Registra uma vacina aplicada (multipart/form-data ou JSON)
    // ─────────────────────────────────────────────────────────────────────────
    public function store(Request $request, int $groupId)
    {
        $user = Auth::user();

        if (!$this->isMember($user->id, $groupId)) {
            return response()->json(['message' => 'Acesso negado.'], 403);
        }

        $validated = $request->validate([
            'vaccine_schedule_id' => 'nullable|exists:vaccine_schedules,id',
            'vaccine_name'        => 'required|string|max:100',
            'dose'                => 'required|string|max:50',
            'applied_at'          => 'required|date',
            'batch_number'        => 'nullable|string|max:50',
            'location'            => 'nullable|string|max:150',
            'professional_name'   => 'nullable|string|max:100',
            'notes'               => 'nullable|string',
            'document'            => 'nullable|file|mimes:jpeg,png,jpg,pdf|max:10240',
        ]);

        $documentPath = null;
        $documentMime = null;

        if ($request->hasFile('document')) {
            $file = $request->file('document');
            $ext  = $file->getClientOriginalExtension();
            $name = 'vacc_' . uniqid('', true) . '.' . $ext;
            $documentPath = 'vaccinations/' . $name;
            Storage::disk('public')->put($documentPath, file_get_contents($file->getRealPath()));
            $documentMime = $file->getMimeType();
        }

        // Busca accompanied_person_id se disponível
        $accompaniedPersonId = DB::table('accompanied_people')
            ->where('group_id', $groupId)
            ->value('id');

        $id = DB::table('vaccination_records')->insertGetId([
            'group_id'             => $groupId,
            'accompanied_person_id'=> $accompaniedPersonId,
            'vaccine_schedule_id'  => $validated['vaccine_schedule_id'] ?? null,
            'vaccine_name'         => $validated['vaccine_name'],
            'dose'                 => $validated['dose'],
            'applied_at'           => $validated['applied_at'],
            'batch_number'         => $validated['batch_number'] ?? null,
            'location'             => $validated['location'] ?? null,
            'professional_name'    => $validated['professional_name'] ?? null,
            'notes'                => $validated['notes'] ?? null,
            'document_path'        => $documentPath,
            'document_mime_type'   => $documentMime,
            'created_by'           => $user->id,
            'created_at'           => now(),
            'updated_at'           => now(),
        ]);

        $record = DB::table('vaccination_records')->where('id', $id)->first();

        // Notificar membros do grupo
        $this->notifyMembers(
            $groupId,
            'vaccination',
            'Vacina registrada',
            "{$validated['vaccine_name']} ({$validated['dose']}) registrada para " . Carbon::parse($validated['applied_at'])->format('d/m/Y') . '.',
            ['vaccination_record_id' => $id, 'group_id' => $groupId]
        );

        return response()->json($this->formatRecord($record), 201);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/groups/{groupId}/vaccinations/{id}
    // ─────────────────────────────────────────────────────────────────────────
    public function show(int $groupId, int $id)
    {
        $user = Auth::user();

        if (!$this->isMember($user->id, $groupId)) {
            return response()->json(['message' => 'Acesso negado.'], 403);
        }

        $record = DB::table('vaccination_records as vr')
            ->leftJoin('users as u', 'u.id', '=', 'vr.created_by')
            ->where('vr.id', $id)
            ->where('vr.group_id', $groupId)
            ->select('vr.*', 'u.name as created_by_name')
            ->first();

        if (!$record) {
            return response()->json(['message' => 'Registro não encontrado.'], 404);
        }

        return response()->json($this->formatRecord($record));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DELETE /api/groups/{groupId}/vaccinations/{id}
    // ─────────────────────────────────────────────────────────────────────────
    public function destroy(int $groupId, int $id)
    {
        $user = Auth::user();

        if (!$this->isAdminOrCreator($user->id, $groupId)) {
            return response()->json(['message' => 'Somente administradores podem remover registros.'], 403);
        }

        $record = DB::table('vaccination_records')
            ->where('id', $id)
            ->where('group_id', $groupId)
            ->first();

        if (!$record) {
            return response()->json(['message' => 'Registro não encontrado.'], 404);
        }

        // Remove arquivo se existir
        if ($record->document_path) {
            Storage::disk('public')->delete($record->document_path);
        }

        DB::table('vaccination_records')->where('id', $id)->delete();

        return response()->json(['message' => 'Registro removido com sucesso.']);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private function isMember(int $userId, int $groupId): bool
    {
        $group = DB::table('groups')->where('id', $groupId)->first();
        if (!$group) return false;

        // Criador do grupo sempre tem acesso
        if ((int) ($group->created_by ?? $group->admin_user_id ?? 0) === $userId) return true;

        // Qualquer membro na tabela group_members (sem filtro de is_active)
        return DB::table('group_members')
            ->where('user_id', $userId)
            ->where('group_id', $groupId)
            ->exists();
    }

    private function isAdminOrCreator(int $userId, int $groupId): bool
    {
        $group = DB::table('groups')->where('id', $groupId)->first();
        if (!$group) return false;

        if ((int) ($group->created_by ?? $group->admin_user_id ?? 0) === $userId) return true;

        return DB::table('group_members')
            ->where('user_id', $userId)
            ->where('group_id', $groupId)
            ->whereIn('role', ['admin'])
            ->exists();
    }

    private function getBirthDate(int $groupId): ?string
    {
        // Prioridade 0: groups.accompanied_birth_date (campo direto no grupo, usado por grupos Kids)
        if (Schema::hasColumn('groups', 'accompanied_birth_date')) {
            $groupBirthDate = DB::table('groups')
                ->where('id', $groupId)
                ->value('accompanied_birth_date');

            if ($groupBirthDate) return $groupBirthDate;
        }

        // Prioridade 1: accompanied_people.birth_date
        if (Schema::hasTable('accompanied_people')) {
            $accompanied = DB::table('accompanied_people')
                ->where('group_id', $groupId)
                ->value('birth_date');

            if ($accompanied) return $accompanied;
        }

        // Prioridade 2: usuário com role priority_contact/patient
        $patientUserId = DB::table('group_members')
            ->where('group_id', $groupId)
            ->whereIn('role', ['priority_contact', 'patient'])
            ->value('user_id');

        if ($patientUserId) {
            return DB::table('users')->where('id', $patientUserId)->value('birth_date');
        }

        return null;
    }

    private function formatRecord(object $record): array
    {
        $data = (array) $record;

        if (!empty($data['document_path'])) {
            $data['document_url'] = Storage::disk('public')->url($data['document_path']);
        } else {
            $data['document_url'] = null;
        }

        return $data;
    }

    private function notifyMembers(int $groupId, string $type, string $title, string $message, array $extra = []): void
    {
        try {
            $members = DB::table('group_members as gm')
                ->join('users as u', 'u.id', '=', 'gm.user_id')
                ->where('gm.group_id', $groupId)
                ->where('gm.is_active', true)
                ->whereIn('gm.role', ['admin', 'caregiver', 'health_professional'])
                ->select('u.*')
                ->get();

            foreach ($members as $member) {
                $userModel = \App\Models\User::find($member->id);
                if ($userModel) {
                    $this->notificationService->sendNotification(
                        $userModel,
                        $type,
                        $title,
                        $message,
                        array_merge($extra, ['group_id' => $groupId]),
                        false,
                        $groupId
                    );
                }
            }
        } catch (\Exception $e) {
            Log::warning('VaccinationController: falha ao notificar membros - ' . $e->getMessage());
        }
    }
}
