<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class SupplierController extends Controller
{
    /**
     * Registrar fornecedor
     * POST /api/suppliers/register
     */
    public function register(Request $request)
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuário não autenticado',
                    'error' => 'Unauthorized'
                ], 401);
            }

            // Primeiro validar os dados ANTES de verificar se já existe fornecedor
            $validator = Validator::make($request->all(), [
                'company_name' => 'required|string|max:255',
                'company_type' => 'required|in:pessoa_fisica,pessoa_juridica',
                'cnpj' => 'nullable|string|max:18',
                'cpf' => 'nullable|string|max:14',
                'address' => 'nullable|string|max:255',
                'address_number' => 'nullable|string|max:20',
                'address_complement' => 'nullable|string|max:255',
                'neighborhood' => 'nullable|string|max:100',
                'city' => 'nullable|string|max:100',
                'state' => 'nullable|string|max:2',
                'zip_code' => 'nullable|string|max:10',
                'bank_name' => 'nullable|string|max:100',
                'bank_code' => 'nullable|string|max:10',
                'agency' => 'nullable|string|max:20',
                'account' => 'nullable|string|max:50',
                'account_type' => 'nullable|in:checking,savings',
                'account_holder_name' => 'nullable|string|max:255',
                'account_holder_document' => 'nullable|string|max:20',
                'pix_key' => 'nullable|string|max:255',
                'pix_key_type' => 'nullable|string|max:20',
                'business_description' => 'nullable|string',
                'products_categories' => 'required|array|min:1',
                'products_categories.*' => 'string|max:100',
                'website' => 'nullable|url|max:255',
                'instagram' => 'nullable|string|max:255',
                'facebook' => 'nullable|string|max:255',
            ], [
                // Mensagens de obrigatoriedade
                'company_name.required' => 'O nome da empresa é obrigatório',
                'company_type.required' => 'O tipo de cadastro é obrigatório',
                'company_type.in' => 'O tipo de cadastro selecionado é inválido',
                'cnpj.required' => 'O CNPJ é obrigatório para pessoa jurídica',
                'cpf.required' => 'O CPF é obrigatório para pessoa física',
                'products_categories.required' => 'O campo categorias de produtos é obrigatório. É obrigatório selecionar pelo menos uma categoria (mínimo: 1)',
                'products_categories.min' => 'É obrigatório selecionar pelo menos uma categoria de produtos (mínimo: 1)',
                'products_categories.array' => 'As categorias devem ser um array',
                
                // Mensagens de tamanho máximo
                'company_name.max' => 'O nome da empresa não pode exceder 255 caracteres',
                'cnpj.max' => 'O CNPJ não pode exceder 18 caracteres',
                'cpf.max' => 'O CPF não pode exceder 14 caracteres',
                'state.max' => 'O estado não pode exceder 2 caracteres',
                'zip_code.max' => 'O CEP não pode exceder 10 caracteres',
                
                // Mensagens de tipo
                'account_type.in' => 'O tipo de conta selecionado é inválido',
                
                // Mensagens de formato
                'website.url' => 'O website deve ser uma URL válida',
            ]);

            // Validação condicional com mensagens customizadas
            // Usar after() para garantir que as mensagens customizadas sejam aplicadas
            $validator->after(function ($validator) use ($request) {
                if ($request->company_type === 'pessoa_juridica') {
                    if (empty($request->cnpj)) {
                        $validator->errors()->add('cnpj', 'O CNPJ é obrigatório para pessoa jurídica');
                    } elseif (strlen($request->cnpj) > 18) {
                        $validator->errors()->add('cnpj', 'O CNPJ não pode exceder 18 caracteres');
                    }
                } else if ($request->company_type === 'pessoa_fisica') {
                    if (empty($request->cpf)) {
                        $validator->errors()->add('cpf', 'O CPF é obrigatório para pessoa física');
                    } elseif (strlen($request->cpf) > 14) {
                        $validator->errors()->add('cpf', 'O CPF não pode exceder 14 caracteres');
                    }
                }
            });

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dados inválidos',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Validações de regras de negócio
            $businessErrors = [];
            
            // 1. CPF não deve ser fornecido para Pessoa Jurídica
            if ($request->company_type === 'pessoa_juridica' && !empty($request->cpf)) {
                $businessErrors['cpf'] = ['CPF não deve ser fornecido para pessoa jurídica'];
            }
            
            // 2. CNPJ não deve ser fornecido para Pessoa Física
            if ($request->company_type === 'pessoa_fisica' && !empty($request->cnpj)) {
                $businessErrors['cnpj'] = ['CNPJ não deve ser fornecido para pessoa física'];
            }
            
            // 3. Validar categorias (se fornecido)
            if ($request->has('products_categories') && is_array($request->products_categories)) {
                $validCategories = [
                    'Medicamentos', 'Suplementos', 'Equipamentos Médicos',
                    'Produtos de Higiene', 'Acessórios', 'Serviços de Saúde',
                    'Fisioterapia', 'Enfermagem Domiciliar', 'Nutrição',
                    'Produtos para o Lar', 'Dispositivos de Segurança', 'Outros'
                ];
                
                foreach ($request->products_categories as $category) {
                    if (!in_array($category, $validCategories)) {
                        $businessErrors['products_categories'] = ['A categoria "' . $category . '" é inválida'];
                        break;
                    }
                }
            }
            
            // 4. Validar estado (se fornecido)
            if (!empty($request->state)) {
                $validStates = [
                    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
                    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
                    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
                ];
                
                if (!in_array(strtoupper($request->state), $validStates)) {
                    $businessErrors['state'] = ['O estado "' . $request->state . '" é inválido'];
                }
            }
            
            // 5. Validar PIX (opcional - se fornecido, tipo pode ser opcional também)
            // Removido: PIX sem tipo pode ser aceito
            
            // Se houver erros de regras de negócio, retornar
            if (!empty($businessErrors)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dados inválidos',
                    'errors' => $businessErrors
                ], 400);
            }

            // AGORA verificar se já é fornecedor (após todas as validações)
            $existingSupplier = Supplier::where('user_id', $user->id)->first();
            if ($existingSupplier) {
                return response()->json([
                    'success' => false,
                    'message' => 'Você já possui um cadastro de fornecedor',
                    'error' => 'Already registered',
                    'supplier' => $existingSupplier
                ], 400);
            }

            // Criar fornecedor
            $supplier = Supplier::create([
                'user_id' => $user->id,
                'company_name' => $request->company_name,
                'company_type' => $request->company_type,
                'cnpj' => $request->cnpj,
                'cpf' => $request->cpf,
                'address' => $request->address,
                'address_number' => $request->address_number,
                'address_complement' => $request->address_complement,
                'neighborhood' => $request->neighborhood,
                'city' => $request->city,
                'state' => $request->state,
                'zip_code' => $request->zip_code,
                'bank_name' => $request->bank_name,
                'bank_code' => $request->bank_code,
                'agency' => $request->agency,
                'account' => $request->account,
                'account_type' => $request->account_type,
                'account_holder_name' => $request->account_holder_name,
                'account_holder_document' => $request->account_holder_document,
                'pix_key' => $request->pix_key,
                'pix_key_type' => $request->pix_key_type,
                'business_description' => $request->business_description,
                'website' => $request->website,
                'instagram' => $request->instagram,
                'facebook' => $request->facebook,
                'status' => 'pending',
            ]);

            // Salvar categorias
            if ($request->has('products_categories') && is_array($request->products_categories)) {
                foreach ($request->products_categories as $category) {
                    $supplier->categories()->create([
                        'category' => $category
                    ]);
                }
            }

            Log::info('Fornecedor cadastrado', [
                'supplier_id' => $supplier->id,
                'user_id' => $user->id,
                'company_name' => $supplier->company_name
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Cadastro de fornecedor enviado com sucesso. Aguarde a aprovação.',
                'supplier' => $supplier->load('categories')
            ], 201);

        } catch (\Exception $e) {
            Log::error('Erro ao cadastrar fornecedor: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'user_id' => Auth::id()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erro ao cadastrar fornecedor',
                'error' => 'Server Error',
                'details' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Obter dados do fornecedor do usuário logado
     * GET /api/suppliers/me
     */
    public function getMySupplier(Request $request)
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuário não autenticado'
                ], 401);
            }

            $supplier = Supplier::where('user_id', $user->id)
                ->with('categories')
                ->first();
            
            // Carregar categorias manualmente se necessário
            if ($supplier && !$supplier->relationLoaded('categories')) {
                $supplier->load('categories');
            }

            if (!$supplier) {
                return response()->json([
                    'success' => false,
                    'message' => 'Fornecedor não encontrado'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'supplier' => $supplier
            ]);

        } catch (\Exception $e) {
            Log::error('Erro ao buscar fornecedor: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Erro ao buscar fornecedor',
                'error' => 'Server Error'
            ], 500);
        }
    }

    /**
     * Listar todos os fornecedores (apenas root/admin)
     * GET /api/suppliers
     */
    public function index(Request $request)
    {
        try {
            $user = Auth::user();

            // Verificar se é root: por campo is_root ou por email root@lacos.com ou admin@lacos.com
            $isRoot = ($user->is_root ?? false) || ($user->email === 'root@lacos.com') || ($user->email === 'admin@lacos.com');

            if (!$user || !$isRoot) {
                return response()->json([
                    'success' => false,
                    'message' => 'Acesso negado. Apenas usuários root podem acessar esta funcionalidade.'
                ], 403);
            }

            $query = Supplier::with(['user', 'categories']);

            // Filtro por status
            if ($request->has('status') && $request->status !== 'all') {
                $query->where('status', $request->status);
            }

            // Busca por nome da empresa
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('company_name', 'like', "%{$search}%")
                      ->orWhere('cnpj', 'like', "%{$search}%")
                      ->orWhere('cpf', 'like', "%{$search}%");
                });
            }

            $suppliers = $query->orderBy('created_at', 'desc')->get();

            return response()->json([
                'success' => true,
                'suppliers' => $suppliers
            ]);

        } catch (\Exception $e) {
            Log::error('Erro ao listar fornecedores: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Erro ao listar fornecedores',
                'error' => 'Server Error'
            ], 500);
        }
    }

    /**
     * Aprovar fornecedor (apenas root/admin)
     * PUT /api/suppliers/{id}/approve
     */
    public function approve($id)
    {
        try {
            $user = Auth::user();

            // Verificar se é root: por campo is_root ou por email root@lacos.com
            $isRoot = ($user->is_root ?? false) || ($user->email === 'root@lacos.com');

            if (!$user || !$isRoot) {
                return response()->json([
                    'success' => false,
                    'message' => 'Acesso negado. Apenas usuários root podem aprovar fornecedores.'
                ], 403);
            }

            $supplier = Supplier::findOrFail($id);
            
            $supplier->status = 'approved';
            $supplier->approved_at = now();
            $supplier->rejected_reason = null;
            $supplier->save();

            Log::info('Fornecedor aprovado', [
                'supplier_id' => $supplier->id,
                'approved_by' => $user->id
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Fornecedor aprovado com sucesso',
                'supplier' => $supplier->load(['user', 'categories'])
            ]);

        } catch (\Exception $e) {
            Log::error('Erro ao aprovar fornecedor: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Erro ao aprovar fornecedor',
                'error' => 'Server Error'
            ], 500);
        }
    }

    /**
     * Reprovar fornecedor (apenas root/admin)
     * PUT /api/suppliers/{id}/reject
     */
    public function reject(Request $request, $id)
    {
        try {
            $user = Auth::user();

            // Verificar se é root: por campo is_root ou por email root@lacos.com
            $isRoot = ($user->is_root ?? false) || ($user->email === 'root@lacos.com');

            if (!$user || !$isRoot) {
                return response()->json([
                    'success' => false,
                    'message' => 'Acesso negado. Apenas usuários root podem reprovar fornecedores.'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'reason' => 'required|string|max:1000'
            ], [
                'reason.required' => 'O motivo da reprovação é obrigatório'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dados inválidos',
                    'errors' => $validator->errors()
                ], 422);
            }

            $supplier = Supplier::findOrFail($id);
            
            $supplier->status = 'rejected';
            $supplier->rejected_reason = $request->reason;
            $supplier->approved_at = null;
            $supplier->save();

            Log::info('Fornecedor reprovado', [
                'supplier_id' => $supplier->id,
                'rejected_by' => $user->id,
                'reason' => $request->reason
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Fornecedor reprovado com sucesso',
                'supplier' => $supplier->load(['user', 'categories'])
            ]);

        } catch (\Exception $e) {
            Log::error('Erro ao reprovar fornecedor: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Erro ao reprovar fornecedor',
                'error' => 'Server Error'
            ], 500);
        }
    }

    /**
     * Excluir fornecedor (apenas root/admin)
     * DELETE /api/suppliers/{id}
     */
    public function destroy($id)
    {
        try {
            $user = Auth::user();

            // Verificar se é root: por campo is_root ou por email root@lacos.com
            $isRoot = ($user->is_root ?? false) || ($user->email === 'root@lacos.com');

            if (!$user || !$isRoot) {
                return response()->json([
                    'success' => false,
                    'message' => 'Acesso negado. Apenas usuários root podem excluir fornecedores.'
                ], 403);
            }

            $supplier = Supplier::findOrFail($id);
            $supplierId = $supplier->id;
            $companyName = $supplier->company_name;
            
            $supplier->delete();

            Log::info('Fornecedor excluído', [
                'supplier_id' => $supplierId,
                'company_name' => $companyName,
                'deleted_by' => $user->id
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Fornecedor excluído com sucesso'
            ]);

        } catch (\Exception $e) {
            Log::error('Erro ao excluir fornecedor: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Erro ao excluir fornecedor',
                'error' => 'Server Error'
            ], 500);
        }
    }
}

