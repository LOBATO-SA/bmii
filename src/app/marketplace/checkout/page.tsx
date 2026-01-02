'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { ArrowLeft, Trash2, CheckCircle, Package } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';

export default function CheckoutPage() {
    const { cart, removeFromCart, cartTotal, clearCart } = useCart();
    const router = useRouter();
    const [ordering, setOrdering] = useState(false);

    const [formData, setFormData] = useState({
        nome: '',
        telefone: '',
        endereco: ''
    });

    const handleOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (cart.length === 0) return;
        setOrdering(true);

        try {
            const payload = {
                cliente: {
                    nome: formData.nome,
                    telefone: formData.telefone,
                    endereco: formData.endereco
                },
                itens: cart // Send the whole cart array
            };

            const res = await fetch('/api/marketplace/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (data.success) {
                alert('Encomenda realizada com sucesso! Obrigado pela preferência.');
                clearCart();
                router.push('/marketplace');
            } else {
                alert(data.error || 'Erro ao realizar encomenda');
            }
        } catch (error) {
            alert('Erro de conexão ao processar pedido');
        } finally {
            setOrdering(false);
        }
    };

    if (cart.length === 0) {
        return (
            <Container>
                <Nav>
                    <Link href="/marketplace" className="back-link"><ArrowLeft size={20} /> Voltar ao Catálogo</Link>
                </Nav>
                <EmptyState>
                    <Package size={64} className="icon" />
                    <h2>Seu carrinho está vazio</h2>
                    <p>Adicione produtos frescos do nosso mercado.</p>
                    <Link href="/marketplace">
                        <button className="primary-btn">Ir para o Mercado</button>
                    </Link>
                </EmptyState>
            </Container>
        );
    }

    return (
        <Container>
            <Nav>
                <Link href="/marketplace" className="back-link">
                    <ArrowLeft size={20} />
                    Voltar as Compras
                </Link>
            </Nav>

            <PageTitle>Meu Carrinho</PageTitle>

            <ContentGrid>
                {/* Cart Items List */}
                <div className="cart-section">
                    <div className="cart-list">
                        {cart.map((item, index) => (
                            <div className="cart-item" key={`${item.produtoId}-${index}`}>
                                <div className="item-image">
                                    {item.imagemUrl && <img src={item.imagemUrl} alt={item.nome} />}
                                </div>
                                <div className="item-details">
                                    <h3>{item.nome}</h3>
                                    <div className="price-row">
                                        <span className="price">{item.preco.toLocaleString('pt-AO')} Kz</span>
                                        <span className="qty">x {item.quantidade} {item.unidade}</span>
                                    </div>
                                </div>
                                <div className="item-actions">
                                    <span className="total-item">{(item.preco * item.quantidade).toLocaleString('pt-AO')} Kz</span>
                                    <button className="remove-btn" onClick={() => removeFromCart(item.produtoId)}>
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="cart-total">
                        <span>Total Estimado</span>
                        <strong>{cartTotal.toLocaleString('pt-AO')} Kz</strong>
                    </div>
                </div>

                {/* Checkout Form */}
                <div className="form-section">
                    <div className="form-card">
                        <h3>Finalizar Encomenda</h3>
                        <p className="subtitle">Insira seus dados para entrega</p>

                        <form onSubmit={handleOrder}>
                            <div className="form-group">
                                <label>Nome Completo</label>
                                <input
                                    type="text"
                                    placeholder="Seu nome"
                                    value={formData.nome}
                                    onChange={e => setFormData({ ...formData, nome: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Telefone</label>
                                <input
                                    type="tel"
                                    placeholder="923 000 000"
                                    value={formData.telefone}
                                    onChange={e => setFormData({ ...formData, telefone: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Endereço de Entrega</label>
                                <textarea
                                    placeholder="Bairro, Rua, Ponto de referência..."
                                    value={formData.endereco}
                                    onChange={e => setFormData({ ...formData, endereco: e.target.value })}
                                    required
                                    rows={3}
                                />
                            </div>

                            <button type="submit" className="confirm-btn" disabled={ordering}>
                                {ordering ? 'PROCESSANDO...' : 'CONFIRMAR PEDIDO'}
                            </button>

                            <p className="disclaimer">
                                <CheckCircle size={14} style={{ display: 'inline', marginRight: 5 }} />
                                Pagamento no ato da entrega ou via referência (brevemente).
                            </p>
                        </form>
                    </div>
                </div>
            </ContentGrid>
        </Container>
    );
}

const Container = styled.div`
  min-height: 100vh;
  background-color: #f8fafc;
  font-family: 'Inter', sans-serif;
  padding-bottom: 40px;
`;

const Nav = styled.nav`
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;

  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: #64748b;
    text-decoration: none;
    font-weight: 600;
  }
`;

const PageTitle = styled.h1`
    max-width: 1000px; margin: 0 auto 20px; padding: 0 20px;
    color: #1a044e; font-size: 28px; font-weight: 800;
`;

const EmptyState = styled.div`
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 60px 20px; text-align: center;
    .icon { color: #cbd5e1; margin-bottom: 20px; }
    h2 { color: #1e293b; margin-bottom: 10px; }
    p { color: #64748b; margin-bottom: 30px; }
    .primary-btn {
        background: #1a044e; color: white; border: none; padding: 12px 24px;
        border-radius: 8px; font-weight: 700; cursor: pointer;
    }
`;

const ContentGrid = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 20px;
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 30px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }

  .cart-section {
    .cart-list {
        background: white; border-radius: 16px; padding: 20px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.03);
        margin-bottom: 20px;
    }

    .cart-item {
        display: flex; gap: 15px; padding-bottom: 15px; margin-bottom: 15px; border-bottom: 1px solid #f1f5f9;
        &:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
        
        .item-image {
            width: 70px; height: 70px; background: #f8fafc; border-radius: 8px; overflow: hidden;
            img { width: 100%; height: 100%; object-fit: cover; }
        }

        .item-details {
            flex: 1;
            h3 { font-size: 15px; color: #1e293b; margin: 0 0 5px; }
            .price-row { 
                font-size: 14px; color: #64748b;
                .price { color: #059669; font-weight: 700; margin-right: 10px; }
            }
        }

        .item-actions {
            display: flex; flex-direction: column; align-items: flex-end; justify-content: space-between;
            .total-item { font-weight: 700; color: #1e293b; }
            .remove-btn { 
                background: none; border: none; color: #ef4444; cursor: pointer; padding: 5px;
                &:hover { background: #fee2e2; border-radius: 6px; }
            }
        }
    }

    .cart-total {
        background: white; padding: 20px; border-radius: 16px;
        display: flex; justify-content: space-between; align-items: center;
        span { color: #64748b; font-weight: 600; }
        strong { font-size: 24px; color: #1a044e; }
    }
  }

  .form-section {
    .form-card {
        background: white; padding: 24px; border-radius: 16px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.05);
        position: sticky; top: 20px;

        h3 { margin: 0 0 5px; color: #1e293b; }
        .subtitle { margin: 0 0 20px; font-size: 13px; color: #64748b; }

        .form-group {
            margin-bottom: 15px;
            label { display: block; margin-bottom: 6px; font-size: 13px; font-weight: 600; color: #64748b; }
            input, textarea {
                width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 10px;
                font-size: 14px; outline: none; transition: border 0.2s;
                &:focus { border-color: #1a044e; }
            }
        }

        .confirm-btn {
            width: 100%; background: #059669; color: white; border: none;
            padding: 16px; border-radius: 12px; font-size: 15px; font-weight: 800;
            margin-top: 10px; cursor: pointer; transition: background 0.2s;
            &:disabled { opacity: 0.7; cursor: not-allowed; }
            &:hover:not(:disabled) { background: #047857; }
        }

        .disclaimer { margin-top: 15px; font-size: 12px; color: #64748b; line-height: 1.4; text-align: center; }
    }
  }
`;
