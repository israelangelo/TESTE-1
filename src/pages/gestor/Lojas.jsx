import { useState, useEffect } from "react";
import { db } from "../../firebase/config";
import {
  collection, onSnapshot, addDoc, updateDoc,
  deleteDoc, doc, serverTimestamp,
} from "firebase/firestore";
import { T, S } from "../../theme/tokens";
import { useBackButton } from "../../hooks/useBackButton";
import GeometricBackground from "../../components/GeometricBackground";
import SidebarGestor from "../../components/SidebarGestor"; // <-- ADICIONADO AQUI

const FORM_VAZIO = {
  nome: "", endereco: "", cidade: "", lat: "", lng: "",
};

export default function Lojas() {
  const [menuAberto, setMenuAberto] = useState(false);
  const [lojas, setLojas] = useState([]);
  const [sheet, setSheet] = useState(false);
  const [form, setForm] = useState(FORM_VAZIO);
  const [editandoId, setEditandoId] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [deletando, setDeletando] = useState(null);
  const [busca, setBusca] = useState("");
  const [gpsCarregando, setGpsCarregando] = useState(false);

  useBackButton(); // <-- ADICIONADO AQUI

  // ── Escuta lojas em tempo real ──────────────────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "lojas"), (snap) => {
      setLojas(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // ── GPS automático ──────────────────────────────────────────────────
  function pegarGPS() {
    if (!navigator.geolocation) return;
    setGpsCarregando(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          lat: pos.coords.latitude.toFixed(6),
          lng: pos.coords.longitude.toFixed(6),
        }));
        setGpsCarregando(false);
      },
      () => setGpsCarregando(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  // ── Abrir form ──────────────────────────────────────────────────────
  function abrirNova() {
    setForm(FORM_VAZIO);
    setEditandoId(null);
    setSheet(true);
  }

  function abrirEditar(loja) {
    setForm({
      nome: loja.nome || "",
      endereco: loja.endereco || "",
      cidade: loja.cidade || "",
      lat: loja.lat?.toString() || "",
      lng: loja.lng?.toString() || "",
    });
    setEditandoId(loja.id);
    setSheet(true);
  }

  // ── Salvar (criar ou editar) ────────────────────────────────────────
  async function salvar() {
    if (!form.nome.trim()) return;
    setSalvando(true);
    const dados = {
      nome: form.nome.trim(),
      endereco: form.endereco.trim(),
      cidade: form.cidade.trim(),
      lat: form.lat ? parseFloat(form.lat) : null,
      lng: form.lng ? parseFloat(form.lng) : null,
      atualizadoEm: serverTimestamp(),
    };
    try {
      if (editandoId) {
        await updateDoc(doc(db, "lojas", editandoId), dados);
      } else {
        await addDoc(collection(db, "lojas"), {
          ...dados,
          criadoEm: serverTimestamp(),
        });
      }
      setSheet(false);
      setForm(FORM_VAZIO);
      setEditandoId(null);
    } catch (e) {
      console.error(e);
    }
    setSalvando(false);
  }

  // ── Deletar ─────────────────────────────────────────────────────────
  async function deletar(id) {
    if (deletando !== id) { setDeletando(id); return; }
    await deleteDoc(doc(db, "lojas", id));
    setDeletando(null);
  }

  const lojasFiltradas = lojas.filter((l) =>
    l.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    l.cidade?.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div style={{
      minHeight: "100dvh", fontFamily: T.fontBody, color: T.text,
      maxWidth: 480, margin: "0 auto", padding: "52px 16px 100px",
      position: "relative",
    }}>
      <GeometricBackground />
      <SidebarGestor aberto={menuAberto} onFechar={() => setMenuAberto(false)} />

      {/* ── HEADER ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, position: "relative", zIndex: 1 }}>
        <div>
          <p style={{ margin: 0, fontSize: 12, color: T.muted }}>Gerenciar</p>
          <h1 style={{ margin: 0, fontFamily: T.fontTitle, fontSize: 30, fontWeight: 900, letterSpacing: -0.5 }}>
            Lojas
          </h1>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={abrirNova} style={{
            ...S.btnOrange, padding: "10px 20px", fontSize: 15,
            borderRadius: T.pill, display: "flex", alignItems: "center", gap: 6,
          }}>
            + Nova
          </button>
          <button onClick={() => setMenuAberto(true)} style={{
            ...S.card, border: "none", padding: "10px 14px", cursor: "pointer", fontSize: 22,
          }}>☰</button>
        </div>
      </div>

      {/* ── BUSCA ── */}
      <input
        placeholder="🔍 Buscar loja ou cidade..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        style={{ ...S.input, marginBottom: 16 }}
      />

      {/* ── CONTADOR ── */}
      <p style={{ fontSize: 13, color: T.muted, margin: "0 0 12px" }}>
        {lojasFiltradas.length} {lojasFiltradas.length === 1 ? "loja" : "lojas"}
      </p>

      {/* ── LISTA ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {lojasFiltradas.length === 0 && (
          <div style={{ ...S.card, padding: 32, textAlign: "center" }}>
            <p style={{ margin: 0, color: T.muted, fontSize: 14 }}>Nenhuma loja cadastrada.</p>
          </div>
        )}

        {lojasFiltradas.map((loja) => (
          <div key={loja.id} style={{
            ...S.card, padding: "16px",
            borderLeft: `3px solid ${loja.lat ? T.green : T.border}`,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <p style={{ margin: "0 0 4px", fontFamily: T.fontTitle, fontSize: 18, fontWeight: 700 }}>
                  {loja.nome}
                </p>
                {loja.endereco && (
                  <p style={{ margin: "0 0 2px", fontSize: 12, color: T.muted }}>📍 {loja.endereco}</p>
                )}
                {loja.cidade && (
                  <p style={{ margin: "0 0 6px", fontSize: 12, color: T.muted }}>🏙 {loja.cidade}</p>
                )}
                <span style={{
                  fontSize: 11, padding: "3px 10px", borderRadius: T.pill,
                  background: loja.lat ? "rgba(76,175,80,0.15)" : "rgba(255,255,255,0.06)",
                  color: loja.lat ? T.green : T.muted,
                }}>
                  {loja.lat ? `GPS: ${loja.lat}, ${loja.lng}` : "Sem GPS"}
                </span>
              </div>

              {/* Botões */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginLeft: 10 }}>
                <button onClick={() => abrirEditar(loja)} style={{
                  ...S.btnGhost, padding: "6px 14px", fontSize: 12,
                }}>
                  ✏️ Editar
                </button>
                <button onClick={() => deletar(loja.id)} style={{
                  ...S.btnGhost, padding: "6px 14px", fontSize: 12,
                  color: deletando === loja.id ? "#ff6b6b" : T.muted,
                  border: deletando === loja.id ? "1px solid rgba(244,67,54,0.4)" : undefined,
                }}>
                  {deletando === loja.id ? "Confirmar?" : "🗑 Deletar"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── BOTTOM SHEET FORM ── */}
      {sheet && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100 }}>
          <div onClick={() => setSheet(false)} style={{
            position: "absolute", inset: 0,
            background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
          }} />
          <div style={{
            position: "absolute", bottom: 0, left: "50%",
            transform: "translateX(-50%)",
            width: "100%", maxWidth: 480,
            ...S.cardDark, borderRadius: "24px 24px 0 0",
            padding: "12px 24px 48px",
            animation: "slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1)",
            maxHeight: "90dvh", overflowY: "auto",
          }}>
            <div style={S.grabber} />
            <p style={{ fontFamily: T.fontTitle, fontSize: 24, fontWeight: 700, margin: "0 0 20px" }}>
              {editandoId ? "Editar Loja" : "Nova Loja"}
            </p>

            {/* Nome */}
            <p style={{ margin: "0 0 6px", fontSize: 13, color: T.muted }}>Nome da loja *</p>
            <input
              placeholder="Ex: Atacadão Serra"
              value={form.nome}
              onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              style={{ ...S.input, marginBottom: 14 }}
            />

            {/* Endereço */}
            <p style={{ margin: "0 0 6px", fontSize: 13, color: T.muted }}>Endereço</p>
            <input
              placeholder="Ex: Av. Central, 1200"
              value={form.endereco}
              onChange={(e) => setForm((f) => ({ ...f, endereco: e.target.value }))}
              style={{ ...S.input, marginBottom: 14 }}
            />

            {/* Cidade */}
            <p style={{ margin: "0 0 6px", fontSize: 13, color: T.muted }}>Cidade</p>
            <input
              placeholder="Ex: Serra"
              value={form.cidade}
              onChange={(e) => setForm((f) => ({ ...f, cidade: e.target.value }))}
              style={{ ...S.input, marginBottom: 14 }}
            />

            {/* GPS */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <p style={{ margin: 0, fontSize: 13, color: T.muted }}>Coordenadas GPS</p>
              <button onClick={pegarGPS} style={{
                ...S.btnGhost, padding: "4px 12px", fontSize: 12,
                color: T.orange, border: `1px solid rgba(224,104,32,0.3)`,
              }}>
                {gpsCarregando ? "Buscando..." : "📍 Usar minha localização"}
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
              <input
                placeholder="Latitude"
                value={form.lat}
                onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value }))}
                style={{ ...S.input }}
                inputMode="decimal"
              />
              <input
                placeholder="Longitude"
                value={form.lng}
                onChange={(e) => setForm((f) => ({ ...f, lng: e.target.value }))}
                style={{ ...S.input }}
                inputMode="decimal"
              />
            </div>
            <p style={{ margin: "-18px 0 20px", fontSize: 11, color: T.muted }}>
              💡 Clique em "Usar minha localização" estando na frente da loja.
            </p>

            {/* Botão salvar */}
            <button onClick={salvar} disabled={salvando || !form.nome.trim()} style={{
              ...S.btnOrange, width: "100%", padding: 18,
              fontSize: 18, borderRadius: T.r16,
              opacity: salvando || !form.nome.trim() ? 0.5 : 1,
              cursor: salvando || !form.nome.trim() ? "not-allowed" : "pointer",
            }}>
              {salvando ? "Salvando..." : editandoId ? "💾 Salvar alterações" : "✅ Criar loja"}
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateX(-50%) translateY(100%); }
          to   { transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}