'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Search, Package, Check, ChevronRight, ChevronLeft, ArrowRight, User, AlertCircle, FileText } from 'lucide-react';
import jsPDF from 'jspdf';

interface Farmer {
    id: string;
    nome: string;
    bi: string;
    fotoUrl: string;
}

interface Product {
    id: string;
    nome: string;
    categoria: string;
    imagemUrl: string;
    precoReferencia: number;
}

const AgentDepositoPage = () => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Data Lists
    const [farmers, setFarmers] = useState<Farmer[]>([]);
    const [products, setProducts] = useState<Product[]>([]);

    // Selections
    const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
    const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);

    // Form Data
    const [weights, setWeights] = useState<Record<string, number>>({});
    const [qualities, setQualities] = useState<Record<string, 'A' | 'B' | 'C'>>({});

    // Deprecated single state - keeping for now to avoid breaking other refs if any missed, but should be removed
    const [weight, setWeight] = useState<number>(0);
    const [quality, setQuality] = useState<'A' | 'B' | 'C'>('A');

    const [finalPrice, setFinalPrice] = useState<number>(0);
    const [totalValue, setTotalValue] = useState<number>(0);

    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        const user = localStorage.getItem('user');
        if (user) {
            const parsedUser = JSON.parse(user);
            setCurrentUser(parsedUser);
            fetchInitialData(parsedUser.id);
        }
    }, []);

    // TODO: Will be reimplemented for multi-product in step 3
    /*
    useEffect(() => {
        if (selectedProducts.length > 0 && weight > 0) {
            calculateTotal();
        }
    }, [selectedProducts, weight, quality]);
    */

    const fetchInitialData = async (agentId: string) => {
        try {
            const [farmersRes, productsRes] = await Promise.all([
                fetch(`/api/farmers?agentId=${agentId}`),
                fetch('/api/products')
            ]);

            const farmersData = await farmersRes.json();
            const productsData = await productsRes.json();

            if (farmersData.success) setFarmers(farmersData.data);
            if (productsData.success) setProducts(productsData.data);

        } catch (error) {
            console.error('Erro ao carregar dados', error);
        }
    };

    // TODO: Will be reimplemented for multi-product in step 3
    /*
    const calculateTotal = () => {
        if (!selectedProduct) return;

        // Quality Multipliers
        const multipliers = { A: 1.0, B: 0.90, C: 0.80 };
        const pricePerKg = selectedProduct.precoReferencia * multipliers[quality];

        setFinalPrice(pricePerKg);
        setTotalValue(Math.round(pricePerKg * weight));
    };
    */

    const handleNext = () => {
        if (step === 1 && !selectedFarmer) return alert('Selecione um agricultor');
        if (step === 2 && selectedProducts.length === 0) return alert('Selecione pelo menos um produto');
        setStep(step + 1);
    };

    const handleBack = () => setStep(step - 1);

    // TODO: Will be reimplemented for multi-product
    /*
    const generateInvoice = (depositData: any, newBalance: number) => {
        const doc = new jsPDF();

        doc.setFillColor(26, 4, 78);
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.text('BMII', 105, 20, { align: 'center' });
        doc.setFontSize(14);
        doc.text('RECIBO DE DEPÓSITO', 105, 30, { align: 'center' });

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);

        const content = `
        DATA: ${new Date().toLocaleDateString()}
        
        AGRICULTOR: ${selectedFarmer?.nome} (BI: ${selectedFarmer?.bi})
        AGENTE: ${currentUser?.nome}
        
        ------------------------------------------------
        
        PRODUTO: ${selectedProduct?.nome}
        QUANTIDADE: ${weight} Kg
        QUALIDADE: ${quality}
        
        PREÇO BASE: ${selectedProduct?.precoReferencia} Kz/Kg
        PREÇO APLICADO: ${finalPrice.toFixed(2)} Kz/Kg
        
        ------------------------------------------------
        
        VALOR TOTAL CREDITADO: ${totalValue.toLocaleString('pt-AO')} Kz
        
        NOVO SALDO EM CONTA: ${newBalance.toLocaleString('pt-AO')} Kz
        `;

        doc.text(content, 20, 50);
        doc.save(`Recibo_${selectedFarmer?.nome}_${Date.now()}.pdf`);
    };

    const handleSubmit = async () => {
        if (!currentUser || !selectedFarmer || selectedProducts.length === 0) return;

        // Validation: Verify if all products have weight > 0
        const invalidProducts = selectedProducts.filter(p => {
             const prodId = p.id || (p as any)._id;
             return !weights[prodId] || weights[prodId] <= 0;
        });

        if (invalidProducts.length > 0) {
            return alert(`Por favor, insira o peso para: ${invalidProducts.map(p => p.nome).join(', ')}`);
        }

        setLoading(true);
        try {
            const promises = selectedProducts.map(product => {
                const prodId = product.id || (product as any)._id;
                const weight = weights[prodId];
                const quality = qualities[prodId] || 'A';
                
                const payload = {
                    agricultorId: selectedFarmer.id || (selectedFarmer as any)._id,
                    agenteId: currentUser.id,
                    produtoId: prodId,
                    quantidade: weight,
                    qualidade: quality,
                    precoBase: product.precoReferencia
                };

                return fetch('/api/deposits', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                }).then(res => res.json());
            });

            const results = await Promise.all(promises);
            const failures = results.filter(r => !r.success);
            
            if (failures.length === 0) {
                alert('Todos os depósitos foram realizados com sucesso!');
                setStep(1);
                setSelectedFarmer(null);
                setSelectedProducts([]);
                setWeights({});
                setQualities({});
                setTotalValue(0);
            } else {
                console.error('Falhas:', failures);
                alert(`Alguns depósitos falharam. Sucesso: ${results.length - failures.length}/${results.length}. Verifique o console.`);
            }

        } catch (error) {
            console.error(error);
            alert('Erro de conexão');
        } finally {
            setLoading(false);
        }
    };
    */

    // Search
    const [searchTerm, setSearchTerm] = useState('');

    const filteredFarmers = farmers.filter(f =>
        f.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.bi.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <StyledPage>
            <div className="header">
                <h1>DEPÓSITO DE MERCADORIA</h1>
                <p>Passo {step} de 3</p>
            </div>



            <div className="carousel-container">
                {/* STEP 1: SELECT FARMER */}
                {step === 1 && (
                    <div className="step-content fade-in">
                        <h2>1. Selecione o Agricultor</h2>

                        <div className="search-bar">
                            <Search size={20} />
                            <input
                                type="text"
                                placeholder="Pesquisar por nome ou BI..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="selection-list">
                            {filteredFarmers.map((farmer: any) => {
                                const isSelected = selectedFarmer && ((farmer.id && selectedFarmer.id === farmer.id) || (farmer._id && (selectedFarmer as any)._id === farmer._id));
                                return (
                                    <div
                                        key={farmer.id || farmer._id}
                                        className={`list-item ${isSelected ? 'selected' : ''}`}
                                        onClick={() => setSelectedFarmer(farmer)}
                                    >
                                        <div className="avatar">
                                            {farmer.fotoUrl ? <img src={farmer.fotoUrl} /> : <User />}
                                        </div>
                                        <div className="info">
                                            <h3>{farmer.nome}</h3>
                                            <span>BI: {farmer.bi}</span>
                                        </div>
                                        <div className="action">
                                            {isSelected ? (
                                                <div className="check-circle"><Check size={16} /></div>
                                            ) : (
                                                <div className="select-circle"></div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                            {filteredFarmers.length === 0 && (
                                <p className="empty-msg">Nenhum agricultor encontrado.</p>
                            )}
                        </div>
                    </div>
                )}

                {/* STEP 2: SELECT PRODUCTS (MULTI-SELECT) */}
                {step === 2 && (
                    <div className="step-content fade-in">
                        <h2>2. Selecionar Produtos</h2>
                        <p className="hint">Selecione um ou mais produtos para o depósito</p>

                        <div className="product-grid">
                            {products.map((product: any) => {
                                const isSelected = selectedProducts.some(p => (p.id || (p as any)._id) === (product.id || (product as any)._id));
                                return (
                                    <div
                                        key={product.id || product._id}
                                        className={`product-card ${isSelected ? 'selected' : ''}`}
                                        onClick={() => {
                                            if (isSelected) {
                                                setSelectedProducts(selectedProducts.filter(p => (p.id || (p as any)._id) !== (product.id || (product as any)._id)));
                                            } else {
                                                setSelectedProducts([...selectedProducts, product]);
                                            }
                                        }}
                                    >
                                        <div className="checkbox-indicator">
                                            {isSelected && <Check size={20} strokeWidth={3} />}
                                        </div>

                                        <div className="prod-img">
                                            {product.imagemUrl ? <img src={product.imagemUrl} alt={product.nome} /> : <Package size={60} />}
                                        </div>
                                        <span className="product-name">{product.nome}</span>
                                        <small className="product-price">{product.precoReferencia} Kz/Kg</small>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
                {/* STEP 3: CONFIGURE PRODUCTS */}
                {step === 3 && (
                    <div className="step-content fade-in">
                        <h2>3. Configuração de Depósito</h2>
                        <div className="config-list">
                            {selectedProducts.map((product) => {
                                const prodId = product.id || (product as any)._id;
                                const w = weights[prodId] || 0;
                                const q = qualities[prodId] || 'A';
                                const price = (product.precoReferencia * (q === 'A' ? 1 : q === 'B' ? 0.9 : 0.8));
                                const total = Math.round(price * w);

                                return (
                                    <div key={prodId} className="config-card">
                                        <div className="config-header">
                                            <div className="prod-info-mini">
                                                {product.imagemUrl ? <img src={product.imagemUrl} /> : <Package size={20} />}
                                                <h4>{product.nome}</h4>
                                            </div>
                                            <span>{product.precoReferencia} Kz/Kg</span>
                                        </div>
                                        <div className="config-body">
                                            <div className="input-row">
                                                <div className="group">
                                                    <label>Peso (Kg)</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        placeholder="0"
                                                        value={w || ''}
                                                        onChange={(e) => {
                                                            const newWeights = { ...weights, [prodId]: Number(e.target.value) };
                                                            setWeights(newWeights);
                                                        }}
                                                    />
                                                </div>
                                                <div className="group">
                                                    <label>Qualidade</label>
                                                    <div className="quality-mini-selector">
                                                        {['A', 'B', 'C'].map((opt) => (
                                                            <button
                                                                key={opt}
                                                                className={q === opt ? 'active' : ''}
                                                                onClick={() => {
                                                                    setQualities({ ...qualities, [prodId]: opt as any });
                                                                }}
                                                            >
                                                                {opt}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="item-total">
                                                <span>Total:</span>
                                                <strong>{total.toLocaleString('pt-AO')} Kz</strong>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            <div className="total-display compact">
                                <span>Total Geral a Pagar</span>
                                <h1>{
                                    selectedProducts.reduce((acc, p) => {
                                        const prodId = p.id || (p as any)._id;
                                        const w = weights[prodId] || 0;
                                        const q = qualities[prodId] || 'A';
                                        const price = (p.precoReferencia * (q === 'A' ? 1 : q === 'B' ? 0.9 : 0.8));
                                        return acc + Math.round(price * w);
                                    }, 0).toLocaleString('pt-AO')
                                } Kz</h1>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="controls" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', paddingBottom: '30px' }}>
                {step > 1 ? (
                    <button
                        className="back-btn"
                        onClick={handleBack}
                        style={{ background: '#000', color: 'white', border: '1px solid #000' }}
                    >
                        <ChevronLeft /> Voltar
                    </button>
                ) : <div></div>}

                {step < 3 ? (
                    <button
                        className="next-btn"
                        onClick={handleNext}
                        disabled={
                            (step === 1 && !selectedFarmer) ||
                            (step === 2 && selectedProducts.length === 0)
                        }
                        style={{ background: '#000', color: 'white', border: '1px solid #000' }}
                    >
                        Próximo <ChevronRight />
                    </button>
                ) : (
                    <button
                        className="finish-btn"
                        onClick={handleSubmit}
                        disabled={loading}
                        style={{ background: '#000', color: 'white', border: '1px solid #000' }}
                    >
                        Confirmar <FileText size={18} />
                    </button>
                )}
            </div>


        </StyledPage>
    );
};

const StyledPage = styled.div`
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;

    .header {
        margin-bottom: 30px;
        text-align: center;
        h1 { color: #1a044e; margin: 0; }
        p { color: #6b7280; font-size: 14px; }
    }

    .carousel-container {
        min-height: 400px;
        background: white;
        border-radius: 20px;
        padding: 30px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.05);
        margin-bottom: 20px;
    }

    .step-content h2 {
        color: #1a044e;
        margin-bottom: 20px;
        font-size: 18px;
    }

    .search-bar {
        display: flex; align-items: center; gap: 10px;
        padding: 12px 20px;
        background: #f3f4f6;
        border-radius: 12px;
        margin-bottom: 20px;
        color: #6b7280;

        input {
            border: none; background: transparent;
            font-size: 16px; width: 100%;
            outline: none; color: #1f2937;
        }
    }

    .selection-list {
        display: flex; flex-direction: column; gap: 10px;
        max-height: 400px; overflow-y: auto;
    }

    .list-item {
        display: flex; align-items: center; gap: 15px;
        padding: 12px;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.2s;

        &:hover { background: #f9fafb; border-color: #d1d5db; }
        &.selected { background: #f0fdf4; border-color: #1a044e; }

        .avatar {
            width: 45px; height: 45px;
            border-radius: 50%; background: #eee;
            overflow: hidden; flex-shrink: 0;
            img { width: 100%; height: 100%; object-fit: cover; }
        }
        
        .info {
            flex: 1;
            h3 { font-size: 16px; margin: 0 0 2px; color: #111; }
            span { font-size: 13px; color: #666; }
        }

        .action {
            .check-circle {
                width: 24px; height: 24px;
                background: #1a044e; color: white;
                border-radius: 50%; display: flex;
                align-items: center; justify-content: center;
            }
            .select-circle {
                width: 24px; height: 24px;
                border: 2px solid #d1d5db;
                border-radius: 50%;
            }
        }
    }

    .hint { color: #777; font-size: 14px; margin-bottom: 25px; text-align: center; }

    .product-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
        gap: 20px;
        margin-top: 20px;
    }

    .product-card {
        position: relative;
        padding: 20px;
        border: 2px solid #e5e7eb;
        border-radius: 12px;
        text-align: center;
        cursor: pointer;
        transition: all 0.2s;
        background: white;

        &:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
        &.selected { 
            border-color: #1a044e; 
            background: #eef2ff;
            box-shadow: 0 4px 12px rgba(26,4,78,0.15);
        }

        .checkbox-indicator {
            position: absolute;
            top: 10px;
            right: 10px;
            width: 28px;
            height: 28px;
            background: white;
            border: 2px solid #d1d5db;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
        }

        &.selected .checkbox-indicator {
            background: #1a044e;
            border-color: #1a044e;
            color: white;
        }

        .prod-img {
            width: 100px;
            height: 100px;
            background: #f3f4f6;
            margin: 0 auto 15px;
            border-radius: 12px;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;

            img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
        }

        .product-name {
            display: block;
            font-weight: bold;
            font-size: 15px;
            color: #000;
            margin-bottom: 5px;
            line-height: 1.3;
        }

        .product-price {
            font-size: 13px;
            color: #000;
            font-weight: 500;
        }

    .input-group {
        max-width: 200px;
        margin: 0 auto;
        text-align: center;
        
        label { display: block; font-weight: bold; margin-bottom: 8px; }
        input {
            width: 100%; padding: 12px;
            font-size: 20px; text-align: center;
            border: 2px solid #ddd; border-radius: 10px;
            outline: none;
            color: black;
            &:focus { border-color: #1a044e; }
        }
    }

    .config-section {
        margin-top: 30px;
    }

    .quality-section {
        margin: 30px 0;
        text-align: center;

        label { display: block; font-weight: bold; margin-bottom: 10px; }
    }

    .bill-summary {
        background: #f9fafb;
        padding: 20px;
        border-radius: 12px;
        margin-top: 20px;
    }

    .bill-card {
        background: #f9fafb;
        padding: 20px;
        border-radius: 12px;
    }

    .bill-row {
        display: flex; justify-content: space-between;
        margin-bottom: 10px;
        font-size: 14px;
    }

    .quality-selector {
        display: flex; gap: 10px; margin: 15px 0 5px;
        button {
            flex: 1; padding: 10px;
            border: 1px solid #ddd; border-radius: 8px;
            background: white; font-weight: bold; cursor: pointer;
            &.active { background: #1a044e; color: white; border-color: #1a044e; }
        }
    }
    
    .quality-info { font-size: 12px; color: #666; margin-bottom: 20px; text-align: center; }

    .total-display {
        text-align: center;
        background: #1a044e; color: white;
        padding: 20px; border-radius: 12px;
        span { font-size: 12px; opacity: 0.8; }
        h1 { margin: 5px 0 0; font-size: 28px; }
    }

    .controls {
        display: flex; justify-content: space-between;
        margin-top: 20px;
        
        button {
            display: flex; align-items: center; gap: 8px;
            padding: 12px 24px; border-radius: 12px;
            border: none; font-weight: bold; cursor: pointer;
            transition: all 0.2s;
            
            &.back-btn { background: #e5e7eb; color: #374151; }
            &.next-btn { background: #1a044e; color: white; margin-left: auto; }
            &.finish-btn { background: #059669; color: white; margin-left: auto; }
            
            &:disabled { opacity: 0.5; cursor: not-allowed; }
            &:hover:not(:disabled) { transform: translateY(-2px); }
        }
    }

    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    .fade-in { animation: fadeIn 0.3s ease-out; }
    .config-list {
        display: flex; flex-direction: column; gap: 15px; margin-bottom: 20px;
    }

    .config-card {
        background: white; border: 1px solid #eee; border-radius: 12px;
        overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.02);
    }

    .config-header {
        background: #f8f9fa; padding: 10px 15px;
        display: flex; justify-content: space-between; align-items: center;
        border-bottom: 1px solid #eee;
        
        .prod-info-mini {
            display: flex; align-items: center; gap: 10px;
            img { width: 30px; height: 30px; border-radius: 6px; object-fit: cover; }
            h4 { margin: 0; font-size: 14px; }
        }
        span { font-size: 12px; color: #666; }
    }

    .config-body { padding: 15px; }

    .input-row {
        display: flex; gap: 15px; margin-bottom: 10px;
        .group { flex: 1; label { display: block; font-size: 11px; font-weight: bold; margin-bottom: 5px; } }
        input { 
            width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px; 
            font-size: 14px; outline: none; &:focus { border-color: #1a044e; }
        }
    }

    .quality-mini-selector {
        display: flex; gap: 5px;
        button {
            flex: 1; padding: 8px 0; border: 1px solid #ddd; border-radius: 6px; background: white;
            font-size: 12px; font-weight: bold; cursor: pointer;
            &.active { background: #1a044e; color: white; border-color: #1a044e; }
        }
    }

    .item-total {
        display: flex; justify-content: space-between; align-items: center;
        margin-top: 10px; padding-top: 10px; border-top: 1px dashed #eee;
        font-size: 13px;
    }

    .total-display.compact {
        padding: 15px;
        h1 { font-size: 20px; }
    }
`;

export default AgentDepositoPage;
