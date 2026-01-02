'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { ArrowLeft, ShoppingBag, CheckCircle, Package, Truck, ShieldCheck, X } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [orderAmount, setOrderAmount] = useState(1);
  const [ordering, setOrdering] = useState(false);

  // Checkout Form State
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    endereco: ''
  });

  useEffect(() => {
    if (params.id) {
      fetchProduct(params.id as string);
    }
  }, [params.id]);

  const fetchProduct = async (id: string) => {
    try {
      const res = await fetch(`/api/marketplace/products/${id}`);
      const data = await res.json();
      if (data.success) {
        setProduct(data.data);
      } else {
        alert('Produto não encontrado');
        router.push('/marketplace');
      }
    } catch (error) {
      console.error('Error fetching product', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrdering(true);

    try {
      const payload = {
        cliente: {
          nome: formData.nome,
          telefone: formData.telefone,
          endereco: formData.endereco
        },
        produtoId: product._id,
        quantidade: Number(orderAmount)
      };

      const res = await fetch('/api/marketplace/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.success) {
        alert('Encomenda realizada com sucesso! Entraremos em contacto brevemente.');
        setIsModalOpen(false);
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

  if (loading) return <LoadingScreen><div className="spinner"></div></LoadingScreen>;
  if (!product) return null;

  return (
    <Container>
      <Nav>
        <Link href="/marketplace" className="back-link">
          <ArrowLeft size={20} />
          Voltar ao Catálogo
        </Link>
      </Nav>

      <ContentWrapper>
        <div className="product-image-section">
          <div className="main-image">
            {product.imagemUrl ? (
              <img src={product.imagemUrl} alt={product.nome} />
            ) : (
              <div className="placeholder">
                <ShoppingBag size={80} />
              </div>
            )}
          </div>
        </div>

        <div className="product-info-section">
          <span className="category-badge">{product.categoria}</span>
          <h1>{product.nome}</h1>

          <div className="price-tag">
            {product.precoReferencia.toLocaleString('pt-AO')} Kz
            <span className="unit"> / {product.unidade}</span>
          </div>

          <div className="stock-info">
            <CheckCircle size={16} color="#059669" />
            <span>Em estoque: <strong>{product.quantidade} {product.unidade}</strong></span>
          </div>

          <p className="description">
            Produto fresco, cultivado localmente pelos melhores agricultores da rede BMII.
            Garantia de qualidade e entrega rápida.
          </p>

          <div className="features-grid">
            <div className="feature">
              <Package size={20} />
              <span>Venda a Granel</span>
            </div>
            <div className="feature">
              <Truck size={20} />
              <span>Entrega Rápida</span>
            </div>
            <div className="feature">
              <ShieldCheck size={20} />
              <span>Qualidade Garantida</span>
            </div>
          </div>

          <div className="action-area">
            <button className="buy-button" onClick={() => setIsModalOpen(true)}>
              FAZER ENCOMENDA
            </button>
          </div>
        </div>
      </ContentWrapper>

      {/* Checkout Modal */}
      {isModalOpen && (
        <ModalOverlay>
          <div className="modal-card">
            <button className="close-btn" onClick={() => setIsModalOpen(false)}>
              <X size={24} />
            </button>

            <h2>Finalizar Encomenda</h2>
            <div className="summary-box">
              <div className="summary-item">
                <span>Produto:</span>
                <strong>{product.nome}</strong>
              </div>
              <div className="summary-item">
                <span>Preço Unitário:</span>
                <strong>{product.precoReferencia.toLocaleString('pt-AO')} Kz</strong>
              </div>
            </div>

            <form onSubmit={handleOrder}>
              <div className="form-group">
                <label>Quantidade ({product.unidade})</label>
                <input
                  type="number"
                  min="1"
                  max={product.quantidade}
                  value={orderAmount}
                  onChange={(e) => setOrderAmount(Number(e.target.value))}
                  required
                />
              </div>

              <div className="total-display">
                <span>Total a Pagar:</span>
                <strong>{(orderAmount * product.precoReferencia).toLocaleString('pt-AO')} Kz</strong>
              </div>

              <div className="divider"></div>
              <h3>Seus Dados</h3>

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
                  rows={2}
                />
              </div>

              <button type="submit" className="confirm-btn" disabled={ordering}>
                {ordering ? 'PROCESSANDO...' : 'CONFIRMAR PEDIDO'}
              </button>
            </form>
          </div>
        </ModalOverlay>
      )}
    </Container>
  );
}

const Container = styled.div`
  min-height: 100vh;
  background: white;
  font-family: 'Inter', sans-serif;
`;

const Nav = styled.nav`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;

  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: #64748b;
    text-decoration: none;
    font-weight: 600;
    transition: color 0.2s;

    &:hover { color: #1a044e; }
  }
`;

const LoadingScreen = styled.div`
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  .spinner {
    border: 3px solid #f3f3f3;
    border-top: 3px solid #1a044e;
    border-radius: 50%;
    width: 40px; height: 40px;
    animation: spin 1s linear infinite;
  }
  @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
`;

const ContentWrapper = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  align-items: center;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 30px;
  }

  .product-image-section {
    .main-image {
      width: 100%;
      aspect-ratio: 1;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 10px 40px -10px rgba(0,0,0,0.1);
      background: #f8fafc;
      position: relative;

      img {
        width: 100%; height: 100%; object-fit: cover;
      }

      .placeholder {
        width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #cbd5e1;
      }
    }
  }

  .product-info-section {
    .category-badge {
      background: #e0e7ff; color: #4338ca;
      padding: 6px 12px; border-radius: 20px;
      font-size: 12px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 1px;
    }

    h1 {
      font-size: 42px; font-weight: 900; color: #1e293b;
      margin: 16px 0;
      line-height: 1.1;
    }

    .price-tag {
      font-size: 32px; font-weight: 900; color: #059669;
      margin-bottom: 20px;
      .unit { font-size: 16px; color: #64748b; font-weight: 600; }
    }

    .stock-info {
      display: flex; align-items: center; gap: 8px;
      color: #64748b; margin-bottom: 24px;
      background: #f0fdf4; padding: 8px 16px; border-radius: 8px;
      display: inline-flex;
    }

    .description {
      color: #475569; line-height: 1.6; margin-bottom: 30px;
      font-size: 16px;
    }

    .features-grid {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 30px;
      .feature {
        display: flex; flex-direction: column; align-items: center; gap: 8px;
        text-align: center; color: #1a044e; font-size: 12px; font-weight: 600;
        padding: 15px; background: #f8fafc; border-radius: 12px;
      }
    }

    .action-area {
        display: flex;
        gap: 15px;
        align-items: flex-end;

        .qty-selector {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 8px;
            
            label { font-size: 13px; font-weight: 600; color: #64748b; }
            input {
                width: 100%; padding: 16px; border: 2px solid #e2e8f0; border-radius: 12px;
                font-size: 16px; font-weight: 700; outline: none;
                &:focus { border-color: #1a044e; }
            }
        }
    }

    .buy-button {
      flex: 2;
      background: #1a044e; color: white; border: none;
      padding: 18px; border-radius: 12px;
      font-size: 16px; font-weight: 900; letter-spacing: 1px;
      cursor: pointer; transition: background 0.2s;
      box-shadow: 0 10px 20px -5px rgba(26, 4, 78, 0.4);
      display: flex; align-items: center; justify-content: center;

      &:hover { background: #312e81; transform: translateY(-2px); }
    }
  }
`;

const ModalOverlay = styled.div`
  position: fixed; inset: 0; background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; padding: 20px;
  backdrop-filter: blur(4px);

  .modal-card {
    background: white; width: 100%; max-width: 500px;
    border-radius: 20px; padding: 30px;
    position: relative;
    max-height: 90vh; overflow-y: auto;
    animation: slideUp 0.3s ease-out;

    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  }

  .close-btn {
    position: absolute; top: 20px; right: 20px;
    background: #f1f5f9; border: none; padding: 8px; border-radius: 50%;
    cursor: pointer; color: #64748b;
    &:hover { background: #e2e8f0; color: #0f172a; }
  }

  h2 { margin: 0 0 20px; font-size: 24px; color: #1e293b; }
  h3 { margin: 0 0 15px; font-size: 18px; color: #1e293b; }

  .summary-box {
    background: #f8fafc; padding: 15px; border-radius: 12px; margin-bottom: 20px;
    .summary-item {
      display: flex; justify-content: space-between; margin-bottom: 8px;
      font-size: 14px; color: #64748b;
      strong { color: #1e293b; }
      &:last-child { margin-bottom: 0; }
    }
  }

  .total-display {
    display: flex; justify-content: space-between; align-items: center;
    background: #f0fdf4; padding: 15px; border-radius: 12px;
    margin-bottom: 20px;
    span { font-weight: 600; color: #059669; }
    strong { font-size: 20px; color: #059669; }
  }

  .divider { height: 1px; background: #e2e8f0; margin: 20px 0; }

  .form-group {
    margin-bottom: 15px;
    label { display: block; margin-bottom: 6px; font-size: 13px; font-weight: 600; color: #64748b; }
    input, textarea {
      width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 10px;
      font-size: 15px; outline: none; transition: border 0.2s;
      &:focus { border-color: #1a044e; }
    }
  }

  .confirm-btn {
    width: 100%; background: #059669; color: white; border: none;
    padding: 16px; border-radius: 12px; font-size: 16px; font-weight: 800;
    margin-top: 10px; cursor: pointer; transition: background 0.2s;
    &:disabled { opacity: 0.7; cursor: not-allowed; }
    &:hover:not(:disabled) { background: #047857; }
  }
`;
