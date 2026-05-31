import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";
import { updatePassword, signOut, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { db, auth } from "../../firebase/config";
import { useAuth } from "../../context/AuthContext";
import { useBackButton } from "../../hooks/useBackButton";
import GeometricBackground from "../../components/GeometricBackground";
import SidebarGestor from "../../components/SidebarGestor";

const CORES = {
  bg: "#032774",
  card: "#021d5a",
  border: "#0a3572",
  orange: "#E06820",
  muted: "#aab4cc",
  green: "#4caf50",
  greenBg: "#0a3d1f",
  red: "#f44336",
  redBg: "#3d0a0a",
};

const VERSAO = "1.0.0";

export default function Configuracoes() {
  useBackButton();
  const [menuAberto, setMenuAberto] = React.useState ? React.useState(false) : useState(false);
  const navigate = useNavigate();
  const { currentUser, userData, refreshUserData } = useAuth();

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

  const s = estilos();

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <GeometricBackground />
    <div style={s.container}>
      {/* HEADER */}
      <div style={s.header}>
        <button onClick={() => navigate("/gestor")} style={s.btnVoltar}>←</button>
        <span style={s.titulo}>Configurações</span>
        <div style={{ width: 44 }} />
      </div>

      {/* PERFIL */}
      <div style={s.perfilCard}>
        <div style={s.avatar}>
          {(nomeLocal || currentUser?.email || "G")[0].toUpperCase()}
        </div>
        <div>
          <div style={s.perfilNome}>{nomeLocal || "Gestor"}</div>
          <div style={s.perfilEmail}>{currentUser?.email}</div>
          <div style={s.perfilBadge}>Gestor</div>
        </div>
      </div>

      {/* ALTERAR NOME */}
      <div style={s.secao}>
        <div style={s.secaoTitulo}>👤 Alterar Nome</div>
        <input
          type="text"
          value={novoNome}
          onChange={(e) => setNovoNome(e.target.value)}
          placeholder="Seu nome completo"
          style={s.input}
        />
        {feedbackNome && (
          <div style={{
            ...s.feedback,
            background: feedbackNome.tipo === "ok" ? CORES.greenBg : CORES.redBg,
            color: feedbackNome.tipo === "ok" ? CORES.green : CORES.red,
          }}>
            {feedbackNome.tipo === "ok" ? "✅" : "❌"} {feedbackNome.msg}
          </div>
        )}
        <button onClick={salvarNome} disabled={salvandoNome} style={{ ...s.btnPrincipal, opacity: salvandoNome ? 0.6 : 1 }}>
          {salvandoNome ? "Salvando..." : "Salvar Nome"}
        </button>
      </div>

      <div style={s.divisor} />

      {/* ALTERAR SENHA */}
      <div style={s.secao}>
        <div style={s.secaoTitulo}>🔒 Alterar Senha</div>
        <label style={s.label}>Senha Atual</label>
        <input type={mostrarSenhas ? "text" : "password"} value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} placeholder="••••••••" style={s.input} />
        <label style={s.label}>Nova Senha</label>
        <input type={mostrarSenhas ? "text" : "password"} value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} placeholder="Mínimo 6 caracteres" style={s.input} />
        <label style={s.label}>Confirmar Nova Senha</label>
        <input type={mostrarSenhas ? "text" : "password"} value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} placeholder="Repita a nova senha" style={s.input} />
        <button onClick={() => setMostrarSenhas(!mostrarSenhas)} style={s.btnMostrar}>
          {mostrarSenhas ? "🙈 Ocultar senhas" : "👁 Mostrar senhas"}
        </button>
        {feedbackSenha && (
          <div style={{
            ...s.feedback,
            background: feedbackSenha.tipo === "ok" ? CORES.greenBg : CORES.redBg,
            color: feedbackSenha.tipo === "ok" ? CORES.green : CORES.red,
          }}>
            {feedbackSenha.tipo === "ok" ? "✅" : "❌"} {feedbackSenha.msg}
          </div>
        )}
        <button onClick={alterarSenha} disabled={salvandoSenha} style={{ ...s.btnPrincipal, opacity: salvandoSenha ? 0.6 : 1 }}>
          {salvandoSenha ? "Alterando..." : "Alterar Senha"}
        </button>
      </div>

      <div style={s.divisor} />

      {/* SOBRE */}
      <div style={s.secao}>
        <div style={s.secaoTitulo}>ℹ️ Sobre o App</div>
        <div style={s.sobreCard}>
          <div style={s.sobreRow}>
            <span style={s.sobreLabel}>Versão</span>
            <span style={s.sobreValor}>{VERSAO}</span>
          </div>
          <div style={s.sobreRow}>
            <span style={s.sobreLabel}>Plataforma</span>
            <span style={s.sobreValor}>Web / PWA</span>
          </div>
          <div style={{ ...s.sobreRow, borderBottom: "none" }}>
            <span style={s.sobreLabel}>Desenvolvido por</span>
            <span style={s.sobreValor}>Box Agência</span>
          </div>
        </div>
      </div>

      <div style={s.divisor} />

      {/* SAIR */}
      <div style={{ padding: "0 16px 40px" }}>
        <button onClick={abrirModalSair} style={s.btnSair}>
          🚪 Sair da Conta
        </button>
      </div>

      {/* MODAL SAIR */}
      {modalSair && (
        <div
          ref={overlayRef}
          onClick={handleOverlayClick}
          style={{
            ...s.overlay,
            opacity: animandoModal ? 1 : 0,
            transition: "opacity 380ms cubic-bezier(0.32,0.72,0,1)",
          }}
        >
          <div style={{
            ...s.modal,
            transform: animandoModal ? "translateY(0)" : "translateY(100%)",
            transition: "transform 380ms cubic-bezier(0.32,0.72,0,1)",
            willChange: "transform",
          }}>
            <div style={s.dragHandle} />
            <div style={s.modalIcone}>🚪</div>
            <div style={s.modalTitulo}>Sair da Conta</div>
            <div style={s.modalDesc}>
              Tem certeza que deseja sair? Você precisará fazer login novamente para acessar o sistema.
            </div>
            <button onClick={confirmarSaida} style={{ ...s.btnPrincipal, background: CORES.red }}>
              Sim, sair agora
            </button>
            <button onClick={fecharModalSair} style={s.btnCancelar}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}

function estilos() {
  return {
    container: {
      height: "100vh",
      overflowY: "auto",
      WebkitOverflowScrolling: "touch",
      background: "transparent",
      color: "#fff",
      fontFamily: "'Barlow', sans-serif",
      maxWidth: 480,
      margin: "0 auto",
      paddingBottom: 40,
    },
    header: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "16px 16px 12px",
      borderBottom: `1px solid ${CORES.border}`,
    },
    btnVoltar: {
      background: "none",
      border: "none",
      color: CORES.orange,
      fontSize: "clamp(18px, 5vw, 22px)",
      cursor: "pointer",
      padding: "4px 8px",
    },
    titulo: {
      fontSize: "clamp(16px, 4.5vw, 20px)",
      fontWeight: 700,
    },
    perfilCard: {
      display: "flex",
      alignItems: "center",
      gap: 16,
      margin: 16,
      background: CORES.card,
      border: `1px solid ${CORES.border}`,
      borderRadius: 14,
      padding: 16,
    },
    avatar: {
      width: 52,
      height: 52,
      borderRadius: "50%",
      background: CORES.orange,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "clamp(20px, 5.5vw, 24px)",
      fontWeight: 800,
      flexShrink: 0,
    },
    perfilNome: {
      fontSize: "clamp(15px, 4.2vw, 17px)",
      fontWeight: 700,
      marginBottom: 2,
    },
    perfilEmail: {
      fontSize: "clamp(11px, 3vw, 13px)",
      color: CORES.muted,
      marginBottom: 6,
    },
    perfilBadge: {
      display: "inline-block",
      background: "#0a3572",
      color: CORES.orange,
      fontSize: "clamp(10px, 2.8vw, 12px)",
      fontWeight: 700,
      borderRadius: 6,
      padding: "2px 8px",
    },
    secao: {
      padding: "0 16px",
      marginBottom: 4,
    },
    secaoTitulo: {
      fontSize: "clamp(13px, 3.8vw, 15px)",
      fontWeight: 700,
      color: CORES.muted,
      marginBottom: 14,
      marginTop: 20,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    label: {
      display: "block",
      fontSize: "clamp(12px, 3.5vw, 13px)",
      color: CORES.muted,
      marginBottom: 6,
      marginTop: 12,
    },
    input: {
      width: "100%",
      boxSizing: "border-box",
      background: CORES.card,
      border: `1px solid ${CORES.border}`,
      borderRadius: 10,
      padding: 13,
      color: "#fff",
      fontSize: "clamp(14px, 4vw, 16px)",
      fontFamily: "'Barlow', sans-serif",
    },
    btnMostrar: {
      background: "none",
      border: "none",
      color: CORES.muted,
      fontSize: "clamp(12px, 3.5vw, 13px)",
      cursor: "pointer",
      padding: "8px 0",
      fontFamily: "'Barlow', sans-serif",
    },
    feedback: {
      borderRadius: 8,
      padding: "10px 14px",
      fontSize: "clamp(12px, 3.5vw, 14px)",
      marginTop: 10,
      fontWeight: 600,
    },
    btnPrincipal: {
      width: "100%",
      background: CORES.orange,
      border: "none",
      borderRadius: 10,
      padding: 15,
      color: "#fff",
      fontWeight: 700,
      fontSize: "clamp(14px, 4vw, 16px)",
      cursor: "pointer",
      marginTop: 16,
      fontFamily: "'Barlow', sans-serif",
    },
    divisor: {
      height: 1,
      background: CORES.border,
      margin: "20px 16px 0",
    },
    sobreCard: {
      background: CORES.card,
      border: `1px solid ${CORES.border}`,
      borderRadius: 14,
      overflow: "hidden",
    },
    sobreRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "14px 16px",
      borderBottom: `1px solid ${CORES.border}`,
    },
    sobreLabel: {
      fontSize: "clamp(13px, 3.8vw, 15px)",
      color: CORES.muted,
    },
    sobreValor: {
      fontSize: "clamp(13px, 3.8vw, 15px)",
      fontWeight: 600,
    },
    btnSair: {
      width: "100%",
      background: CORES.redBg,
      border: `1px solid ${CORES.red}`,
      borderRadius: 10,
      padding: 15,
      color: CORES.red,
      fontWeight: 700,
      fontSize: "clamp(14px, 4vw, 16px)",
      cursor: "pointer",
      marginTop: 20,
      fontFamily: "'Barlow', sans-serif",
    },
    overlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.55)",
      display: "flex",
      alignItems: "flex-end",
      zIndex: 1000,
    },
    modal: {
      width: "100%",
      maxWidth: 480,
      margin: "0 auto",
      background: CORES.card,
      borderRadius: "20px 20px 0 0",
      padding: "12px 20px 40px",
    },
    dragHandle: {
      width: 36,
      height: 4,
      background: CORES.border,
      borderRadius: 99,
      margin: "0 auto 20px",
    },
    modalIcone: {
      textAlign: "center",
      fontSize: 40,
      marginBottom: 8,
    },
    modalTitulo: {
      fontSize: "clamp(16px, 4.5vw, 18px)",
      fontWeight: 700,
      textAlign: "center",
      marginBottom: 10,
    },
    modalDesc: {
      fontSize: "clamp(13px, 3.8vw, 15px)",
      color: CORES.muted,
      textAlign: "center",
      lineHeight: 1.5,
      marginBottom: 8,
    },
    btnCancelar: {
      width: "100%",
      background: "transparent",
      border: `1px solid ${CORES.border}`,
      borderRadius: 10,
      padding: 13,
      color: CORES.muted,
      fontSize: "clamp(14px, 4vw, 16px)",
      cursor: "pointer",
      marginTop: 10,
      fontFamily: "'Barlow', sans-serif",
    },
  };
}