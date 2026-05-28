import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection, addDoc, getDocs, updateDoc, deleteDoc,
  doc, serverTimestamp, query, orderBy
} from "firebase/firestore";
import { db } from "../../firebase/config";

export default function Clientes() {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [modalVisivel, setModalVisivel] = useState(false);
  const [editando, setEditando] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmVisivel, setConfirmVisivel] = useState(false);
  const [form, setForm] = useState({ nome: "", empresa: "", email: "", telefone: "" });
  const [salvando, setSalvando] = useState(false);
  const [busca, setBusca] = useState("");
  const timerRef = useRef(null);

  useEffect(() => { buscarClientes(); }, []);

  // Abre modal com animação
  function abrirModal() {
    setModalAberto(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setModalVisivel(true));
    });
  }

  // Fecha modal com animação
  function fecharModal() {
    setModalVisivel(false);
    timerRef.current = setTimeout(() => setModalAberto(false), 380);
  }

  function abrirConfirm(id) {
    setConfirmDelete(id);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setConfirmVisivel(true));
    });
  }

  function fecharConfirm() {
    setConfirmVisivel(false);
    setTimeout(() => setConfirmDelete(null), 380);
  }

  useEffect(() => () => clearTimeout(timerRef.current), []);

  async function buscarClientes() {
    setCarregando(true);
    try {
      const q = query(collection(db, "clientes"), orderBy("criadoEm", "desc"));
      const snap = await getDocs(q);
      setClientes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch {
      const snap = await getDocs(collection(db, "clientes"));
      setClientes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }
    setCarregando(false);
  }

  function abrirNovo() {
    setEditando(null);
    setForm({ nome: "", empresa: "", email: "", telefone: "" });
    abrirModal();
  }

  function abrirEditar(c) {
    setEditando(c.id);
    setForm({ nome: c.nome, empresa: c.empresa, email: c.email, telefone: c.telefone });
    abrirModal();
  }

  async function salvar() {
    if (!form.nome.trim() || !form.empresa.trim()) return;
    setSalvando(true);
    try {
      if (editando) {
        await updateDoc(doc(db, "clientes", editando), { ...form });
      } else {
        await addDoc(collection(db, "clientes"), { ...form, ativo: true, criadoEm: serverTimestamp() });
      }
      fecharModal();
      buscarClientes();
    } catch (e) { console.error(e); }
    setSalvando(false);
  }

  async function toggleAtivo(c) {
    await updateDoc(doc(db, "clientes", c.id), { ativo: !c.ativo });
    buscarClientes();
  }

  async function deletar(id) {
    await deleteDoc(doc(db, "clientes", id));
    fecharConfirm();
    buscarClientes();
  }

  const filtrados = clientes.filter(c =>
    c.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    c.empresa?.toLowerCase().includes(busca.toLowerCase())
  );

  // Estilos dinâmicos do modal (animação)
  const modalStyle = {
    ...s.modal,
    transform: modalVisivel ? "translateY(0)" : "translateY(100%)",
    transition: "transform 0.38s cubic-bezier(0.32, 0.72, 0, 1)",
  };

  const overlayStyle = {
    ...s.overlay,
    backgroundColor: modalVisivel ? "rgba(1,14,46,0.7)" : "rgba(1,14,46,0)",
    transition: "background-color 0.38s ease",
  };

  const confirmModalStyle = {
    ...s.modal,
    transform: confirmVisivel ? "translateY(0)" : "translateY(100%)",
    transition: "transform 0.38s cubic-bezier(0.32, 0.72, 0, 1)",
    alignItems: "center",
    textAlign: "center",
  };

  const confirmOverlayStyle = {
    ...s.overlay,
    backgroundColor: confirmVisivel ? "rgba(1,14,46,0.7)" : "rgba(1,14,46,0)",
    transition: "background-color 0.38s ease",
  };

  return (
    <div style={s.bg}>

      {/* HEADER */}
      <div style={s.header}>
        <button style={s.voltar} onClick={() => navigate("/gestor")}>← Voltar</button>
        <h1 style={s.titulo}>Clientes</h1>
        <button style={s.btnNovo} onClick={abrirNovo}>+ Novo</button>
      </div>

      {/* BUSCA */}
      <input
        style={s.busca}
        placeholder="🔍 Buscar cliente ou empresa..."
        value={busca}
        onChange={e => setBusca(e.target.value)}
      />

      {/* LISTA */}
      {carregando ? (
        <div style={s.centro}><p style={s.loading}>Carregando...</p></div>
      ) : filtrados.length === 0 ? (
        <div style={s.vazio}>
          <span style={{ fontSize: 52 }}>👥</span>
          <p style={{ color: "#aab4cc", marginTop: 12, fontSize: 15 }}>Nenhum cliente cadastrado</p>
        </div>
      ) : (
        <div style={s.lista}>
          {filtrados.map(c => (
            <div key={c.id} style={s.card}>
              <div style={s.cardTop}>
                <div style={s.avatar}>{c.nome?.[0]?.toUpperCase() || "?"}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={s.nome}>{c.nome}</p>
                  <p style={s.empresa}>{c.empresa}</p>
                </div>
                <span style={{ ...s.badge, ...(c.ativo ? s.badgeOn : s.badgeOff) }}>
                  {c.ativo ? "Ativo" : "Inativo"}
                </span>
              </div>

              {(c.email || c.telefone) && (
                <div style={s.cardInfo}>
                  {c.email && <p style={s.info}>✉️ {c.email}</p>}
                  {c.telefone && <p style={s.info}>📱 {c.telefone}</p>}
                </div>
              )}

              <div style={s.acoes}>
                <button style={s.btnEditar} onClick={() => abrirEditar(c)}>✏️ Editar</button>
                <button style={s.btnToggle} onClick={() => toggleAtivo(c)}>
                  {c.ativo ? "⛔ Desativar" : "✅ Ativar"}
                </button>
                <button style={s.btnDel} onClick={() => abrirConfirm(c.id)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL CADASTRO / EDIÇÃO */}
      {modalAberto && (
        <div style={overlayStyle} onClick={fecharModal}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>

            <div style={s.alca} />

            <h2 style={s.modalTitulo}>
              {editando ? "✏️ Editar Cliente" : "➕ Novo Cliente"}
            </h2>

            <div style={s.modalScroll}>
              {[
                { label: "Nome *", key: "nome", placeholder: "Nome do responsável", type: "text" },
                { label: "Empresa *", key: "empresa", placeholder: "Nome da empresa", type: "text" },
                { label: "Email", key: "email", placeholder: "email@empresa.com", type: "email" },
                { label: "Telefone", key: "telefone", placeholder: "(11) 99999-9999", type: "tel" },
              ].map(f => (
                <div key={f.key} style={s.campo}>
                  <label style={s.label}>{f.label}</label>
                  <input
                    style={s.input}
                    type={f.type}
                    placeholder={f.placeholder}
                    value={form[f.key]}
                    onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  />
                </div>
              ))}
            </div>

            <div style={s.modalBtns}>
              <button style={s.btnCancelar} onClick={fecharModal}>Cancelar</button>
              <button
                style={{ ...s.btnSalvar, opacity: salvando ? 0.7 : 1 }}
                onClick={salvar}
                disabled={salvando}
              >
                {salvando ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE */}
      {confirmDelete && (
        <div style={confirmOverlayStyle} onClick={fecharConfirm}>
          <div style={confirmModalStyle} onClick={e => e.stopPropagation()}>
            <div style={s.alca} />
            <span style={{ fontSize: 52, marginTop: 8 }}>🗑️</span>
            <h2 style={{ ...s.modalTitulo, marginTop: 12 }}>Excluir cliente?</h2>
            <p style={{ color: "#aab4cc", fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
              Essa ação não pode ser desfeita.
            </p>
            <div style={s.modalBtns}>
              <button style={s.btnCancelar} onClick={fecharConfirm}>Cancelar</button>
              <button style={{ ...s.btnSalvar, backgroundColor: "#f44336" }} onClick={() => deletar(confirmDelete)}>
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  bg: {
    minHeight: "100vh",
    backgroundColor: "#010e2e",
    padding: "24px 16px 40px",
    fontFamily: "'Barlow', sans-serif",
    boxSizing: "border-box",
  },
  header: { display: "flex", alignItems: "center", gap: 10, marginBottom: 16 },
  voltar: {
    background: "none", border: "1px solid #1a2f5e", color: "#aab4cc",
    borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontSize: 13,
    whiteSpace: "nowrap", flexShrink: 0,
  },
  titulo: {
    color: "#fff", fontSize: "clamp(16px, 5vw, 22px)", fontWeight: 700,
    margin: 0, flex: 1,
  },
  btnNovo: {
    backgroundColor: "#E06820", color: "#fff", border: "none",
    borderRadius: 10, padding: "10px 16px", fontWeight: 700,
    fontSize: 14, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
  },
  busca: {
    width: "100%", boxSizing: "border-box", backgroundColor: "#0d1b3e",
    border: "1px solid #1a2f5e", borderRadius: 10, padding: "13px 14px",
    color: "#fff", fontSize: 15, marginBottom: 16, outline: "none",
  },
  lista: { display: "flex", flexDirection: "column", gap: 12 },
  card: {
    backgroundColor: "#0d1b3e", border: "1px solid #1a2f5e",
    borderRadius: 14, padding: 16, display: "flex", flexDirection: "column", gap: 12,
  },
  cardTop: { display: "flex", alignItems: "center", gap: 12 },
  avatar: {
    width: 46, height: 46, borderRadius: "50%", backgroundColor: "#E06820",
    color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 700, fontSize: 20, flexShrink: 0,
  },
  nome: { color: "#fff", fontWeight: 700, fontSize: 15, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  empresa: { color: "#aab4cc", fontSize: 13, margin: "3px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  badge: { borderRadius: 20, padding: "4px 10px", fontSize: 12, fontWeight: 600, flexShrink: 0 },
  badgeOn: { backgroundColor: "#0a3d1f", color: "#4caf50" },
  badgeOff: { backgroundColor: "#3d0a0a", color: "#f44336" },
  cardInfo: { display: "flex", flexDirection: "column", gap: 4, borderTop: "1px solid #1a2f5e", paddingTop: 10 },
  info: { color: "#aab4cc", fontSize: 13, margin: 0 },
  acoes: { display: "flex", gap: 8 },
  btnEditar: { flex: 1, backgroundColor: "#1a2f5e", color: "#fff", border: "none", borderRadius: 8, padding: "11px 0", fontSize: 13, cursor: "pointer", fontWeight: 600 },
  btnToggle: { flex: 1, backgroundColor: "#1a2f5e", color: "#fff", border: "none", borderRadius: 8, padding: "11px 0", fontSize: 13, cursor: "pointer", fontWeight: 600 },
  btnDel: { backgroundColor: "#3d0a0a", color: "#f44336", border: "none", borderRadius: 8, padding: "11px 14px", fontSize: 16, cursor: "pointer", flexShrink: 0 },
  vazio: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginTop: 80 },
  centro: { display: "flex", justifyContent: "center", marginTop: 60 },
  loading: { color: "#E06820", fontSize: 16 },
  overlay: {
    position: "fixed", inset: 0,
    display: "flex", alignItems: "flex-end", justifyContent: "center",
    zIndex: 999,
  },
  modal: {
    backgroundColor: "#0d1b3e",
    border: "1px solid #1a2f5e",
    borderRadius: "20px 20px 0 0",
    padding: "12px 20px 40px",
    width: "100%",
    maxWidth: 520,
    maxHeight: "90vh",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
    willChange: "transform",
  },
  alca: {
    width: 36, height: 4, backgroundColor: "#1a2f5e",
    borderRadius: 4, alignSelf: "center", marginBottom: 20, flexShrink: 0,
  },
  modalTitulo: { color: "#fff", fontSize: 18, fontWeight: 700, margin: "0 0 16px", flexShrink: 0 },
  modalScroll: { overflowY: "auto", flex: 1, paddingRight: 2 },
  campo: { display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 },
  label: { color: "#aab4cc", fontSize: 13, fontWeight: 500 },
  input: {
    backgroundColor: "#010e2e", border: "1px solid #1a2f5e", borderRadius: 10,
    padding: "13px 14px", color: "#fff", fontSize: 15, outline: "none",
    boxSizing: "border-box", width: "100%",
  },
  modalBtns: { display: "flex", gap: 10, marginTop: 16, flexShrink: 0 },
  btnCancelar: {
    flex: 1, backgroundColor: "#1a2f5e", color: "#aab4cc", border: "none",
    borderRadius: 10, padding: 15, fontSize: 15, fontWeight: 600, cursor: "pointer",
  },
  btnSalvar: {
    flex: 1, backgroundColor: "#E06820", color: "#fff", border: "none",
    borderRadius: 10, padding: 15, fontSize: 15, fontWeight: 700, cursor: "pointer",
  },
};