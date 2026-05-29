import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { T, S } from "../../theme/tokens";

const NAV = [
  { path: "/gestor",               icon: "⊞", label: "Início" },
  { path: "/gestor/promotores",    icon: "👥", label: "Equipe" },
  { path: "/gestor/lojas",         icon: "🏪", label: "Lojas" },
  { path: "/gestor/relatorios",    icon: "📊", label: "Relatórios" },
  { path: "/gestor/configuracoes", icon: "⚙️", label: "Config" },
];

const MENU_ITEMS = [
  { label: "👥 Promotores",  path: "/gestor/promotores" },
  { label: "🏪 Lojas",       path: "/gestor/lojas" },
  { label: "📅 Escala",      path: "/gestor/escala" },
  { label: "📊 Relatórios",  path: "/gestor/relatorios" },
  { label: "💼 Clientes",    path: "/gestor/clientes" },
  { label: "⚙️ Config",      path: "/gestor/configuracoes" },
];

const CARDS = [
  { label: "Lojas Visitadas", valor: "0", cor: T.orange,  icon: "🏪" },
  { label: "Check-ins Hoje",  valor: "0", cor: "#4caf50", icon: "📍" },
  { label: "Fotos Enviadas",  valor: "0", cor: "#3b82f6", icon: "📷" },
  { label: "Pendentes",       valor: "0", cor: "#ef4444", icon: "⚠️" },
];

export default function GestorDashboard() {
  const { logout, perfil, userData } = useAuth();
  const navigate = useNavigate();
  const [menu, setMenu] = useState(false);
  const nome = userData?.nome || "Gestor";

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div style={{
      background: `radial-gradient(ellipse at 70% 0%, #0a3572 0%, #032774 50%, #010e2e 100%)`,
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
        position: "absolute", width: 300, height: 300, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(224,104,32,0.1) 0%, transparent 70%)",
        top: -80, left: -60, pointerEvents: "none",
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
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontFamily: T.fontTitle, fontSize: 22, fontWeight: 900, color: T.orange }}>BOX</span>
              <span style={{ width: 1, height: 16, background: "rgba(255,255,255,0.2)" }} />
              <span style={{ fontFamily: T.fontTitle, fontSize: 13, letterSpacing: 3, color: T.muted }}>AGÊNCIA</span>
            </div>
            <h1 style={{ margin: 0, fontFamily: T.fontTitle, fontSize: 26, fontWeight: 900 }}>
              Olá, {nome.split(" ")[0]} 👋
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: T.muted }}>
              {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
          <button onClick={() => setMenu(true)} style={{
            ...S.card,
            border: "none",
            width: 44, height: 44,
            borderRadius: T.r12,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, cursor: "pointer",
          }}>☰</button>
        </div>

        {/* Badge perfil */}
        <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
          <span style={{
            background: "rgba(224,104,32,0.15)", color: T.orange,
            borderRadius: T.pill, padding: "4px 14px",
            fontSize: 12, fontWeight: 600,
          }}>
            {perfil === "coordenador" ? "Coordenador" : "Gestor"}
          </span>
          <span style={{
            background: "rgba(76,175,80,0.12)", color: "#4caf50",
            borderRadius: T.pill, padding: "4px 14px",
            fontSize: 12, fontWeight: 600,
          }}>● Ao vivo</span>
        </div>
      </div>

      {/* CONTEÚDO */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 100px" }}>

        {/* CARDS RESUMO */}
        <p style={{ fontFamily: T.fontTitle, fontSize: 18, fontWeight: 700, margin: "0 0 12px" }}>Resumo do Dia</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
          {CARDS.map(card => (
            <div key={card.label} style={{
              ...S.card,
              padding: 16,
              borderLeft: `3px solid ${card.cor}`,
              animation: "fadeInUp 0.4s cubic-bezier(0.34,1.56,0.64,1)",
            }}>
              <p style={{ margin: "0 0 8px", fontSize: 18 }}>{card.icon}</p>
              <p style={{ margin: "0 0 4px", fontSize: 11, color: T.muted }}>{card.label}</p>
              <p style={{ margin: 0, fontFamily: T.fontTitle, fontSize: 32, fontWeight: 700, color: card.cor }}>
                {card.valor}
              </p>
            </div>
          ))}
        </div>

        {/* ACESSO RÁPIDO */}
        <p style={{ fontFamily: T.fontTitle, fontSize: 18, fontWeight: 700, margin: "0 0 12px" }}>Acesso Rápido</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {MENU_ITEMS.slice(0, 4).map(item => (
            <button key={item.path} onClick={() => navigate(item.path)} style={{
              ...S.card,
              padding: "16px 20px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              cursor: "pointer", border: "none",
              fontSize: 15, color: T.text,
              transition: T.smooth,
            }}>
              <span>{item.label}</span>
              <span style={{ color: T.muted, fontSize: 18 }}>›</span>
            </button>
          ))}
        </div>
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
          <button key={item.path} onClick={() => navigate(item.path)} style={{
            flex: 1, background: "none", border: "none", cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            padding: "8px 0", transition: T.smooth,
          }}>
            <span style={{ fontSize: 18 }}>{item.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: T.muted }}>{item.label}</span>
          </button>
        ))}
      </div>

      {/* MENU LATERAL */}
      {menu && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100 }}>
          <div onClick={() => setMenu(false)} style={{
            position: "absolute", inset: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
          }} />
          <div style={{
            position: "absolute", right: 0, top: 0, bottom: 0, width: 270,
            ...S.cardDark,
            borderRadius: "24px 0 0 24px",
            padding: 28,
            display: "flex", flexDirection: "column",
            animation: "slideLeft 0.35s cubic-bezier(0.34,1.56,0.64,1)",
          }}>
            <div style={{ marginBottom: 28 }}>
              <span style={{ fontFamily: T.fontTitle, fontSize: 28, fontWeight: 900, color: T.orange }}>BOX</span>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: T.muted }}>{userData?.email || ""}</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
              {MENU_ITEMS.map(item => (
                <button key={item.path} onClick={() => { navigate(item.path); setMenu(false); }} style={{
                  ...S.btnGhost,
                  padding: "14px 16px",
                  textAlign: "left", fontSize: 15,
                  borderRadius: T.r12,
                }}>
                  {item.label}
                </button>
              ))}
            </div>
            <button onClick={handleLogout} style={{
              ...S.btnGhost,
              padding: "14px 16px",
              textAlign: "left", fontSize: 15,
              color: "#ff6b6b",
              border: "1px solid rgba(244,67,54,0.25)",
              borderRadius: T.r12,
            }}>
              🚪 Sair da conta
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideLeft {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}