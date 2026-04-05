<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DoseHistory;
use Illuminate\Http\Request;

class DoseHistoryController extends Controller
{
    /**
     * Get dose history for a medication
     */
    public function index(Request $request)
    {
        $medicationId = $request->query('medication_id');

        $doseHistory = DoseHistory::with(['medication', 'takenByUser'])
            ->where('medication_id', $medicationId)
            ->orderBy('scheduled_time', 'desc')
            ->paginate(50);

        return response()->json($doseHistory);
    }

    /**
     * Mark dose as taken
     */
    public function markTaken(Request $request, $id)
    {
        $dose = DoseHistory::findOrFail($id);

        $request->validate([
            'taken_at' => 'sometimes|date',
            'notes' => 'sometimes|nullable|string',
        ]);

        $dose->update([
            'status' => 'taken',
            'taken_at' => $request->taken_at ?? now(),
            'taken_by' => $request->user()->id,
            'notes' => $request->notes,
        ]);

        return response()->json($dose);
    }

    /**
     * Mark dose as skipped
     */
    public function markSkipped(Request $request, $id)
    {
        $dose = DoseHistory::findOrFail($id);

        $request->validate([
            'skip_reason' => 'nullable|string',
        ]);

        $dose->update([
            'status' => 'skipped',
            'skip_reason' => $request->skip_reason,
        ]);

        return response()->json($dose);
    }

    /**
     * Get adherence report
     */
    public function adherenceReport(Request $request)
    {
        $medicationId = $request->query('medication_id');
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        $query = DoseHistory::where('medication_id', $medicationId);

        if ($startDate) {
            $query->whereDate('scheduled_time', '>=', $startDate);
        }

        if ($endDate) {
            $query->whereDate('scheduled_time', '<=', $endDate);
        }

        $doses = $query->get();

        $total = $doses->count();
        $taken = $doses->where('status', 'taken')->count();
        $missed = $doses->where('status', 'missed')->count();
        $skipped = $doses->where('status', 'skipped')->count();
        $pending = $doses->where('status', 'pending')->count();

        $adherenceRate = $total > 0 ? ($taken / $total) * 100 : 0;

        return response()->json([
            'total' => $total,
            'taken' => $taken,
            'missed' => $missed,
            'skipped' => $skipped,
            'pending' => $pending,
            'adherence_rate' => round($adherenceRate, 2),
        ]);
    }
}
