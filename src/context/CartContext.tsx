'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface CartItem {
    produtoId: string;
    nome: string;
    preco: number;
    imagemUrl?: string;
    quantidade: number;
    unidade: string;
    maxStock: number;
}

interface CartContextType {
    cart: CartItem[];
    addToCart: (product: any, quantity: number) => void;
    removeFromCart: (productId: string) => void;
    clearCart: () => void;
    cartCount: number;
    cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [cart, setCart] = useState<CartItem[]>([]);

    // Load from localStorage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem('bmii_cart');
        if (savedCart) {
            try {
                setCart(JSON.parse(savedCart));
            } catch (e) {
                console.error('Failed to parse cart', e);
            }
        }
    }, []);

    // Save to localStorage whenever cart changes
    useEffect(() => {
        localStorage.setItem('bmii_cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (product: any, quantity: number) => {
        setCart(prev => {
            const existing = prev.find(item => item.produtoId === product._id);
            if (existing) {
                // Update quantity
                return prev.map(item =>
                    item.produtoId === product._id
                        ? { ...item, quantidade: Math.min(item.quantidade + quantity, item.maxStock) }
                        : item
                );
            } else {
                // Add new
                return [...prev, {
                    produtoId: product._id,
                    nome: product.nome,
                    preco: product.precoReferencia,
                    imagemUrl: product.imagemUrl,
                    quantidade: quantity,
                    unidade: product.unidade,
                    maxStock: product.quantidade
                }];
            }
        });
    };

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(item => item.produtoId !== productId));
    };

    const clearCart = () => {
        setCart([]);
    };

    const cartCount = cart.reduce((acc, item) => acc + item.quantidade, 0);
    const cartTotal = cart.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, cartCount, cartTotal }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
