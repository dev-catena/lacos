import React, { useState, useEffect, useRef } from 'react';
import supplierService from '../services/supplierService';
import './MessagesManagement.css';

const MessagesManagement = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
      // TODO: Implementar polling ou WebSocket para atualizar mensagens em tempo real
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await supplierService.getConversations();
      setConversations(data.conversations || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Erro ao carregar conversas');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      const data = await supplierService.getMessages(conversationId);
      setMessages(data.messages || []);
    } catch (err) {
      setError(err.message || 'Erro ao carregar mensagens');
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const response = await supplierService.sendMessage(selectedConversation.id, newMessage);
      setMessages([...messages, response.message]);
      setNewMessage('');
      // Recarregar conversas para atualizar última mensagem
      loadConversations();
    } catch (err) {
      setError(err.message || 'Erro ao enviar mensagem');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}min atrás`;
    if (hours < 24) return `${hours}h atrás`;
    if (days < 7) return `${days}d atrás`;
    
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <div className="loading">Carregando conversas...</div>;
  }

  return (
    <div className="messages-management">
      <div className="messages-header">
        <h2>Mensagens</h2>
      </div>

      {error && (
        <div className="error-message">{error}</div>
      )}

      <div className="messages-container">
        <div className="conversations-sidebar">
          <div className="conversations-header">
            <h3>Conversas</h3>
          </div>
          
          {conversations.length === 0 ? (
            <div className="empty-conversations">
              <p>Nenhuma conversa ainda.</p>
            </div>
          ) : (
            <div className="conversations-list">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`conversation-item ${selectedConversation?.id === conversation.id ? 'active' : ''}`}
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <div className="conversation-avatar">
                    {conversation.customer?.name?.charAt(0).toUpperCase() || 'C'}
                  </div>
                  <div className="conversation-info">
                    <div className="conversation-header">
                      <span className="conversation-name">
                        {conversation.customer?.name || 'Cliente'}
                      </span>
                      <span className="conversation-time">
                        {formatDate(conversation.last_message_at)}
                      </span>
                    </div>
                    <p className="conversation-preview">
                      {conversation.last_message || 'Nenhuma mensagem'}
                    </p>
                    {conversation.unread_count > 0 && (
                      <span className="unread-badge">{conversation.unread_count}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="messages-area">
          {selectedConversation ? (
            <>
              <div className="messages-header-bar">
                <div className="customer-info">
                  <div className="customer-avatar">
                    {selectedConversation.customer?.name?.charAt(0).toUpperCase() || 'C'}
                  </div>
                  <div>
                    <h3>{selectedConversation.customer?.name || 'Cliente'}</h3>
                    <p className="customer-email">{selectedConversation.customer?.email || ''}</p>
                  </div>
                </div>
              </div>

              <div className="messages-list" ref={messagesEndRef}>
                {messages.length === 0 ? (
                  <div className="empty-messages">
                    <p>Nenhuma mensagem ainda. Inicie a conversa!</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`message ${message.sender_type === 'supplier' ? 'sent' : 'received'}`}
                    >
                      <div className="message-content">
                        <p>{message.content}</p>
                        <span className="message-time">{formatDate(message.created_at)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <form className="message-input-form" onSubmit={sendMessage}>
                <input
                  type="text"
                  className="message-input"
                  placeholder="Digite sua mensagem..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button type="submit" className="btn btn-primary send-btn" disabled={!newMessage.trim()}>
                  Enviar
                </button>
              </form>
            </>
          ) : (
            <div className="no-conversation-selected">
              <p>Selecione uma conversa para começar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesManagement;

