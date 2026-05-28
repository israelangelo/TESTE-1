// src/pages/gestor/Escala.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase/config";
import { collection, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";

const C = { bg: "#010e2e", card: "#0d1b3e", border: "#1a2f5e", orange: "#E06820", text: "#fff", muted: "#aab4cc", green: "#4caf50", greenBg: "#0a3d1f" };

const DIAS_SEMANA = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

function getDiasDoMes(ano, mes) {
  const dias = [];
  const primeiro = new Date(ano, mes, 1).getDay();
  const total = new Date(ano, mes + 1, 0).getDate();
  for (let i = 0; i < primeiro; i++) dias.push(null);
  for (let i = 1; i <= total; i++) dias.push(i);
  return dias;
}

export default function Escala() {
  const navigate = useNavigate();
  const hoje = new Date();
  const [mes, setMes] = useState(hoje.getMonth());
  const [ano, setAno] = useState(hoje.getFullYear());
  const [diaSel, setDiaSel] = useState(null);
  const [modal, setModal] = useState(false);
  const [visitas, setVisitas] = useState([]);
  const [promotores, setPromotores] = useState([]);
  const [lojas, setLojas] = useState([]);
  const [form, setForm] = useState({ promotor_id: "", promotor_nome: "", loja_id: "", loja_nome: "" });

  const carregar = async () => {
    const [v, p, l] = await Promise.all([
      getDocs(collection(db, "escala")),
      getDocs(collection(db, "usuarios")),
      getDocs(collection(db, "lojas")),
    ]);
    setVisitas(v.docs.map(d => ({ id: d.id, ...d.data() })));
    setPromotores(p.docs.map(d => ({ id: d.id, ...d.data() })).filter(u => u.perfil === "promotor"));
    setLojas(l.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => { carregar(); }, []);

  const diasDoMes = getDiasDoMes(ano, mes);

  const visitasNoDia = (dia) => {
    if (!dia) return [];
    const dataStr = `${ano}-${String(mes+1).padStart(2,"0")}-${String(dia).padStart(2,"0")}`;
    return visitas.filter(v => v.data === dataStr);
  };

  const abrirModal = (dia) => {
    setDiaSel(dia);
    setModal(true);
    setForm({ promotor_id: "", promotor_nome: "", loja_id: "", loja_nome: "" });
  };

  const salvar = async () => {
    if (!form.promotor_id || !form.loja_id) return;
    const dataStr = `${ano}-${String(mes+1).padStart(2,"0")}-${String(diaSel).padStart(2,"0")}`;
    await addDoc(collection(db, "escala"), { ...form, data: dataStr, criadoEm: serverTimestamp() });
    setModal(false);
    carregar();
  };

  const excluir = async (id) => {
    await deleteDoc(doc(db, "escala", id));
    carregar();
  };

  const navMes = (dir) => {
    let nm = mes + dir, na = ano;
    if (nm < 0) { nm = 11; na--; }
    if (nm > 11) { nm = 0; na++; }
    setMes(nm); setAno(na);
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Barlow', sans-serif" }}>

      {/* HEADER */}
      <div style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: "clamp(12px,4vw,20px) clamp(14px,5vw,24px)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => navigate("/gestor")} style={{ background: "none", border: "none", color: C.muted, fontSize: 22, cursor: "pointer" }}>←</button>
          <h1 style={{ margin: 0, fontSize: "clamp(17px,5vw,22px)", fontWeight: 700, color: C.text }}>📅 Escala</h1>
        </div>
      </div>

      <div style={{ padding: "clamp(14px,4vw,20px) clamp(12px,4vw,18px)" }}>

        {/* NAV MÊS */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <button onClick={() => navMes(-1)} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 16px", color: C.text, cursor: "pointer", fontSize: 18 }}>‹</button>
          <h2 style={{ margin: 0, color: C.text, fontSize: "clamp(16px,4vw,20px)", fontWeight: 700 }}>{MESES[mes]} {ano}</h2>
          <button onClick={() => navMes(1)} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 16px", color: C.text, cursor: "pointer", fontSize: 18 }}>›</button>
        </div>

        {/* CABEÇALHO DIAS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
          {DIAS_SEMANA.map(d => (
            <div key={d} style={{ textAlign: "center", color: C.muted, fontSize: "clamp(10px,2.5vw,12px)", fontWeight: 700, padding: "4px 0" }}>{d}</div>
          ))}
        </div>

        {/* CALENDÁRIO */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
          {diasDoMes.map((dia, i) => {
            const vs = visitasNoDia(dia);
            const ehHoje = dia === hoje.getDate() && mes === hoje.getMonth() && ano === hoje.getFullYear();
            return (
              <div key={i} onClick={() => dia && abrirModal(dia)} style={{
                background: ehHoje ? `${C.orange}22` : dia ? C.card : "transparent",
                border: ehHoje ? `1px solid ${C.orange}` : `1px solid ${dia ? C.border : "transparent"}`,
                borderRadius: 10, padding: "clamp(6px,2vw,10px) 4px",
                textAlign: "center", cursor: dia ? "pointer" : "default",
                minHeight: "clamp(48px,10vw,64px)", position: "relative",
              }}>
                {dia && <>
                  <span style={{ color: ehHoje ? C.orange : C.text, fontSize: "clamp(12px,3vw,14px)", fontWeight: ehHoje ? 700 : 400 }}>{dia}</span>
                  {vs.length > 0 && (
                    <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 2 }}>
                      {vs.slice(0,2).map((v, j) => (
                        <div key={j} style={{ background: C.orange, borderRadius: 4, padding: "1px 3px", fontSize: "clamp(8px,2vw,10px)", color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {v.promotor_nome?.split(" ")[0]}
                        </div>
                      ))}
                      {vs.length > 2 && <div style={{ fontSize: 9, color: C.muted }}>+{vs.length - 2}</div>}
                    </div>
                  )}
                </>}
              </div>
            );
          })}
        </div>

        {/* VISITAS DO DIA SELECIONADO */}
        {diaSel && !modal && (
          <div style={{ marginTop: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ margin: 0, color: C.text, fontSize: "clamp(15px,4vw,18px)" }}>Dia {diaSel}/{mes+1}</h3>
              <button onClick={() => abrirModal(diaSel)} style={{ background: C.orange, border: "none", borderRadius: 8, padding: "8px 16px", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: "clamp(12px,3vw,14px)" }}>+ Agendar</button>
            </div>
            {visitasNoDia(diaSel).length === 0
              ? <p style={{ color: C.muted, fontSize: 14 }}>Nenhuma visita agendada.</p>
              : visitasNoDia(diaSel).map(v => (
                <div key={v.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ margin: "0 0 4px", color: C.text, fontWeight: 600, fontSize: "clamp(13px,3.5vw,15px)" }}>👤 {v.promotor_nome}</p>
                    <p style={{ margin: 0, color: C.muted, fontSize: "clamp(11px,3vw,13px)" }}>🏪 {v.loja_nome}</p>
                  </div>
                  <button onClick={() => excluir(v.id)} style={{ background: "#3d0a0a", border: "none", borderRadius: 8, padding: "6px 12px", color: "#f44336", cursor: "pointer", fontSize: 13 }}>✕</button>
                </div>
              ))
            }
          </div>
        )}
      </div>

      {/* MODAL */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "#000a", display: "flex", alignItems: "flex-end", zIndex: 200 }}>
          <div style={{ background: C.card, borderRadius: "20px 20px 0 0", width: "100%", padding: "clamp(20px,5vw,28px)", boxSizing: "border-box" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, color: C.text, fontSize: "clamp(16px,5vw,20px)" }}>Agendar — Dia {diaSel}/{mes+1}</h2>
              <button onClick={() => setModal(false)} style={{ background: "none", border: "none", color: C.muted, fontSize: 24, cursor: "pointer" }}>✕</button>
            </div>

            <label style={{ color: C.muted, fontSize: 13 }}>Promotor</label>
            <select value={form.promotor_id} onChange={e => {
              const p = promotores.find(p => p.id === e.target.value);
              setForm(f => ({ ...f, promotor_id: e.target.value, promotor_nome: p?.nome || "" }));
            }} style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "13px 16px", color: C.text, fontSize: 15, marginBottom: 14, outline: "none", boxSizing: "border-box" }}>
              <option value="">Selecionar promotor</option>
              {promotores.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>

            <label style={{ color: C.muted, fontSize: 13 }}>Loja</label>
            <select value={form.loja_id} onChange={e => {
              const l = lojas.find(l => l.id === e.target.value);
              setForm(f => ({ ...f, loja_id: e.target.value, loja_nome: l?.nome || "" }));
            }} style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "13px 16px", color: C.text, fontSize: 15, marginBottom: 20, outline: "none", boxSizing: "border-box" }}>
              <option value="">Selecionar loja</option>
              {lojas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
            </select>

            <button onClick={salvar} disabled={!form.promotor_id || !form.loja_id} style={{ width: "100%", background: form.promotor_id && form.loja_id ? C.orange : "#333", border: "none", borderRadius: 14, padding: 16, color: "#fff", fontSize: 17, fontWeight: 700, cursor: "pointer" }}>
              Salvar Agendamento
            </button>
          </div>
        </div>
      )}
    </div>
  );
}