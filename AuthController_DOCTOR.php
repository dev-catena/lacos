// Adicionar após a validação de professional_caregiver (dentro do método register):

    // Validação específica para médico
    if ($request->profile === 'doctor') {
        $rules = array_merge($rules, [
            'gender' => 'required|string|in:Masculino,Feminino',
            'city' => 'required|string|max:100',
            'neighborhood' => 'required|string|max:100',
            'crm' => 'required|string|max:20',
            'specialty' => 'required|string|max:100',
            'availability' => 'required|string|max:500',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'is_available' => 'nullable|boolean',
        ]);
    }

// E no create do usuário, adicionar após os campos de professional_caregiver:

    // Campos específicos de médico
    if ($validated['profile'] === 'doctor') {
        $userData['crm'] = $validated['crm'] ?? null;
        $userData['specialty'] = $validated['specialty'] ?? null;
    }

