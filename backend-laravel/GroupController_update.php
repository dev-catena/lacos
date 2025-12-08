    /**
     * Update the specified group
     */
    public function update(Request $request, $id)
    {
        $group = Group::findOrFail($id);

        $request->validate([
            'name' => 'sometimes|string|max:100',
            'description' => 'sometimes|nullable|string',
            'accompanied_name' => 'sometimes|string|max:100',
            'accompanied_age' => 'sometimes|nullable|integer',
            'accompanied_gender' => 'sometimes|nullable|in:male,female,other',
            'accompanied_photo' => 'sometimes|nullable|string',
            'health_info' => 'sometimes|nullable|array',
            'photo' => 'sometimes|nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $data = $request->only([
            'name',
            'description',
            'accompanied_name',
            'accompanied_age',
            'accompanied_gender',
            'accompanied_photo',
            'health_info',
        ]);

        // Handle photo upload
        if ($request->hasFile('photo')) {
            // Delete old photo if exists
            if ($group->photo && Storage::disk('public')->exists($group->photo)) {
                Storage::disk('public')->delete($group->photo);
            }
            
            // Store new photo
            $photo = $request->file('photo');
            $photoPath = $photo->store('groups', 'public');
            $data['photo'] = $photoPath;
        }

        $group->update($data);
        
        // Recarregar o grupo para garantir que temos os dados atualizados
        $group->refresh();

        // Garantir que photo_url está incluído na resposta
        $response = $group->toArray();
        if (!isset($response['photo_url']) && $group->photo) {
            $response['photo_url'] = url('storage/' . $group->photo);
        }

        return response()->json($response);
    }






