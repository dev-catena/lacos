import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { CartProvider, useCart } from '../../contexts/CartContext';

describe('CartContext - Testes', () => {
  it('deve adicionar produto ao carrinho', () => {
    const wrapper = ({ children }) => <CartProvider>{children}</CartProvider>;
    const { result } = renderHook(() => useCart(), { wrapper });

    const product = {
      id: 1,
      name: 'Produto Teste',
      price: 100.00,
    };

    act(() => {
      result.current.addToCart(product, 2);
    });

    expect(result.current.cartItems).toHaveLength(1);
    expect(result.current.cartItems[0].quantity).toBe(2);
  });

  it('deve calcular total corretamente', () => {
    const wrapper = ({ children }) => <CartProvider>{children}</CartProvider>;
    const { result } = renderHook(() => useCart(), { wrapper });

    const product1 = { id: 1, name: 'Produto 1', price: 100.00 };
    const product2 = { id: 2, name: 'Produto 2', price: 50.00 };

    act(() => {
      result.current.addToCart(product1, 2);
      result.current.addToCart(product2, 1);
    });

    expect(result.current.getTotalPrice()).toBe(250.00);
    expect(result.current.getTotalItems()).toBe(3);
  });

  it('deve remover produto do carrinho', () => {
    const wrapper = ({ children }) => <CartProvider>{children}</CartProvider>;
    const { result } = renderHook(() => useCart(), { wrapper });

    const product = { id: 1, name: 'Produto', price: 100.00 };

    act(() => {
      result.current.addToCart(product, 1);
      result.current.removeFromCart(1);
    });

    expect(result.current.cartItems).toHaveLength(0);
  });

  it('deve atualizar quantidade do produto', () => {
    const wrapper = ({ children }) => <CartProvider>{children}</CartProvider>;
    const { result } = renderHook(() => useCart(), { wrapper });

    const product = { id: 1, name: 'Produto', price: 100.00 };

    act(() => {
      result.current.addToCart(product, 1);
      result.current.updateQuantity(1, 5);
    });

    expect(result.current.cartItems[0].quantity).toBe(5);
  });

  it('deve limpar carrinho', () => {
    const wrapper = ({ children }) => <CartProvider>{children}</CartProvider>;
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addToCart({ id: 1, name: 'Produto', price: 100.00 }, 1);
      result.current.clearCart();
    });

    expect(result.current.cartItems).toHaveLength(0);
  });
});

