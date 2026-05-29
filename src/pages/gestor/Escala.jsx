import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection, getDocs, addDoc, updateDoc,
  deleteDoc, doc, query, where
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { T, S } from "../../theme/tokens";

const hoje = () => new Date().toISOString().split("T")[0];

export default function Escala() {
  const navigate = useNavigate();

  const [promotores, setPromotores] = useState([]);
  const [lojas, setLojas]           = useState([]);
  const [escalas, setEscalas]       = useState([]);

  const [data, setData]                   = useState(hoje());
  const [promotorId, setPromotorId]       = useState("");
  const [lojasSel, setLojasSel]           = useState([]);
  const [editId, setEditId]               = useState(null);

  const [sheet, setSheet]   = useState(null); // escala aberta no bottom sheet
  const [loading, setLoading] = useState(false);
  const [toast, setToast]   = useState("");

  // ── carrega dados ─────────────────────────────────────────
  useEffect(() => { carregar(); }, []);

  async function carregar() {
    const [snapP, snapL, snapE] = await Promise.all([
      getDocs(query(collection(db, "usuarios"), where("perfil", "==", "promotor"))),
      getDocs(collection(db, "lojas")),
      getDocs(collection(db, "escalas")),
    ]);
    setPromotores(snapP.docs.map(d => ({ id: d.id, ...d.data() })));
    setLojas(snapL.docs.map(d => ({ id: d.id, ...d.data() })));
    setEscalas(snapE.docs.map(d => ({ id: d.id, ...d.data() })));
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2800);
  }

  // ── toggle loja na seleção ────────────────────────────────
  function toggleLoja(id) {
    setLojasSel(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  // ── abrir edição ──────────────────────────────────────────
  function abrirEdicao(esc) {
    setEditId(esc.id);
    setData(esc.data);
    setPromotorId(esc.promotorId);
    setLojasSel(esc.lojas || []);
    setSheet(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ── salvar (criar ou editar) ──────────────────────────────
  async function salvar() {
    if (!promotorId || !data || lojasSel.length === 0) {
      showToast("Preencha todos os campos ⚠️"); return;
    }
    setLoading(true);
    const payload = { promotorId, data, lojas: lojasSel };
    try {
      if (editId) {
        await updateDoc(doc(db, "escalas", editId), payload);
        showToast("Escala atualizada ✅");
      } else {
        await addDoc(collection(db, "escalas"), payload);
        showToast("Escala criada ✅");
      }
      resetForm();
      await carregar();
    } catch (e) {
      showToast("Erro ao salvar ❌");
    }
    setLoading(false);
  }

  async function excluir(id) {
    setLoading(true);
    try {
      await deleteDoc(doc(db, "escalas", id));
      setSheet(null);
      showToast("Escala removida 🗑️");
      await carregar();
    } catch { showToast("Erro ao excluir ❌"); }
    setLoading(false);
  }

  function resetForm() {
    setEditId(null);
    setData(hoje());
    setPromotorId("");
    setLojasSel([]);
  }

  // ── helpers ───────────────────────────────────────────────
  const nomePromotor = id => promotores.find(p => p.id === id)?.nome || id;
  const nomeLoja     = id => lojas.find(l => l.id === id)?.nome || id;

  // agrupa escalas por data
  const porData = escalas.reduce((acc, e) => {
    (acc[e.data] = acc[e.data] || []).push(e);
    return acc;
  }, {});
  const datasOrdenadas = Object.keys(porData).sort((a, b) => b.localeCompare(a));

  // ── estilos inline ────────────────────────────────────────
  const st = {
    page: {
      minHeight: "100vh",
      background: T.colors.bg,
      fontFamily: T.fonts.body,
      paddingBottom: 100,
    },
    header: {
      background: `linear-gradient(135deg, ${T.colors.card} 0%, #021040 100%)`,
      padding: "52px 20px 20px",
      borderBottom: `1px solid ${T.colors.border}`,
      display: "flex", alignItems: "center", gap: 14,
    },
    backBtn: {
      background: "rgba(255,255,255,.08)",
      border: `1px solid ${T.colors.border}`,
      borderRadius: 12, width: 38, height: 38,
      display: "flex", alignItems: "center", justifyContent: "center",
      cursor: "pointer", color: "#fff", fontSize: 18,
    },
    headerTitle: {
      fontSize: 22, fontWeight: 700,
      fontFamily: T.fonts.title, color: "#fff",
    },
    section: {
      margin: "20px 16px 0",
      background: T.colors.card,
      border: `1px solid ${T.colors.border}`,
      borderRadius: 18, overflow: "hidden",
    },
    sectionTitle: {
      padding: "14px 18px 10px",
      fontSize: 11, fontWeight: 700,
      letterSpacing: 1.4, textTransform: "uppercase",
      color: T.colors.muted,
      borderBottom: `1px solid ${T.colors.border}`,
    },
    field: { padding: "4px 18px 0" },
    label: {
      fontSize: 12, color: T.colors.muted,
      fontWeight: 600, marginBottom: 4, display: "block",
      paddingTop: 14,
    },
    input: {
      width: "100%", boxSizing: "border-box",
      background: "rgba(255,255,255,.06)",
      border: `1px solid ${T.colors.border}`,
      borderRadius: 12, padding: "12px 14px",
      color: "#fff", fontSize: 15,
      fontFamily: T.fonts.body, outline: "none",
      WebkitAppearance: "none",
    },
    select: {
      width: "100%", boxSizing: "border-box",
      background: "#021d5a",
      border: `1px solid ${T.colors.border}`,
      borderRadius: 12, padding: "12px 14px",
      color: "#fff", fontSize: 15,
      fontFamily: T.fonts.body, outline: "none",
    },
    lojaGrid: {
      display: "grid", gridTemplateColumns: "1fr 1fr",
      gap: 8, padding: "14px 18px 18px",
    },
    lojaChip: (sel) => ({
      padding: "10px 10px",
      borderRadius: 12, fontSize: 13, fontWeight: 600,
      textAlign: "center", cursor: "pointer",
      transition: "all .2s",
      background: sel ? T.colors.accent : "rgba(255,255,255,.06)",
      border: `1.5px solid ${sel ? T.colors.accent : T.colors.border}`,
      color: sel ? "#fff" : T.colors.muted,
    }),
    btnRow: {
      display: "flex", gap: 10,
      padding: "0 16px", marginTop: 16,
    },
    btn: (variant) => ({
      flex: 1, padding: "15px 0",
      borderRadius: 14, border: "none",
      fontFamily: T.fonts.body, fontWeight: 700,
      fontSize: 15, cursor: "pointer",
      background: variant === "primary"
        ? `linear-gradient(135deg, ${T.colors.accent}, #c85510)`
        : "rgba(255,255,255,.07)",
      color: "#fff",
      opacity: loading ? .6 : 1,
    }),
    dayGroup: { margin: "20px 16px 0" },
    dayLabel: {
      fontSize: 12, fontWeight: 700,
      letterSpacing: 1.2, textTransform: "uppercase",
      color: T.colors.muted, marginBottom: 8,
    },
    card: {
      background: T.colors.card,
      border: `1px solid ${T.colors.border}`,
      borderRadius: 16, padding: "14px 16px",
      marginBottom: 10, cursor: "pointer",
      display: "flex", justifyContent: "space-between",
      alignItems: "center",
    },
    cardName: { fontSize: 15, fontWeight: 700, color: "#fff" },
    cardSub: { fontSize: 12, color: T.colors.muted, marginTop: 3 },
    badge: {
      background: "rgba(224,104,32,.18)",
      border: `1px solid ${T.colors.accent}`,
      borderRadius: 20, padding: "4px 10px",
      fontSize: 11, fontWeight: 700, color: T.colors.accent,
    },
    // bottom sheet
    overlay: {
      position: "fixed", inset: 0,
      background: "rgba(0,0,0,.6)",
      zIndex: 50, backdropFilter: "blur(4px)",
    },
    bottomSheet: {
      position: "fixed", bottom: 0, left: "50%",
      transform: "translateX(-50%)",
      width: "100%", maxWidth: 480,
      background: T.colors.card,
      borderTop: `1px solid ${T.colors.border}`,
      borderRadius: "24px 24px 0 0",
      zIndex: 51, padding: "0 0 40px",
    },
    grabber: {
      width: 36, height: 4,
      background: T.colors.border,
      borderRadius: 99, margin: "12px auto 20px",
    },
    sheetTitle: {
      fontSize: 17, fontWeight: 700, color: "#fff",
      padding: "0 20px 14px",
      borderBottom: `1px solid ${T.colors.border}`,
    },
    sheetRow: {
      display: "flex", alignItems: "flex-start",
      gap: 12, padding: "14px 20px",
      borderBottom: `1px solid rgba(255,255,255,.05)`,
    },
    sheetIcon: {
      fontSize: 18, width: 32, height: 32,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(255,255,255,.07)", borderRadius: 10,
    },
    sheetLabel: { fontSize: 12, color: T.colors.muted, marginBottom: 2 },
    sheetValue: { fontSize: 14, color: "#fff", fontWeight: 600 },
    sheetLojas: {
      display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6,
    },
    sheetLojaBadge: {
      background: "rgba(3,39,116,.5)",
      border: `1px solid ${T.colors.border}`,
      borderRadius: 20, padding: "4px 10px",
      fontSize: 12, color: "#ccd5ee",
    },
    sheetBtns: {
      display: "flex", gap: 10, padding: "20px 20px 0",
    },
    toast: {
      position: "fixed", bottom: 90, left: "50%",
      transform: "translateX(-50%)",
      background: "#1a2f6e", border: `1px solid ${T.colors.border}`,
      borderRadius: 99, padding: "12px 22px",
      fontSize: 14, color: "#fff", fontWeight: 600,
      zIndex: 999, whiteSpace: "nowrap",
      boxShadow: "0 8px 32px rgba(0,0,0,.4)",
    },
    empty: {
      textAlign: "center", padding: "48px 20px",
      color: T.colors.muted, fontSize: 14,
    },
  };

  const formatData = (d) => {
    if (!d) return "";
    const [y, m, dia] = d.split("-");
    return `${dia}/${m}/${y}`;
  };

  return (
    <div style={st.page}>

      {/* ── HEADER ── */}
      <div style={st.header}>
        <button style={st.backBtn} onClick={() => navigate("/gestor")}>‹</button>
        <div>
          <div style={st.headerTitle}>Escala</div>
          <div style={{ fontSize: 12, color: T.colors.muted, marginTop: 1 }}>
            Atribuição de lojas por dia
          </div>
        </div>
      </div>

      {/* ── FORMULÁRIO ── */}
      <div style={st.section}>
        <div style={st.sectionTitle}>
          {editId ? "✏️  Editar escala" : "➕  Nova escala"}
        </div>

        {/* Data */}
        <div style={st.field}>
          <label style={st.label}>Data</label>
          <input
            type="date"
            value={data}
            onChange={e => setData(e.target.value)}
            style={st.input}
          />
        </div>

        {/* Promotor */}
        <div style={{ ...st.field, paddingBottom: 0 }}>
          <label style={st.label}>Promotor</label>
          <select
            value={promotorId}
            onChange={e => setPromotorId(e.target.value)}
            style={st.select}
          >
            <option value="">Selecione…</option>
            {promotores.map(p => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
        </div>

        {/* Lojas */}
        <div style={{ padding: "14px 18px 4px" }}>
          <div style={{ ...st.label, paddingTop: 0 }}>
            Lojas — toque para selecionar
          </div>
        </div>
        {lojas.length === 0 ? (
          <div style={{ ...st.empty, padding: "16px 18px" }}>
            Nenhuma loja cadastrada
          </div>
        ) : (
          <div style={st.lojaGrid}>
            {lojas.map(l => (
              <div
                key={l.id}
                style={st.lojaChip(lojasSel.includes(l.id))}
                onClick={() => toggleLoja(l.id)}
              >
                {lojasSel.includes(l.id) ? "✓ " : ""}{l.nome}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Botões */}
      <div style={st.btnRow}>
        {editId && (
          <button style={st.btn("secondary")} onClick={resetForm}>
            Cancelar
          </button>
        )}
        <button
          style={st.btn("primary")}
          onClick={salvar}
          disabled={loading}
        >
          {loading ? "Salvando…" : editId ? "Salvar alterações" : "Criar escala"}
        </button>
      </div>

      {/* ── LISTA DE ESCALAS ── */}
      {datasOrdenadas.length === 0 ? (
        <div style={st.empty}>Nenhuma escala cadastrada ainda.</div>
      ) : (
        datasOrdenadas.map(d => (
          <div key={d} style={st.dayGroup}>
            <div style={st.dayLabel}>{formatData(d)}</div>
            {porData[d].map(esc => (
              <div
                key={esc.id}
                style={st.card}
                onClick={() => setSheet(esc)}
              >
                <div>
                  <div style={st.cardName}>{nomePromotor(esc.promotorId)}</div>
                  <div style={st.cardSub}>
                    {(esc.lojas || []).slice(0, 2).map(nomeLoja).join(", ")}
                    {(esc.lojas || []).length > 2
                      ? ` +${esc.lojas.length - 2}`
                      : ""}
                  </div>
                </div>
                <div style={st.badge}>{(esc.lojas || []).length} lojas</div>
              </div>
            ))}
          </div>
        ))
      )}

      {/* ── BOTTOM SHEET DETALHE ── */}
      {sheet && (
        <>
          <div style={st.overlay} onClick={() => setSheet(null)} />
          <div style={st.bottomSheet}>
            <div style={st.grabber} />
            <div style={st.sheetTitle}>Detalhes da Escala</div>

            <div style={st.sheetRow}>
              <div style={st.sheetIcon}>📅</div>
              <div>
                <div style={st.sheetLabel}>Data</div>
                <div style={st.sheetValue}>{formatData(sheet.data)}</div>
              </div>
            </div>

            <div style={st.sheetRow}>
              <div style={st.sheetIcon}>👤</div>
              <div>
                <div style={st.sheetLabel}>Promotor</div>
                <div style={st.sheetValue}>{nomePromotor(sheet.promotorId)}</div>
              </div>
            </div>

            <div style={st.sheetRow}>
              <div style={st.sheetIcon}>🏪</div>
              <div>
                <div style={st.sheetLabel}>
                  {(sheet.lojas || []).length} loja(s)
                </div>
                <div style={st.sheetLojas}>
                  {(sheet.lojas || []).map(id => (
                    <span key={id} style={st.sheetLojaBadge}>
                      {nomeLoja(id)}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div style={st.sheetBtns}>
              <button
                style={{ ...st.btn("secondary"), flex: 1 }}
                onClick={() => abrirEdicao(sheet)}
              >
                ✏️ Editar
              </button>
              <button
                style={{
                  ...st.btn("primary"), flex: 1,
                  background: "linear-gradient(135deg,#b91c1c,#7f1d1d)",
                }}
                onClick={() => excluir(sheet.id)}
                disabled={loading}
              >
                🗑️ Excluir
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── TOAST ── */}
      {toast && <div style={st.toast}>{toast}</div>}
    </div>
  );
}