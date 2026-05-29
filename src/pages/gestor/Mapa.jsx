import { useState, useEffect, useRef } from 'react';
import { db } from '../../firebase/config';
import { collection, onSnapshot, query, where, Timestamp } from 'firebase/firestore';
import { T, S } from '../../theme/tokens';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix ícones padrão do Leaflet com Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Pin laranja customizado
function pinLaranja(nome) {
  return L.divIcon({
    className: '',
    html: `
      <div style="
        background: #E06820;
        border: 3px solid #fff;
        border-radius: 50% 50% 50% 0;
        width: 36px; height: 36px;
        transform: rotate(-45deg);
        box-shadow: 0 4px 12px rgba(224,104,32,0.6);
        display: flex; align-items: center; justify-content: center;
      ">
        <span style="
          transform: rotate(45deg);
          font-size: 14px; font-weight: 700;
          color: #fff; font-family: 'Barlow Condensed', sans-serif;
        ">${(nome || '?')[0].toUpperCase()}</span>
      </div>
      <div style="
        background: rgba(2,29,90,0.92);
        border: 1px solid rgba(224,104,32,0.5);
        border-radius: 8px;
        padding: 3px 8px;
        margin-top: 4px;
        white-space: nowrap;
        font-size: 11px;
        font-weight: 700;
        color: #fff;
        font-family: 'Barlow', sans-serif;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        text-align: center;
      ">${nome?.split(' ')[0] || '?'}</div>
    `,
    iconSize:   [36, 60],
    iconAnchor: [18, 54],
    popupAnchor:[0, -54],
  });
}

export default function Mapa() {
  const mapRef      = useRef(null);
  const mapaInst    = useRef(null);
  const marcadores  = useRef({});

  const [ativos, setAtivos]         = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [selecionado, setSelecionado] = useState(null);

  const diaStr = new Date().toISOString().split('T')[0];

  // ── Inicializa mapa ──────────────────────────────────────────────
  useEffect(() => {
    if (mapaInst.current) return;
    mapaInst.current = L.map(mapRef.current, {
      center: [-20.3155, -40.3128], // Vitória/ES
      zoom: 12,
      zoomControl: true,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    }).addTo(mapaInst.current);

    // Estilo do mapa — mais escuro
    const style = document.createElement('style');
    style.textContent = `.leaflet-tile { filter: brightness(0.85) saturate(0.7) hue-rotate(200deg); }`;
    document.head.appendChild(style);

    return () => {
      mapaInst.current?.remove();
      mapaInst.current = null;
    };
  }, []);

  // ── Escuta checkins de hoje em tempo real ────────────────────────
  useEffect(() => {
    const inicio = Timestamp.fromDate(new Date(diaStr + 'T00:00:00'));
    const fim    = Timestamp.fromDate(new Date(diaStr + 'T23:59:59'));

    const q = query(
      collection(db, 'checkins'),
      where('tipo',      '==', 'checkin'),
      where('timestamp', '>=', inicio),
      where('timestamp', '<=', fim)
    );

    const unsub = onSnapshot(q, (snap) => {
      // Pega o checkin mais recente de cada promotor
      const porPromotor = {};
      snap.docs.forEach((d) => {
        const data = { id: d.id, ...d.data() };
        const uid  = data.uid;
        if (!porPromotor[uid]) {
          porPromotor[uid] = data;
        } else {
          const anterior = porPromotor[uid].timestamp?.seconds || 0;
          const atual    = data.timestamp?.seconds || 0;
          if (atual > anterior) porPromotor[uid] = data;
        }
      });

      // Só mostra quem tem coordenadas
      const lista = Object.values(porPromotor).filter(
        (c) => c.lat != null && c.lng != null
      );
      setAtivos(lista);
      setCarregando(false);

      // Atualiza marcadores no mapa
      if (!mapaInst.current) return;

      // Remove marcadores de quem saiu
      const uidsAtivos = new Set(lista.map((c) => c.uid));
      Object.keys(marcadores.current).forEach((uid) => {
        if (!uidsAtivos.has(uid)) {
          marcadores.current[uid].remove();
          delete marcadores.current[uid];
        }
      });

      // Adiciona / atualiza marcadores
      lista.forEach((checkin) => {
        const popup = `
          <div style="font-family:'Barlow',sans-serif; min-width:160px;">
            <p style="margin:0 0 4px;font-weight:700;font-size:15px;">${checkin.nome || 'Promotor'}</p>
            <p style="margin:0 0 2px;font-size:12px;color:#666;">📍 ${checkin.lojaNome || 'Loja não informada'}</p>
            <p style="margin:0;font-size:11px;color:#999;">
              ${checkin.timestamp?.toDate
                ? checkin.timestamp.toDate().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                : ''}
            </p>
          </div>
        `;

        if (marcadores.current[checkin.uid]) {
          marcadores.current[checkin.uid]
            .setLatLng([checkin.lat, checkin.lng])
            .setPopupContent(popup);
        } else {
          marcadores.current[checkin.uid] = L.marker(
            [checkin.lat, checkin.lng],
            { icon: pinLaranja(checkin.nome) }
          )
            .addTo(mapaInst.current)
            .bindPopup(popup);
        }
      });
    });

    return () => unsub();
  }, []);

  // ── Centraliza no promotor selecionado ───────────────────────────
  function centralizarEm(checkin) {
    if (!mapaInst.current || !checkin.lat) return;
    setSelecionado(checkin);
    mapaInst.current.flyTo([checkin.lat, checkin.lng], 16, { animate: true, duration: 1.2 });
    marcadores.current[checkin.uid]?.openPopup();
  }

  return (
    <div style={{
      background: `radial-gradient(ellipse at 30% 0%, #0a3572 0%, #032774 50%, #010e2e 100%)`,
      minHeight: '100dvh', fontFamily: T.fontBody, color: T.text,
      maxWidth: 480, margin: '0 auto',
      display: 'flex', flexDirection: 'column',
    }}>

      {/* Orb */}
      <div style={{
        position: 'fixed', width: 220, height: 220, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(224,104,32,0.10) 0%, transparent 70%)',
        top: -40, right: -40, pointerEvents: 'none', zIndex: 0,
      }} />

      {/* ── HEADER ── */}
      <div style={{
        padding: '52px 20px 16px', ...S.cardDark,
        borderRadius: '0 0 24px 24px', borderTop: 'none',
        marginBottom: 0, position: 'relative', zIndex: 10,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: T.muted }}>Tempo Real</p>
            <h1 style={{ margin: 0, fontFamily: T.fontTitle, fontSize: 30, fontWeight: 900, letterSpacing: -0.5 }}>
              🗺️ Mapa ao Vivo
            </h1>
          </div>
          <div style={{
            ...S.card, padding: '8px 16px', borderRadius: T.pill,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: ativos.length > 0 ? T.green : T.muted,
              boxShadow: ativos.length > 0 ? `0 0 8px ${T.green}` : 'none',
              display: 'inline-block',
            }} />
            <span style={{ fontFamily: T.fontTitle, fontSize: 20, fontWeight: 700, color: T.orange }}>
              {ativos.length}
            </span>
            <span style={{ fontSize: 11, color: T.muted }}>ativo{ativos.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {/* ── MAPA ── */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div
          ref={mapRef}
          style={{
            width: '100%', height: 340,
            border: `1px solid ${T.border}`,
          }}
        />
        {carregando && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(3,39,116,0.85)', backdropFilter: 'blur(4px)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 12,
          }}>
            <div style={{ fontSize: 36 }}>🗺️</div>
            <p style={{ margin: 0, color: T.muted, fontSize: 14 }}>Carregando mapa...</p>
          </div>
        )}
        {!carregando && ativos.length === 0 && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(3,39,116,0.75)', backdropFilter: 'blur(4px)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 8,
            pointerEvents: 'none',
          }}>
            <div style={{ fontSize: 40 }}>📭</div>
            <p style={{ margin: 0, color: T.muted, fontSize: 14 }}>Nenhum promotor ativo agora</p>
            <p style={{ margin: 0, color: T.muted, fontSize: 12 }}>Os pins aparecem após o check-in</p>
          </div>
        )}
      </div>

      {/* ── LISTA PROMOTORES ATIVOS ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 100px' }}>
        <p style={{
          fontFamily: T.fontTitle, fontSize: 16, letterSpacing: 1,
          color: T.muted, margin: '0 0 12px',
        }}>
          PROMOTORES EM CAMPO
        </p>

        {!carregando && ativos.length === 0 && (
          <div style={{ ...S.card, padding: 32, textAlign: 'center' }}>
            <p style={{ margin: 0, color: T.muted, fontSize: 14 }}>
              Aguardando check-ins do dia...
            </p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {ativos.map((c) => {
            const sel = selecionado?.uid === c.uid;
            const hora = c.timestamp?.toDate
              ? c.timestamp.toDate().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
              : '--:--';
            return (
              <button
                key={c.uid}
                onClick={() => centralizarEm(c)}
                style={{
                  ...S.card, padding: 16, cursor: 'pointer', textAlign: 'left',
                  border: sel
                    ? `1px solid ${T.orange}`
                    : '1px solid rgba(255,255,255,0.12)',
                  background: sel ? 'rgba(224,104,32,0.10)' : 'rgba(255,255,255,0.07)',
                  transition: T.smooth,
                  display: 'flex', alignItems: 'center', gap: 14,
                }}>

                {/* Avatar */}
                <div style={{
                  width: 46, height: 46, borderRadius: '50%',
                  background: sel ? T.orange : 'rgba(224,104,32,0.25)',
                  border: `2px solid ${sel ? T.orange : 'rgba(224,104,32,0.4)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: T.fontTitle, fontSize: 22, fontWeight: 700,
                  color: sel ? '#fff' : T.orange, flexShrink: 0,
                  boxShadow: sel ? `0 0 16px rgba(224,104,32,0.5)` : 'none',
                  transition: T.smooth,
                }}>
                  {(c.nome || '?')[0].toUpperCase()}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{
                      margin: 0, fontFamily: T.fontTitle, fontSize: 17, fontWeight: 700,
                      color: sel ? T.orange : T.text,
                    }}>
                      {c.nome || 'Promotor'}
                    </p>
                    <span style={{
                      fontSize: 11, color: T.muted,
                      background: 'rgba(255,255,255,0.06)',
                      borderRadius: T.pill, padding: '2px 8px',
                    }}>
                      {hora}
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: T.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    📍 {c.lojaNome || 'Loja não informada'}
                  </p>
                  {c.lat && (
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: 'rgba(170,180,204,0.6)' }}>
                      {c.lat.toFixed(4)}, {c.lng.toFixed(4)}
                    </p>
                  )}
                </div>

                <span style={{ fontSize: 18, color: sel ? T.orange : T.muted }}>›</span>
              </button>
            );
          })}
        </div>

        {/* Rodapé info */}
        {ativos.length > 0 && (
          <p style={{ textAlign: 'center', fontSize: 11, color: T.muted, marginTop: 20 }}>
            🔄 Atualização automática em tempo real
          </p>
        )}
      </div>
    </div>
  );
}