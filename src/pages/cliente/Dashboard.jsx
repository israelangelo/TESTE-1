import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../../firebase/config';
import {
  collection, query, where, getDocs,
  doc, getDoc, orderBy, Timestamp,
} from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { T, S } from '../../theme/tokens';

const TIPOS_FOTO = [
  { id: 'gondola_antes',  label: 'Gôndola Antes',  icon: '📦' },
  { id: 'gondola_depois', label: 'Gôndola Depois', icon: '✨' },
  { id: 'preco',          label: 'Precificação',   icon: '🏷️' },
  { id: 'estoque',        label: 'Estoque',        icon: '🗃️' },
  { id: 'fachada',        label: 'Fachada',        icon: '🏪' },
  { id: 'ponto_extra',    label: 'Ponto Extra',    icon: '⭐' },
  { id: 'concorrente',    label: 'Concorrente',    icon: '🔍' },
  { id: 'validade',       label: 'Validade',       icon: '📅' },
  { id: 'ruptura',        label: 'Ruptura',        icon: '⚠️' },
  { id: 'material_pop',   label: 'Material POP',   icon: '🎯' },
];

const NAV = [
  { key: 'lojas',    icon: '🏪', label: 'Lojas'     },
  { key: 'fotos',    icon: '📷', label: 'Fotos'     },
  { key: 'rupturas', icon: '⚠️', label: 'Rupturas'  },
  { key: 'perfil',   icon: '👤', label: 'Perfil'    },
];

export default function ClienteDashboard() {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const nome   = userData?.nome || currentUser?.email?.split('@')[0] || 'Cliente';
  const diaStr = new Date().toISOString().split('T')[0];

  const [aba, setAba] = useState('lojas');

  // Dados do cliente no Firestore
  const [clienteDoc, setClienteDoc]   = useState(null);
  const [lojasCliente, setLojasCliente] = useState([]);
  const [carregando, setCarregando]   = useState(true);

  // Checkins das lojas do cliente
  const [checkins, setCheckins]       = useState([]);

  // Fotos PDV das lojas do cliente
  const [fotos, setFotos]             = useState([]);
  const [fotoAberta, setFotoAberta]   = useState(null);

  // Rupturas
  const [rupturas, setRupturas]       = useState([]);

  // ── Carrega dados do cliente ──────────────────────────────────────
  useEffect(() => {
    async function carregar() {
      if (!currentUser) return;
      setCarregando(true);
      try {
        // Busca doc do cliente pelo uid (email match via usuarios)
        const usuarioSnap = await getDoc(doc(db, 'usuarios', currentUser.uid));
        const usuarioData = usuarioSnap.data();

        // Busca cliente pelo email ou uid
        const clienteQ = query(
          collection(db, 'clientes'),
          where('contato', '==', currentUser.email)
        );
        let clienteSnap = await getDocs(clienteQ);

        // fallback: lista todos e acha pelo nome do usuário
        if (clienteSnap.empty) {
          const todos = await getDocs(collection(db, 'clientes'));
          const match = todos.docs.find(d =>
            d.data().nome?.toLowerCase() === (usuarioData?.nome || '').toLowerCase()
          );
          if (match) clienteSnap = { docs: [match] };
          else        clienteSnap = { docs: [] };
        }

        if (clienteSnap.docs?.length > 0) {
          const cDoc = { id: clienteSnap.docs[0].id, ...clienteSnap.docs[0].data() };
          setClienteDoc(cDoc);

          // Carrega lojas vinculadas
          const lojaIds = cDoc.lojas || [];
          const lojasData = [];
          for (const id of lojaIds) {
            const lSnap = await getDoc(doc(db, 'lojas', id));
            if (lSnap.exists()) lojasData.push({ id: lSnap.id, ...lSnap.data() });
          }
          setLojasCliente(lojasData);

          // Checkins de hoje nas lojas do cliente
          if (lojaIds.length > 0) {
            const inicio = Timestamp.fromDate(new Date(diaStr + 'T00:00:00'));
            const fim    = Timestamp.fromDate(new Date(diaStr + 'T23:59:59'));

            const checkinQ = query(
              collection(db, 'checkins'),
              where('timestamp', '>=', inicio),
              where('timestamp', '<=', fim),
              orderBy('timestamp', 'desc')
            );
            const checkinSnap = await getDocs(checkinQ);
            const todosCheckins = checkinSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            setCheckins(todosCheckins.filter(c => lojaIds.includes(c.lojaId)));

            // Fotos PDV de hoje
            const fotoQ = query(
              collection(db, 'fotos_pdv'),
              where('timestamp', '>=', inicio),
              where('timestamp', '<=', fim),
              orderBy('timestamp', 'desc')
            );
            const fotoSnap = await getDocs(fotoQ);
            const todasFotos = fotoSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            setFotos(todasFotos.filter(f => lojaIds.includes(f.lojaId)));

            // Rupturas de hoje
            const rupQ = query(collection(db, 'rupturas'), where('data', '==', diaStr));
            const rupSnap = await getDocs(rupQ);
            setRupturas(rupSnap.docs.map(d => ({ id: d.id, ...d.data() }))
              .filter(r => lojaIds.includes(r.lojaId)));
          }
        }
      } catch (e) { console.error(e); }
      setCarregando(false);
    }
    carregar();
  }, [currentUser]);

  // ── Helpers ──────────────────────────────────────────────────────
  function statusLoja(lojaId) {
    const temCheckin = checkins.some(c => c.lojaId === lojaId && c.tipo === 'checkin');
    const temRuptura = rupturas.some(r => r.lojaId === lojaId && r.itens?.some(i => i.ruptura));
    if (!temCheckin) return { label: 'Sem visita', cor: T.red,    bg: 'rgba(244,67,54,0.12)',  dot: T.red    };
    if (temRuptura)  return { label: 'Ruptura',    cor: T.yellow, bg: 'rgba(249,168,37,0.12)', dot: T.yellow };
    return               { label: 'Em dia',     cor: T.green,  bg: 'rgba(76,175,80,0.12)',  dot: T.green  };
  }

  function promotorDaLoja(lojaId) {
    const c = checkins.find(c => c.lojaId === lojaId && c.tipo === 'checkin');
    return c?.nome || null;
  }

  function fotosLoja(lojaId) {
    return fotos.filter(f => f.lojaId === lojaId);
  }

  function formatarHora(ts) {
    if (!ts) return '--';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  const lojasEmDia    = lojasCliente.filter(l => statusLoja(l.id).label === 'Em dia').length;
  const lojasProblema = lojasCliente.filter(l => statusLoja(l.id).label !== 'Em dia').length;
  const totalFotos    = fotos.length;
  const totalRupturas = rupturas.reduce((acc, r) => acc + (r.itens?.filter(i => i.ruptura).length || 0), 0);

  const fotosPorLoja = fotos.reduce((acc, f) => {
    const k = f.lojaId || 'sem';
    if (!acc[k]) acc[k] = { lojaNome: f.lojaNome, fotos: [] };
    acc[k].fotos.push(f);
    return acc;
  }, {});

  return (
    <div style={{
      background: `radial-gradient(ellipse at 50% 0%, #0a3572 0%, #032774 50%, #010e2e 100%)`,
      minHeight: '100dvh', fontFamily: T.fontBody, color: T.text,
      maxWidth: 480, margin: '0 auto',
      display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden',
    }}>

      <div style={{
        position: 'absolute', width: 260, height: 260, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(224,104,32,0.1) 0%, transparent 70%)',
        top: -60, right: -40, pointerEvents: 'none',
      }} />

      {/* HEADER */}
      <div style={{
        padding: '52px 20px 20px', ...S.cardDark,
        borderRadius: '0 0 28px 28px', borderTop: 'none', marginBottom: 16,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ margin: 0, fontSize: 13, color: T.muted }}>Portal do Cliente</p>
            <h1 style={{ margin: '4px 0 0', fontFamily: T.fontTitle, fontSize: 26, fontWeight: 900 }}>
              Olá, {nome.split(' ')[0]} 👋
            </h1>
            {clienteDoc && (
              <p style={{ margin: '2px 0 0', fontSize: 12, color: T.orange }}>{clienteDoc.nome}</p>
            )}
          </div>
          <span style={{
            background: 'rgba(224,104,32,0.15)', color: T.orange,
            borderRadius: T.pill, padding: '6px 14px', fontSize: 12, fontWeight: 600,
          }}>Cliente</span>
        </div>

        {/* Mini resumo */}
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          {[
            { label: 'Lojas',    valor: lojasCliente.length, cor: T.orange  },
            { label: 'Em dia',   valor: lojasEmDia,          cor: T.green   },
            { label: 'Atenção',  valor: lojasProblema,       cor: lojasProblema > 0 ? T.yellow : T.muted },
            { label: 'Fotos',    valor: totalFotos,          cor: '#60a5fa' },
          ].map(item => (
            <div key={item.label} style={{ flex: 1, ...S.card, padding: '10px 6px', textAlign: 'center' }}>
              <p style={{ margin: 0, fontFamily: T.fontTitle, fontSize: 20, fontWeight: 700, color: item.cor }}>{item.valor}</p>
              <p style={{ margin: 0, fontSize: 10, color: T.muted }}>{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CONTEÚDO */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 100px' }}>

        {carregando && (
          <div style={{ textAlign: 'center', padding: 60, color: T.muted }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
            <p>Carregando seus dados...</p>
          </div>
        )}

        {!carregando && !clienteDoc && (
          <div style={{ ...S.card, padding: 32, textAlign: 'center', marginTop: 20 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <p style={{ color: T.muted, margin: 0 }}>Conta não vinculada a um cliente.</p>
            <p style={{ color: T.muted, fontSize: 12, marginTop: 6 }}>Fale com o gestor da Box Agência.</p>
          </div>
        )}

        {!carregando && clienteDoc && (

          <>
            {/* ── ABA LOJAS ── */}
            {aba === 'lojas' && (
              <div style={{ animation: 'fadeInUp 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>
                <p style={{ fontFamily: T.fontTitle, fontSize: 18, fontWeight: 700, margin: '0 0 12px' }}>
                  Suas Lojas — Hoje
                </p>

                {lojasCliente.length === 0 && (
                  <div style={{ ...S.card, padding: 32, textAlign: 'center' }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>🏪</div>
                    <p style={{ color: T.muted, margin: 0 }}>Nenhuma loja vinculada.</p>
                  </div>
                )}

                {lojasCliente.map(loja => {
                  const st       = statusLoja(loja.id);
                  const promotor = promotorDaLoja(loja.id);
                  const nFotos   = fotosLoja(loja.id).length;
                  const checkinLoja = checkins.find(c => c.lojaId === loja.id && c.tipo === 'checkin');
                  const checkoutLoja = checkins.find(c => c.lojaId === loja.id && c.tipo === 'checkout');

                  return (
                    <div key={loja.id} style={{ ...S.card, padding: 16, marginBottom: 12, borderLeft: `3px solid ${st.cor}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                        <p style={{ margin: 0, fontFamily: T.fontTitle, fontSize: 18, fontWeight: 700 }}>{loja.nome}</p>
                        <span style={{
                          background: st.bg, color: st.cor,
                          borderRadius: T.pill, padding: '3px 10px',
                          fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', marginLeft: 8,
                        }}>● {st.label}</span>
                      </div>

                      <p style={{ margin: '0 0 6px', fontSize: 13, color: T.muted }}>📍 {loja.endereco || loja.cidade || 'Sem endereço'}</p>

                      {promotor && (
                        <p style={{ margin: '0 0 6px', fontSize: 13, color: T.muted }}>👤 {promotor}</p>
                      )}

                      {/* Horários */}
                      {checkinLoja && (
                        <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                          <span style={{ fontSize: 12, color: T.green }}>
                            ✅ Entrada: {formatarHora(checkinLoja.timestamp)}
                          </span>
                          {checkoutLoja && (
                            <span style={{ fontSize: 12, color: T.orange }}>
                              🏁 Saída: {formatarHora(checkoutLoja.timestamp)}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Foto fachada */}
                      {checkinLoja?.fotoFachada && (
                        <img
                          src={checkinLoja.fotoFachada}
                          alt="fachada"
                          onClick={() => setFotoAberta(checkinLoja.fotoFachada)}
                          style={{
                            width: '100%', height: 120, objectFit: 'cover',
                            borderRadius: T.r12, marginBottom: 10,
                            border: `1px solid ${T.border}`, cursor: 'pointer',
                          }}
                        />
                      )}

                      {/* Rodapé */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${T.border}`, paddingTop: 10 }}>
                        <span style={{ fontSize: 13, color: T.muted }}>📷 {nFotos} foto{nFotos !== 1 ? 's' : ''} hoje</span>
                        {clienteDoc?.produtos?.length > 0 && (
                          <span style={{ fontSize: 12, color: T.orange }}>{clienteDoc.produtos.length} SKU(s) no mix</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── ABA FOTOS ── */}
            {aba === 'fotos' && (
              <div style={{ animation: 'fadeInUp 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <p style={{ fontFamily: T.fontTitle, fontSize: 18, fontWeight: 700, margin: 0 }}>Fotos de Hoje</p>
                  <span style={{
                    background: 'rgba(96,165,250,0.15)', color: '#60a5fa',
                    borderRadius: T.pill, padding: '4px 12px', fontSize: 12, fontWeight: 700,
                  }}>{totalFotos} foto{totalFotos !== 1 ? 's' : ''}</span>
                </div>

                {fotos.length === 0 && (
                  <div style={{ ...S.card, padding: 32, textAlign: 'center' }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>📷</div>
                    <p style={{ color: T.muted, margin: 0 }}>Nenhuma foto registrada hoje.</p>
                  </div>
                )}

                {Object.entries(fotosPorLoja).map(([lojaId, grupo]) => (
                  <div key={lojaId} style={{ marginBottom: 20 }}>
                    <p style={{ fontFamily: T.fontTitle, fontSize: 14, color: T.muted, margin: '0 0 10px', letterSpacing: 1 }}>
                      🏪 {grupo.lojaNome?.toUpperCase()}
                      <span style={{ marginLeft: 8, color: '#60a5fa', fontSize: 13 }}>({grupo.fotos.length})</span>
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      {grupo.fotos.map((f, i) => {
                        const tipo = TIPOS_FOTO.find(t => t.id === f.tipo);
                        return (
                          <div key={i} style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setFotoAberta(f.url)}>
                            <img src={f.url} alt={tipo?.label} style={{
                              width: '100%', aspectRatio: '1', objectFit: 'cover',
                              borderRadius: T.r12, border: `1px solid ${T.border}`,
                            }} />
                            <div style={{
                              position: 'absolute', bottom: 6, left: 6, right: 6,
                              background: 'rgba(2,29,90,0.88)', backdropFilter: 'blur(4px)',
                              borderRadius: T.r8, padding: '3px 8px',
                              fontSize: 11, fontWeight: 600, color: T.text,
                              display: 'flex', alignItems: 'center', gap: 4,
                            }}>
                              <span>{tipo?.icon}</span>
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {tipo?.label || f.tipo}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── ABA RUPTURAS ── */}
            {aba === 'rupturas' && (
              <div style={{ animation: 'fadeInUp 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <p style={{ fontFamily: T.fontTitle, fontSize: 18, fontWeight: 700, margin: 0 }}>Rupturas de Hoje</p>
                  {totalRupturas > 0 && (
                    <span style={{
                      background: 'rgba(244,67,54,0.15)', color: T.red,
                      borderRadius: T.pill, padding: '4px 12px', fontSize: 12, fontWeight: 700,
                    }}>⚠️ {totalRupturas} em falta</span>
                  )}
                </div>

                {rupturas.length === 0 && (
                  <div style={{ ...S.card, padding: 32, textAlign: 'center' }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
                    <p style={{ color: T.green, margin: 0, fontWeight: 600 }}>Nenhuma ruptura registrada!</p>
                    <p style={{ color: T.muted, fontSize: 12, marginTop: 6 }}>Todos os produtos disponíveis nas lojas.</p>
                  </div>
                )}

                {rupturas.map(r => {
                  const emFalta = r.itens?.filter(i => i.ruptura) || [];
                  const ok      = r.itens?.filter(i => !i.ruptura) || [];
                  return (
                    <div key={r.id} style={{
                      ...S.card, padding: 16, marginBottom: 12,
                      borderLeft: `3px solid ${emFalta.length > 0 ? T.red : T.green}`,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <div>
                          <p style={{ margin: 0, fontFamily: T.fontTitle, fontSize: 17, fontWeight: 700 }}>{r.lojaNome}</p>
                          <p style={{ margin: '2px 0 0', fontSize: 12, color: T.muted }}>👤 {r.nome}</p>
                        </div>
                        <span style={{
                          fontFamily: T.fontTitle, fontSize: 18, fontWeight: 800,
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
                })}
              </div>
            )}

            {/* ── ABA PERFIL ── */}
            {aba === 'perfil' && (
              <div style={{ animation: 'fadeInUp 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>
                <div style={{ ...S.cardDark, padding: 24, borderRadius: T.r20, textAlign: 'center', marginBottom: 16 }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: '50%', background: T.orange,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 12px', fontFamily: T.fontTitle, fontSize: 28, fontWeight: 700,
                  }}>{nome[0].toUpperCase()}</div>
                  <p style={{ margin: '0 0 4px', fontFamily: T.fontTitle, fontSize: 22 }}>{nome}</p>
                  <p style={{ margin: 0, fontSize: 13, color: T.muted }}>{currentUser?.email}</p>
                  {clienteDoc && (
                    <p style={{ margin: '6px 0 0', fontSize: 12, color: T.orange }}>{clienteDoc.nome}</p>
                  )}
                  <span style={{
                    display: 'inline-block', marginTop: 10,
                    background: 'rgba(59,130,246,0.15)', color: '#3b82f6',
                    borderRadius: T.pill, padding: '4px 14px', fontSize: 12, fontWeight: 600,
                  }}>Cliente</span>
                </div>

                {clienteDoc && (
                  <div style={{ ...S.card, padding: 16, marginBottom: 12 }}>
                    <p style={{ margin: '0 0 10px', fontFamily: T.fontTitle, fontSize: 14, color: T.muted, letterSpacing: 1 }}>
                      MIX DE PRODUTOS
                    </p>
                    {clienteDoc.produtos?.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {clienteDoc.produtos.map((sku, i) => (
                          <span key={i} style={{
                            background: 'rgba(224,104,32,0.12)', border: `1px solid rgba(224,104,32,0.3)`,
                            borderRadius: T.pill, padding: '5px 12px',
                            fontSize: 13, fontWeight: 600, color: T.orange, fontFamily: T.fontTitle,
                          }}>📦 {sku}</span>
                        ))}
                      </div>
                    ) : (
                      <p style={{ color: T.muted, fontSize: 13, margin: 0 }}>Nenhum produto cadastrado.</p>
                    )}
                  </div>
                )}

                <button onClick={async () => { await signOut(auth); navigate('/login'); }} style={{
                  ...S.btnGhost, width: '100%', padding: 16,
                  color: '#ff6b6b', border: '1px solid rgba(244,67,54,0.25)', fontSize: 15,
                }}>
                  🚪 Sair da conta
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* BOTTOM NAV */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 480, ...S.cardDark,
        borderRadius: '20px 20px 0 0', borderBottom: 'none',
        display: 'flex', padding: '8px 0 20px', zIndex: 50,
      }}>
        {NAV.map(item => (
          <button key={item.key} onClick={() => setAba(item.key)} style={{
            flex: 1, background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            padding: '8px 0', transition: T.smooth, position: 'relative',
          }}>
            <span style={{ fontSize: 18 }}>{item.icon}</span>
            {item.key === 'rupturas' && totalRupturas > 0 && (
              <div style={{
                position: 'absolute', top: 4, right: 'calc(50% - 18px)',
                width: 16, height: 16, borderRadius: '50%',
                background: T.red, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff',
              }}>{totalRupturas}</div>
            )}
            <span style={{ fontSize: 10, fontWeight: 600, color: aba === item.key ? T.orange : T.muted }}>
              {item.label}
            </span>
            {aba === item.key && <div style={{ width: 4, height: 4, borderRadius: '50%', background: T.orange }} />}
          </button>
        ))}
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
            position: 'absolute', top: 20, right: 20, width: 36, height: 36, borderRadius: T.pill,
            background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 18, cursor: 'pointer',
          }}>✕</div>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
}