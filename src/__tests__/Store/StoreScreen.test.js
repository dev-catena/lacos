import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import StoreScreen from '../../screens/Store/StoreScreen';
import storeService from '../../services/storeService';
import { CartProvider } from '../../contexts/CartContext';

// Mock do storeService
jest.mock('../../services/storeService', () => ({
  __esModule: true,
  default: {
    getProducts: jest.fn(),
  },
}));

// Mock do navigation
const mockNavigation = {
  navigate: jest.fn(),
};

describe('StoreScreen - Testes Frontend', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve listar produtos ao carregar', async () => {
    storeService.getProducts.mockResolvedValue({
      success: true,
      products: [
        {
          id: 1,
          name: 'Produto 1',
          price: 100.00,
          stock: 10,
        },
      ],
      pagination: {
        current_page: 1,
        last_page: 1,
        total: 1,
      },
    });

    render(
      <CartProvider>
        <StoreScreen navigation={mockNavigation} />
      </CartProvider>
    );

    await waitFor(() => {
      expect(storeService.getProducts).toHaveBeenCalled();
    }, { timeout: 5000 });
  });

  it('deve navegar para detalhes do produto ao clicar', async () => {
    storeService.getProducts.mockResolvedValue({
      success: true,
      products: [
        {
          id: 1,
          name: 'Produto 1',
          price: 100.00,
          stock: 10,
        },
      ],
      pagination: {
        current_page: 1,
        last_page: 1,
        total: 1,
      },
    });

    const { getByText } = render(
      <CartProvider>
        <StoreScreen navigation={mockNavigation} />
      </CartProvider>
    );

    await waitFor(() => {
      expect(storeService.getProducts).toHaveBeenCalled();
    }, { timeout: 3000 });

    await waitFor(() => {
      const product = getByText('Produto 1');
      fireEvent.press(product);
    }, { timeout: 3000 });

    expect(mockNavigation.navigate).toHaveBeenCalledWith('ProductDetails', {
      productId: 1,
    });
  });
});

