'use client';

import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { User } from 'lucide-react'; // Typo fix later if needed, but using standard imports below
import { ArrowLeft, Wallet, Package, TrendingUp, Calendar, MapPin, Phone, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download } from 'lucide-react';

const FarmerDetailsPage = () => {
    const params = useParams();
    const id = params.id as string;

    const [farmer, setFarmer] = useState<any>(null);
    const [deposits, setDeposits] = useState<any[]>([]); // This actually holds mixed transactions now
    const [loading, setLoading] = useState(true);

    const getBase64ImageFromURL = (url: string) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.setAttribute('crossOrigin', 'anonymous');
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0);
                const dataURL = canvas.toDataURL('image/png');
                resolve(dataURL);
            };
            img.onerror = error => reject(error);
            img.src = url;
        });
    };

    const generateStatementPDF = async () => {
        const doc = new jsPDF();

        // --- Header ---
        doc.setFillColor(26, 4, 78); // #1a044e
        doc.rect(0, 0, 210, 40, 'F');

        // Logo
        try {
            const logoData = await getBase64ImageFromURL('/bmii.png'); // Ensure this image exists in public folder
            doc.addImage(logoData as string, 'PNG', 20, 10, 20, 20); // Adjust dimensions as needed
            // Move text to the right of logo
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text('BMII', 45, 22);
        } catch (e) {
            // Fallback if logo fails
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text('BMII', 20, 22);
        }

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('EXTRATO DE CONTA', 45, 30);

        // Date
        const today = new Date().toLocaleDateString('pt-AO');
        doc.text(`Data de Emissão: ${today}`, 150, 20);

        // --- Farmer Info ---
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`Agricultor: ${farmer.nome || 'N/A'}`, 20, 55);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Telefone: ${farmer.telefone || 'N/A'}`, 20, 62);
        doc.text(`BI: ${farmer.bi || 'N/A'}`, 20, 69);

        const location = [farmer.provincia, farmer.municipio].filter(Boolean).join(', ');
        doc.text(`Localização: ${location || 'Não informada'}`, 20, 76);

        // --- Balance Summary ---
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(140, 50, 50, 25, 3, 3, 'F');
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text('Saldo Disponível', 145, 58);

        doc.setFontSize(14);
        doc.setTextColor(5, 150, 105); // Green
        doc.setFont('helvetica', 'bold');
        doc.text(`${(farmer.saldo || 0).toLocaleString('pt-AO')} Kz`, 145, 68);

        // --- Transactions Table ---
        const tableData = deposits.map(t => {
            const isCredit = t.type === 'deposit' || t.type === 'sale';
            const sign = isCredit ? '+' : '-';
            const label = t.type === 'deposit' ? 'Depósito' : t.type === 'sale' ? 'Venda' : 'Levantamento';

            // Safe unit display
            const unit = t.produto && t.produto.unidade ? t.produto.unidade : 'Kg';
            const productDesc = t.produto ? `${t.produto.nome} (${t.quantidade} ${unit})` : t.type === 'sale' ? 'Venda de Produto' : '-';

            return [
                new Date(t.date).toLocaleDateString('pt-AO'),
                label,
                productDesc,
                {
                    content: `${sign} ${t.amount.toLocaleString('pt-AO')} Kz`,
                    styles: { textColor: isCredit ? [5, 150, 105] as [number, number, number] : [239, 68, 68] as [number, number, number] }
                }
            ];
        });

        autoTable(doc, {
            startY: 90,
            head: [['Data', 'Tipo', 'Descrição', 'Valor']],
            body: tableData,
            headStyles: { fillColor: [26, 4, 78], textColor: 255, fontStyle: 'bold' },
            bodyStyles: { fontSize: 10 },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            columnStyles: {
                3: { halign: 'right', fontStyle: 'bold' }
            }
        });

        // Footer
        const finalY = (doc as any).lastAutoTable.finalY + 20;
        doc.setFontSize(9);
        doc.setTextColor(150);
        doc.text('Este documento foi gerado eletronicamente pela plataforma BMII.', 105, 280, { align: 'center' });

        const safeName = (farmer.nome || 'extrato').replace(/\s+/g, '_');
        doc.save(`extrato_${safeName}_${Date.now()}.pdf`);
    };

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
                <button onClick={generateStatementPDF} className="statement-btn">
                    <Download size={18} />
                    <span>Baixar Extrato</span>
                </button>
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

        .statement-btn {
            display: flex;
            align-items: center;
            gap: 8px;
            background: white;
            border: 1px solid #e2e8f0;
            padding: 8px 16px;
            border-radius: 8px;
            color: #1a044e;
            font-weight: 600;
            font-size: 13px;
            cursor: pointer;
            transition: all 0.2s;
            box-shadow: 0 2px 5px rgba(0,0,0,0.05);

            &:hover {
                background: #f8fafc;
                transform: translateY(-1px);
                box-shadow: 0 4px 8px rgba(0,0,0,0.08);
            }
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
