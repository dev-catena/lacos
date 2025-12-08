<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class UserController extends Controller
{
    /**
     * Atualizar dados do usuário
     */
    public function update(Request $request, $id)
    {
        $user = User::find($id);
        
        if (!$user) {
            return response()->json(['message' => 'Usuário não encontrado'], 404);
        }

        $rules = [
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $id,
            'phone' => 'sometimes|nullable|string|max:20',
            'gender' => 'sometimes|nullable|in:male,female,other',
            'blood_type' => 'sometimes|nullable|string|max:5',
            'birth_date' => 'sometimes|nullable|date',
            'password' => 'sometimes|nullable|string|min:6',
            'photo' => 'sometimes|nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            // Campos de dados pessoais
            'last_name' => 'sometimes|nullable|string|max:255',
            'cpf' => 'sometimes|nullable|string|max:14',
            'address' => 'sometimes|nullable|string|max:255',
            'address_number' => 'sometimes|nullable|string|max:20',
            'address_complement' => 'sometimes|nullable|string|max:255',
            'city' => 'sometimes|nullable|string|max:100',
            'state' => 'sometimes|nullable|string|max:2',
            'zip_code' => 'sometimes|nullable|string|max:10',
            // Campos específicos de cuidador profissional
            'neighborhood' => 'sometimes|nullable|string|max:100',
            'formation_details' => 'sometimes|nullable|string',
            'hourly_rate' => 'sometimes|nullable|numeric|min:0',
            'availability' => 'sometimes|nullable|string',
            'is_available' => 'sometimes|nullable|boolean',
            'latitude' => 'sometimes|nullable|numeric',
            'longitude' => 'sometimes|nullable|numeric',
            // Campos de médico
            'crm' => 'sometimes|nullable|string|max:20',
            'medical_specialty_id' => 'sometimes|nullable|exists:medical_specialties,id',
            // Campos de saúde do paciente
            'chronic_diseases' => 'sometimes|nullable|string',
            'allergies' => 'sometimes|nullable|string',
        ];

        $request->validate($rules);

        // Log para debug
        \Log::info('UserController::update - Dados recebidos', [
            'user_id' => $id,
            'chronic_diseases' => $request->input('chronic_diseases'),
            'allergies' => $request->input('allergies'),
            'all_request_data' => $request->all(),
        ]);

        $data = $request->only([
            'name', 
            'email', 
            'phone', 
            'gender', 
            'blood_type', 
            'birth_date',
            // Campos de dados pessoais
            'last_name',
            'cpf',
            'address',
            'address_number',
            'address_complement',
            'city',
            'state',
            'zip_code',
            // Campos específicos de cuidador profissional
            'neighborhood',
            'formation_details',
            'formation_description',
            'hourly_rate',
            'availability',
            'is_available',
            'latitude',
            'longitude',
            // Campos de médico
            'crm',
            'medical_specialty_id',
            // Campos de saúde do paciente
            'chronic_diseases',
            'allergies',
        ]);

        // Processar senha se fornecida
        if ($request->has('password') && $request->password) {
            $data['password'] = Hash::make($request->password);
        }

        // Processar foto se fornecida
        if ($request->hasFile('photo')) {
            $photo = $request->file('photo');
            $filename = time() . '_' . $photo->getClientOriginalName();
            $path = $photo->storeAs('photos', $filename, 'public');
            $data['photo'] = $path;
        }

        // Garantir que chronic_diseases e allergies sejam sempre incluídos
        // Verificar de múltiplas formas para garantir que sejam capturados (FormData ou JSON)
        $allRequestData = $request->all();
        
        if (array_key_exists('chronic_diseases', $allRequestData) || $request->has('chronic_diseases')) {
            $data['chronic_diseases'] = $request->input('chronic_diseases', '');
        }
        if (array_key_exists('allergies', $allRequestData) || $request->has('allergies')) {
            $data['allergies'] = $request->input('allergies', '');
        }
        
        // Log detalhado
        \Log::info('UserController::update - Verificação de campos', [
            'has_chronic_diseases' => $request->has('chronic_diseases'),
            'exists_chronic_diseases' => $request->exists('chronic_diseases'),
            'array_key_exists_chronic_diseases' => array_key_exists('chronic_diseases', $allRequestData),
            'chronic_diseases_value' => $request->input('chronic_diseases'),
            'has_allergies' => $request->has('allergies'),
            'exists_allergies' => $request->exists('allergies'),
            'array_key_exists_allergies' => array_key_exists('allergies', $allRequestData),
            'allergies_value' => $request->input('allergies'),
            'data_array' => $data,
        ]);

        // Log antes de atualizar
        \Log::info('UserController::update - Dados que serão salvos', [
            'user_id' => $id,
            'chronic_diseases' => $data['chronic_diseases'] ?? 'não presente',
            'allergies' => $data['allergies'] ?? 'não presente',
        ]);

        $user->update($data);

        // Log após atualizar
        $updatedUser = $user->fresh();
        \Log::info('UserController::update - Dados salvos', [
            'user_id' => $id,
            'chronic_diseases' => $updatedUser->chronic_diseases,
            'allergies' => $updatedUser->allergies,
        ]);

        return response()->json([
            'message' => 'Usuário atualizado com sucesso',
            'user' => $updatedUser,
        ]);
    }
}

