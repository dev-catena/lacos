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
     *   - baby_photo_url    string (URL da foto), optional — alternativa ao upload de arquivo;
     *                       o backend faz o download e armazena localmente
     *   - group_name        string, optional (padrão: "Grupo de {baby_name}")
     *   - password          string, optional (min:8) — se informada, usada como senha da mãe
     *                       em vez de senha aleatória; ignorada se a mãe já for usuária
     *   - birth_date        date, optional
     *   - birth_time        string, optional (HH:MM ou HH:MM:SS)
     *   - baby_sex          string, optional (male|female)
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
            'baby_photo_url' => 'nullable|url|max:2048',
            'group_name'     => 'nullable|string|max:255',
            'password'       => 'nullable|string|min:6|max:255',
            'birth_date'     => 'nullable|date',
            'birth_time'     => 'nullable|regex:/^\d{1,2}:\d{2}(:\d{2})?$/',
            'baby_sex'       => 'nullable|in:male,female',
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
                // Conta nova: cria com a senha fornecida ou gera uma aleatória
                $isNewUser = true;
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
                // Conta já existe — exige verificação da senha existente
                $providedPassword = $validated['password'] ?? null;

                if (!$providedPassword) {
                    // Nenhuma senha enviada: avisa que conta já existe
                    return response()->json([
                        'error'   => 'account_exists',
                        'message' => 'Este e-mail já possui uma conta no Laços. Digite sua senha do Laços para entrar no grupo.',
                    ], 409);
                }

                if (!Hash::check($providedPassword, $mother->password)) {
                    // Senha errada
                    return response()->json([
                        'error'   => 'wrong_password',
                        'message' => 'Senha incorreta para esta conta. Se não lembrar a senha, peça à maternidade para usar um e-mail diferente.',
                    ], 409);
                }

                // Senha correta: usa a conta existente
                $motherId = $mother->id;
            }

            // 2. Upload da foto do bebê (opcional — arquivo OU URL)
            $babyPhotoPath = null;
            if ($request->hasFile('baby_photo')) {
                $photo = $request->file('baby_photo');
                $ext  = $photo->getClientOriginalExtension();
                $name = 'baby_' . uniqid('', true) . '.' . $ext;
                $babyPhotoPath = 'groups/' . $name;
                Storage::disk('public')->put($babyPhotoPath, file_get_contents($photo->getRealPath()));
            } elseif (!empty($validated['baby_photo_url'])) {
                // Tenta baixar a foto a partir da URL enviada pelo app externo
                try {
                    $imageContent = @file_get_contents($validated['baby_photo_url']);
                    if ($imageContent !== false) {
                        // Detectar extensão pela URL; fallback para jpg
                        $urlPath = parse_url($validated['baby_photo_url'], PHP_URL_PATH);
                        $urlExt  = $urlPath ? strtolower(pathinfo($urlPath, PATHINFO_EXTENSION)) : '';
                        $ext     = in_array($urlExt, ['jpg', 'jpeg', 'png']) ? $urlExt : 'jpg';
                        $name    = 'baby_' . uniqid('', true) . '.' . $ext;
                        $babyPhotoPath = 'groups/' . $name;
                        Storage::disk('public')->put($babyPhotoPath, $imageContent);
                    }
                } catch (\Exception $e) {
                    \Log::warning('ExternalGroupController: falha ao baixar foto de URL "' . $validated['baby_photo_url'] . '": ' . $e->getMessage());
                }
            }

            $groupName = $validated['group_name'] ?? 'Grupo de ' . $validated['baby_name'];

            // lockForUpdate() impede que duas requisições simultâneas passem
            // pela verificação ao mesmo tempo (evita race condition / duplicata).
            $existingGroup = DB::table('groups')
                ->where('created_by', $motherId)
                ->where('name', $groupName)
                ->when(Schema::hasColumn('groups', 'deleted_at'), fn ($q) => $q->whereNull('deleted_at'))
                ->lockForUpdate()
                ->first();

            if ($existingGroup) {
                return response()->json([
                    'error'      => 'group_exists',
                    'message'    => "Já existe um grupo chamado \"{$groupName}\" para esta mãe. Acesse o app Laços para visualizá-lo.",
                    'group_id'   => $existingGroup->id,
                    'group_name' => $existingGroup->name,
                    'group_code' => $existingGroup->code,
                ], 409);
            }

            // 3. Gerar código único do grupo
            do {
                $code = strtoupper(Str::random(8));
                $codeExists = DB::table('groups')->where('code', $code)->exists();
            } while ($codeExists);

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

            if (!empty($validated['birth_time']) && Schema::hasColumn('groups', 'birth_time')) {
                $groupData['birth_time'] = $validated['birth_time'];
            }

            if (!empty($validated['baby_sex']) && Schema::hasColumn('groups', 'accompanied_gender')) {
                $groupData['accompanied_gender'] = $validated['baby_sex'];
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
                    'birthTime'    => $validated['birth_time'] ?? null,
                    'babySex'      => $validated['baby_sex'] ?? null,
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
                'baby_sex'           => $validated['baby_sex'] ?? null,
                'birth_time'         => $validated['birth_time'] ?? null,
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
