<?php
/**
 * CORREÇÃO: Validação de acesso ao grupo para médicos
 * 
 * PROBLEMA: Médicos não fazem parte dos grupos de pacientes.
 *           A relação médico-paciente é através de consultas (appointments).
 * 
 * SOLUÇÃO: Para médicos, verificar se têm consulta com o grupo/paciente.
 *          Para cuidadores/pacientes, manter validação de grupo.
 * 
 * LOCALIZAÇÃO: PrescriptionController.php
 *              Métodos: generateSignedRecipe e generateSignedCertificate
 * 
 * SUBSTITUIR este código:
 * 
 * // Verificar se o usuário pertence ao grupo
 * $group = $user->groups()->find($validated['group_id']);
 * if (!$group) {
 *     return response()->json([
 *         'success' => false,
 *         'message' => 'Você não tem acesso a este grupo',
 *     ], 403);
 * }
 * 
 * POR este código:
 */

// Verificar acesso ao grupo
$user = Auth::user();
$isDoctor = $user->profile === 'doctor';

if ($isDoctor) {
    // Para médicos: verificar se tem consulta com o grupo/paciente
    $hasAppointment = DB::table('appointments')
        ->where('doctor_id', $user->id)
        ->where('group_id', $validated['group_id'])
        ->exists();
    
    // Se não tem consulta geral, verificar se tem a consulta específica
    if (!$hasAppointment && ($validated['appointment_id'] ?? null)) {
        $appointment = DB::table('appointments')
            ->where('id', $validated['appointment_id'])
            ->where('doctor_id', $user->id)
            ->where('group_id', $validated['group_id'])
            ->first();
        
        if (!$appointment) {
            return response()->json([
                'success' => false,
                'message' => 'Você não tem permissão para gerar documentos para esta consulta.',
            ], 403);
        }
    } elseif (!$hasAppointment) {
        return response()->json([
            'success' => false,
            'message' => 'Você não tem consultas agendadas com este paciente/grupo.',
        ], 403);
    }
} else {
    // Para não-médicos (cuidadores): verificar se pertence ao grupo
    $group = $user->groups()->find($validated['group_id']);
    if (!$group) {
        return response()->json([
            'success' => false,
            'message' => 'Você não tem acesso a este grupo',
        ], 403);
    }
}

/**
 * IMPORTANTE: Adicionar no topo do arquivo PrescriptionController.php
 * (se ainda não existir):
 * 
 * use Illuminate\Support\Facades\DB;
 */


