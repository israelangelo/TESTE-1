import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";
import { updatePassword, signOut, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { db, auth } from "../../firebase/config";
import { useAuth } from "../../context/AuthContext";
import { useBackButton } from "../../hooks/useBackButton";
import { T, S } from "../../theme/tokens";
import GeometricBackground from "../../components/GeometricBackground";
import SidebarGestor from "../../components/SidebarGestor";

const VERSAO = "1.0.0";

export default function Configuracoes() {
  useBackButton();
  const navigate = useNavigate();
  const { currentUser, userData, refreshUserData } = useAuth();
  const [menuAberto, setMenuAberto] = useState(false);

  const nome = userData?.nome || currentUser?.email?.split("@")[0] || "Gestor";
  const inicial = nome[0].toUpperCase();

  const [novoNome, setNovoNome] = useState(userData?.nome || "");
  const [nomeLocal, setNomeLocal] = useState(userData?.nome || "");
  const [salvandoNome, setSalvandoNome] = useState(false);
  const [feedbackNome, setFeedbackNome] = useState(null);

  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [salvandoSenha, setSalvandoSenha] = useState(false);
  const [feedbackSenha, setFeedbackSenha] = useState(null);
  const [mostrarSenhas, setMostrarSenhas] = useState(false);

  const [modalSair, setModalSair] = useState(false);
  const [animandoModal, setAnimandoModal] = useState(false);
  const overlayRef = useRef(null);

  async function salvarNome() {
    if (!novoNome.trim()) {
      setFeedbackNome({ tipo: "erro", msg: "Nome não pode ser vazio." });
      return;
    }
    setSalvandoNome(true);
    setFeedbackNome(null);
    try {
      await updateDoc(doc(db, "usuarios", currentUser.uid), { nome: novoNome.trim() });
      await refreshUserData();
      setNomeLocal(novoNome.trim());
      setFeedbackNome({ tipo: "ok", msg: "Nome atualizado com sucesso!" });
    } catch {
      setFeedbackNome({ tipo: "erro", msg: "Erro ao salvar. Tente novamente." });
    } finally {
      setSalvandoNome(false);
    }
  }

  async function alterarSenha() {
    setFeedbackSenha(null);
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      setFeedbackSenha({ tipo: "erro", msg: "Preencha todos os campos." });
      return;
    }
    if (novaSenha.length < 6) {
      setFeedbackSenha({ tipo: "erro", msg: "Nova senha deve ter no mínimo 6 caracteres." });
      return;
    }
    if (novaSenha !== confirmarSenha) {
      setFeedbackSenha({ tipo: "erro", msg: "As senhas não coincidem." });
      return;
    }
    setSalvandoSenha(true);
    try {
      const credential = EmailAuthProvider.credential(currentUser.email, senhaAtual);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, novaSenha);
      setFeedbackSenha({ tipo: "ok", msg: "Senha alterada com sucesso!" });
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarSenha("");
    } catch (e) {
      if (e.code === "auth/wrong-password" || e.code === "auth/invalid-credential") {
        setFeedbackSenha({ tipo: "erro", msg: "Senha atual incorreta." });
      } else {
        setFeedbackSenha({ tipo: "erro", msg: "Erro ao alterar senha. Tente novamente." });
      }
    } finally {
      setSalvandoSenha(false);
    }
  }

  function abrirModalSair() {
    setModalSair(true);
    requestAnimationFrame(() => setAnimandoModal(true));
  }
  function fecharModalSair() {
    setAnimandoModal(false);
    setTimeout(() => setModalSair(false), 380);
  }
  function handleOverlayClick(e) {
    if (e.target === overlayRef.current) fecharModalSair();
  }
  async function confirmarSaida() {
    await signOut(auth);
    navigate("/login");
  }

  return (
    <div style={{ position: "relative", minHeight: "100vh", background: T.bg }}>
      <GeometricBackground />

      {/* Sidebar */}
      <SidebarGestor aberto={menuAberto} onFechar={() => setMenuAberto(false)} />

      <div style={{
        maxWidth: 480,
        margin: "0 auto",
        padding: "0 16px 60px",
        position: "relative",
        zIndex: 1,
      }}>

        {/* HEADER — padrão gestor */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 0 24px",
        }}>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: T.muted }}>Conta</p>
            <h1 style={{
              margin: 0,
              fontFamily: T.fontTitle,
              fontSize: 30,
              fontWeight: 900,
              letterSpacing: -0.5,
              color: T.text,
            }}>
              Configurações
            </h1>
          </div>
          <button
            onClick={() => setMenuAberto(true)}
            style={{ ...S.card, border: "none", padding: "10px 14px", cursor: "pointer", fontSize: 22 }}
          >
            ☰
          </button>
        </div>

        {/* PERFIL */}
        <div style={{
          ...S.card,
          borderRadius: T.r16,
          padding: 20,
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginBottom: 24,
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: "50%",
            background: "linear-gradient(135deg, #E06820, #ff9a4d)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24, fontWeight: 900, color: "#fff", flexShrink: 0,
            boxShadow: "0 4px 16px rgba(224,104,32,0.35)",
          }}>
            {inicial}
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: T.text, marginBottom: 2 }}>
              {nomeLocal || "Gestor"}
            </div>
            <div style={{ fontSize: 12, color: T.muted, marginBottom: 6 }}>
              {currentUser?.email}
            </div>
            <div style={{
              display: "inline-block",
              background: "rgba(224,104,32,0.15)",
              border: "1px solid rgba(224,104,32,0.3)",
              color: T.orange,
              fontSize: 11, fontWeight: 700,
              borderRadius: T.pill, padding: "2px 10px",
            }}>
              🔑 GESTOR
            </div>
          </div>
        </div>

        {/* ALTERAR NOME */}
        <div style={{ ...S.card, borderRadius: T.r16, padding: 20, marginBottom: 16 }}>
          <p style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 1 }}>
            👤 Alterar Nome
          </p>
          <input
            type="text"
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
            placeholder="Seu nome completo"
            style={inputStyle()}
          />
          {feedbackNome && (
            <div style={feedbackStyle(feedbackNome.tipo)}>
              {feedbackNome.tipo === "ok" ? "✅" : "❌"} {feedbackNome.msg}
            </div>
          )}
          <button
            onClick={salvarNome}
            disabled={salvandoNome}
            style={{ ...btnPrincipal(), marginTop: 14, opacity: salvandoNome ? 0.6 : 1 }}
          >
            {salvandoNome ? "Salvando..." : "Salvar Nome"}
          </button>
        </div>

        {/* ALTERAR SENHA */}
        <div style={{ ...S.card, borderRadius: T.r16, padding: 20, marginBottom: 16 }}>
          <p style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 1 }}>
            🔒 Alterar Senha
          </p>
          <label style={labelStyle()}>Senha Atual</label>
          <input type={mostrarSenhas ? "text" : "password"} value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} placeholder="••••••••" style={inputStyle()} />
          <label style={labelStyle()}>Nova Senha</label>
          <input type={mostrarSenhas ? "text" : "password"} value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} placeholder="Mínimo 6 caracteres" style={inputStyle()} />
          <label style={labelStyle()}>Confirmar Nova Senha</label>
          <input type={mostrarSenhas ? "text" : "password"} value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} placeholder="Repita a nova senha" style={inputStyle()} />
          <button
            onClick={() => setMostrarSenhas(!mostrarSenhas)}
            style={{ background: "none", border: "none", color: T.muted, fontSize: 13, cursor: "pointer", padding: "8px 0", fontFamily: T.fontBody }}
          >
            {mostrarSenhas ? "🙈 Ocultar senhas" : "👁 Mostrar senhas"}
          </button>
          {feedbackSenha && (
            <div style={feedbackStyle(feedbackSenha.tipo)}>
              {feedbackSenha.tipo === "ok" ? "✅" : "❌"} {feedbackSenha.msg}
            </div>
          )}
          <button
            onClick={alterarSenha}
            disabled={salvandoSenha}
            style={{ ...btnPrincipal(), marginTop: 14, opacity: salvandoSenha ? 0.6 : 1 }}
          >
            {salvandoSenha ? "Alterando..." : "Alterar Senha"}
          </button>
        </div>

        {/* SOBRE */}
        <div style={{ ...S.card, borderRadius: T.r16, padding: 20, marginBottom: 16 }}>
          <p style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 1 }}>
            ℹ️ Sobre o App
          </p>
          {[
            { label: "Versão", valor: VERSAO },
            { label: "Plataforma", valor: "Web / PWA" },
            { label: "Desenvolvido por", valor: "Box Agência" },
          ].map((row, i, arr) => (
            <div key={row.label} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "12px 0",
              borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.07)" : "none",
            }}>
              <span style={{ fontSize: 14, color: T.muted }}>{row.label}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{row.valor}</span>
            </div>
          ))}
        </div>

        {/* SAIR */}
        <button
          onClick={abrirModalSair}
          style={{
            width: "100%", background: "rgba(244,67,54,0.08)",
            border: "1px solid rgba(244,67,54,0.3)",
            borderRadius: T.r16, padding: 16,
            color: "#ff6b6b", fontWeight: 700, fontSize: 16,
            cursor: "pointer", fontFamily: T.fontBody,
          }}
        >
          🚪 Sair da Conta
        </button>
      </div>

      {/* MODAL SAIR */}
      {modalSair && (
        <div
          ref={overlayRef}
          onClick={handleOverlayClick}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex", alignItems: "flex-end",
            zIndex: 1000,
            opacity: animandoModal ? 1 : 0,
            transition: "opacity 380ms cubic-bezier(0.32,0.72,0,1)",
          }}
        >
          <div style={{
            width: "100%", maxWidth: 480, margin: "0 auto",
            background: "rgba(1,14,46,0.98)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "20px 20px 0 0",
            padding: "12px 20px 40px",
            transform: animandoModal ? "translateY(0)" : "translateY(100%)",
            transition: "transform 380ms cubic-bezier(0.32,0.72,0,1)",
          }}>
            <div style={{ width: 36, height: 4, background: "rgba(255,255,255,0.15)", borderRadius: 99, margin: "0 auto 20px" }} />
            <div style={{ textAlign: "center", fontSize: 40, marginBottom: 8 }}>🚪</div>
            <div style={{ fontSize: 18, fontWeight: 700, textAlign: "center", marginBottom: 10, color: T.text }}>
              Sair da Conta
            </div>
            <div style={{ fontSize: 14, color: T.muted, textAlign: "center", lineHeight: 1.5, marginBottom: 20 }}>
              Tem certeza que deseja sair? Você precisará fazer login novamente para acessar o sistema.
            </div>
            <button onClick={confirmarSaida} style={{ ...btnPrincipal(), background: "#f44336" }}>
              Sim, sair agora
            </button>
            <button onClick={fecharModalSair} style={{
              width: "100%", background: "transparent",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: T.r12, padding: 13,
              color: T.muted, fontSize: 15, cursor: "pointer",
              marginTop: 10, fontFamily: T.fontBody,
            }}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function inputStyle() {
  return {
    width: "100%", boxSizing: "border-box",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10, padding: 13,
    color: "#fff", fontSize: 15,
    fontFamily: "'Barlow', sans-serif",
    marginBottom: 4,
  };
}

function labelStyle() {
  return {
    display: "block", fontSize: 12,
    color: "rgba(170,180,204,0.8)",
    marginBottom: 6, marginTop: 14,
  };
}

function feedbackStyle(tipo) {
  return {
    borderRadius: 8, padding: "10px 14px",
    fontSize: 13, marginTop: 10, fontWeight: 600,
    background: tipo === "ok" ? "rgba(76,175,80,0.15)" : "rgba(244,67,54,0.15)",
    color: tipo === "ok" ? "#4caf50" : "#f44336",
  };
}

function btnPrincipal() {
  return {
    width: "100%", background: "#E06820",
    border: "none", borderRadius: 10, padding: 15,
    color: "#fff", fontWeight: 700, fontSize: 15,
    cursor: "pointer", fontFamily: "'Barlow', sans-serif",
  };
}
