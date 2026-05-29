import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth, db } from "../../firebase/config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { T, S } from "../../theme/tokens";

const NAV = [
  { key: "inicio",  icon: "⊞", label: "Início" },
  { key: "visita",  icon: "📍", label: "Visita" },
  { key: "tarefas", icon: "✓",  label: "Tarefas" },
  { key: "perfil",  icon: "👤", label: "Perfil" },
];

const TAREFAS_INIT = [
  { id: 1, texto: "Verificar validade dos produtos", feita: false },
  { id: 2, texto: "Organizar gôndola principal", feita: false },
  { id: 3, texto: "Repor estoque de bebidas", feita: false },
  { id: 4, texto: "Foto da entrada da loja", feita: false },
  { id: 5, texto: "Preencher relatório de ruptura", feita: false },
];

export default function PromotorDashboard() {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [aba, setAba] = useState("inicio");
  const [tarefas, setTarefas] = useState(TAREFAS_INIT);
  const [checkinAtivo, setCheckinAtivo] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [gpsStatus, setGpsStatus] = useState("idle");
  const [coords, setCoords] = useState(null);
  const [tempo, setTempo] = useState(0);
  const [salvando, setSalvando] = useState(false);
  const nome = userData?.nome || currentUser?.email?.split("@")[0] || "Promotor";

  useEffect(() => {
    if (!checkinAtivo) return;
    const t = setInterval(() => setTempo(p => p + 1), 1000);
    return () => clearInterval(t);
  }, [checkinAtivo]);

  function formatTempo(s) {
    const h = String(Math.floor(s / 3600)).padStart(2, "0");
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const seg = String(s % 60).padStart(2, "0");
    return `${h}:${m}:${seg}`;
  }

  function abrirSheet() { setSheet(true); setGpsStatus("idle"); }
  function fecharSheet() { setSheet(false); }

  async function fazerCheckin() {
    setGpsStatus("buscando");
    if (!navigator.geolocation) { setGpsStatus("erro"); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const precisao = pos.coords.accuracy;
        setCoords({ lat, lng, precisao });
        setSalvando(true);
        try {
          await addDoc(collection(db, "checkins"), {
            uid: currentUser.uid,
            nome, lat, lng, precisao,
            tipo: "checkin",
            timestamp: serverTimestamp(),
          });
          setGpsStatus("ok");
          setCheckinAtivo(true);
          setTempo(0);
          setSheet(false);
        } catch (e) {
          console.error(e);
          setGpsStatus("erro");
        }
        setSalvando(false);
      },
      (err) => { console.error(err); setGpsStatus("erro"); },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }

  async function fazerCheckout() {
    setSalvando(true);
    try {
      await addDoc(collection(db, "checkins"), {
        uid: currentUser.uid,
        nome,
        tipo: "checkout",
        tempoVisita: tempo,
        timestamp: serverTimestamp(),
      });
    } catch (e) { console.error(e); }
    setSalvando(false);
    setCheckinAtivo(false);
    setTempo(0);
    setCoords(null);
  }

  const tarefasFeitas = tarefas.filter(t => t.feita).length;

  return (
    <div style={{
      background: `radial-gradient(ellipse at 30% 0%, #0a3572 0%, #032774 50%, #010e2e 100%)`,
      minHeight: "100dvh",
      fontFamily: T.fontBody,
      color: T.text,
      maxWidth: 480,
      margin: "0 auto",
      display: "flex",
      flexDirection: "column",
      position: "relative",
      overflow: "hidden",
    }}>

      <div style={{
        position: "absolute", width: 280, height: 280, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(224,104,32,0.12) 0%, transparent 70%)",
        top: -60, right: -60, pointerEvents: "none",
      }} />

      {/* HEADER */}
      <div style={{
        padding: "52px 20px 16px",
        ...S.cardDark,
        borderRadius: "0 0 24px 24px",
        borderTop: "none",
        marginBottom: 16,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <p style={{ margin: 0, fontSize: 13, color: T.muted }}>Olá,</p>
            <h1 style={{ margin: "2px 0 0", fontFamily: T.fontTitle, fontSize: 28, fontWeight: 900, letterSpacing: -0.5 }}>
              {nome.split(" ")[0]} 👋
            </h1>
          </div>
          <div style={{
            ...S.card, padding: "6px 14px",
            borderRadius: T.pill,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: "50%",
              background: checkinAtivo ? T.green : T.muted,
              display: "inline-block",
              boxShadow: checkinAtivo ? `0 0 8px ${T.green}` : "none",
            }} />
            <span style={{ fontSize: 12, color: checkinAtivo ? T.green : T.muted, fontWeight: 600 }}>
              {checkinAtivo ? "Em visita" : "Offline"}
            </span>
          </div>
        </div>

        {checkinAtivo && (
          <div style={{
            marginTop: 16, padding: "12px 16px",
            background: "rgba(76,175,80,0.1)",
            border: "1px solid rgba(76,175,80,0.25)",
            borderRadius: T.r16,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ fontSize: 13, color: T.green }}>⏱ Tempo de visita</span>
            <span style={{ fontFamily: T.fontTitle, fontSize: 24, fontWeight: 700, color: T.green, letterSpacing: 1 }}>
              {formatTempo(tempo)}
            </span>
          </div>
        )}
      </div>

      {/* CONTEÚDO */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 100px" }}>

        {aba === "inicio" && (
          <div style={{ animation: "fadeInUp 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
              {[
                { label: "Tarefas", valor: `${tarefasFeitas}/${tarefas.length}`, cor: T.orange },
                { label: "Status", valor: checkinAtivo ? "Ativo" : "Parado", cor: checkinAtivo ? T.green : T.muted },
              ].map(c => (
                <div key={c.label} style={{ ...S.card, padding: 16, borderLeft: `3px solid ${c.cor}` }}>
                  <p style={{ margin: "0 0 6px", fontSize: 12, color: T.muted }}>{c.label}</p>
                  <p style={{ margin: 0, fontFamily: T.fontTitle, fontSize: 26, fontWeight: 700, color: c.cor }}>{c.valor}</p>
                </div>
              ))}
            </div>

            {!checkinAtivo ? (
              <button onClick={abrirSheet} style={{
                ...S.btnOrange, width: "100%", padding: "18px",
                fontSize: 20, borderRadius: T.r20, marginBottom: 12,
              }}>
                📍 Fazer Check-in
              </button>
            ) : (
              <button onClick={fazerCheckout} disabled={salvando} style={{
                ...S.btnGhost, width: "100%", padding: "18px",
                fontSize: 18, borderRadius: T.r20, marginBottom: 12,
                color: "#ff6b6b", border: "1px solid rgba(244,67,54,0.3)",
              }}>
                {salvando ? "Salvando..." : "🏁 Fazer Check-out"}
              </button>
            )}

            {checkinAtivo && coords && (
              <div style={{ ...S.card, padding: 16, marginBottom: 12 }}>
                <p style={{ margin: "0 0 6px", fontSize: 12, color: T.muted }}>📍 Localização registrada</p>
                <p style={{ margin: "0 0 4px", fontSize: 13, color: T.text }}>
                  {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                </p>
                <p style={{ margin: 0, fontSize: 11, color: T.muted }}>
                  Precisão: ±{Math.round(coords.precisao)}m
                </p>
              </div>
            )}

            <p style={{ fontFamily: T.fontTitle, fontSize: 18, fontWeight: 700, margin: "20px 0 10px" }}>Acesso rápido</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { icon: "✓",  label: "Tarefas do dia", key: "tarefas" },
                { icon: "📷", label: "Registrar fotos", key: "visita" },
              ].map(item => (
                <button key={item.key} onClick={() => setAba(item.key)} style={{
                  ...S.btnGhost, padding: "16px", textAlign: "left",
                  fontSize: 15, display: "flex", alignItems: "center", gap: 10,
                }}>
                  <span style={{ fontSize: 20 }}>{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {aba === "tarefas" && (
          <div style={{ animation: "fadeInUp 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}>
            <p style={{ fontFamily: T.fontTitle, fontSize: 22, fontWeight: 700, margin: "0 0 16px" }}>
              Tarefas — {tarefasFeitas}/{tarefas.length}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {tarefas.map(tarefa => (
                <button key={tarefa.id} onClick={() => setTarefas(prev =>
                  prev.map(t => t.id === tarefa.id ? { ...t, feita: !t.feita } : t)
                )} style={{
                  ...S.card, padding: "16px",
                  display: "flex", alignItems: "center", gap: 12,
                  cursor: "pointer", textAlign: "left",
                  borderLeft: tarefa.feita ? `3px solid ${T.green}` : `3px solid ${T.border}`,
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%",
                    background: tarefa.feita ? T.green : "transparent",
                    border: `2px solid ${tarefa.feita ? T.green : T.muted}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    {tarefa.feita && <span style={{ fontSize: 12, color: "#fff" }}>✓</span>}
                  </div>
                  <span style={{
                    fontSize: 15,
                    color: tarefa.feita ? T.muted : T.text,
                    textDecoration: tarefa.feita ? "line-through" : "none",
                  }}>{tarefa.texto}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {aba === "visita" && (
          <div style={{ animation: "fadeInUp 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}>
            <p style={{ fontFamily: T.fontTitle, fontSize: 22, fontWeight: 700, margin: "0 0 16px" }}>Registrar Fotos</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {["Ponto Extra","Geladeira","Display","Encarte","Clip Strip","Material PDV","Check Out"].map(tipo => (
                <div key={tipo} style={{ ...S.card, padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 15 }}>📷 {tipo}</span>
                  <span style={{ fontSize: 12, color: T.muted, background: "rgba(255,255,255,0.06)", padding: "4px 10px", borderRadius: T.pill }}>
                    Em breve
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "perfil" && (
          <div style={{ animation: "fadeInUp 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}>
            <div style={{ ...S.cardDark, padding: 24, borderRadius: T.r20, textAlign: "center", marginBottom: 16 }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                background: T.orange, display: "flex", alignItems: "center",
                justifyContent: "center", margin: "0 auto 12px",
                fontFamily: T.fontTitle, fontSize: 28, fontWeight: 700,
              }}>
                {nome[0].toUpperCase()}
              </div>
              <p style={{ margin: "0 0 4px", fontFamily: T.fontTitle, fontSize: 22, fontWeight: 700 }}>{nome}</p>
              <p style={{ margin: 0, fontSize: 13, color: T.muted }}>{currentUser?.email}</p>
              <span style={{
                display: "inline-block", marginTop: 10,
                background: "rgba(224,104,32,0.15)", color: T.orange,
                borderRadius: T.pill, padding: "4px 14px", fontSize: 12, fontWeight: 600,
              }}>Promotor</span>
            </div>
            <button onClick={async () => { await signOut(auth); navigate("/login"); }} style={{
              ...S.btnGhost, width: "100%", padding: 16,
              color: "#ff6b6b", border: "1px solid rgba(244,67,54,0.25)", fontSize: 15,
            }}>
              🚪 Sair da conta
            </button>
          </div>
        )}
      </div>

      {/* BOTTOM NAV */}
      <div style={{
        position: "fixed", bottom: 0, left: "50%",
        transform: "translateX(-50%)",
        width: "100%", maxWidth: 480,
        ...S.cardDark,
        borderRadius: "20px 20px 0 0",
        borderBottom: "none",
        display: "flex",
        padding: "8px 0 20px",
        zIndex: 50,
      }}>
        {NAV.map(item => (
          <button key={item.key} onClick={() => setAba(item.key)} style={{
            flex: 1, background: "none", border: "none", cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            padding: "8px 0", transition: T.smooth,
          }}>
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: aba === item.key ? T.orange : T.muted }}>
              {item.label}
            </span>
            {aba === item.key && (
              <div style={{ width: 4, height: 4, borderRadius: "50%", background: T.orange }} />
            )}
          </button>
        ))}
      </div>

      {/* BOTTOM SHEET CHECK-IN */}
      {sheet && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100 }}>
          <div onClick={fecharSheet} style={{
            position: "absolute", inset: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
          }} />
          <div style={{
            position: "absolute", bottom: 0, left: "50%",
            transform: "translateX(-50%)",
            width: "100%", maxWidth: 480,
            ...S.cardDark,
            borderRadius: "24px 24px 0 0",
            padding: "12px 24px 40px",
            animation: "slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1)",
          }}>
            <div style={S.grabber} />
            <p style={{ fontFamily: T.fontTitle, fontSize: 24, fontWeight: 700, margin: "0 0 8px" }}>Check-in GPS</p>
            <p style={{ fontSize: 14, color: T.muted, margin: "0 0 24px" }}>
              Sua localização será registrada no momento do check-in.
            </p>

            {gpsStatus === "idle" && (
              <button onClick={fazerCheckin} style={{
                ...S.btnOrange, width: "100%", padding: 18, fontSize: 18, borderRadius: T.r16,
              }}>
                📍 Confirmar Check-in
              </button>
            )}
            {gpsStatus === "buscando" && (
              <div style={{ textAlign: "center", padding: 20 }}>
                <p style={{ color: T.orange, fontSize: 15 }}>📡 Buscando localização...</p>
              </div>
            )}
            {gpsStatus === "erro" && (
              <div style={{ textAlign: "center" }}>
                <p style={{ color: "#ff6b6b", marginBottom: 16 }}>⚠️ GPS não disponível. Ative a localização.</p>
                <button onClick={fazerCheckin} style={{ ...S.btnOrange, padding: "14px 32px", borderRadius: T.r16 }}>
                  Tentar novamente
                </button>
              </div>
            )}
            {salvando && (
              <p style={{ textAlign: "center", color: T.muted, marginTop: 12, fontSize: 13 }}>
                Salvando no servidor...
              </p>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { transform: translateX(-50%) translateY(100%); }
          to   { transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}