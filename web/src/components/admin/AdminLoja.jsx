import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Gift, Plus, Edit3, Trash2, Package, ToggleLeft, ToggleRight, AlertTriangle, TrendingUp, Star, Search, Filter, Award, ShoppingBag, X, ImagePlus, Upload, Trash, ClipboardList, ChevronDown, MessageSquare, CheckCircle2, Clock, Truck, XCircle } from 'lucide-react';
import { AdminDb } from '../../services/adminDb';
import { useToast } from './ToastContext';

export default function AdminLoja() {
  const toast = useToast();

  function ShopStatsCard({ title, value, icon, color }) {
    const gradients = {
      blue: 'from-blue-500 to-indigo-600',
      green: 'from-emerald-500 to-teal-600',
      purple: 'from-violet-500 to-purple-600',
      orange: 'from-orange-400 to-pink-500',
    };
    return (
      <div className="glass-panel p-5 flex items-center justify-between relative overflow-hidden group hover:scale-[1.02] transition-transform">
        <div className={`absolute right-0 top-0 p-3 opacity-10`}>{React.cloneElement(icon, { size: 64 })}</div>
        <div>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl bg-gradient-to-br ${gradients[color] || gradients.blue} text-white shadow-lg shadow-blue-500/20`}>
          {React.cloneElement(icon, { size: 20 })}
        </div>
      </div>
    );
  }
  const [items, setItems] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeView, setActiveView] = useState('items'); // items, purchases
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState({ name: '', description: '', icon: '🎁', image_url: '', itemType: 'fisico', price: 50, rarity: 'padrao', stockQuantity: '', purchaseLimit: 1 });
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [statusFilter, setStatusFilter] = useState('todos');
  const [editingNotes, setEditingNotes] = useState(null);
  const [notesText, setNotesText] = useState('');

  useEffect(() => { loadData(); }, []);

  const MOCK_ITEMS = [
    { id: '1', name: 'Caneca PetClass', description: 'Caneca exclusiva da plataforma', icon: '☕', image_url: '', item_type: 'fisico', price: 150, rarity: 'raro', stock_quantity: 20, is_active: true, purchase_count: 45 },
    { id: '2', name: 'Dia de Folga', description: 'Um dia de folga remunerado', icon: '🏖️', image_url: '', item_type: 'beneficio', price: 500, rarity: 'epico', stock_quantity: 5, is_active: true, purchase_count: 12 },
    { id: '3', name: 'Vale Presente R$50', description: 'Vale presente para usar na loja parceira', icon: '🎁', image_url: '', item_type: 'voucher', price: 300, rarity: 'padrao', stock_quantity: 10, is_active: true, purchase_count: 28 },
    { id: '4', name: 'Camiseta GamePop', description: 'Camiseta oficial da empresa', icon: '👕', image_url: '', item_type: 'fisico', price: 200, rarity: 'padrao', stock_quantity: 15, is_active: true, purchase_count: 33 },
  ];

  const loadData = async () => {
    try {
      setLoading(true);
      const [itemsData, purchasesData] = await Promise.all([
        AdminDb.storeItems.list().catch(() => []),
        AdminDb.purchases.list().catch(() => [])
      ]);
      setItems(itemsData && itemsData.length > 0 ? itemsData : MOCK_ITEMS);
      setPurchases(purchasesData);
    } catch (e) {
      console.error('Erro:', e);
      setItems(MOCK_ITEMS);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const totalRevenue = purchases.reduce((acc, p) => acc + (p.total_price || 0), 0);
    const totalSales = purchases.length;
    const lowStockItems = items.filter(i => i.stock_quantity !== null && i.stock_quantity < 10);
    const itemSales = {};
    purchases.forEach(p => {
      const itemId = p.item_id || (p.item && p.item.id);
      if (itemId) itemSales[itemId] = (itemSales[itemId] || 0) + (p.quantity || 1);
    });
    const topItems = Object.entries(itemSales)
      .map(([id, count]) => {
        const item = items.find(i => i.id === id) || { name: 'Item Desconhecido' };
        return { name: item.name, count, id };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    return { totalRevenue, totalSales, lowStockItems, topItems };
  }, [items, purchases]);

  const filteredItems = items.filter(i =>
    (i.name && i.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (i.description && i.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleImageFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.warning('Selecione um arquivo de imagem (PNG, JPG, etc.)');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.warning('Imagem muito grande. Máximo: 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setForm(f => ({ ...f, image_url: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) handleImageFile(file);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await AdminDb.storeItems.create({
        name: form.name,
        description: form.description,
        icon: form.icon || '🎁',
        image_url: form.image_url || null,
        itemType: form.itemType,
        price: parseInt(form.price),
        rarity: form.rarity,
        stockQuantity: form.stockQuantity ? parseInt(form.stockQuantity) : null,
        purchaseLimit: parseInt(form.purchaseLimit) || 1,
      });
      setShowForm(false);
      resetForm();
      loadData();
      toast.success('Prêmio criado com sucesso!');
    } catch (e) {
      toast.error('Erro ao criar item', e?.message);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await AdminDb.storeItems.update({
        id: form.id,
        name: form.name,
        description: form.description,
        icon: form.icon || '🎁',
        image_url: form.image_url || null,
        price: parseInt(form.price),
        stockQuantity: form.stockQuantity ? parseInt(form.stockQuantity) : null,
        isAvailable: form.isAvailable,
        rarity: form.rarity
      });
      setShowForm(false);
      resetForm();
      loadData();
      toast.success('Prêmio atualizado!');
    } catch (e) {
      toast.error('Erro ao atualizar item', e?.message);
    }
  };

  const resetForm = () => setForm({ name: '', description: '', icon: '🎁', image_url: '', itemType: 'fisico', price: 50, rarity: 'padrao', stockQuantity: '', purchaseLimit: 1 });

  const toggleAvailable = async (item) => {
    try {
      await AdminDb.storeItems.setAvailable({ id: item.id, isAvailable: !item.is_available });
      loadData();
    } catch (e) {
      toast.error('Erro ao alterar status', e?.message);
    }
  };

  const removeItem = async (item) => {
    if (!confirm(`Remover "${item.name || item.title}" permanentemente?`)) return;
    try {
      await AdminDb.storeItems.remove({ id: item.id });
      loadData();
      toast.success('Prêmio removido!');
    } catch (e) {
      toast.error('Erro ao remover', e?.message);
    }
  };

  const openEdit = (item) => {
    setForm({
      id: item.id,
      name: item.name || item.title,
      description: item.description,
      icon: item.icon,
      image_url: item.image_url || '',
      itemType: item.item_type,
      price: item.price,
      rarity: item.rarity,
      stockQuantity: item.stock_quantity,
      purchaseLimit: item.purchase_limit,
      isAvailable: item.is_available
    });
    setShowForm(true);
  };

  // Helper to render item image or fallback emoji
  const ItemImage = ({ item, size = 'md' }) => {
    const sizeClasses = size === 'sm' ? 'w-10 h-10' : 'w-16 h-16';
    const imgUrl = item.image_url || '';
    const isDataUrl = imgUrl.startsWith('data:image');
    const isUrl = imgUrl.startsWith('http') || imgUrl.startsWith('/');

    if (isDataUrl || isUrl) {
      return (
        <div className={`${sizeClasses} rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 shadow-inner flex-shrink-0`}>
          <img src={imgUrl} alt={item.name} className="w-full h-full object-cover" />
        </div>
      );
    }
    return (
      <div className={`${sizeClasses} rounded-2xl bg-gray-50 flex items-center justify-center ${size === 'sm' ? 'text-xl' : 'text-3xl'} shadow-inner border border-gray-100 flex-shrink-0`}>
        {item.icon || '🎁'}
      </div>
    );
  };

  const getCategoryColor = (rarity) => {
    const r = rarity?.toLowerCase();
    if (r === 'lendario') return 'bg-purple-50 text-purple-700 border-purple-100 ring-purple-500/20';
    if (r === 'epico') return 'bg-blue-50 text-blue-700 border-blue-100 ring-blue-500/20';
    if (r === 'raro') return 'bg-amber-50 text-amber-700 border-amber-100 ring-amber-500/20';
    return 'bg-gray-50 text-gray-600 border-gray-100 ring-gray-500/20';
  };

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
    </div>
  );

  return (
    <div className="p-8 space-y-6 animate-fade-in relative z-10">
      {/* Mini Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ShopStatsCard title="Receita Total" value={`${stats.totalRevenue} moedas`} icon={<TrendingUp />} color="green" />
        <ShopStatsCard title="Vendas Totais" value={stats.totalSales} icon={<ShoppingBag />} color="blue" />
        <ShopStatsCard title="Itens Baixo Estoque" value={stats.lowStockItems.length} icon={<AlertTriangle />} color="orange" />
        <ShopStatsCard title="Top Item" value={stats.topItems[0]?.name || '-'} icon={<Star />} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 glass-panel p-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Gift className="text-orange-600" /> Catálogo de Prêmios
            </h2>
            <div className="flex gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Buscar itens..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                />
              </div>
              {activeView === 'items' && (
                <button
                  onClick={() => {
                    resetForm();
                    setShowForm(true);
                  }}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2 font-medium shadow-lg shadow-orange-500/30"
                >
                  <Plus size={18} /> Novo Item
                </button>
              )}
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex gap-2 mb-6 border-b border-gray-100 pb-1">
            <button onClick={() => setActiveView('items')} className={`px-6 py-2 rounded-t-lg font-medium transition-all flex items-center gap-2 ${activeView === 'items' ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50/50' : 'text-gray-500 hover:text-gray-800'}`}><Gift size={16} /> Itens da Loja</button>
            <button onClick={() => setActiveView('purchases')} className={`px-6 py-2 rounded-t-lg font-medium transition-all flex items-center gap-2 ${activeView === 'purchases' ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50/50' : 'text-gray-500 hover:text-gray-800'}`}><ClipboardList size={16} /> Pedidos ({purchases.length})</button>
          </div>

          {activeView === 'items' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredItems.map(item => (
                <div key={item.id} className={`group relative bg-white rounded-2xl p-5 border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${!item.is_available ? 'border-gray-100 bg-gray-50/50 grayscale' : 'border-gray-200 shadow-sm'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-4">
                      <ItemImage item={item} />
                      <div>
                        <h4 className="font-bold text-gray-900 text-lg">{item.name || item.title}</h4>
                        <div className="flex gap-2 mt-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${getCategoryColor(item.rarity)}`}>
                            {item.rarity?.toUpperCase()}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-brand/10 text-brand border border-brand/20">
                            {item.price} PTS
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(item)} className="p-2 text-gray-400 hover:text-brand hover:bg-brand/10 rounded-lg transition-colors"><Edit3 size={16} /></button>
                      <button onClick={() => removeItem(item)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </div>

                  <p className="text-gray-500 text-sm mb-4 line-clamp-2 h-10">{item.description}</p>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      {item.stock_quantity !== null && (
                        <span className={`text-xs font-semibold ${item.stock_quantity < 10 ? 'text-red-500' : 'text-gray-500'}`}>
                          {item.stock_quantity} em estoque
                        </span>
                      )}
                    </div>
                    <button onClick={() => toggleAvailable(item)} className={`transition-colors ${item.is_available ? 'text-green-500' : 'text-gray-300'}`}>
                      {item.is_available ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div>
              {/* Status Filters */}
              <div className="flex gap-2 mb-4 flex-wrap">
                {['todos', 'pendente', 'aprovado', 'enviado', 'entregue', 'cancelado'].map(s => {
                  const statusConfig = {
                    todos: { label: 'Todos', icon: <ClipboardList size={14} />, color: 'gray' },
                    pendente: { label: 'Pendente', icon: <Clock size={14} />, color: 'yellow' },
                    aprovado: { label: 'Aprovado', icon: <CheckCircle2 size={14} />, color: 'green' },
                    enviado: { label: 'Enviado', icon: <Truck size={14} />, color: 'blue' },
                    entregue: { label: 'Entregue', icon: <CheckCircle2 size={14} />, color: 'emerald' },
                    cancelado: { label: 'Cancelado', icon: <XCircle size={14} />, color: 'red' },
                  };
                  const cfg = statusConfig[s];
                  const count = s === 'todos' ? purchases.length : purchases.filter(p => (p.status || 'pendente') === s).length;
                  const active = statusFilter === s;
                  return (
                    <button key={s} onClick={() => setStatusFilter(s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all border ${active ? `bg-${cfg.color}-100 text-${cfg.color}-700 border-${cfg.color}-200` : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                        }`}
                      style={active ? {
                        backgroundColor: cfg.color === 'yellow' ? '#fef9c3' : cfg.color === 'green' ? '#dcfce7' : cfg.color === 'blue' ? '#dbeafe' : cfg.color === 'emerald' ? '#d1fae5' : cfg.color === 'red' ? '#fee2e2' : '#f3f4f6',
                        color: cfg.color === 'yellow' ? '#a16207' : cfg.color === 'green' ? '#15803d' : cfg.color === 'blue' ? '#1d4ed8' : cfg.color === 'emerald' ? '#047857' : cfg.color === 'red' ? '#b91c1c' : '#374151'
                      } : {}}
                    >
                      {cfg.icon} {cfg.label} ({count})
                    </button>
                  );
                })}
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50/50 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Item</th>
                      <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Usuário</th>
                      <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Valor</th>
                      <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Data</th>
                      <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Obs.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {purchases
                      .filter(p => statusFilter === 'todos' || (p.status || 'pendente') === statusFilter)
                      .map(p => {
                        const currentStatus = p.status || 'pendente';
                        const statusStyles = {
                          pendente: { bg: '#fef9c3', text: '#a16207', icon: <Clock size={12} /> },
                          aprovado: { bg: '#dcfce7', text: '#15803d', icon: <CheckCircle2 size={12} /> },
                          enviado: { bg: '#dbeafe', text: '#1d4ed8', icon: <Truck size={12} /> },
                          entregue: { bg: '#d1fae5', text: '#047857', icon: <CheckCircle2 size={12} /> },
                          cancelado: { bg: '#fee2e2', text: '#b91c1c', icon: <XCircle size={12} /> },
                        };
                        const st = statusStyles[currentStatus] || statusStyles.pendente;
                        return (
                          <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {p.item ? <ItemImage item={p.item} size="sm" /> : <span className="text-xl">🎁</span>}
                                <span className="font-semibold text-gray-900 text-sm">{p.item?.name || 'Item Removido'}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm font-medium text-gray-900">{p.user?.name || '-'}</div>
                              <div className="text-xs text-gray-400">{p.user?.email || ''}</div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-bold text-brand text-sm">{p.total_price || p.unit_price || 0} pts</span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {p.purchase_date ? new Date(p.purchase_date).toLocaleDateString('pt-BR') : '-'}
                            </td>
                            <td className="px-4 py-3">
                              <select
                                value={currentStatus}
                                onChange={async (e) => {
                                  try {
                                    await AdminDb.purchases.updateStatus({ id: p.id, status: e.target.value });
                                    loadData();
                                    toast.success(`Status atualizado para ${e.target.value}`);
                                  } catch (err) { toast.error('Erro ao atualizar status', err?.message); }
                                }}
                                className="text-xs font-bold rounded-lg px-2 py-1.5 border cursor-pointer focus:ring-2 focus:ring-orange-500"
                                style={{ backgroundColor: st.bg, color: st.text, borderColor: st.text + '40' }}
                              >
                                <option value="pendente">🟡 Pendente</option>
                                <option value="aprovado">🟢 Aprovado</option>
                                <option value="enviado">🔵 Enviado</option>
                                <option value="entregue">✅ Entregue</option>
                                <option value="cancelado">🔴 Cancelado</option>
                              </select>
                            </td>
                            <td className="px-4 py-3">
                              {editingNotes === p.id ? (
                                <div className="flex gap-1">
                                  <input
                                    type="text"
                                    value={notesText}
                                    onChange={e => setNotesText(e.target.value)}
                                    onKeyDown={async e => {
                                      if (e.key === 'Enter') {
                                        try {
                                          await AdminDb.purchases.updateStatus({ id: p.id, adminNotes: notesText });
                                          setEditingNotes(null);
                                          loadData();
                                          toast.success('Observação salva!');
                                        } catch (err) { toast.error('Erro', err?.message); }
                                      }
                                      if (e.key === 'Escape') setEditingNotes(null);
                                    }}
                                    className="text-xs border rounded px-2 py-1 w-32 focus:ring-1 focus:ring-orange-500"
                                    placeholder="Observação..."
                                    autoFocus
                                  />
                                </div>
                              ) : (
                                <button
                                  onClick={() => { setEditingNotes(p.id); setNotesText(p.admin_notes || ''); }}
                                  className="text-xs text-gray-400 hover:text-orange-600 flex items-center gap-1 transition-colors"
                                  title={p.admin_notes || 'Adicionar observação'}
                                >
                                  <MessageSquare size={14} />
                                  {p.admin_notes ? <span className="max-w-[80px] truncate text-gray-600">{p.admin_notes}</span> : <span>Adicionar</span>}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    {purchases.filter(p => statusFilter === 'todos' || (p.status || 'pendente') === statusFilter).length === 0 && (
                      <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-400 text-sm">Nenhum pedido encontrado</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="glass-panel p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center">
              <Award size={20} className="mr-2 text-yellow-500" /> Mais Resgatados
            </h3>
            <div className="space-y-3">
              {stats.topItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-gray-50/50 border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-200 text-gray-600'}`}>{idx + 1}</div>
                    <span className="font-medium text-gray-700 text-sm truncate max-w-[120px]">{item.name}</span>
                  </div>
                  <span className="text-xs font-bold text-gray-900">{item.count} un.</span>
                </div>
              ))}
              {stats.topItems.length === 0 && <p className="text-gray-400 text-center text-sm py-4">Sem dados ainda</p>}
            </div>
          </div>

          {stats.lowStockItems.length > 0 && (
            <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
              <h3 className="font-bold text-red-900 mb-4 flex items-center">
                <AlertTriangle size={20} className="mr-2" /> Estoque Baixo
              </h3>
              <div className="space-y-2">
                {stats.lowStockItems.slice(0, 5).map(item => (
                  <div key={item.id} className="flex justify-between items-center text-sm">
                    <span className="text-red-700 font-medium">{item.name}</span>
                    <span className="bg-white/50 px-2 py-0.5 rounded text-xs font-bold text-red-600">{item.stock_quantity} un.</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {
        showForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in transform transition-all">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="text-xl font-bold text-gray-900">{form.id ? 'Editar Prêmio' : 'Novo Prêmio'}</h3>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 transition-colors bg-white rounded-full p-1 hover:bg-gray-100">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={form.id ? handleUpdate : handleCreate} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nome do Prêmio</label>
                  <input required className="input w-full" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Kit Boas Vindas" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Descrição</label>
                  <textarea className="input w-full resize-none" rows="3" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Detalhes do prêmio..." />
                </div>
                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Imagem do Prêmio</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageFile(e.target.files?.[0])}
                  />
                  {form.image_url ? (
                    <div className="relative group">
                      <div className="w-full h-40 rounded-xl overflow-hidden border-2 border-dashed border-blue-200 bg-blue-50/30">
                        <img src={form.image_url} alt="Preview" className="w-full h-full object-contain" />
                      </div>
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button type="button" onClick={() => fileInputRef.current?.click()}
                          className="p-1.5 bg-white rounded-lg shadow-md text-blue-600 hover:bg-blue-50 transition-colors border border-gray-200">
                          <Upload size={14} />
                        </button>
                        <button type="button" onClick={() => setForm(f => ({ ...f, image_url: '' }))}
                          className="p-1.5 bg-white rounded-lg shadow-md text-red-500 hover:bg-red-50 transition-colors border border-gray-200">
                          <Trash size={14} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                      className={`w-full h-40 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all
                        ${dragOver
                          ? 'border-blue-500 bg-blue-50 scale-[1.02]'
                          : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/50'
                        }`}
                    >
                      <ImagePlus size={32} className={`mb-2 ${dragOver ? 'text-blue-500' : 'text-gray-400'}`} />
                      <p className="text-sm font-medium text-gray-600">Clique ou arraste uma imagem</p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG • Máx 2MB</p>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Valor (Pontos)</label>
                    <div className="relative">
                      <input type="number" required min="1" className="input w-full pl-8" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">PTS</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Estoque</label>
                    <input type="number" className="input w-full" placeholder="Ilimitado" value={form.stockQuantity} onChange={e => setForm({ ...form, stockQuantity: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Raridade</label>
                    <select className="input w-full" value={form.rarity} onChange={e => setForm({ ...form, rarity: e.target.value })}>
                      <option value="padrao">Padrão</option>
                      <option value="raro">Destaque</option>
                      <option value="epico">Especial</option>
                      <option value="lendario">Premium</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tipo</label>
                    <select className="input w-full" value={form.itemType} onChange={e => setForm({ ...form, itemType: e.target.value })}>
                      <option value="fisico">Físico</option>
                      <option value="beneficio">Benefício</option>
                      <option value="voucher">Voucher</option>
                      <option value="digital">Digital</option>
                    </select>
                  </div>
                </div>
                <div className="pt-4 flex gap-3 border-t border-gray-50 mt-4">
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors">Cancelar</button>
                  <button type="submit" className="flex-1 py-2.5 rounded-xl bg-brand text-white font-bold hover:bg-brand-dark shadow-md hover:shadow-lg transition-all">{form.id ? 'Salvar Alterações' : 'Criar Prêmio'}</button>
                </div>
              </form>
            </div>
          </div>
        )
      }
    </div >
  );
}
