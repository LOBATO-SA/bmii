'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Search, Package, Check, ChevronRight, ChevronLeft, User, FileText, AlertTriangle, BadgeDollarSign } from 'lucide-react';
import jsPDF from 'jspdf';
import { useRouter } from 'next/navigation';

interface Farmer {
    id: string;
    nome: string;
    bi: string;
    fotoUrl: string;
    estoque?: any[];
    saldo?: number;
}

const SalesPage = () => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Data Lists
    const [farmers, setFarmers] = useState<Farmer[]>([]);
    const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);

    // Initial Commodities List (Available to sell)
    const COMMODITIES = [
        { id: 'comm-1', nome: 'Feijão', categoria: 'Grão', imagemUrl: '/images/feijao.jpg', precoReferencia: 500 },
        { id: 'comm-2', nome: 'Soja', categoria: 'Grão', imagemUrl: '/images/soja.jpg', precoReferencia: 450 },
        { id: 'comm-3', nome: 'Milho', categoria: 'Grão', imagemUrl: '/images/milho.jpg', precoReferencia: 200 }
    ];

    const [products, setProducts] = useState<any[]>(COMMODITIES);
    const [selectedProducts, setSelectedProducts] = useState<any[]>([]);

    // Config state
    const [weights, setWeights] = useState<Record<string, number>>({});
    const [prices, setPrices] = useState<Record<string, number>>({}); // User Input Price

    // User Session
    const [currentUser, setCurrentUser] = useState<any>(null);

    // Success Modal
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Initialize User
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setCurrentUser(parsedUser);
            } catch (e) {
                console.error('Error parsing user', e);
            }
        }
    }, []);

    // Fetch Farmers
    useEffect(() => {
        fetch('/api/farmers')
            .then(res => res.json())
            .then(data => {
                if (data.success) setFarmers(data.data);
            })
            .catch(err => console.error(err));
    }, []);

    // Reset state when farmer changes
    useEffect(() => {
        setSelectedProducts([]);
        setWeights({});
        setPrices({});
    }, [selectedFarmer]);

    const handleNext = () => {
        if (step === 1 && !selectedFarmer) return alert('Selecione um agricultor');

        // Validation on Step 2 (Product Selection)
        if (step === 2) {
            if (selectedProducts.length === 0) return alert('Selecione pelo menos um produto');
        }

        // Validation on Step 3 (Quantity & Price Input)
        if (step === 3) {
            const invalidProducts = selectedProducts.filter(p => {
                const prodId = p.id || (p as any)._id;
                const weight = weights[prodId];
                const price = prices[prodId];
                return !weight || weight <= 0 || !price || price <= 0;
            });
            if (invalidProducts.length > 0) return alert(`Por favor, insira a quantidade e o preço para: ${invalidProducts.map(p => p.nome).join(', ')}`);

            // Validate against stock (Frontend check for UX)
            if (selectedFarmer && selectedFarmer.estoque) {
                const insufficientStock = selectedProducts.filter(p => {
                    const prodId = p.id || (p as any)._id;
                    const reqQty = weights[prodId];
                    // Find total stock for this product
                    const stockItem = selectedFarmer.estoque?.filter((item: any) => item.produto === p.nome);
                    const totalAvailable = stockItem?.reduce((acc: number, item: any) => acc + item.quantidade, 0) || 0;
                    return reqQty > totalAvailable;
                });

                if (insufficientStock.length > 0) {
                    return alert(`Saldo de estoque insuficiente para: ${insufficientStock.map(p => p.nome).join(', ')}. Verifique as quantidades.`);
                }
            }
        }

        setStep(step + 1);
    };

    const handleBack = () => {
        if (step === 2) setSelectedProducts([]);
        if (step === 3) { setWeights({}); setPrices({}); }
        setStep(step - 1);
    };

    const generateSaleReceipt = async (sales: any[], farmer: any, agent: any) => {
        const doc = new jsPDF();

        const drawPage = async (isCopy: boolean) => {
            // --- Header ---
            doc.setFillColor(34, 197, 94); // Green for Sales
            doc.rect(0, 0, 210, 40, 'F');

            try {
                // Load BMII Logo 
                const logoUrl = '/bmii.png';
                const logoImage = await new Promise<string>((resolve, reject) => {
                    const img = new Image();
                    img.src = logoUrl;
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = img.width;
                        canvas.height = img.height;
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                            ctx.drawImage(img, 0, 0);
                            resolve(canvas.toDataURL('image/png'));
                        } else reject(new Error('Canvas'));
                    };
                    img.onerror = () => reject(new Error('Load'));
                });
                doc.addImage(logoImage, 'PNG', 95, 5, 20, 20);
            } catch (error) {
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(22);
                doc.text('BMII', 105, 20, { align: 'center' });
            }

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(10);
            doc.text('BANCO DE MERCADORIA DO INVESTIMENTO INTEGRADO', 105, 32, { align: 'center' });

            // --- Title ---
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('COMPROVATIVO DE VENDA DE MERCADORIA', 105, 55, { align: 'center' });

            if (isCopy) {
                doc.setFontSize(10);
                doc.setTextColor(150);
                doc.text('(DUPLICADO - ARQUIVO)', 105, 62, { align: 'center' });
            } else {
                doc.setFontSize(10);
                doc.setTextColor(150);
                doc.text('(ORIGINAL - VIA DO AGRICULTOR)', 105, 62, { align: 'center' });
            }
            doc.setTextColor(0, 0, 0);

            // --- Details ---
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            const dateStr = new Date().toLocaleString('pt-AO');

            doc.text(`DATA: ${dateStr}`, 20, 75);
            doc.text(`AGRICULTOR (VENDEDOR): ${farmer.nome.toUpperCase()} (BI: ${farmer.bi})`, 20, 82);
            doc.text(`AGENTE (COMPRADOR): ${agent.nome.toUpperCase()}`, 20, 89);

            // --- Items Table ---
            let yPos = 100;
            doc.setFillColor(240, 240, 240);
            doc.rect(20, yPos - 5, 170, 8, 'F');
            doc.setFont('helvetica', 'bold');
            doc.text('PRODUTO', 25, yPos);
            doc.text('QTD (Kg)', 85, yPos);
            doc.text('PREÇO UNIT.', 115, yPos);
            doc.text('TOTAL (CRÉDITO)', 145, yPos);


            yPos += 10;
            doc.setFont('helvetica', 'normal');

            let grandTotal = 0;

            sales.forEach((s) => {
                grandTotal += s.valorTotal;
                doc.text(s.produtoNome, 25, yPos);
                doc.text(s.quantidade.toString(), 85, yPos);
                doc.text(`${s.precoUnitario.toLocaleString('pt-AO')} Kz`, 115, yPos);
                doc.text(`${s.valorTotal.toLocaleString('pt-AO')} Kz`, 145, yPos);
                yPos += 8;
            });

            // --- Footer ---
            yPos = 240;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('Eu, abaixo assinado, confirmo a venda da mercadoria acima descrita.', 105, yPos - 15, { align: 'center' });

            doc.line(30, yPos, 90, yPos);
            doc.line(120, yPos, 180, yPos);

            doc.setFontSize(8);
            doc.text(farmer.nome.toUpperCase(), 60, yPos + 5, { align: 'center', maxWidth: 50 });
            doc.text('(AGRICULTOR - VENDEDOR)', 60, yPos + 10, { align: 'center' });

            doc.text(agent.nome.toUpperCase(), 150, yPos + 5, { align: 'center', maxWidth: 50 });
            doc.text('(AGENTE BMII - COMPRADOR)', 150, yPos + 10, { align: 'center' });
        };

        await drawPage(false);
        doc.addPage();
        await drawPage(true);
        doc.save(`Recibo_Venda_${farmer.nome}_${Date.now()}.pdf`);
    };

    const handleSubmit = async () => {
        if (!currentUser || !selectedFarmer || selectedProducts.length === 0) return;

        setLoading(true);
        try {
            const salePayloads: any[] = [];

            const promises = selectedProducts.map(product => {
                const prodId = product.id || (product as any)._id;
                const weight = weights[prodId];
                const price = prices[prodId]; // Manually entered price

                // Construct Sale Payload for PDF
                salePayloads.push({
                    produtoNome: product.nome,
                    quantidade: weight,
                    precoUnitario: price,
                    valorTotal: weight * price
                });

                return fetch('/api/sales', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        agricultorId: selectedFarmer.id || (selectedFarmer as any)._id,
                        agenteId: currentUser.id,
                        produtoNome: product.nome,
                        quantidade: weight,
                        precoUnitario: price
                    })
                }).then(async res => {
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'Erro na API');
                    return data;
                });
            });

            await Promise.all(promises);

            // Generate PDF
            await generateSaleReceipt(salePayloads, selectedFarmer, currentUser);

            setShowSuccessModal(true);
        } catch (error: any) {
            console.error(error);
            alert(error.message || 'Erro ao processar venda');
        } finally {
            setLoading(false);
        }
    };

    const handleCloseModal = () => {
        setShowSuccessModal(false);
        setStep(1);
        setSelectedFarmer(null);
        setSelectedProducts([]);
        setWeights({});
        setPrices({});
        window.location.reload();
    };

    // Filter Logic
    const [searchTerm, setSearchTerm] = useState('');
    const filteredFarmers = farmers.filter(f =>
        f.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.bi.toLowerCase().includes(searchTerm.toLowerCase())
    );


    return (
        <StyledPage>
            <div className="header">
                <h1 style={{ color: '#059669' }}>VENDA DE MERCADORIA</h1>
                <p>Transferência de produto para a BMII</p>
            </div>

            <div className="carousel-container">
                {/* STEP 1: SELECT FARMER */}
                {step === 1 && (
                    <div className="step-content fade-in">
                        <h2 style={{ color: '#504c4cff', margin: '10px 0' }}>1. Selecione o Agricultor (Vendedor)</h2>

                        <div className="search-bar">
                            <Search size={20} />
                            <input type="text" placeholder="Pesquisar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        </div>
                        <div className="selection-list">
                            {filteredFarmers.map((farmer: any) => {
                                const isSelected = selectedFarmer && (
                                    (farmer.id && selectedFarmer.id && farmer.id === selectedFarmer.id) ||
                                    (farmer._id && (selectedFarmer as any)._id && farmer._id === (selectedFarmer as any)._id)
                                );
                                return (
                                    <div key={farmer.id || farmer._id} className={`list-item ${isSelected ? 'selected' : ''}`} onClick={() => setSelectedFarmer(farmer)}>
                                        <div className="avatar">{farmer.fotoUrl ? <img src={farmer.fotoUrl} /> : <User />}</div>
                                        <div className="info">
                                            <h3>{farmer.nome}</h3>
                                            <span>BI: {farmer.bi}</span>
                                            {farmer.estoque && farmer.estoque.length > 0 && (
                                                <div className="stock-tags">
                                                    {farmer.estoque.map((e: any, idx: number) => (
                                                        <span key={idx} className="tag">{e.produto}: {e.quantidade}kg</span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        {isSelected && <Check className="check" />}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* STEP 2: SELECT PRODUCTS */}
                {step === 2 && (
                    <div className="step-content fade-in">
                        <h2 style={{ color: '#504c4cff', margin: '10px 0' }}>2. O que será vendido?</h2>
                        {selectedFarmer && (
                            <div className="farmer-badge">
                                <User size={16} /> {selectedFarmer.nome}
                            </div>
                        )}
                        <div className="product-grid">
                            {products.map((product: any) => {
                                const isSelected = selectedProducts.some(p => (p.id || p._id) === (product.id || product._id));
                                const hasStock = selectedFarmer?.estoque?.some((e: any) => e.produto === product.nome && e.quantidade > 0);

                                return (
                                    <div key={product.id || product._id}
                                        className={`product-card ${isSelected ? 'selected' : ''} ${!hasStock ? 'disabled' : ''}`}
                                        onClick={() => {
                                            if (!hasStock) return alert('Agricultor não possui este produto para vender.');
                                            if (isSelected) {
                                                setSelectedProducts(selectedProducts.filter(p => (p.id || p._id) !== (product.id || product._id)));
                                            } else {
                                                setSelectedProducts([...selectedProducts, product]);
                                            }
                                        }}
                                    >
                                        <div className="checkbox-indicator">
                                            {isSelected && <Check size={20} strokeWidth={3} />}
                                        </div>
                                        <div className="prod-img">
                                            {product.imagemUrl ? <img src={product.imagemUrl} /> : <Package size={60} />}
                                        </div>
                                        <span className="product-name">{product.nome}</span>
                                        {!hasStock && <span className="no-stock-label">Sem Estoque</span>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* STEP 3: QUANTITY & PRICE */}
                {step === 3 && (
                    <div className="step-content fade-in">
                        <h2 style={{ color: '#504c4cff', margin: '10px 0' }}>3. Quantidade e Preço</h2>
                        <div className="config-list">
                            {selectedProducts.map((product) => {
                                const prodId = product.id || (product as any)._id;
                                const currentWeight = weights[prodId] || 0;
                                const currentPrice = prices[prodId] || 0;

                                // Stock Logic
                                const stockItems = selectedFarmer?.estoque?.filter((item: any) => item.produto === product.nome);
                                const totalAvailable = stockItems?.reduce((acc: number, item: any) => acc + item.quantidade, 0) || 0;

                                return (
                                    <div key={prodId} className="config-card">
                                        <div className="config-header">
                                            <h4>{product.nome}</h4>
                                            <span className={(currentWeight > totalAvailable) ? 'text-red' : ''}>
                                                Disponível: {totalAvailable} Kg
                                            </span>
                                        </div>

                                        <div className="input-group">
                                            <div className="input-row">
                                                <label>Quantidade (Kg)</label>
                                                <input
                                                    type="number" min="0" max={totalAvailable}
                                                    value={currentWeight || ''}
                                                    onChange={(e) => setWeights({ ...weights, [prodId]: Number(e.target.value) })}
                                                    style={{ borderColor: (currentWeight > totalAvailable) ? 'red' : '#ddd' }}
                                                />
                                            </div>
                                            <div className="input-row">
                                                <label>Preço de Compra (Kz/Kg)</label>
                                                <div className="price-input-wrapper">
                                                    <input
                                                        type="number" min="0"
                                                        value={currentPrice || ''}
                                                        onChange={(e) => setPrices({ ...prices, [prodId]: Number(e.target.value) })}
                                                        placeholder="0.00"
                                                    />
                                                    <span className="currency-suffix">Kz</span>
                                                </div>
                                            </div>
                                        </div>

                                        {currentWeight > totalAvailable && (
                                            <div className="error-msg">
                                                <AlertTriangle size={14} /> Quantidade excede o disponível
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* STEP 4: CONFIRM */}
                {step === 4 && (
                    <div className="step-content fade-in">
                        <h2 style={{ color: '#504c4cff', margin: '10px 0' }}>4. Confirmar Venda</h2>
                        <div className="summary-box">
                            <div className="farmer-summary-card">
                                <div className="avatar">
                                    {selectedFarmer?.fotoUrl ? <img src={selectedFarmer.fotoUrl} alt="Farmer" /> : <User size={24} />}
                                </div>
                                <div className="info">
                                    <h3>{selectedFarmer?.nome}</h3>
                                    <span>BI: {selectedFarmer?.bi}</span>
                                </div>
                            </div>

                            <div className="summary-details">
                                <h4 className="detail-title">Resumo Financeiro</h4>
                                {selectedProducts.map(p => {
                                    const prodId = p.id || (p as any)._id;
                                    const w = weights[prodId];
                                    const price = prices[prodId];
                                    const total = w * price;

                                    return (
                                        <div key={prodId} className="summary-row">
                                            <div className="prod-name">
                                                <strong>{p.nome}</strong>
                                                <span className="calc-formula">{w} Kg x {price.toLocaleString('pt-AO')} Kz</span>
                                            </div>
                                            <div className="prod-total">
                                                {total.toLocaleString('pt-AO')} Kz
                                                <span className="credit-tag">Crédito</span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            <div className="total-row">
                                <span>Total a Receber</span>
                                <h1 style={{ color: '#059669' }}>
                                    {selectedProducts.reduce((acc, p) => {
                                        const prodId = p.id || (p as any)._id;
                                        return acc + (weights[prodId] * prices[prodId]);
                                    }, 0).toLocaleString('pt-AO')} Kz
                                </h1>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="controls">
                {step > 1 && (
                    <button className="back-btn" onClick={handleBack}><ChevronLeft /> Voltar</button>
                )}
                {step < 4 ? (
                    <button className="next-btn" onClick={handleNext}>Próximo <ChevronRight /></button>
                ) : (
                    <button className="finish-btn" onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Processando...' : 'Confirmar Venda'} {loading ? '' : <BadgeDollarSign />}
                    </button>
                )}
            </div>

            {/* SUCCESS MODAL */}
            {
                showSuccessModal && (
                    <div className="modal-overlay">
                        <div className="modal-content fade-in">
                            <div className="modal-icon">
                                <Check size={40} color="white" />
                            </div>
                            <h2 style={{ color: '#059669' }}>Venda Confirmada!</h2>
                            <p>O valor foi creditado na conta do agricultor e o stock atualizado.</p>
                            <button className="modal-btn" onClick={handleCloseModal}>
                                Concluir
                            </button>
                        </div>
                    </div>
                )
            }

        </StyledPage >
    );
};

const StyledPage = styled.div`
    max-width: 800px; margin: 0 auto; padding: 20px;

    /* REUSE STYLES FROM LEVANTAMENTO BUT WITH OVERRIDES FOR GREEN THEME */
     .modal-overlay {
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.6);
        display: flex; align-items: center; justify-content: center;
        z-index: 1000;
        backdrop-filter: blur(5px);
    }
    .modal-content {
        background: white; padding: 40px; border-radius: 20px; text-align: center; max-width: 400px; width: 90%; box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        .modal-icon { width: 80px; height: 80px; background: #059669; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px auto; box-shadow: 0 10px 20px rgba(5, 150, 105, 0.3); }
        h2 { margin-bottom: 10px; }
        p { color: #6b7280; margin-bottom: 30px; }
        .modal-btn { background: #059669; color: white; padding: 12px 30px; border-radius: 12px; border: none; font-weight: bold; font-size: 16px; cursor: pointer; width: 100%; transition: transform 0.2s; &:hover { transform: scale(1.02); } }
    }

    .header { text-align: center; margin-bottom: 30px; h1 { font-weight: 800; } p { color: #000; font-weight: 500; } }
    
    .carousel-container {
        background: white; padding: 30px; border-radius: 20px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.05); min-height: 400px;
    }

    .search-bar {
        display: flex; gap: 10px; padding: 12px; background: #f3f4f6; border-radius: 12px; margin-bottom: 20px;
        input { border: none; background: transparent; width: 100%; outline: none; color: #312f2fff; font-weight: 500; &::placeholder { color: #504848ff; opacity: 1; } }
    }

    .selection-list {
        display: flex; flex-direction: column; gap: 10px; max-height: 350px; overflow-y: auto;
        
        .list-item {
            display: flex; align-items: center; gap: 15px; padding: 15px;
            border: 1px solid #000; border-radius: 15px; cursor: pointer; transition: all 0.2s;
            
            &:hover { background: #f9fafb; }
            &.selected { border-color: #059669; background: #ecfdf5; border-width: 2px; .check { color: #059669; } }
            
            .avatar { width: 40px; height: 40px; background: #eee; border-radius: 50%; display: grid; place-items: center; overflow: hidden; img { width: 100%; height: 100%; object-fit: cover; } }
            .info { flex: 1; h3 { margin: 0; font-size: 16px; color: #000; } span { font-size: 13px; color: #000; font-weight: 500; } }
            
            .stock-tags { display: flex; gap: 5px; flex-wrap: wrap; margin-top: 5px; .tag { font-size: 11px; background: #ddd; color: #000; padding: 2px 6px; rounded: 10px; font-weight: bold; } }
        }
    }

    .product-grid {
        display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 20px; margin-top: 20px;
        
        .product-card {
            border: 2px solid #e5e7eb; border-radius: 16px; padding: 15px; text-align: center; cursor: pointer; position: relative; background: white; transition: all 0.2s ease; display: flex; flex-direction: column; align-items: center; height: 100%; min-height: 200px;
            
            &:hover { transform: translateY(-4px); box-shadow: 0 10px 20px rgba(0,0,0,0.05); border-color: #d1d5db; }
            &.selected { border-color: #059669; background: #ecfdf5; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.1); .checkbox-indicator { color: #059669; } }
            &.disabled { opacity: 0.6; cursor: not-allowed; background: #f9fafb; border-color: #f3f4f6; filter: grayscale(100%); }
            
            .prod-img { width: 120px; height: 120px; display: flex; align-items: center; justify-content: center; margin-bottom: 15px; background: #fff; border-radius: 12px; overflow: hidden; img { width: 100%; height: 100%; object-fit: contain; transition: transform 0.3s ease; } }
            &:hover:not(.disabled) .prod-img img { transform: scale(1.05); }
            .product-name { display: block; margin-top: auto; font-weight: 700; color: #1a044e; font-size: 16px; }
            .checkbox-indicator { position: absolute; top: 12px; right: 12px; color: #ccc; background: white; border-radius: 50%; width: 24px; height: 24px; display: grid; place-items: center; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
            .no-stock-label { display: inline-block; font-size: 11px; color: #ef4444; background: #fef2f2; padding: 4px 10px; border-radius: 20px; margin-top: 10px; font-weight: 600; border: 1px solid #fee2e2; }
        }
    }

    .config-list {
        display: flex; flex-direction: column; gap: 15px;
        .config-card {
            padding: 15px; border: 1px solid #e5e7eb; border-radius: 12px; background: white;

            .config-header { display: flex; justify-content: space-between; margin-bottom: 10px; h4 { margin: 0; color: #1a044e; font-size: 16px; } .text-red { color: #dc2626; font-size: 12px; font-weight: bold; } }
            
            .input-group { display: flex; gap: 15px; }
            .input-row { 
                flex: 1; display: flex; flex-direction: column; gap: 8px; 
                label { font-size: 13px; font-weight: 600; color: #374151; text-transform: uppercase; }
                input { padding: 12px; border: 2px solid #e5e7eb; border-radius: 10px; font-size: 16px; font-weight: 600; color: #111827; outline: none; transition: border-color 0.2s; &:focus { border-color: #059669; } &::placeholder { color: #9ca3af; } } 
                .price-input-wrapper { position: relative; input { width: 100%; padding-right: 35px; } .currency-suffix { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: #9ca3af; font-weight: 600; font-size: 14px; } }
            }
            .error-msg { color: #dc2626; font-size: 12px; margin-top: 8px; display: flex; align-items: center; gap: 5px; font-weight: 500; }
        }
    }

    .summary-box {
        background: white; padding: 25px; border-radius: 16px; border: 1px solid #e5e7eb;
        
        .farmer-summary-card { display: flex; align-items: center; gap: 15px; padding-bottom: 20px; border-bottom: 1px dashed #e5e7eb; margin-bottom: 20px; .avatar { width: 50px; height: 50px; border-radius: 50%; background: #f3f4f6; overflow: hidden; display: flex; align-items: center; justify-content: center; img { width: 100%; height: 100%; object-fit: cover; } } .info { h3 { margin: 0; font-size: 16px; color: #111; } span { font-size: 13px; color: #4b5563; } } }
        
        .detail-title { font-size: 12px; text-transform: uppercase; color: #6b7280; margin-bottom: 15px; font-weight: 700; }

        .summary-row { 
            display: flex; justify-content: space-between; align-items: flex-start; padding: 12px 0; border-bottom: 1px solid #f3f4f6;
            
            .prod-name { display: flex; flex-direction: column; strong { color: #111; } .calc-formula { font-size: 12px; color: #6b7280; margin-top: 2px; } }
            
            .prod-total {
                text-align: right; font-weight: bold; color: #111; display: flex; flex-direction: column; align-items: flex-end;
                .credit-tag { font-size: 10px; color: #059669; background: #d1fae5; padding: 2px 6px; border-radius: 4px; margin-top: 4px; }
            }
        }
        
        .total-row { margin-top: 25px; text-align: right; span { display: block; font-size: 13px; color: #4b5563; margin-bottom: 5px; } h1 { margin: 0; color: #1a044e; font-size: 24px; } }
    }

    .controls {
        display: flex; justify-content: space-between; margin-top: 30px;
        button { padding: 12px 24px; border-radius: 12px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 8px; border: none; font-size: 14px; transition: all 0.2s; }
        .back-btn { background: #f3f4f6; color: #4b5563; &:hover { background: #e5e7eb; } }
        .next-btn { background: #059669; color: white; &:hover { background: #047857; } }
        .finish-btn { background: #059669; color: white; &:hover { background: #047857; } &:disabled { opacity: 0.7; cursor: not-allowed; } }
    }
    
    .farmer-badge { display: flex; align-items: center; gap: 8px; background: #ecfdf5; color: #059669; padding: 8px 12px; border-radius: 8px; width: fit-content; margin-bottom: 20px; font-weight: 600; font-size: 14px; }
`;

export default SalesPage;
