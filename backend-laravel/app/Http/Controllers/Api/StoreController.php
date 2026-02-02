<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SupplierProduct;
use App\Models\Supplier;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Plan;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class StoreController extends Controller
{
    /**
     * Listar produtos disponíveis na loja (público)
     * GET /api/store/products
     */
    public function getProducts(Request $request)
    {
        try {
            // Verificar se o usuário tem acesso ao módulo loja (se autenticado)
            $user = Auth::user();
            if ($user) {
                $userPlan = DB::table('user_plans')
                    ->where('user_id', $user->id)
                    ->where('is_active', true)
                    ->first();
                
                if ($userPlan) {
                    $plan = Plan::find($userPlan->plan_id);
                    if ($plan && is_array($plan->features) && !($plan->features['loja'] ?? false)) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Módulo Loja não está disponível no seu plano'
                        ], 403);
                    }
                }
            }

            $query = SupplierProduct::where('is_active', true)
                ->whereHas('supplier', function($q) {
                    $q->where('status', 'approved');
                })
                ->with(['supplier:id,company_name,company_type']);

            // Filtros
            if ($request->has('category') && $request->category) {
                $query->where('category', $request->category);
            }

            if ($request->has('supplier_id') && $request->supplier_id) {
                $query->where('supplier_id', $request->supplier_id);
            }

            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%");
                });
            }

            // Ordenação
            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            $products = $query->paginate($request->get('per_page', 20));

            return response()->json([
                'success' => true,
                'products' => $products->items(),
                'pagination' => [
                    'current_page' => $products->currentPage(),
                    'last_page' => $products->lastPage(),
                    'per_page' => $products->perPage(),
                    'total' => $products->total(),
                ]
            ], 200);
        } catch (\Exception $e) {
            Log::error('Erro ao listar produtos da loja: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erro ao listar produtos'
            ], 500);
        }
    }

    /**
     * Obter detalhes de um produto
     * GET /api/store/products/{id}
     */
    public function getProduct($id)
    {
        try {
            $product = SupplierProduct::where('id', $id)
                ->where('is_active', true)
                ->whereHas('supplier', function($q) {
                    $q->where('status', 'approved');
                })
                ->with(['supplier:id,company_name,company_type,city,state'])
                ->first();

            if (!$product) {
                return response()->json([
                    'success' => false,
                    'message' => 'Produto não encontrado'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'product' => $product
            ], 200);
        } catch (\Exception $e) {
            Log::error('Erro ao obter produto: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erro ao obter produto'
            ], 500);
        }
    }

    /**
     * Criar pedido
     * POST /api/store/orders
     */
    public function createOrder(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Não autenticado'
                ], 401);
            }

            // Verificar acesso ao módulo loja
            $userPlan = DB::table('user_plans')
                ->where('user_id', $user->id)
                ->where('is_active', true)
                ->first();
            
            if ($userPlan) {
                $plan = Plan::find($userPlan->plan_id);
                if ($plan && is_array($plan->features) && !($plan->features['loja'] ?? false)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Módulo Loja não está disponível no seu plano'
                    ], 403);
                }
            }

            $validator = Validator::make($request->all(), [
                'items' => 'required|array|min:1',
                'items.*.product_id' => 'required|exists:supplier_products,id',
                'items.*.quantity' => 'required|integer|min:1',
                'payment_method' => 'required|in:credit_card,debit_card,pix,boleto',
                'shipping_address' => 'required|string|max:255',
                'shipping_number' => 'required|string|max:20',
                'shipping_complement' => 'nullable|string|max:100',
                'shipping_neighborhood' => 'required|string|max:100',
                'shipping_city' => 'required|string|max:100',
                'shipping_state' => 'required|string|size:2',
                'shipping_zip_code' => 'required|string|max:10',
                'buyer_name' => 'required|string|max:255',
                'buyer_email' => 'required|email|max:255',
                'buyer_phone' => 'required|string|max:20',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dados inválidos',
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            try {
                // Validar produtos e calcular total
                $totalAmount = 0;
                $supplierId = null;
                $itemsData = [];

                foreach ($request->items as $item) {
                    $product = SupplierProduct::where('id', $item['product_id'])
                        ->where('is_active', true)
                        ->whereHas('supplier', function($q) {
                            $q->where('status', 'approved');
                        })
                        ->first();

                    if (!$product) {
                        throw new \Exception("Produto ID {$item['product_id']} não encontrado ou indisponível");
                    }

                    if ($product->stock < $item['quantity']) {
                        throw new \Exception("Estoque insuficiente para o produto: {$product->name}");
                    }

                    if ($supplierId === null) {
                        $supplierId = $product->supplier_id;
                    } elseif ($supplierId !== $product->supplier_id) {
                        throw new \Exception("Todos os produtos devem ser do mesmo fornecedor");
                    }

                    $itemTotal = $product->price * $item['quantity'];
                    $totalAmount += $itemTotal;

                    $itemsData[] = [
                        'product' => $product,
                        'quantity' => $item['quantity'],
                        'price' => $product->price,
                        'subtotal' => $itemTotal,
                    ];
                }

                // Adicionar taxa de entrega se aplicável
                $deliveryFee = 0;
                if ($request->has('delivery_method') && $request->delivery_method === 'delivery') {
                    // Calcular frete (simplificado - pode ser expandido)
                    $deliveryFee = $itemsData[0]['product']->delivery_fee ?? 0;
                    if ($itemsData[0]['product']->free_delivery_above && $totalAmount >= ($itemsData[0]['product']->free_delivery_threshold ?? 0)) {
                        $deliveryFee = 0;
                    }
                    $totalAmount += $deliveryFee;
                }

                // Criar pedido
                $order = Order::create([
                    'user_id' => $user->id,
                    'supplier_id' => $supplierId,
                    'order_number' => Order::generateOrderNumber(),
                    'buyer_name' => $request->buyer_name,
                    'buyer_email' => $request->buyer_email,
                    'buyer_phone' => $request->buyer_phone,
                    'total_amount' => $totalAmount,
                    'payment_method' => $request->payment_method,
                    'payment_status' => 'pending',
                    'shipping_address' => $request->shipping_address,
                    'shipping_number' => $request->shipping_number,
                    'shipping_complement' => $request->shipping_complement,
                    'shipping_neighborhood' => $request->shipping_neighborhood,
                    'shipping_city' => $request->shipping_city,
                    'shipping_state' => $request->shipping_state,
                    'shipping_zip_code' => $request->shipping_zip_code,
                    'status' => 'pending',
                    'shipping_status' => 'pending',
                ]);

                // Criar itens do pedido
                foreach ($itemsData as $itemData) {
                    OrderItem::create([
                        'order_id' => $order->id,
                        'product_id' => $itemData['product']->id,
                        'quantity' => $itemData['quantity'],
                        'price' => $itemData['price'],
                        'subtotal' => $itemData['subtotal'],
                    ]);

                    // Atualizar estoque
                    $itemData['product']->stock -= $itemData['quantity'];
                    $itemData['product']->save();
                }

                DB::commit();

                // Carregar relacionamentos
                $order->load(['items.product', 'supplier']);

                Log::info('Pedido criado', ['order_id' => $order->id, 'user_id' => $user->id]);

                return response()->json([
                    'success' => true,
                    'message' => 'Pedido criado com sucesso',
                    'order' => $order
                ], 201);

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (\Exception $e) {
            Log::error('Erro ao criar pedido: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage() ?: 'Erro ao criar pedido'
            ], 500);
        }
    }

    /**
     * Listar pedidos do usuário
     * GET /api/store/orders
     */
    public function getOrders(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Não autenticado'
                ], 401);
            }

            $query = Order::where('user_id', $user->id)
                ->with(['items.product', 'supplier:id,company_name']);

            if ($request->has('status') && $request->status) {
                $query->where('status', $request->status);
            }

            $orders = $query->orderBy('created_at', 'desc')
                ->paginate($request->get('per_page', 20));

            return response()->json([
                'success' => true,
                'orders' => $orders->items(),
                'pagination' => [
                    'current_page' => $orders->currentPage(),
                    'last_page' => $orders->lastPage(),
                    'per_page' => $orders->perPage(),
                    'total' => $orders->total(),
                ]
            ], 200);
        } catch (\Exception $e) {
            Log::error('Erro ao listar pedidos: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erro ao listar pedidos'
            ], 500);
        }
    }

    /**
     * Obter detalhes de um pedido
     * GET /api/store/orders/{id}
     */
    public function getOrder($id)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Não autenticado'
                ], 401);
            }

            $order = Order::where('id', $id)
                ->where('user_id', $user->id)
                ->with(['items.product', 'supplier'])
                ->first();

            if (!$order) {
                return response()->json([
                    'success' => false,
                    'message' => 'Pedido não encontrado'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'order' => $order
            ], 200);
        } catch (\Exception $e) {
            Log::error('Erro ao obter pedido: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erro ao obter pedido'
            ], 500);
        }
    }

    /**
     * Cancelar pedido
     * POST /api/store/orders/{id}/cancel
     */
    public function cancelOrder($id)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Não autenticado'
                ], 401);
            }

            $order = Order::where('id', $id)
                ->where('user_id', $user->id)
                ->with('items.product')
                ->first();

            if (!$order) {
                return response()->json([
                    'success' => false,
                    'message' => 'Pedido não encontrado'
                ], 404);
            }

            // Só pode cancelar se estiver pendente ou confirmado
            if (!in_array($order->status, ['pending', 'confirmed', 'processing'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Pedido não pode ser cancelado neste status'
                ], 400);
            }

            DB::beginTransaction();

            try {
                // Restaurar estoque
                foreach ($order->items as $item) {
                    if ($item->product) {
                        $item->product->stock += $item->quantity;
                        $item->product->save();
                    }
                }

                // Atualizar status
                $order->status = 'cancelled';
                $order->payment_status = 'refunded';
                $order->save();

                DB::commit();

                Log::info('Pedido cancelado', ['order_id' => $order->id, 'user_id' => $user->id]);

                return response()->json([
                    'success' => true,
                    'message' => 'Pedido cancelado com sucesso',
                    'order' => $order
                ], 200);

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (\Exception $e) {
            Log::error('Erro ao cancelar pedido: ' . $e->getMessage());
      return response()->json([
        'success' => false,
        'message' => 'Erro ao cancelar pedido'
      ], 500);
    }
  }

  /**
   * Obter conversa relacionada ao pedido (para cliente)
   * GET /api/store/orders/{id}/conversation
   */
  public function getOrderConversation($id)
  {
    try {
      $user = Auth::user();
      if (!$user) {
        return response()->json([
          'success' => false,
          'message' => 'Não autenticado'
        ], 401);
      }

      $order = Order::where('id', $id)
        ->where('user_id', $user->id)
        ->first();

      if (!$order) {
        return response()->json([
          'success' => false,
          'message' => 'Pedido não encontrado'
        ], 404);
      }

      // Buscar conversa relacionada ao pedido
      $conversation = Conversation::where('order_id', $order->id)
        ->where('user_id', $user->id)
        ->first();

      if (!$conversation) {
        // Retornar estrutura vazia - conversa será criada ao enviar primeira mensagem
        return response()->json([
          'success' => true,
          'conversations' => []
        ], 200);
      }

      return response()->json([
        'success' => true,
        'conversations' => [$conversation]
      ], 200);
    } catch (\Exception $e) {
      Log::error('Erro ao buscar conversa do pedido: ' . $e->getMessage());
      return response()->json([
        'success' => false,
        'message' => 'Erro ao buscar conversa'
      ], 500);
    }
  }

  /**
   * Obter mensagens de uma conversa (para cliente)
   * GET /api/store/conversations/{id}/messages
   */
  public function getConversationMessages($id)
  {
    try {
      $user = Auth::user();
      if (!$user) {
        return response()->json([
          'success' => false,
          'message' => 'Não autenticado'
        ], 401);
      }

      $conversation = Conversation::where('id', $id)
        ->where('user_id', $user->id)
        ->first();

      if (!$conversation) {
        return response()->json([
          'success' => false,
          'message' => 'Conversa não encontrada'
        ], 404);
      }

      // Marcar mensagens do fornecedor como lidas
      Message::where('conversation_id', $conversation->id)
        ->where('sender_type', 'supplier')
        ->where('is_read', false)
        ->update(['is_read' => true]);

      // Atualizar contador
      $conversation->unread_count_user = 0;
      $conversation->save();

      $messages = Message::where('conversation_id', $conversation->id)
        ->orderBy('created_at', 'asc')
        ->get();

      return response()->json([
        'success' => true,
        'messages' => $messages
      ], 200);
    } catch (\Exception $e) {
      Log::error('Erro ao buscar mensagens: ' . $e->getMessage());
      return response()->json([
        'success' => false,
        'message' => 'Erro ao buscar mensagens'
      ], 500);
    }
  }

  /**
   * Enviar mensagem em uma conversa (para cliente)
   * POST /api/store/conversations/{id}/messages
   */
  public function sendMessage(Request $request, $id)
  {
    try {
      $user = Auth::user();
      if (!$user) {
        return response()->json([
          'success' => false,
          'message' => 'Não autenticado'
        ], 401);
      }

      $validator = Validator::make($request->all(), [
        'content' => 'required|string|max:5000',
      ], [
        'content.required' => 'A mensagem é obrigatória',
        'content.max' => 'A mensagem não pode exceder 5000 caracteres',
      ]);

      if ($validator->fails()) {
        return response()->json([
          'success' => false,
          'message' => 'Dados inválidos',
          'errors' => $validator->errors()
        ], 422);
      }

      // Se id for null ou 'new', criar nova conversa
      $conversation = null;
      if ($id && $id !== 'new') {
        $conversation = Conversation::where('id', $id)
          ->where('user_id', $user->id)
          ->first();
      }

      // Se não encontrou conversa, criar nova baseada no pedido
      if (!$conversation) {
        // Buscar order_id do request ou da última conversa tentada
        $orderId = $request->order_id;
        if (!$orderId) {
          return response()->json([
            'success' => false,
            'message' => 'order_id é necessário para criar nova conversa'
          ], 400);
        }

        $order = Order::where('id', $orderId)
          ->where('user_id', $user->id)
          ->first();

        if (!$order) {
          return response()->json([
            'success' => false,
            'message' => 'Pedido não encontrado'
          ], 404);
        }

        // Verificar se já existe conversa para este pedido
        $conversation = Conversation::where('order_id', $order->id)
          ->where('user_id', $user->id)
          ->first();

        if (!$conversation) {
          // Criar nova conversa
          $conversation = Conversation::create([
            'user_id' => $user->id,
            'supplier_id' => $order->supplier_id,
            'order_id' => $order->id,
            'last_message' => substr($request->content, 0, 200),
            'last_message_at' => now(),
            'unread_count_user' => 0,
            'unread_count_supplier' => 0,
          ]);
        }
      }

      // Criar mensagem
      $message = Message::create([
        'conversation_id' => $conversation->id,
        'sender_type' => 'user',
        'content' => $request->content,
        'is_read' => false,
      ]);

      // Atualizar última mensagem da conversa
      $conversation->last_message = substr($request->content, 0, 200);
      $conversation->last_message_at = now();
      $conversation->unread_count_supplier += 1;
      $conversation->save();

      Log::info('Mensagem enviada pelo cliente', [
        'message_id' => $message->id,
        'conversation_id' => $conversation->id,
        'user_id' => $user->id
      ]);

      return response()->json([
        'success' => true,
        'message' => $message,
        'conversation' => $conversation
      ], 201);
    } catch (\Exception $e) {
      Log::error('Erro ao enviar mensagem: ' . $e->getMessage());
      return response()->json([
        'success' => false,
        'message' => 'Erro ao enviar mensagem'
      ], 500);
    }
  }
}

