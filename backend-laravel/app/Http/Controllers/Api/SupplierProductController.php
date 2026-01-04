<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use App\Models\SupplierProduct;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class SupplierProductController extends Controller
{
    /**
     * Listar produtos do fornecedor
     * GET /api/suppliers/products
     */
    public function index(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['success' => false, 'message' => 'Não autenticado'], 401);
            }

            $supplier = Supplier::where('user_id', $user->id)->first();
            if (!$supplier) {
                return response()->json(['success' => false, 'message' => 'Fornecedor não encontrado'], 404);
            }

            if ($supplier->status !== 'approved') {
                return response()->json(['success' => false, 'message' => 'Fornecedor não aprovado'], 403);
            }

            $products = SupplierProduct::where('supplier_id', $supplier->id)
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'products' => $products
            ], 200);
        } catch (\Exception $e) {
            Log::error('Erro ao listar produtos: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Erro ao listar produtos'], 500);
        }
    }

    /**
     * Criar produto
     * POST /api/suppliers/products
     */
    public function store(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['success' => false, 'message' => 'Não autenticado'], 401);
            }

            $supplier = Supplier::where('user_id', $user->id)->first();
            if (!$supplier) {
                return response()->json(['success' => false, 'message' => 'Fornecedor não encontrado'], 404);
            }

            if ($supplier->status !== 'approved') {
                return response()->json(['success' => false, 'message' => 'Fornecedor não aprovado'], 403);
            }

            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'price' => 'required|numeric|min:0',
                'stock' => 'required|integer|min:0',
                'category' => 'nullable|string|max:100',
                'image_url' => 'nullable|url|max:500',
                'is_active' => 'boolean',
            ], [
                'name.required' => 'O nome do produto é obrigatório',
                'name.max' => 'O nome não pode exceder 255 caracteres',
                'price.required' => 'O preço é obrigatório',
                'price.numeric' => 'O preço deve ser um número',
                'price.min' => 'O preço não pode ser negativo',
                'stock.required' => 'O estoque é obrigatório',
                'stock.integer' => 'O estoque deve ser um número inteiro',
                'stock.min' => 'O estoque não pode ser negativo',
                'image_url.url' => 'A URL da imagem deve ser válida',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dados inválidos',
                    'errors' => $validator->errors()
                ], 422);
            }

            $product = SupplierProduct::create([
                'supplier_id' => $supplier->id,
                'name' => $request->name,
                'description' => $request->description,
                'price' => $request->price,
                'stock' => $request->stock,
                'category' => $request->category,
                'image_url' => $request->image_url,
                'is_active' => $request->has('is_active') ? $request->is_active : true,
            ]);

            Log::info('Produto criado', ['product_id' => $product->id, 'supplier_id' => $supplier->id]);

            return response()->json([
                'success' => true,
                'message' => 'Produto criado com sucesso',
                'product' => $product
            ], 201);
        } catch (\Exception $e) {
            Log::error('Erro ao criar produto: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Erro ao criar produto'], 500);
        }
    }

    /**
     * Atualizar produto
     * PUT /api/suppliers/products/{id}
     */
    public function update(Request $request, $id)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['success' => false, 'message' => 'Não autenticado'], 401);
            }

            $supplier = Supplier::where('user_id', $user->id)->first();
            if (!$supplier) {
                return response()->json(['success' => false, 'message' => 'Fornecedor não encontrado'], 404);
            }

            $product = SupplierProduct::where('id', $id)
                ->where('supplier_id', $supplier->id)
                ->first();

            if (!$product) {
                return response()->json(['success' => false, 'message' => 'Produto não encontrado'], 404);
            }

            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|required|string|max:255',
                'description' => 'nullable|string',
                'price' => 'sometimes|required|numeric|min:0',
                'stock' => 'sometimes|required|integer|min:0',
                'category' => 'nullable|string|max:100',
                'image_url' => 'nullable|url|max:500',
                'is_active' => 'boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dados inválidos',
                    'errors' => $validator->errors()
                ], 422);
            }

            $product->update($request->only([
                'name', 'description', 'price', 'stock', 'category', 'image_url', 'is_active'
            ]));

            Log::info('Produto atualizado', ['product_id' => $product->id]);

            return response()->json([
                'success' => true,
                'message' => 'Produto atualizado com sucesso',
                'product' => $product
            ], 200);
        } catch (\Exception $e) {
            Log::error('Erro ao atualizar produto: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Erro ao atualizar produto'], 500);
        }
    }

    /**
     * Deletar produto
     * DELETE /api/suppliers/products/{id}
     */
    public function destroy($id)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['success' => false, 'message' => 'Não autenticado'], 401);
            }

            $supplier = Supplier::where('user_id', $user->id)->first();
            if (!$supplier) {
                return response()->json(['success' => false, 'message' => 'Fornecedor não encontrado'], 404);
            }

            $product = SupplierProduct::where('id', $id)
                ->where('supplier_id', $supplier->id)
                ->first();

            if (!$product) {
                return response()->json(['success' => false, 'message' => 'Produto não encontrado'], 404);
            }

            $product->delete();

            Log::info('Produto deletado', ['product_id' => $id]);

            return response()->json([
                'success' => true,
                'message' => 'Produto deletado com sucesso'
            ], 200);
        } catch (\Exception $e) {
            Log::error('Erro ao deletar produto: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Erro ao deletar produto'], 500);
        }
    }

    /**
     * Alternar status do produto (bloquear/desbloquear)
     * PATCH /api/suppliers/products/{id}/toggle-status
     */
    public function toggleStatus(Request $request, $id)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['success' => false, 'message' => 'Não autenticado'], 401);
            }

            $supplier = Supplier::where('user_id', $user->id)->first();
            if (!$supplier) {
                return response()->json(['success' => false, 'message' => 'Fornecedor não encontrado'], 404);
            }

            $product = SupplierProduct::where('id', $id)
                ->where('supplier_id', $supplier->id)
                ->first();

            if (!$product) {
                return response()->json(['success' => false, 'message' => 'Produto não encontrado'], 404);
            }

            $product->is_active = !$product->is_active;
            $product->save();

            Log::info('Status do produto alterado', [
                'product_id' => $product->id,
                'is_active' => $product->is_active
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Status do produto alterado com sucesso',
                'product' => $product
            ], 200);
        } catch (\Exception $e) {
            Log::error('Erro ao alterar status do produto: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Erro ao alterar status'], 500);
        }
    }
}




