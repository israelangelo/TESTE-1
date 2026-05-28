import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const NAV = [
  { path: "/gestor", icon: "⊞", label: "Início" },
  { path: "/gestor/promotores", icon: "👥", label: "Promotores" },
  { path: "/gestor/lojas", icon: "🏪", label: "Lojas" },
  { path: "/gestor/escala", icon: "📅", label: "Escala" },
  { path: "/gestor/relatorios", icon: "📊", label: "Relatórios" },
  { path: "/gestor/clientes", icon: "💼", label: "Clientes" },
  { path: "/gestor/configuracoes", icon: "⚙️", label: "Config" },
];

export default function GestorDashboard() {
  const { logout, perfil } = useAuth();
  const navigate = useNavigate();
  const [menuAberto, setMenuAberto] = useState(false);

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div style={{ background: "#032774", minHeight: "100dvh", fontFamily: "Barlow, sans-serif", color: "#fff", maxWidth: 480, margin: "0 auto", position: "relative" }}>

      {/* HEADER */}
      <div style={{ background: "#032774", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <div>
          <span style={{ fontFamily: "Barlow Condensed", fontSize: 28, fontWeight: 900, color: "#E06820" }}>BOX</span>
          <span style={{ fontFamily: "Barlow Condensed", fontSize: 14, color: "#fff", marginLeft: 8, letterSpacing: 2 }}>AGÊNCIA</span>
        </div>
        <button onClick={() => setMenuAberto(!menuAberto)} style={{ background: "none", color: "#fff", fontSize: 24, cursor: "pointer" }}>☰</button>
      </div>

      {/* MENU LATERAL */}
      {menuAberto && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 }}>
          <div onClick={() => setMenuAberto(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)" }} />
          <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 260, background: "#021d5a", padding: 24, display: "flex", flexDirection: "column", gap: 8 }}>
            <p style={{ fontFamily: "Barlow Condensed", fontSize: 20, fontWeight: 700, color: "#E06820", marginBottom: 16 }}>MENU</p>
            {NAV.map(item => (
              <button key={item.path} onClick={() => { navigate(item.path); setMenuAberto(false); }} style={{ background: "none", color: "#fff", fontSize: 16, textAlign: "left", padding: "12px 8px", borderBottom: "1px solid rgba(255,255,255,0.08)", cursor: "pointer" }}>
                {item.icon} {item.label}
              </button>
            ))}
            <button onClick={handleLogout} style={{ background: "none", color: "#ff6b6b", fontSize: 16, textAlign: "left", padding: "12px 8px", marginTop: "auto", cursor: "pointer" }}>
              🚪 Sair
            </button>
          </div>
        </div>
      )}

      {/* CONTEÚDO */}
      <div style={{ padding: "20px 16px", overflowY: "auto", height: "calc(100dvh - 65px)" }}>

        {/* SAUDAÇÃO */}
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>Olá, {perfil?.nome || "Gestor"} 👋</p>
        <h1 style={{ fontFamily: "Barlow Condensed", fontSize: 28, fontWeight: 700, margin: "0 0 20px" }}>Resumo do Dia</h1>

        {/* CARDS RESUMO */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
          {[
            { label: "Lojas Visitadas", valor: "0", cor: "#E06820" },
            { label: "Check-ins Hoje", valor: "0", cor: "#22c55e" },
            { label: "Fotos Enviadas", valor: "0", cor: "#3b82f6" },
            { label: "Pendentes", valor: "0", cor: "#ef4444" },
          ].map(card => (
            <div key={card.label} style={{ background: "rgba(255,255,255,0.07)", borderRadius: 16, padding: "16px", borderLeft: `4px solid ${card.cor}` }}>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", margin: "0 0 6px" }}>{card.label}</p>
              <p style={{ fontSize: 32, fontFamily: "Barlow Condensed", fontWeight: 700, color: card.cor, margin: 0 }}>{card.valor}</p>
            </div>
          ))}
        </div>

        {/* AÇÕES RÁPIDAS */}
        <h2 style={{ fontFamily: "Barlow Condensed", fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Acesso Rápido</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { label: "👥 Gerenciar Promotores", path: "/gestor/promotores" },
            { label: "🏪 Gerenciar Lojas", path: "/gestor/lojas" },
            { label: "📅 Escala de Trabalho", path: "/gestor/escala" },
            { label: "📊 Relatórios", path: "/gestor/relatorios" },
            { label: "💼 Clientes", path: "/gestor/clientes" },
          ].map(item => (
            <button key={item.path} onClick={() => navigate(item.path)} style={{ background: "rgba(255,255,255,0.07)", color: "#fff", fontSize: 16, padding: "16px", borderRadius: 12, textAlign: "left", cursor: "pointer", border: "1px solid rgba(255,255,255,0.1)" }}>
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}