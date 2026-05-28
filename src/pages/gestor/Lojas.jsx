// src/pages/gestor/Lojas.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase/config";
import { collection, getDocs, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";

const C = {
  bg: "#010e2e", card: "#0d1b3e", border: "#1a2f5e",
  orange: "#E06820", text: "#ffffff", muted: "#aab4cc",
  green: "#4caf50", greenBg: "#0a3d1f",
  red: "#f44336", redBg: "#3d0a0a",
};

const VAZIO = { nome: "", endereco: "", cidade: "", cliente_id: "", promotor_id: "", ativo: true };

export default function Lojas() {
  const navigate = useNavigate();
  const [lojas, setLojas] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(VAZIO);
  const [loading, setLoading] = useState(true);

  const carregar = async () => {
    setLoading(true);
    const snap = await getDocs(collection(db, "lojas"));
    setLojas(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  useEffect(() => { carregar(); }, []);

  const salvar = async () => {
    if (!form.nome.trim()) return;
    await addDoc(collection(db, "lojas"), { ...form, criadoEm: serverTimestamp() });
    setModal(false);
    setForm(VAZIO);
    carregar();
  };

  const toggleAtivo = async (loja) => {
    await updateDoc(doc(db, "lojas", loja.id), { ativo: !loja.ativo });
    carregar();
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Barlow', sans-serif", width: "100%" }}>

      {/* HEADER */}
      <div style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: "clamp(12px,4vw,20px) clamp(14px,5vw,24px)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => navigate("/gestor")} style={{ background: "none", border: "none", color: C.muted, fontSize: 22, cursor: "pointer" }}>←</button>
          <div>
            <p style={{ margin: 0, fontSize: "clamp(11px,3vw,13px)", color: C.muted }}>Gestão</p>
            <h1 style={{ margin: 0, fontSize: "clamp(17px,5vw,22px)", fontWeight: 700, color: C.text }}>🏪 Lojas</h1>
          </div>
        </div>
        <button onClick={() => setModal(true)} style={{ background: C.orange, border: "none", borderRadius: 10, padding: "clamp(8px,2vw,10px) clamp(12px,3vw,18px)", color: "#fff", fontWeight: 700, fontSize: "clamp(13px,3vw,15px)", cursor: "pointer" }}>
          + Nova Loja
        </button>
      </div>

      {/* LISTA */}
      <div style={{ padding: "clamp(14px,4vw,20px) clamp(12px,4vw,18px)" }}>
        {loading && <p style={{ color: C.muted, textAlign: "center" }}>Carregando...</p>}

        {!loading && lojas.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <p style={{ fontSize: 48 }}>🏪</p>
            <p style={{ color: C.muted }}>Nenhuma loja cadastrada ainda.</p>
            <button onClick={() => setModal(true)} style={{ background: C.orange, border: "none", borderRadius: 12, padding: "14px 28px", color: "#fff", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>
              Cadastrar primeira loja
            </button>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {lojas.map(loja => (
            <div key={loja.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "clamp(14px,4vw,18px)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <p style={{ margin: 0, fontSize: "clamp(15px,4vw,17px)", fontWeight: 700, color: C.text }}>{loja.nome}</p>
                <span style={{ background: loja.ativo ? C.greenBg : C.redBg, color: loja.ativo ? C.green : C.red, borderRadius: 8, padding: "3px 10px", fontSize: "clamp(10px,2.5vw,12px)", fontWeight: 600 }}>
                  {loja.ativo ? "● Ativa" : "● Inativa"}
                </span>
              </div>
              {loja.endereco && <p style={{ margin: "0 0 2px", color: C.muted, fontSize: "clamp(12px,3vw,14px)" }}>📍 {loja.endereco}</p>}
              {loja.cidade && <p style={{ margin: "0 0 10px", color: C.muted, fontSize: "clamp(12px,3vw,14px)" }}>🏙️ {loja.cidade}</p>}
              <button onClick={() => toggleAtivo(loja)} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 14px", color: C.muted, fontSize: "clamp(12px,3vw,13px)", cursor: "pointer" }}>
                {loja.ativo ? "Desativar" : "Ativar"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL NOVA LOJA */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "#000a", display: "flex", alignItems: "flex-end", zIndex: 200 }}>
          <div style={{ background: C.card, borderRadius: "20px 20px 0 0", width: "100%", padding: "clamp(20px,5vw,28px)", boxSizing: "border-box" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, color: C.text, fontSize: "clamp(17px,5vw,20px)" }}>Nova Loja</h2>
              <button onClick={() => setModal(false)} style={{ background: "none", border: "none", color: C.muted, fontSize: 24, cursor: "pointer" }}>✕</button>
            </div>

            {[["nome","Nome da loja *"],["endereco","Endereço"],["cidade","Cidade"]].map(([key, label]) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <label style={{ display: "block", color: C.muted, fontSize: 13, marginBottom: 6 }}>{label}</label>
                <input
                  value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "13px 16px", color: C.text, fontSize: 15, outline: "none", boxSizing: "border-box" }}
                />
              </div>
            ))}

            <button onClick={salvar} style={{ width: "100%", background: C.orange, border: "none", borderRadius: 14, padding: "16px", color: "#fff", fontSize: 17, fontWeight: 700, cursor: "pointer", marginTop: 4 }}>
              Salvar Loja
            </button>
          </div>
        </div>
      )}
    </div>
  );
}