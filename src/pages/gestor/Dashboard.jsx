import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import { collection, onSnapshot, query, where, Timestamp } from 'firebase/firestore';
import { T, S } from '../../theme/tokens';
import GeometricBackground from '../../components/GeometricBackground';
import SidebarGestor from '../../components/SidebarGestor';

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
  const [statusPromotores, setStatusPromotores] = useState([]);

  const nome = userData?.nome || currentUser?.email?.split('@')[0] || 'Gestor';
  const hoje = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long',
  });

  const diaStr = new Date().toISOString().split('T')[0];

  // ── Status em tempo real dos promotores ─────────────────────────
  useEffect(() => {
    const inicio = Timestamp.fromDate(new Date(diaStr + 'T00:00:00'));
    const fim    = Timestamp.fromDate(new Date(diaStr + 'T23:59:59'));

    // Escuta todos os checkins de hoje
    const qCheckins = query(
      collection(db, 'checkins'),
      where('timestamp', '>=', inicio),
      where('timestamp', '<=', fim)
    );

    const unsub = onSnapshot(qCheckins, (snap) => {
      const agora = Date.now();
      const porPromotor = {};

      snap.docs.forEach((d) => {
        const data = { id: d.id, ...d.data() };
        const uid  = data.uid;
        if (!porPromotor[uid]) {
          porPromotor[uid] = { checkin: null, checkout: null, nome: data.nome };
        }
        if (data.tipo === 'checkin') {
          const anterior = porPromotor[uid].checkin?.timestamp?.seconds || 0;
          const atual    = data.timestamp?.seconds || 0;
          if (atual > anterior) porPromotor[uid].checkin = data;
          porPromotor[uid].nome = data.nome || porPromotor[uid].nome;
        }
        if (data.tipo === 'checkout') {
          const anterior = porPromotor[uid].checkout?.timestamp?.seconds || 0;
          const atual    = data.timestamp?.seconds || 0;
          if (atual > anterior) porPromotor[uid].checkout = data;
        }
      });

      const lista = Object.entries(porPromotor).map(([uid, info]) => {
        const tsCheckin  = info.checkin?.timestamp?.toDate?.()?.getTime?.() || null;
        const tsCheckout = info.checkout?.timestamp?.toDate?.()?.getTime?.() || null;

        let status = 'sem_sinal';
        if (tsCheckin) {
          if (tsCheckout && tsCheckout > tsCheckin) {
            status = 'finalizado';
          } else {
            const minutos = (agora - tsCheckin) / 60000;
            status = minutos < 60 ? 'ativo' : 'parado';
          }
        }

        return {
          uid,
          nome: info.nome || 'Promotor',
          status,
          lojaNome: info.checkin?.lojaNome || null,
          hora: tsCheckin
            ? new Date(tsCheckin).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            : null,
        };
      });

      setStatusPromotores(lista);
    });

    return () => unsub();
  }, [diaStr]);

  const corStatus = { ativo: T.green, parado: T.yellow, finalizado: T.muted, sem_sinal: T.red };
  const labelStatus = { ativo: 'ativo', parado: 'parado', finalizado: 'encerrou', sem_sinal: 'sem sinal' };
  const ativos = statusPromotores.filter(p => p.status === 'ativo').length;

  return (
    <div style={{
      minHeight: '100dvh', fontFamily: T.fontBody, color: T.text,
      maxWidth: 480, margin: '0 auto', padding: '52px 16px 40px',
      position: 'relative',
    }}>
      <GeometricBackground />
      <SidebarGestor aberto={menuAberto} onFechar={() => setMenuAberto(false)} />

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, position: 'relative', zIndex: 1 }}>
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

      {/* ── STATUS PROMOTORES ── */}
      {statusPromotores.length > 0 && (
        <div style={{ ...S.card, padding: '14px 16px', marginBottom: 20, position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <p style={{ margin: 0, fontFamily: T.fontTitle, fontSize: 13, letterSpacing: 1, color: T.muted }}>
              PROMOTORES HOJE
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: ativos > 0 ? T.green : T.muted,
                boxShadow: ativos > 0 ? `0 0 8px ${T.green}` : 'none',
                display: 'inline-block',
                animation: ativos > 0 ? 'pulse 2s infinite' : 'none',
              }} />
              <span style={{ fontSize: 12, color: T.muted }}>{ativos} ativo{ativos !== 1 ? 's' : ''}</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {statusPromotores.map((p) => (
              <div key={p.uid} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '8px 10px',
                borderRadius: 10,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}>
                {/* Bolinha status */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'rgba(224,104,32,0.2)',
                    border: `2px solid ${corStatus[p.status]}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: T.fontTitle, fontSize: 16, fontWeight: 700, color: T.orange,
                  }}>
                    {(p.nome || '?')[0].toUpperCase()}
                  </div>
                  <span style={{
                    position: 'absolute', bottom: 0, right: 0,
                    width: 12, height: 12, borderRadius: '50%',
                    background: corStatus[p.status],
                    border: '2px solid rgba(3,18,70,1)',
                    boxShadow: p.status === 'ativo' ? `0 0 6px ${T.green}` : 'none',
                  }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.text }}>
                    {p.nome.split(' ')[0]}
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: T.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.lojaNome ? `📍 ${p.lojaNome}` : 'Sem check-in'}
                  </p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span style={{
                    display: 'inline-block',
                    background: `${corStatus[p.status]}22`,
                    border: `1px solid ${corStatus[p.status]}55`,
                    borderRadius: T.pill, padding: '2px 8px',
                    fontSize: 10, fontWeight: 700,
                    color: corStatus[p.status], textTransform: 'uppercase',
                  }}>
                    {labelStatus[p.status]}
                  </span>
                  {p.hora && (
                    <p style={{ margin: '2px 0 0', fontSize: 10, color: T.muted }}>{p.hora}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate('/gestor/mapa')}
            style={{
              ...S.btnGhost, width: '100%', marginTop: 10, padding: '8px 0',
              fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              color: T.orange, borderColor: 'rgba(224,104,32,0.3)',
            }}>
            🗺️ Ver no Mapa ao Vivo
          </button>
        </div>
      )}

      {/* ── GRID MENU ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, position: 'relative', zIndex: 1 }}>
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

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
