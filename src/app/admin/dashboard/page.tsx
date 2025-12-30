'use client';

import React from 'react';
import styled from 'styled-components';
import { TrendingUp, AlertTriangle, Package, DollarSign, Users, ShoppingCart } from 'lucide-react';
import { useState, useEffect } from 'react';

interface DashboardMetrics {
  totalAgents: number;
  activeProducts: number;
  totalFarmers: number;
  totalSales: number;
}

interface StockAlert {
  id: string;
  produto: string;
  quantidade: number;
  unidade: string;
  nivel: string;
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalAgents: 0,
    activeProducts: 0,
    totalFarmers: 0,
    totalSales: 0
  });
  const [lowStockProducts, setLowStockProducts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await fetch('/api/dashboard');
        const data = await res.json();
        if (data.success) {
          setMetrics(data.data.metrics);
          setLowStockProducts(data.data.alerts);
        }
      } catch (error) {
        console.error('Erro ao carregar dashboard', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Mock data for sales (to be implemented later)
  const salesData = [
    { produto: 'Milho', vendas: 450, valor: 67500, tendencia: '+12%' },
    { produto: 'Feijão', vendas: 320, valor: 64000, tendencia: '+8%' },
    { produto: 'Arroz', vendas: 180, valor: 32400, tendencia: '-3%' },
  ];

  return (
    <StyledDashboard>
      <div className="dashboard-header">
        <h1>PAINEL ADMINISTRATIVO</h1>
        <p>Visão geral do sistema BMII</p>
      </div>

      {/* Main Stats */}
      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-icon">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">TOTAL DE AGENTES</span>
            <span className="stat-value">{metrics.totalAgents}</span>
          </div>
        </div>

        <div className="stat-card green">
          <div className="stat-icon">
            <Package size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">PRODUTOS ATIVOS</span>
            <span className="stat-value">{metrics.activeProducts}</span>
          </div>
        </div>

        <div className="stat-card orange">
          <div className="stat-icon">
            <ShoppingCart size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">AGRICULTORES</span>
            <span className="stat-value">145</span>
          </div>
        </div>

        <div className="stat-card purple">
          <div className="stat-icon">
            <DollarSign size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">VENDAS TOTAIS</span>
            <span className="stat-value">163.9K</span>
            <span className="stat-unit">Kz</span>
          </div>
        </div>
      </div>

      <div className="content-grid">
        {/* Sales Metrics */}
        <div className="panel sales-panel">
          <div className="panel-header">
            <div className="panel-title">
              <TrendingUp size={20} />
              <h2>MÉTRICAS DE VENDAS</h2>
            </div>
            <span className="period-badge">ÚLTIMOS 30 DIAS</span>
          </div>

          <div className="sales-list">
            {salesData.map((item, index) => (
              <div key={index} className="sales-item">
                <div className="sales-info">
                  <span className="product-name">{item.produto}</span>
                  <span className="sales-count">{item.vendas} unidades vendidas</span>
                </div>
                <div className="sales-metrics">
                  <span className="sales-value">{item.valor.toLocaleString('pt-AO')} Kz</span>
                  <span className={`trend ${item.tendencia.startsWith('+') ? 'positive' : 'negative'}`}>
                    {item.tendencia}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="panel-footer">
            <span className="total-label">RECEITA TOTAL</span>
            <span className="total-value">163.900 Kz</span>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="panel alerts-panel">
          <div className="panel-header">
            <div className="panel-title">
              <AlertTriangle size={20} />
              <h2>ALERTAS DE STOCK</h2>
            </div>
            <span className="alert-count">{lowStockProducts.length}</span>
          </div>

          <div className="alerts-list">
            {lowStockProducts.map((item, index) => (
              <div key={index} className={`alert-item ${item.nivel}`}>
                <div className="alert-icon">
                  <AlertTriangle size={18} />
                </div>
                <div className="alert-info">
                  <span className="alert-product">{item.produto}</span>
                  <span className="alert-quantity">
                    {item.quantidade} {item.unidade} disponível
                  </span>
                </div>
                <span className={`alert-badge ${item.nivel}`}>
                  {item.nivel === 'crítico' ? 'CRÍTICO' : 'BAIXO'}
                </span>
              </div>
            ))}
          </div>

          <div className="panel-footer warning">
            <AlertTriangle size={16} />
            <span>Reabastecer produtos com urgência</span>
          </div>
        </div>
      </div>
    </StyledDashboard>
  );
}

const StyledDashboard = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

  .dashboard-header {
    margin-bottom: 40px;
  }

  .dashboard-header h1 {
    font-size: 32px;
    font-weight: 900;
    letter-spacing: 3px;
    color: #1a044e;
    margin: 0 0 8px 0;
  }

  .dashboard-header p {
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.5px;
    color: #6b7280;
    margin: 0;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 24px;
    margin-bottom: 40px;
  }

  .stat-card {
    background: white;
    padding: 24px;
    border-radius: 16px;
    box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.08);
    display: flex;
    align-items: center;
    gap: 20px;
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease;
  }

  .stat-card:hover {
    transform: translateY(-4px);
    box-shadow: 0px 8px 30px rgba(0, 0, 0, 0.12);
  }

  .stat-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
  }

  .stat-card.blue::before { background: linear-gradient(90deg, #3b82f6, #1d4ed8); }
  .stat-card.green::before { background: linear-gradient(90deg, #10b981, #059669); }
  .stat-card.orange::before { background: linear-gradient(90deg, #f59e0b, #d97706); }
  .stat-card.purple::before { background: linear-gradient(90deg, #8b5cf6, #7c3aed); }

  .stat-icon {
    width: 56px;
    height: 56px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #0f0092 0%, #1a044e 100%);
    color: white;
  }

  .stat-content {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .stat-label {
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 1.5px;
    color: #9ca3af;
  }

  .stat-value {
    font-size: 32px;
    font-weight: 900;
    letter-spacing: -1px;
    color: #1f2937;
  }

  .stat-unit {
    font-size: 14px;
    font-weight: 700;
    color: #6b7280;
    margin-left: 4px;
  }

  .content-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 24px;
  }

  .panel {
    background: white;
    border-radius: 20px;
    box-shadow: 0px 4px 30px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  .panel-header {
    padding: 24px 28px;
    border-bottom: 2px solid #f3f4f6;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .panel-title {
    display: flex;
    align-items: center;
    gap: 12px;
    color: #1a044e;
  }

  .panel-title h2 {
    font-size: 16px;
    font-weight: 900;
    letter-spacing: 2px;
    margin: 0;
  }

  .period-badge {
    background: #dbeafe;
    color: #1e40af;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 10px;
    font-weight: 900;
    letter-spacing: 1px;
  }

  .alert-count {
    background: #fee2e2;
    color: #991b1b;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 900;
  }

  .sales-list {
    padding: 8px;
  }

  .sales-item {
    padding: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #f3f4f6;
    transition: background 0.2s ease;
  }

  .sales-item:hover {
    background: #f9fafb;
  }

  .sales-item:last-child {
    border-bottom: none;
  }

  .sales-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .product-name {
    font-size: 15px;
    font-weight: 700;
    color: #1f2937;
  }

  .sales-count {
    font-size: 13px;
    font-weight: 600;
    color: #9ca3af;
  }

  .sales-metrics {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
  }

  .sales-value {
    font-size: 16px;
    font-weight: 700;
    color: #059669;
  }

  .trend {
    font-size: 12px;
    font-weight: 900;
    padding: 4px 8px;
    border-radius: 8px;
  }

  .trend.positive {
    background: #d1fae5;
    color: #065f46;
  }

  .trend.negative {
    background: #fee2e2;
    color: #991b1b;
  }

  .alerts-list {
    padding: 8px;
  }

  .alert-item {
    padding: 16px;
    display: flex;
    align-items: center;
    gap: 14px;
    border-bottom: 1px solid #f3f4f6;
    transition: all 0.2s ease;
  }

  .alert-item:hover {
    background: #fef3c7;
  }

  .alert-item:last-child {
    border-bottom: none;
  }

  .alert-item.crítico {
    background: #fef2f2;
  }

  .alert-item.crítico:hover {
    background: #fee2e2;
  }

  .alert-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fef3c7;
    color: #d97706;
  }

  .alert-item.crítico .alert-icon {
    background: #fee2e2;
    color: #dc2626;
  }

  .alert-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .alert-product {
    font-size: 15px;
    font-weight: 700;
    color: #1f2937;
  }

  .alert-quantity {
    font-size: 13px;
    font-weight: 600;
    color: #6b7280;
  }

  .alert-badge {
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 10px;
    font-weight: 900;
    letter-spacing: 1px;
  }

  .alert-badge.baixo {
    background: #fef3c7;
    color: #92400e;
  }

  .alert-badge.crítico {
    background: #fee2e2;
    color: #991b1b;
  }

  .panel-footer {
    padding: 20px 28px;
    border-top: 2px solid #f3f4f6;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #f9fafb;
  }

  .panel-footer.warning {
    background: #fef3c7;
    color: #92400e;
    gap: 8px;
    font-weight: 700;
    font-size: 13px;
  }

  .total-label {
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 1.5px;
    color: #6b7280;
  }

  .total-value {
    font-size: 20px;
    font-weight: 900;
    color: #059669;
  }

  @media (max-width: 1024px) {
    .content-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 768px) {
    .dashboard-header h1 {
      font-size: 24px;
      letter-spacing: 2px;
    }

    .stats-grid {
      grid-template-columns: 1fr;
      gap: 16px;
    }

    .stat-card {
      padding: 20px;
    }

    .stat-icon {
      width: 48px;
      height: 48px;
    }

    .stat-value {
      font-size: 28px;
    }

    .content-grid {
      grid-template-columns: 1fr;
      gap: 20px;
    }

    .panel-header {
      padding: 20px;
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }

    .panel-title h2 {
      font-size: 14px;
    }

    .sales-item,
    .alert-item {
      padding: 16px;
    }

    .product-name,
    .alert-product {
      font-size: 14px;
    }

    .sales-value {
      font-size: 14px;
    }

    .panel-footer {
      padding: 16px 20px;
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }
  }

  @media (max-width: 480px) {
    .dashboard-header h1 {
      font-size: 20px;
      letter-spacing: 1px;
    }

    .stat-card {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }

    .sales-item,
    .alert-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }

    .sales-metrics,
    .alert-badge {
      align-self: flex-start;
    }
  }
`;
