#!/bin/bash

# Script para corrigir definitivamente o AdminDoctorController

set -e

cd /var/www/lacos-backend

echo "🔧 Corrigindo AdminDoctorController definitivamente..."

# 1. Verificar se o arquivo existe
if [ ! -f "app/Http/Controllers/Api/AdminDoctorController.php" ]; then
    echo "❌ AdminDoctorController não encontrado!"
    exit 1
fi

# 2. Fazer backup
echo "📦 Fazendo backup..."
cp app/Http/Controllers/Api/AdminDoctorController.php app/Http/Controllers/Api/AdminDoctorController.php.backup.$(date +%s)

# 3. Verificar se tem o relacionamento specialty
if grep -q "->with(\['specialty'\]" app/Http/Controllers/Api/AdminDoctorController.php; then
    echo "⚠️  Relacionamento specialty encontrado, corrigindo..."
    
    # Remover linhas com ->with(['specialty'])
    sed -i "/->with(\['specialty'\]/d" app/Http/Controllers/Api/AdminDoctorController.php
    
    # Remover linhas com specialty dentro de with
    sed -i "/'specialty' => function/d" app/Http/Controllers/Api/AdminDoctorController.php
    sed -i "/->select('id', 'name');/d" app/Http/Controllers/Api/AdminDoctorController.php
    sed -i "/}])/d" app/Http/Controllers/Api/AdminDoctorController.php
    
    echo "✅ Relacionamento specialty removido"
fi

# 4. Verificar se já tem a busca direta de specialty
if ! grep -q "DB::table('medical_specialties')" app/Http/Controllers/Api/AdminDoctorController.php; then
    echo "📝 Adicionando busca direta de specialty..."
    
    # Criar versão corrigida completa
    cat > app/Http/Controllers/Api/AdminDoctorController.php << 'EOF'
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminDoctorController extends Controller
{
    /**
     * Listar médicos pendentes de aprovação
     * GET /api/admin/doctors/pending
     */
    public function getPending()
    {
        try {
            $doctors = User::where('profile', 'doctor')
                ->where(function($query) {
                    $query->whereNull('doctor_approved_at')
                          ->orWhere('doctor_approved_at', '=', '0000-00-00 00:00:00');
                })
                ->where('is_blocked', false)
                ->orderBy('users.created_at', 'desc')
                ->get()
                ->map(function($doctor) {
                    // Buscar especialidade diretamente do banco se houver medical_specialty_id
                    $specialty = null;
                    if (isset($doctor->medical_specialty_id) && $doctor->medical_specialty_id) {
                        $specialtyData = DB::table('medical_specialties')
                            ->where('id', $doctor->medical_specialty_id)
                            ->select('id', 'name')
                            ->first();
                        if ($specialtyData) {
                            $specialty = [
                                'id' => $specialtyData->id,
                                'name' => $specialtyData->name,
                            ];
                        }
                    }
                    
                    return [
                        'id' => $doctor->id,
                        'name' => $doctor->name,
                        'email' => $doctor->email,
                        'crm' => $doctor->crm ?? null,
                        'specialty' => $specialty,
                        'created_at' => $doctor->created_at,
                    ];
                });

            return response()->json($doctors);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Erro ao buscar médicos pendentes',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Listar todos os médicos
     * GET /api/admin/doctors
     */
    public function index()
    {
        try {
            $doctors = User::where('profile', 'doctor')
                ->orderBy('doctor_approved_at', 'desc')
                ->orderBy('users.created_at', 'desc')
                ->get()
                ->map(function($doctor) {
                    // Buscar especialidade diretamente do banco se houver medical_specialty_id
                    $specialty = null;
                    if (isset($doctor->medical_specialty_id) && $doctor->medical_specialty_id) {
                        $specialtyData = DB::table('medical_specialties')
                            ->where('id', $doctor->medical_specialty_id)
                            ->select('id', 'name')
                            ->first();
                        if ($specialtyData) {
                            $specialty = [
                                'id' => $specialtyData->id,
                                'name' => $specialtyData->name,
                            ];
                        }
                    }
                    
                    return [
                        'id' => $doctor->id,
                        'name' => $doctor->name,
                        'email' => $doctor->email,
                        'crm' => $doctor->crm ?? null,
                        'specialty' => $specialty,
                        'is_blocked' => (bool) $doctor->is_blocked,
                        'approved_at' => $doctor->doctor_approved_at,
                        'created_at' => $doctor->created_at,
                    ];
                });

            return response()->json($doctors);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Erro ao buscar médicos',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Aprovar médico
     * POST /api/admin/doctors/{id}/approve
     */
    public function approve($id)
    {
        try {
            $doctor = User::where('id', $id)
                ->where('profile', 'doctor')
                ->firstOrFail();

            $doctor->doctor_approved_at = now();
            $doctor->is_blocked = false;
            $doctor->save();

            return response()->json([
                'message' => 'Médico aprovado com sucesso',
                'doctor' => [
                    'id' => $doctor->id,
                    'name' => $doctor->name,
                    'email' => $doctor->email,
                    'approved_at' => $doctor->doctor_approved_at,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Erro ao aprovar médico',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Rejeitar médico
     * POST /api/admin/doctors/{id}/reject
     */
    public function reject($id)
    {
        try {
            $doctor = User::where('id', $id)
                ->where('profile', 'doctor')
                ->firstOrFail();

            // Bloquear o médico (rejeição = bloqueio)
            $doctor->is_blocked = true;
            $doctor->doctor_approved_at = null;
            $doctor->save();

            // Revogar todos os tokens do médico
            $doctor->tokens()->delete();

            return response()->json([
                'message' => 'Médico rejeitado com sucesso',
                'doctor' => [
                    'id' => $doctor->id,
                    'name' => $doctor->name,
                    'email' => $doctor->email,
                    'is_blocked' => true,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Erro ao rejeitar médico',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Bloquear médico
     * POST /api/admin/doctors/{id}/block
     */
    public function block($id)
    {
        try {
            $doctor = User::where('id', $id)
                ->where('profile', 'doctor')
                ->firstOrFail();

            $doctor->is_blocked = true;
            $doctor->save();

            // Revogar todos os tokens do médico
            $doctor->tokens()->delete();

            return response()->json([
                'message' => 'Médico bloqueado com sucesso',
                'doctor' => [
                    'id' => $doctor->id,
                    'name' => $doctor->name,
                    'email' => $doctor->email,
                    'is_blocked' => true,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Erro ao bloquear médico',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
EOF
    chown www-data:www-data app/Http/Controllers/Api/AdminDoctorController.php
    echo "✅ Arquivo recriado com versão corrigida"
fi

# 5. Verificar sintaxe
echo ""
echo "🔍 Verificando sintaxe..."
if php -l app/Http/Controllers/Api/AdminDoctorController.php 2>&1 | grep -q "No syntax errors"; then
    echo "✅ Sintaxe OK"
else
    echo "❌ Erro de sintaxe:"
    php -l app/Http/Controllers/Api/AdminDoctorController.php
    exit 1
fi

# 6. Verificar se ainda tem relacionamento specialty
if grep -q "->with(\['specialty'\]\|->specialty\|'specialty' => function" app/Http/Controllers/Api/AdminDoctorController.php; then
    echo "⚠️  Ainda há referências a specialty, removendo..."
    # Remover todas as referências
    sed -i "/->with(\['specialty'\]/d" app/Http/Controllers/Api/AdminDoctorController.php
    sed -i "/'specialty' => function/d" app/Http/Controllers/Api/AdminDoctorController.php
    sed -i "/->select('id', 'name');/d" app/Http/Controllers/Api/AdminDoctorController.php
    sed -i "/}])/d" app/Http/Controllers/Api/AdminDoctorController.php
    echo "✅ Referências removidas"
fi

# 7. Limpar cache
echo ""
echo "🧹 Limpando cache..."
php artisan config:clear 2>/dev/null || true
php artisan cache:clear 2>/dev/null || true
php artisan route:clear 2>/dev/null || true
echo "✅ Caches limpos"

# 8. Verificar conteúdo final
echo ""
echo "📄 Verificando se busca direta de specialty está presente..."
if grep -q "DB::table('medical_specialties')" app/Http/Controllers/Api/AdminDoctorController.php; then
    echo "✅ Busca direta de specialty encontrada"
else
    echo "⚠️  Busca direta de specialty NÃO encontrada"
fi

echo ""
echo "✅ Correção concluída!"
echo ""
echo "📝 Teste novamente a listagem de médicos"

