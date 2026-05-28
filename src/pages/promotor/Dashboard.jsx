import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth, db } from "../../firebase/config";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";

const IconHome = () => (
  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path d="M3 12L12 3l9 9" /><path d="M9 21V12h6v9" /><path d="M3 12v9h18V12" />
  </svg>
);
const IconPin = () => (
  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <circle cx="12" cy="10" r="3" /><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
  </svg>
);
const IconList = () => (
  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
    <circle cx="3" cy="6" r="1" fill="currentColor" /><circle cx="3" cy="12" r="1" fill="currentColor" /><circle cx="3" cy="18" r="1" fill="currentColor" />
  </svg>
);
const IconUser = () => (
  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" />
  </svg>
);
const IconCheck = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IconGPS = () => (
  <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    <circle cx="12" cy="12" r="8" strokeDasharray="2 3" />
  </svg>
);
const IconCamera = () => (
  <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);
const IconAlert = () => (
  <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
const IconLogout = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const C = {
  bg: "#032774",
  card: "#021d5a",
  border: "#0a3572",
  orange: "#E06820",
  orangeLight: "#f07830",
  text: "#ffffff",
  muted: "#aab4cc",
  green: "#4caf50",
  greenBg: "#0a3d1f",
  red: "#f44336",
  redBg: "#3d0a0a",
  yellow: "#f9a825",
  yellowBg: "#3d2a00",
};

const TAREFAS_MOCK = [
  { id: 1, texto: "Verificar validade dos produtos", feita: false },
  { id: 2, texto: "Organizar gôndola do corredor 3", feita: false },
  { id: 3, texto: "Repor estoque de bebidas", feita: true },
  { id: 4, texto: "Foto da entrada da loja", feita: false },
  { id: 5, texto: "Preencher relatório de ruptura", feita: false },
];

export default function PromotorDashboard() {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [aba, setAba] = useState("inicio");
  const [tarefas, setTarefas] = useState(TAREFAS_MOCK);
  const [checkinStatus, setCheckinStatus] = useState("idle");
  const [checkinDados, setCheckinDados] = useState(null);
  const [produto, setProduto] = useState("");
  const [motivo, setMotivo] = useState("");
  const [rupturaEnviada, setRupturaEnviada] = useState(false);

  const nomeUsuario = userData?.nome || currentUser?.email?.split("@")[0] || "Promotor";
  const tarefasFeitas = tarefas.filter((t) => t.feita).length;
  const progresso = Math.round((tarefasFeitas / tarefas.length) * 100);
  const dataHoje = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const toggleTarefa = (id) => {
    setTarefas((prev) => prev.map((t) => (t.id === id ? { ...t, feita: !t.feita } : t)));
  };

  const fazerCheckin = () => {
    setCheckinStatus("buscando");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const dados = {
          lat: pos.coords.latitude.toFixed(6),
          lng: pos.coords.longitude.toFixed(6),
          precisao: Math.round(pos.coords.accuracy),
          hora: new Date().toLocaleTimeString("pt-BR"),
          promotorId: currentUser?.uid,
          promotorNome: nomeUsuario,
        };
        setCheckinDados(dados);
        setCheckinStatus("feito");
        try {
          await addDoc(collection(db, "checkins"), { ...dados, criadoEm: serverTimestamp() });
        } catch (e) {
          console.error("Erro ao salvar checkin:", e);
        }
      },
      () => setCheckinStatus("erro"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const registrarRuptura = async () => {
    if (!produto.trim()) return;
    try {
      await addDoc(collection(db, "rupturas"), {
        produto, motivo,
        promotorId: currentUser?.uid,
        promotorNome: nomeUsuario,
        criadoEm: serverTimestamp(),
      });
      setRupturaEnviada(true);
      setProduto("");
      setMotivo("");
      setTimeout(() => setRupturaEnviada(false), 3000);
    } catch (e) {
      console.error("Erro ao registrar ruptura:", e);
    }
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Barlow', sans-serif", maxWidth: 430, margin: "0 auto", position: "relative" }}>

      {/* HEADER */}
      <div style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: "16px 20px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ margin: 0, fontSize: 13, color: C.muted }}>{dataHoje}</p>
          <h1 style={{ margin: "2px 0 0", fontSize: 20, fontWeight: 700, color: C.text }}>
            Olá, {nomeUsuario.split(" ")[0]} 👋
          </h1>
        </div>
        <div style={{ background: C.orange, borderRadius: "50%", width: 42, height: 42, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16, color: "#fff" }}>
          {nomeUsuario[0].toUpperCase()}
        </div>
      </div>

      {/* CONTEÚDO */}
      <div style={{ padding: "20px 16px 100px" }}>

        {/* ABA: INÍCIO */}
        {aba === "inicio" && (
          <div>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, marginBottom: 16 }}>
              <p style={{ margin: "0 0 8px", fontSize: 13, color: C.muted }}>Progresso do dia</p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 28, fontWeight: 700, color: C.text }}>{progresso}%</span>
                <span style={{ fontSize: 13, color: C.muted }}>{tarefasFeitas}/{tarefas.length} tarefas</span>
              </div>
              <div style={{ background: C.border, borderRadius: 99, height: 8, overflow: "hidden" }}>
                <div style={{ background: C.orange, width: `${progresso}%`, height: "100%", borderRadius: 99, transition: "width 0.4s ease" }} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <BotaoAcao icon={<IconGPS />} label="Check-in" sub={checkinStatus === "feito" ? "✓ Feito" : "Registrar local"} cor={checkinStatus === "feito" ? C.green : C.orange} onClick={() => setAba("checkin")} />
              <BotaoAcao icon={<IconCamera />} label="Fotos" sub="Before / After" cor={C.orange} onClick={() => alert("Funcionalidade de fotos em breve!")} />
              <BotaoAcao icon={<IconList />} label="Tarefas" sub={`${tarefas.length - tarefasFeitas} pendentes`} cor={C.orange} onClick={() => setAba("tarefas")} />
              <BotaoAcao icon={<IconAlert />} label="Ruptura" sub="Registrar falta" cor={C.yellow} onClick={() => setAba("ruptura")} />
            </div>

            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
              <p style={{ margin: "0 0 4px", fontSize: 12, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>Loja de hoje</p>
              <p style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700, color: C.text }}>Supermercado Central</p>
              <p style={{ margin: 0, fontSize: 13, color: C.muted }}>Av. Marechal Mascarenhas, 1234 — Vitória/ES</p>
              <div style={{ marginTop: 12, display: "inline-block", background: C.greenBg, color: C.green, borderRadius: 8, padding: "4px 12px", fontSize: 13, fontWeight: 600 }}>
                ● Visita ativa
              </div>
            </div>
          </div>
        )}

        {/* ABA: CHECK-IN */}
        {aba === "checkin" && (
          <div>
            <h2 style={{ color: C.text, fontSize: 22, fontWeight: 700, margin: "0 0 4px" }}>Check-in</h2>
            <p style={{ color: C.muted, fontSize: 14, margin: "0 0 24px" }}>Registre sua localização ao chegar na loja</p>

            {checkinStatus === "idle" && (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <div style={{ width: 80, height: 80, borderRadius: "50%", background: `${C.orange}22`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", color: C.orange }}>
                  <IconGPS />
                </div>
                <p style={{ color: C.muted, fontSize: 15, marginBottom: 24 }}>Toque para capturar sua localização via GPS</p>
                <BotaoPrimario onClick={fazerCheckin}>📍 Fazer Check-in</BotaoPrimario>
              </div>
            )}

            {checkinStatus === "buscando" && (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <div style={{ width: 80, height: 80, borderRadius: "50%", background: `${C.orange}22`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", color: C.orange }}>
                  <div style={{ animation: "spin 1s linear infinite" }}>🛰️</div>
                </div>
                <p style={{ color: C.muted }}>Buscando localização...</p>
              </div>
            )}

            {checkinStatus === "feito" && checkinDados && (
              <div>
                <div style={{ background: C.greenBg, border: `1px solid ${C.green}44`, borderRadius: 16, padding: 20, marginBottom: 16 }}>
                  <p style={{ color: C.green, fontWeight: 700, fontSize: 16, margin: "0 0 12px" }}>✅ Check-in realizado!</p>
                  <InfoRow label="Hora" valor={checkinDados.hora} />
                  <InfoRow label="Latitude" valor={checkinDados.lat} />
                  <InfoRow label="Longitude" valor={checkinDados.lng} />
                  <InfoRow label="Precisão" valor={`±${checkinDados.precisao}m`} />
                </div>
                <BotaoSecundario onClick={() => setCheckinStatus("idle")}>Fazer novo check-in</BotaoSecundario>
              </div>
            )}

            {checkinStatus === "erro" && (
              <div style={{ background: C.redBg, border: `1px solid ${C.red}44`, borderRadius: 16, padding: 20, marginBottom: 16 }}>
                <p style={{ color: C.red, fontWeight: 700, margin: "0 0 8px" }}>❌ Não foi possível obter localização</p>
                <p style={{ color: C.muted, fontSize: 14, margin: "0 0 16px" }}>Verifique se o GPS está ativado e permita o acesso à localização.</p>
                <BotaoPrimario onClick={fazerCheckin}>Tentar novamente</BotaoPrimario>
              </div>
            )}
          </div>
        )}

        {/* ABA: TAREFAS */}
        {aba === "tarefas" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h2 style={{ color: C.text, fontSize: 22, fontWeight: 700, margin: "0 0 2px" }}>Tarefas</h2>
                <p style={{ color: C.muted, fontSize: 14, margin: 0 }}>{tarefasFeitas} de {tarefas.length} concluídas</p>
              </div>
              <div style={{ background: C.orange, borderRadius: 12, padding: "6px 14px", fontSize: 20, fontWeight: 700, color: "#fff" }}>
                {progresso}%
              </div>
            </div>
            <div style={{ background: C.border, borderRadius: 99, height: 6, marginBottom: 20 }}>
              <div style={{ background: C.orange, width: `${progresso}%`, height: "100%", borderRadius: 99, transition: "width 0.4s ease" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {tarefas.map((t) => (
                <div key={t.id} onClick={() => toggleTarefa(t.id)} style={{ background: t.feita ? C.greenBg : C.card, border: `1px solid ${t.feita ? C.green + "44" : C.border}`, borderRadius: 14, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer", transition: "all 0.2s" }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", border: `2px solid ${t.feita ? C.green : C.border}`, background: t.feita ? C.green : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#fff", transition: "all 0.2s" }}>
                    {t.feita && <IconCheck />}
                  </div>
                  <span style={{ fontSize: 15, color: t.feita ? C.muted : C.text, textDecoration: t.feita ? "line-through" : "none", flex: 1 }}>
                    {t.texto}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA: RUPTURA */}
        {aba === "ruptura" && (
          <div>
            <h2 style={{ color: C.text, fontSize: 22, fontWeight: 700, margin: "0 0 4px" }}>Ruptura de Produto</h2>
            <p style={{ color: C.muted, fontSize: 14, margin: "0 0 24px" }}>Registre produtos em falta na gôndola</p>
            {rupturaEnviada && (
              <div style={{ background: C.greenBg, border: `1px solid ${C.green}44`, borderRadius: 14, padding: 16, marginBottom: 16, color: C.green, fontWeight: 600 }}>
                ✅ Ruptura registrada com sucesso!
              </div>
            )}
            <CampoTexto label="Nome do produto *" placeholder="Ex: Coca-Cola 2L" value={produto} onChange={setProduto} />
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", color: C.muted, fontSize: 13, marginBottom: 8 }}>Motivo</label>
              <select value={motivo} onChange={(e) => setMotivo(e.target.value)} style={{ width: "100%", background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px", color: C.text, fontSize: 15, outline: "none" }}>
                <option value="">Selecionar motivo</option>
                <option value="falta_estoque">Falta de estoque</option>
                <option value="produto_vencido">Produto vencido</option>
                <option value="avaria">Avaria / embalagem danificada</option>
                <option value="reposicao_pendente">Reposição pendente</option>
                <option value="outro">Outro</option>
              </select>
            </div>
            <BotaoPrimario onClick={registrarRuptura} disabled={!produto.trim()}>
              ⚠️ Registrar Ruptura
            </BotaoPrimario>
          </div>
        )}

        {/* ABA: PERFIL */}
        {aba === "perfil" && (
          <div>
            <div style={{ textAlign: "center", padding: "24px 0 32px" }}>
              <div style={{ width: 80, height: 80, borderRadius: "50%", background: C.orange, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: 32, fontWeight: 700, color: "#fff" }}>
                {nomeUsuario[0].toUpperCase()}
              </div>
              <h2 style={{ color: C.text, margin: "0 0 4px", fontSize: 22, fontWeight: 700 }}>{nomeUsuario}</h2>
              <p style={{ color: C.muted, margin: 0, fontSize: 14 }}>{currentUser?.email}</p>
              <div style={{ marginTop: 10, display: "inline-block", background: `${C.orange}22`, color: C.orange, borderRadius: 8, padding: "4px 14px", fontSize: 13, fontWeight: 600 }}>
                Promotor
              </div>
            </div>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden", marginBottom: 16 }}>
              <InfoRow label="Email" valor={currentUser?.email} pad />
              <div style={{ borderTop: `1px solid ${C.border}` }} />
              <InfoRow label="Perfil" valor="Promotor de Campo" pad />
              <div style={{ borderTop: `1px solid ${C.border}` }} />
              <InfoRow label="Status" valor="● Ativo" cor={C.green} pad />
            </div>
            <button onClick={handleLogout} style={{ width: "100%", background: C.redBg, border: `1px solid ${C.red}44`, borderRadius: 14, padding: "16px", color: C.red, fontSize: 16, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <IconLogout /> Sair da conta
            </button>
          </div>
        )}

      </div>

      {/* BOTTOM NAV */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: C.card, borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-around", padding: "10px 0 env(safe-area-inset-bottom, 10px)", zIndex: 100 }}>
        <NavBtn icon={<IconHome />} label="Início" ativo={aba === "inicio"} onClick={() => setAba("inicio")} />
        <NavBtn icon={<IconPin />} label="Check-in" ativo={aba === "checkin"} onClick={() => setAba("checkin")} />
        <NavBtn icon={<IconList />} label="Tarefas" ativo={aba === "tarefas"} onClick={() => setAba("tarefas")} />
        <NavBtn icon={<IconUser />} label="Perfil" ativo={aba === "perfil"} onClick={() => setAba("perfil")} />
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function NavBtn({ icon, label, ativo, onClick }) {
  return (
    <button onClick={onClick} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "4px 16px", color: ativo ? "#E06820" : "#aab4cc", transition: "color 0.2s" }}>
      <div style={{ transform: ativo ? "scale(1.1)" : "scale(1)", transition: "transform 0.2s" }}>{icon}</div>
      <span style={{ fontSize: 11, fontWeight: ativo ? 700 : 400 }}>{label}</span>
    </button>
  );
}

function BotaoAcao({ icon, label, sub, cor, onClick }) {
  return (
    <button onClick={onClick} style={{ background: "#021d5a", border: "1px solid #0a3572", borderRadius: 16, padding: "18px 16px", cursor: "pointer", textAlign: "left", transition: "transform 0.1s" }}
      onTouchStart={e => e.currentTarget.style.transform = "scale(0.97)"}
      onTouchEnd={e => e.currentTarget.style.transform = "scale(1)"}
    >
      <div style={{ color: cor, marginBottom: 10 }}>{icon}</div>
      <p style={{ margin: "0 0 2px", fontSize: 15, fontWeight: 700, color: "#fff" }}>{label}</p>
      <p style={{ margin: 0, fontSize: 12, color: "#aab4cc" }}>{sub}</p>
    </button>
  );
}

function BotaoPrimario({ onClick, children, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ width: "100%", background: disabled ? "#333" : "#E06820", border: "none", borderRadius: 14, padding: "16px", color: "#fff", fontSize: 17, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer", marginBottom: 12, transition: "background 0.2s" }}>
      {children}
    </button>
  );
}

function BotaoSecundario({ onClick, children }) {
  return (
    <button onClick={onClick} style={{ width: "100%", background: "#021d5a", border: "1px solid #0a3572", borderRadius: 14, padding: "14px", color: "#E06820", fontSize: 16, fontWeight: 600, cursor: "pointer", marginBottom: 12 }}>
      {children}
    </button>
  );
}

function CampoTexto({ label, placeholder, value, onChange }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", color: "#aab4cc", fontSize: 13, marginBottom: 8 }}>{label}</label>
      <input type="text" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} style={{ width: "100%", background: "#021d5a", border: "1px solid #0a3572", borderRadius: 12, padding: "14px 16px", color: "#fff", fontSize: 15, outline: "none", boxSizing: "border-box" }} />
    </div>
  );
}

function InfoRow({ label, valor, cor, pad }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: pad ? "14px 18px" : "6px 0" }}>
      <span style={{ fontSize: 14, color: "#aab4cc" }}>{label}</span>
      <span style={{ fontSize: 14, color: cor || "#fff", fontWeight: 500 }}>{valor}</span>
    </div>
  );
}