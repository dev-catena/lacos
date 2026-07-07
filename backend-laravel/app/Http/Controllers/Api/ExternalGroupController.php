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
     * Cria um grupo Kids para um bebê a partir de um app externo (ex: maternidade/spec).
     *
     * Payload esperado (multipart/form-data ou JSON):
     *   - baby_name         string, required
     *   - mother_name       string, required
     *   - mother_email      string, required, email
     *   - mother_phone      string, optional
     *   - identity_card     string, optional (RG/CPF/matrícula)
     *   - baby_photo        file (image), optional
     *   - group_name        string, optional (padrão: "Grupo de {baby_name}")
     *   - password          string, optional (min:8) — se informada, usada como senha da mãe
     *                       em vez de senha aleatória; ignorada se a mãe já for usuária
     *   - birth_date        date, optional
     *   - blood_type        string, optional
     *   - birth_weight      numeric, optional (gramas)
     *   - birth_length      numeric, optional (cm)
     *
     * Retorna o grupo criado com code de convite e credenciais da mãe.
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
            'password'       => 'nullable|string|min:8|max:255',
            'birth_date'     => 'nullable|date',
            'blood_type'     => 'nullable|string|max:10',
            'birth_weight'   => 'nullable|numeric|min:200|max:8000',
            'birth_length'   => 'nullable|numeric|min:20|max:80',
        ]);

        $motherEmail = strtolower(trim($validated['mother_email']));

        return DB::transaction(function () use ($validated, $motherEmail, $request) {

            // 1. Encontrar ou criar usuário da mãe
            $isNewUser = false;
            $usedPassword = null;

            $mother = DB::table('users')->where('email', $motherEmail)->first();

            if (!$mother) {
                $isNewUser = true;
                // Usar senha fornecida pelo spec/formulário ou gerar uma aleatória
                $usedPassword = $validated['password'] ?? Str::random(10);

                $motherId = DB::table('users')->insertGetId([
                    'name'       => $validated['mother_name'],
                    'email'      => $motherEmail,
                    'password'   => Hash::make($usedPassword),
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

            if (Schema::hasColumn('groups', 'group_type')) {
                $groupData['group_type'] = 'kids';
            }

            if (Schema::hasColumn('groups', 'mother_name')) {
                $groupData['mother_name'] = $validated['mother_name'];
            }

            if (!empty($validated['birth_date']) && Schema::hasColumn('groups', 'accompanied_birth_date')) {
                $groupData['accompanied_birth_date'] = $validated['birth_date'];
            }

            if (!empty($validated['blood_type']) && Schema::hasColumn('groups', 'blood_type')) {
                $groupData['blood_type'] = $validated['blood_type'];
            }

            if (!empty($validated['birth_weight']) && Schema::hasColumn('groups', 'birth_weight')) {
                $groupData['birth_weight'] = $validated['birth_weight'];
            }

            if (!empty($validated['birth_length']) && Schema::hasColumn('groups', 'birth_height')) {
                $groupData['birth_height'] = $validated['birth_length'];
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
                    'tempPassword' => $usedPassword,   // null se usuária já existia
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
                'message'            => 'Grupo criado com sucesso.',
                'group_id'           => $groupId,
                'group_name'         => $groupName,
                'group_code'         => $code,
                'group_type'         => 'kids',
                'baby_name'          => $validated['baby_name'],
                'mother_email'       => $motherEmail,
                'mother_is_new_user' => $isNewUser,
            ];

            if ($isNewUser) {
                // Retorna indicação de senha apenas se foi gerada aleatoriamente (sem password no payload)
                $passwordWasProvided = !empty($validated['password']);
                if (!$passwordWasProvided) {
                    $response['temp_password'] = $usedPassword;
                    $response['note'] = 'Senha provisória enviada por e-mail. A mãe deve alterá-la no primeiro acesso.';
                } else {
                    $response['note'] = 'Usuária criada com a senha definida pela mãe.';
                }
            }

            return response()->json($response, 201);
        });
    }
}
