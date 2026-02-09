import React, { useEffect, useMemo, useState } from 'react';
import { Download, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AdminDb } from '../../services/adminDb';

const COLORS = ['#0047AB', '#EF4444', '#F59E0B'];

export default function AdminRelatorios() {
  const [loading, setLoading] = useState(true);
  const [completionData, setCompletionData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [roleRows, setRoleRows] = useState([]);

  const monthLabels = useMemo(() => ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'], []);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);

        const now = new Date();
        const from = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        const fromIso = from.toISOString();
        const toIso = now.toISOString();

        const [overview, users] = await Promise.all([
          AdminDb.reports.getOverview({ fromIso, toIso }),
          AdminDb.users.list(),
        ]);

        const buckets = [];
        for (let i = 5; i >= 0; i -= 1) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          buckets.push({
            y: d.getFullYear(),
            m: d.getMonth(),
            name: monthLabels[d.getMonth()],
            completed: 0,
          });
        }

        for (const row of overview.lessonCompletedRows || []) {
          const raw = row.completed_at || row.created_at;
          if (!raw) continue;
          const d = new Date(raw);
          const b = buckets.find((x) => x.y === d.getFullYear() && x.m === d.getMonth());
          if (b) b.completed += 1;
        }

        setCompletionData(buckets.map(({ name, completed }) => ({ name, completed })));

        const usersCount = overview.usersCount || 0;
        const activeCount = overview.activeUsersCount || 0;
        setPieData([
          { name: 'Usuários Ativos', value: activeCount },
          { name: 'Usuários Inativos', value: Math.max(0, usersCount - activeCount) },
        ]);

        const groups = new Map();
        for (const u of users || []) {
          const role = String(u.role || 'funcionario');
          const current = groups.get(role) || { role, users: 0, totalXp: 0 };
          current.users += 1;
          current.totalXp += Number(u.total_xp) || 0;
          groups.set(role, current);
        }

        const rows = Array.from(groups.values())
          .map((g) => ({
            role: g.role,
            users: g.users,
            avgXp: g.users ? Math.round(g.totalXp / g.users) : 0,
          }))
          .sort((a, b) => b.users - a.users);

        setRoleRows(rows);
      } catch (e) {
        alert(e?.message || 'Falha ao carregar relatórios');
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [monthLabels]);

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Relatórios</h1>
          <p style={{ color: '#6B7280' }}>Análise detalhada do engajamento e aprendizado.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button style={{ 
            background: 'white', border: '1px solid #e5e7eb', padding: '10px 16px', 
            borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#374151' 
          }}>
            <Calendar size={18} />
            Últimos 30 dias
          </button>
          <button style={{ 
            background: '#0047AB', color: 'white', border: 'none', padding: '10px 16px', 
            borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600 
          }}>
            <Download size={18} />
            Exportar PDF
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ padding: 24 }}>Carregando relatórios...</div>
      ) : (
      <>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 24 }}>
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Taxa de Conclusão Mensal</h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={completionData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f9fafb' }} />
                <Bar dataKey="completed" fill="#0047AB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Status dos Alunos</h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 10 }}>
              {pieData.map((entry, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[index] }} />
                  {entry.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Detalhes por Função</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
              <th style={{ textAlign: 'left', padding: '12px 0', fontSize: 12, color: '#6B7280' }}>FUNÇÃO</th>
              <th style={{ textAlign: 'left', padding: '12px 0', fontSize: 12, color: '#6B7280' }}>USUÁRIOS</th>
              <th style={{ textAlign: 'left', padding: '12px 0', fontSize: 12, color: '#6B7280' }}>MÉDIA DE XP</th>
            </tr>
          </thead>
          <tbody>
            {roleRows.map((row) => (
              <tr key={row.role} style={{ borderBottom: '1px solid #f9fafb' }}>
                <td style={{ padding: '16px 0', fontWeight: 500 }}>{row.role}</td>
                <td style={{ padding: '16px 0', color: '#6B7280' }}>{row.users}</td>
                <td style={{ padding: '16px 0', color: '#6B7280' }}>{row.avgXp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </>
      )}
    </div>
  );
}
