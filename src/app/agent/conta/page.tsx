'use client';

import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { Camera, Upload, UserPlus, Save, X, Search, MapPin, Phone, User, CheckCircle, FileText, LayoutGrid, List, Eye } from 'lucide-react';
import jsPDF from 'jspdf';
import Link from 'next/link';

interface Farmer {
    id: string;
    nome: string;
    bi: string;
    telefone: string;
    endereco: string;
    fotoUrl: string;
    dataRegisto: string;
}

const AgentContaPage = () => {
    const [farmers, setFarmers] = useState<Farmer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Camera & Photo State
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        nome: '',
        bi: '',
        telefone: '',
        endereco: '',
        fotoUrl: ''
    });

    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        // Get current agent from local storage
        const user = localStorage.getItem('user');
        if (user) {
            const parsedUser = JSON.parse(user);
            setCurrentUser(parsedUser);
            fetchFarmers(parsedUser.id);
        }
    }, []);

    const fetchFarmers = async (agentId: string) => {
        try {
            const res = await fetch(`/api/farmers?agentId=${agentId}`);
            const data = await res.json();
            if (data.success) {
                setFarmers(data.data);
            }
        } catch (error) {
            console.error('Erro ao buscar agricultores', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = () => {
        setFormData({ nome: '', bi: '', telefone: '', endereco: '', fotoUrl: '' });
        setPhotoPreview(null);
        setIsModalOpen(true);
    };

    // Camera Logic
    const startCamera = async () => {
        setIsCameraOpen(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Erro ao acessar câmera:", err);
            alert("Não foi possível acessar a câmera. Verifique as permissões.");
            setIsCameraOpen(false);
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setIsCameraOpen(false);
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            if (context) {
                context.drawImage(videoRef.current, 0, 0, 320, 240); // Standardize size
                const dataUrl = canvasRef.current.toDataURL('image/jpeg');
                setPhotoPreview(dataUrl);
                setFormData({ ...formData, fotoUrl: dataUrl });
                stopCamera();
            }
        }
    };

    // File Upload Logic
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setPhotoPreview(result);
                setFormData({ ...formData, fotoUrl: result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        setSubmitting(true);
        try {
            const payload = {
                ...formData,
                agenteResponsavel: currentUser.id
            };

            const res = await fetch('/api/farmers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (data.success) {
                setFarmers([data.data, ...farmers]);

                // Generate and download contract
                generateContract(data.data);

                setIsModalOpen(false);
                setPhotoPreview(null);
                setFormData({ nome: '', bi: '', telefone: '', endereco: '', fotoUrl: '' });
                alert('Agricultor registado com sucesso! O contrato será baixado automaticamente.');
            } else {
                alert(data.error || 'Erro ao criar agricultor');
            }
        } catch (error) {
            alert('Erro de conexão');
        } finally {
            setSubmitting(false);
        }
    };

    const generateContract = async (farmer: Farmer) => {
        const doc = new jsPDF();
        const agentName = currentUser?.nome || 'AGENTE AUTORIZADO';

        const drawPage = async (isCopy: boolean) => {
            // --- Header ---

            // Background for Header
            doc.setFillColor(26, 4, 78); // #1a044e
            doc.rect(0, 0, 210, 45, 'F');

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
                        } else {
                            reject(new Error('Canvas context failed'));
                        }
                    };
                    img.onerror = () => reject(new Error('Failed to load image'));
                });

                // Add Logo (Centered)
                const imgWidth = 20;
                const imgHeight = 20;
                const x = (210 - imgWidth) / 2;
                doc.addImage(logoImage, 'PNG', x, 5, imgWidth, imgHeight);

            } catch (error) {
                console.warn('Logo could not be loaded, using text fallback', error);
                // Fallback Text if logo fails
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(22);
                doc.setFont('helvetica', 'bold');
                doc.text('BMII', 105, 20, { align: 'center' });
            }

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('BANCO DE MERCADORIA DO INVESTIMENTO INTEGRADO', 105, 35, { align: 'center' });

            // --- Title ---
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('CONTRATO DE ADESÃO E ABERTURA DE CONTA', 105, 65, { align: 'center' });

            if (isCopy) {
                doc.setFontSize(10);
                doc.setTextColor(150);
                doc.text('(DUPLICADO - VIA DO AGENTE)', 105, 72, { align: 'center' });
                doc.setTextColor(0, 0, 0);
            }

            // --- Content ---
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');

            const marginLeft = 20;
            const width = 170;
            let yPos = 85;

            // Identification
            const identificationText = `
ENTRE:

1. BMII - BANCO DE MERCADORIA DO INVESTIMENTO INTEGRADO, neste ato representado pelo agente ${agentName.toUpperCase()}, doravante designado por "BANCO".

2. ${farmer.nome.toUpperCase()}, portador do BI nº ${farmer.bi}, residente em ${farmer.endereco}, com telefone ${farmer.telefone}, doravante designado(a) por "AGRICULTOR(A)".

É celebrado o presente contrato que se rege pelas seguintes cláusulas:
            `;

            doc.text(identificationText, marginLeft, yPos, { maxWidth: width, align: 'justify' });
            yPos += 50;

            // Clauses
            const clauses = [
                "CLÁUSULA 1ª (OBJETO): O presente contrato tem por objeto a abertura de conta de mercadoria e a prestação de serviços de gestão, armazenamento e intermediação de venda de produtos agrícolas pelo BANCO ao AGRICULTOR.",

                "CLÁUSULA 2ª (DEPÓSITOS): O AGRICULTOR poderá depositar seus produtos nos armazéns do BANCO. Cada depósito será sujeito a avaliação de qualidade e quantidade, sendo emitido um recibo correspondente.",

                "CLÁUSULA 3ª (QUOTA E SAQUES): O saldo da conta do AGRICULTOR será mantido em quantidade de produto ou valor monetário equivalente. O AGRICULTOR poderá solicitar o saque parcial ou total, sujeito à disponibilidade e prazos do BANCO.",

                "CLÁUSULA 4ª (TAXAS): O BANCO cobrará uma taxa de administração e armazenamento sobre os produtos depositados, conforme tabela em vigor, que o AGRICULTOR declara conhecer e aceitar.",

                "CLÁUSULA 5ª (VIGÊNCIA): Este contrato entra em vigor na data de sua assinatura e tem duração indeterminada, podendo ser rescindido por qualquer das partes com aviso prévio de 30 dias.",

                "CLÁUSULA 6ª (CONFIDENCIALIDADE): As partes comprometem-se a manter sigilo sobre as informações trocadas no âmbito deste contrato."
            ];

            doc.setFont('helvetica', 'normal');
            clauses.forEach(clause => {
                doc.text(clause, marginLeft, yPos, { maxWidth: width, align: 'justify' });
                yPos += 25; // Estimate spacing based on text length
            });

            // --- Signatures ---
            yPos += 20;
            const date = new Date().toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' });
            doc.text(`Luanda, ${date}`, marginLeft, yPos);

            yPos += 40;

            // Lines for signature
            doc.setLineWidth(0.5);
            doc.line(marginLeft, yPos, marginLeft + 70, yPos); // Farmer
            doc.line(120, yPos, 190, yPos); // Agent (BMII)

            doc.setFontSize(9);
            // Farmer Name below line
            doc.text(farmer.nome.toUpperCase(), marginLeft + 35, yPos + 5, { align: 'center', maxWidth: 70 });
            doc.text("(AGRICULTOR)", marginLeft + 35, yPos + 10, { align: 'center' });

            // Agent Name below line
            doc.text(agentName.toUpperCase(), 155, yPos + 5, { align: 'center', maxWidth: 70 });
            doc.text("(PELO BMII)", 155, yPos + 10, { align: 'center' });

            // Footer
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text("BMII - Processado por computador", 105, 280, { align: 'center' });

            // Safety check for ID
            const farmerId = farmer.id || (farmer as any)._id || 'UNKNOWN';
            doc.text(`Ref: ${farmerId.toString().substring(0, 8).toUpperCase()}`, 105, 285, { align: 'center' });
        };

        // Page 1: Original
        await drawPage(false);

        // Page 2: Duplicate
        doc.addPage();
        await drawPage(true);

        doc.save(`Contrato_BMII_${farmer.nome.replace(/\s+/g, '_')}.pdf`);
    };

    const filteredFarmers = farmers.filter(f =>
        f.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.bi.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <StyledPage>
            <div className="page-header">
                <div className="header-content">
                    <h1>AGRICULTORES</h1>
                    <p>Gerencie as contas dos seus fornecedores</p>
                </div>
                <button className="add-btn" onClick={handleOpenModal}>
                    <UserPlus size={20} />
                    NOVO AGRICULTOR
                </button>
            </div>

            {/* Toolbar: Search and View Toggle */}
            <div className="toolbar">
                <div className="search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Pesquisar por nome ou BI..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="view-toggle">
                    <button
                        className={viewMode === 'grid' ? 'active' : ''}
                        onClick={() => setViewMode('grid')}
                        title="Visualização em Grade"
                    >
                        <LayoutGrid size={20} />
                    </button>
                    <button
                        className={viewMode === 'list' ? 'active' : ''}
                        onClick={() => setViewMode('list')}
                        title="Visualização em Lista"
                    >
                        <List size={20} />
                    </button>
                </div>
            </div>

            {/* Content: Grid or List */}
            {viewMode === 'grid' ? (
                /* Grid View */
                <div className="farmers-grid">
                    {filteredFarmers.map(farmer => (
                        <div key={farmer.id || Math.random()} className="farmer-card">
                            <div className="card-header">
                                <div className="farmer-avatar">
                                    {farmer.fotoUrl ? (
                                        <img src={farmer.fotoUrl} alt={farmer.nome} />
                                    ) : (
                                        <User size={32} />
                                    )}
                                </div>
                                <div className="farmer-info">
                                    <h3>{farmer.nome}</h3>
                                    <span className="bi-badge">BI: {farmer.bi}</span>
                                </div>
                            </div>
                            <div className="card-details">
                                <div className="detail-item">
                                    <Phone size={14} />
                                    <span>{farmer.telefone}</span>
                                </div>
                                <div className="detail-item">
                                    <MapPin size={14} />
                                    <span>{farmer.endereco}</span>
                                </div>
                            </div>
                            <div className="card-footer">
                                <span className="status-active">
                                    <CheckCircle size={12} /> ATIVO
                                </span>
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    <Link href={`/agent/conta/${farmer.id || (farmer as any)._id}`}>
                                        <button className="download-btn" title="Ver Detalhes">
                                            <Eye size={14} /> Ver
                                        </button>
                                    </Link>
                                    <button
                                        onClick={() => generateContract(farmer)}
                                        className="download-btn"
                                        title="Baixar Contrato"
                                    >
                                        <FileText size={14} /> Contrato
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredFarmers.length === 0 && !loading && (
                        <div className="empty-state">
                            <p>Nenhum agricultor encontrado.</p>
                        </div>
                    )}
                </div>
            ) : (
                /* List View */
                <div className="farmers-list-container">
                    <table className="farmers-table">
                        <thead>
                            <tr>
                                <th>Agricultor</th>
                                <th>BI</th>
                                <th>Telefone</th>
                                <th>Endereço</th>
                                <th>Status</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredFarmers.map(farmer => (
                                <tr key={farmer.id || Math.random()}>
                                    <td>
                                        <div className="table-user-cell">
                                            <div className="avatar-mini">
                                                {farmer.fotoUrl ? <img src={farmer.fotoUrl} /> : <User size={16} />}
                                            </div>
                                            <span>{farmer.nome}</span>
                                        </div>
                                    </td>
                                    <td>{farmer.bi}</td>
                                    <td>{farmer.telefone}</td>
                                    <td>{farmer.endereco}</td>
                                    <td>
                                        <span className="status-badge-mini">Ativo</span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '5px' }}>
                                            <Link href={`/agent/conta/${farmer.id || (farmer as any)._id}`}>
                                                <button className="action-icon-btn" title="Ver Detalhes">
                                                    <Eye size={18} />
                                                </button>
                                            </Link>
                                            <button
                                                className="action-icon-btn"
                                                onClick={() => generateContract(farmer)}
                                                title="Baixar Contrato"
                                            >
                                                <FileText size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredFarmers.length === 0 && !loading && (
                        <div className="empty-state">
                            <p>Nenhum agricultor encontrado.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                            <X size={20} />
                        </button>
                        <h2>REGISTAR AGRICULTOR</h2>

                        <div className="photo-section">
                            {isCameraOpen ? (
                                <div className="camera-container">
                                    <video ref={videoRef} autoPlay playsInline width="320" height="240"></video>
                                    <canvas ref={canvasRef} width="320" height="240" style={{ display: 'none' }}></canvas>
                                    <button type="button" onClick={capturePhoto} className="capture-btn">
                                        <Camera size={20} /> CAPTURAR
                                    </button>
                                    <button type="button" onClick={stopCamera} className="cancel-camera-btn">Cancelar</button>
                                </div>
                            ) : (
                                <div className="photo-preview-container">
                                    {photoPreview ? (
                                        <img src={photoPreview} alt="Preview" className="photo-preview" />
                                    ) : (
                                        <div className="photo-placeholder">
                                            <User size={48} />
                                            <span>Sem foto</span>
                                        </div>
                                    )}
                                    <div className="photo-actions">
                                        <button type="button" onClick={startCamera} className="photo-action-btn">
                                            <Camera size={18} /> CÂMERA
                                        </button>
                                        <label className="photo-action-btn upload">
                                            <Upload size={18} /> UPLOAD
                                            <input type="file" accept="image/*" onChange={handleFileUpload} hidden />
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="farmer-form">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>NOME COMPLETO</label>
                                    <input required type="text" value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} placeholder="Ex: Manuel António" />
                                </div>
                                <div className="form-group">
                                    <label>Nº BILHETE IDENTIDADE</label>
                                    <input required type="text" value={formData.bi} onChange={e => setFormData({ ...formData, bi: e.target.value })} placeholder="000123456LA032" />
                                </div>
                                <div className="form-group">
                                    <label>TELEFONE</label>
                                    <input required type="text" value={formData.telefone} onChange={e => setFormData({ ...formData, telefone: e.target.value })} placeholder="923 000 000" />
                                </div>
                                <div className="form-group">
                                    <label>ENDEREÇO</label>
                                    <input required type="text" value={formData.endereco} onChange={e => setFormData({ ...formData, endereco: e.target.value })} placeholder="Município, Bairro..." />
                                </div>
                            </div>
                            <button type="submit" className="submit-btn" disabled={submitting || !formData.fotoUrl}>
                                {submitting ? 'A REGISTAR...' : 'CONFIRMAR REGISTO'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </StyledPage>
    );
};

const StyledPage = styled.div`
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;

    .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
    }

    .header-content h1 {
        font-size: 24px;
        font-weight: 900;
        color: #1a044e;
        letter-spacing: 1px;
        margin: 0;
    }

    .header-content p {
        color: #6b7280;
        font-size: 14px;
        margin: 4px 0 0;
    }

    .add-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        background: #1a044e;
        color: white;
        padding: 10px 20px;
        border-radius: 12px;
        font-weight: 700;
        border: none;
        cursor: pointer;
    }

    /* Toolbar */
    .toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 25px;
        gap: 20px;
        background: white;
        padding: 10px 20px;
        border-radius: 12px;
        box-shadow: 0 4px 10px rgba(0,0,0,0.03);
    }

    .search-box {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 10px;
        color: #9ca3af;

        input {
            border: none;
            outline: none;
            font-size: 15px;
            width: 100%;
            color: #1f2937;
        }
    }

    .view-toggle {
        display: flex;
        gap: 5px;
        background: #f3f4f6;
        padding: 4px;
        border-radius: 8px;

        button {
            background: none;
            border: none;
            padding: 6px;
            border-radius: 6px;
            color: #6b7280;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;

            &:hover { background: #e5e7eb; }
            &.active { background: white; color: #1a044e; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        }
    }

    /* Grid View */
    .farmers-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 20px;
    }

    .farmer-card {
        background: white;
        border-radius: 16px;
        padding: 20px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.05);
        border: 1px solid #f3f4f6;
        transition: transform 0.2s;
        &:hover { transform: translateY(-2px); }
    }

    /* List View */
    .farmers-list-container {
        background: white;
        border-radius: 16px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.05);
        border: 1px solid #f3f4f6;
        overflow: hidden;
    }

    .farmers-table {
        width: 100%;
        border-collapse: collapse;

        th {
            text-align: left;
            padding: 15px 20px;
            font-size: 12px;
            color: #6b7280;
            text-transform: uppercase;
            background: #f9fafb;
            border-bottom: 1px solid #e5e7eb;
        }

        td {
            padding: 15px 20px;
            border-bottom: 1px solid #f3f4f6;
            font-size: 14px;
            color: #1f2937;
        }

        tr:last-child td { border-bottom: none; }
        tr:hover { background: #f9fafb; }
    }

    .table-user-cell {
        display: flex; align-items: center; gap: 12px;
        font-weight: 600;
    }

    .avatar-mini {
        width: 32px; height: 32px; border-radius: 50%;
        background: #eee; overflow: hidden; display: flex; align-items: center; justify-content: center;
        img { width: 100%; height: 100%; object-fit: cover; }
    }

    .status-badge-mini {
        background: #d1fae5; color: #059669;
        padding: 2px 8px; border-radius: 10px;
        font-size: 11px; font-weight: 700;
    }

    .action-icon-btn {
        background: white; border: 1px solid #e5e7eb;
        color: #1a044e; width: 32px; height: 32px;
        border-radius: 8px; display: flex; align-items: center; justify-content: center;
        cursor: pointer; transition: all 0.2s;

        &:hover { background: #eff6ff; border-color: #dbeafe; }
    }

    .card-header {
        display: flex;
        align-items: center;
        gap: 15px;
        margin-bottom: 15px;
    }

    .farmer-avatar {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: #f3f4f6;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .farmer-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .farmer-info h3 {
        margin: 0 0 4px 0;
        font-size: 16px;
        font-weight: 700;
        color: #1f2937;
    }

    .bi-badge {
        font-size: 11px;
        background: #e5e7eb;
        padding: 2px 8px;
        border-radius: 4px;
        font-weight: 600;
        color: #4b5563;
    }

    .card-details {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 15px;
    }

    .detail-item {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 13px;
        color: #6b7280;
    }

    .card-footer {
        border-top: 1px solid #f3f4f6;
        padding-top: 15px;
        display: flex;
        justify-content: space-between;
    }

    .status-active {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 11px;
        font-weight: 700;
        color: #059669;
        background: #d1fae5;
        padding: 4px 8px;
        border-radius: 10px;
    }

    .download-btn {
        display: flex;
        align-items: center;
        gap: 4px;
        background: #eff6ff;
        color: #1a044e;
        border: 1px solid #dbeafe;
        padding: 4px 10px;
        border-radius: 8px;
        font-size: 11px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s;
    }

    .download-btn:hover {
        background: #dbeafe;
        transform: translateY(-1px);
    }

    /* Modal */
    .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 50;
        backdrop-filter: blur(4px);
    }

    .modal-card {
        background: white;
        width: 100%;
        max-width: 500px;
        border-radius: 20px;
        padding: 30px;
        position: relative;
        max-height: 90vh;
        overflow-y: auto;
    }

    .close-btn {
        position: absolute;
        top: 20px;
        right: 20px;
        background: none;
        border: none;
        cursor: pointer;
        color: #9ca3af;
    }

    .modal-card h2 {
        margin: 0 0 25px 0;
        font-size: 20px;
        color: #1a044e;
        font-weight: 800;
        text-align: center;
    }

    .photo-section {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: 25px;
    }

    .camera-container, .photo-preview-container {
        width: 320px;
        height: 240px;
        background: #000;
        border-radius: 12px;
        overflow: hidden;
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }

    .photo-preview-container {
        background: #f9fafb;
        border: 2px dashed #d1d5db;
    }

    .photo-preview {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .photo-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        color: #9ca3af;
        gap: 10px;
    }

    .photo-actions {
        position: absolute;
        bottom: 20px;
        display: flex;
        gap: 10px;
    }

    .photo-action-btn {
        background: rgba(255,255,255,0.9);
        border: none;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 700;
        color: #1f2937;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .capture-btn {
        position: absolute;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: white;
        border: none;
        border-radius: 30px;
        padding: 10px 20px;
        font-weight: bold;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .cancel-camera-btn {
        position: absolute;
        top: 10px;
        right: 10px;
        background: rgba(0,0,0,0.5);
        color: white;
        border: none;
        padding: 5px 10px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
    }

    .farmer-form {
        display: flex;
        flex-direction: column;
        gap: 20px;
    }

    .form-grid {
        display: grid;
        gap: 15px;
    }

    .form-group label {
        display: block;
        font-size: 11px;
        font-weight: 700;
        color: #6b7280;
        margin-bottom: 6px;
        letter-spacing: 0.5px;
    }

    .form-group input {
        width: 100%;
        padding: 12px 15px;
        border: 1px solid #e5e7eb;
        border-radius: 10px;
        font-size: 14px;
        outline: none;
        transition: all 0.2s;
        color: #000000;
    }

    .form-group input:focus {
        border-color: #1a044e;
        box-shadow: 0 0 0 3px rgba(26, 4, 78, 0.1);
    }

    .submit-btn {
        background: linear-gradient(135deg, #0f0092 0%, #1a044e 100%);
        color: white;
        border: none;
        padding: 16px;
        border-radius: 12px;
        font-weight: 700;
        cursor: pointer;
        margin-top: 10px;
    }

    .submit-btn:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }
`;

export default AgentContaPage;
