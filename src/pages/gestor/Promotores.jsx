import { useState, useEffect } from "react";
import { db } from "../../firebase/config";
import {
  collection, onSnapshot, updateDoc,
  deleteDoc, doc, serverTimestamp,
} from "firebase/firestore";
import { T, S } from "../../theme/tokens";

export default function Promotores() {
  const [promotores, setPromotores] = useState([]);
  const [lojas, setLojas] = useState([]);
  const [sheet, setSheet] = useState(false);
  const [selecionado, setSelecionado] = useState(null);
  const [lojaId, setLojaId] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [deletando, setDeletando] = useState(null);
  const [busca, setBusca] = useState("");

  // ── Escuta promotores (perfil === "promotor") ───────────────────────
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "usuarios"), (snap) => {
      setPromotores(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((u) => u.perfil === "promotor")
      );
    });
    return () => unsub();
  }, []);

  // ── Escuta lojas ────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "lojas"), (snap) => {
      setLojas(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // ── Abrir sheet de atribuição ───────────────────────────────────────
  function abrirAtribuir(promotor) {
    setSelecionado(promotor);
    setLojaId(promotor.lojaId || "");
    setSheet(true);
  }

  // ── Salvar atribuição de loja ───────────────────────────────────────
  async function salvarAtribuicao() {
    if (!selecionado) return;
    setSalvando(true);
    try {
      await updateDoc(doc(db, "usuarios", selecionado.id), {
        lojaId: lojaId || null,
        lojaNome: lojas.find((l) => l.id === lojaId)?.nome || null,
        atualizadoEm: serverTimestamp(),
      });
      setSheet(false);
    } catch (e) {
      console.error(e);
    }
    setSalvando(false);
  }

  // ── Ativar / Desativar promotor ─────────────────────────────────────
  async function toggleAtivo(promotor) {
    await updateDoc(doc(db, "usuarios", promotor.id), {
      ativo: !promotor.ativo,
    });
  }

  // ── Deletar ─────────────────────────────────────────────────────────
  async function deletar(id) {
    if (deletando !== id) { setDeletando(id); return; }
    await deleteDoc(doc(db, "usuarios", id));
    setDeletando(null);
  }

  function nomeLoja(id) {
    return lojas.find((l) => l.id === id)?.nome || null;
  }

  const filtrados = promotores.filter((p) =>
    p.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    p.email?.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div style={{
      background: `radial-gradient(ellipse at 30% 0%, #0a3572 0%, #032774 50%, #010e2e 100%)`,
      minHeight: "100dvh", fontFamily: T.fontBody, color: T.text,
      maxWidth: 480, margin: "0 auto", padding: "52px 16px 100px",
      position: "relative",
    }}>

      {/* Orb */}
      <div style={{
        position: "fixed", width: 250, height: 250, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(224,104,32,0.10) 0%, transparent 70%)",
        top: -50, right: -50, pointerEvents: "none", zIndex: 0,
      }} />

      {/* ── HEADER ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <p style={{ margin: 0, fontSize: 12, color: T.muted }}>Gerenciar</p>
          <h1 style={{ margin: 0, fontFamily: T.fontTitle, fontSize: 30, fontWeight: 900, letterSpacing: -0.5 }}>
            Promotores
          </h1>
        </div>
        <div style={{
          ...S.card, padding: "8px 16px", borderRadius: T.pill,
          fontFamily: T.fontTitle, fontSize: 20, fontWeight: 700, color: T.orange,
        }}>
          {promotores.length}
        </div>
      </div>

      {/* ── BUSCA ── */}
      <input
        placeholder="🔍 Buscar por nome ou e-mail..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        style={{ ...S.input, marginBottom: 16 }}
      />

      {/* ── LISTA ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtrados.length === 0 && (
          <div style={{ ...S.card, padding: 32, textAlign: "center" }}>
            <p style={{ margin: 0, color: T.muted, fontSize: 14 }}>
              Nenhum promotor cadastrado.
            </p>
            <p style={{ margin: "8px 0 0", color: T.muted, fontSize: 12 }}>
              Crie promotores em Configurações → Criar usuário.
            </p>
          </div>
        )}

        {filtrados.map((p) => {
          const loja = nomeLoja(p.lojaId);
          const ativo = p.ativo !== false;
          return (
            <div key={p.id} style={{
              ...S.card, padding: 16,
              borderLeft: `3px solid ${ativo ? T.green : T.muted}`,
              opacity: ativo ? 1 : 0.6,
            }}>
              {/* Topo */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {/* Avatar */}
                  <div style={{
                    width: 42, height: 42, borderRadius: "50%",
                    background: T.orange,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: T.fontTitle, fontSize: 20, fontWeight: 700, flexShrink: 0,
                  }}>
                    {(p.nome || p.email || "?")[0].toUpperCase()}
                  </div>
                  <div>
                    <p style={{ margin: "0 0 2px", fontFamily: T.fontTitle, fontSize: 17, fontWeight: 700 }}>
                      {p.nome || "Sem nome"}
                    </p>
                    <p style={{ margin: 0, fontSize: 12, color: T.muted }}>{p.email}</p>
                  </div>
                </div>

                {/* Badge status */}
                <span style={{
                  fontSize: 11, padding: "3px 10px", borderRadius: T.pill,
                  background: ativo ? "rgba(76,175,80,0.15)" : "rgba(255,255,255,0.06)",
                  color: ativo ? T.green : T.muted, flexShrink: 0,
                }}>
                  {ativo ? "Ativo" : "Inativo"}
                </span>
              </div>

              {/* Loja atribuída */}
              <div style={{
                margin: "12px 0 0", padding: "10px 14px",
                background: "rgba(255,255,255,0.04)",
                borderRadius: T.r12,
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <span style={{ fontSize: 13, color: loja ? T.text : T.muted }}>
                  {loja ? `📍 ${loja}` : "Sem loja atribuída"}
                </span>
                <button onClick={() => abrirAtribuir(p)} style={{
                  ...S.btnGhost, padding: "4px 12px", fontSize: 12, color: T.orange,
                  border: `1px solid rgba(224,104,32,0.3)`,
                }}>
                  {loja ? "Trocar" : "Atribuir"}
                </button>
              </div>

              {/* Ações */}
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button onClick={() => toggleAtivo(p)} style={{
                  ...S.btnGhost, flex: 1, padding: "8px",
                  fontSize: 12, color: ativo ? T.muted : T.green,
                }}>
                  {ativo ? "⏸ Desativar" : "▶ Ativar"}
                </button>
                <button onClick={() => deletar(p.id)} style={{
                  ...S.btnGhost, flex: 1, padding: "8px", fontSize: 12,
                  color: deletando === p.id ? "#ff6b6b" : T.muted,
                  border: deletando === p.id ? "1px solid rgba(244,67,54,0.4)" : undefined,
                }}>
                  {deletando === p.id ? "Confirmar exclusão?" : "🗑 Remover"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── BOTTOM SHEET ATRIBUIR LOJA ── */}
      {sheet && selecionado && (
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
            maxHeight: "80dvh", overflowY: "auto",
          }}>
            <div style={S.grabber} />
            <p style={{ fontFamily: T.fontTitle, fontSize: 22, fontWeight: 700, margin: "0 0 4px" }}>
              Atribuir Loja
            </p>
            <p style={{ fontSize: 13, color: T.muted, margin: "0 0 20px" }}>
              {selecionado.nome || selecionado.email}
            </p>

            {/* Opção: sem loja */}
            <button onClick={() => setLojaId("")} style={{
              ...S.btnGhost, width: "100%", padding: "14px 16px",
              marginBottom: 8, textAlign: "left", fontSize: 14,
              borderColor: lojaId === "" ? T.orange : undefined,
              color: lojaId === "" ? T.orange : T.muted,
            }}>
              🚫 Sem loja atribuída
            </button>

            {/* Lista de lojas */}
            {lojas.map((loja) => (
              <button key={loja.id} onClick={() => setLojaId(loja.id)} style={{
                ...S.btnGhost, width: "100%", padding: "14px 16px",
                marginBottom: 8, textAlign: "left", fontSize: 14,
                borderColor: lojaId === loja.id ? T.orange : undefined,
                color: lojaId === loja.id ? T.orange : T.text,
                borderLeft: lojaId === loja.id ? `3px solid ${T.orange}` : undefined,
              }}>
                <span style={{ fontWeight: lojaId === loja.id ? 700 : 400 }}>
                  {lojaId === loja.id ? "✓ " : ""}{loja.nome}
                </span>
                {loja.cidade && (
                  <span style={{ fontSize: 12, color: T.muted, marginLeft: 6 }}>
                    — {loja.cidade}
                  </span>
                )}
              </button>
            ))}

            <button onClick={salvarAtribuicao} disabled={salvando} style={{
              ...S.btnOrange, width: "100%", padding: 18,
              fontSize: 18, borderRadius: T.r16, marginTop: 8,
              opacity: salvando ? 0.5 : 1,
            }}>
              {salvando ? "Salvando..." : "💾 Confirmar"}
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