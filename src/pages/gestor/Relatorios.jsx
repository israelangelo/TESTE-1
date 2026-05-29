import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { T, S } from '../../theme/tokens';

const TIPOS_FOTO = [
  { id: 'gondola_antes',  label: 'Gôndola Antes',  icon: '📦' },
  { id: 'gondola_depois', label: 'Gôndola Depois',  icon: '✨' },
  { id: 'preco',          label: 'Precificação',    icon: '🏷️' },
  { id: 'estoque',        label: 'Estoque',         icon: '🗃️' },
  { id: 'fachada',        label: 'Fachada',         icon: '🏪' },
  { id: 'ponto_extra',    label: 'Ponto Extra',     icon: '⭐' },
  { id: 'concorrente',    label: 'Concorrente',     icon: '🔍' },
  { id: 'validade',       label: 'Validade',        icon: '📅' },
  { id: 'ruptura',        label: 'Ruptura',         icon: '⚠️' },
  { id: 'material_pop',   label: 'Material POP',    icon: '🎯' },
];

export default function Relatorios() {
  const navigate = useNavigate();
  const hoje = new Date().toISOString().split('T')[0];

  const [aba, setAba]               = useState('checkins');
  const [data, setData]             = useState(hoje);
  const [checkins, setCheckins]     = useState([]);
  const [promotores, setPromotores] = useState([]);
  const [lojas, setLojas]           = useState([]);
  const [filtroPromotor, setFiltroPromotor] = useState('');
  const [filtroLoja, setFiltroLoja]         = useState('');
  const [carregando, setCarregando]         = useState(false);
  const [fotoAberta, setFotoAberta]         = useState(null);

  // Fotos PDV
  const [fotosPDV, setFotosPDV]             = useState([]);
  const [carregandoFotos, setCarregandoFotos] = useState(false);
  const [filtroFotoLoja, setFiltroFotoLoja] = useState('');
  const [filtroFotoTipo, setFiltroFotoTipo] = useState('');

  // Rupturas
  const [rupturas, setRupturas]             = useState([]);
  const [carregandoRupturas, setCarregandoRupturas] = useState(false);

  useEffect(() => { carregarAuxiliares(); }, []);
  useEffect(() => { if (aba === 'checkins') buscarCheckins(); }, [data, filtroPromotor, filtroLoja, aba]);
  useEffect(() => { if (aba === 'fotos')    buscarFotos();    }, [data, filtroFotoLoja, filtroFotoTipo, aba]);
  useEffect(() => { if (aba === 'rupturas') buscarRupturas(); }, [data, aba]);

  async function carregarAuxiliares() {
    const [snapP, snapL] = await Promise.all([
      getDocs(collection(db, 'usuarios')),
      getDocs(collection(db, 'lojas')),
    ]);
    setPromotores(snapP.docs.map(d => ({ id: d.id, ...d.data() })).filter(u => u.perfil === 'promotor'));
    setLojas(snapL.docs.map(d => ({ id: d.id, ...d.data() })));
  }

  async function buscarCheckins() {
    setCarregando(true);
    try {
      const inicio = new Date(data + 'T00:00:00');
      const fim    = new Date(data + 'T23:59:59');
      let q = query(
        collection(db, 'checkins'),
        where('timestamp', '>=', inicio),
        where('timestamp', '<=', fim),
        orderBy('timestamp', 'desc')
      );
      const snap = await getDocs(q);
      let lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (filtroPromotor) lista = lista.filter(c => c.uid === filtroPromotor);
      if (filtroLoja)     lista = lista.filter(c => c.lojaId === filtroLoja);
      setCheckins(lista);
    } catch (e) { console.error(e); }
    setCarregando(false);
  }

  async function buscarFotos() {
    setCarregandoFotos(true);
    try {
      const inicio = new Date(data + 'T00:00:00');
      const fim    = new Date(data + 'T23:59:59');
      let q = query(
        collection(db, 'fotos_pdv'),
        where('timestamp', '>=', inicio),
        where('timestamp', '<=', fim),
        orderBy('timestamp', 'desc')
      );
      const snap = await getDocs(q);
      let lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (filtroFotoLoja) lista = lista.filter(f => f.lojaId === filtroFotoLoja);
      if (filtroFotoTipo) lista = lista.filter(f => f.tipo  === filtroFotoTipo);
      setFotosPDV(lista);
    } catch (e) { console.error(e); }
    setCarregandoFotos(false);
  }

  async function buscarRupturas() {
    setCarregandoRupturas(true);
    try {
      const q = query(collection(db, 'rupturas'), where('data', '==', data));
      const snap = await getDocs(q);
      setRupturas(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
    setCarregandoRupturas(false);
  }

  // Agrupamentos
  const porPromotor = checkins.reduce((acc, c) => {
    if (!acc[c.uid]) acc[c.uid] = { nome: c.nome, checkins: [] };
    acc[c.uid].checkins.push(c);
    return acc;
  }, {});

  const fotosPorLoja = fotosPDV.reduce((acc, f) => {
    const k = f.lojaId || 'sem_loja';
    if (!acc[k]) acc[k] = { lojaNome: f.lojaNome, fotos: [] };
    acc[k].fotos.push(f);
    return acc;
  }, {});

  const totalCheckins      = checkins.filter(c => c.tipo === 'checkin').length;
  const totalCheckouts     = checkins.filter(c => c.tipo === 'checkout').length;
  const promotoresAtivos   = Object.keys(porPromotor).length;
  const lojasVisitadas     = [...new Set(checkins.map(c => c.lojaId))].length;
  const totalRupturas      = rupturas.reduce((acc, r) => acc + (r.itens?.filter(i => i.ruptura).length || 0), 0);

  function formatarHora(ts) {
    if (!ts) return '--';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }
  function formatarTempo(seg) {
    if (!seg) return '--';
    const m = Math.floor(seg / 60), s = seg % 60;
    return m > 0 ? `${m}min ${s}s` : `${s}s`;
  }

  const selectStyle = { ...S.input, padding: '10px 14px', fontSize: 14, appearance: 'none', WebkitAppearance: 'none' };

  const ABAS = [
    { key: 'checkins', label: 'Check-ins', icon: '✅' },
    { key: 'fotos',    label: 'Fotos',     icon: '📷' },
    { key: 'rupturas', label: 'Rupturas',  icon: '⚠️' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: `radial-gradient(ellipse at 20% 10%, #0a3572 0%, ${T.bg} 50%, ${T.card} 100%)`,
      fontFamily: T.fontBody, color: T.text,
      maxWidth: 480, margin: '0 auto', paddingBottom: 40,
    }}>

      {/* Header */}
      <div style={{
        ...S.cardDark, borderRadius: 0, borderBottom: `1px solid ${T.border}`,
        padding: '52px 20px 16px', display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button onClick={() => navigate('/gestor')} style={{
          background: 'rgba(255,255,255,0.08)', border: `1px solid ${T.glassBorder}`,
          borderRadius: T.r12, color: T.text, width: 38, height: 38, fontSize: 18,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>←</button>
        <div>
          <div style={{ fontFamily: T.fontTitle, fontSize: 24, fontWeight: 800, lineHeight: 1 }}>RELATÓRIOS</div>
          <div style={{ color: T.muted, fontSize: 13, marginTop: 2 }}>Visão geral do dia</div>
        </div>
      </div>

      {/* Abas */}
      <div style={{ display: 'flex', padding: '12px 16px 0', gap: 8 }}>
        {ABAS.map(a => (
          <button key={a.key} onClick={() => setAba(a.key)} style={{
            flex: 1, padding: '10px 4px',
            background: aba === a.key ? T.orange : 'rgba(255,255,255,0.07)',
            border: aba === a.key ? 'none' : `1px solid rgba(255,255,255,0.12)`,
            borderRadius: T.r12, cursor: 'pointer',
            fontFamily: T.fontTitle, fontSize: 14, fontWeight: 700,
            color: aba === a.key ? '#fff' : T.muted,
            transition: T.smooth,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <span>{a.icon}</span>{a.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '16px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Filtro data (sempre visível) */}
        <input type="date" value={data} onChange={e => setData(e.target.value)}
          style={{ ...selectStyle, colorScheme: 'dark' }} />

        {/* ── ABA CHECK-INS ── */}
        {aba === 'checkins' && (
          <>
            {/* Filtros */}
            <div style={{ ...S.card, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <select value={filtroPromotor} onChange={e => setFiltroPromotor(e.target.value)} style={selectStyle}>
                <option value="">Todos os promotores</option>
                {promotores.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
              <select value={filtroLoja} onChange={e => setFiltroLoja(e.target.value)} style={selectStyle}>
                <option value="">Todas as lojas</option>
                {lojas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
              </select>
            </div>

            {/* Cards resumo */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'Check-ins',  valor: totalCheckins,    cor: T.green,   icon: '✅' },
                { label: 'Check-outs', valor: totalCheckouts,   cor: T.orange,  icon: '🏁' },
                { label: 'Promotores', valor: promotoresAtivos, cor: '#60a5fa', icon: '👤' },
                { label: 'Lojas',      valor: lojasVisitadas,   cor: T.yellow,  icon: '🏪' },
              ].map(c => (
                <div key={c.label} style={{ ...S.card, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ fontSize: 22 }}>{c.icon}</div>
                  <div style={{ fontFamily: T.fontTitle, fontSize: 28, fontWeight: 800, color: c.cor, lineHeight: 1 }}>{c.valor}</div>
                  <div style={{ fontSize: 12, color: T.muted }}>{c.label}</div>
                </div>
              ))}
            </div>

            {/* Lista */}
            {carregando ? (
              <div style={{ textAlign: 'center', color: T.muted, padding: 40 }}>Carregando...</div>
            ) : checkins.length === 0 ? (
              <div style={{ ...S.card, padding: 32, textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>📋</div>
                <div style={{ color: T.muted, fontSize: 14 }}>Nenhum checkin encontrado.</div>
              </div>
            ) : (
              Object.entries(porPromotor).map(([uid, grupo]) => (
                <div key={uid} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px' }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: T.pill,
                      background: `linear-gradient(135deg, ${T.orange}, #c45a1a)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: T.fontTitle, fontSize: 16, fontWeight: 800, flexShrink: 0,
                    }}>{grupo.nome?.charAt(0).toUpperCase()}</div>
                    <div>
                      <div style={{ fontFamily: T.fontTitle, fontSize: 17, fontWeight: 700 }}>{grupo.nome}</div>
                      <div style={{ fontSize: 12, color: T.muted }}>{grupo.checkins.length} registro(s)</div>
                    </div>
                  </div>

                  {grupo.checkins.map(c => (
                    <div key={c.id} style={{ ...S.cardDark, padding: 14, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      {c.fotoFachada ? (
                        <img src={c.fotoFachada} alt="fachada" onClick={() => setFotoAberta(c.fotoFachada)}
                          style={{ width: 64, height: 64, borderRadius: T.r12, objectFit: 'cover', flexShrink: 0, border: `1px solid ${T.glassBorder}`, cursor: 'pointer' }} />
                      ) : (
                        <div style={{ width: 64, height: 64, borderRadius: T.r12, background: T.glass, border: `1px solid ${T.glassBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>🏪</div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <span style={{
                            fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
                            padding: '2px 8px', borderRadius: T.pill,
                            background: c.tipo === 'checkin' ? 'rgba(76,175,80,0.2)' : 'rgba(224,104,32,0.2)',
                            color: c.tipo === 'checkin' ? T.green : T.orange,
                            textTransform: 'uppercase',
                          }}>
                            {c.tipo === 'checkin' ? '✅ Check-in' : '🏁 Check-out'}
                          </span>
                        </div>
                        <div style={{ fontFamily: T.fontTitle, fontSize: 16, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.lojaNome || 'Loja não identificada'}
                        </div>
                        <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>
                          🕐 {formatarHora(c.timestamp)}
                          {c.tipo === 'checkout' && c.tempoVisita &&
                            <span style={{ marginLeft: 10 }}>⏱ {formatarTempo(c.tempoVisita)}</span>}
                        </div>
                        {c.precisao && (
                          <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>📍 GPS ±{Math.round(c.precisao)}m</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </>
        )}

        {/* ── ABA FOTOS ── */}
        {aba === 'fotos' && (
          <>
            <div style={{ ...S.card, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <select value={filtroFotoLoja} onChange={e => setFiltroFotoLoja(e.target.value)} style={selectStyle}>
                <option value="">Todas as lojas</option>
                {lojas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
              </select>
              <select value={filtroFotoTipo} onChange={e => setFiltroFotoTipo(e.target.value)} style={selectStyle}>
                <option value="">Todos os tipos</option>
                {TIPOS_FOTO.map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
              </select>
            </div>

            <div style={{ ...S.card, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: T.muted }}>Total de fotos</span>
              <span style={{ fontFamily: T.fontTitle, fontSize: 24, color: '#60a5fa', fontWeight: 800 }}>{fotosPDV.length}</span>
            </div>

            {carregandoFotos ? (
              <div style={{ textAlign: 'center', color: T.muted, padding: 40 }}>Carregando fotos...</div>
            ) : fotosPDV.length === 0 ? (
              <div style={{ ...S.card, padding: 32, textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>📷</div>
                <div style={{ color: T.muted, fontSize: 14 }}>Nenhuma foto registrada neste dia.</div>
              </div>
            ) : (
              Object.entries(fotosPorLoja).map(([lojaId, grupo]) => (
                <div key={lojaId} style={{ marginBottom: 8 }}>
                  <p style={{ fontFamily: T.fontTitle, fontSize: 14, color: T.muted, margin: '0 0 10px', letterSpacing: 1 }}>
                    🏪 {grupo.lojaNome?.toUpperCase() || 'LOJA'}
                    <span style={{ marginLeft: 8, color: '#60a5fa', fontSize: 13 }}>({grupo.fotos.length})</span>
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    {grupo.fotos.map((f, i) => {
                      const tipo = TIPOS_FOTO.find(t => t.id === f.tipo);
                      return (
                        <div key={i} style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setFotoAberta(f.url)}>
                          <img src={f.url} alt={tipo?.label} style={{
                            width: '100%', aspectRatio: '1', objectFit: 'cover',
                            borderRadius: T.r12, border: `1px solid ${T.border}`,
                          }} />
                          <div style={{
                            position: 'absolute', bottom: 4, left: 4, right: 4,
                            background: 'rgba(2,29,90,0.88)', backdropFilter: 'blur(4px)',
                            borderRadius: T.r8, padding: '2px 6px',
                            fontSize: 10, color: T.text, fontWeight: 600,
                            display: 'flex', alignItems: 'center', gap: 3,
                          }}>
                            <span>{tipo?.icon}</span>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tipo?.label}</span>
                          </div>
                          <div style={{
                            position: 'absolute', top: 4, right: 4,
                            background: 'rgba(2,29,90,0.75)', borderRadius: T.pill,
                            padding: '2px 6px', fontSize: 10, color: T.muted,
                          }}>{f.nome?.split(' ')[0]}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* ── ABA RUPTURAS ── */}
        {aba === 'rupturas' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ ...S.card, padding: '14px 16px' }}>
                <div style={{ fontSize: 22 }}>⚠️</div>
                <div style={{ fontFamily: T.fontTitle, fontSize: 28, fontWeight: 800, color: T.red, lineHeight: 1 }}>{totalRupturas}</div>
                <div style={{ fontSize: 12, color: T.muted }}>SKUs em falta</div>
              </div>
              <div style={{ ...S.card, padding: '14px 16px' }}>
                <div style={{ fontSize: 22 }}>🏪</div>
                <div style={{ fontFamily: T.fontTitle, fontSize: 28, fontWeight: 800, color: T.yellow, lineHeight: 1 }}>{rupturas.length}</div>
                <div style={{ fontSize: 12, color: T.muted }}>Lojas com registro</div>
              </div>
            </div>

            {carregandoRupturas ? (
              <div style={{ textAlign: 'center', color: T.muted, padding: 40 }}>Carregando rupturas...</div>
            ) : rupturas.length === 0 ? (
              <div style={{ ...S.card, padding: 32, textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
                <div style={{ color: T.green, fontSize: 14, fontWeight: 600 }}>Nenhuma ruptura registrada.</div>
                <div style={{ color: T.muted, fontSize: 12, marginTop: 4 }}>Todos os produtos estão disponíveis.</div>
              </div>
            ) : (
              rupturas.map(r => {
                const emFalta = r.itens?.filter(i => i.ruptura) || [];
                const ok      = r.itens?.filter(i => !i.ruptura) || [];
                return (
                  <div key={r.id} style={{ ...S.card, padding: 16, borderLeft: `3px solid ${emFalta.length > 0 ? T.red : T.green}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <p style={{ margin: 0, fontFamily: T.fontTitle, fontSize: 17, fontWeight: 700 }}>{r.lojaNome}</p>
                        <p style={{ margin: '2px 0 0', fontSize: 12, color: T.muted }}>👤 {r.nome}</p>
                      </div>
                      <span style={{
                        fontFamily: T.fontTitle, fontSize: 20, fontWeight: 800,
                        color: emFalta.length > 0 ? T.red : T.green,
                        background: emFalta.length > 0 ? 'rgba(244,67,54,0.1)' : 'rgba(76,175,80,0.1)',
                        borderRadius: T.pill, padding: '4px 12px',
                      }}>{emFalta.length}/{r.itens?.length || 0}</span>
                    </div>

                    {emFalta.length > 0 && (
                      <>
                        <p style={{ margin: '0 0 8px', fontSize: 11, color: T.red, fontWeight: 700, letterSpacing: 1 }}>EM FALTA</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                          {emFalta.map((s, i) => (
                            <span key={i} style={{
                              background: 'rgba(244,67,54,0.12)', border: `1px solid rgba(244,67,54,0.3)`,
                              borderRadius: T.pill, padding: '4px 10px',
                              fontSize: 12, fontWeight: 600, color: T.red,
                            }}>⚠️ {s.sku}</span>
                          ))}
                        </div>
                      </>
                    )}

                    {ok.length > 0 && (
                      <>
                        <p style={{ margin: '0 0 8px', fontSize: 11, color: T.green, fontWeight: 700, letterSpacing: 1 }}>DISPONÍVEIS</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {ok.map((s, i) => (
                            <span key={i} style={{
                              background: 'rgba(76,175,80,0.08)', border: `1px solid rgba(76,175,80,0.2)`,
                              borderRadius: T.pill, padding: '4px 10px',
                              fontSize: 12, color: T.green,
                            }}>✓ {s.sku}</span>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </>
        )}
      </div>

      {/* Modal foto */}
      {fotoAberta && (
        <div onClick={() => setFotoAberta(null)} style={{
          position: 'fixed', inset: 0, zIndex: 999,
          background: 'rgba(0,0,0,0.92)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <img src={fotoAberta} alt="foto" style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: T.r16, objectFit: 'contain' }} />
          <div style={{
            position: 'absolute', top: 20, right: 20,
            width: 36, height: 36, borderRadius: T.pill,
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, cursor: 'pointer',
          }}>✕</div>
        </div>
      )}
    </div>
  );
}