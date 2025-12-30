'use client';

import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  Search,
  Edit2,
  Trash2,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import styled from 'styled-components';

interface Agente {
  id: string;
  nome: string;
  email: string;
  status: 'Ativo' | 'Inativo';
  role?: string;
  dataCriacao: string;
}

const AdminAgentesPage = () => {
  const [agentes, setAgentes] = useState<Agente[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchAgents = async () => {
    try {
      const res = await fetch('/api/agents');
      const data = await res.json();
      if (data.success) {
        setAgentes(data.data);
      } else {
        setError('Erro ao carregar agentes');
      }
    } catch (err) {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgente, setEditingAgente] = useState<Agente | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    password: '',
    status: 'Ativo' as 'Ativo' | 'Inativo',
    role: 'Agente' as 'Admin' | 'Agente'
  });

  const filteredAgentes = agentes.filter(agente =>
    agente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agente.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (agente?: Agente) => {
    if (agente) {
      setEditingAgente(agente);
      setFormData({
        nome: agente.nome,
        email: agente.email,
        password: '',
        status: agente.status,
        role: (agente.role as 'Admin' | 'Agente') || 'Agente'
      });
    } else {
      setEditingAgente(null);
      setFormData({ nome: '', email: '', password: '', status: 'Ativo', role: 'Agente' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAgente(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setError('');
    setSubmitting(true);

    try {
      if (editingAgente) {
        const res = await fetch(`/api/agents/${editingAgente.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        const data = await res.json();

        if (data.success) {
          setAgentes(agentes.map(a => a.id === editingAgente.id ? data.data : a));
          handleCloseModal();
        } else {
          alert(data.error || 'Erro ao atualizar agente');
        }
      } else {
        const res = await fetch('/api/agents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        const data = await res.json();

        if (data.success) {
          setAgentes([data.data, ...agentes]);
          handleCloseModal();
        } else {
          alert(data.error || 'Erro ao criar agente');
        }
      }
    } catch (err) {
      alert('Erro ao conectar com o servidor');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/agents/${deleteId}`, { method: 'DELETE' });
      const data = await res.json();

      if (data.success) {
        setAgentes(agentes.filter(a => a.id !== deleteId));
        setDeleteId(null);
      } else {
        alert(data.error || 'Erro ao excluir agente');
      }
    } catch (err) {
      alert('Erro ao excluir agente');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <StyledPageWrapper>
      <div className="page-header">
        <div className="header-content">
          <h1>GESTÃO DE AGENTES</h1>
          <p>Controle total sobre a equipa comercial BMII</p>
        </div>
        <button onClick={() => handleOpenModal()} className="add-btn">
          <UserPlus size={20} />
          <span>ADICIONAR AGENTE</span>
        </button>
      </div>

      {/* Stats Bar */}
      <div className="stats-grid">
        <div className="stat-card blue">
          <span className="stat-label">TOTAL</span>
          <span className="stat-value">{agentes.length}</span>
        </div>
        <div className="stat-card green">
          <span className="stat-label">ATIVOS</span>
          <span className="stat-value">{agentes.filter(a => a.status === 'Ativo').length}</span>
        </div>
        <div className="stat-card red">
          <span className="stat-label">INATIVOS</span>
          <span className="stat-value">{agentes.filter(a => a.status === 'Inativo').length}</span>
        </div>
      </div>

      {/* Table Container */}
      <div className="table-container">
        <div className="table-header">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Procurar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="result-count">
            LISTANDO {filteredAgentes.length} AGENTES
          </div>
        </div>

        <table className="agents-table">
          <thead>
            <tr>
              <th>AGENTE</th>
              <th>CARGO</th>
              <th>STATUS</th>
              <th>REGISTADO EM</th>
              <th className="text-right">AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            {filteredAgentes.map((agente) => (
              <tr key={agente.id}>
                <td>
                  <div className="agent-info">
                    <div className="agent-avatar">
                      {agente.nome.charAt(0)}
                    </div>
                    <div className="agent-details">
                      <div className="agent-name">{agente.nome}</div>
                      <div className="agent-email">{agente.email}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`role-badge ${(agente.role || 'Agente').toLowerCase()}`}>
                    {agente.role || 'Agente'}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${agente.status.toLowerCase()}`}>
                    {agente.status === 'Ativo' ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                    {agente.status.toUpperCase()}
                  </span>
                </td>
                <td className="date-cell">
                  {agente.dataCriacao}
                </td>
                <td className="actions-cell">
                  <div className="action-buttons">
                    <button
                      onClick={() => handleOpenModal(agente)}
                      className="action-btn edit"
                      title="Editar"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(agente.id)}
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
              <h2>{editingAgente ? 'EDITAR AGENTE' : 'NOVO AGENTE'}</h2>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>NOME COMPLETO</label>
                <input
                  required
                  type="text"
                  placeholder="Ex: João Silva"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>EMAIL CORPORATIVO</label>
                <input
                  required
                  type="email"
                  placeholder="email@bmii.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>{editingAgente ? 'NOVA SENHA (OPCIONAL)' : 'SENHA'}</label>
                <input
                  required={!editingAgente}
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>CARGO</label>
                <div className="status-buttons">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'Agente' })}
                    className={formData.role === 'Agente' ? 'active' : ''}
                  >
                    AGENTE
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'Admin' })}
                    className={formData.role === 'Admin' ? 'active' : ''}
                  >
                    ADMIN
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>STATUS DA CONTA</label>
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
                {submitting ? 'A GUARDAR...' : (editingAgente ? 'SALVAR ALTERAÇÕES' : 'CRIAR AGENTE')}
              </button>
            </form>
          </div>
        </div>
      )}


      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => !submitting && setDeleteId(null)}>
          <div className="modal-card delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>EXCLUIR AGENTE</h2>
              <p style={{ marginTop: '10px', color: '#6b7280', fontSize: '14px' }}>
                Tem certeza que deseja excluir este agente? Esta ação não pode ser desfeita.
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

  .agents-table {
    width: 100%;
    border-collapse: collapse;
  }

  .agents-table thead tr {
    background: #f9fafb;
  }

  .agents-table th {
    padding: 18px 32px;
    text-align: left;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 2px;
    color: #6b7280;
  }

  .agents-table th.text-right {
    text-align: right;
  }

  .agents-table tbody tr {
    border-bottom: 1px solid #f3f4f6;
    transition: all 0.2s ease;
  }

  .agents-table tbody tr:hover {
    background: #f9fafb;
  }

  .agents-table td {
    padding: 20px 32px;
  }

  .agent-info {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .agent-avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: linear-gradient(135deg, #0f0092 0%, #1a044e 100%);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 900;
    font-size: 16px;
    letter-spacing: 1px;
  }

  .agent-details {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .agent-name {
    font-weight: 700;
    font-size: 15px;
    color: #1f2937;
    letter-spacing: 0.3px;
  }

  .agent-email {
    font-size: 13px;
    font-weight: 600;
    color: #9ca3af;
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

  .role-badge {
    display: inline-flex;
    align-items: center;
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.5px;
  }

  .role-badge.admin {
    background: #e0e7ff;
    color: #3730a3;
    border: 1px solid #c7d2fe;
  }

  .role-badge.agente {
    background: #f3f4f6;
    color: #4b5563;
    border: 1px solid #e5e7eb;
  }

  .date-cell {
    font-size: 14px;
    font-weight: 600;
    color: #6b7280;
    letter-spacing: 0.3px;
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

  .agents-table tbody tr:hover .action-buttons {
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
    width: 420px;
    max-width: 95vw;
    background: #FFFFFF;
    border-radius: 20px;
    padding: 40px 35px;
    box-shadow: 0px 10px 60px 10px rgba(0, 0, 0, 0.3);
    animation: slideUp 0.3s ease-out;
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

  .form-group input {
    border: none;
    border-bottom: 2px solid #e5e7eb;
    padding: 12px 8px;
    background: transparent;
    transition: all 0.25s ease;
    font-size: 15px;
    color: #1f2937;
    font-weight: 500;
  }

  .form-group input:focus {
    outline: none;
    border-bottom: 2px solid #0f0092;
  }

  .form-group input::placeholder {
    color: #d1d5db;
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

  .submit-btn:hover {
    background: linear-gradient(135deg, #07013d 0%, #0a0020 100%);
    box-shadow: -5px 6px 25px 0px rgba(88, 88, 88, 0.6);
    transform: translateY(-2px);
  }

  .submit-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .submit-btn:active {
    transform: translateY(0);
  }

  @media (max-width: 1024px) {
    .page-header {
      gap: 16px;
    }

    .agents-table th,
    .agents-table td {
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

    .agents-table {
      font-size: 13px;
      display: block;
      overflow-x: auto;
    }

    .agents-table thead {
      display: none;
    }

    .agents-table tbody {
      display: block;
    }

    .agents-table tr {
      display: block;
      margin-bottom: 16px;
      border: 1px solid #f3f4f6;
      border-radius: 12px;
      padding: 16px;
    }

    .agents-table td {
      display: block;
      padding: 8px 0;
      border-bottom: none;
    }

    .agents-table td:before {
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
  }

  @media (max-width: 480px) {
    .header-content h1 {
      font-size: 20px;
      letter-spacing: 1px;
    }

    .stat-card {
      padding: 20px;
    }

    .agent-avatar {
      width: 36px;
      height: 36px;
      font-size: 14px;
    }

    .modal-card {
      padding: 30px 20px;
    }
  }
`;

export default AdminAgentesPage;
