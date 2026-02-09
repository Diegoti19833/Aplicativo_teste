import React, { useState, useEffect } from 'react';
import { Save, Bell, Globe, Shield, Palette } from 'lucide-react';
import { AdminDb } from '../../services/adminDb';

export default function AdminConfig() {
  const [settings, setSettings] = useState({
    companyName: 'Pet Class',
    primaryColor: '#0047AB',
    secondaryColor: '#FFD700',
    dailyXpLimit: 1000,
    globalRanking: true,
    soundEnabled: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const row = await AdminDb.settings.get();
      if (row) {
        setSettings({
          companyName: row.company_name ?? 'Pet Class',
          primaryColor: row.primary_color ?? '#0047AB',
          secondaryColor: row.secondary_color ?? '#FFD700',
          dailyXpLimit: row.daily_xp_limit ?? 1000,
          globalRanking: row.global_ranking ?? true,
          soundEnabled: row.sound_enabled ?? true,
        });
      }
    } catch (e) {
      alert(e?.message || 'Falha ao carregar configurações')
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await AdminDb.settings.save(settings);
      alert('Configurações salvas com sucesso!');
    } catch (e) {
      alert(e?.message || 'Falha ao salvar configurações')
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: 32 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Configurações</h1>
          <p style={{ color: '#6B7280' }}>Personalize a plataforma para sua empresa.</p>
        </div>
        <button 
          onClick={handleSave}
          className="btn-primary" 
          style={{ 
            background: '#0047AB', color: 'white', border: 'none', padding: '10px 20px', 
            borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600 
          }}
          disabled={loading || saving}
        >
          <Save size={20} />
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>

      {loading ? (
        <div className="card" style={{ padding: 24 }}>Carregando configurações...</div>
      ) : (
      <div className="grid" style={{ gridTemplateColumns: '250px 1fr', gap: 32 }}>
        {/* Sidebar Settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ padding: '12px 16px', borderRadius: 8, background: '#EFF6FF', color: '#0047AB', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
            <Globe size={18} /> Geral
          </div>
          <div style={{ padding: '12px 16px', borderRadius: 8, color: '#4B5563', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
            <Palette size={18} /> Aparência
          </div>
          <div style={{ padding: '12px 16px', borderRadius: 8, color: '#4B5563', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
            <Shield size={18} /> Gamificação
          </div>
          <div style={{ padding: '12px 16px', borderRadius: 8, color: '#4B5563', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
            <Bell size={18} /> Notificações
          </div>
        </div>

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* General Section */}
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
              <Globe size={20} color="#0047AB" />
              Identidade da Empresa
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500 }}>Nome da Empresa</label>
                <input 
                  className="input" 
                  style={{ width: '100%' }} 
                  value={settings.companyName}
                  onChange={(e) => setSettings({...settings, companyName: e.target.value})}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500 }}>Domínio Personalizado</label>
                <input className="input" style={{ width: '100%' }} defaultValue="treinamento.petclass.com" disabled />
              </div>
            </div>
          </div>

          {/* Appearance Section */}
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
              <Palette size={20} color="#0047AB" />
              Cores e Tema
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500 }}>Cor Primária</label>
                <div style={{ display: 'flex', gap: 12 }}>
                  <input 
                    type="color" 
                    value={settings.primaryColor}
                    onChange={(e) => setSettings({...settings, primaryColor: e.target.value})}
                    style={{ width: 40, height: 40, padding: 0, border: 'none', borderRadius: 8, cursor: 'pointer' }} 
                  />
                  <input 
                    className="input" 
                    style={{ flex: 1 }} 
                    value={settings.primaryColor}
                    onChange={(e) => setSettings({...settings, primaryColor: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500 }}>Cor Secundária</label>
                <div style={{ display: 'flex', gap: 12 }}>
                  <input 
                    type="color" 
                    value={settings.secondaryColor}
                    onChange={(e) => setSettings({...settings, secondaryColor: e.target.value})}
                    style={{ width: 40, height: 40, padding: 0, border: 'none', borderRadius: 8, cursor: 'pointer' }} 
                  />
                  <input 
                    className="input" 
                    style={{ flex: 1 }} 
                    value={settings.secondaryColor}
                    onChange={(e) => setSettings({...settings, secondaryColor: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Gamification Section */}
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
              <Shield size={20} color="#0047AB" />
              Regras de Gamificação
            </h3>
            <div style={{ display: 'grid', gap: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>Limite Diário de XP</div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>Máximo de pontos que um usuário pode ganhar por dia.</div>
                </div>
                <input 
                  type="number" 
                  className="input" 
                  style={{ width: 100 }} 
                  value={settings.dailyXpLimit}
                  onChange={(e) => setSettings({...settings, dailyXpLimit: parseInt(e.target.value)})}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f3f4f6', paddingTop: 16 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>Ranking Global</div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>Permitir que usuários vejam ranking de outras lojas.</div>
                </div>
                <div 
                  onClick={() => setSettings({...settings, globalRanking: !settings.globalRanking})}
                  style={{ 
                    width: 48, height: 24, background: settings.globalRanking ? '#0047AB' : '#E5E7EB', borderRadius: 12, 
                    position: 'relative', cursor: 'pointer', transition: '0.2s'
                  }}
                >
                  <div style={{ 
                    width: 20, height: 20, background: 'white', borderRadius: '50%', 
                    position: 'absolute', top: 2, left: settings.globalRanking ? 26 : 2, transition: '0.2s'
                  }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
