import { useNavigate } from "react-router-dom";

export default function Relatorios() {
  const navigate = useNavigate();
  return (
    <div style={{ background: "#032774", minHeight: "100dvh", fontFamily: "Barlow, sans-serif", color: "#fff", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <button onClick={() => navigate("/gestor")} style={{ background: "none", color: "#fff", fontSize: 22, cursor: "pointer" }}>←</button>
        <h1 style={{ fontFamily: "Barlow Condensed", fontSize: 24, fontWeight: 700, margin: 0 }}>Relatórios</h1>
      </div>
      <div style={{ textAlign: "center", marginTop: 80 }}>
        <p style={{ fontSize: 48 }}>📊</p>
        <p style={{ color: "rgba(255,255,255,0.5)" }}>Módulo de relatórios em breve.</p>
      </div>
    </div>
  );
}