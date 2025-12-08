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
        ];

        $request->validate($rules);

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
            'hourly_rate',
            'availability',
            'is_available',
            'latitude',
            'longitude',
        ]);

        // Processar cursos se fornecidos (para cuidador profissional)
        if ($request->has('courses') && is_array($request->courses)) {
            // Deletar cursos antigos
            $user->caregiverCourses()->delete();
            
            // Criar novos cursos
            foreach ($request->courses as $course) {
                if (!empty($course['name']) && !empty($course['institution'])) {
                    $user->caregiverCourses()->create([
                        'name' => $course['name'],
                        'institution' => $course['institution'],
                        'year' => $course['year'] ?? null,
                        'description' => $course['description'] ?? null,
                        'certificate_url' => $course['certificate_url'] ?? null,
                    ]);
                }
            }
        }

        // Handle photo upload
        if ($request->hasFile('photo')) {
            // Delete old photo if exists
            if ($user->photo) {
                \Storage::disk('public')->delete($user->photo);
            }
            
            // Store new photo
            $photo = $request->file('photo');
            $photoPath = $photo->store('users', 'public');
            $data['photo'] = $photoPath;
        }

        // Handle password
        if ($request->password) {
            $data['password'] = \Hash::make($request->password);
        }

        // Converter is_available para boolean se for string
        if (isset($data['is_available']) && is_string($data['is_available'])) {
            $data['is_available'] = filter_var($data['is_available'], FILTER_VALIDATE_BOOLEAN);
        }

        $user->update($data);

        return response()->json($user);
    }
}

