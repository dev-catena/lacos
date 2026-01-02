import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import authService from '../services/authService';
import supplierService from '../services/supplierService';
import './SupplierRegisterPage.css';

const SupplierRegisterPage = () => {
  const navigate = useNavigate();
  const user = authService.getUser();
  const isAuthenticated = authService.isAuthenticated();

  // Verificar se está logado
  useEffect(() => {
    if (!isAuthenticated) {
      if (window.confirm('Para se cadastrar como fornecedor, você precisa estar logado. Deseja fazer login agora?')) {
        navigate('/login?redirect=/fornecedor/cadastro');
      } else {
        navigate('/');
      }
    }
  }, [isAuthenticated, navigate]);

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Dados da empresa
    company_name: '',
    company_type: 'pessoa_juridica', // pessoa_fisica ou pessoa_juridica
    cnpj: '',
    cpf: '',
    
    // Endereço
    address: '',
    address_number: '',
    address_complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zip_code: '',
    
    // Dados bancários para recebimento (opcional - pode usar gateway existente)
    bank_name: '',
    bank_code: '',
    agency: '',
    account: '',
    account_type: 'checking',
    account_holder_name: '',
    account_holder_document: '',
    pix_key: '',
    pix_key_type: '',
    
    // Informações do negócio
    business_description: '',
    products_categories: [],
    website: '',
    instagram: '',
    facebook: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const categories = [
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

  const states = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      const category = value;
      setFormData(prev => ({
        ...prev,
        products_categories: checked
          ? [...prev.products_categories, category]
          : prev.products_categories.filter(c => c !== category)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    setError('');
  };

  const formatCNPJ = (value) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 14) {
      return numbers
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }
    return value;
  };

  const formatCPF = (value) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1-$2');
    }
    return value;
  };

  const formatCEP = (value) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 8) {
      return numbers.replace(/(\d{5})(\d)/, '$1-$2');
    }
    return value;
  };

  const validateStep = (currentStep) => {
    if (currentStep === 1) {
      if (!formData.company_name.trim()) {
        setError('Nome da empresa/razão social é obrigatório.');
        return false;
      }
      if (formData.company_type === 'pessoa_juridica' && !formData.cnpj) {
        setError('CNPJ é obrigatório para pessoa jurídica.');
        return false;
      }
      if (formData.company_type === 'pessoa_fisica' && !formData.cpf) {
        setError('CPF é obrigatório para pessoa física.');
        return false;
      }
    }
    
    if (currentStep === 2) {
      if (!formData.address || !formData.city || !formData.state || !formData.zip_code) {
        setError('Preencha todos os campos de endereço obrigatórios.');
        return false;
      }
    }
    
    if (currentStep === 3) {
      if (formData.products_categories.length === 0) {
        setError('Selecione pelo menos uma categoria de produtos.');
        return false;
      }
    }
    
    return true;
  };

  const handleNext = (e) => {
    e.preventDefault(); // Prevenir submit do formulário
    if (validateStep(step)) {
      setError('');
      // Garantir que não vai além do step 4
      if (step < 4) {
        setStep(step + 1);
      }
    }
  };

  const handleBack = () => {
    setError('');
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // IMPORTANTE: Só submete se estiver no último step (4)
    if (step !== 4) {
      // Se não está no último step, apenas avança para o próximo
      handleNext(e);
      return;
    }

    if (!validateStep(step)) {
      return;
    }

    if (formData.products_categories.length === 0) {
      setError('Selecione pelo menos uma categoria de produtos.');
      return;
    }

    setLoading(true);

    try {
      // Preparar dados para API
      const supplierData = {
        company_name: formData.company_name.trim(),
        company_type: formData.company_type,
        cnpj: formData.company_type === 'pessoa_juridica' ? formData.cnpj.replace(/\D/g, '') : null,
        cpf: formData.company_type === 'pessoa_fisica' ? formData.cpf.replace(/\D/g, '') : null,
        
        // Endereço
        address: formData.address,
        address_number: formData.address_number,
        address_complement: formData.address_complement,
        neighborhood: formData.neighborhood,
        city: formData.city,
        state: formData.state,
        zip_code: formData.zip_code.replace(/\D/g, ''),
        
        // Dados bancários (opcional - pode usar gateway existente)
        bank_name: formData.bank_name || null,
        bank_code: formData.bank_code || null,
        agency: formData.agency || null,
        account: formData.account || null,
        account_type: formData.account_type,
        account_holder_name: formData.account_holder_name || null,
        account_holder_document: formData.account_holder_document ? formData.account_holder_document.replace(/\D/g, '') : null,
        pix_key: formData.pix_key || null,
        pix_key_type: formData.pix_key_type || null,
        
        // Informações do negócio
        business_description: formData.business_description,
        products_categories: formData.products_categories,
        website: formData.website || null,
        instagram: formData.instagram || null,
        facebook: formData.facebook || null,
      };

      // Remover campos vazios
      Object.keys(supplierData).forEach(key => {
        if (supplierData[key] === null || supplierData[key] === '' || (Array.isArray(supplierData[key]) && supplierData[key].length === 0)) {
          delete supplierData[key];
        }
      });

      await supplierService.register(supplierData);
      
      setSuccess(true);
      
      // Redirecionar após 3 segundos
      setTimeout(() => {
        navigate('/fornecedor');
      }, 3000);
    } catch (err) {
      setError(err.message || 'Erro ao fazer cadastro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null; // Será redirecionado pelo useEffect
  }

  if (success) {
    return (
      <div className="App">
        <Header />
        <main className="supplier-register-main">
          <div className="container">
            <div className="supplier-success">
              <div className="success-icon">✓</div>
              <h1 className="success-title">Cadastro Enviado!</h1>
              <p className="success-message">
                Seu cadastro como fornecedor foi enviado com sucesso. Nossa equipe analisará 
                suas informações e entrará em contato em breve.
              </p>
              <p className="success-info">
                Você receberá um e-mail quando seu cadastro for aprovado.
              </p>
              <button onClick={() => navigate('/fornecedor')} className="btn btn-primary">
                Voltar
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="App">
      <Header />
      <main className="supplier-register-main">
        <div className="container">
          <div className="supplier-register-container">
            <div className="supplier-register-header">
              <h1 className="register-title">Cadastro de Fornecedor</h1>
              <p className="register-subtitle">
                Preencha as informações abaixo para se cadastrar como fornecedor no LaçosApp
              </p>
            </div>

            <div className="step-indicator">
              <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                <span className="step-number">1</span>
                <span className="step-label">Dados da Empresa</span>
              </div>
              <div className={`step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
                <span className="step-number">2</span>
                <span className="step-label">Endereço</span>
              </div>
              <div className={`step ${step >= 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
                <span className="step-number">3</span>
                <span className="step-label">Categorias</span>
              </div>
              <div className={`step ${step >= 4 ? 'active' : ''}`}>
                <span className="step-number">4</span>
                <span className="step-label">Dados Bancários</span>
              </div>
            </div>

            {error && (
              <div className="supplier-error">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="supplier-form">
              {/* Passo 1: Dados da Empresa */}
              {step === 1 && (
                <div className="form-step">
                  <h2 className="step-title">Dados da Empresa</h2>
                  
                  <div className="form-group">
                    <label htmlFor="company_type" className="form-label">
                      Tipo de Cadastro *
                    </label>
                    <select
                      id="company_type"
                      name="company_type"
                      value={formData.company_type}
                      onChange={handleChange}
                      className="form-input"
                      required
                    >
                      <option value="pessoa_juridica">Pessoa Jurídica (CNPJ)</option>
                      <option value="pessoa_fisica">Pessoa Física (CPF)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="company_name" className="form-label">
                      {formData.company_type === 'pessoa_juridica' ? 'Razão Social *' : 'Nome Completo *'}
                    </label>
                    <input
                      type="text"
                      id="company_name"
                      name="company_name"
                      value={formData.company_name}
                      onChange={handleChange}
                      className="form-input"
                      placeholder={formData.company_type === 'pessoa_juridica' ? 'Razão Social da Empresa' : 'Seu nome completo'}
                      required
                      disabled={loading}
                    />
                  </div>

                  {formData.company_type === 'pessoa_juridica' ? (
                    <div className="form-group">
                      <label htmlFor="cnpj" className="form-label">
                        CNPJ *
                      </label>
                      <input
                        type="text"
                        id="cnpj"
                        name="cnpj"
                        value={formData.cnpj}
                        onChange={(e) => {
                          const formatted = formatCNPJ(e.target.value);
                          setFormData(prev => ({ ...prev, cnpj: formatted }));
                        }}
                        className="form-input"
                        placeholder="00.000.000/0000-00"
                        maxLength={18}
                        required
                        disabled={loading}
                      />
                    </div>
                  ) : (
                    <div className="form-group">
                      <label htmlFor="cpf" className="form-label">
                        CPF *
                      </label>
                      <input
                        type="text"
                        id="cpf"
                        name="cpf"
                        value={formData.cpf}
                        onChange={(e) => {
                          const formatted = formatCPF(e.target.value);
                          setFormData(prev => ({ ...prev, cpf: formatted }));
                        }}
                        className="form-input"
                        placeholder="000.000.000-00"
                        maxLength={14}
                        required
                        disabled={loading}
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label htmlFor="business_description" className="form-label">
                      Descrição do Negócio
                    </label>
                    <textarea
                      id="business_description"
                      name="business_description"
                      value={formData.business_description}
                      onChange={handleChange}
                      className="form-input"
                      rows="4"
                      placeholder="Descreva seu negócio, produtos e serviços oferecidos..."
                      disabled={loading}
                    />
                  </div>
                </div>
              )}

              {/* Passo 2: Endereço */}
              {step === 2 && (
                <div className="form-step">
                  <h2 className="step-title">Endereço</h2>
                  
                  <div className="form-row">
                    <div className="form-group form-group-large">
                      <label htmlFor="address" className="form-label">
                        Logradouro *
                      </label>
                      <input
                        type="text"
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className="form-input"
                        placeholder="Rua, Avenida, etc."
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="form-group form-group-small">
                      <label htmlFor="address_number" className="form-label">
                        Número
                      </label>
                      <input
                        type="text"
                        id="address_number"
                        name="address_number"
                        value={formData.address_number}
                        onChange={handleChange}
                        className="form-input"
                        placeholder="123"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="address_complement" className="form-label">
                      Complemento
                    </label>
                    <input
                      type="text"
                      id="address_complement"
                      name="address_complement"
                      value={formData.address_complement}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Apto, Sala, etc."
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="neighborhood" className="form-label">
                      Bairro
                    </label>
                    <input
                      type="text"
                      id="neighborhood"
                      name="neighborhood"
                      value={formData.neighborhood}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Nome do bairro"
                      disabled={loading}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="city" className="form-label">
                        Cidade *
                      </label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className="form-input"
                        placeholder="Cidade"
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="form-group form-group-small">
                      <label htmlFor="state" className="form-label">
                        Estado *
                      </label>
                      <select
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        className="form-input"
                        required
                        disabled={loading}
                      >
                        <option value="">Selecione</option>
                        {states.map(state => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group form-group-medium">
                      <label htmlFor="zip_code" className="form-label">
                        CEP *
                      </label>
                      <input
                        type="text"
                        id="zip_code"
                        name="zip_code"
                        value={formData.zip_code}
                        onChange={(e) => {
                          const formatted = formatCEP(e.target.value);
                          setFormData(prev => ({ ...prev, zip_code: formatted }));
                        }}
                        className="form-input"
                        placeholder="00000-000"
                        maxLength={9}
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Passo 3: Categorias */}
              {step === 3 && (
                <div className="form-step">
                  <h2 className="step-title">Categorias de Produtos</h2>
                  <p className="step-description">
                    Selecione as categorias de produtos ou serviços que você oferece:
                  </p>
                  
                  <div className="categories-grid">
                    {categories.map(category => (
                      <label key={category} className="category-checkbox">
                        <input
                          type="checkbox"
                          value={category}
                          checked={formData.products_categories.includes(category)}
                          onChange={handleChange}
                          disabled={loading}
                        />
                        <span className="checkbox-label">{category}</span>
                      </label>
                    ))}
                  </div>

                  <div className="form-group">
                    <label htmlFor="website" className="form-label">
                      Website
                    </label>
                    <input
                      type="url"
                      id="website"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="https://seusite.com.br"
                      disabled={loading}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="instagram" className="form-label">
                        Instagram
                      </label>
                      <input
                        type="text"
                        id="instagram"
                        name="instagram"
                        value={formData.instagram}
                        onChange={handleChange}
                        className="form-input"
                        placeholder="@seuinstagram"
                        disabled={loading}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="facebook" className="form-label">
                        Facebook
                      </label>
                      <input
                        type="text"
                        id="facebook"
                        name="facebook"
                        value={formData.facebook}
                        onChange={handleChange}
                        className="form-input"
                        placeholder="URL do Facebook"
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Passo 4: Dados Bancários */}
              {step === 4 && (
                <div className="form-step">
                  <h2 className="step-title">Dados para Recebimento</h2>
                  <p className="step-description">
                    Informe seus dados bancários para receber os pagamentos. 
                    <strong> Se você já tem dados de pagamento cadastrados no sistema, pode pular esta etapa.</strong>
                  </p>
                  
                  <div className="form-group">
                    <label htmlFor="bank_name" className="form-label">
                      Nome do Banco
                    </label>
                    <input
                      type="text"
                      id="bank_name"
                      name="bank_name"
                      value={formData.bank_name}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Ex: Banco do Brasil, Itaú, etc."
                      disabled={loading}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group form-group-small">
                      <label htmlFor="bank_code" className="form-label">
                        Código do Banco
                      </label>
                      <input
                        type="text"
                        id="bank_code"
                        name="bank_code"
                        value={formData.bank_code}
                        onChange={handleChange}
                        className="form-input"
                        placeholder="001"
                        disabled={loading}
                      />
                    </div>
                    <div className="form-group form-group-medium">
                      <label htmlFor="agency" className="form-label">
                        Agência
                      </label>
                      <input
                        type="text"
                        id="agency"
                        name="agency"
                        value={formData.agency}
                        onChange={handleChange}
                        className="form-input"
                        placeholder="0000"
                        disabled={loading}
                      />
                    </div>
                    <div className="form-group form-group-medium">
                      <label htmlFor="account" className="form-label">
                        Conta
                      </label>
                      <input
                        type="text"
                        id="account"
                        name="account"
                        value={formData.account}
                        onChange={handleChange}
                        className="form-input"
                        placeholder="00000-0"
                        disabled={loading}
                      />
                    </div>
                    <div className="form-group form-group-small">
                      <label htmlFor="account_type" className="form-label">
                        Tipo
                      </label>
                      <select
                        id="account_type"
                        name="account_type"
                        value={formData.account_type}
                        onChange={handleChange}
                        className="form-input"
                        disabled={loading}
                      >
                        <option value="checking">Corrente</option>
                        <option value="savings">Poupança</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="account_holder_name" className="form-label">
                      Nome do Titular
                    </label>
                    <input
                      type="text"
                      id="account_holder_name"
                      name="account_holder_name"
                      value={formData.account_holder_name}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Nome completo do titular da conta"
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="account_holder_document" className="form-label">
                      CPF/CNPJ do Titular
                    </label>
                    <input
                      type="text"
                      id="account_holder_document"
                      name="account_holder_document"
                      value={formData.account_holder_document}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="000.000.000-00 ou 00.000.000/0000-00"
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="pix_key" className="form-label">
                      Chave PIX (opcional)
                    </label>
                    <input
                      type="text"
                      id="pix_key"
                      name="pix_key"
                      value={formData.pix_key}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória"
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="pix_key_type" className="form-label">
                      Tipo de Chave PIX
                    </label>
                    <select
                      id="pix_key_type"
                      name="pix_key_type"
                      value={formData.pix_key_type}
                      onChange={handleChange}
                      className="form-input"
                      disabled={loading}
                    >
                      <option value="">Selecione</option>
                      <option value="cpf">CPF</option>
                      <option value="cnpj">CNPJ</option>
                      <option value="email">E-mail</option>
                      <option value="phone">Telefone</option>
                      <option value="random">Chave Aleatória</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="form-actions">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="btn btn-outline"
                    disabled={loading}
                  >
                    Voltar
                  </button>
                )}
                {step < 4 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    Próximo
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Enviando...' : 'Enviar Cadastro'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SupplierRegisterPage;
