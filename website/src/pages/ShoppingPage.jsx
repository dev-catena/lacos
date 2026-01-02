import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './ShoppingPage.css';

const ShoppingPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = [
    'Todos',
    'Medicamentos',
    'Suplementos',
    'Equipamentos Médicos',
    'Produtos de Higiene',
    'Materiais Hospitalares',
    'Produtos para Mobilidade',
    'Adaptações para Casa',
  ];

  // Produtos de exemplo (será substituído por dados reais da API)
  const products = [
    {
      id: 1,
      name: 'Cadeira de Rodas Padrão',
      category: 'Produtos para Mobilidade',
      price: 850.00,
      supplier: 'Mobility Solutions',
      image: '/placeholder-product.jpg',
      description: 'Cadeira de rodas confortável e resistente',
    },
    {
      id: 2,
      name: 'Andador com Rodas',
      category: 'Produtos para Mobilidade',
      price: 320.00,
      supplier: 'Mobility Solutions',
      image: '/placeholder-product.jpg',
      description: 'Andador ajustável com rodas dianteiras',
    },
    {
      id: 3,
      name: 'Multivitamínico 60+',
      category: 'Suplementos',
      price: 45.90,
      supplier: 'Farmácia Saúde',
      image: '/placeholder-product.jpg',
      description: 'Suplemento vitamínico específico para idosos',
    },
  ];

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'Todos' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  return (
    <div className="App">
      <Header />
      <main className="shopping-main">
        <section className="shopping-hero">
          <div className="container">
            <h1 className="shopping-title">Shopping LaçosApp</h1>
            <p className="shopping-subtitle">
              Encontre produtos e serviços essenciais para a melhor idade
            </p>
          </div>
        </section>

        <section className="shopping-content">
          <div className="container">
            <div className="shopping-filters">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                <span className="search-icon">🔍</span>
              </div>

              <div className="category-filters">
                {categories.map(category => (
                  <button
                    key={category}
                    className={`category-filter ${selectedCategory === category ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div className="products-grid">
              {filteredProducts.length > 0 ? (
                filteredProducts.map(product => (
                  <div key={product.id} className="product-card">
                    <div className="product-image">
                      <img src={product.image} alt={product.name} onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = '<div class="product-placeholder">🛒</div>';
                      }} />
                    </div>
                    <div className="product-info">
                      <div className="product-category">{product.category}</div>
                      <h3 className="product-name">{product.name}</h3>
                      <p className="product-description">{product.description}</p>
                      <div className="product-supplier">Por: {product.supplier}</div>
                      <div className="product-footer">
                        <div className="product-price">{formatPrice(product.price)}</div>
                        <button className="btn btn-primary btn-small">
                          Adicionar ao Carrinho
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-products">
                  <p>Nenhum produto encontrado.</p>
                  <p>Tente ajustar os filtros de busca.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ShoppingPage;

