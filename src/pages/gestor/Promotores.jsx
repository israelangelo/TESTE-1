import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection, getDocs, doc, updateDoc, setDoc
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword
} from "firebase/auth";
import { db, auth } from "../../firebase/config";

export default function Promotores() {
  const navigate = useNavigate();
  const [promotores, setPromotores] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nome: "", email: "", senha: "", telefone: ""
  });

  const carregar = async () => {
    const snap = await getDocs(collection(db, "usuarios"));
    const lista = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(u => u.perfil === "promotor");
    setPromotores(lista);
  };

  useEffect(() => { carregar(); }, []);

  const criar = async () => {
    if (!form.nome || !form.email || !form.senha) {
      alert("Preencha nome, email e senha!");
      return;
    }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(
        auth, form.email, form.senha
      );
      await setDoc(doc(db, "usuarios", cred.user.uid), {
        nome: form.nome,
        email: form.email,
        telefone: form.telefone,
        perfil: "promotor",
        ativo: true,
        criadoEm: new Date().toISOString(),
      });
      setForm({ nome: "", email: "", senha: "", telefone: "" });
      setShowForm(false);
      carregar();
    } catch (e) {
      alert("Erro: " + e.message);
    }
    setLoading(false);
  };

  const toggleAtivo = async (id, atual) => {
    await updateDoc(doc(db, "usuarios", id), { ativo: !atual });
    carregar();
  };

  return (
    <div style={s.bg}>
      <div style={s.header}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button onClick={() => navigate("/gestor")} style={s.voltar}>← Voltar</button>
          <div>
            <h1 style={s.logo}>BOX</h1>
            <span style={s.sub}>AGÊNCIA</span>
          </div>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={s.btnOrange}>
          {showForm ? "Cancelar" : "+ Novo Promotor"}
        </button>
      </div>

      {showForm && (
        <div style={s.formBox}>
          <h3 style={s.formTitle}>Novo Promotor</h3>
          <div style={s.formGrid}>
            <input
              style={s.input}
              placeholder="Nome completo"
              value={form.nome}
              onChange={e => setForm({ ...form, nome: e.target.value })}
            />
            <input
              style={s.input}
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
            />
            <input
              style={s.input}
              placeholder="Senha (mín. 6 caracteres)"
              type="password"
              value={form.senha}
              onChange={e => setForm({ ...form, senha: e.target.value })}
            />
            <input
              style={s.input}
              placeholder="Telefone"
              value={form.telefone}
              onChange={e => setForm({ ...form, telefone: e.target.value })}
            />
          </div>
          <button onClick={criar} style={s.btnOrange} disabled={loading}>
            {loading ? "Criando..." : "Criar Promotor"}
          </button>
        </div>
      )}

      <div style={s.content}>
        <h2 style={s.titulo}>Promotores ({promotores.length})</h2>
        {promotores.length === 0 ? (
          <p style={s.vazio}>Nenhum promotor cadastrado ainda.</p>
        ) : (
          <div style={s.lista}>
            {promotores.map(p => (
              <div key={p.id} style={s.card}>
                <div style={s.avatar}>
                  {p.nome?.charAt(0).toUpperCase()}
                </div>
                <div style={s.info}>
                  <p style={s.nome}>{p.nome}</p>
                  <p style={s.detalhe}>{p.email}</p>
                  <p style={s.detalhe}>{p.telefone || "—"}</p>
                </div>
                <div style={s.badge(p.ativo)}>
                  {p.ativo ? "Ativo" : "Inativo"}
                </div>
                <button
                  onClick={() => toggleAtivo(p.id, p.ativo)}
                  style={s.btnToggle(p.ativo)}
                >
                  {p.ativo ? "Desativar" : "Ativar"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  bg: {
    minHeight: "100vh",
    background: "#010e2e",
    fontFamily: "'Barlow', sans-serif",
    paddingBottom: "40px",
  },
  header: {
    background: "#0d1b3e",
    borderBottom: "2px solid #E06820",
    padding: "16px 32px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: {
    color: "#E06820", fontSize: "24px", fontWeight: "800",
    margin: 0, letterSpacing: "4px",
  },
  sub: { color: "#aab4cc", fontSize: "10px", letterSpacing: "4px" },
  voltar: {
    background: "transparent", border: "1px solid #1a2f5e",
    color: "#aab4cc", padding: "8px 14px", borderRadius: "6px",
    cursor: "pointer", fontSize: "13px",
  },
  btnOrange: {
    background: "#E06820", border: "none", color: "#fff",
    padding: "10px 24px", borderRadius: "8px", cursor: "pointer",
    fontWeight: "700", fontSize: "14px",
  },
  formBox: {
    background: "#0d1b3e", border: "1px solid #E06820",
    borderRadius: "12px", margin: "24px 32px", padding: "24px",
  },
  formTitle: { color: "#E06820", margin: "0 0 16px", fontSize: "16px" },
  formGrid: {
    display: "grid", gridTemplateColumns: "repeat(2, 1fr)",
    gap: "12px", marginBottom: "16px",
  },
  input: {
    background: "#010e2e", border: "1px solid #1a2f5e",
    borderRadius: "8px", padding: "12px 16px", color: "#fff",
    fontSize: "14px", fontFamily: "'Barlow', sans-serif", width: "100%",
    boxSizing: "border-box",
  },
  content: { padding: "24px 32px" },
  titulo: { color: "#fff", fontSize: "18px", marginBottom: "16px" },
  vazio: { color: "#aab4cc", fontSize: "14px" },
  lista: { display: "flex", flexDirection: "column", gap: "12px" },
  card: {
    background: "#0d1b3e", border: "1px solid #1a2f5e",
    borderRadius: "12px", padding: "16px 24px",
    display: "flex", alignItems: "center", gap: "16px",
  },
  avatar: {
    width: "48px", height: "48px", borderRadius: "50%",
    background: "#E06820", color: "#fff", fontSize: "20px",
    fontWeight: "800", display: "flex", alignItems: "center",
    justifyContent: "center", flexShrink: 0,
  },
  info: { flex: 1 },
  nome: { color: "#fff", fontWeight: "700", margin: "0 0 4px", fontSize: "15px" },
  detalhe: { color: "#aab4cc", fontSize: "13px", margin: "2px 0" },
  badge: (ativo) => ({
    padding: "4px 12px", borderRadius: "20px", fontSize: "12px",
    fontWeight: "700",
    background: ativo ? "#0a3d1f" : "#3d0a0a",
    color: ativo ? "#4caf50" : "#f44336",
  }),
  btnToggle: (ativo) => ({
    background: "transparent",
    border: `1px solid ${ativo ? "#f44336" : "#4caf50"}`,
    color: ativo ? "#f44336" : "#4caf50",
    padding: "6px 16px", borderRadius: "6px",
    cursor: "pointer", fontSize: "13px",
  }),
};