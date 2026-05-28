import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const db = getFirestore();

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setErro("");
    setLoading(true);
    try {
      const cred = await login(email, senha);
      const snap = await getDoc(doc(db, "usuarios", cred.user.uid));
      const perfil = snap.data()?.perfil;
      if (perfil === "gestor") navigate("/gestor");
      else if (perfil === "promotor") navigate("/promotor");
      else if (perfil === "cliente") navigate("/cliente");
      else setErro("Perfil não encontrado. Fale com o administrador.");
    } catch {
      setErro("E-mail ou senha incorretos.");
    }
    setLoading(false);
  }

  return (
    <div style={{
      background: "#032774",
      minHeight: "100dvh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "0 32px",
      fontFamily: "Barlow, sans-serif"
    }}>
      {/* LOGO */}
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <span style={{
          fontFamily: "Barlow Condensed, sans-serif",
          fontSize: 64,
          fontWeight: 900,
          color: "#E06820",
          display: "block",
          lineHeight: 1
        }}>BOX</span>
        <div style={{ height: 2, background: "#E06820", margin: "6px 0" }} />
        <span style={{
          fontFamily: "Barlow Condensed, sans-serif",
          fontSize: 18,
          fontWeight: 600,
          color: "#ffffff",
          letterSpacing: 4
        }}>AGÊNCIA</span>
      </div>

      {/* FORM */}
      <div style={{ width: "100%", maxWidth: 380 }}>
        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: 12,
            background: "rgba(255,255,255,0.1)",
            color: "#fff",
            fontSize: 16,
            marginBottom: 12,
            boxSizing: "border-box",
            border: "1px solid rgba(255,255,255,0.2)"
          }}
        />
        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={e => setSenha(e.target.value)}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: 12,
            background: "rgba(255,255,255,0.1)",
            color: "#fff",
            fontSize: 16,
            marginBottom: 8,
            boxSizing: "border-box",
            border: "1px solid rgba(255,255,255,0.2)"
          }}
        />
        {erro && <p style={{ color: "#ff6b6b", fontSize: 14, marginBottom: 8 }}>{erro}</p>}
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: 12,
            background: loading ? "#b34e10" : "#E06820",
            color: "#fff",
            fontSize: 18,
            fontWeight: 700,
            fontFamily: "Barlow Condensed, sans-serif",
            cursor: loading ? "not-allowed" : "pointer",
            marginTop: 8,
            letterSpacing: 1
          }}
        >
          {loading ? "Entrando..." : "ENTRAR"}
        </button>
      </div>

      <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, marginTop: 48 }}>
        Box Agência © 2026 — Grande Vitória/ES
      </p>
    </div>
  );
}