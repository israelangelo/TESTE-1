import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  collection, addDoc, updateDoc,
  deleteDoc, doc, query, where, onSnapshot
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { T, S } from '../../theme/tokens';
import { useBackButton } from '../../hooks/useBackButton';  // ← NOVO

const hoje = () => new Date().toISOString().split('T')[0];

const formatData = (d) => {
  if (!d) return '';
  const [y, m, dia] = d.split('-');
  return `${dia}/${m}/${y}`;
};

export default function Escala() {
  const navigate = useNavigate();

  const [promotores, setPromotores] = useState([]);
  const [lojas, setLojas]           = useState([]);
  const [escalas, setEscalas]       = useState([]);
  const [carregando, setCarregando] = useState(true);

  const [data, setData]             = useState(hoje());
  const [promotorId, setPromotorId] = useState('');
  const [lojasSel, setLojasSel]     = useState([]);
  const [editId, setEditId]         = useState(null);

  const [sheet, setSheet]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast]     = useState('');

  // ✅ Botão voltar Android — fecha sheet antes de sair da tela
  useBackButton(() => {           // ← NOVO
    if (sheet) { setSheet(null); return true; }
  });

  // ✅ onSnapshot — 3 listeners em tempo real, cleanup automático
  useEffect(() => {
    let prontos = 0;
    const marcarPronto = () => { prontos++; if (prontos >= 3) setCarregando(false); };

    const unsubP = onSnapshot(
      query(collection(db, 'usuarios'), where('perfil', '==', 'promotor')),
      snap => { setPromotores(snap.docs.map(d => ({ id: d.id, ...d.data() }))); marcarPronto(); },
      err => console.error('promotores:', err)
    );

    const unsubL = onSnapshot(
      collection(db, 'lojas'),
      snap => { setLojas(snap.docs.map(d => ({ id: d.id, ...d.data() }))); marcarPronto(); },
      err => console.error('lojas:', err)
    );

    const unsubE = onSnapshot(
      collection(db, 'escalas'),
      snap => { setEscalas(snap.docs.map(d => ({ id: d.id, ...d.data() }))); marcarPronto(); },
      err => console.error('escalas:', err)
    );

    return () => { unsubP(); unsubL(); unsubE(); };
  }, []);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 2800);
  }

  function toggleLoja(id) {
    setLojasSel(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  function abrirEdicao(esc) {
    setEditId(esc.id);
    setData(esc.data);
    setPromotorId(esc.promotorId);
    setLojasSel(esc.lojas || []);
    setSheet(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function salvar() {
    if (!promotorId || !data || lojasSel.length === 0) {
      showToast('Preencha todos os campos ⚠️'); return;
    }
    setLoading(true);
    const payload = { promotorId, data, lojas: lojasSel };
    try {
      if (editId) {
        await updateDoc(doc(db, 'escalas', editId), payload);
        showToast('Escala atualizada ✅');
      } else {
        await addDoc(collection(db, 'escalas'), payload);
        showToast('Escala criada ✅');
      }
      resetForm();
    } catch {
      showToast('Erro ao salvar ❌');
    }
    setLoading(false);
  }

  async function excluir(id) {
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'escalas', id));
      setSheet(null);
      showToast('Escala removida 🗑️');
    } catch {
      showToast('Erro ao excluir ❌');
    }
    setLoading(false);
  }

  function resetForm() {
    setEditId(null);
    setData(hoje());
    setPromotorId('');
    setLojasSel([]);
  }

  // ✅ BUG 6 — nunca mostra ID bruto
  function resolverNome(lista, id, tipo) {
    if (!id) return `${tipo} não definido`;
    if (carregando) return '…';
    const item = lista.find(x => x.id === id);
    if (!item) return `${tipo} não encontrado`;
    return item.nome || item.nomeFantasia || `${tipo} sem nome`;
  }

  const nomePromotor = (id) => resolverNome(promotores, id, 'Promotor');
  const nomeLoja     = (id) => resolverNome(lojas, id, 'Loja');

  function TagNome({ id, lista, tipo }) {
    const nome = resolverNome(lista, id, tipo);
    const naoEncontrado = !carregando && id && !lista.find(x => x.id === id);
    return (
      <span style={{ color: naoEncontrado ? T.orange : 'inherit' }}>
        {naoEncontrado ? `⚠️ ${nome}` : nome}
      </span>
    );
  }

  const porData = escalas.reduce((acc, e) => {
    (acc[e.data] = acc[e.data] || []).push(e);
    return acc;
  }, {});
  const datasOrdenadas = Object.keys(porData).sort((a, b) => b.localeCompare(a));

  return (
    <div style={{
      minHeight: '100vh',
      background: `radial-gradient(ellipse at 30% 0%, #0a3572 0%, ${T.bg} 50%, #010e2e 100%)`,
      fontFamily: T.fontBody, color: T.text,
      paddingBottom: 100, maxWidth: 480, margin: '0 auto',
    }}>

      {/* HEADER */}
      <div style={{
        ...S.cardDark,
        borderRadius: '0 0 24px 24px', borderTop: 'none',
        padding: '52px 20px 20px',
        display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8,
      }}>
        <button onClick={() => navigate('/gestor')} style={{
          ...S.btnGhost, width: 40, height: 40, borderRadius: T.r12,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, padding: 0, flexShrink: 0,
        }}>‹</button>
        <div>
          <div style={{ fontFamily: T.fontTitle, fontSize: 26, fontWeight: 900 }}>Escala</div>
          <div style={{ fontSize: 12, color: T.muted, marginTop: 1 }}>
            Atribuição de lojas por dia
            <span style={{
              marginLeft: 8, display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 10, color: '#4ade80', fontWeight: 700,
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%', background: '#4ade80',
                display: 'inline-block', animation: 'pulsar 1.8s ease-in-out infinite',
              }} />
              AO VIVO
            </span>
          </div>
        </div>
      </div>

      {/* FORMULÁRIO */}
      <div style={{ margin: '16px 16px 0' }}>
        <div style={{ ...S.cardDark, borderRadius: T.r20, overflow: 'hidden', padding: 0 }}>
          <div style={{
            padding: '14px 18px', fontSize: 11, fontWeight: 700,
            letterSpacing: 1.4, textTransform: 'uppercase', color: T.muted,
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span>{editId ? '✏️' : '➕'}</span>
            {editId ? 'Editar escala' : 'Nova escala'}
          </div>

          <div style={{ padding: '16px 18px 4px' }}>
            <label style={{ fontSize: 12, color: T.muted, fontWeight: 600, display: 'block', marginBottom: 6 }}>
              📅 Data
            </label>
            <input type="date" value={data} onChange={e => setData(e.target.value)}
              style={{ ...S.input, marginBottom: 14, background: 'rgba(255,255,255,0.06)', colorScheme: 'dark' }}
            />

            <label style={{ fontSize: 12, color: T.muted, fontWeight: 600, display: 'block', marginBottom: 6 }}>
              👤 Promotor
            </label>
            <select value={promotorId} onChange={e => setPromotorId(e.target.value)}
              style={{ ...S.input, background: '#021d5a', marginBottom: 16 }}
            >
              <option value="">{carregando ? 'Carregando…' : 'Selecione…'}</option>
              {promotores.map(p => (
                <option key={p.id} value={p.id}>{p.nome || p.email || p.id}</option>
              ))}
            </select>
          </div>

          <div style={{ padding: '0 18px 4px' }}>
            <label style={{ fontSize: 12, color: T.muted, fontWeight: 600, display: 'block', marginBottom: 10 }}>
              🏪 Lojas — toque para selecionar
            </label>
          </div>

          {carregando ? (
            <div style={{ padding: '12px 18px 18px', color: T.muted, fontSize: 14 }}>Carregando lojas…</div>
          ) : lojas.length === 0 ? (
            <div style={{ padding: '12px 18px 18px', color: T.muted, fontSize: 14 }}>Nenhuma loja cadastrada.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '0 18px 18px' }}>
              {lojas.map(l => {
                const sel = lojasSel.includes(l.id);
                return (
                  <div key={l.id} onClick={() => toggleLoja(l.id)} style={{
                    padding: '12px 10px', borderRadius: T.r12,
                    fontSize: 13, fontWeight: 600,
                    textAlign: 'center', cursor: 'pointer', transition: T.smooth,
                    background: sel ? `${T.orange}22` : 'rgba(255,255,255,0.06)',
                    border: `1.5px solid ${sel ? T.orange : 'rgba(255,255,255,0.12)'}`,
                    color: sel ? T.orange : T.muted,
                  }}>
                    {sel ? '✓ ' : ''}{l.nome || l.nomeFantasia || '(sem nome)'}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
          {editId && (
            <button onClick={resetForm}
              style={{ ...S.btnGhost, flex: 1, padding: '15px 0', fontSize: 15, fontWeight: 700 }}>
              Cancelar
            </button>
          )}
          <button onClick={salvar} disabled={loading} style={{
            ...S.btnOrange, flex: 1, padding: '15px 0',
            fontSize: 15, borderRadius: T.r16, opacity: loading ? 0.6 : 1,
          }}>
            {loading ? 'Salvando…' : editId ? '✅ Salvar alterações' : '➕ Criar escala'}
          </button>
        </div>
      </div>

      {/* LISTA */}
      <div style={{ padding: '24px 16px 0' }}>
        <div style={{
          fontFamily: T.fontTitle, fontSize: 18,
          letterSpacing: 0.5, marginBottom: 14, color: T.muted, textTransform: 'uppercase',
        }}>
          Escalas cadastradas
        </div>

        {carregando ? (
          <div style={{ ...S.card, padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
            <p style={{ color: T.muted, margin: 0 }}>Carregando escalas…</p>
          </div>
        ) : datasOrdenadas.length === 0 ? (
          <div style={{ ...S.card, padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
            <p style={{ color: T.muted, margin: 0 }}>Nenhuma escala cadastrada ainda.</p>
          </div>
        ) : (
          datasOrdenadas.map(d => (
            <div key={d} style={{ marginBottom: 20 }}>
              <div style={{
                fontSize: 11, fontWeight: 700, letterSpacing: 1.4,
                textTransform: 'uppercase', color: T.orange, marginBottom: 8,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                📅 {formatData(d)}
              </div>

              {porData[d].map((esc, i) => (
                <div key={esc.id} onClick={() => setSheet(esc)} style={{
                  ...S.card, marginBottom: 10, cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  borderLeft: `3px solid ${T.orange}`,
                  animation: `fadeInUp 0.3s ease ${i * 0.05}s both`,
                }}>
                  <div>
                    <div style={{ fontFamily: T.fontTitle, fontSize: 17, color: T.text }}>
                      <TagNome id={esc.promotorId} lista={promotores} tipo="Promotor" />
                    </div>
                    <div style={{ fontSize: 12, color: T.muted, marginTop: 3 }}>
                      🏪 {(esc.lojas || []).slice(0, 2).map(id => nomeLoja(id)).join(', ')}
                      {(esc.lojas || []).length > 2 ? ` +${esc.lojas.length - 2}` : ''}
                    </div>
                  </div>
                  <div style={{
                    background: 'rgba(224,104,32,0.15)',
                    border: `1px solid ${T.orange}`,
                    borderRadius: T.pill, padding: '4px 12px',
                    fontSize: 12, fontWeight: 700, color: T.orange,
                  }}>
                    {(esc.lojas || []).length} loja{(esc.lojas || []).length !== 1 ? 's' : ''}
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* BOTTOM SHEET */}
      {sheet && (
        <>
          <div onClick={() => setSheet(null)} style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', zIndex: 50,
          }} />
          <div style={{
            position: 'fixed', bottom: 0, left: '50%',
            transform: 'translateX(-50%)',
            width: '100%', maxWidth: 480, ...S.cardDark,
            borderRadius: '24px 24px 0 0', zIndex: 51, paddingBottom: 48,
            animation: 'slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1)',
          }}>
            <div style={{ ...S.grabber, paddingTop: 12 }} />
            <div style={{
              fontFamily: T.fontTitle, fontSize: 20,
              padding: '0 20px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)',
            }}>
              Detalhes da Escala
            </div>

            {[
              { icon: '📅', label: 'Data', conteudo: formatData(sheet.data) },
            ].map(row => (
              <div key={row.label} style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: T.r8,
                  background: 'rgba(255,255,255,0.07)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                }}>{row.icon}</div>
                <div>
                  <div style={{ fontSize: 11, color: T.muted, marginBottom: 3, textTransform: 'uppercase', letterSpacing: 1 }}>{row.label}</div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{row.conteudo}</div>
                </div>
              </div>
            ))}

            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 12,
              padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: T.r8, background: 'rgba(255,255,255,0.07)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
              }}>👤</div>
              <div>
                <div style={{ fontSize: 11, color: T.muted, marginBottom: 3, textTransform: 'uppercase', letterSpacing: 1 }}>Promotor</div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>
                  <TagNome id={sheet.promotorId} lista={promotores} tipo="Promotor" />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '16px 20px' }}>
              <div style={{
                width: 36, height: 36, borderRadius: T.r8, background: 'rgba(255,255,255,0.07)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
              }}>🏪</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: T.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                  {(sheet.lojas || []).length} loja(s)
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {(sheet.lojas || []).map(id => (
                    <span key={id} style={{
                      background: 'rgba(3,39,116,0.6)', border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: T.pill, padding: '4px 12px',
                      fontSize: 12, color: '#ccd5ee',
                    }}>
                      <TagNome id={id} lista={lojas} tipo="Loja" />
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, padding: '8px 20px 0' }}>
              <button onClick={() => abrirEdicao(sheet)}
                style={{ ...S.btnGhost, flex: 1, padding: '14px 0', fontSize: 15, fontWeight: 700 }}>
                ✏️ Editar
              </button>
              <button onClick={() => excluir(sheet.id)} disabled={loading} style={{
                ...S.btnOrange, flex: 1, padding: '14px 0', fontSize: 15,
                background: 'linear-gradient(135deg,#b91c1c,#7f1d1d)', opacity: loading ? 0.6 : 1,
              }}>
                🗑️ Excluir
              </button>
            </div>
            <button onClick={() => setSheet(null)} style={{
              ...S.btnGhost, width: 'calc(100% - 40px)', margin: '10px 20px 0', padding: '12px 0', fontSize: 14,
            }}>
              Fechar
            </button>
          </div>
        </>
      )}

      {toast && (
        <div style={{
          position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)',
          background: '#1a2f6e', border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: T.pill, padding: '12px 24px',
          fontSize: 14, color: T.text, fontWeight: 600,
          zIndex: 999, whiteSpace: 'nowrap', boxShadow: T.shadow,
        }}>
          {toast}
        </div>
      )}

      <style>{`
        @keyframes fadeInUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideUp  { from { transform:translateX(-50%) translateY(100%); } to { transform:translateX(-50%) translateY(0); } }
        @keyframes pulsar   { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
      `}</style>
    </div>
  );
}