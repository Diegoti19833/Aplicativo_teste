import React, { useState, useEffect, useMemo } from 'react';
import {
  Award, Search, Trash2, Download, Check, X, Calendar,
  User, RefreshCw, XCircle, Eye, Shield, ShieldOff,
  FileText, Hash
} from 'lucide-react';
import { AdminDb } from '../../services/adminDb';

export default function AdminCertificados() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, valid, revoked
  const [revoking, setRevoking] = useState(null);

  // ─── Carregar certificados ───
  const loadCertificates = async () => {
    setLoading(true);
    try {
      const data = await AdminDb.certificates.list();
      setCertificates(data);
    } catch (e) {
      console.error('Erro ao carregar certificados:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCertificates(); }, []);

  // ─── Filtrar ───
  const filtered = useMemo(() => {
    return certificates.filter(cert => {
      const matchesSearch =
        (cert.user?.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (cert.user?.email || '').toLowerCase().includes(search.toLowerCase()) ||
        (cert.trail?.title || '').toLowerCase().includes(search.toLowerCase()) ||
        (cert.certificate_code || '').toLowerCase().includes(search.toLowerCase());

      if (filterStatus === 'valid') return matchesSearch && cert.is_valid;
      if (filterStatus === 'revoked') return matchesSearch && !cert.is_valid;
      return matchesSearch;
    });
  }, [certificates, search, filterStatus]);

  // ─── Revogar certificado ───
  const handleRevoke = async (certId) => {
    if (!window.confirm('Tem certeza que deseja revogar este certificado? Esta ação não pode ser desfeita.')) return;
    setRevoking(certId);
    try {
      await AdminDb.certificates.revoke(certId);
      setCertificates(prev => prev.map(c =>
        c.id === certId ? { ...c, is_valid: false, revoked_at: new Date().toISOString() } : c
      ));
    } catch (e) {
      alert('Erro ao revogar: ' + (e?.message || ''));
    } finally {
      setRevoking(null);
    }
  };

  // ─── Exportar CSV ───
  const exportCSV = () => {
    const headers = ['Código', 'Usuário', 'Email', 'Trilha', 'Data Emissão', 'Status'];
    const rows = filtered.map(c => [
      c.certificate_code?.slice(0, 8) || '',
      `"${c.user?.name || ''}"`,
      c.user?.email || '',
      `"${c.trail?.title || ''}"`,
      new Date(c.issued_at).toLocaleDateString('pt-BR'),
      c.is_valid ? 'Válido' : 'Revogado'
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `certificados_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ─── Estatísticas ───
  const stats = useMemo(() => ({
    total: certificates.length,
    valid: certificates.filter(c => c.is_valid).length,
    revoked: certificates.filter(c => !c.is_valid).length,
    thisMonth: certificates.filter(c => {
      const d = new Date(c.issued_at);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length,
  }), [certificates]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Award className="text-amber-500" size={28} />
            Certificados
          </h1>
          <p className="text-gray-500 mt-1">Gerencie certificados de conclusão de trilhas.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadCertificates}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Atualizar
          </button>
          <button
            onClick={exportCSV}
            disabled={filtered.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors shadow-sm disabled:opacity-50"
          >
            <Download size={18} />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Emitidos', value: stats.total, icon: <Award size={20} />, color: 'bg-amber-50 text-amber-600' },
          { label: 'Válidos', value: stats.valid, icon: <Shield size={20} />, color: 'bg-green-50 text-green-600' },
          { label: 'Revogados', value: stats.revoked, icon: <ShieldOff size={20} />, color: 'bg-red-50 text-red-600' },
          { label: 'Este Mês', value: stats.thisMonth, icon: <Calendar size={20} />, color: 'bg-blue-50 text-blue-600' },
        ].map((s, i) => (
          <div key={i} className="glass-panel p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-xl ${s.color}`}>{s.icon}</div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 font-medium uppercase mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex gap-2 w-full md:w-auto">
          {[
            { key: 'all', label: 'Todos' },
            { key: 'valid', label: 'Válidos' },
            { key: 'revoked', label: 'Revogados' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilterStatus(tab.key)}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === tab.key ? 'bg-amber-100 text-amber-700' : 'text-gray-600 hover:bg-gray-50'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-96">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, email, trilha ou código..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-sm animate-pulse">
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
          <Award size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Nenhum certificado encontrado</h3>
          <p className="text-gray-500 mt-1">Certificados são emitidos automaticamente quando usuários completam trilhas.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Código</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Usuário</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Trilha</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Emissão</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(cert => (
                <tr key={cert.id} className={`hover:bg-gray-50 transition-colors ${!cert.is_valid ? 'opacity-60' : ''}`}>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1.5 text-sm font-mono text-gray-500">
                      <Hash size={14} className="text-gray-400" />
                      {cert.certificate_code?.slice(0, 8).toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-xs font-bold">
                        {(cert.user?.name || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{cert.user?.name || 'Desconhecido'}</p>
                        <p className="text-xs text-gray-500">{cert.user?.email || ''}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-700 font-medium">{cert.trail?.title || 'Trilha removida'}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(cert.issued_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {cert.is_valid ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                        <Shield size={12} /> Válido
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                        <ShieldOff size={12} /> Revogado
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {cert.is_valid && (
                      <button
                        onClick={() => handleRevoke(cert.id)}
                        disabled={revoking === cert.id}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors disabled:opacity-50"
                        title="Revogar certificado"
                      >
                        <XCircle size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer count */}
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
            Mostrando {filtered.length} de {certificates.length} certificados
          </div>
        </div>
      )}
    </div>
  );
}
