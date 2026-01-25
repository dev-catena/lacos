import React, { useState, useEffect } from 'react';
import supplierService from '../services/supplierService';
import './ProductsManagement.css';

// Lista de categorias válidas (mesma do cadastro de fornecedor)
const VALID_CATEGORIES = [
  'Medicamentos',
  'Suplementos',
  'Equipamentos Médicos',
  'Produtos de Higiene',
  'Acessórios',
  'Serviços de Saúde',
  'Fisioterapia',
  'Enfermagem Domiciliar',
  'Nutrição',
  'Produtos para o Lar',
  'Dispositivos de Segurança',
  'Outros'
];

const ProductsManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    photos: [],
    payment_methods: [],
    shipping_methods: [],
    is_active: true,
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await supplierService.getProducts();
      setProducts(data.products || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      
      // Validação: pelo menos uma imagem é obrigatória
      if (uploadedImages.length === 0) {
        setError('Por favor, adicione pelo menos uma imagem do produto.');
        return;
      }
      
      const productData = await prepareProductData();
      
      if (editingProduct) {
        await supplierService.updateProduct(editingProduct.id, productData);
        alert('Produto atualizado com sucesso!');
      } else {
        await supplierService.createProduct(productData);
        alert('Produto criado com sucesso!');
      }
      setShowForm(false);
      setEditingProduct(null);
      resetForm();
      loadProducts();
    } catch (err) {
      setError(err.message || 'Erro ao salvar produto');
    }
  };

  // Função para formatar preço em R$ (exibe com máscara)
  const formatPriceDisplay = (value) => {
    if (!value) return '';
    // Se já é um número, formatar
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '';
    
    // Formatar como R$ X.XXX,XX
    return numValue.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Função para lidar com mudança de preço com máscara de Real
  const handlePriceChange = (e) => {
    let value = e.target.value;
    
    // Remove tudo que não é dígito
    value = value.replace(/\D/g, '');
    
    // Se estiver vazio, limpar
    if (value === '') {
      setFormData({ ...formData, price: '' });
      return;
    }
    
    // Converte para número (centavos)
    const numValue = parseFloat(value) / 100;
    
    // Salva o valor numérico
    if (!isNaN(numValue) && numValue >= 0) {
      setFormData({ ...formData, price: numValue.toFixed(2) });
    }
  };

  // Função para lidar com upload de imagens
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const maxImages = 8;
    const currentCount = uploadedImages.length;
    
    if (currentCount + files.length > maxImages) {
      alert(`Você pode adicionar no máximo ${maxImages} imagens. Já possui ${currentCount} imagem(ns).`);
      return;
    }

    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name
    }));

    setUploadedImages([...uploadedImages, ...newImages]);
  };

  // Função para remover imagem
  const handleRemoveImage = (index) => {
    const newImages = [...uploadedImages];
    URL.revokeObjectURL(newImages[index].preview);
    newImages.splice(index, 1);
    setUploadedImages(newImages);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      description: product.description || '',
      price: product.price || '',
      stock: product.stock || '',
      category: product.category || '',
      photos: product.photos || [],
      payment_methods: product.payment_methods || [],
      shipping_methods: product.shipping_methods || [],
      is_active: product.is_active !== false,
    });
    
    // Se o produto já tem fotos (URLs), criar previews
    const photos = product.photos || [];
    if (product.image_url && !photos.includes(product.image_url)) {
      photos.unshift(product.image_url);
    }
    
    if (photos.length > 0) {
      const existingPreviews = photos.map((url, idx) => ({
        file: null,
        preview: url,
        name: `Imagem ${idx + 1}`,
        isExisting: true
      }));
      setUploadedImages(existingPreviews);
    } else {
      setUploadedImages([]);
    }
    
    setShowForm(true);
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Tem certeza que deseja excluir este produto?')) {
      return;
    }
    try {
      await supplierService.deleteProduct(productId);
      alert('Produto excluído com sucesso!');
      loadProducts();
    } catch (err) {
      setError(err.message || 'Erro ao excluir produto');
    }
  };

  const handleToggleBlock = async (product) => {
    try {
      await supplierService.toggleProductStatus(product.id, !product.is_active);
      alert(`Produto ${product.is_active ? 'bloqueado' : 'desbloqueado'} com sucesso!`);
      loadProducts();
    } catch (err) {
      setError(err.message || 'Erro ao alterar status do produto');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      stock: '',
      category: '',
      photos: [],
      payment_methods: [],
      shipping_methods: [],
      is_active: true,
    });
    setUploadedImages([]);
    setEditingProduct(null);
  };

  // Função para preparar dados antes de enviar
  const prepareProductData = async () => {
    const data = { ...formData };
    
    // Converter tipos para o formato esperado pelo backend
    // Preço deve ser numérico
    if (data.price) {
      data.price = parseFloat(data.price);
      if (isNaN(data.price) || data.price < 0) {
        throw new Error('Preço inválido');
      }
    } else {
      throw new Error('Preço é obrigatório');
    }
    
    // Estoque deve ser inteiro
    if (data.stock !== undefined && data.stock !== null && data.stock !== '') {
      data.stock = parseInt(data.stock, 10);
      if (isNaN(data.stock) || data.stock < 0) {
        throw new Error('Estoque inválido');
      }
    } else {
      throw new Error('Estoque é obrigatório');
    }
    
    // Preparar imagens: separar existentes (URLs) de novas (files)
    if (uploadedImages.length > 0) {
      const existingPhotos = uploadedImages
        .filter(img => img.isExisting)
        .map(img => img.preview);
      
      const newImages = uploadedImages
        .filter(img => !img.isExisting && img.file)
        .map(img => img.file);
      
      // Se houver novas imagens, adicionar para upload via FormData
      if (newImages.length > 0) {
        data.newImages = newImages;
      }
      
      // Manter URLs das imagens existentes
      if (existingPhotos.length > 0) {
        data.photos = existingPhotos;
      }
      
      // Se houver pelo menos uma imagem, usar a primeira como image_url principal
      if (existingPhotos.length > 0) {
        data.image_url = existingPhotos[0];
      } else if (newImages.length > 0) {
        // Para novas imagens, o backend precisará processar após upload
        // Por enquanto, não definimos image_url (será processado pelo backend)
        // Mas precisamos enviar pelo menos uma URL temporária ou deixar vazio
        data.image_url = null;
      }
    } else {
      // Se não houver imagens, image_url pode ser null
      data.image_url = null;
    }
    
    return data;
  };

  if (loading) {
    return <div className="loading">Carregando produtos...</div>;
  }

  return (
    <div className="products-management">
      <div className="products-header">
        <h2>Meus Produtos</h2>
        <button
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          + Adicionar Produto
        </button>
      </div>

      {error && (
        <div className="error-message">{error}</div>
      )}

      {showForm && (
        <div className="product-form-modal">
          <div className="product-form-content">
            <div className="form-header">
              <h3>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h3>
              <button
                className="close-btn"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nome do Produto *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Descrição</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="4"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Preço *</label>
                  <div className="price-input-wrapper">
                    <span className="price-prefix">R$</span>
                    <input
                      type="text"
                      value={formData.price ? formatPriceDisplay(formData.price) : ''}
                      onChange={handlePriceChange}
                      placeholder="0,00"
                      required
                      className="price-input"
                      maxLength={20}
                    />
                  </div>
                  <small className="form-hint">Digite o valor do produto</small>
                </div>

                <div className="form-group">
                  <label>Estoque *</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Categoria *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                >
                  <option value="">Selecione uma categoria</option>
                  {VALID_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Imagens do Produto (máximo 8) *</label>
                {uploadedImages.length === 0 && (
                  <small className="form-hint" style={{ color: '#dc3545', display: 'block', marginBottom: '0.5rem' }}>
                    Pelo menos uma imagem é obrigatória
                  </small>
                )}
                <div className="image-upload-container">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="image-upload-input"
                    id="product-images"
                    disabled={uploadedImages.length >= 8}
                  />
                  <label htmlFor="product-images" className="image-upload-label">
                    <span className="upload-icon">📷</span>
                    <span>Adicionar Imagens</span>
                    {uploadedImages.length > 0 && (
                      <span className="image-count">({uploadedImages.length}/8)</span>
                    )}
                  </label>
                  
                  {uploadedImages.length > 0 && (
                    <div className="image-preview-grid">
                      {uploadedImages.map((img, index) => (
                        <div key={index} className="image-preview-item">
                          <img src={img.preview} alt={`Preview ${index + 1}`} />
                          <button
                            type="button"
                            className="remove-image-btn"
                            onClick={() => handleRemoveImage(index)}
                            title="Remover imagem"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {uploadedImages.length === 0 && (
                    <p className="upload-hint">Nenhuma imagem adicionada. Adicione até 8 imagens do produto.</p>
                  )}
                  
                  {uploadedImages.length > 0 && uploadedImages.length < 8 && (
                    <p className="upload-hint">Você pode adicionar mais {8 - uploadedImages.length} imagem(ns).</p>
                  )}
                  
                  {uploadedImages.length >= 8 && (
                    <p className="upload-hint" style={{ color: '#1976d2', fontWeight: '500' }}>
                      Limite de 8 imagens atingido. Remova uma imagem para adicionar outra.
                    </p>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  Produto ativo (disponível para venda)
                </label>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-outline" onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProduct ? 'Atualizar' : 'Criar'} Produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {products.length === 0 ? (
        <div className="empty-state">
          <p>Você ainda não possui produtos cadastrados.</p>
          <button
            className="btn btn-primary"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            Adicionar Primeiro Produto
          </button>
        </div>
      ) : (
        <div className="products-grid">
          {products.map((product) => (
            <div key={product.id} className={`product-card ${!product.is_active ? 'blocked' : ''}`}>
              {product.image_url && (
                <img src={product.image_url} alt={product.name} className="product-image" />
              )}
              <div className="product-info">
                <h3>{product.name}</h3>
                <p className="product-description">{product.description}</p>
                <div className="product-details">
                  <span className="product-price">R$ {parseFloat(product.price).toFixed(2)}</span>
                  <span className="product-stock">Estoque: {product.stock}</span>
                </div>
                <div className="product-status">
                  <span className={`status-badge ${product.is_active ? 'active' : 'blocked'}`}>
                    {product.is_active ? 'Ativo' : 'Bloqueado'}
                  </span>
                </div>
              </div>
              <div className="product-actions">
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => handleEdit(product)}
                >
                  Editar
                </button>
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => handleToggleBlock(product)}
                >
                  {product.is_active ? 'Bloquear' : 'Desbloquear'}
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => handleDelete(product.id)}
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductsManagement;

