'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Search, ShoppingBag, Filter, ShoppingCart, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';

interface MarketProduct {
  _id: string;
  nome: string;
  categoria: string;
  quantidade: number;
  precoReferencia: number;
  imagemUrl?: string;
  unidade: string;
}

export default function MarketplacePage() {
  const [products, setProducts] = useState<MarketProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const { cartCount, addToCart } = useCart();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/marketplace/products');
      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
      }
    } catch (error) {
      console.error('Error fetching products', error);
    } finally {
      setLoading(false);
    }
  };

  // Extract unique categories
  const categories = ['Todos', ...Array.from(new Set(products.map(p => p.categoria)))];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || p.categoria === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <Container>
      {/* Header */}
      <Header>
        <div className="logo-section">
          <img src="/bmii.png" alt="BMII Logo" className="logo" />
          <div className="brand-text">
            <h1>BMII MARKETPLACE</h1>
            <p>Compre produtos frescos diretamente do campo</p>
          </div>
        </div>

        {/* Mobile-friendly search bar could go here or in hero */}
      </Header>

      {/* Hero / Search Section */}
      <HeroSection>
        <div className="search-container">
          <div className="search-box">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              placeholder="O que você procura hoje? Ex: Milho, Feijão..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="categories-scroll">
          {categories.map(cat => (
            <button
              key={cat}
              className={`category-chip ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </HeroSection>

      {/* Product Grid */}
      <ProductGrid>
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Carregando as melhores ofertas...</p>
          </div>
        ) : filteredProducts.length > 0 ? (
          filteredProducts.map(product => (
            <ProductCard key={product._id} href={`/marketplace/${product._id}`}>
              <div className="image-wrapper">
                {product.imagemUrl ? (
                  <img src={product.imagemUrl} alt={product.nome} />
                ) : (
                  <div className="placeholder-image">
                    <ShoppingBag size={40} />
                  </div>
                )}
                <span className="stock-badge">
                  {product.quantidade} {product.unidade} disp.
                </span>
              </div>

              <div className="card-content">
                <span className="category-tag">{product.categoria}</span>
                <h3>{product.nome}</h3>
                <div className="price-row">
                  <div className="price">
                    {product.precoReferencia.toLocaleString('pt-AO')} Kz
                    <span className="unit">/{product.unidade}</span>
                  </div>
                  <button className="buy-btn" onClick={(e) => {
                    e.preventDefault();
                    addToCart(product, 1);
                    alert('Adicionado ao carrinho!');
                  }}>
                    ADICIONAR
                  </button>
                </div>
              </div>
            </ProductCard>
          ))
        ) : (
          <div className="empty-state">
            <ShoppingBag size={48} />
            <p>Nenhum produto encontrado com estes filtros.</p>
          </div>
        )}
      </ProductGrid>

      {cartCount > 0 && (
        <Link href="/marketplace/checkout">
          <FloatingCartBtn>
            <div className="cart-icon">
              <ShoppingCart size={24} />
              <span className="badge">{cartCount}</span>
            </div>
            <span>Ver Carrinho</span>
            <ArrowRight size={20} />
          </FloatingCartBtn>
        </Link>
      )}
    </Container>
  );
}

const Container = styled.div`
  min-height: 100vh;
  background-color: #f8fafc;
  font-family: 'Inter', sans-serif;
`;

const Header = styled.header`
  background: white;
  padding: 15px 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 100;

  .logo-section {
    display: flex;
    align-items: center;
    gap: 15px;
  }

  .logo {
    height: 40px;
    width: auto;
  }

  .brand-text h1 {
    font-size: 16px;
    font-weight: 900;
    color: #1a044e;
    margin: 0;
    letter-spacing: 1px;
  }

  .brand-text p {
    font-size: 11px;
    color: #64748b;
    margin: 0;
  }
`;

const HeroSection = styled.div`
  padding: 24px 20px;
  background: linear-gradient(135deg, #1a044e 0%, #312e81 100%);
  color: white;
  
  .search-container {
    max-width: 600px;
    margin: 0 auto 20px;
  }

  .search-box {
    background: white;
    border-radius: 12px;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 10px;
    box-shadow: 0 8px 16px rgba(0,0,0,0.1);

    .search-icon {
      color: #94a3b8;
    }

    input {
      border: none;
      outline: none;
      width: 100%;
      font-size: 15px;
      color: #1e293b;
      
      &::placeholder {
        color: #94a3b8;
      }
    }
  }

  .categories-scroll {
    display: flex;
    gap: 10px;
    overflow-x: auto;
    padding-bottom: 5px;
    -ms-overflow-style: none;
    scrollbar-width: none;
    &::-webkit-scrollbar { display: none; }

    .category-chip {
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
      white-space: nowrap;
      cursor: pointer;
      transition: all 0.2s;

      &:hover, &.active {
        background: white;
        color: #1a044e;
        border-color: white;
      }
    }
  }
`;

const ProductGrid = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 20px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;

  .loading-state, .empty-state {
    grid-column: 1 / -1;
    text-align: center;
    padding: 60px 20px;
    color: #64748b;
    
    .spinner {
      border: 3px solid #f3f3f3;
      border-top: 3px solid #1a044e;
      border-radius: 50%;
      width: 30px;
      height: 30px;
      animation: spin 1s linear infinite;
      margin: 0 auto 15px;
    }

    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  }
`;

const ProductCard = styled(Link)`
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
  text-decoration: none;
  color: inherit;
  transition: transform 0.2s, box-shadow 0.2s;
  border: 1px solid #e2e8f0;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
  }

  .image-wrapper {
    position: relative;
    padding-top: 65%; /* Aspect Ratio 3:2 roughly */
    background: #f1f5f9;
    
    img {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .placeholder-image {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #94a3b8;
    }

    .stock-badge {
      position: absolute;
      top: 10px;
      right: 10px;
      background: rgba(0,0,0,0.6);
      backdrop-filter: blur(4px);
      color: white;
      font-size: 11px;
      font-weight: 700;
      padding: 4px 8px;
      border-radius: 6px;
    }
  }

  .card-content {
    padding: 16px;
  }

  .category-tag {
    font-size: 10px;
    font-weight: 800;
    color: #6366f1;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  h3 {
    margin: 6px 0 12px;
    font-size: 16px;
    font-weight: 700;
    color: #1e293b;
    line-height: 1.4;
  }

  .price-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .price {
    font-size: 18px;
    font-weight: 900;
    color: #059669;
    
    .unit {
      font-size: 12px;
      color: #64748b;
      font-weight: 600;
    }
  }

  .buy-btn {
    background: #1a044e;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
      background: #312e81;
    }
  }
`;

const FloatingCartBtn = styled.div`
  position: fixed;
  bottom: 30px;
  right: 30px;
  background: #059669;
  color: white;
  padding: 15px 25px;
  border-radius: 50px;
  display: flex;
  align-items: center;
  gap: 15px;
  box-shadow: 0 10px 25px -5px rgba(5, 150, 105, 0.5);
  cursor: pointer;
  transition: transform 0.2s;
  z-index: 900;
  font-weight: 700;

  &:hover {
    transform: translateY(-5px) scale(1.05);
    background: #047857;
  }

  .cart-icon {
    position: relative;
    display: flex;
  }

  .badge {
    position: absolute;
    top: -8px;
    right: -8px;
    background: #ef4444;
    color: white;
    font-size: 10px;
    font-weight: 900;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid #059669;
  }
`;
