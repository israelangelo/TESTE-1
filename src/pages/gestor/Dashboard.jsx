import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { T, S } from '../../theme/tokens';

const MENU = [
  { icon: '👥', label: 'Promotores',    rota: '/gestor/promotores' },
  { icon: '🏪', label: 'Lojas',         rota: '/gestor/lojas'      },
  { icon: '🤝', label: 'Clientes',      rota: '/gestor/clientes'   },
  { icon: '📅', label: 'Escala',        rota: '/gestor/escala'     },
  { icon: '📊', label: 'Relatórios',    rota: '/gestor/relatorios' },
  { icon: '🗺️', label: 'Mapa ao Vivo', rota: '/gestor/mapa'       },
  { icon: '⚙️', label: 'Configurações', rota: '/gestor/configuracoes' },
];

export default function GestorDashboard() {
  const { userData, currentUser } = useAuth();
  const navigate = useNavigate();
  const [menuAberto, setMenuAberto] = useState(false);

  const nome = userData?.nome || currentUser?.email?.split('@')[0] || 'Gestor';
  const hoje = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long',
  });

  return (
    <div style={{
      background: `radial-gradient(ellipse at 30% 0%, #0a3572 0%, #032774 50%, #010e2e 100%)`,
      minHeight: '100dvh', fontFamily: T.fontBody, color: T.text,
      maxWidth: 480, margin: '0 auto', padding: '52px 16px 40px',
      position: 'relative',
    }}>

      {/* Orb */}
      <div style={{
        position: 'fixed', width: 260, height: 260, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(224,104,32,0.10) 0%, transparent 70%)',
        top: -60, right: -60, pointerEvents: 'none', zIndex: 0,
      }} />

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <p style={{ margin: 0, fontSize: 13, color: T.muted, textTransform: 'capitalize' }}>{hoje}</p>
          <h1 style={{ margin: '4px 0 0', fontFamily: T.fontTitle, fontSize: 32, fontWeight: 900, letterSpacing: -0.5 }}>
            Olá, {nome.split(' ')[0]} 👋
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: T.muted }}>Box Agência — Painel do Gestor</p>
        </div>
        <button
          onClick={() => setMenuAberto(true)}
          style={{
            ...S.card, border: 'none', padding: '10px 14px',
            cursor: 'pointer', fontSize: 22,
          }}>
          ☰
        </button>
      </div>

      {/* ── GRID MENU ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {MENU.map((item) => (
          <button
            key={item.rota}
            onClick={() => navigate(item.rota)}
            style={{
              ...S.card, padding: '22px 16px',
              cursor: 'pointer', textAlign: 'left',
              display: 'flex', flexDirection: 'column', gap: 10,
              transition: T.smooth,
              ...(item.label === 'Mapa ao Vivo' ? {
                background: 'rgba(224,104,32,0.10)',
                border: `1px solid rgba(224,104,32,0.3)`,
              } : {}),
            }}>
            <span style={{ fontSize: 28 }}>{item.icon}</span>
            <span style={{
              fontFamily: T.fontTitle, fontSize: 17, fontWeight: 700,
              color: item.label === 'Mapa ao Vivo' ? T.orange : T.text,
            }}>
              {item.label}
            </span>
          </button>
        ))}
      </div>

      {/* ── MENU LATERAL ── */}
      {menuAberto && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
          <div
            onClick={() => setMenuAberto(false)}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          />
          <div style={{
            position: 'absolute', top: 0, right: 0, bottom: 0,
            width: 280, ...S.cardDark,
            borderRadius: '24px 0 0 24px', padding: '60px 24px 40px',
            display: 'flex', flexDirection: 'column',
            animation: 'slideLeft 0.35s cubic-bezier(0.34,1.56,0.64,1)',
          }}>
            <p style={{ fontFamily: T.fontTitle, fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>
              {nome}
            </p>
            <p style={{ fontSize: 13, color: T.muted, margin: '0 0 28px' }}>{currentUser?.email}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
              {MENU.map((item) => (
                <button key={item.rota} onClick={() => { navigate(item.rota); setMenuAberto(false); }} style={{
                  ...S.btnGhost, padding: '14px 16px', textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: 12, fontSize: 15,
                  color: item.label === 'Mapa ao Vivo' ? T.orange : T.text,
                }}>
                  <span style={{ fontSize: 20 }}>{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>

            <button
              onClick={async () => { await signOut(auth); navigate('/login'); }}
              style={{
                ...S.btnGhost, padding: '14px 16px', marginTop: 16,
                color: '#ff6b6b', border: '1px solid rgba(244,67,54,0.25)',
                display: 'flex', alignItems: 'center', gap: 12, fontSize: 15,
              }}>
              🚪 Sair da conta
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideLeft {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}