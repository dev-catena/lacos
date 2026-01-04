<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class SupplierOrderController extends Controller
{
    /**
     * Listar pedidos do fornecedor
     * GET /api/suppliers/orders
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

            $query = Order::where('supplier_id', $supplier->id)
                ->with(['user', 'items']);

            // Filtro por status
            if ($request->has('status') && $request->status !== 'all') {
                $query->where('status', $request->status);
            }

            $orders = $query->orderBy('created_at', 'desc')->get();

            // Formatar resposta com dados do comprador
            $formattedOrders = $orders->map(function ($order) {
                return [
                    'id' => $order->id,
                    'order_number' => $order->order_number,
                    'created_at' => $order->created_at,
                    'status' => $order->status,
                    'shipping_status' => $order->shipping_status,
                    'total_amount' => $order->total_amount,
                    'payment_method' => $order->payment_method,
                    'payment_status' => $order->payment_status,
                    'buyer' => [
                        'name' => $order->buyer_name,
                        'email' => $order->buyer_email,
                        'phone' => $order->buyer_phone,
                    ],
                    'shipping_address' => [
                        'address' => $order->shipping_address,
                        'number' => $order->shipping_number,
                        'complement' => $order->shipping_complement,
                        'neighborhood' => $order->shipping_neighborhood,
                        'city' => $order->shipping_city,
                        'state' => $order->shipping_state,
                        'zip_code' => $order->shipping_zip_code,
                    ],
                    'items' => $order->items->map(function ($item) {
                        return [
                            'product_name' => $item->product_name,
                            'quantity' => $item->quantity,
                            'price' => $item->price,
                        ];
                    }),
                ];
            });

            return response()->json([
                'success' => true,
                'orders' => $formattedOrders
            ], 200);
        } catch (\Exception $e) {
            Log::error('Erro ao listar pedidos: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Erro ao listar pedidos'], 500);
        }
    }

    /**
     * Atualizar status do pedido
     * PATCH /api/suppliers/orders/{id}/status
     */
    public function updateStatus(Request $request, $id)
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

            $order = Order::where('id', $id)
                ->where('supplier_id', $supplier->id)
                ->first();

            if (!$order) {
                return response()->json(['success' => false, 'message' => 'Pedido não encontrado'], 404);
            }

            $validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
            $status = $request->input('status');

            if (!in_array($status, $validStatuses)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Status inválido'
                ], 422);
            }

            // Validações de transição de status
            if ($status === 'shipped' && $order->status !== 'confirmed') {
                return response()->json([
                    'success' => false,
                    'message' => 'Apenas pedidos confirmados podem ser enviados'
                ], 422);
            }

            if ($status === 'delivered' && $order->status !== 'shipped') {
                return response()->json([
                    'success' => false,
                    'message' => 'Apenas pedidos enviados podem ser marcados como entregues'
                ], 422);
            }

            $order->status = $status;
            
            // Atualizar shipping_status se necessário
            if ($status === 'shipped') {
                $order->shipping_status = 'shipped';
            } elseif ($status === 'delivered') {
                $order->shipping_status = 'delivered';
            }

            $order->save();

            Log::info('Status do pedido atualizado', [
                'order_id' => $order->id,
                'status' => $status,
                'supplier_id' => $supplier->id
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Status do pedido atualizado com sucesso',
                'order' => $order
            ], 200);
        } catch (\Exception $e) {
            Log::error('Erro ao atualizar status do pedido: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Erro ao atualizar status'], 500);
        }
    }

    /**
     * Obter detalhes de um pedido
     * GET /api/suppliers/orders/{id}
     */
    public function show($id)
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

            $order = Order::where('id', $id)
                ->where('supplier_id', $supplier->id)
                ->with(['user', 'items.product'])
                ->first();

            if (!$order) {
                return response()->json(['success' => false, 'message' => 'Pedido não encontrado'], 404);
            }

            return response()->json([
                'success' => true,
                'order' => $order
            ], 200);
        } catch (\Exception $e) {
            Log::error('Erro ao buscar pedido: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Erro ao buscar pedido'], 500);
        }
    }
}




