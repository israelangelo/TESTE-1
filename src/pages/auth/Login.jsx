import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../../firebase/config";
import { S, T } from "../../theme/tokens";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusEmail, setFocusEmail] = useState(false);
  const [focusSenha, setFocusSenha] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleLogin() {
    if (!email || !senha) { setErro("Preencha todos os campos."); return; }
    setErro(""); setLoading(true);
    try {
      const cred = await login(email, senha);
      const snap = await getDoc(doc(db, "usuarios", cred.user.uid));
      const perfil = snap.data()?.perfil;
      if (perfil === "gestor" || perfil === "coordenador") navigate("/gestor");
      else if (perfil === "promotor") navigate("/promotor");
      else if (perfil === "cliente") navigate("/cliente");
      else setErro("Perfil não encontrado. Fale com o administrador.");
    } catch {
      setErro("E-mail ou senha incorretos.");
    }
    setLoading(false);
  }

  function handleKey(e) { if (e.key === "Enter") handleLogin(); }

  return (
    <div style={{
      background: `radial-gradient(ellipse at 60% 20%, #0a3572 0%, #032774 40%, #010e2e 100%)`,
      minHeight: "100dvh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "0 28px",
      fontFamily: T.fontBody,
      position: "relative",
      overflow: "hidden",
    }}>

      {/* Orb decorativo */}
      <div style={{
        position: "absolute",
        width: 320, height: 320,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(224,104,32,0.15) 0%, transparent 70%)",
        top: -80, right: -80,
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute",
        width: 200, height: 200,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(3,39,116,0.6) 0%, transparent 70%)",
        bottom: 40, left: -60,
        pointerEvents: "none",
      }} />

      {/* LOGO */}
      <div style={{
        textAlign: "center",
        marginBottom: 48,
        animation: "fadeInDown 0.6s cubic-bezier(0.34,1.56,0.64,1)",
      }}>
        <div style={{
          display: "inline-block",
          padding: "8px 24px 12px",
          ...S.cardDark,
          borderRadius: T.r20,
        }}>
          <span style={{
            fontFamily: T.fontTitle,
            fontSize: 72,
            fontWeight: 900,
            color: T.orange,
            display: "block",
            lineHeight: 1,
            letterSpacing: -2,
          }}>BOX</span>
          <div style={{ height: 2, background: T.orange, margin: "4px 0", borderRadius: 2, opacity: 0.8 }} />
          <span style={{
            fontFamily: T.fontTitle,
            fontSize: 16,
            fontWeight: 600,
            color: T.text,
            letterSpacing: 6,
          }}>AGÊNCIA</span>
        </div>
      </div>

      {/* CARD FORM */}
      <div style={{
        width: "100%", maxWidth: 380,
        ...S.card,
        padding: "28px 24px",
        animation: "fadeInUp 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.1s both",
      }}>
        <p style={{
          fontFamily: T.fontTitle,
          fontSize: 22,
          fontWeight: 700,
          color: T.text,
          margin: "0 0 20px",
          textAlign: "center",
          letterSpacing: 0.5,
        }}>Entrar na plataforma</p>

        <div style={{ marginBottom: 12 }}>
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onFocus={() => setFocusEmail(true)}
            onBlur={() => setFocusEmail(false)}
            onKeyDown={handleKey}
            style={{
              ...S.input,
              border: focusEmail
                ? `1.5px solid ${T.orange}`
                : "1px solid rgba(255,255,255,0.15)",
              boxShadow: focusEmail ? T.shadowOrange : "none",
            }}
          />
        </div>

        <div style={{ marginBottom: 8 }}>
          <input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={e => setSenha(e.target.value)}
            onFocus={() => setFocusSenha(true)}
            onBlur={() => setFocusSenha(false)}
            onKeyDown={handleKey}
            style={{
              ...S.input,
              border: focusSenha
                ? `1.5px solid ${T.orange}`
                : "1px solid rgba(255,255,255,0.15)",
              boxShadow: focusSenha ? T.shadowOrange : "none",
            }}
          />
        </div>

        {erro && (
          <div style={{
            background: "rgba(244,67,54,0.12)",
            border: "1px solid rgba(244,67,54,0.3)",
            borderRadius: T.r12,
            padding: "10px 14px",
            marginBottom: 8,
          }}>
            <p style={{ color: "#ff6b6b", fontSize: 13, margin: 0 }}>⚠️ {erro}</p>
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            ...S.btnOrange,
            width: "100%",
            padding: "17px",
            marginTop: 8,
            fontSize: 18,
            opacity: loading ? 0.7 : 1,
            transform: loading ? "scale(0.98)" : "scale(1)",
            transition: T.smooth,
          }}
        >
          {loading ? "Entrando..." : "ENTRAR"}
        </button>
      </div>

      <p style={{
        color: "rgba(255,255,255,0.2)",
        fontSize: 11,
        marginTop: 32,
        fontFamily: T.fontBody,
      }}>
        Box Agência © 2026 — Grande Vitória/ES
      </p>

      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        input::placeholder { color: rgba(170,180,204,0.6); }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 100px #021d5a inset !important;
          -webkit-text-fill-color: #fff !important;
        }
      `}</style>
    </div>
  );
}