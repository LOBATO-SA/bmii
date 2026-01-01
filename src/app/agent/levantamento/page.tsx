'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Search, Package, Check, ChevronRight, ChevronLeft, User, FileText, AlertTriangle } from 'lucide-react';
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

const AgentLevantamentoPage = () => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Data Lists
    const [farmers, setFarmers] = useState<Farmer[]>([]);
    const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);

    // Initial Commodities List (Available to withdraw)
    const COMMODITIES = [
        { id: 'comm-1', nome: 'Feijão', categoria: 'Grão', imagemUrl: '/images/feijao.jpg', precoReferencia: 500 },
        { id: 'comm-2', nome: 'Soja', categoria: 'Grão', imagemUrl: '/images/soja.jpg', precoReferencia: 450 },
        { id: 'comm-3', nome: 'Milho', categoria: 'Grão', imagemUrl: '/images/milho.jpg', precoReferencia: 200 }
    ];

    const [products, setProducts] = useState<any[]>(COMMODITIES);
    const [selectedProducts, setSelectedProducts] = useState<any[]>([]);

    // Config state
    const [weights, setWeights] = useState<Record<string, number>>({});

    // User Session
    const [currentUser, setCurrentUser] = useState<any>(null);

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
    }, [selectedFarmer]);

    const handleNext = () => {
        if (step === 1 && !selectedFarmer) return alert('Selecione um agricultor');

        // Validation on Step 2 (Product Selection)
        if (step === 2) {
            if (selectedProducts.length === 0) return alert('Selecione pelo menos um produto');
        }

        // Validation on Step 3 (Quantity Input)
        if (step === 3) {
            const invalidProducts = selectedProducts.filter(p => {
                const prodId = p.id || (p as any)._id;
                return !weights[prodId] || weights[prodId] <= 0;
            });
            if (invalidProducts.length > 0) return alert(`Por favor, insira a quantidade para: ${invalidProducts.map(p => p.nome).join(', ')}`);

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
        // Clear data from the current step before going back
        if (step === 2) {
            setSelectedProducts([]); // Clear selected products when going back to farmer selection
        }
        if (step === 3) {
            setWeights({}); // Clear quantities when going back to product selection
        }
        setStep(step - 1);
    };

    const generateWithdrawalReceipt = async (withdrawals: any[], farmer: any, agent: any) => {
        const doc = new jsPDF();

        const drawPage = async (isCopy: boolean) => {
            // --- Header ---
            doc.setFillColor(78, 4, 4); // Dark Red for Withdrawal distinction? Or keep Brand Blue? Keeping brand but maybe different title color
            doc.setFillColor(26, 4, 78); // Brand Blue
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
            doc.text('COMPROVATIVO DE LEVANTAMENTO', 105, 55, { align: 'center' });

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
            doc.text(`AGRICULTOR: ${farmer.nome.toUpperCase()} (BI: ${farmer.bi})`, 20, 82);
            doc.text(`AGENTE: ${agent.nome.toUpperCase()}`, 20, 89);

            // --- Items Table ---
            let yPos = 100;
            doc.setFillColor(240, 240, 240);
            doc.rect(20, yPos - 5, 170, 8, 'F');
            doc.setFont('helvetica', 'bold');
            doc.text('PRODUTO', 25, yPos);
            doc.text('QTD (Kg)', 95, yPos);
            doc.text('VALOR DEBITADO', 140, yPos);

            yPos += 10;
            doc.setFont('helvetica', 'normal');

            let grandTotal = 0;

            withdrawals.forEach((w) => {
                grandTotal += w.valorDebitado;
                doc.text(w.produtoNome, 25, yPos);
                doc.text(w.quantidade.toString(), 95, yPos);
                doc.text(`${w.valorDebitado.toLocaleString('pt-AO')} Kz`, 140, yPos);
                yPos += 8;
            });

            // --- Footer ---
            yPos = 240;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('Eu, abaixo assinado, confirmo a recepção da mercadoria acima descrita.', 105, yPos - 15, { align: 'center' });

            doc.line(30, yPos, 90, yPos);
            doc.line(120, yPos, 180, yPos);

            doc.setFontSize(8);
            doc.text(farmer.nome.toUpperCase(), 60, yPos + 5, { align: 'center', maxWidth: 50 });
            doc.text('(AGRICULTOR - RECEBEDOR)', 60, yPos + 10, { align: 'center' });

            doc.text(agent.nome.toUpperCase(), 150, yPos + 5, { align: 'center', maxWidth: 50 });
            doc.text('(AGENTE BMII - ENTREGADOR)', 150, yPos + 10, { align: 'center' });
        };

        await drawPage(false);
        doc.addPage();
        await drawPage(true);
        doc.save(`Recibo_Levantamento_${farmer.nome}_${Date.now()}.pdf`);
    };

    const handleSubmit = async () => {
        if (!currentUser || !selectedFarmer || selectedProducts.length === 0) return;

        setLoading(true);
        try {
            const withdrawalPayloads: any[] = [];
            const promises = selectedProducts.map(product => {
                const prodId = product.id || (product as any)._id;
                const weight = weights[prodId];

                // Determine correct price
                const stockItems = selectedFarmer?.estoque?.filter((item: any) => item.produto === product.nome);
                const appliedPrice = (stockItems && stockItems.length > 0 && stockItems[0].precoAquisicao)
                    ? stockItems[0].precoAquisicao
                    : (product.precoReferencia || 0);

                // Construct Payload
                withdrawalPayloads.push({
                    produtoNome: product.nome,
                    quantidade: weight,
                    valorDebitado: weight * appliedPrice
                });

                return fetch('/api/withdrawals', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        agricultorId: selectedFarmer.id || (selectedFarmer as any)._id,
                        agenteId: currentUser.id,
                        produtoNome: product.nome,
                        quantidade: weight,
                        precoReferencia: appliedPrice // Send SPECIFIC verified price
                    })
                }).then(async res => {
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'Erro na API');
                    return data;
                });
            });

            await Promise.all(promises);

            // Generate PDF
            await generateWithdrawalReceipt(withdrawalPayloads, selectedFarmer, currentUser);

            alert('Levantamento realizado com sucesso!');
            setStep(1);
            setSelectedFarmer(null);
            setSelectedProducts([]);
            setWeights({});

            // Reload farmers to sort of update stock (though refreshing page is better)
            window.location.reload();

        } catch (error: any) {
            console.error(error);
            alert(error.message || 'Erro ao processar levantamento');
        } finally {
            setLoading(false);
        }
    };

    // Filter
    const [searchTerm, setSearchTerm] = useState('');
    const filteredFarmers = farmers.filter(f =>
        f.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.bi.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <StyledPage>
            <div className="header">
                <h1>LEVANTAMENTO DE MERCADORIA</h1>
                <p>Retirada de produtos do depósito</p>
            </div>

            <div className="carousel-container">
                {/* STEP 1: SELECT FARMER */}
                {step === 1 && (
                    <div className="step-content fade-in">
                        <h2 style={{ color: '#504c4cff', margin: '10px 0' }}>1. Selecione o Agricultor</h2>

                        <div className="search-bar">
                            <Search size={20} />
                            <input
                                type="text"
                                placeholder="Pesquisar..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="selection-list">
                            {filteredFarmers.map((farmer: any) => {
                                const isSelected = selectedFarmer && (
                                    (farmer.id && selectedFarmer.id && farmer.id === selectedFarmer.id) ||
                                    (farmer._id && (selectedFarmer as any)._id && farmer._id === (selectedFarmer as any)._id)
                                );
                                return (
                                    <div
                                        key={farmer.id || farmer._id}
                                        className={`list-item ${isSelected ? 'selected' : ''}`}
                                        onClick={() => {
                                            setSelectedFarmer(farmer);
                                            // Reset subsequent states to prevent bugs when switching farmers
                                            setSelectedProducts([]);
                                            setWeights({});
                                        }}
                                    >
                                        <div className="avatar">
                                            {farmer.fotoUrl ? <img src={farmer.fotoUrl} /> : <User />}
                                        </div>
                                        <div className="info">
                                            <h3>{farmer.nome}</h3>
                                            <span>BI: {farmer.bi}</span>
                                            {/* Show Stock Summary if available */}
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
                        <h2 style={{ color: '#504c4cff', margin: '10px 0' }}>2. O que será levantado?</h2>
                        {selectedFarmer && (
                            <div className="farmer-badge">
                                <User size={16} /> {selectedFarmer.nome}
                            </div>
                        )}
                        <div className="product-grid">
                            {products.map((product: any) => {
                                const isSelected = selectedProducts.some(p => (p.id || p._id) === (product.id || product._id));
                                // Check if farmer has this product in stock
                                const hasStock = selectedFarmer?.estoque?.some((e: any) => e.produto === product.nome && e.quantidade > 0);

                                return (
                                    <div
                                        key={product.id || product._id}
                                        className={`product-card ${isSelected ? 'selected' : ''} ${!hasStock ? 'disabled' : ''}`}
                                        onClick={() => {
                                            if (!hasStock) return alert('Agricultor não possui este produto em estoque.');
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

                {/* STEP 3: QUANTITY */}
                {step === 3 && (
                    <div className="step-content fade-in">
                        <h2 style={{ color: '#504c4cff', margin: '10px 0' }}>3. Quantidade a Retirar</h2>
                        <div className="config-list">
                            {selectedProducts.map((product) => {
                                const prodId = product.id || (product as any)._id;
                                const currentWeight = weights[prodId] || 0;


                                // Get Max Stock and Price
                                const stockItems = selectedFarmer?.estoque?.filter((item: any) => item.produto === product.nome);
                                const totalAvailable = stockItems?.reduce((acc: number, item: any) => acc + item.quantidade, 0) || 0;
                                // Use the price from the first stock item found (simplification for FIFO/Avg) or fallback to reference
                                const stockPrice = stockItems && stockItems.length > 0 ? stockItems[0].precoAquisicao : (product.precoReferencia || 0);

                                return (
                                    <div key={prodId} className="config-card">
                                        <div className="config-header">
                                            <h4>{product.nome}</h4>
                                            <div>
                                                <span className="price-tag" style={{ display: 'block', fontSize: '11px', color: '#1a044e', textAlign: 'right', marginBottom: '2px' }}>
                                                    {stockPrice ? `${stockPrice.toLocaleString('pt-AO')} Kz` : 'Preço N/D'}
                                                </span>
                                                <span className={(currentWeight > totalAvailable) ? 'text-red' : ''}>
                                                    Disponível: {totalAvailable} Kg
                                                </span>
                                            </div>
                                        </div>
                                        <div className="input-row">
                                            <label>Quantidade (Kg)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max={totalAvailable}
                                                value={currentWeight || ''}
                                                onChange={(e) => setWeights({ ...weights, [prodId]: Number(e.target.value) })}
                                                style={{ borderColor: (currentWeight > totalAvailable) ? 'red' : '#ddd' }}
                                            />
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
                        <h2 style={{ color: '#504c4cff', margin: '10px 0' }}>4. Confirmar Levantamento</h2>

                        <div className="summary-box">
                            {/* Farmer Summary */}
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

                                    // Price Logic: Stock > Reference
                                    const stockItems = selectedFarmer?.estoque?.filter((item: any) => item.produto === p.nome);
                                    const unitPrice = (stockItems && stockItems.length > 0 && stockItems[0].precoAquisicao)
                                        ? stockItems[0].precoAquisicao
                                        : (p.precoReferencia || 0);

                                    const total = w * unitPrice;

                                    return (
                                        <div key={prodId} className="summary-row">
                                            <div className="prod-name">
                                                <strong>{p.nome}</strong>
                                                <span className="calc-formula">{w} Kg x {unitPrice.toLocaleString('pt-AO')} Kz</span>
                                            </div>
                                            <div className="prod-total">
                                                {total.toLocaleString('pt-AO')} Kz
                                                <span className="debit-tag">Débito</span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            <div className="total-row">
                                <span>Total Estimado a Debitar</span>
                                <h1>
                                    {selectedProducts.reduce((acc, p) => {
                                        const prodId = p.id || (p as any)._id;
                                        const w = weights[prodId];

                                        // Price Logic: Stock > Reference
                                        const stockItems = selectedFarmer?.estoque?.filter((item: any) => item.produto === p.nome);
                                        const unitPrice = (stockItems && stockItems.length > 0 && stockItems[0].precoAquisicao)
                                            ? stockItems[0].precoAquisicao
                                            : (p.precoReferencia || 0);

                                        return acc + (w * unitPrice);
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
                        {loading ? 'Processando...' : 'Confirmar Levantamento'} {loading ? '' : <FileText />}
                    </button>
                )}
            </div>
        </StyledPage>
    );
};

const StyledPage = styled.div`
    max-width: 800px; margin: 0 auto; padding: 20px;


    .header { text-align: center; margin-bottom: 30px; h1 { color: #1a044e; } p { color: #000; font-weight: 500; } }
    
    .carousel-container {
        background: white; padding: 30px; border-radius: 20px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.05); min-height: 400px;
    }

    .search-bar {
        display: flex; gap: 10px; padding: 12px; background: #f3f4f6; border-radius: 12px; margin-bottom: 20px;
        input { 
            border: none; background: transparent; width: 100%; outline: none; color: #312f2fff; font-weight: 500;
            &::placeholder { color: #504848ff; opacity: 1; }
        }
    }

    .selection-list {
        display: flex; flex-direction: column; gap: 10px; max-height: 350px; overflow-y: auto;
        
        .list-item {
            display: flex; align-items: center; gap: 15px; padding: 15px;
            border: 1px solid #000; border-radius: 15px; cursor: pointer; transition: all 0.2s; /* Darker border */
            
            &:hover { background: #f9fafb; }
            &.selected { border-color: #1a044e; background: #f0fdf4; border-width: 2px; }
            
            .avatar { width: 40px; height: 40px; background: #eee; border-radius: 50%; display: grid; place-items: center; overflow: hidden; img { width: 100%; height: 100%; object-fit: cover; } }
            .info { 
                flex: 1; 
                h3 { margin: 0; font-size: 16px; color: #000; } 
                span { font-size: 13px; color: #000; font-weight: 500; } /* Black text */
            }
            .check { color: #1a044e; }
            
            .stock-tags { display: flex; gap: 5px; flex-wrap: wrap; margin-top: 5px; .tag { font-size: 11px; background: #ddd; color: #000; padding: 2px 6px; rounded: 10px; font-weight: bold; } }
        }
    }


    .product-grid {
        display: grid; 
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); 
        gap: 20px;
        margin-top: 20px;
        
        .product-card {
            border: 2px solid #e5e7eb; 
            border-radius: 16px; 
            padding: 15px; 
            text-align: center; 
            cursor: pointer; 
            position: relative;
            background: white;
            transition: all 0.2s ease;
            display: flex;
            flex-direction: column;
            align-items: center;
            height: 100%;
            min-height: 200px;
            
            &:hover { 
                transform: translateY(-4px); 
                box-shadow: 0 10px 20px rgba(0,0,0,0.05);
                border-color: #d1d5db;
            }
            
            &.selected { 
                border-color: #1a044e; 
                background: #f0fdf4; 
                box-shadow: 0 4px 12px rgba(26, 4, 78, 0.1);
            }
            
            &.disabled { 
                opacity: 0.6; 
                cursor: not-allowed; 
                background: #f9fafb; 
                border-color: #f3f4f6;
                filter: grayscale(100%);
            }
            
            .prod-img { 
                width: 120px;
                height: 120px; 
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 15px;
                background: #fff;
                border-radius: 12px;
                overflow: hidden;
                
                img { 
                    width: 100%; 
                    height: 100%; 
                    object-fit: contain; 
                    transition: transform 0.3s ease;
                }
            }
            
            &:hover:not(.disabled) .prod-img img {
                transform: scale(1.05);
            }

            .product-name { 
                display: block; 
                margin-top: auto; 
                font-weight: 700; 
                color: #1a044e;
                font-size: 16px;
            }
            
            .checkbox-indicator { 
                position: absolute; 
                top: 12px; 
                right: 12px; 
                color: #1a044e; 
                background: white;
                border-radius: 50%;
                width: 24px;
                height: 24px;
                display: grid;
                place-items: center;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }
            
            .no-stock-label { 
                display: inline-block;
                font-size: 11px; 
                color: #ef4444; 
                background: #fef2f2;
                padding: 4px 10px;
                border-radius: 20px;
                margin-top: 10px;
                font-weight: 600;
                border: 1px solid #fee2e2;
            }
        }
    }

    .config-list {
        display: flex; flex-direction: column; gap: 15px;
        .config-card {
            padding: 15px; 
            border: 1px solid #e5e7eb; 
            border-radius: 12px;
            background: white;

            .config-header { 
                display: flex; justify-content: space-between; margin-bottom: 10px; 
                h4 { margin: 0; color: #1a044e; font-size: 16px; } 
                .text-red { color: #dc2626; font-size: 12px; font-weight: bold; } 
            }
            
            .input-row { 
                display: flex; flex-direction: column; gap: 8px; 
                
                label { 
                    font-size: 13px; 
                    font-weight: 600; 
                    color: #374151; /* Dark gray for visibility */
                    text-transform: uppercase;
                }
                
                input { 
                    padding: 12px; 
                    border: 2px solid #e5e7eb; 
                    border-radius: 10px; 
                    font-size: 16px;
                    font-weight: 600;
                    color: #111827; /* Near black */
                    outline: none;
                    transition: border-color 0.2s;
                    
                    &:focus { border-color: #1a044e; }
                    &::placeholder { color: #9ca3af; }
                } 
            }
            .error-msg { color: #dc2626; font-size: 12px; margin-top: 8px; display: flex; align-items: center; gap: 5px; font-weight: 500; }
        }
    }

    .summary-box {
        background: white; 
        padding: 25px; 
        border-radius: 16px; 
        border: 1px solid #e5e7eb;
        
        .farmer-summary-card {
            display: flex;
            align-items: center;
            gap: 15px;
            padding-bottom: 20px;
            border-bottom: 1px dashed #e5e7eb;
            margin-bottom: 20px;
            
            .avatar {
                width: 50px; height: 50px;
                border-radius: 50%;
                background: #f3f4f6;
                overflow: hidden;
                display: flex; align-items: center; justify-content: center;
                img { width: 100%; height: 100%; object-fit: cover; }
            }
            .info {
                h3 { margin: 0; font-size: 16px; color: #111; }
                span { font-size: 13px; color: #4b5563; }
            }
        }
        
        .detail-title {
            font-size: 12px;
            text-transform: uppercase;
            color: #6b7280;
            margin-bottom: 15px;
            font-weight: 700;
        }

        .summary-row { 
            display: flex; 
            justify-content: space-between; 
            align-items: flex-start;
            padding: 12px 0; 
            border-bottom: 1px solid #f3f4f6;
            
            .prod-name {
                display: flex; flex-direction: column;
                strong { color: #111; }
                .calc-formula { font-size: 12px; color: #6b7280; margin-top: 2px; }
            }
            
            .prod-total {
                text-align: right;
                font-weight: bold;
                color: #111;
                display: flex; flex-direction: column; align-items: flex-end;
                
                .debit-tag {
                    font-size: 10px;
                    color: #dc2626;
                    background: #fef2f2;
                    padding: 2px 6px;
                    border-radius: 4px;
                    margin-top: 4px;
                }
            }
        }
        
        .total-row {
            margin-top: 25px;
            text-align: right;
            span { display: block; font-size: 13px; color: #4b5563; margin-bottom: 5px; }
            h1 { margin: 0; color: #1a044e; font-size: 24px; }
        }
    }

    .controls {
        display: flex; justify-content: space-between; margin-top: 30px;
        button {
            padding: 12px 24px; border-radius: 12px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 8px; border: none;
            &.next-btn { background: #1a044e; color: white; }
            &.back-btn { background: white; border: 1px solid #1a044e; color: #1a044e; }
            &.finish-btn { background: #dc2626; color: white; margin-left: auto; } /* Red for withdrawal action */
            &:disabled { opacity: 0.7; cursor: not-allowed; }
        }
    }
    
    .farmer-badge { background: #e0e7ff; color: #1a044e; display: inline-flex; align-items: center; gap: 5px; padding: 5px 10px; rounded-full; font-size: 12px; margin-bottom: 15px; font-weight: bold; }
`;

export default AgentLevantamentoPage;
