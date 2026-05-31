import { useNavigate, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import { T, S } from "../theme/tokens";

const MENU = [
  { icon: "🏠", label: "Dashboard",    rota: "/gestor" },
  { icon: "👥", label: "Promotores",   rota: "/gestor/promotores" },
  { icon: "🏪", label: "Lojas",        rota: "/gestor/lojas" },
  { icon: "🤝", label: "Clientes",     rota: "/gestor/clientes" },
  { icon: "📅", label: "Escala",       rota: "/gestor/escala" },
  { icon: "📊", label: "Relatórios",   rota: "/gestor/relatorios" },
  { icon: "🗺️", label: "Mapa ao Vivo", rota: "/gestor/mapa" },
  { icon: "⚙️", label: "Configurações",rota: "/gestor/configuracoes" },
];

export default function SidebarGestor({ aberto, onFechar }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { userData, currentUser } = useAuth();

  const nome = userData?.nome || currentUser?.email?.split("@")[0] || "Gestor";
  const inicial = nome[0].toUpperCase();

  if (!aberto) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200 }}>
      {/* Backdrop */}
      <div
        onClick={onFechar}
        style={{
          position: "absolute", inset: 0,
          background: "rgba(0,0,0,0.65)",
          backdropFilter: "blur(5px)",
          WebkitBackdropFilter: "blur(5px)",
        }}
      />

      {/* Drawer */}
      <div style={{
        position: "absolute", top: 0, right: 0, bottom: 0,
        width: 290,
        background: "rgba(1,14,46,0.96)",
        border: "1px solid rgba(255,255,255,0.10)",
        borderRadius: "24px 0 0 24px",
        boxShadow: "-8px 0 40px rgba(0,0,0,0.5)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        padding: "0 0 32px",
        display: "flex", flexDirection: "column",
        animation: "slideLeft 0.32s cubic-bezier(0.34,1.56,0.64,1)",
        overflowY: "auto",
      }}>

        {/* Header do perfil */}
        <div style={{
          padding: "52px 24px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          marginBottom: 8,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 4 }}>
            <div style={{
              width: 46, height: 46, borderRadius: "50%",
              background: "linear-gradient(135deg, #E06820, #ff9a4d)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: T.fontTitle, fontSize: 22, fontWeight: 900, color: "#fff",
              flexShrink: 0,
              boxShadow: "0 4px 16px rgba(224,104,32,0.4)",
            }}>
              {inicial}
            </div>
            <div>
              <p style={{ margin: 0, fontFamily: T.fontTitle, fontSize: 20, fontWeight: 700, color: T.text }}>
                {nome.split(" ")[0]}
              </p>
              <p style={{ margin: 0, fontSize: 11, color: T.muted, marginTop: 1 }}>
                {currentUser?.email}
              </p>
            </div>
          </div>

          {/* Badge gestor */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "rgba(224,104,32,0.15)",
            border: "1px solid rgba(224,104,32,0.3)",
            borderRadius: T.pill, padding: "4px 12px", marginTop: 10,
          }}>
            <span style={{ fontSize: 10 }}>🔑</span>
            <span style={{ fontSize: 11, color: T.orange, fontWeight: 700, letterSpacing: 0.5 }}>
              GESTOR
            </span>
          </div>
        </div>

        {/* Itens de menu */}
        <div style={{ flex: 1, padding: "4px 14px" }}>
          {MENU.map((item) => {
            const ativo = location.pathname === item.rota ||
              (item.rota !== "/gestor" && location.pathname.startsWith(item.rota));
            return (
              <button
                key={item.rota}
                onClick={() => { navigate(item.rota); onFechar(); }}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 14,
                  padding: "13px 14px", marginBottom: 3,
                  background: ativo ? "rgba(224,104,32,0.15)" : "transparent",
                  border: ativo ? "1px solid rgba(224,104,32,0.25)" : "1px solid transparent",
                  borderRadius: T.r12, cursor: "pointer",
                  color: ativo ? T.orange : T.text,
                  fontFamily: T.fontBody, fontSize: 15,
                  fontWeight: ativo ? 700 : 400,
                  textAlign: "left",
                  transition: T.fast,
                  position: "relative",
                }}
              >
                {ativo && (
                  <div style={{
                    position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)",
                    width: 3, height: 24, background: T.orange,
                    borderRadius: "0 4px 4px 0",
                  }} />
                )}
                <span style={{ fontSize: 19, flexShrink: 0 }}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Sair */}
        <div style={{ padding: "16px 14px 0" }}>
          <div style={{
            height: 1, background: "rgba(255,255,255,0.08)", marginBottom: 14,
          }} />
          <button
            onClick={async () => { await signOut(auth); navigate("/login"); }}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 14,
              padding: "13px 14px",
              background: "rgba(244,67,54,0.08)",
              border: "1px solid rgba(244,67,54,0.22)",
              borderRadius: T.r12, cursor: "pointer",
              color: "#ff6b6b", fontFamily: T.fontBody, fontSize: 15,
            }}
          >
            <span style={{ fontSize: 19 }}>🚪</span>
            Sair da conta
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideLeft {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
