<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class OccurrenceController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = DB::table('occurrences')
                ->select('occurrences.*', 'users.name as user_name', 'groups.name as group_name')
                ->join('users', 'occurrences.user_id', '=', 'users.id')
                ->join('groups', 'occurrences.group_id', '=', 'groups.id')
                ->orderBy('occurred_at', 'desc');

            if ($request->has('group_id')) {
                $query->where('occurrences.group_id', $request->group_id);
            }

            return response()->json(['success' => true, 'data' => $query->get()], 200);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Erro', 'error' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'group_id' => 'required|exists:groups,id',
                'type' => 'required|string|max:100',
                'type_code' => 'nullable|string|max:50',
                'occurred_at' => 'required|date',
                'description' => 'required|string',
                'responsible' => 'required|string|max:255',
                'notes' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
            }

            $id = DB::table('occurrences')->insertGetId([
                'group_id' => $request->group_id,
                'user_id' => auth()->id() ?? 1,
                'type' => $request->type,
                'type_code' => $request->type_code,
                'occurred_at' => $request->occurred_at,
                'description' => $request->description,
                'responsible' => $request->responsible,
                'notes' => $request->notes,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return response()->json(['success' => true, 'data' => DB::table('occurrences')->find($id)], 201);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        try {
            $occurrence = DB::table('occurrences')->find($id);
            if (!$occurrence) {
                return response()->json(['success' => false, 'message' => 'Nao encontrada'], 404);
            }
            return response()->json(['success' => true, 'data' => $occurrence], 200);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            if (!DB::table('occurrences')->where('id', $id)->exists()) {
                return response()->json(['success' => false, 'message' => 'Nao encontrada'], 404);
            }

            DB::table('occurrences')->where('id', $id)->update(array_merge(
                $request->only(['type', 'type_code', 'occurred_at', 'description', 'responsible', 'notes']),
                ['updated_at' => now()]
            ));

            return response()->json(['success' => true, 'data' => DB::table('occurrences')->find($id)], 200);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        try {
            if (!DB::table('occurrences')->where('id', $id)->exists()) {
                return response()->json(['success' => false, 'message' => 'Nao encontrada'], 404);
            }
            DB::table('occurrences')->where('id', $id)->delete();
            return response()->json(['success' => true], 200);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }
}
