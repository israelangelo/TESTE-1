// src/pages/gestor/Dashboard.jsx
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth, db } from "../../firebase/config";
import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";

export default function GestorDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ promotores: 0, checkins: 0, lojas: 0, relatorios: 0 });

  useEffect(() => {
    const carregar = async () => {
      const [promotores, checkins, lojas, relatorios] = await Promise.all([
        getDocs(query(collection(db, "usuarios"), where("perfil", "==", "promotor"), where("ativo", "==", true))),
        getDocs(collection(db, "checkins")),
        getDocs(query(collection(db, "lojas"), where("ativo", "==", true))),
        getDocs(collection(db, "rupturas")),
      ]);
      setStats({
        promotores: promotores.size,
        checkins: checkins.size,
        lojas: lojas.size,
        relatorios: relatorios.size,
      });
    };
    carregar();
  }, []);

  const sair = async () => { await signOut(auth); navigate("/login"); };

  const menu = [
    { icon: "👥", label: "Promotores", rota: "/gestor/promotores" },
    { icon: "🏪", label: "Lojas",       rota: "/gestor/lojas" },
    { icon: "📊", label: "Relatórios",  rota: "/gestor/relatorios" },
    { icon: "👤", label: "Clientes",    rota: "/gestor/clientes" },
    { icon: "📅", label: "Escala",      rota: "/gestor/escala" },
    { icon: "⚙️", label: "Configurações", rota: "/gestor/configuracoes" },
  ];

  return (
    <div style={s.bg}>
      <div style={s.header}>
        <div>
          <h1 style={s.logo}>BOX</h1>
          <span style={s.sub}>AGÊNCIA</span>
        </div>
        <button onClick={sair} style={s.sair}>Sair</button>
      </div>

      <div style={s.grid4}>
        {[
          { num: stats.promotores, label: "Promotores Ativos" },
          { num: stats.checkins,   label: "Check-ins Hoje" },
          { num: stats.lojas,      label: "Lojas Ativas" },
          { num: stats.relatorios, label: "Rupturas Registradas" },
        ].map((c, i) => (
          <div key={i} style={s.card}>
            <h2 style={s.num}>{c.num}</h2>
            <p style={s.label}>{c.label}</p>
          </div>
        ))}
      </div>

      <div style={s.grid3}>
        {menu.map((m, i) => (
          <div key={i} style={s.menuCard} onClick={() => navigate(m.rota)}>
            <span style={{ fontSize: "clamp(22px,4vw,28px)" }}>{m.icon}</span>
            <span style={{ fontSize: "clamp(13px,2.5vw,16px)", fontWeight: 600 }}>{m.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const s = {
  bg: { minHeight: "100vh", background: "#010e2e", fontFamily: "'Barlow', sans-serif" },
  header: { background: "#0d1b3e", borderBottom: "2px solid #E06820", padding: "clamp(12px,3vw,16px) clamp(16px,4vw,32px)", display: "flex", justifyContent: "space-between", alignItems: "center" },
  logo: { color: "#E06820", fontSize: "clamp(22px,4vw,28px)", fontWeight: 800, margin: 0, letterSpacing: 4 },
  sub: { color: "#aab4cc", fontSize: 11, letterSpacing: 4 },
  sair: { background: "transparent", border: "1px solid #E06820", color: "#E06820", padding: "8px 20px", borderRadius: 6, cursor: "pointer", fontSize: 14 },
  grid4: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "clamp(10px,2vw,16px)", padding: "clamp(16px,3vw,32px) clamp(16px,4vw,32px) 0" },
  card: { background: "#0d1b3e", border: "1px solid #1a2f5e", borderRadius: 12, padding: "clamp(16px,3vw,24px)", textAlign: "center" },
  num: { color: "#E06820", fontSize: "clamp(28px,5vw,36px)", fontWeight: 800, margin: "0 0 8px" },
  label: { color: "#aab4cc", fontSize: "clamp(11px,2vw,13px)", margin: 0 },
  grid3: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "clamp(10px,2vw,16px)", padding: "clamp(12px,3vw,24px) clamp(16px,4vw,32px) 0" },
  menuCard: { background: "#0d1b3e", border: "1px solid #1a2f5e", borderRadius: 12, padding: "clamp(20px,4vw,32px) 16px", textAlign: "center", color: "#fff", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, transition: "border-color 0.2s" },
};