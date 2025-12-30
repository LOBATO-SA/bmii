'use client';

import React, { useState, useEffect } from 'react';
import {
  Package,
  Search,
  Edit2,

  Trash2,
  X,
  CheckCircle,
  AlertCircle,
  Folder,
  Plus
} from 'lucide-react';
import styled from 'styled-components';

interface Produto {
  id: string;
  nome: string;
  categoria: string;
  unidade: string;
  quantidade: number;
  precoReferencia: number;
  imagemUrl?: string;
  status: 'Ativo' | 'Inativo';
  dataCriacao: string;
}


interface Categoria {
  id: string;
  nome: string;
}

const AdminProdutosPage = () => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (data.success) {
        setCategorias(data.data.map((c: any) => ({ id: c._id, nome: c.nome })));
      }
    } catch (err) {
      console.error('Erro ao buscar categorias', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.success) {
        setProdutos(data.data);
      } else {
        setError('Erro ao carregar produtos');
      }
    } catch (err) {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nome: '',
    categoria: '',
    unidade: 'kg',
    quantidade: 0,
    precoReferencia: 0,
    imagemUrl: '',
    status: 'Ativo' as 'Ativo' | 'Inativo'
  });

  const filteredProdutos = produtos.filter(produto =>
    (produto.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (produto.categoria || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (produto?: Produto) => {
    if (produto) {
      setEditingProduto(produto);
      setFormData({
        nome: produto.nome,
        categoria: produto.categoria,
        unidade: produto.unidade,
        quantidade: produto.quantidade,
        precoReferencia: produto.precoReferencia,
        imagemUrl: produto.imagemUrl || '',
        status: produto.status
      });
    } else {
      setEditingProduto(null);
      setFormData({ nome: '', categoria: '', unidade: 'kg', quantidade: 0, precoReferencia: 0, imagemUrl: '', status: 'Ativo' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduto(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setError('');
    setSubmitting(true);

    try {
      if (editingProduto) {
        const res = await fetch(`/api/products/${editingProduto.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        const data = await res.json();

        if (data.success) {
          setProdutos(produtos.map(p => p.id === editingProduto.id ? data.data : p));
          handleCloseModal();
        } else {
          alert(data.error || 'Erro ao atualizar produto');
        }
      } else {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        const data = await res.json();

        if (data.success) {
          setProdutos([data.data, ...produtos]);
          handleCloseModal();
        } else {
          alert(data.error || 'Erro ao criar produto');
        }
      }
    } catch (err) {
      alert('Erro ao conectar com o servidor');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: newCategoryName })
      });
      const data = await res.json();
      if (data.success) {
        setCategorias([...categorias, { id: data.data._id, nome: data.data.nome }]);
        setNewCategoryName('');
      } else {
        alert(data.error || 'Erro ao criar categoria');
      }
    } catch (err) {
      alert('Erro ao criar categoria');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Excluir categoria?')) return;
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setCategorias(categorias.filter(c => c.id !== id));
      } else {
        alert(data.error || 'Erro ao excluir');
      }
    } catch (err) {
      alert('Erro ao excluir');
    }
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/products/${deleteId}`, { method: 'DELETE' });
      const data = await res.json();

      if (data.success) {
        setProdutos(produtos.filter(p => p.id !== deleteId));
        setDeleteId(null);
      } else {
        alert(data.error || 'Erro ao excluir produto');
      }
    } catch (err) {
      alert('Erro ao excluir produto');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <StyledPageWrapper>
      <div className="page-header">
        <div className="header-content">
          <h1>CATÁLOGO DE PRODUTOS</h1>
          <p>Gestão completa dos produtos aceites pela BMII</p>
        </div>
        <button onClick={() => setIsCategoryModalOpen(true)} className="category-btn">
          <Folder size={18} />
          <span>GERIR CATEGORIAS</span>
        </button>
        <button onClick={() => handleOpenModal()} className="add-btn">
          <Package size={20} />
          <span>ADICIONAR PRODUTO</span>
        </button>
      </div>

      {/* Stats Bar */}
      <div className="stats-grid">
        <div className="stat-card blue">
          <span className="stat-label">TOTAL</span>
          <span className="stat-value">{produtos.length}</span>
        </div>
        <div className="stat-card green">
          <span className="stat-label">ATIVOS</span>
          <span className="stat-value">{produtos.filter(p => p.status === 'Ativo').length}</span>
        </div>
        <div className="stat-card red">
          <span className="stat-label">INATIVOS</span>
          <span className="stat-value">{produtos.filter(p => p.status === 'Inativo').length}</span>
        </div>
      </div>

      {/* Table Container */}
      <div className="table-container">
        <div className="table-header">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Procurar por nome ou categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="result-count">
            LISTANDO {filteredProdutos.length} PRODUTOS
          </div>
        </div>

        <table className="products-table">
          <thead>
            <tr>
              <th>PRODUTO</th>
              <th>CATEGORIA</th>
              <th>UNIDADE</th>
              <th>QUANTIDADE</th>
              <th>PREÇO REF.</th>
              <th>STATUS</th>
              <th className="text-right">AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            {filteredProdutos.map((produto) => (
              <tr key={produto.id}>
                <td>
                  <div className="product-info">
                    {produto.imagemUrl ? (
                      <img src={produto.imagemUrl} alt={produto.nome} className="product-image" />
                    ) : (
                      <div className="product-icon">
                        <Package size={18} />
                      </div>
                    )}
                    <div className="product-name">{produto.nome}</div>
                  </div>
                </td>
                <td className="category-cell">
                  {produto.categoria}
                </td>
                <td className="unit-cell">
                  {produto.unidade}
                </td>
                <td className="quantity-cell">
                  {(produto.quantidade || 0).toLocaleString('pt-AO')}
                </td>
                <td className="price-cell">
                  {(produto.precoReferencia || 0).toLocaleString('pt-AO')} Kz
                </td>
                <td>
                  <span className={`status-badge ${(produto.status || 'Ativo').toLowerCase()}`}>
                    {(produto.status || 'Ativo') === 'Ativo' ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                    {(produto.status || 'Ativo').toUpperCase()}
                  </span>
                </td>
                <td className="actions-cell">
                  <div className="action-buttons">
                    <button
                      onClick={() => handleOpenModal(produto)}
                      className="action-btn edit"
                      title="Editar"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(produto.id)}
                      className="action-btn delete"
                      title="Excluir"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Enhanced Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button onClick={handleCloseModal} className="close-btn">
              <X size={20} />
            </button>

            <div className="modal-header">
              <h2>{editingProduto ? 'EDITAR PRODUTO' : 'NOVO PRODUTO'}</h2>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>NOME DO PRODUTO</label>
                <input
                  required
                  type="text"
                  placeholder="Ex: Milho"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>CATEGORIA</label>
                <select
                  required
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                >
                  <option value="">Selecione...</option>
                  {categorias.map((cat) => (
                    <option key={cat.id} value={cat.nome}>{cat.nome}</option>
                  ))}
                  {/* Fallback for existing categories not in list */}
                  {formData.categoria && !categorias.find(c => c.nome === formData.categoria) && (
                    <option value={formData.categoria}>{formData.categoria}</option>
                  )}
                </select>
              </div>

              <div className="form-group">
                <label>IMAGEM DO PRODUTO</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setFormData({ ...formData, imagemUrl: reader.result as string });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="file-input"
                />
                {formData.imagemUrl && (
                  <div className="image-preview">
                    <img src={formData.imagemUrl} alt="Preview" />
                  </div>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>UNIDADE</label>
                  <select
                    value={formData.unidade}
                    onChange={(e) => setFormData({ ...formData, unidade: e.target.value })}
                  >
                    <option value="kg">kg</option>
                    <option value="ton">ton</option>
                    <option value="saco">saco</option>
                    <option value="unidade">unidade</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>QUANTIDADE</label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={formData.quantidade || ''}
                    onChange={(e) => setFormData({ ...formData, quantidade: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>PREÇO REF. (Kz)</label>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.precoReferencia || ''}
                  onChange={(e) => setFormData({ ...formData, precoReferencia: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="form-group">
                <label>STATUS DO PRODUTO</label>
                <div className="status-buttons">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: 'Ativo' })}
                    className={formData.status === 'Ativo' ? 'active' : ''}
                  >
                    ATIVO
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: 'Inativo' })}
                    className={formData.status === 'Inativo' ? 'inactive' : ''}
                  >
                    INATIVO
                  </button>
                </div>
              </div>

              <button type="submit" className="submit-btn" disabled={submitting}>
                {submitting ? 'A GUARDAR...' : (editingProduto ? 'SALVAR ALTERAÇÕES' : 'CRIAR PRODUTO')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {
        deleteId && (
          <div className="modal-overlay" onClick={() => !submitting && setDeleteId(null)}>
            <div className="modal-card delete-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>EXCLUIR PRODUTO</h2>
                <p style={{ marginTop: '10px', color: '#6b7280', fontSize: '14px' }}>
                  Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.
                </p>
              </div>

              <div className="modal-actions">
                <button
                  className="cancel-btn"
                  onClick={() => setDeleteId(null)}
                  disabled={submitting}
                >
                  CANCELAR
                </button>
                <button
                  className="delete-confirm-btn"
                  onClick={confirmDelete}
                  disabled={submitting}
                >
                  {submitting ? 'A EXCLUIR...' : 'SIM, EXCLUIR'}
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Category Modal */}
      {isCategoryModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCategoryModalOpen(false)}>
          <div className="modal-card category-modal" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setIsCategoryModalOpen(false)} className="close-btn">
              <X size={20} />
            </button>

            <div className="modal-header">
              <h2>CATEGORIAS</h2>
            </div>

            <div className="category-manager">
              <form onSubmit={handleCreateCategory} className="add-category-form">
                <input
                  type="text"
                  placeholder="Nova categoria..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                />
                <button type="submit"><Plus size={20} /></button>
              </form>

              <div className="category-list">
                {categorias.map(cat => (
                  <div key={cat.id} className="category-item">
                    <span>{cat.nome}</span>
                    <button onClick={() => handleDeleteCategory(cat.id)} className="delete-cat-btn">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

    </StyledPageWrapper>
  );
};

const StyledPageWrapper = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 40px;
    flex-wrap: wrap;
    gap: 20px;
  }

  .header-content h1 {
    font-size: 32px;
    font-weight: 900;
    letter-spacing: 3px;
    color: #1a044e;
    margin: 0 0 8px 0;
  }

  .header-content p {
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.5px;
    color: #6b7280;
    margin: 0;
  }

  .add-btn {
    display: flex;
    align-items: center;
    gap: 10px;
    background: linear-gradient(135deg, #0f0092 0%, #1a044e 100%);
    color: white;
    border: none;
    padding: 14px 28px;
    border-radius: 30px;
    border-bottom-right-radius: 0;
    border-top-right-radius: 0;
    font-weight: 900;
    font-size: 12px;
    letter-spacing: 2px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: -5px 6px 20px 0px rgba(26, 26, 26, 0.3);
  }

  .category-btn {
    display: flex;
    align-items: center;
    gap: 10px;
    background: white;
    color: #1a044e;
    border: 2px solid #e5e7eb;
    padding: 12px 24px;
    border-radius: 12px;
    font-weight: 800;
    font-size: 11px;
    letter-spacing: 1px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .category-btn:hover {
    border-color: #1a044e;
    background: #f9fafb;
  }

  .add-btn:hover {
    background: linear-gradient(135deg, #07013d 0%, #0a0020 100%);
    box-shadow: -5px 6px 25px 0px rgba(88, 88, 88, 0.5);
    transform: translateY(-2px);
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 24px;
    margin-bottom: 40px;
  }

  .stat-card {
    background: white;
    padding: 28px;
    border-radius: 16px;
    box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.08);
    display: flex;
    flex-direction: column;
    gap: 8px;
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
  .stat-card.red::before { background: linear-gradient(90deg, #ef4444, #dc2626); }

  .stat-label {
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 2px;
    color: #9ca3af;
  }

  .stat-value {
    font-size: 42px;
    font-weight: 900;
    letter-spacing: -2px;
    color: #1f2937;
  }

  .table-container {
    background: white;
    border-radius: 20px;
    box-shadow: 0px 4px 30px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  .table-header {
    padding: 24px 32px;
    border-bottom: 2px solid #f3f4f6;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
    flex-wrap: wrap;
  }

  .search-box {
    display: flex;
    align-items: center;
    gap: 12px;
    background: #f9fafb;
    padding: 12px 20px;
    border-radius: 12px;
    flex: 1;
    min-width: 300px;
    max-width: 500px;
    border: 2px solid transparent;
    transition: all 0.2s ease;
  }

  .search-box:focus-within {
    border-color: #0f0092;
    background: white;
  }

  .search-box svg {
    color: #9ca3af;
  }

  .search-box input {
    border: none;
    background: transparent;
    outline: none;
    flex: 1;
    font-size: 14px;
    font-weight: 600;
    color: #1f2937;
  }

  .search-box input::placeholder {
    color: #d1d5db;
  }

  .result-count {
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 2px;
    color: #9ca3af;
  }

  .products-table {
    width: 100%;
    border-collapse: collapse;
  }

  .products-table thead tr {
    background: #f9fafb;
  }

  .products-table th {
    padding: 18px 32px;
    text-align: left;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 2px;
    color: #6b7280;
  }

  .products-table th.text-right {
    text-align: right;
  }

  .products-table tbody tr {
    border-bottom: 1px solid #f3f4f6;
    transition: all 0.2s ease;
  }

  .products-table tbody tr:hover {
    background: #f9fafb;
  }

  .products-table td {
    padding: 20px 32px;
  }

  .product-info {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .product-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: linear-gradient(135deg, #0f0092 0%, #1a044e 100%);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .product-image {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    object-fit: cover;
    border: 2px solid #e5e7eb;
  }

  .product-name {
    font-weight: 700;
    font-size: 15px;
    color: #1f2937;
    letter-spacing: 0.3px;
  }

  .category-cell,
  .unit-cell,
  .quantity-cell {
    font-size: 14px;
    font-weight: 600;
    color: #6b7280;
    letter-spacing: 0.3px;
  }

  .price-cell {
    font-size: 15px;
    font-weight: 700;
    color: #059669;
    letter-spacing: 0.3px;
  }

  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: 20px;
    font-size: 10px;
    font-weight: 900;
    letter-spacing: 1.5px;
  }

  .status-badge.ativo {
    background: #d1fae5;
    color: #065f46;
  }

  .status-badge.inativo {
    background: #fee2e2;
    color: #991b1b;
  }

  .actions-cell {
    text-align: right;
  }

  .action-buttons {
    display: inline-flex;
    gap: 8px;
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .products-table tbody tr:hover .action-buttons {
    opacity: 1;
  }

  .action-btn {
    padding: 8px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .action-btn.edit {
    background: #dbeafe;
    color: #1e40af;
  }

  .action-btn.edit:hover {
    background: #bfdbfe;
  }

  .action-btn.delete {
    background: #fee2e2;
    color: #991b1b;
  }

  .action-btn.delete:hover {
    background: #fecaca;
  }

  /* Modal Styles */
  .modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 50;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    animation: fadeIn 0.2s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .modal-card {
    position: relative;
    width: 480px;
    max-width: 95vw;
    background: #FFFFFF;
    border-radius: 20px;
    padding: 40px 35px;
    box-shadow: 0px 10px 60px 10px rgba(0, 0, 0, 0.3);
    animation: slideUp 0.3s ease-out;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .modal-card:after {
    position: absolute;
    content: "";
    right: -12px;
    bottom: 30px;
    width: 0;
    height: 0;
    border-left: 0px solid transparent;
    border-right: 12px solid transparent;
    border-bottom: 12px solid #1a044e;
  }

  .modal-card.delete-modal {
    width: 400px;
    padding: 30px;
  }

  .modal-card.delete-modal::after {
    display: none;
  }

  .modal-actions {
    display: flex;
    gap: 12px;
    margin-top: 20px;
  }

  .cancel-btn {
    flex: 1;
    padding: 14px;
    border: 2px solid #e5e7eb;
    background: transparent;
    border-radius: 12px;
    font-weight: 800;
    font-size: 11px;
    letter-spacing: 1px;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .cancel-btn:hover {
    background: #f9fafb;
    color: #374151;
  }

  .delete-confirm-btn {
    flex: 1;
    padding: 14px;
    border: none;
    background: #fee2e2;
    color: #991b1b;
    border-radius: 12px;
    font-weight: 800;
    font-size: 11px;
    letter-spacing: 1px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .delete-confirm-btn:hover {
    background: #fecaca;
  }

  .delete-confirm-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .close-btn {
    position: absolute;
    top: 15px;
    right: 15px;
    background: #f3f4f6;
    border: none;
    border-radius: 50%;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    color: #6b7280;
  }

  .close-btn:hover {
    background: #e5e7eb;
    color: #374151;
  }

  .modal-header {
    text-align: center;
    margin-bottom: 30px;
  }

  .modal-header h2 {
    font-size: 22px;
    font-weight: 900;
    letter-spacing: 5px;
    color: #1a044e;
    margin: 0;
  }

  .modal-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
    overflow-y: auto;
    padding-right: 5px;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .form-group label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 2px;
    color: #6b7280;
  }

  .form-group input,
  .form-group select {
    border: none;
    border-bottom: 2px solid #e5e7eb;
    padding: 12px 8px;
    background: transparent;
    transition: all 0.25s ease;
    font-size: 15px;
    color: #1f2937;
    font-weight: 500;
  }

  .form-group select {
    cursor: pointer;
  }

  .form-group input:focus,
  .form-group select:focus {
    outline: none;
    border-bottom: 2px solid #0f0092;
  }

  .form-group input::placeholder {
    color: #d1d5db;
  }

  .image-preview {
    margin-top: 12px;
    border-radius: 12px;
    overflow: hidden;
    border: 2px solid #e5e7eb;
    max-width: 200px;
  }

  .image-preview img {
    width: 100%;
    height: auto;
    display: block;
  }

  .file-input {
    border: none;
    border-bottom: 2px solid #e5e7eb;
    padding: 12px 8px;
    background: transparent;
    transition: all 0.25s ease;
    font-size: 14px;
    color: #1f2937;
    font-weight: 500;
    cursor: pointer;
  }

  .file-input:focus {
    outline: none;
    border-bottom: 2px solid #0f0092;
  }

  .file-input::file-selector-button {
    background: linear-gradient(135deg, #0f0092 0%, #1a044e 100%);
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 8px;
    font-weight: 700;
    font-size: 11px;
    letter-spacing: 1px;
    cursor: pointer;
    margin-right: 12px;
    transition: all 0.2s ease;
  }

  .file-input::file-selector-button:hover {
    background: linear-gradient(135deg, #07013d 0%, #0a0020 100%);
    transform: translateY(-1px);
  }

  .status-buttons {
    display: flex;
    gap: 12px;
  }

  .status-buttons button {
    flex: 1;
    padding: 12px;
    border: 2px solid #e5e7eb;
    background: #f9fafb;
    border-radius: 12px;
    font-weight: 700;
    font-size: 11px;
    letter-spacing: 1.5px;
    cursor: pointer;
    transition: all 0.2s ease;
    color: #9ca3af;
  }

  .status-buttons button:hover {
    border-color: #d1d5db;
  }

  .status-buttons button.active {
    background: #d1fae5;
    border-color: #10b981;
    color: #065f46;
  }

  .status-buttons button.inactive {
    background: #fee2e2;
    border-color: #ef4444;
    color: #991b1b;
  }

  .submit-btn {
    margin-top: 10px;
    border-radius: 30px;
    border-bottom-right-radius: 0;
    border-top-right-radius: 0;
    background: linear-gradient(135deg, #0f0092 0%, #1a044e 100%);
    color: #FFFFFF;
    padding: 16px 30px;
    font-size: 13px;
    font-weight: 900;
    letter-spacing: 4px;
    border: none;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: -5px 6px 20px 0px rgba(26, 26, 26, 0.4);
    align-self: flex-end;
  }

  .submit-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .submit-btn:hover {
    background: linear-gradient(135deg, #07013d 0%, #0a0020 100%);
    box-shadow: -5px 6px 25px 0px rgba(88, 88, 88, 0.6);
    transform: translateY(-2px);
  }

  .submit-btn:active {
    transform: translateY(0);
  }

  @media (max-width: 1024px) {
    .page-header {
      gap: 16px;
    }

    .products-table th,
    .products-table td {
      padding: 16px 20px;
    }
  }

  @media (max-width: 768px) {
    .page-header {
      flex-direction: column;
      align-items: stretch;
      margin-bottom: 24px;
    }

    .header-content h1 {
      font-size: 24px;
      letter-spacing: 2px;
    }

    .add-btn {
      width: 100%;
      justify-content: center;
    }

    .stats-grid {
      grid-template-columns: 1fr;
      gap: 16px;
      margin-bottom: 24px;
    }

    .table-header {
      flex-direction: column;
      align-items: stretch;
      gap: 12px;
      padding: 20px;
    }

    .search-box {
      max-width: 100%;
      min-width: 100%;
    }

    .result-count {
      text-align: center;
    }

    .products-table {
      font-size: 13px;
      display: block;
      overflow-x: auto;
    }

    .products-table thead {
      display: none;
    }

    .products-table tbody {
      display: block;
    }

    .products-table tr {
      display: block;
      margin-bottom: 16px;
      border: 1px solid #f3f4f6;
      border-radius: 12px;
      padding: 16px;
    }

    .products-table td {
      display: block;
      padding: 8px 0;
      border-bottom: none;
    }

    .products-table td:before {
      content: attr(data-label);
      font-weight: 700;
      font-size: 11px;
      letter-spacing: 1px;
      color: #9ca3af;
      display: block;
      margin-bottom: 4px;
    }

    .action-buttons {
      opacity: 1;
      justify-content: flex-start;
      margin-top: 12px;
    }

    .modal-card {
      width: 100%;
      max-width: 100%;
      border-radius: 20px 20px 0 0;
      margin: auto 0 0 0;
    }

    .form-row {
      grid-template-columns: 1fr;
    }

    .image-preview {
      max-width: 100%;
    }
  }

  /* Category Modal Styles */
  .category-modal {
    width: 400px;
    min-height: 400px;
  }

  .category-manager {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .add-category-form {
    display: flex;
    gap: 10px;
  }

  .add-category-form input {
    flex: 1;
    padding: 12px;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    outline: none;
    font-size: 14px;
    color: #1f2937;
  }

  .add-category-form input:focus {
    border-color: #0f0092;
  }

  .add-category-form button {
    background: #0f0092;
    color: white;
    border: none;
    width: 48px;
    border-radius: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .add-category-form button:hover {
    background: #1a044e;
  }

  .category-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-height: 300px;
    overflow-y: auto;
    padding-right: 5px;
  }

  .category-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: #f9fafb;
    border-radius: 10px;
    font-weight: 600;
    font-size: 14px;
    color: #374151;
    border: 1px solid transparent;
    transition: all 0.2s ease;
  }

  .category-item:hover {
    border-color: #e5e7eb;
    background: white;
    box-shadow: 0 2px 5px rgba(0,0,0,0.05);
  }

  .delete-cat-btn {
    color: #ef4444;
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    border-radius: 6px;
    transition: all 0.2s ease;
  }

  .delete-cat-btn:hover {
    background: #fee2e2;
    color: #dc2626;
  }

  @media (max-width: 480px) {
    .header-content h1 {
      font-size: 20px;
      letter-spacing: 1px;
    }

    .stat-card {
      padding: 20px;
    }

    .product-icon,
    .product-image {
      width: 36px;
      height: 36px;
    }

    .modal-card {
      padding: 30px 20px;
    }
  }
`;

export default AdminProdutosPage;
