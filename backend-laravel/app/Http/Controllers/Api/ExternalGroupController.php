<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ExternalGroupController extends Controller
{
    /**
     * Cria um grupo de cuidado para um bebê a partir de um app externo (ex: maternidade).
     *
     * Payload esperado (multipart/form-data ou JSON):
     *   - baby_name         string, required
     *   - mother_name       string, required
     *   - mother_email      string, required, email
     *   - mother_phone      string, optional
     *   - identity_card     string, optional (RG/CPF/matrícula)
     *   - baby_photo        file (image), optional
     *   - group_name        string, optional (padrão: "Grupo de {baby_name}")
     *
     * Retorna o grupo criado com code de convite e credenciais provisórias da mãe.
     */
    public function createBirthGroup(Request $request)
    {
        $validated = $request->validate([
            'baby_name'      => 'required|string|max:255',
            'mother_name'    => 'required|string|max:255',
            'mother_email'   => 'required|email|max:255',
            'mother_phone'   => 'nullable|string|max:30',
            'identity_card'  => 'nullable|string|max:50',
            'baby_photo'     => 'nullable|image|mimes:jpeg,png,jpg|max:4096',
            'group_name'     => 'nullable|string|max:255',
            'birth_date'     => 'nullable|date',
            'blood_type'     => 'nullable|string|max:10',
            'birth_weight'   => 'nullable|integer|min:200|max:8000',
            'birth_length'   => 'nullable|integer|min:20|max:80',
        ]);

        $motherEmail = strtolower(trim($validated['mother_email']));

        return DB::transaction(function () use ($validated, $motherEmail, $request) {

            // 1. Encontrar ou criar usuário da mãe
            $isNewUser = false;
            $tempPassword = null;

            $mother = DB::table('users')->where('email', $motherEmail)->first();

            if (!$mother) {
                $isNewUser = true;
                $tempPassword = Str::random(10);

                $motherId = DB::table('users')->insertGetId([
                    'name'       => $validated['mother_name'],
                    'email'      => $motherEmail,
                    'password'   => Hash::make($tempPassword),
                    'phone'      => $validated['mother_phone'] ?? null,
                    'profile'    => 'caregiver',
                    'is_blocked' => false,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                $mother = DB::table('users')->where('id', $motherId)->first();
            } else {
                $motherId = $mother->id;
            }

            // 2. Upload da foto do bebê (opcional)
            $babyPhotoPath = null;
            if ($request->hasFile('baby_photo')) {
                $photo = $request->file('baby_photo');
                $ext  = $photo->getClientOriginalExtension();
                $name = 'baby_' . uniqid('', true) . '.' . $ext;
                $babyPhotoPath = 'groups/' . $name;
                Storage::disk('public')->put($babyPhotoPath, file_get_contents($photo->getRealPath()));
            }

            // 3. Gerar código único do grupo
            do {
                $code = strtoupper(Str::random(8));
                $exists = DB::table('groups')->where('code', $code)->exists();
            } while ($exists);

            $groupName = $validated['group_name'] ?? 'Grupo de ' . $validated['baby_name'];

            // 4. Criar o grupo
            $groupData = [
                'name'             => $groupName,
                'description'      => 'Grupo criado automaticamente para acompanhamento de ' . $validated['baby_name'],
                'accompanied_name' => $validated['baby_name'],
                'created_by'       => $motherId,
                'is_active'        => true,
                'code'             => $code,
                'created_at'       => now(),
                'updated_at'       => now(),
            ];

            if (Schema::hasColumn('groups', 'type')) {
                $groupData['type'] = 'care';
            }

            if ($babyPhotoPath && Schema::hasColumn('groups', 'accompanied_photo')) {
                $groupData['accompanied_photo'] = $babyPhotoPath;
            }

            $groupId = DB::table('groups')->insertGetId($groupData);

            // 5. Adicionar a mãe como admin do grupo
            DB::table('group_members')->insert([
                'group_id'   => $groupId,
                'user_id'    => $motherId,
                'role'       => 'admin',
                'joined_at'  => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // 6. Enviar e-mail sempre — credenciais se for nova, notificação de grupo se já existia
            try {
                Mail::send('emails.external-birth-group', [
                    'motherName'   => $validated['mother_name'],
                    'babyName'     => $validated['baby_name'],
                    'email'        => $motherEmail,
                    'tempPassword' => $tempPassword,   // null se usuária já existia
                    'isNewUser'    => $isNewUser,
                    'groupName'    => $groupName,
                    'groupCode'    => $code,
                    'birthDate'    => $validated['birth_date'] ?? null,
                    'bloodType'    => $validated['blood_type'] ?? null,
                    'birthWeight'  => $validated['birth_weight'] ?? null,
                    'birthLength'  => $validated['birth_length'] ?? null,
                ], function ($msg) use ($motherEmail, $validated) {
                    $msg->to($motherEmail, $validated['mother_name'])
                        ->subject('Seu bebê agora tem um grupo no Laços! 🍼');
                });
            } catch (\Exception $e) {
                \Log::warning('ExternalGroupController: falha ao enviar e-mail para ' . $motherEmail . ': ' . $e->getMessage());
            }

            $response = [
                'message'      => 'Grupo criado com sucesso.',
                'group_id'     => $groupId,
                'group_name'   => $groupName,
                'group_code'   => $code,
                'baby_name'    => $validated['baby_name'],
                'mother_email' => $motherEmail,
                'mother_is_new_user' => $isNewUser,
            ];

            if ($isNewUser) {
                $response['temp_password'] = $tempPassword;
                $response['note'] = 'Senha provisória enviada por e-mail. A mãe deve alterá-la no primeiro acesso.';
            }

            return response()->json($response, 201);
        });
    }
}
