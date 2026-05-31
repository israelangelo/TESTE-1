import { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import {
  collection, onSnapshot, addDoc, updateDoc,
  deleteDoc, doc, serverTimestamp,
} from 'firebase/firestore';
import { T, S } from '../../theme/tokens';
import { useBackButton } from '../../hooks/useBackButton';
import GeometricBackground from '../../components/GeometricBackground';
import SidebarGestor from '../../components/SidebarGestor';

export default function GestorClientes() {
  useBackButton();
  const [clientes, setClientes]       = useState([]);
  const [lojas, setLojas]             = useState([]);
  const [menuAberto, setMenuAberto]   = useState(false);
  const [sheet, setSheet]             = useState(false);
  const [selecionado, setSelecionado] = useState(null);
  const [salvando, setSalvando]       = useState(false);
  const [deletando, setDeletando]     = useState(null);
  const [busca, setBusca]             = useState('');

  // form
  const [nome, setNome]         = useState('');
  const [contato, setContato]   = useState('');
  const [lojasIds, setLojasIds] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'clientes'), (snap) => {
      setClientes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'lojas'), (snap) => {
      setLojas(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  function abrirNovo() {
    setSelecionado(null);
    setNome(''); setContato(''); setLojasIds([]);
    setSheet(true);
  }

  function abrirEditar(cliente) {
    setSelecionado(cliente);
    setNome(cliente.nome || '');
    setContato(cliente.contato || '');
    setLojasIds(cliente.lojas || []);
    setSheet(true);
  }

  function toggleLoja(id) {
    setLojasIds((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]
    );
  }

  async function salvar() {
    if (!nome.trim()) return;
    setSalvando(true);
    try {
      const payload = { nome: nome.trim(), contato: contato.trim(), lojas: lojasIds, atualizadoEm: serverTimestamp() };
      if (selecionado) {
        await updateDoc(doc(db, 'clientes', selecionado.id), payload);
      } else {
        await addDoc(collection(db, 'clientes'), { ...payload, criadoEm: serverTimestamp() });
      }
      setSheet(false);
    } catch (e) { console.error(e); }
    setSalvando(false);
  }

  async function excluir(id) {
    setDeletando(id);
    try { await deleteDoc(doc(db, 'clientes', id)); } catch (e) { console.error(e); }
    setDeletando(null);
  }

  const clientesFiltrados = clientes.filter((c) =>
    c.nome?.toLowerCase().includes(busca.toLowerCase())
  );

  const nomeLoja = (id) => lojas.find((l) => l.id === id)?.nome || id;

  return (
    <div style={{ minHeight: '100dvh', fontFamily: T.fontBody, color: T.text, maxWidth: 480, margin: '0 auto', position: 'relative' }}>
      <GeometricBackground />
      <SidebarGestor aberto={menuAberto} onFechar={() => setMenuAberto(false)} />

      {/* HEADER */}
      <div style={{ padding: '52px 20px 16px', ...S.cardDark, borderRadius: '0 0 24px 24px', borderTop: 'none', marginBottom: 0, position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: T.muted }}>Gestão</p>
            <h1 style={{ margin: 0, fontFamily: T.fontTitle, fontSize: 30, fontWeight: 900, letterSpacing: -0.5 }}>🤝 Clientes</h1>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={abrirNovo} style={{ ...S.btnOrange, padding: '10px 16px', fontSize: 13, borderRadius: T.pill }}>+ Novo</button>
            <button onClick={() => setMenuAberto(true)} style={{ ...S.card, border: 'none', padding: '10px 14px', cursor: 'pointer', fontSize: 22 }}>☰</button>
          </div>
        </div>

        {/* busca */}
        <input
          value={busca} onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar cliente..."
          style={{ ...S.input, marginTop: 12, width: '100%', boxSizing: 'border-box' }}
        />
      </div>

      {/* LISTA */}
      <div style={{ padding: '16px 16px 100px', overflowY: 'auto' }}>
        {clientesFiltrados.length === 0 && (
          <div style={{ ...S.card, textAlign: 'center', padding: 40, marginTop: 20 }}>
            <p style={{ fontSize: 32, margin: '0 0 8px' }}>🤝</p>
            <p style={{ color: T.muted, margin: 0 }}>Nenhum cliente cadastrado</p>
          </div>
        )}

        {clientesFiltrados.map((c, i) => (
          <div key={c.id} style={{
            ...S.card, marginBottom: 12, borderLeft: `3px solid ${T.orange}`,
            animation: `fadeInUp 0.3s ease ${i * 0.05}s both`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14 }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: `${T.orange}22`, border: `1.5px solid ${T.orange}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: T.fontTitle, fontSize: 20, color: T.orange, flexShrink: 0,
              }}>
                {(c.nome || '?')[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontFamily: T.fontTitle, fontSize: 17, fontWeight: 700 }}>{c.nome}</p>
                {c.contato && <p style={{ margin: '2px 0 0', fontSize: 12, color: T.muted }}>{c.contato}</p>}
                {(c.lojas || []).length > 0 && (
                  <p style={{ margin: '4px 0 0', fontSize: 11, color: T.muted }}>
                    🏪 {(c.lojas || []).map(nomeLoja).join(', ')}
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button onClick={() => abrirEditar(c)} style={{ ...S.btnGhost, padding: '8px 12px', fontSize: 13 }}>✏️</button>
                <button
                  onClick={() => excluir(c.id)}
                  disabled={deletando === c.id}
                  style={{ ...S.btnGhost, padding: '8px 12px', fontSize: 13, color: T.red, borderColor: `${T.red}44`, opacity: deletando === c.id ? 0.5 : 1 }}>
                  {deletando === c.id ? '...' : '🗑️'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* BOTTOM SHEET */}
      {sheet && (
        <>
          <div onClick={() => setSheet(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }} />
          <div style={{
            position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
            width: '100%', maxWidth: 480, background: '#021d5a',
            borderRadius: '24px 24px 0 0', padding: '24px 20px 40px',
            zIndex: 50, boxShadow: '0 -8px 32px rgba(0,0,0,0.4)',
            maxHeight: '85vh', overflowY: 'auto',
          }}>
            <div style={{ width: 40, height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 2, margin: '0 auto 20px' }} />
            <h2 style={{ fontFamily: T.fontTitle, fontSize: 22, margin: '0 0 20px' }}>
              {selecionado ? 'Editar Cliente' : 'Novo Cliente'}
            </h2>

            <label style={{ fontSize: 12, color: T.muted, display: 'block', marginBottom: 4 }}>Nome *</label>
            <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do cliente"
              style={{ ...S.input, width: '100%', boxSizing: 'border-box', marginBottom: 14 }} />

            <label style={{ fontSize: 12, color: T.muted, display: 'block', marginBottom: 4 }}>Contato</label>
            <input value={contato} onChange={(e) => setContato(e.target.value)} placeholder="Telefone ou e-mail"
              style={{ ...S.input, width: '100%', boxSizing: 'border-box', marginBottom: 14 }} />

            <label style={{ fontSize: 12, color: T.muted, display: 'block', marginBottom: 8 }}>Lojas vinculadas</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {lojas.map((l) => {
                const sel = lojasIds.includes(l.id);
                return (
                  <button key={l.id} onClick={() => toggleLoja(l.id)} style={{
                    ...S.btnGhost, padding: '10px 14px', textAlign: 'left', fontSize: 14,
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: sel ? 'rgba(224,104,32,0.15)' : undefined,
                    borderColor: sel ? T.orange : undefined,
                    color: sel ? T.orange : T.text,
                  }}>
                    <span>{sel ? '✅' : '⬜'}</span> {l.nome}
                  </button>
                );
              })}
              {lojas.length === 0 && <p style={{ color: T.muted, fontSize: 13, margin: 0 }}>Nenhuma loja cadastrada</p>}
            </div>

            <button onClick={salvar} disabled={salvando || !nome.trim()} style={{
              ...S.btnOrange, width: '100%', padding: 16, fontSize: 16,
              opacity: salvando || !nome.trim() ? 0.6 : 1,
            }}>
              {salvando ? 'Salvando...' : selecionado ? 'Salvar alterações' : 'Cadastrar cliente'}
            </button>
          </div>
        </>
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
