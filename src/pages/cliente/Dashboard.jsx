import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase/config";
import { useAuth } from "../../context/AuthContext";
import { T, S } from "../../theme/tokens";

const NAV = [
  { key: "lojas",      icon: "🏪", label: "Lojas" },
  { key: "fotos",      icon: "📷", label: "Fotos" },
  { key: "relatorios", icon: "📋", label: "Relatórios" },
  { key: "perfil",     icon: "👤", label: "Perfil" },
];

const LOJAS_MOCK = [
  { id: 1, nome: "Supermercado Central", cidade: "Vitória/ES",   promotor: "João Silva",  fotos: 8, status: "ok" },
  { id: 2, nome: "Atacadão Norte",       cidade: "Serra/ES",     promotor: "Maria Lima",  fotos: 3, status: "pendente" },
  { id: 3, nome: "Mercado do Povo",      cidade: "Cariacica/ES", promotor: "Pedro Souza", fotos: 0, status: "sem_visita" },
];

const STATUS = {
  ok:         { label: "Em dia",      cor: "#4caf50", bg: "rgba(76,175,80,0.12)" },
  pendente:   { label: "Pendente",    cor: "#f9a825", bg: "rgba(249,168,37,0.12)" },
  sem_visita: { label: "Sem visita",  cor: "#f44336", bg: "rgba(244,67,54,0.12)" },
};

export default function ClienteDashboard() {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [aba, setAba] = useState("lojas");
  const nome = userData?.nome || currentUser?.email?.split("@")[0] || "Cliente";

  return (
    <div style={{
      background: `radial-gradient(ellipse at 50% 0%, #0a3572 0%, #032774 50%, #010e2e 100%)`,
      minHeight: "100dvh",
      fontFamily: T.fontBody,
      color: T.text,
      maxWidth: 480,
      margin: "0 auto",
      display: "flex",
      flexDirection: "column",
      position: "relative",
      overflow: "hidden",
    }}>

      {/* Orb */}
      <div style={{
        position: "absolute", width: 260, height: 260, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(224,104,32,0.1) 0%, transparent 70%)",
        top: -60, right: -40, pointerEvents: "none",
      }} />

      {/* HEADER */}
      <div style={{
        padding: "52px 20px 20px",
        ...S.cardDark,
        borderRadius: "0 0 28px 28px",
        borderTop: "none",
        marginBottom: 16,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <p style={{ margin: 0, fontSize: 13, color: T.muted }}>Portal do Cliente</p>
            <h1 style={{ margin: "4px 0 0", fontFamily: T.fontTitle, fontSize: 26, fontWeight: 900 }}>
              Olá, {nome.split(" ")[0]} 👋
            </h1>
          </div>
          <span style={{
            background: "rgba(224,104,32,0.15)", color: T.orange,
            borderRadius: T.pill, padding: "6px 14px",
            fontSize: 12, fontWeight: 600,
          }}>Cliente</span>
        </div>

        {/* Mini resumo */}
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          {[
            { label: "Lojas", valor: LOJAS_MOCK.length },
            { label: "Em dia", valor: LOJAS_MOCK.filter(l => l.status === "ok").length },
            { label: "Pendentes", valor: LOJAS_MOCK.filter(l => l.status !== "ok").length },
          ].map(item => (
            <div key={item.label} style={{
              flex: 1, ...S.card, padding: "10px 8px", textAlign: "center",
            }}>
              <p style={{ margin: 0, fontFamily: T.fontTitle, fontSize: 22, fontWeight: 700, color: T.orange }}>{item.valor}</p>
              <p style={{ margin: 0, fontSize: 11, color: T.muted }}>{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CONTEÚDO */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 100px" }}>

        {/* LOJAS */}
        {aba === "lojas" && (
          <div style={{ animation: "fadeInUp 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}>
            <p style={{ fontFamily: T.fontTitle, fontSize: 18, fontWeight: 700, margin: "0 0 12px" }}>Suas Lojas</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {LOJAS_MOCK.map(loja => {
                const s = STATUS[loja.status];
                return (
                  <div key={loja.id} style={{ ...S.card, padding: 16, borderLeft: `3px solid ${s.cor}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <p style={{ margin: 0, fontFamily: T.fontTitle, fontSize: 18, fontWeight: 700 }}>{loja.nome}</p>
                      <span style={{
                        background: s.bg, color: s.cor,
                        borderRadius: T.pill, padding: "3px 10px",
                        fontSize: 11, fontWeight: 600, whiteSpace: "nowrap", marginLeft: 8,
                      }}>● {s.label}</span>
                    </div>
                    <p style={{ margin: "0 0 2px", fontSize: 13, color: T.muted }}>📍 {loja.cidade}</p>
                    <p style={{ margin: "0 0 12px", fontSize: 13, color: T.muted }}>👤 {loja.promotor}</p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${T.border}`, paddingTop: 10 }}>
                      <span style={{ fontSize: 13, color: T.muted }}>📷 {loja.fotos} fotos hoje</span>
                      <button style={{ ...S.btnOrange, padding: "6px 16px", fontSize: 13, borderRadius: T.r12 }}>
                        Ver detalhes ›
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* FOTOS */}
        {aba === "fotos" && (
          <div style={{ animation: "fadeInUp 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}>
            <p style={{ fontFamily: T.fontTitle, fontSize: 18, fontWeight: 700, margin: "0 0 12px" }}>Fotos de Hoje</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[1,2,3,4].map(i => (
                <div key={i} style={{
                  ...S.card, aspectRatio: "1",
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", gap: 8,
                }}>
                  <span style={{ fontSize: 32 }}>📷</span>
                  <span style={{ color: T.muted, fontSize: 12 }}>Foto {i}</span>
                </div>
              ))}
            </div>
            <p style={{ color: T.muted, fontSize: 12, textAlign: "center", marginTop: 16 }}>
              Fotos reais via Firebase Storage — próxima etapa
            </p>
          </div>
        )}

        {/* RELATÓRIOS */}
        {aba === "relatorios" && (
          <div style={{ animation: "fadeInUp 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}>
            <p style={{ fontFamily: T.fontTitle, fontSize: 18, fontWeight: 700, margin: "0 0 12px" }}>Relatórios</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { loja: "Supermercado Central", data: "27/05/2026", status: "Aprovado" },
                { loja: "Atacadão Norte",       data: "26/05/2026", status: "Pendente" },
              ].map((r, i) => (
                <div key={i} style={{
                  ...S.card, padding: 16,
                  borderLeft: `3px solid ${r.status === "Aprovado" ? "#4caf50" : T.orange}`,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <p style={{ margin: 0, fontFamily: T.fontTitle, fontSize: 17, fontWeight: 700 }}>{r.loja}</p>
                    <span style={{
                      background: r.status === "Aprovado" ? "rgba(76,175,80,0.12)" : "rgba(224,104,32,0.12)",
                      color: r.status === "Aprovado" ? "#4caf50" : T.orange,
                      borderRadius: T.pill, padding: "3px 10px", fontSize: 11, fontWeight: 600,
                    }}>{r.status}</span>
                  </div>
                  <p style={{ margin: "0 0 12px", color: T.muted, fontSize: 13 }}>📅 {r.data}</p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button style={{ ...S.btnGhost, flex: 1, padding: "10px", fontSize: 13 }}>📄 Ver PDF</button>
                    {r.status === "Pendente" && (
                      <button style={{ ...S.btnOrange, flex: 1, padding: "10px", fontSize: 13, borderRadius: T.r12 }}>✓ Aprovar</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PERFIL */}
        {aba === "perfil" && (
          <div style={{ animation: "fadeInUp 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}>
            <div style={{ ...S.cardDark, padding: 24, borderRadius: T.r20, textAlign: "center", marginBottom: 16 }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                background: T.orange, display: "flex", alignItems: "center",
                justifyContent: "center", margin: "0 auto 12px",
                fontFamily: T.fontTitle, fontSize: 28, fontWeight: 700,
              }}>
                {nome[0].toUpperCase()}
              </div>
              <p style={{ margin: "0 0 4px", fontFamily: T.fontTitle, fontSize: 22, fontWeight: 700 }}>{nome}</p>
              <p style={{ margin: 0, fontSize: 13, color: T.muted }}>{currentUser?.email}</p>
              <span style={{
                display: "inline-block", marginTop: 10,
                background: "rgba(59,130,246,0.15)", color: "#3b82f6",
                borderRadius: T.pill, padding: "4px 14px", fontSize: 12, fontWeight: 600,
              }}>Cliente</span>
            </div>
            <button onClick={async () => { await signOut(auth); navigate("/login"); }} style={{
              ...S.btnGhost, width: "100%", padding: 16,
              color: "#ff6b6b", border: "1px solid rgba(244,67,54,0.25)", fontSize: 15,
            }}>
              🚪 Sair da conta
            </button>
          </div>
        )}
      </div>

      {/* BOTTOM NAV */}
      <div style={{
        position: "fixed", bottom: 0, left: "50%",
        transform: "translateX(-50%)",
        width: "100%", maxWidth: 480,
        ...S.cardDark,
        borderRadius: "20px 20px 0 0",
        borderBottom: "none",
        display: "flex",
        padding: "8px 0 20px",
        zIndex: 50,
      }}>
        {NAV.map(item => (
          <button key={item.key} onClick={() => setAba(item.key)} style={{
            flex: 1, background: "none", border: "none", cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            padding: "8px 0", transition: T.smooth,
          }}>
            <span style={{ fontSize: 18 }}>{item.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: aba === item.key ? T.orange : T.muted }}>
              {item.label}
            </span>
            {aba === item.key && (
              <div style={{ width: 4, height: 4, borderRadius: "50%", background: T.orange }} />
            )}
          </button>
        ))}
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}