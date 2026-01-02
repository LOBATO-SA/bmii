'use client';

import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { User } from 'lucide-react'; // Typo fix later if needed, but using standard imports below
import { ArrowLeft, Wallet, Package, TrendingUp, Calendar, MapPin, Phone, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const FarmerDetailsPage = () => {
    const params = useParams();
    const id = params.id as string;

    const [farmer, setFarmer] = useState<any>(null);
    const [deposits, setDeposits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id]);

    const fetchData = async () => {
        try {
            // 1. Fetch Farmer Details
            const farmerRes = await fetch(`/api/farmers/${id}`);
            const farmerData = await farmerRes.json();

            // 2. Fetch Deposits, Withdrawals & Sales History
            const [depositsRes, withdrawalsRes, salesRes] = await Promise.all([
                fetch(`/api/deposits?agricultorId=${id}`),
                fetch(`/api/withdrawals?agricultorId=${id}`),
                fetch(`/api/sales?agricultorId=${id}`)
            ]);

            const depositsData = await depositsRes.json();
            const withdrawalsData = await withdrawalsRes.json();
            const salesData = await salesRes.json();

            if (farmerData.success) {
                setFarmer(farmerData.data);
            }

            // Merge Transactions
            let allTransactions: any[] = [];

            if (depositsData.success) {
                const deps = depositsData.data.map((d: any) => ({
                    ...d,
                    type: 'deposit',
                    date: d.dataDeposito,
                    amount: d.valorTotal
                }));
                allTransactions = [...allTransactions, ...deps];
            }

            if (withdrawalsData.success) {
                const wds = withdrawalsData.data.map((w: any) => ({
                    ...w,
                    type: 'withdrawal',
                    date: w.dataLevantamento, // Ensure model has this or createdAt
                    amount: w.valorDebitado
                }));
                allTransactions = [...allTransactions, ...wds];
            }

            if (salesData.success) {
                const sales = salesData.data.map((s: any) => ({
                    ...s,
                    type: 'sale',
                    date: s.dataVenda,
                    amount: s.valorTotal
                }));
                allTransactions = [...allTransactions, ...sales];
            }

            // Sort by Date Descending
            allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            setDeposits(allTransactions); // Using existing state name for simplicity, or refactor to setTransactions
        } catch (error) {
            console.error('Erro ao carregar dados', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Carregando dados do agricultor...</div>;
    if (!farmer) return <div style={{ padding: 40, textAlign: 'center' }}>Agricultor não encontrado.</div>;

    const totalDeposited = deposits
        .filter(t => t.type === 'deposit')
        .reduce((acc, curr) => acc + (curr.amount || 0), 0);

    const stockCount = farmer.estoque ? farmer.estoque.length : 0;

    return (
        <StyledPage>
            <div className="header-nav">
                <Link href="/agent/conta" className="back-btn">
                    <ArrowLeft size={18} /> Voltar
                </Link>
                <h1>Detalhes da Conta</h1>
            </div>

            {/* Profile Header */}
            <div className="profile-header">
                <div className="profile-main">
                    <div className="avatar-large">
                        {farmer.fotoUrl ? <img src={farmer.fotoUrl} alt={farmer.nome} /> : <UserIcon size={40} />}
                    </div>
                    <div className="profile-info">
                        <h2>{farmer.nome}</h2>
                        <div className="profile-badges">
                            <span className="badge bi">BI: {farmer.bi}</span>
                            <span className="badge active">ATIVO</span>
                        </div>
                    </div>
                </div>
                <div className="profile-details">
                    <div className="detail-row">
                        <Phone size={16} /> {farmer.telefone}
                    </div>
                    <div className="detail-row">
                        <MapPin size={16} /> {farmer.endereco}
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon wallet">
                        <Wallet size={24} />
                    </div>
                    <div>
                        <label>Saldo Atual</label>
                        <div className="value">{farmer.saldo ? farmer.saldo.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' }) : 'Kz 0,00'}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon package">
                        <Package size={24} />
                    </div>
                    <div>
                        <label>Estoque</label>
                        <div className="value">{stockCount} <span className="unit">Itens</span></div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon trending">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <label>Total Depositado</label>
                        <div className="value">{totalDeposited.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</div>
                    </div>
                </div>
            </div>

            <div className="content-grid">
                {/* Stock Section */}
                <div className="section-card">
                    <h3>Estoque Armazenado</h3>
                    {(!farmer.estoque || farmer.estoque.length === 0) ? (
                        <p className="empty-text">Sem produtos em estoque.</p>
                    ) : (
                        <div className="stock-list">
                            {farmer.estoque.map((item: any, idx: number) => (
                                <div key={idx} className="stock-item">
                                    <div className="item-name">{item.produto}</div>
                                    <div className="item-meta">
                                        <span className="qty">{item.quantidade} kg</span>
                                        <span className="quality">Qualidade {item.qualidade}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Unified History Section */}
                <div className="section-card wide">
                    <h3>Histórico de Movimentos</h3>
                    {deposits.length === 0 ? (
                        <p className="empty-text">Nenhuma movimentação registrada.</p>
                    ) : (
                        <table className="history-table">
                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Tipo</th>
                                    <th>Produto</th>
                                    <th>Qtd.</th>
                                    <th>Valor</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {deposits.map((trans: any, idx) => (
                                    <tr key={trans._id || idx}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <Calendar size={14} color="#9ca3af" />
                                                {new Date(trans.date).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`type-badge ${trans.type}`}>
                                                {trans.type === 'deposit' ? 'Depósito' : trans.type === 'withdrawal' ? 'Levantamento' : 'Venda'}
                                            </span>
                                        </td>
                                        <td>{trans.produto?.nome || trans.produtoNome || 'Produto'}</td>
                                        <td>{trans.quantidade} kg</td>
                                        <td style={{ fontWeight: 600, color: trans.type === 'withdrawal' ? '#dc2626' : (trans.type === 'sale' ? '#1e40af' : '#059669') }}>
                                            {trans.type === 'withdrawal' ? '-' : '+'}
                                            {trans.amount?.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                                        </td>
                                        <td><span className="status-badge success">Concluído</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

        </StyledPage>
    );
};

const StyledPage = styled.div`
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    color: #1f2937;

    .header-nav {
        display: flex;
        align-items: center;
        gap: 20px;
        margin-bottom: 30px;

        h1 {
            font-size: 24px;
            font-weight: 800;
            color: #1a044e;
            margin: 0;
        }

        .back-btn {
            display: flex;
            align-items: center;
            gap: 6px;
            text-decoration: none;
            color: #6b7280;
            font-weight: 600;
            padding: 8px 12px;
            background: white;
            border-radius: 8px;
            transition: all 0.2s;

            &:hover { background: #f3f4f6; color: #1a044e; }
        }
    }

    /* Profile Header */
    .profile-header {
        background: white;
        border-radius: 20px;
        padding: 30px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 30px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.03);
    }

    .profile-main {
        display: flex;
        align-items: center;
        gap: 20px;
    }

    .avatar-large {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background: #f3f4f6;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        color: #9ca3af;
        
        img { width: 100%; height: 100%; object-fit: cover; }
    }

    .profile-info h2 {
        margin: 0 0 10px 0;
        font-size: 22px;
        color: #1a044e;
    }

    .profile-badges {
        display: flex;
        gap: 10px;
    }

    .badge {
        font-size: 12px;
        padding: 4px 10px;
        border-radius: 6px;
        font-weight: 600;

        &.bi { background: #f3f4f6; color: #4b5563; }
        &.active { background: #d1fae5; color: #059669; }
    }

    .profile-details {
        text-align: right;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .detail-row {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #6b7280;
        font-size: 14px;
        justify-content: flex-end;
    }

    /* Stats Grid */
    .stats-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;
        margin-bottom: 30px;
    }

    .stat-card {
        background: white;
        padding: 20px;
        border-radius: 16px;
        display: flex;
        align-items: center;
        gap: 15px;
        box-shadow: 0 4px 10px rgba(0,0,0,0.02);
    }

    .stat-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;

        &.wallet { background: #eff6ff; color: #3b82f6; }
        &.package { background: #fff7ed; color: #f97316; }
        &.trending { background: #f0fdf4; color: #22c55e; }
    }

    .stat-card label {
        display: block;
        font-size: 12px;
        color: #6b7280;
        margin-bottom: 4px;
        font-weight: 600;
    }

    .stat-card .value {
        font-size: 20px;
        font-weight: 800;
        color: #111827;

        .unit {
            font-size: 14px;
            font-weight: normal;
            color: #9ca3af;
        }
    }

    /* Content Grid */
    .content-grid {
        display: grid;
        grid-template-columns: 1fr 2fr;
        gap: 25px;
    }

    .section-card {
        background: white;
        border-radius: 20px;
        padding: 25px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.03);

        h3 {
            margin: 0 0 20px 0;
            font-size: 16px;
            color: #1a044e;
            font-weight: 700;
        }
    }

    .empty-text {
        color: #9ca3af;
        font-size: 14px;
        text-align: center;
        padding: 20px 0;
    }

    /* Stock List */
    .stock-list {
        display: flex;
        flex-direction: column;
        gap: 15px;
    }

    .stock-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 12px;
        border-bottom: 1px solid #f3f4f6;

        &:last-child { border-bottom: none; }
    }

    .item-name {
        font-weight: 600;
        color: #374151;
    }

    .item-meta {
        text-align: right;
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .item-meta .qty {
        font-size: 14px;
        font-weight: 700;
        color: #1a044e;
    }

    .item-meta .quality {
        font-size: 11px;
        color: #9ca3af;
    }

    /* History Table */
    .history-table {
        width: 100%;
        border-collapse: collapse;

        th {
            text-align: left;
            padding: 10px;
            font-size: 12px;
            color: #9ca3af;
            font-weight: 600;
            border-bottom: 1px solid #e5e7eb;
        }

        td {
            padding: 15px 10px;
            font-size: 14px;
            border-bottom: 1px solid #f3f4f6;
            color: #374151;
        }

        tr:last-child td { border-bottom: none; }
    }

    .status-badge.success {
        background: #d1fae5;
        color: #059669;
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 700;
    }

    .type-badge {
        font-size: 11px;
        padding: 4px 10px;
        border-radius: 6px;
        font-weight: 700;
        text-transform: uppercase;
        
        &.deposit { background: #d1fae5; color: #059669; }
        &.withdrawal { background: #fee2e2; color: #dc2626; }
        &.sale { background: #dbeafe; color: #1e40af; } /* Blue for Sales */
    }
`;

export default FarmerDetailsPage;
