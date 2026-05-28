// src/pages/cliente/Dashboard.jsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase/config";
import { useAuth } from "../../context/AuthContext";

const C = {
  bg: "#010e2e", card: "#0d1b3e", border: "#1a2f5e",
  orange: "#E06820", text: "#ffffff", muted: "#aab4cc",
  green: "#4caf50", greenBg: "#0a3d1f",
};

const LOJAS_MOCK = [
  { id: 1, nome: "Supermercado Central", cidade: "Vitória/ES", promotor: "João Silva", fotos: 8, status: "ok" },
  { id: 2, nome: "Atacadão Norte", cidade: "Serra/ES", promotor: "Maria Lima", fotos: 3, status: "pendente" },
  { id: 3, nome: "Mercado do Povo", cidade: "Cariacica/ES", promotor: "Pedro Souza", fotos: 0, status: "sem_visita" },
];

export default function ClienteDashboard() {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [aba, setAba] = useState("lojas");
  const nome = userData?.nome || currentUser?.email?.split("@")[0] || "Cliente";

  const logout = async () => { await signOut(auth); navigate("/login"); };

  const statusInfo = {
    ok: { label: "● Em dia", cor: "#4caf50", bg: "#0a3d1f" },
    pendente: { label: "● Pendente", cor: "#f9a825", bg: "#3d2a00" },
    sem_visita: { label: "● Sem visita", cor: "#f44336", bg: "#3d0a0a" },
  };

  return (
    <div style={{
      background: C.bg, minHeight: "100vh",
      fontFamily: "'Barlow', sans-serif",
      width: "100%", maxWidth: 480, margin: "0 auto",
      boxSizing: "border-box",
    }}>

      {/* HEADER */}
      <div style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: "clamp(12px,4vw,20px) clamp(14px,5vw,24px)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ margin: 0, fontSize: "clamp(11px,3vw,13px)", color: C.muted }}>Portal do Cliente</p>
          <h1 style={{ margin: "2px 0 0", fontSize: "clamp(17px,5vw,22px)", fontWeight: 700, color: C.text }}>Olá, {nome.split(" ")[0]} 👋</h1>
        </div>
        <button onClick={logout} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 14px", color: C.muted, fontSize: "clamp(12px,3vw,14px)", cursor: "pointer" }}>
          Sair
        </button>
      </div>

      {/* ABAS */}
      <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, background: C.card }}>
        {[["lojas", "🏪 Lojas"], ["fotos", "📷 Fotos"], ["relatorios", "📋 Relatórios"]].map(([key, label]) => (
          <button key={key} onClick={() => setAba(key)} style={{
            flex: 1, background: "none", border: "none",
            borderBottom: aba === key ? `2px solid ${C.orange}` : "2px solid transparent",
            color: aba === key ? C.orange : C.muted,
            padding: "clamp(10px,3vw,14px) 0",
            fontSize: "clamp(11px,3vw,13px)", fontWeight: aba === key ? 700 : 400,
            cursor: "pointer",
          }}>{label}</button>
        ))}
      </div>

      {/* CONTEÚDO */}
      <div style={{ padding: "clamp(14px,4vw,20px) clamp(12px,4vw,18px)" }}>

        {/* LOJAS */}
        {aba === "lojas" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {LOJAS_MOCK.map(loja => {
              const s = statusInfo[loja.status];
              return (
                <div key={loja.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "clamp(14px,4vw,18px)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <p style={{ margin: 0, fontSize: "clamp(15px,4vw,17px)", fontWeight: 700, color: C.text }}>{loja.nome}</p>
                    <span style={{ background: s.bg, color: s.cor, borderRadius: 8, padding: "3px 10px", fontSize: "clamp(10px,2.5vw,12px)", fontWeight: 600, whiteSpace: "nowrap", marginLeft: 8 }}>{s.label}</span>
                  </div>
                  <p style={{ margin: "0 0 4px", fontSize: "clamp(12px,3vw,14px)", color: C.muted }}>📍 {loja.cidade}</p>
                  <p style={{ margin: "0 0 10px", fontSize: "clamp(12px,3vw,14px)", color: C.muted }}>👤 {loja.promotor}</p>
                  <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: C.muted, fontSize: "clamp(12px,3vw,13px)" }}>📷 {loja.fotos} fotos hoje</span>
                    <button style={{ background: C.orange, border: "none", borderRadius: 8, padding: "6px 14px", color: "#fff", fontSize: "clamp(12px,3vw,13px)", fontWeight: 600, cursor: "pointer" }}>
                      Ver detalhes
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* FOTOS */}
        {aba === "fotos" && (
          <div>
            <p style={{ color: C.muted, fontSize: "clamp(13px,3.5vw,15px)", marginBottom: 16 }}>Fotos enviadas hoje pelos promotores</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
              {[1,2,3,4].map(i => (
                <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, aspectRatio: "1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <span style={{ fontSize: "clamp(28px,8vw,36px)" }}>📷</span>
                  <span style={{ color: C.muted, fontSize: "clamp(10px,2.5vw,12px)" }}>Foto {i}</span>
                </div>
              ))}
            </div>
            <p style={{ color: C.muted, fontSize: "clamp(11px,3vw,13px)", marginTop: 16, textAlign: "center" }}>
              Integração com Firestore Storage — Etapa 11
            </p>
          </div>
        )}

        {/* RELATÓRIOS */}
        {aba === "relatorios" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { loja: "Supermercado Central", data: "27/05/2026", status: "Aprovado" },
              { loja: "Atacadão Norte", data: "26/05/2026", status: "Pendente" },
            ].map((r, i) => (
              <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "clamp(14px,4vw,18px)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <p style={{ margin: 0, fontSize: "clamp(14px,4vw,16px)", fontWeight: 700, color: C.text }}>{r.loja}</p>
                  <span style={{
                    background: r.status === "Aprovado" ? "#0a3d1f" : "#3d2a00",
                    color: r.status === "Aprovado" ? C.green : "#f9a825",
                    borderRadius: 8, padding: "3px 10px",
                    fontSize: "clamp(10px,2.5vw,12px)", fontWeight: 600,
                  }}>{r.status}</span>
                </div>
                <p style={{ margin: "0 0 12px", color: C.muted, fontSize: "clamp(12px,3vw,13px)" }}>📅 {r.data}</p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={{ flex: 1, background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px", color: C.muted, fontSize: "clamp(12px,3vw,13px)", cursor: "pointer" }}>Ver PDF</button>
                  {r.status === "Pendente" && (
                    <button style={{ flex: 1, background: C.orange, border: "none", borderRadius: 8, padding: "8px", color: "#fff", fontSize: "clamp(12px,3vw,13px)", fontWeight: 600, cursor: "pointer" }}>Aprovar</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}