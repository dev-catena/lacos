/**
 * Configurações do Stripe
 * 
 * IMPORTANTE: 
 * - Use chaves de teste durante desenvolvimento
 * - Use chaves de produção apenas em produção
 * - Nunca commite chaves secretas no código
 * - Use variáveis de ambiente para chaves secretas
 */

// Chaves públicas (podem estar no frontend)
// Substitua pela sua chave pública do Stripe
export const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_...';

// Configurações
export const STRIPE_CONFIG = {
  // Moeda (BRL para Real Brasileiro)
  currency: 'brl',
  
  // País
  country: 'BR',
  
  // Métodos de pagamento aceitos
  paymentMethods: ['card'],
  
  // Parcelamento máximo
  maxInstallments: 12,
  
  // Taxa de juros para parcelamento (se aplicável)
  installmentFee: 0, // 0% = sem juros
};

/**
 * Validação de cartão usando algoritmo de Luhn
 */
export const validateCardNumber = (cardNumber) => {
  const cleaned = cardNumber.replace(/\s/g, '');
  
  if (cleaned.length < 13 || cleaned.length > 19) {
    return false;
  }

  // Algoritmo de Luhn
  let sum = 0;
  let isEven = false;

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned.charAt(i), 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
};

/**
 * Identificar bandeira do cartão
 */
export const getCardBrand = (cardNumber) => {
  const cleaned = cardNumber.replace(/\s/g, '');
  const firstDigit = cleaned.charAt(0);
  const firstTwoDigits = cleaned.substring(0, 2);

  // Visa
  if (firstDigit === '4') {
    return 'visa';
  }

  // Mastercard
  if (firstTwoDigits >= '51' && firstTwoDigits <= '55') {
    return 'mastercard';
  }

  // Amex
  if (firstTwoDigits === '34' || firstTwoDigits === '37') {
    return 'amex';
  }

  // Elo
  if (
    firstTwoDigits === '50' ||
    (firstTwoDigits >= '63' && firstTwoDigits <= '67')
  ) {
    return 'elo';
  }

  // Hipercard
  if (firstTwoDigits === '38' || firstTwoDigits === '60') {
    return 'hipercard';
  }

  return 'unknown';
};

/**
 * Validar data de validade (MM/AA)
 */
export const validateExpiry = (expiry) => {
  if (!expiry || expiry.length !== 5) {
    return false;
  }

  const [month, year] = expiry.split('/');
  const monthNum = parseInt(month, 10);
  const yearNum = parseInt('20' + year, 10);

  if (monthNum < 1 || monthNum > 12) {
    return false;
  }

  const now = new Date();
  const expiryDate = new Date(yearNum, monthNum - 1);
  const lastDayOfMonth = new Date(yearNum, monthNum, 0);

  return expiryDate <= lastDayOfMonth && expiryDate >= now;
};

/**
 * Validar CVV
 */
export const validateCvv = (cvv, cardBrand) => {
  if (!cvv || cvv.length < 3) {
    return false;
  }

  // Amex tem CVV de 4 dígitos
  if (cardBrand === 'amex') {
    return cvv.length === 4;
  }

  return cvv.length === 3;
};

