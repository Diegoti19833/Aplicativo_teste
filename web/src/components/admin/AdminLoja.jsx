import React, { useEffect, useState } from 'react';
import { ShoppingBag, Plus, Edit3, Trash2, Package, ToggleLeft, ToggleRight } from 'lucide-react';
import { AdminDb } from '../../services/adminDb';

export default function AdminLoja() {
  const [items, setItems] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeView, setActiveView] = useState('items');
  const [form, setForm] = useState({ name: '', description: '', icon: '🎁', itemType: 'cosmetic', price: 50, rarity: 'common', stockQuantity: '', purchaseLimit: 1 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [itemsData, purchasesData] = await Promise.all([
        AdminDb.storeItems.list().catch(() => []),
        AdminDb.purchases.list().catch(() => [])
      ]);
      setItems(itemsData);
      setPurchases(purchasesData);
    } catch (e) {
      console.error('Erro:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await AdminDb.storeItems.create({
        name: form.name,
        description: form.description,
        icon: form.icon,
        itemType: form.itemType,
        price: parseInt(form.price),
        rarity: form.rarity,
        stockQuantity: form.stockQuantity ? parseInt(form.stockQuantity) : null,
        purchaseLimit: parseInt(form.purchaseLimit) || 1,
      });
      setShowForm(false);
      setForm({ name: '', description: '', icon: '🎁', itemType: 'cosmetic', price: 50, rarity: 'common', stockQuantity: '', purchaseLimit: 1 });
      loadData();
    } catch (e) {
      alert('Erro ao criar item: ' + e.message);
    }
  };

  const toggleAvailable = async (item) => {
    try {
      await AdminDb.storeItems.setAvailable({ id: item.id, isAvailable: !item.is_available });
      loadData();
    } catch (e) {
      alert('Erro: ' + e.message);
    }
  };

  const removeItem = async (item) => {
    if (!confirm(`Remover "${item.name || item.title}"?`)) return;
    try {
      await AdminDb.storeItems.remove({ id: item.id });
      loadData();
    } catch (e) {
      alert('Erro: ' + e.message);
    }
  };

  const rarityColors = {
    common: { bg: '#F3F4F6', color: '#6B7280' },
    rare: { bg: '#DBEAFE', color: '#2563EB' },
    epic: { bg: '#E9D5FF', color: '#7C3AED' },
    legendary: { bg: '#FEF3C7', color: '#D97706' },
  };

  if (loading) {
    return <div style={{ padding: 32, textAlign: 'center', color: '#6B7280' }}>Carregando loja...</div>;
  }

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 4 }}>
            <ShoppingBag size={24} style={{ verticalAlign: 'middle', marginRight: 8 }} />
            Loja & Premios
          </h1>
          <p style={{ color: '#6B7280' }}>{items.length} itens cadastrados | {purchases.length} compras realizadas</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setActiveView('items')}
            style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #e5e7eb', background: activeView === 'items' ? '#0047AB' : '#fff', color: activeView === 'items' ? '#fff' : '#374151', cursor: 'pointer', fontWeight: 500 }}
          >Itens</button>
          <button
            onClick={() => setActiveView('purchases')}
            style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #e5e7eb', background: activeView === 'purchases' ? '#0047AB' : '#fff', color: activeView === 'purchases' ? '#fff' : '#374151', cursor: 'pointer', fontWeight: 500 }}
          >Historico de Compras</button>
          <button onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#059669', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
            <Plus size={16} /> Novo Item
          </button>
        </div>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Novo Item da Loja</h3>
          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Nome do item" required style={{ padding: 10, borderRadius: 8, border: '1px solid #e5e7eb' }} />
            <input value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Descricao" style={{ padding: 10, borderRadius: 8, border: '1px solid #e5e7eb' }} />
            <input value={form.icon} onChange={e => setForm({...form, icon: e.target.value})} placeholder="Icone (emoji)" style={{ padding: 10, borderRadius: 8, border: '1px solid #e5e7eb' }} />
            <select value={form.itemType} onChange={e => setForm({...form, itemType: e.target.value})} style={{ padding: 10, borderRadius: 8, border: '1px solid #e5e7eb' }}>
              <option value="avatar">Avatar</option>
              <option value="theme">Tema</option>
              <option value="boost">Boost</option>
              <option value="decoration">Decoracao</option>
              <option value="special">Especial</option>
              <option value="cosmetic">Cosmetico</option>
            </select>
            <input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} placeholder="Preco (coins)" min="1" required style={{ padding: 10, borderRadius: 8, border: '1px solid #e5e7eb' }} />
            <select value={form.rarity} onChange={e => setForm({...form, rarity: e.target.value})} style={{ padding: 10, borderRadius: 8, border: '1px solid #e5e7eb' }}>
              <option value="common">Comum</option>
              <option value="rare">Raro</option>
              <option value="epic">Epico</option>
              <option value="legendary">Legendario</option>
            </select>
            <input type="number" value={form.stockQuantity} onChange={e => setForm({...form, stockQuantity: e.target.value})} placeholder="Estoque (vazio = ilimitado)" style={{ padding: 10, borderRadius: 8, border: '1px solid #e5e7eb' }} />
            <input type="number" value={form.purchaseLimit} onChange={e => setForm({...form, purchaseLimit: e.target.value})} placeholder="Limite por usuario" min="1" style={{ padding: 10, borderRadius: 8, border: '1px solid #e5e7eb' }} />
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8 }}>
              <button type="submit" style={{ background: '#059669', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Criar Item</button>
              <button type="button" onClick={() => setShowForm(false)} style={{ background: '#f3f4f6', color: '#374151', border: 'none', padding: '10px 24px', borderRadius: 8, cursor: 'pointer' }}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {activeView === 'items' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {items.map(item => {
            const rarity = rarityColors[item.rarity] || rarityColors.common;
            return (
              <div key={item.id} className="card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ fontSize: 32 }}>{item.icon || '🎁'}</div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => toggleAvailable(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                      {item.is_available ? <ToggleRight size={20} color="#059669" /> : <ToggleLeft size={20} color="#DC2626" />}
                    </button>
                    <button onClick={() => removeItem(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                      <Trash2 size={16} color="#DC2626" />
                    </button>
                  </div>
                </div>
                <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{item.name || item.title}</div>
                <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 8 }}>{item.description}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 12, background: '#FEF3C7', color: '#D97706', fontWeight: 600 }}>{item.price} coins</span>
                  <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 12, background: rarity.bg, color: rarity.color, fontWeight: 600 }}>{item.rarity}</span>
                  {item.stock_quantity != null && (
                    <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 12, background: '#F3F4F6', color: '#374151' }}>Estoque: {item.stock_quantity}</span>
                  )}
                  <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 12, background: item.is_available ? '#D1FAE5' : '#FEE2E2', color: item.is_available ? '#059669' : '#DC2626' }}>
                    {item.is_available ? 'Disponivel' : 'Indisponivel'}
                  </span>
                </div>
              </div>
            );
          })}
          {items.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: '#9CA3AF' }}>Nenhum item na loja ainda</div>
          )}
        </div>
      ) : (
        <div className="card" style={{ overflow: 'auto' }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Historico de Compras</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: 12, color: '#6B7280' }}>DATA</th>
                <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: 12, color: '#6B7280' }}>USUARIO</th>
                <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: 12, color: '#6B7280' }}>ITEM</th>
                <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: 12, color: '#6B7280' }}>QTD</th>
                <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: 12, color: '#6B7280' }}>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                  <td style={{ padding: '12px 8px', fontSize: 13 }}>{new Date(p.purchase_date).toLocaleDateString('pt-BR')}</td>
                  <td style={{ padding: '12px 8px' }}>
                    <div style={{ fontWeight: 500 }}>{p.user?.name || '-'}</div>
                    <div style={{ fontSize: 12, color: '#9CA3AF' }}>{p.user?.email || '-'}</div>
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    <span>{p.item?.icon} {p.item?.name || p.item?.title || '-'}</span>
                  </td>
                  <td style={{ padding: '12px 8px', textAlign: 'right' }}>{p.quantity}</td>
                  <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 600 }}>{p.total_price} coins</td>
                </tr>
              ))}
            </tbody>
          </table>
          {purchases.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>Nenhuma compra registrada</div>
          )}
        </div>
      )}
    </div>
  );
}
