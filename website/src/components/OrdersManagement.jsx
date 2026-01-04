import React, { useState, useEffect } from 'react';
import supplierService from '../services/supplierService';
import './OrdersManagement.css';

const OrdersManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filter, setFilter] = useState('all'); // all, pending, confirmed, shipped, delivered, cancelled

  useEffect(() => {
    loadOrders();
  }, [filter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await supplierService.getOrders({ status: filter });
      setOrders(data.orders || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      pending: 'status-pending',
      confirmed: 'status-confirmed',
      shipped: 'status-shipped',
      delivered: 'status-delivered',
      cancelled: 'status-cancelled',
    };
    return statusMap[status] || 'status-pending';
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      pending: 'Pendente',
      confirmed: 'Confirmado',
      shipped: 'Enviado',
      delivered: 'Entregue',
      cancelled: 'Cancelado',
    };
    return statusMap[status] || status;
  };

  if (loading) {
    return <div className="loading">Carregando pedidos...</div>;
  }

  return (
    <div className="orders-management">
      <div className="orders-header">
        <h2>Compras e Pedidos</h2>
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Todos
          </button>
          <button
            className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pendentes
          </button>
          <button
            className={`filter-btn ${filter === 'confirmed' ? 'active' : ''}`}
            onClick={() => setFilter('confirmed')}
          >
            Confirmados
          </button>
          <button
            className={`filter-btn ${filter === 'shipped' ? 'active' : ''}`}
            onClick={() => setFilter('shipped')}
          >
            Enviados
          </button>
          <button
            className={`filter-btn ${filter === 'delivered' ? 'active' : ''}`}
            onClick={() => setFilter('delivered')}
          >
            Entregues
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">{error}</div>
      )}

      {orders.length === 0 ? (
        <div className="empty-state">
          <p>Nenhum pedido encontrado.</p>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <div className="order-info">
                  <h3>Pedido #{order.id}</h3>
                  <span className="order-date">{formatDate(order.created_at)}</span>
                </div>
                <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>
                  {getStatusLabel(order.status)}
                </span>
              </div>

              <div className="order-details">
                <div className="order-section">
                  <h4>Dados do Comprador</h4>
                  <div className="info-row">
                    <span className="info-label">Nome:</span>
                    <span className="info-value">{order.buyer?.name || '-'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Email:</span>
                    <span className="info-value">{order.buyer?.email || '-'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Telefone:</span>
                    <span className="info-value">{order.buyer?.phone || '-'}</span>
                  </div>
                </div>

                <div className="order-section">
                  <h4>Informações da Compra</h4>
                  <div className="info-row">
                    <span className="info-label">Valor Total:</span>
                    <span className="info-value price">{formatCurrency(order.total_amount)}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Forma de Pagamento:</span>
                    <span className="info-value">{order.payment_method || '-'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Status do Pagamento:</span>
                    <span className="info-value">{order.payment_status || '-'}</span>
                  </div>
                </div>

                <div className="order-section">
                  <h4>Entrega</h4>
                  <div className="info-row">
                    <span className="info-label">Endereço:</span>
                    <span className="info-value">
                      {order.shipping_address?.address || '-'}
                      {order.shipping_address?.number && `, ${order.shipping_address.number}`}
                      {order.shipping_address?.complement && ` - ${order.shipping_address.complement}`}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Cidade/Estado:</span>
                    <span className="info-value">
                      {order.shipping_address?.city || '-'}
                      {order.shipping_address?.state && `/${order.shipping_address.state}`}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">CEP:</span>
                    <span className="info-value">{order.shipping_address?.zip_code || '-'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Status da Entrega:</span>
                    <span className="info-value">{order.shipping_status || '-'}</span>
                  </div>
                </div>

                <div className="order-section">
                  <h4>Produtos</h4>
                  <div className="products-list">
                    {order.items?.map((item, index) => (
                      <div key={index} className="order-item">
                        <span className="item-name">{item.product_name}</span>
                        <span className="item-quantity">Qtd: {item.quantity}</span>
                        <span className="item-price">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="order-actions">
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => setSelectedOrder(order)}
                >
                  Ver Detalhes
                </button>
                {order.status === 'pending' && (
                  <>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={async () => {
                        try {
                          await supplierService.updateOrderStatus(order.id, 'confirmed');
                          alert('Pedido confirmado!');
                          loadOrders();
                        } catch (err) {
                          alert('Erro ao confirmar pedido: ' + err.message);
                        }
                      }}
                    >
                      Confirmar Pedido
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={async () => {
                        if (window.confirm('Tem certeza que deseja cancelar este pedido?')) {
                          try {
                            await supplierService.updateOrderStatus(order.id, 'cancelled');
                            alert('Pedido cancelado!');
                            loadOrders();
                          } catch (err) {
                            alert('Erro ao cancelar pedido: ' + err.message);
                          }
                        }
                      }}
                    >
                      Cancelar
                    </button>
                  </>
                )}
                {order.status === 'confirmed' && (
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={async () => {
                      try {
                        await supplierService.updateOrderStatus(order.id, 'shipped');
                        alert('Pedido marcado como enviado!');
                        loadOrders();
                      } catch (err) {
                        alert('Erro ao marcar como enviado: ' + err.message);
                      }
                    }}
                  >
                    Marcar como Enviado
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedOrder && (
        <div className="order-modal">
          <div className="order-modal-content">
            <div className="modal-header">
              <h3>Detalhes do Pedido #{selectedOrder.id}</h3>
              <button
                className="close-btn"
                onClick={() => setSelectedOrder(null)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              {/* Detalhes completos do pedido */}
              <p>Detalhes completos aqui...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersManagement;

