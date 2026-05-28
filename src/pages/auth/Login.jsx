// src/pages/auth/Login.jsx

import { useState, useEffect } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebase/config";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [lembrar, setLembrar] = useState(false);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const emailSalvo = localStorage.getItem("box_email");
    const senhaSalva = localStorage.getItem("box_senha");
    if (emailSalvo && senhaSalva) {
      setEmail(emailSalvo);
      setSenha(senhaSalva);
      setLembrar(true);
    }
  }, []);

  async function handleLogin() {
    setErro("");
    setCarregando(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, senha);

      if (lembrar) {
        localStorage.setItem("box_email", email);
        localStorage.setItem("box_senha", senha);
      } else {
        localStorage.removeItem("box_email");
        localStorage.removeItem("box_senha");
      }

      const snap = await getDoc(doc(db, "usuarios", cred.user.uid));
      const perfil = snap.data()?.perfil;

      if (perfil === "gestor") navigate("/gestor");
      else if (perfil === "promotor") navigate("/promotor");
      else if (perfil === "cliente") navigate("/cliente");
      else navigate("/gestor");
    } catch (e) {
      setErro("Email ou senha incorretos.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div style={styles.bg}>
      <div style={styles.logo}>
        <span style={styles.logoBox}>BOX</span>
        <span style={styles.logoAgencia}>AGÊNCIA</span>
      </div>

      <div style={styles.card}>
        <h2 style={styles.titulo}>Entrar</h2>

        {erro && <div style={styles.erro}>{erro}</div>}

        {/* EMAIL */}
        <div style={styles.campo}>
          <label style={styles.label}>Email</label>
          <input
            style={styles.input}
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* SENHA */}
        <div style={styles.campo}>
          <label style={styles.label}>Senha</label>
          <input
            style={styles.input}
            type="password"
            placeholder="••••••••"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
        </div>

        {/* LEMBRAR */}
        <label style={styles.lembrar}>
          <input
            type="checkbox"
            checked={lembrar}
            onChange={(e) => setLembrar(e.target.checked)}
            style={{ marginRight: 8 }}
          />
          Lembrar email e senha
        </label>

        {/* BOTÃO */}
        <button
          style={{
            ...styles.btn,
            opacity: carregando ? 0.7 : 1,
          }}
          onClick={handleLogin}
          disabled={carregando}
        >
          {carregando ? "Entrando..." : "Entrar"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  bg: {
    minHeight: "100vh",
    backgroundColor: "#010e2e",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px 16px",
    fontFamily: "'Barlow', sans-serif",
  },
  logo: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginBottom: 40,
  },
  logoBox: {
    fontSize: "clamp(36px, 8vw, 52px)",
    fontWeight: 900,
    color: "#E06820",
    letterSpacing: 4,
    lineHeight: 1,
  },
  logoAgencia: {
    fontSize: "clamp(11px, 2.5vw, 14px)",
    color: "#aab4cc",
    letterSpacing: 6,
    marginTop: 2,
  },
  card: {
    backgroundColor: "#0d1b3e",
    border: "1px solid #1a2f5e",
    borderRadius: 16,
    padding: "clamp(24px, 5vw, 40px)",
    width: "100%",
    maxWidth: 420,
    display: "flex",
    flexDirection: "column",
    gap: 0,
  },
  titulo: {
    color: "#fff",
    fontSize: "clamp(20px, 4vw, 24px)",
    fontWeight: 700,
    marginBottom: 24,
    textAlign: "center",
  },
  erro: {
    backgroundColor: "#3d0a0a",
    color: "#f44336",
    border: "1px solid #f44336",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 13,
    marginBottom: 16,
    textAlign: "center",
  },
  campo: {
    display: "flex",
    flexDirection: "column",   // ← label em cima, input embaixo
    gap: 6,
    marginBottom: 16,
  },
  label: {
    color: "#aab4cc",
    fontSize: "clamp(12px, 2.5vw, 14px)",
    fontWeight: 500,
  },
  input: {
    backgroundColor: "#010e2e",
    border: "1px solid #1a2f5e",
    borderRadius: 10,
    padding: "12px 14px",
    color: "#fff",
    fontSize: "clamp(14px, 3vw, 16px)",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  },
  lembrar: {
    display: "flex",
    alignItems: "center",
    color: "#aab4cc",
    fontSize: "clamp(12px, 2.5vw, 14px)",
    cursor: "pointer",
    marginBottom: 24,
  },
  btn: {
    backgroundColor: "#E06820",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "clamp(12px, 3vw, 16px)",
    fontSize: "clamp(15px, 3vw, 17px)",
    fontWeight: 700,
    cursor: "pointer",
    width: "100%",
    letterSpacing: 1,
  },
};